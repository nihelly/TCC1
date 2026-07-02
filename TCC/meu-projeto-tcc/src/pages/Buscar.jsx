import { useState, useEffect, useRef } from 'react';
import { Search, Megaphone, Hash, Clock, X, User, ChevronRight, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../hooks/useLanguage';

export default function Buscar() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [buscaAtivaTab, setBuscaAtivaTab] = useState('tudo'); // 'tudo' | 'pessoas' | 'posts' | 'anuncios'
  const [anuncioSelecionado, setAnuncioSelecionado] = useState(null);
  
  // Estados de dados do Supabase
  const [anuncios, setAnuncios] = useState([]);
  const [hashtagsMaisUsadas, setHashtagsMaisUsadas] = useState([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
  const [postsFiltrados, setPostsFiltrados] = useState([]);
  const [anunciosFiltrados, setAnunciosFiltrados] = useState([]);
  const [historico, setHistorico] = useState([]);
  
  const searchInputRef = useRef(null);

  // Dicionário de tradução local de alta fidelidade
  const getDict = (langCode) => {
    switch (langCode) {
      case 'Português (BR)':
        return {
          placeholder: 'Buscar posts, pessoas, tags...',
          recentes: 'Buscas Recentes',
          limpar: 'Limpar tudo',
          sugeridos: 'Sugestões de Busca',
          tudo: 'Tudo',
          pessoas: 'Pessoas',
          posts: 'Posts',
          anuncios: 'Avisos',
          avisosDocentes: 'ANÚNCIOS DOS PROFESSORES',
          hashtags: '# MAIS UTILIZADAS',
          naoEncontrado: 'Nenhum resultado correspondente.',
          anuncioModalTitulo: 'Detalhes do Aviso',
          fechar: 'Fechar',
          dicaBusca: 'Pesquise por @nome, palavras-chave ou hashtags (ex: #tcc)',
          searchTitle: 'BUSCAR',
          resultados: 'Resultados da busca'
        };
      case 'Español':
        return {
          placeholder: 'Buscar posts, personas, etiquetas...',
          recentes: 'Búsquedas Recientes',
          limpar: 'Limpiar todo',
          sugeridos: 'Sugerencias',
          tudo: 'Todo',
          pessoas: 'Personas',
          posts: 'Posts',
          anuncios: 'Anuncios',
          avisosDocentes: 'ANUNCIOS DE PROFESORES',
          hashtags: '# MÁS UTILIZADAS',
          naoEncontrado: 'No se encontraron resultados.',
          anuncioModalTitulo: 'Detalles del Anuncio',
          fechar: 'Cerrar',
          dicaBusca: 'Busque por @nombre, palabras clave o hashtags (ej: #tcc)',
          searchTitle: 'BUSCAR',
          resultados: 'Resultados de búsqueda'
        };
      case 'Français':
        return {
          placeholder: 'Rechercher des posts, personnes, tags...',
          recentes: 'Recherches Récentes',
          limpar: 'Tout effacer',
          sugeridos: 'Suggestions',
          tudo: 'Tout',
          pessoas: 'Personnes',
          posts: 'Posts',
          anuncios: 'Annonces',
          avisosDocentes: 'ANNONCES DES ENSEIGNANTS',
          hashtags: '# LES PLUS UTILISÉS',
          naoEncontrado: 'Aucun résultat trouvé.',
          anuncioModalTitulo: 'Détails de l\'Annonce',
          fechar: 'Fermer',
          dicaBusca: 'Recherchez par @nom, mots-clés ou hashtags (ex: #tcc)',
          searchTitle: 'RECHERCHE',
          resultados: 'Résultats de recherche'
        };
      case 'Deutsch':
        return {
          placeholder: 'Beiträge, Personen, Tags suchen...',
          recentes: 'Verlauf',
          limpar: 'Alles löschen',
          sugeridos: 'Vorschläge',
          tudo: 'Alle',
          pessoas: 'Personen',
          posts: 'Beiträge',
          anuncios: 'Ankündigungen',
          avisosDocentes: 'ANKÜNDIGUNGEN DER LEHRER',
          hashtags: '# BELIEBTESTE',
          naoEncontrado: 'Keine Ergebnisse gefunden.',
          anuncioModalTitulo: 'Details der Ankündigung',
          fechar: 'Schließen',
          dicaBusca: 'Suchen Sie nach @name, Begriffen oder Hashtags (z.B. #tcc)',
          searchTitle: 'SUCHE',
          resultados: 'Suchergebnisse'
        };
      case 'Italiano':
        return {
          placeholder: 'Cerca post, persone, tag...',
          recentes: 'Ricerche Recenti',
          limpar: 'Cancella tutto',
          sugeridos: 'Suggerimenti',
          tudo: 'Tutto',
          pessoas: 'Persone',
          posts: 'Post',
          anuncios: 'Avvisi',
          avisosDocentes: 'ANNUNCI DEI DOCENTI',
          hashtags: '# PIÙ UTILIZZATI',
          naoEncontrado: 'Nessun risultato corrispondente.',
          anuncioModalTitulo: 'Dettagli dell\'Avviso',
          fechar: 'Chiudi',
          dicaBusca: 'Cerca per @nome, parole o hashtag (es: #tcc)',
          searchTitle: 'CERCA',
          resultados: 'Risultati di ricerca'
        };
      case '日本語':
        return {
          placeholder: '投稿、人物、タグを検索...',
          recentes: '最近の検索履歴',
          limpar: 'すべてクリア',
          sugeridos: 'おすすめ',
          tudo: 'すべて',
          pessoas: '人物',
          posts: '投稿',
          anuncios: 'お知らせ',
          avisosDocentes: '教員からのお知らせ',
          hashtags: '# よく使われるハッシュタグ',
          naoEncontrado: '一致する結果が見つかりません。',
          anuncioModalTitulo: 'お知らせの詳細',
          fechar: '閉じる',
          dicaBusca: '@名前、キーワード、またはハッシュタグ（例：#tcc）で検索',
          searchTitle: '検索',
          resultados: '検索結果'
        };
      case '中文':
        return {
          placeholder: '搜索帖子、用户、标签...',
          recentes: '最近搜索',
          limpar: '清除全部',
          sugeridos: '推荐',
          tudo: '全部',
          pessoas: '用户',
          posts: '帖子',
          anuncios: '通知',
          avisosDocentes: '教师公告',
          hashtags: '# 热门标签',
          naoEncontrado: '未找到匹配结果。',
          anuncioModalTitulo: '公告详情',
          fechar: '关闭',
          dicaBusca: '搜索 @姓名、关键词或标签（例如：#tcc）',
          searchTitle: '搜索',
          resultados: '搜索结果'
        };
      case 'Русский':
        return {
          placeholder: 'Поиск постов, людей, тегов...',
          recentes: 'История поиска',
          limpar: 'Очистить всё',
          sugeridos: 'Рекомендации',
          tudo: 'Все',
          pessoas: 'Люди',
          posts: 'Посты',
          anuncios: 'Объявления',
          avisosDocentes: 'ОБЪЯВЛЕНИЯ ПРЕПОДАВАТЕЛЕЙ',
          hashtags: '# ПОПУЛЯРНЫЕ ТЕГИ',
          naoEncontrado: 'Совпадений не найдено.',
          anuncioModalTitulo: 'Детали объявления',
          fechar: 'Закрыть',
          dicaBusca: 'Ищите по @имени, ключевым словам или тегам (например: #tcc)',
          searchTitle: 'ПОИСК',
          resultados: 'Результаты поиска'
        };
      case 'العربية':
        return {
          placeholder: 'ابحث عن منشورات، أشخاص، وسوم...',
          recentes: 'عمليات البحث الأخيرة',
          limpar: 'مسح الكل',
          sugeridos: 'مقترحات',
          tudo: 'الكل',
          pessoas: 'أشخاص',
          posts: 'منشورات',
          anuncios: 'إعلانات',
          avisosDocentes: 'إعلانات المعلمين',
          hashtags: '# الوسوم الأكثر استخداماً',
          naoEncontrado: 'لم يتم العثور على نتائج مطابقة.',
          anuncioModalTitulo: 'تفاصيل الإعلان',
          fechar: 'إغلاق',
          dicaBusca: 'ابحث عن @اسم، كلمات رئيسية أو وسوم (مثل: #tcc)',
          searchTitle: 'بحث',
          resultados: 'نتائج البحث'
        };
      case 'हिन्दी':
        return {
          placeholder: 'पोस्ट, लोग, टैग खोजें...',
          recentes: 'हालिया खोजें',
          limpar: 'सभी साफ़ करें',
          sugeridos: 'सुझाव',
          tudo: 'सभी',
          pessoas: 'लोग',
          posts: 'पोस्ट',
          anuncios: 'घोषणाएँ',
          avisosDocentes: 'शिक्षकों की घोषणाएँ',
          hashtags: '# लोकप्रिय हैशटैग',
          naoEncontrado: 'कोई परिणाम नहीं मिला।',
          anuncioModalTitulo: 'घोषणा का विवरण',
          fechar: 'बंद करें',
          dicaBusca: '@नाम, कीवर्ड या हैशटैग खोजें (उदा: #tcc)',
          searchTitle: 'खोजें',
          resultados: 'खोज परिणाम'
        };
      case '한국어':
        return {
          placeholder: '게시물, 사람, 태그 검색...',
          recentes: '최근 검색어',
          limpar: '모두 지우기',
          sugeridos: '추천',
          tudo: '전체',
          pessoas: '사람',
          posts: '게시물',
          anuncios: '공지사항',
          avisosDocentes: '교수 공지사항',
          hashtags: '# 인기 해시태그',
          naoEncontrado: '일치하는 결과가 없습니다.',
          anuncioModalTitulo: '공지사항 상세 정보',
          fechar: '닫기',
          dicaBusca: '@이름, 키워드 또는 해시태그(예: #tcc)로 검색',
          searchTitle: '검색',
          resultados: '검색 결과'
        };
      default: // English fallback
        return {
          placeholder: 'Search posts, people, tags...',
          recentes: 'Recent Searches',
          limpar: 'Clear all',
          sugeridos: 'Suggestions',
          tudo: 'All',
          pessoas: 'People',
          posts: 'Posts',
          anuncios: 'Announcements',
          avisosDocentes: 'TEACHER ANNOUNCEMENTS',
          hashtags: '# POPULAR HASHTAGS',
          naoEncontrado: 'No matching results found.',
          anuncioModalTitulo: 'Announcement Details',
          fechar: 'Close',
          dicaBusca: 'Search for @name, keywords or hashtags (e.g. #tcc)',
          searchTitle: 'SEARCH',
          resultados: 'Search results'
        };
    }
  };

  const dict = getDict(lang);

  // 1. Carrega histórico e dados iniciais (Anúncios + Hashtags)
  useEffect(() => {
    const salvo = localStorage.getItem('educonnect-busca-historico');
    if (salvo) {
      setHistorico(JSON.parse(salvo));
    }

    async function carregarDadosIniciais() {
      // Busca Anúncios oficiais do banco (títulos que começam com AVISO:)
      const { data: dataAnuncios } = await supabase
        .from('posts')
        .select('*')
        .like('title', 'AVISO:%')
        .order('created_at', { ascending: false });

      if (dataAnuncios) {
        const anunciosFormatados = dataAnuncios.map(post => {
          let materia = 'INFORMATIVO';
          let titulo = post.title || 'AVISO';
          
          if (post.title && post.title.startsWith('AVISO:')) {
            const partes = post.title.split(':');
            if (partes.length >= 3) {
              materia = partes[1];
              titulo = partes.slice(2).join(':');
            } else if (partes.length === 2) {
              titulo = partes[1];
            }
          }

          return {
            id: post.id,
            titulo: titulo,
            descricao: post.content,
            professor_nome: post.author_handle || '@professor',
            materia: materia,
            created_at: post.created_at
          };
        });
        setAnuncios(anunciosFormatados);
      }

      // Busca todos os posts para extrair as hashtags reais
      const { data: dataPosts } = await supabase.from('posts').select('title, content');
      if (dataPosts) {
        const contagemTags = {};
        dataPosts.forEach(post => {
          if (post.title && (post.title.startsWith('COMMENT:') || post.title.startsWith('AVISO:'))) {
            return;
          }
          if (post.content) {
            const tags = post.content.match(/#[\w-]+/g);
            if (tags) {
              tags.forEach(tag => {
                const tagFormatada = tag.toLowerCase();
                contagemTags[tagFormatada] = (contagemTags[tagFormatada] || 0) + 1;
              });
            }
          }
        });

        const tagsOrdenadas = Object.keys(contagemTags)
          .map(tag => ({ nome: tag, quantidade: contagemTags[tag] }))
          .sort((a, b) => b.quantidade - a.quantidade)
          .slice(0, 12);

        setHashtagsMaisUsadas(tagsOrdenadas);
      }
    }

    carregarDadosIniciais();
  }, []);

  // 2. Sistema de Busca Dinâmica Multi-Tabelas
  useEffect(() => {
    if (!searchTerm.trim()) {
      setUsuariosFiltrados([]);
      setPostsFiltrados([]);
      setAnunciosFiltrados([]);
      return;
    }

    async function executarBusca() {
      const query = searchTerm.trim();

      // a) Pesquisa Pessoas (Profiles)
      const { data: dataUsers } = await supabase
        .from('profiles')
        .select('*')
        .or(`nome.ilike.%${query}%,matricula.ilike.%${query}%`)
        .limit(10);
      if (dataUsers) setUsuariosFiltrados(dataUsers);

      // b) Pesquisa Posts normais (Título não começa com COMMENT: ou AVISO:)
      const { data: dataPosts } = await supabase
        .from('posts')
        .select('*')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .not('title', 'like', 'COMMENT:%')
        .not('title', 'like', 'AVISO:%')
        .order('created_at', { ascending: false })
        .limit(10);

      if (dataPosts) {
        const userIds = [...new Set(dataPosts.map(p => p.user_id).filter(Boolean))];
        let profilesMap = {};
        if (userIds.length > 0) {
          const { data: profiles } = await supabase.from('profiles').select('id, nome, avatar_url').in('id', userIds);
          if (profiles) {
            profiles.forEach(u => { profilesMap[u.id] = u; });
          }
        }
        const postsFormatados = dataPosts.map(p => ({
          ...p,
          authorName: profilesMap[p.user_id]?.nome || 'Usuário',
          authorAvatar: profilesMap[p.user_id]?.avatar_url,
          authorHandle: profilesMap[p.user_id]?.nome ? `@${profilesMap[p.user_id].nome.toLowerCase().replace(/\s+/g, '')}` : '@usuario'
        }));
        setPostsFiltrados(postsFormatados);
      }

      // c) Pesquisa Avisos dos Professores (Título começa com AVISO:)
      const { data: dataAnunc } = await supabase
        .from('posts')
        .select('*')
        .like('title', 'AVISO:%')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .limit(10);

      if (dataAnunc) {
        const apenasAvisos = dataAnunc.filter(post => post.title && post.title.startsWith('AVISO:'));
        const anunciosFormatados = apenasAvisos.map(post => {
          let materia = 'INFORMATIVO';
          let titulo = post.title || 'AVISO';
          const partes = post.title.split(':');
          if (partes.length >= 3) {
            materia = partes[1];
            titulo = partes.slice(2).join(':');
          } else if (partes.length === 2) {
            titulo = partes[1];
          }
          return {
            id: post.id,
            titulo: titulo,
            descricao: post.content,
            professor_nome: post.author_handle || '@professor',
            materia: materia,
            created_at: post.created_at
          };
        });
        setAnunciosFiltrados(anunciosFormatados);
      }
    }

    const delayDebounce = setTimeout(() => {
      executarBusca();
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  // Auxiliares de Histórico
  const adicionarAoHistorico = (termo) => {
    if (!termo.trim()) return;
    const novoHist = [termo, ...historico.filter(h => h !== termo)].slice(0, 6);
    setHistorico(novoHist);
    localStorage.setItem('educonnect-busca-historico', JSON.stringify(novoHist));
  };

  const removerDoHistorico = (e, termo) => {
    e.stopPropagation();
    const novoHist = historico.filter(h => h !== termo);
    setHistorico(novoHist);
    localStorage.setItem('educonnect-busca-historico', JSON.stringify(novoHist));
  };

  const limparHistoricoCompleto = () => {
    setHistorico([]);
    localStorage.removeItem('educonnect-busca-historico');
  };

  // Auxiliar tempo decorrido
  const formatarTempo = (dataString) => {
    const diffMs = new Date() - new Date(dataString);
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHoras < 24) return `${diffHoras || 1}h`;
    return `${Math.floor(diffHoras / 24)}d`;
  };

  const lidarComSubmit = (e) => {
    if (e) e.preventDefault();
    adicionarAoHistorico(searchTerm);
  };

  // Helper para destacar substring encontrada em bold colorido
  const highlightText = (text, highlight) => {
    if (!text) return '';
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase()
            ? <strong key={i} className="text-[#3b82f6] dark:text-[#8b5cf6] font-extrabold">{part}</strong>
            : part
        )}
      </span>
    );
  };

  // Avalia se tudo está vazio na busca ativa
  const resultadosVazios = 
    usuariosFiltrados.length === 0 && 
    postsFiltrados.length === 0 && 
    anunciosFiltrados.length === 0;

  return (
    <div className="w-full max-w-[800px] mx-auto space-y-6 md:pt-2 animate-in fade-in duration-300">
      
      {/* TÍTULO DA PÁGINA */}
      <div className="flex items-center justify-between px-1">
        <h1 className="text-[14px] font-bold text-gray-950 dark:text-gray-100 tracking-widest uppercase">
          {dict.searchTitle}
        </h1>
      </div>

      {/* BARRA DE PESQUISA */}
      <div className="w-full">
        <form onSubmit={lidarComSubmit} className="flex items-center gap-3 bg-white dark:bg-[#12101b] border border-gray-100 dark:border-purple-500/10 rounded-3xl px-5 py-3.5 focus-within:border-blue-500 dark:focus-within:border-purple-500/40 transition-all shadow-[0_4px_15px_rgba(0,0,0,0.015)]">
          <Search size={18} className="text-gray-400" />
          <input 
            type="text" 
            ref={searchInputRef}
            placeholder={dict.placeholder} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-[13px] text-gray-700 dark:text-gray-200 w-full placeholder-gray-400"
          />
          {searchTerm && (
            <button 
              type="button" 
              onClick={() => {
                setSearchTerm('');
                setUsuariosFiltrados([]);
                setPostsFiltrados([]);
                setAnunciosFiltrados([]);
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full cursor-pointer transition-colors"
            >
              <X size={14} className="text-gray-400" />
            </button>
          )}
        </form>
      </div>

      {/* RESULTADOS EM FLUXO CONTÍNUO (SE BUSCANDO) OU DASHBOARD INICIAL (SE VAZIO) */}
      {searchTerm.trim() ? (
        // --- ESTADO A: EXIBIÇÃO DE RESULTADOS DA BUSCA EM FLUXO ---
        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
          
          {/* Seletor de abas inline premium */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 select-none border-b border-gray-100 dark:border-purple-500/5">
            {[
              { id: 'tudo', label: dict.tudo },
              { id: 'pessoas', label: `${dict.pessoas} (${usuariosFiltrados.length})` },
              { id: 'posts', label: `${dict.posts} (${postsFiltrados.length})` },
              { id: 'anuncios', label: `${dict.anuncios} (${anunciosFiltrados.length})` }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setBuscaAtivaTab(tab.id)}
                className={`px-4 py-2 rounded-2xl text-[12px] font-bold tracking-wide transition-all cursor-pointer ${
                  buscaAtivaTab === tab.id
                    ? 'bg-gradient-to-tr from-[#3b82f6] to-[#8b5cf6] text-white shadow-md shadow-blue-500/10'
                    : 'bg-white dark:bg-[#12101b] border border-gray-100 dark:border-purple-500/10 text-gray-500 hover:text-gray-900 dark:hover:text-gray-150'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ÁREA DOS RESULTADOS */}
          <div className="space-y-6">
            
            {/* 1. Resultados de Pessoas */}
            {(buscaAtivaTab === 'tudo' || buscaAtivaTab === 'pessoas') && usuariosFiltrados.length > 0 && (
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-gray-450 dark:text-gray-400 tracking-wider uppercase px-1">{dict.pessoas}</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {usuariosFiltrados.map((user) => (
                    <div 
                      key={user.id} 
                      onClick={() => {
                        adicionarAoHistorico(searchTerm);
                        navigate(`/perfil/${user.id}`);
                      }}
                      className="flex items-center justify-between p-4 bg-white dark:bg-[#12101b] border border-gray-100 dark:border-purple-500/10 rounded-[1.8rem] hover:border-purple-500/20 hover:shadow-md cursor-pointer transition-all duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-50 border border-gray-100 dark:border-purple-500/20 rounded-full flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-300 overflow-hidden flex-shrink-0">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.nome} className="w-full h-full object-cover" />
                          ) : (
                            user.nome.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <h4 className="text-[13px] font-bold text-gray-950 dark:text-gray-100 leading-none mb-1">
                            {highlightText(user.nome, searchTerm)}
                          </h4>
                          <span className="text-[10px] text-gray-400 font-light flex items-center gap-1.5 uppercase tracking-wider">
                            @{user.nome.toLowerCase().replace(/\s+/g, '')}
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            {user.papel === 'professor' ? 'Docente' : 'Discente'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-gray-300" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Resultados de Posts */}
            {(buscaAtivaTab === 'tudo' || buscaAtivaTab === 'posts') && postsFiltrados.length > 0 && (
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-gray-450 dark:text-gray-400 tracking-wider uppercase px-1">{dict.posts}</span>
                <div className="bg-white dark:bg-[#12101b] border border-gray-100 dark:border-purple-500/10 rounded-[2.2rem] overflow-hidden divide-y divide-gray-50 dark:divide-purple-500/5 shadow-sm">
                  {postsFiltrados.map((post) => (
                    <div 
                      key={post.id} 
                      onClick={() => {
                        adicionarAoHistorico(searchTerm);
                        navigate('/feed');
                      }}
                      className="p-4 hover:bg-gray-50/40 dark:hover:bg-[#161424]/45 cursor-pointer flex gap-4 transition-colors"
                    >
                      <div className="w-9 h-9 bg-gray-50 border border-gray-150 rounded-full flex items-center justify-center text-[10px] overflow-hidden flex-shrink-0 shadow-inner">
                        {post.authorAvatar ? (
                          <img src={post.authorAvatar} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User size={14} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-extrabold text-gray-950 dark:text-gray-100">{post.authorName}</span>
                          <span className="text-[9px] text-gray-400">{formatarTempo(post.created_at)}</span>
                        </div>
                        <p className="text-[12px] text-gray-600 dark:text-gray-300 mt-1 leading-relaxed break-words">
                          {highlightText(post.content, searchTerm)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Resultados de Avisos */}
            {(buscaAtivaTab === 'tudo' || buscaAtivaTab === 'anuncios') && anunciosFiltrados.length > 0 && (
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-gray-450 dark:text-gray-400 tracking-wider uppercase px-1">{dict.anuncios}</span>
                <div className="bg-white dark:bg-[#12101b] border border-gray-100 dark:border-purple-500/10 rounded-[2.2rem] overflow-hidden divide-y divide-gray-50 dark:divide-purple-500/5 shadow-sm">
                  {anunciosFiltrados.map((anuncio) => (
                    <div 
                      key={anuncio.id} 
                      onClick={() => {
                        adicionarAoHistorico(searchTerm);
                        setAnuncioSelecionado(anuncio);
                      }}
                      className="p-4 hover:bg-gray-50/40 dark:hover:bg-[#161424]/45 cursor-pointer flex gap-4 transition-colors"
                    >
                      <div className="p-2 bg-purple-500/10 text-[#8b5cf6] rounded-xl flex-shrink-0 h-8 w-8 flex items-center justify-center">
                        <Megaphone size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[12.5px] font-bold text-gray-950 dark:text-gray-100 truncate max-w-[70%]">
                            {highlightText(anuncio.titulo, searchTerm)}
                          </span>
                          <span className="text-[9px] text-gray-400">{formatarTempo(anuncio.created_at)}</span>
                        </div>
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold block mt-1 uppercase">
                          {anuncio.professor_nome} · {anuncio.materia}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Caso Vazio */}
            {resultadosVazios && (
              <div className="bg-white dark:bg-[#12101b] border border-gray-100 dark:border-purple-500/10 rounded-[2rem] p-16 text-center text-gray-450 dark:text-gray-400 flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 bg-gray-50 dark:bg-purple-950/10 rounded-full flex items-center justify-center text-gray-300">
                  <Bell size={24} strokeWidth={1.5} />
                </div>
                <p className="text-[12.5px] font-light max-w-xs">{dict.naoEncontrado}</p>
              </div>
            )}

          </div>

        </div>
      ) : (
        // --- ESTADO B: CONTEÚDO PADRÃO DO DASHBOARD DE BUSCA ---
        <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
          
          {/* BUSCAS RECENTES */}
          {historico.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">{dict.recentes}</span>
                <button 
                  type="button" 
                  onClick={limparHistoricoCompleto} 
                  className="text-[10.5px] text-red-500 hover:underline font-bold cursor-pointer"
                >
                  {dict.limpar}
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {historico.map((term, i) => (
                  <div 
                    key={i}
                    onClick={() => setSearchTerm(term)}
                    className="flex items-center gap-2 bg-white dark:bg-[#12101b] border border-gray-100 dark:border-purple-500/10 px-3.5 py-1.8 rounded-full text-[12px] text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-purple-500/20 cursor-pointer shadow-sm transition-all"
                  >
                    <Clock size={11} className="text-gray-450" />
                    <span className="font-medium">{term}</span>
                    <button 
                      type="button"
                      onClick={(e) => removerDoHistorico(e, term)}
                      className="text-gray-400 hover:text-red-500 p-0.5 rounded-full"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SEÇÃO: ANÚNCIOS DOS PROFESSORES */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 text-gray-900 dark:text-gray-150 px-1">
              <Megaphone size={16} strokeWidth={2} />
              <h2 className="text-[12px] font-extrabold tracking-wider uppercase">{dict.avisosDocentes}</h2>
            </div>

            <div className="bg-white dark:bg-[#12101b] border border-gray-100 dark:border-purple-500/10 rounded-[2.2rem] overflow-hidden divide-y divide-gray-100 dark:divide-purple-500/5 shadow-[0_4px_25px_rgba(0,0,0,0.01)]">
              {anuncios.map((anuncio) => (
                <div 
                  key={anuncio.id} 
                  onClick={() => setAnuncioSelecionado(anuncio)}
                  className="p-5 flex justify-between items-start hover:bg-gray-50/30 dark:hover:bg-[#161424]/40 transition-colors cursor-pointer"
                >
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-[#8b5cf6] tracking-wide uppercase flex items-center gap-1.5">
                      <span>{anuncio.professor_nome}</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full" />
                      <span className="text-gray-400 font-medium">{anuncio.materia}</span>
                    </div>
                    <h3 className="text-[13.5px] font-extrabold text-gray-950 dark:text-gray-100 tracking-tight leading-snug">
                      {anuncio.titulo}
                    </h3>
                  </div>
                  <span className="text-[11px] text-gray-400 font-light flex-shrink-0 ml-4">
                    {formatarTempo(anuncio.created_at)}
                  </span>
                </div>
              ))}
              {anuncios.length === 0 && (
                <p className="text-xs text-gray-400 p-8 text-center italic">{dict.naoEncontrado}</p>
              )}
            </div>
          </div>

          {/* SEÇÃO: # MAIS UTILIZADAS */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 text-gray-900 dark:text-gray-150 px-1">
              <Hash size={16} strokeWidth={2} />
              <h2 className="text-[12px] font-extrabold tracking-wider uppercase">{dict.hashtags}</h2>
            </div>

            <div className="bg-white dark:bg-[#12101b] border border-gray-100 dark:border-purple-500/10 rounded-[2.2rem] p-6 shadow-[0_4px_25px_rgba(0,0,0,0.01)] flex flex-wrap gap-2.5">
              {hashtagsMaisUsadas.map((tag, index) => (
                <button 
                  key={index}
                  onClick={() => {
                    setSearchTerm(tag.nome);
                    adicionarAoHistorico(tag.nome);
                  }}
                  className="flex items-center gap-2.5 bg-gray-50/50 dark:bg-[#161424] border border-gray-100 dark:border-purple-500/10 hover:border-gray-300 dark:hover:border-purple-500/20 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-full text-[12.5px] font-semibold transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                >
                  <span className="text-gray-900 dark:text-gray-100 font-bold">{tag.nome}</span>
                  <span className="text-gray-400 dark:text-gray-450 font-light text-[11px]">{tag.quantidade}</span>
                </button>
              ))}
              {hashtagsMaisUsadas.length === 0 && (
                <p className="text-xs text-gray-400 w-full text-center py-2 italic">
                  Inclua hashtags nos conteúdos dos seus posts para que elas apareçam computadas aqui!
                </p>
              )}
            </div>
          </div>

        </div>
      )}

      {/* OVERLAY MODAL: DETALHES DO AVISO */}
      {anuncioSelecionado && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#12101b] border border-gray-100 dark:border-purple-500/10 w-full max-w-[500px] rounded-[2.5rem] shadow-2xl overflow-hidden scale-in animate-in duration-300">
            {/* Header do Modal */}
            <div className="px-6 py-5 border-b border-gray-100 dark:border-purple-500/5 flex items-center justify-between bg-gray-50/50 dark:bg-[#151322]/20">
              <div>
                <span className="text-[10px] font-bold text-purple-650 dark:text-purple-400 tracking-wider uppercase block mb-0.5">
                  {anuncioSelecionado.materia}
                </span>
                <h3 className="text-[13px] font-bold text-gray-950 dark:text-gray-100 uppercase tracking-widest leading-none">
                  {dict.anuncioModalTitulo}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setAnuncioSelecionado(null)}
                className="p-2 text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            {/* Conteúdo do Modal */}
            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-[15px] font-bold text-gray-950 dark:text-gray-100 leading-tight">
                  {anuncioSelecionado.titulo}
                </h4>
                <div className="flex items-center gap-2 text-[10.5px] text-gray-400 mt-1">
                  <span className="font-semibold text-gray-600 dark:text-gray-300">{anuncioSelecionado.professor_nome}</span>
                  <span>·</span>
                  <span>{new Date(anuncioSelecionado.created_at).toLocaleDateString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              
              <p className="text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line bg-gray-50/30 dark:bg-[#07060c] p-4 rounded-2xl border border-gray-100/50 dark:border-purple-500/5">
                {anuncioSelecionado.descricao}
              </p>
            </div>

            {/* Rodapé do Modal */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-purple-500/5 bg-gray-50/50 dark:bg-[#151322]/10 flex justify-end">
              <button
                type="button"
                onClick={() => setAnuncioSelecionado(null)}
                className="px-5 py-2 bg-gradient-to-tr from-[#3b82f6] to-[#8b5cf6] text-white rounded-full text-[12px] font-bold shadow-md shadow-blue-500/10 cursor-pointer hover:opacity-90 active:scale-98 transition-all"
              >
                {dict.fechar}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}