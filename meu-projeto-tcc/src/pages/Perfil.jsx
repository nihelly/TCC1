import { useState, useEffect, useRef } from 'react';
import { User, Heart, MessageCircle, Repeat2, ArrowLeft, GraduationCap, BookOpen, Layers, Camera, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { useLanguage } from '../hooks/useLanguage';
import { TradutorInput } from '../components/TradutorInput';

export default function Perfil() {
  const navigate = useNavigate();
  const { translate } = useLanguage();
  const { id } = useParams();
  const { usuario } = useAuth();
  
  const [perfil, setPerfil] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('posts');
  const [metrics, setMetrics] = useState({ posts: 0, seguidores: 0, seguindo: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [postsDoUsuario, setPostsDoUsuario] = useState([]);
  const [repostsDoUsuario, setRepostsDoUsuario] = useState([]);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  const [comentariosPostId, setComentariosPostId] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [novoComentario, setNovoComentario] = useState('');

  // Determina se é o próprio perfil do usuário logado
  const perfilId = id || usuario?.id;
  const isDono = usuario?.id === perfilId;

  const carregarPerfilEMetricas = async () => {
    if (!perfilId) return;
    try {
      // 1. Busca dados do perfil
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', perfilId)
        .single();

      if (error) throw error;
      setPerfil(data);

      // 2. Contar posts reais do usuário
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', perfilId)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Filtrar avisos do mural
      const postsReais = (postsData || []).filter(post => {
        if (!post.title) return true;
        return !post.title.startsWith('AVISO:');
      });

      // 3. Contar seguidores e seguindo
      const { count: seguidoresCount } = await supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('following_id', perfilId);

      const { count: seguindoCount } = await supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('follower_id', perfilId);

      setMetrics({
        posts: postsReais.length,
        seguidores: seguidoresCount || 0,
        seguindo: seguindoCount || 0
      });

      // 4. Se não for o dono do perfil, checar se o usuário logado segue esta conta
      if (usuario && usuario.id !== perfilId) {
        const { data: followRel } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', usuario.id)
          .eq('following_id', perfilId)
          .maybeSingle();

        setIsFollowing(!!followRel);
      }

      // 5. Buscar curtidas, reposts e comentários
      const { data: likesData } = await supabase
        .from('likes')
        .select('post_id, user_id');

      const { data: repostsData } = await supabase
        .from('reposts')
        .select('post_id, user_id');

      const { data: commentsData } = await supabase
        .from('comments')
        .select('post_id');

      // Mapear posts criados pelo perfil
      const mappedUserPosts = postsReais.map(post => {
        const postLikes = likesData ? likesData.filter(l => l.post_id === post.id) : [];
        const postReposts = repostsData ? repostsData.filter(r => r.post_id === post.id) : [];
        const postCommentsCount = commentsData ? commentsData.filter(c => c.post_id === post.id).length : 0;
        
        return {
          ...post,
          likesCount: postLikes.length,
          repostsCount: postReposts.length,
          commentsCount: postCommentsCount,
          usuarioCurtiu: usuario ? postLikes.some(l => l.user_id === usuario.id) : false,
          usuarioRepostou: usuario ? postReposts.some(r => r.user_id === usuario.id) : false
        };
      });
      setPostsDoUsuario(mappedUserPosts);

      // 6. Buscar reposts do usuário
      const { data: userReposts } = await supabase
        .from('reposts')
        .select('post_id')
        .eq('user_id', perfilId);

      if (userReposts && userReposts.length > 0) {
        const postIds = userReposts.map(r => r.post_id);
        const { data: repostedPosts } = await supabase
          .from('posts')
          .select('*')
          .in('id', postIds)
          .order('created_at', { ascending: false });

        const repostsReais = (repostedPosts || []).filter(post => {
          if (!post.title) return true;
          return !post.title.startsWith('AVISO:');
        });

        // Obter perfis dos autores originais
        const authorIds = [...new Set(repostsReais.map(p => p.user_id).filter(Boolean))];
        let profilesMap = {};
        if (authorIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, nome')
            .in('id', authorIds);
          if (profilesData) {
            profilesData.forEach(p => { profilesMap[p.id] = p; });
          }
        }

        const mappedReposts = repostsReais.map(post => {
          const postLikes = likesData ? likesData.filter(l => l.post_id === post.id) : [];
          const postRep = repostsData ? repostsData.filter(r => r.post_id === post.id) : [];
          const postCommentsCount = commentsData ? commentsData.filter(c => c.post_id === post.id).length : 0;
          
          const origAuthor = profilesMap[post.user_id];
          const authorHandle = origAuthor?.nome 
            ? `@${origAuthor.nome.toLowerCase().replace(/\s+/g, '')}` 
            : (post.author_handle || '@usuario');

          return {
            ...post,
            likesCount: postLikes.length,
            repostsCount: postRep.length,
            commentsCount: postCommentsCount,
            author_handle: authorHandle,
            usuarioCurtiu: usuario ? postLikes.some(l => l.user_id === usuario.id) : false,
            usuarioRepostou: usuario ? postRep.some(r => r.user_id === usuario.id) : false
          };
        });

        setRepostsDoUsuario(mappedReposts);
      } else {
        setRepostsDoUsuario([]);
      }

    } catch (err) {
      console.error('Erro ao carregar perfil:', err.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    setCarregando(true);
    carregarPerfilEMetricas();
  }, [perfilId, usuario]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formatosPermitidos = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!formatosPermitidos.includes(file.type)) {
      toast.error('Formato inválido. Selecione uma imagem JPG, JPEG, PNG ou WEBP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('O tamanho máximo permitido para o avatar é 5MB.');
      return;
    }

    try {
      setUploadingAvatar(true);
      
      const previewLocal = URL.createObjectURL(file);
      setPerfil(prev => ({ ...prev, avatar_url: previewLocal }));

      const fileExt = file.name.split('.').pop();
      const fileName = `${usuario.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const urlComBuster = `${publicUrl}?t=${Date.now()}`;

      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlComBuster })
        .eq('id', usuario.id);

      if (dbError) throw dbError;

      setPerfil(prev => ({ ...prev, avatar_url: urlComBuster }));
      toast.success('Foto de perfil atualizada com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao atualizar a foto de perfil.');
      carregarPerfilEMetricas();
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Carrega comentários do post selecionado
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

  // Adiciona comentário
  const handleAdicionarComentario = async (e) => {
    e.preventDefault();
    if (!novoComentario.trim() || !usuario || !comentariosPostId) return;

    const textoComentario = novoComentario.trim();
    setNovoComentario('');

    const { data: meuPerfil } = await supabase
      .from('profiles')
      .select('nome, avatar_url')
      .eq('id', usuario.id)
      .single();

    const autorHandle = meuPerfil?.nome 
      ? `@${meuPerfil.nome.toLowerCase().replace(/\s+/g, '')}` 
      : (usuario.email ? `@${usuario.email.split('@')[0]}` : '@usuario');

    const comentarioOtimista = {
      id: Date.now(),
      user_id: usuario.id,
      autor: autorHandle,
      autorNome: meuPerfil?.nome || 'Você',
      avatarUrl: meuPerfil?.avatar_url || null,
      conteudo: textoComentario,
      created_at: new Date().toISOString()
    };

    setComentarios(prev => [...prev, comentarioOtimista]);

    setPostsDoUsuario(prevPosts => prevPosts.map(p => {
      if (p.id === comentariosPostId) {
        return { ...p, commentsCount: (p.commentsCount || 0) + 1 };
      }
      return p;
    }));
    
    setRepostsDoUsuario(prevReposts => prevReposts.map(p => {
      if (p.id === comentariosPostId) {
        return { ...p, commentsCount: (p.commentsCount || 0) + 1 };
      }
      return p;
    }));

    try {
      const { data: insertData, error } = await supabase
        .from('comments')
        .insert({
          post_id: comentariosPostId,
          content: textoComentario,
          user_id: usuario.id,
        })
        .select()
        .single();

      if (error) throw error;

      if (insertData) {
        setComentarios(prev => prev.map(c => c.id === comentarioOtimista.id ? { ...c, id: insertData.id } : c));
      }

      let postOriginal = postsDoUsuario.find(p => p.id === comentariosPostId);
      if (!postOriginal) {
        postOriginal = repostsDoUsuario.find(p => p.id === comentariosPostId);
      }
      if (postOriginal && postOriginal.user_id && postOriginal.user_id !== usuario.id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: postOriginal.user_id,
            actor_id: usuario.id,
            actor_handle: autorHandle,
            content: `comentou em sua publicação: "${textoComentario.substring(0, 30)}${textoComentario.length > 30 ? '...' : ''}"`,
            type: 'comment',
            created_at: new Date().toISOString()
          });
      }
    } catch (err) {
      console.error('Erro ao adicionar comentário:', err);
      toast.error('Erro ao publicar comentário.');
      setComentarios(prev => prev.filter(c => c.id !== comentarioOtimista.id));
      setPostsDoUsuario(prevPosts => prevPosts.map(p => {
        if (p.id === comentariosPostId) {
          return { ...p, commentsCount: Math.max(0, (p.commentsCount || 1) - 1) };
        }
        return p;
      }));
      setRepostsDoUsuario(prevReposts => prevReposts.map(p => {
        if (p.id === comentariosPostId) {
          return { ...p, commentsCount: Math.max(0, (p.commentsCount || 1) - 1) };
        }
        return p;
      }));
    }
  };

  // Lógica para Curtir dentro do Perfil (Sincronizado entre as abas)
  const handleLike = async (postId) => {
    if (!usuario) return;

    let postOriginal = null;
    let jaCurtido = false;

    const postIndex = postsDoUsuario.findIndex(p => p.id === postId);
    if (postIndex !== -1) {
      postOriginal = postsDoUsuario[postIndex];
      jaCurtido = postOriginal.usuarioCurtiu;
    } else {
      const repostIndex = repostsDoUsuario.findIndex(p => p.id === postId);
      if (repostIndex !== -1) {
        postOriginal = repostsDoUsuario[repostIndex];
        jaCurtido = postOriginal.usuarioCurtiu;
      }
    }

    if (!postOriginal) return;

    // Atualiza otimista ambas as abas se o post existir em qualquer uma delas
    setPostsDoUsuario(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          usuarioCurtiu: !jaCurtido,
          likesCount: jaCurtido ? Math.max(0, p.likesCount - 1) : p.likesCount + 1
        };
      }
      return p;
    }));

    setRepostsDoUsuario(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          usuarioCurtiu: !jaCurtido,
          likesCount: jaCurtido ? Math.max(0, p.likesCount - 1) : p.likesCount + 1
        };
      }
      return p;
    }));

    try {
      if (jaCurtido) {
        await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', usuario.id);
      } else {
        await supabase.from('likes').insert({ post_id: postId, user_id: usuario.id });
      }
    } catch (err) {
      console.error(err);
      // Reverter
      setPostsDoUsuario(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            usuarioCurtiu: jaCurtido,
            likesCount: jaCurtido ? p.likesCount : Math.max(0, p.likesCount - 1)
          };
        }
        return p;
      }));
      setRepostsDoUsuario(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            usuarioCurtiu: jaCurtido,
            likesCount: jaCurtido ? p.likesCount : Math.max(0, p.likesCount - 1)
          };
        }
        return p;
      }));
    }
  };

  // Lógica para Repostar dentro do Perfil (Sincronizado entre as abas)
  const handleRepost = async (postId) => {
    if (!usuario) return;

    let postOriginal = null;
    let jaRepostado = false;

    const postIndex = postsDoUsuario.findIndex(p => p.id === postId);
    if (postIndex !== -1) {
      postOriginal = postsDoUsuario[postIndex];
      jaRepostado = postOriginal.usuarioRepostou;
    } else {
      const repostIndex = repostsDoUsuario.findIndex(p => p.id === postId);
      if (repostIndex !== -1) {
        postOriginal = repostsDoUsuario[repostIndex];
        jaRepostado = postOriginal.usuarioRepostou;
      }
    }

    if (!postOriginal) return;

    // Se o dono desfaz o repost na própria página dele, removemos da lista de reposts
    const removerDaLista = jaRepostado && isDono;

    if (removerDaLista) {
      setRepostsDoUsuario(prev => prev.filter(p => p.id !== postId));
      setPostsDoUsuario(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            usuarioRepostou: false,
            repostsCount: Math.max(0, p.repostsCount - 1)
          };
        }
        return p;
      }));
    } else {
      setPostsDoUsuario(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            usuarioRepostou: !jaRepostado,
            repostsCount: jaRepostado ? Math.max(0, p.repostsCount - 1) : p.repostsCount + 1
          };
        }
        return p;
      }));

      setRepostsDoUsuario(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            usuarioRepostou: !jaRepostado,
            repostsCount: jaRepostado ? Math.max(0, p.repostsCount - 1) : p.repostsCount + 1
          };
        }
        return p;
      }));
    }

    try {
      if (jaRepostado) {
        await supabase.from('reposts').delete().eq('post_id', postId).eq('user_id', usuario.id);
      } else {
        await supabase.from('reposts').insert({ post_id: postId, user_id: usuario.id });
        
        if (postOriginal.user_id && postOriginal.user_id !== usuario.id) {
          const { data: meuPerfil } = await supabase
            .from('profiles')
            .select('nome')
            .eq('id', usuario.id)
            .single();
            
          const autorHandle = meuPerfil?.nome 
            ? `@${meuPerfil.nome.toLowerCase().replace(/\s+/g, '')}` 
            : `@${usuario.email.split('@')[0]}`;

          await supabase
            .from('notifications')
            .insert({
              user_id: postOriginal.user_id,
              actor_id: usuario.id,
              actor_handle: autorHandle,
              content: `republicou sua publicação: "${postOriginal.title}"`,
              type: 'repost',
              created_at: new Date().toISOString()
            });
        }
      }
    } catch (err) {
      console.error('Erro ao repostar:', err);
      carregarPerfilEMetricas();
    }
  };

  const toggleFollow = async () => {
    if (!usuario || isDono) return;

    const nextFollowing = !isFollowing;
    setIsFollowing(nextFollowing);
    setMetrics(prev => ({
      ...prev,
      seguidores: nextFollowing ? prev.seguidores + 1 : Math.max(0, prev.seguidores - 1)
    }));

    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', usuario.id)
          .eq('following_id', perfilId);
      } else {
        await supabase
          .from('follows')
          .insert({ follower_id: usuario.id, following_id: perfilId });

        const { data: meuPerfil } = await supabase
          .from('profiles')
          .select('nome')
          .eq('id', usuario.id)
          .single();
          
        const autorHandle = meuPerfil?.nome 
          ? `@${meuPerfil.nome.toLowerCase().replace(/\s+/g, '')}` 
          : `@${usuario.email.split('@')[0]}`;

        await supabase
          .from('notifications')
          .insert({
            user_id: perfilId,
            actor_id: usuario.id,
            actor_handle: autorHandle,
            content: `começou a seguir você.`,
            type: 'follow',
            created_at: new Date().toISOString()
          });
      }
    } catch (err) {
      console.error('Erro ao seguir/desseguir:', err);
      setIsFollowing(isFollowing);
      setMetrics(prev => ({
        ...prev,
        seguidores: isFollowing ? prev.seguidores + 1 : Math.max(0, prev.seguidores - 1)
      }));
    }
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <User size={40} className="text-gray-300" />
        <p className="text-[13px] text-gray-400">{translate('profileNotFound')}</p>
        <button onClick={() => navigate(-1)} className="text-[12px] text-blue-500 hover:underline cursor-pointer">{translate('back')}</button>
      </div>
    );
  }

  const userHandleName = perfil?.nome?.toLowerCase().replace(/\s+/g, '') || 'usuario';

  return (
    <div className="w-full max-w-[620px] mx-auto md:pt-2">
      
      {/* TOP BAR — só aparece se NÃO for o dono (visitante) */}
      {!isDono && (
        <div className="flex items-center gap-2 px-5 py-3.5 sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-gray-50/50">
          <button onClick={() => navigate(-1)} className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-50 rounded-lg transition-all cursor-pointer">
            <ArrowLeft size={16} />
          </button>
          <span className="text-[15px] font-bold text-gray-950 tracking-tight">
            {perfil?.nome || translate('profileTitle')}
          </span>
        </div>
      )}

      {/* BANNER */}
      <div className="relative h-36 w-full rounded-b-3xl overflow-hidden">
        {perfil?.banner_url ? (
          <img src={perfil.banner_url} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[#e6f4ff] via-[#f0f3ff] to-[#f6f0ff]">
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/40 rounded-full blur-2xl animate-pulse" />
            <div className="absolute -bottom-8 left-16 w-24 h-24 bg-white/30 rounded-full blur-xl" />
            <div className="absolute top-6 left-1/3 w-16 h-16 bg-[#e8eaff]/30 rounded-full blur-md" />
          </div>
        )}
      </div>

      {/* HEADER: AVATAR + MÉTRICAS */}
      <div className="px-5 pb-5 space-y-4 relative">
        
        {/* AVATAR OVERLAPPING BANNER */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 -mt-10 md:-mt-12 relative z-10">
          <div 
            className={`w-20 h-20 md:w-24 md:h-24 bg-white rounded-full flex-shrink-0 overflow-hidden border-4 border-white shadow-md mx-auto sm:mx-0 relative ${isDono ? 'cursor-pointer group hover:brightness-95 transition-all' : ''}`}
            onClick={isDono ? () => avatarInputRef.current?.click() : undefined}
          >
            {uploadingAvatar ? (
              <div className="w-full h-full bg-black/40 flex items-center justify-center text-white">
                <Loader2 className="animate-spin" size={24} />
              </div>
            ) : perfil?.avatar_url ? (
              <img src={perfil.avatar_url} alt={perfil.nome} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300">
                <User size={36} />
              </div>
            )}
            
            {isDono && !uploadingAvatar && (
              <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Camera size={18} className="mb-0.5" />
                <span className="text-[8px] font-bold uppercase tracking-wider">Alterar</span>
              </div>
            )}
          </div>

          {isDono && (
            <input 
              ref={avatarInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
          )}

          {/* CONTADORES */}
          <div className="flex-1 flex justify-around text-center pb-2 pl-0 sm:pl-4">
            <div className="flex flex-col">
              <span className="text-[15px] font-bold text-gray-950">{metrics?.posts || 0}</span>
              <span className="text-[11px] text-gray-400 font-light lowercase">{translate('postsLabel')}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-bold text-gray-950">{metrics?.seguidores || 0}</span>
              <span className="text-[11px] text-gray-400 font-light lowercase">{translate('followers')}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-bold text-gray-950">{metrics?.seguindo || 0}</span>
              <span className="text-[11px] text-gray-400 font-light lowercase">{translate('following')}</span>
            </div>
          </div>
        </div>

        {/* DADOS DE IDENTIFICAÇÃO */}
        <div className="space-y-1.5">
          {/* Nome real */}
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[16px] font-bold text-gray-950">{perfil?.nome}</h2>
            
            {/* Badge acadêmico */}
            {perfil?.papel === 'professor' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/50 uppercase tracking-wider">
                {translate('teacher')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">
                {translate('student')}
              </span>
            )}

            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-50 text-gray-500 border border-gray-100">
              {translate('registration')}: {perfil?.matricula || '---'}
            </span>
          </div>

          {/* Handle (@) embaixo do nome */}
          <p className="text-[13px] text-gray-400 font-medium">@{userHandleName}</p>

          {/* Bio */}
          <p className="text-gray-600 font-light leading-relaxed whitespace-pre-line text-[13px] pt-1">
            {perfil?.bio || translate('noBio')}
          </p>
        </div>

        {/* BOTÕES DE AÇÃO */}
        <div className="pt-2">
          {isDono ? (
            <button 
              onClick={() => navigate('/perfil/editar')} 
              className="w-full bg-gray-50 hover:bg-gray-100 text-gray-950 border border-gray-100 text-[12.5px] font-semibold py-2.5 rounded-xl transition-all cursor-pointer text-center"
            >
              {translate('editProfile')}
            </button>
          ) : (
            <div className="flex gap-3">
              <button 
                onClick={toggleFollow} 
                className={`flex-1 text-[12.5px] font-bold py-2.5 rounded-xl text-center transition-all cursor-pointer ${isFollowing ? 'bg-gray-50 border border-gray-100 text-gray-800 hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-900'}`}
              >
                {isFollowing ? translate('unfollow') : translate('follow')}
              </button>
              <button 
                onClick={() => navigate('/mensagens', { state: { destinatarioId: perfil.id } })} 
                className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-100 text-gray-950 text-[12.5px] font-semibold py-2.5 rounded-xl text-center cursor-pointer transition-all"
              >
                {translate('message')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SELETOR DE ABAS */}
      <div className="border-t border-gray-100 flex justify-center mb-6">
        <div className="flex gap-16 -mt-[1px]">
          <button
            onClick={() => setAbaAtiva('posts')}
            className={`py-3 px-8 text-[11px] font-bold tracking-wider transition-all border-t-2 uppercase cursor-pointer
              ${abaAtiva === 'posts' 
                ? 'border-black text-black' 
                : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
          >
            {translate('postsTab')}
          </button>

          <button
            onClick={() => setAbaAtiva('reposts')}
            className={`py-3 px-8 text-[11px] font-bold tracking-wider transition-all border-t-2 uppercase cursor-pointer
              ${abaAtiva === 'reposts' 
                ? 'border-black text-black' 
                : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
          >
            {translate('repostsTab')}
          </button>
        </div>
      </div>

      {/* CONTAINER DE CONTEÚDO */}
      <div className="space-y-5 px-1">
        {abaAtiva === 'posts' ? (
          postsDoUsuario.length > 0 ? (
            postsDoUsuario.map(post => (
              <div key={post.id} className="bg-white border border-gray-100 rounded-[1.5rem] p-5 shadow-[0_1px_4px_rgba(0,0,0,0.01)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:-translate-y-0.5 transition-all duration-300 space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="text-[13.5px] font-bold text-gray-950 uppercase tracking-tight">{post.title}</h3>
                  <span className="text-[10px] text-gray-400">
                    {new Date(post.created_at).toLocaleDateString([], { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
                {post.image_url && (
                  <div className="w-full rounded-xl overflow-hidden border border-gray-100 max-h-56">
                    <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <p className="text-[12.5px] text-gray-600 font-light leading-relaxed">{post.content}</p>
                
                <div className="flex items-center gap-4 pt-2 border-t border-gray-50/50">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1.5 text-[11px] cursor-pointer transition-colors ${post.usuarioCurtiu ? 'text-red-500 font-semibold' : 'text-gray-400 hover:text-red-500'}`}
                  >
                    <Heart size={14} className={post.usuarioCurtiu ? 'fill-red-500 text-red-500' : ''} /> 
                    <span>{post.likesCount || 0}</span>
                  </button>
                  <button 
                    onClick={() => setComentariosPostId(post.id)}
                    className="flex items-center gap-1.5 text-gray-400 hover:text-black transition-colors text-[11px] cursor-pointer"
                  >
                    <MessageCircle size={14} /> 
                    <span>{post.commentsCount || 0}</span>
                  </button>
                  <button 
                    onClick={() => handleRepost(post.id)}
                    className={`flex items-center gap-1.5 text-[11px] cursor-pointer transition-colors ${post.usuarioRepostou ? 'text-green-500 font-semibold' : 'text-gray-400 hover:text-green-500'}`}
                  >
                    <Repeat2 size={14} /> 
                    <span>{post.repostsCount || 0}</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                <Layers size={20} />
              </div>
              <p className="text-[12px] text-gray-400 italic">{translate('noPosts')}</p>
            </div>
          )
        ) : (
          repostsDoUsuario.length > 0 ? (
            repostsDoUsuario.map(post => (
              <div key={post.id} className="bg-white border border-gray-100 rounded-[1.5rem] p-5 shadow-[0_1px_4px_rgba(0,0,0,0.01)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:-translate-y-0.5 transition-all duration-300 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider block mb-0.5">{translate('repostedBy')} {post.author_handle}</span>
                    <h3 className="text-[13.5px] font-bold text-gray-950 uppercase tracking-tight">{post.title}</h3>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {new Date(post.created_at).toLocaleDateString([], { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
                {post.image_url && (
                  <div className="w-full rounded-xl overflow-hidden border border-gray-100 max-h-56">
                    <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <p className="text-[12.5px] text-gray-600 font-light leading-relaxed">{post.content}</p>
                
                <div className="flex items-center gap-4 pt-2 border-t border-gray-50/50">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1.5 text-[11px] cursor-pointer transition-colors ${post.usuarioCurtiu ? 'text-red-500 font-semibold' : 'text-gray-400 hover:text-red-500'}`}
                  >
                    <Heart size={14} className={post.usuarioCurtiu ? 'fill-red-500 text-red-500' : ''} /> 
                    <span>{post.likesCount || 0}</span>
                  </button>
                  <button 
                    onClick={() => setComentariosPostId(post.id)}
                    className="flex items-center gap-1.5 text-gray-400 hover:text-black transition-colors text-[11px] cursor-pointer"
                  >
                    <MessageCircle size={14} /> 
                    <span>{post.commentsCount || 0}</span>
                  </button>
                  <button 
                    onClick={() => handleRepost(post.id)}
                    className={`flex items-center gap-1.5 text-[11px] cursor-pointer transition-colors ${post.usuarioRepostou ? 'text-green-500 font-semibold' : 'text-gray-400 hover:text-green-500'}`}
                  >
                    <Repeat2 size={14} /> 
                    <span>{post.repostsCount || 0}</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                <Repeat2 size={20} />
              </div>
              <p className="text-[12px] text-gray-400 italic">{translate('noReposts')}</p>
            </div>
          )
        )}
      </div>

      {/* PAINEL LATERAL DE COMENTÁRIOS */}
      {comentariosPostId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setComentariosPostId(null)} />
          
          <div className="relative w-full max-w-[420px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 z-50">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white flex-shrink-0">
              <h3 className="text-[14px] font-bold text-gray-950 tracking-wider uppercase">{translate('commentsTitle')}</h3>
              <button 
                onClick={() => setComentariosPostId(null)} 
                className="text-gray-400 hover:text-black transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                {translate('close')}
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
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
            <form onSubmit={handleAdicionarComentario} className="p-4 border-t border-gray-100 flex gap-3 items-center bg-[#fcfcfc] flex-shrink-0">
              <TradutorInput
                value={novoComentario}
                onChange={setNovoComentario}
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