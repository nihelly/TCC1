import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Repeat2, User, MoreHorizontal, Layers } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Anuncios } from '../components/Anuncios';
import { toast } from 'sonner';
import { useLanguage } from '../hooks/useLanguage';

export default function Feed() {
  const navigate = useNavigate();
  const { translate } = useLanguage();
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Estados de comentários
  const [comentariosPostId, setComentariosPostId] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [novoComentario, setNovoComentario] = useState('');

  // 1. Carrega o usuário logado e as postagens
  useEffect(() => {
    async function inicializarFeed() {
      try {
        setCarregando(true);
        
        // Obter usuário atual
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        // Obter posts (excluindo avisos com prefixo AVISO:)
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;

        let finalPosts = (postsData || []).filter(post => {
          if (!post.title) return true;
          return !post.title.startsWith('AVISO:');
        });

        // Obter curtidas do banco
        const { data: likesData } = await supabase
          .from('likes')
          .select('post_id, user_id');

        // Obter reposts do banco
        const { data: repostsData } = await supabase
          .from('reposts')
          .select('post_id, user_id');

        // Obter contagem de comentários da tabela comments
        const { data: commentsCountData } = await supabase
          .from('comments')
          .select('post_id');

        // Obter perfis reais dos autores
        const userIds = [...new Set(finalPosts.map(p => p.user_id).filter(Boolean))];
        let profilesMap = {};
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, nome, avatar_url')
            .in('id', userIds);
          
          if (profilesData) {
            profilesData.forEach(p => {
              profilesMap[p.id] = p;
            });
          }
        }

        // Mapear cada postagem com seus dados dinâmicos de interações
        const mappedPosts = finalPosts.map(post => {
          const postLikes = likesData ? likesData.filter(l => l.post_id === post.id) : [];
          const postReposts = repostsData ? repostsData.filter(r => r.post_id === post.id) : [];
          const postCommentsCount = commentsCountData ? commentsCountData.filter(c => c.post_id === post.id).length : 0;
          
          const liked = user ? postLikes.some(l => l.user_id === user.id) : false;
          const reposted = user ? postReposts.some(r => r.user_id === user.id) : false;

          const authorProfile = profilesMap[post.user_id];
          const authorName = authorProfile?.nome || 'Usuário AcadNet';
          const authorAvatar = authorProfile?.avatar_url || null;
          const authorHandle = authorProfile?.nome 
            ? `@${authorProfile.nome.toLowerCase().replace(/\s+/g, '')}` 
            : (post.author_handle || '@usuario');

          return {
            ...post,
            created_at: post.created_at || new Date().toISOString(),
            likesCount: postLikes.length,
            repostsCount: postReposts.length,
            commentsCount: postCommentsCount,
            usuarioCurtiu: liked,
            usuarioRepostou: reposted,
            authorName,
            authorAvatar,
            authorHandle
          };
        });

        setPosts(mappedPosts);
      } catch (err) {
        console.error('Erro ao carregar feed:', err.message);
      } finally {
        setCarregando(false);
      }
    }

    inicializarFeed();
  }, []);

  // 2. Lógica para Curtir / Descurtir
  const handleLike = async (postId) => {
    if (!currentUser) return;

    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;

    const post = posts[postIndex];
    const jaCurtido = post.usuarioCurtiu;

    // Atualização otimista da UI
    const novosPosts = [...posts];
    novosPosts[postIndex] = {
      ...post,
      usuarioCurtiu: !jaCurtido,
      likesCount: jaCurtido ? Math.max(0, post.likesCount - 1) : post.likesCount + 1
    };
    setPosts(novosPosts);

    try {
      if (jaCurtido) {
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUser.id);
      } else {
        await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: currentUser.id });

        // Enviar notificação para o autor do post original (se for outro usuário)
        if (post.user_id && post.user_id !== currentUser.id) {
          const { data: meuPerfil } = await supabase
            .from('profiles')
            .select('nome')
            .eq('id', currentUser.id)
            .single();
            
          const autorHandle = meuPerfil?.nome 
            ? `@${meuPerfil.nome.toLowerCase().replace(/\s+/g, '')}` 
            : `@${currentUser.email.split('@')[0]}`;

          await supabase
            .from('notifications')
            .insert({
              user_id: post.user_id,
              actor_id: currentUser.id,
              actor_handle: autorHandle,
              content: `curtiu sua publicação: "${post.title}"`,
              type: 'like',
              created_at: new Date().toISOString()
            });
        }
      }
    } catch (err) {
      console.error('Erro ao curtir:', err);
      // Reverte em caso de falha
      const revertidos = [...posts];
      revertidos[postIndex] = post;
      setPosts(revertidos);
    }
  };

  // 3. Lógica para Repostar / Desfazer Repost
  const handleRepost = async (postId) => {
    if (!currentUser) return;

    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;

    const post = posts[postIndex];
    const jaRepostado = post.usuarioRepostou;

    // Atualização otimista da UI
    const novosPosts = [...posts];
    novosPosts[postIndex] = {
      ...post,
      usuarioRepostou: !jaRepostado,
      repostsCount: jaRepostado ? Math.max(0, post.repostsCount - 1) : post.repostsCount + 1
    };
    setPosts(novosPosts);

    try {
      if (jaRepostado) {
        await supabase
          .from('reposts')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUser.id);
      } else {
        await supabase
          .from('reposts')
          .insert({ post_id: postId, user_id: currentUser.id });

        // Enviar notificação para o autor do post original (se for outro usuário)
        if (post.user_id && post.user_id !== currentUser.id) {
          const { data: meuPerfil } = await supabase
            .from('profiles')
            .select('nome')
            .eq('id', currentUser.id)
            .single();
            
          const autorHandle = meuPerfil?.nome 
            ? `@${meuPerfil.nome.toLowerCase().replace(/\s+/g, '')}` 
            : `@${currentUser.email.split('@')[0]}`;

          await supabase
            .from('notifications')
            .insert({
              user_id: post.user_id,
              actor_id: currentUser.id,
              actor_handle: autorHandle,
              content: `republicou sua publicação: "${post.title}"`,
              type: 'repost',
              created_at: new Date().toISOString()
            });
        }
      }
    } catch (err) {
      console.error('Erro ao repostar:', err);
      // Reverte em caso de falha
      const revertidos = [...posts];
      revertidos[postIndex] = post;
      setPosts(revertidos);
    }
  };

  // 4. Carrega comentários do post selecionado da tabela comments
  useEffect(() => {
    if (!comentariosPostId) {
      setComentarios([]);
      return;
    }

    async function carregarComentarios() {
      try {
        const { data, error } = await supabase
          .from('comments')
          .select('*')
          .eq('post_id', comentariosPostId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        // Obter perfis reais dos autores de cada comentário
        const userIds = [...new Set((data || []).map(c => c.user_id).filter(Boolean))];
        let profilesMap = {};
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, nome, avatar_url')
            .in('id', userIds);
          if (profilesData) {
            profilesData.forEach(p => {
              profilesMap[p.id] = p;
            });
          }
        }

        const comentariosFormatados = (data || []).map(c => {
          const p = profilesMap[c.user_id];
          return {
            id: c.id,
            user_id: c.user_id,
            autor: p?.nome ? `@${p.nome.toLowerCase().replace(/\s+/g, '')}` : '@usuario',
            autorNome: p?.nome || 'Usuário',
            avatarUrl: p?.avatar_url || null,
            conteudo: c.content,
            created_at: c.created_at
          };
        });

        setComentarios(comentariosFormatados);
      } catch (err) {
        console.error('Erro ao carregar comentários:', err);
        setComentarios([]);
      }
    }

    carregarComentarios();
  }, [comentariosPostId]);

  // 5. Adicionar comentário na tabela comments
  const handleAdicionarComentario = async (e) => {
    e.preventDefault();
    if (!novoComentario.trim() || !currentUser || !comentariosPostId) return;

    const textoComentario = novoComentario.trim();
    setNovoComentario('');

    // Obter informações do perfil atual
    const { data: meuPerfil } = await supabase
      .from('profiles')
      .select('nome, avatar_url')
      .eq('id', currentUser.id)
      .single();

    const autorHandle = meuPerfil?.nome 
      ? `@${meuPerfil.nome.toLowerCase().replace(/\s+/g, '')}` 
      : (currentUser.email ? `@${currentUser.email.split('@')[0]}` : '@usuario');

    const comentarioOtimista = {
      id: Date.now(),
      user_id: currentUser.id,
      autor: autorHandle,
      autorNome: meuPerfil?.nome || 'Você',
      avatarUrl: meuPerfil?.avatar_url || null,
      conteudo: textoComentario,
      created_at: new Date().toISOString()
    };

    // UI Otimista
    setComentarios(prev => [...prev, comentarioOtimista]);

    // Atualiza contagem local de comentários no post
    setPosts(prevPosts => prevPosts.map(p => {
      if (p.id === comentariosPostId) {
        return { ...p, commentsCount: (p.commentsCount || 0) + 1 };
      }
      return p;
    }));

    try {
      // Inserir comentário na tabela comments
      const { data: insertData, error } = await supabase
        .from('comments')
        .insert({
          post_id: comentariosPostId,
          content: textoComentario,
          user_id: currentUser.id,
        })
        .select()
        .single();

      if (error) throw error;

      if (insertData) {
        setComentarios(prev => prev.map(c => c.id === comentarioOtimista.id ? { ...c, id: insertData.id } : c));
      }

      // Disparar notificação para o autor do post original (se não for o próprio usuário logado)
      const postOriginal = posts.find(p => p.id === comentariosPostId);
      if (postOriginal && postOriginal.user_id && postOriginal.user_id !== currentUser.id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: postOriginal.user_id,
            actor_id: currentUser.id,
            actor_handle: autorHandle,
            content: `comentou em sua publicação: "${textoComentario.substring(0, 30)}${textoComentario.length > 30 ? '...' : ''}"`,
            type: 'comment',
            created_at: new Date().toISOString()
          });
      }
    } catch (err) {
      console.error('Erro ao adicionar comentário:', err);
      toast.error('Erro ao publicar comentário.');
      // Reverter em caso de erro
      setComentarios(prev => prev.filter(c => c.id !== comentarioOtimista.id));
      setPosts(prevPosts => prevPosts.map(p => {
        if (p.id === comentariosPostId) {
          return { ...p, commentsCount: Math.max(0, (p.commentsCount || 1) - 1) };
        }
        return p;
      }));
    }
  };

  return (
    <div className="w-full flex gap-8">
      
      {/* ═══════ COLUNA PRINCIPAL — POSTS ═══════ */}
      <div className="flex-1 max-w-[650px] space-y-4">

        {/* Estado de carregamento */}
        {carregando ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
              <Layers size={24} />
            </div>
            <p className="text-[13px] text-gray-400 font-light">{translate('noPosts')}</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white border border-gray-100 rounded-[1.5rem] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.02)] animate-in fade-in duration-200">
              
              {/* Header do Post */}
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <div 
                  onClick={() => post.user_id && navigate(`/perfil/${post.user_id}`)}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-8 h-8 bg-gray-50 rounded-full border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-inner group-hover:border-black transition-colors">
                    {post.authorAvatar ? (
                      <img src={post.authorAvatar} alt={post.authorName} className="w-full h-full object-cover" />
                    ) : (
                      <User size={16} className="text-gray-300" />
                    )}
                  </div>
                  <span className="text-[13px] text-gray-500 font-medium group-hover:text-black group-hover:underline transition-all">
                    {post.authorHandle || '@usuario'}
                  </span>
                </div>
                <button className="text-gray-300 hover:text-gray-500 transition-colors cursor-pointer p-1">
                  <MoreHorizontal size={18} />
                </button>
              </div>

              {/* Título */}
              <div className="px-5 pb-2">
                <h2 className="text-[14px] font-bold text-gray-900 uppercase tracking-tight">
                  {post.title || 'TÍTULO'}
                </h2>
              </div>

              {/* Imagem do post */}
              {post.image_url && (
                <div className="mx-5 mb-3">
                  <div className="w-full rounded-xl overflow-hidden border border-gray-100">
                    <img src={post.image_url} alt="Imagem do post" className="w-full object-cover" />
                  </div>
                </div>
              )}

              {/* Conteúdo textual */}
              {post.content && (
                <div className="px-5 pb-2">
                  <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>
                </div>
              )}

              {/* Footer: Interações */}
              <div className="flex items-center justify-between px-5 pb-4 pt-1">
                <div className="flex items-center gap-4">
                  
                  {/* Curtida (Heart) */}
                  <button 
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1.5 text-[12px] cursor-pointer transition-colors ${post.usuarioCurtiu ? 'text-red-500 font-medium' : 'text-gray-400 hover:text-red-500'}`}
                  >
                    <Heart size={15} strokeWidth={post.usuarioCurtiu ? 0 : 1.5} className={post.usuarioCurtiu ? 'fill-red-500 text-red-500' : ''} /> 
                    <span>{post.likesCount || 0}</span>
                  </button>
                  
                  {/* Comentários (MessageCircle) */}
                  <button 
                    onClick={() => setComentariosPostId(post.id)}
                    className="flex items-center gap-1.5 text-gray-400 text-[12px] hover:text-blue-500 cursor-pointer transition-colors"
                  >
                    <MessageCircle size={15} strokeWidth={1.5} /> 
                    <span>{post.commentsCount || 0}</span>
                  </button>
                  
                  {/* Repostar (Repeat2) */}
                  <button 
                    onClick={() => handleRepost(post.id)}
                    className={`flex items-center gap-1.5 text-[12px] cursor-pointer transition-colors ${post.usuarioRepostou ? 'text-green-500 font-medium' : 'text-gray-400 hover:text-green-500'}`}
                  >
                    <Repeat2 size={15} strokeWidth={1.5} className={post.usuarioRepostou ? 'text-green-500 font-bold' : ''} /> 
                    <span>{post.repostsCount || 0}</span>
                  </button>
                  
                </div>

                <span className="text-[11px] text-gray-300 italic">
                  {new Date(post.created_at).toLocaleDateString([], { day: '2-digit', month: '2-digit' })}
                </span>
              </div>

            </div>
          ))
        )}
      </div>

      {/* ═══════ COLUNA LATERAL DIREITA — PROFESSORES + ANÚNCIOS ═══════ */}
      <div className="hidden lg:block w-[280px] flex-shrink-0">
        <div className="sticky top-[72px] space-y-4">
          <Anuncios />
        </div>
      </div>

      {/* PAINEL LATERAL DE COMENTÁRIOS (ESTILO INSTAGRAM) */}
      {comentariosPostId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setComentariosPostId(null)} />
          
          <div className="relative w-full max-w-[420px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 z-50">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-[14px] font-bold text-gray-950 tracking-wider uppercase">{translate('commentsTitle')}</h3>
              <button 
                onClick={() => setComentariosPostId(null)} 
                className="text-gray-400 hover:text-black transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                {translate('close')}
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {comentarios.map(c => (
                <div key={c.id} className="flex gap-3 text-[13px] leading-relaxed border-b border-gray-50 pb-3">
                  <div 
                    onClick={() => {
                      if (c.user_id) {
                        setComentariosPostId(null);
                        navigate(`/perfil/${c.user_id}`);
                      }
                    }}
                    className="w-8 h-8 bg-gray-50 rounded-full border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-inner cursor-pointer hover:border-black transition-colors"
                  >
                    {c.avatarUrl ? (
                      <img src={c.avatarUrl} alt={c.autorNome} className="w-full h-full object-cover" />
                    ) : (
                      <User size={14} className="text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span 
                        onClick={() => {
                          if (c.user_id) {
                            setComentariosPostId(null);
                            navigate(`/perfil/${c.user_id}`);
                          }
                        }}
                        className="font-bold text-gray-950 cursor-pointer hover:underline"
                      >
                        {c.autor}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(c.created_at).toLocaleDateString([], { day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-gray-600 font-light">{c.conteudo}</p>
                  </div>
                </div>
              ))}
              {comentarios.length === 0 && (
                <div className="text-center py-20 text-gray-400 text-xs italic">
                  {translate('noComments')}
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleAdicionarComentario} className="p-4 border-t border-gray-100 flex gap-3 items-center bg-[#fcfcfc]">
              <input
                type="text"
                value={novoComentario}
                onChange={(e) => setNovoComentario(e.target.value)}
                placeholder={translate('commentPlaceholder')}
                className="flex-1 bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-[12.5px] outline-none focus:border-black transition-colors"
              />
              <button type="submit" className="px-4 py-2.5 bg-black hover:bg-gray-900 text-white rounded-xl text-[12px] font-bold cursor-pointer">
                {translate('commentBtn')}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
