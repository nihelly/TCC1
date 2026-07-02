import { useEffect, useState } from 'react';
import { 
  ArrowLeft, Heart, Sparkles, MessageSquare, UserPlus, 
  Repeat, Trash2, CheckCheck, Bell, Trash
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { useLanguage } from '../hooks/useLanguage';

const dict = {
  'Português (BR)': {
    title: 'NOTIFICAÇÕES',
    markAllRead: 'Marcar todas como lidas',
    deleteAll: 'Limpar histórico',
    empty: 'Tudo limpo por aqui! Nenhuma notificação recente.',
    loading: 'Carregando notificações...',
    all: 'Todas',
    likes: 'Curtidas',
    comments: 'Comentários',
    follows: 'Seguidores',
    toastMarkedRead: 'Notificações marcadas como lidas.',
    toastDeleted: 'Notificação excluída.',
    toastAllDeleted: 'Histórico de notificações limpo.',
    errorLoad: 'Erro ao carregar notificações.',
    errorMark: 'Erro ao atualizar notificações.',
    errorDelete: 'Erro ao remover notificação.',
    newNotif: 'Nova notificação recebida'
  },
  'English': {
    title: 'NOTIFICATIONS',
    markAllRead: 'Mark all as read',
    deleteAll: 'Clear history',
    empty: 'All clean here! No recent notifications.',
    loading: 'Loading notifications...',
    all: 'All',
    likes: 'Likes',
    comments: 'Comments',
    follows: 'Followers',
    toastMarkedRead: 'Notifications marked as read.',
    toastDeleted: 'Notification deleted.',
    toastAllDeleted: 'Notification history cleared.',
    errorLoad: 'Error loading notifications.',
    errorMark: 'Error updating notifications.',
    errorDelete: 'Error removing notification.',
    newNotif: 'New notification received'
  },
  'Español': {
    title: 'NOTIFICACIONES',
    markAllRead: 'Marcar como leídas',
    deleteAll: 'Limpiar historial',
    empty: '¡Todo limpio por aquí! Sin notificaciones recientes.',
    loading: 'Cargando notificaciones...',
    all: 'Todas',
    likes: 'Me gusta',
    comments: 'Comentarios',
    follows: 'Seguidores',
    toastMarkedRead: 'Notificaciones marcadas como leídas.',
    toastDeleted: 'Notificación eliminada.',
    toastAllDeleted: 'Historial de notificaciones limpio.',
    errorLoad: 'Error al cargar notificaciones.',
    errorMark: 'Error al actualizar notificaciones.',
    errorDelete: 'Error al eliminar la notificación.',
    newNotif: 'Nueva notificación recibida'
  },
  'Français': {
    title: 'NOTIFICATIONS',
    markAllRead: 'Marquer comme lues',
    deleteAll: 'Effacer l\'historique',
    empty: 'Tout est propre ici! Pas de notifications récentes.',
    loading: 'Chargement des notifications...',
    all: 'Toutes',
    likes: 'Mentions j’aime',
    comments: 'Commentaires',
    follows: 'Abonnés',
    toastMarkedRead: 'Notifications marquées comme lues.',
    toastDeleted: 'Notification supprimée.',
    toastAllDeleted: 'Historique des notifications effacé.',
    errorLoad: 'Erreur lors du chargement des notifications.',
    errorMark: 'Erreur lors de la mise à jour des notifications.',
    errorDelete: 'Erreur lors de la suppression.',
    newNotif: 'Nouvelle notification reçue'
  },
  'Deutsch': {
    title: 'BENACHRICHTIGUNGEN',
    markAllRead: 'Als gelesen markieren',
    deleteAll: 'Verlauf löschen',
    empty: 'Hier ist alles sauber! Keine neuen Benachrichtigungen.',
    loading: 'Benachrichtigungen werden geladen...',
    all: 'Alle',
    likes: 'Gefällt mir',
    comments: 'Kommentare',
    follows: 'Follower',
    toastMarkedRead: 'Benachrichtigungen als gelesen markiert.',
    toastDeleted: 'Benachrichtigung gelöscht.',
    toastAllDeleted: 'Benachrichtigungsverlauf gelöscht.',
    errorLoad: 'Fehler beim Laden der Benachrichtigungen.',
    errorMark: 'Fehler beim Aktualisieren der Benachrichtigungen.',
    errorDelete: 'Fehler beim Löschen der Benachrichtigung.',
    newNotif: 'Neue Benachrichtigung erhalten'
  },
  'Italiano': {
    title: 'NOTIFICHE',
    markAllRead: 'Segna come lette',
    deleteAll: 'Cancella cronologia',
    empty: 'Tutto pulito qui! Nessuna notifica recente.',
    loading: 'Caricamento notifiche...',
    all: 'Tutte',
    likes: 'Mi piace',
    comments: 'Commenti',
    follows: 'Follower',
    toastMarkedRead: 'Notifiche segnate come lette.',
    toastDeleted: 'Notifica eliminata.',
    toastAllDeleted: 'Cronologia notifiche cancellata.',
    errorLoad: 'Errore durante il caricamento delle notifiche.',
    errorMark: 'Errore durante l\'aggiornamento delle notifiche.',
    errorDelete: 'Errore durante l\'eliminazione.',
    newNotif: 'Nuova notifica ricevuta'
  },
  '日本語': {
    title: '通知',
    markAllRead: 'すべて既読にする',
    deleteAll: '履歴をクリア',
    empty: '通知はありません。',
    loading: '通知を読み込み中...',
    all: 'すべて',
    likes: 'いいね',
    comments: 'コメント',
    follows: 'フォロワー',
    toastMarkedRead: '通知を既読にしました。',
    toastDeleted: '通知を削除しました。',
    toastAllDeleted: '通知履歴をクリアしました。',
    errorLoad: '通知の読み込みに失敗しました。',
    errorMark: '通知の更新に失敗しました。',
    errorDelete: '通知の削除に失敗しました。',
    newNotif: '新しい通知があります'
  },
  '中文': {
    title: '通知',
    markAllRead: '标记为已读',
    deleteAll: '清除历史记录',
    empty: '暂无新通知。',
    loading: '正在加载通知...',
    all: '全部',
    likes: '点赞',
    comments: '评论',
    follows: '粉丝',
    toastMarkedRead: '已将通知标记为已读。',
    toastDeleted: '通知已删除。',
    toastAllDeleted: '已清除通知历史记录。',
    errorLoad: '加载通知失败。',
    errorMark: '更新通知失败。',
    errorDelete: '删除通知失败。',
    newNotif: '收到新通知'
  },
  'Русский': {
    title: 'УВЕДОМЛЕНИЯ',
    markAllRead: 'Отметить как прочитанные',
    deleteAll: 'Очистить историю',
    empty: 'Здесь чисто! Нет недавних уведомлений.',
    loading: 'Загрузка уведомлений...',
    all: 'Все',
    likes: 'Лайки',
    comments: 'Комментарии',
    follows: 'Подписчики',
    toastMarkedRead: 'Уведомления отмечены как прочитанные.',
    toastDeleted: 'Уведомление удалено.',
    toastAllDeleted: 'История уведомлений очищена.',
    errorLoad: 'Ошибка при загрузке уведомлений.',
    errorMark: 'Ошибка при обновлении уведомлений.',
    errorDelete: 'Ошибка при удалении уведомления.',
    newNotif: 'Получено новое уведомление'
  },
  'العربية': {
    title: 'الإشعارات',
    markAllRead: 'تحديد كمقروء',
    deleteAll: 'مسح السجل',
    empty: 'لا توجد إشعارات حديثة.',
    loading: 'جاري تحميل الإشعارات...',
    all: 'الكل',
    likes: 'الإعجابات',
    comments: 'التعليقات',
    follows: 'المتابعون',
    toastMarkedRead: 'تم تحديد الإشعارات كمقروءة.',
    toastDeleted: 'تم حذف الإشعار.',
    toastAllDeleted: 'تم مسح سجل الإشعارات.',
    errorLoad: 'خطأ في تحميل الإشعارات.',
    errorMark: 'خطأ في تحديث الإشعارات.',
    errorDelete: 'خطأ في حذف الإشعار.',
    newNotif: 'تم استلام إشعار جديد'
  },
  'हिन्दी': {
    title: 'सूचनाएं',
    markAllRead: 'पढ़े गए मार्क करें',
    deleteAll: 'इतिहास साफ़ करें',
    empty: 'यहाँ कोई हालिया सूचना नहीं है।',
    loading: 'सूचनाएं लोड हो रही हैं...',
    all: 'सभी',
    likes: 'पसंद',
    comments: 'टिप्पणियाँ',
    follows: 'फ़ॉलोअर्स',
    toastMarkedRead: 'सूचनाएं पढ़े गए मार्क की गईं।',
    toastDeleted: 'सूचना हटाई गई।',
    toastAllDeleted: 'सूचना इतिहास साफ़ किया गया।',
    errorLoad: 'सूचना लोड करने में त्रुटि।',
    errorMark: 'सूचना अपडेट करने में त्रुटि।',
    errorDelete: 'सूचना हटाने में त्रुटि।',
    newNotif: 'नई सूचना मिली है'
  },
  '한국어': {
    title: '알림',
    markAllRead: '읽음 표시',
    deleteAll: '기록 지우기',
    empty: '최근 알림이 없습니다.',
    loading: '알림 로딩 중...',
    all: '전체',
    likes: '좋아요',
    comments: '댓글',
    follows: '팔로워',
    toastMarkedRead: '알림을 읽음으로 표시했습니다.',
    toastDeleted: '알림이 삭제되었습니다.',
    toastAllDeleted: '알림 기록이 삭제되었습니다.',
    errorLoad: '알림 로드 오류.',
    errorMark: '알림 업데이트 오류.',
    errorDelete: '알림 삭제 오류.',
    newNotif: '새 알림이 수신되었습니다'
  }
};

export default function Notificacoes() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const [notificacoes, setNotificacoes] = useState([]);
  const [profilesMap, setProfilesMap] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'like' | 'comment' | 'follow'
  const [currentUser, setCurrentUser] = useState(null);

  const t = (key) => {
    const dictLang = dict[lang] || dict['Português (BR)'];
    return dictLang[key] || key;
  };

  // Carrega notificações iniciais e perfis correspondentes
  useEffect(() => {
    async function carregarDados() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error(t('errorLoad'));
        setCarregando(false);
        return;
      }

      setNotificacoes(data || []);

      // Busca perfis para os atores das notificações em lote
      const actorIds = [...new Set((data || []).map(n => n.actor_id).filter(Boolean))];
      if (actorIds.length > 0) {
        const { data: profiles, error: pError } = await supabase
          .from('profiles')
          .select('id, nome, avatar_url')
          .in('id', actorIds);

        if (!pError && profiles) {
          const map = {};
          profiles.forEach(p => {
            map[p.id] = p;
          });
          setProfilesMap(map);
        }
      }
      setCarregando(false);
    }
    carregarDados();
  }, [lang]);

  // Inscrição Realtime de Notificações
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', { 
        event: 'INSERT', 
        table: 'notifications', 
        filter: `user_id=eq.${currentUser.id}` 
      }, async (payload) => {
        const newNotif = payload.new;

        // Busca o perfil do ator da nova notificação
        if (newNotif.actor_id) {
          const { data: pData } = await supabase
            .from('profiles')
            .select('id, nome, avatar_url')
            .eq('id', newNotif.actor_id)
            .single();
          if (pData) {
            setProfilesMap(prev => ({ ...prev, [pData.id]: pData }));
          }
        }

        setNotificacoes(prev => [newNotif, ...prev]);
        toast.info(`${t('newNotif')}: ${newNotif.content}`);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  // Marca todas as notificações como lidas
  const marcarTodasComoLidas = async () => {
    if (!currentUser) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', currentUser.id)
      .eq('is_read', false);

    if (!error) {
      setNotificacoes(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success(t('toastMarkedRead'));
    } else {
      toast.error(t('errorMark'));
    }
  };

  // Marca uma notificação individual como lida
  const marcarComoLida = async (id) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (!error) {
      setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    }
  };

  // Exclui uma notificação específica
  const excluirNotificacao = async (e, id) => {
    e.stopPropagation(); // Evita navegar ao clicar no excluir

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (!error) {
      setNotificacoes(prev => prev.filter(n => n.id !== id));
      toast.success(t('toastDeleted'));
    } else {
      toast.error(t('errorDelete'));
    }
  };

  // Limpa todo o histórico de notificações
  const limparHistorico = async () => {
    if (!currentUser) return;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', currentUser.id);

    if (!error) {
      setNotificacoes([]);
      toast.success(t('toastAllDeleted'));
    } else {
      toast.error(t('errorDelete'));
    }
  };

  // Navega para o perfil do ator da notificação
  const lidarComCliqueNotif = async (notif) => {
    await marcarComoLida(notif.id);

    if (notif.actor_id) {
      navigate(`/perfil/${notif.actor_id}`);
      return;
    }

    // Fallback baseado no handle caso não haja actor_id
    try {
      const cleanHandle = notif.actor_handle.replace('@', '').toLowerCase();
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome');
        
      const perfilMatch = (profiles || []).find(p => 
        p.nome?.toLowerCase().replace(/\s+/g, '') === cleanHandle
      );
      
      if (perfilMatch) {
        navigate(`/perfil/${perfilMatch.id}`);
      } else {
        toast.error(t('profileNotFound'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Formata o timestamp de maneira relativa/traduzida
  const formatarDataRelativa = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    let dayPrefix = '';
    if (isToday) {
      if (lang === 'Português (BR)') dayPrefix = 'Hoje às';
      else if (lang === 'English') dayPrefix = 'Today at';
      else if (lang === 'Español') dayPrefix = 'Hoy a las';
      else if (lang === 'Français') dayPrefix = 'Aujourd\'hui à';
      else if (lang === 'Deutsch') dayPrefix = 'Heute um';
      else if (lang === 'Italiano') dayPrefix = 'Oggi alle';
      else if (lang === '日本語') dayPrefix = '今日';
      else if (lang === '中文') dayPrefix = '今天';
      else if (lang === 'Русский') dayPrefix = 'Сегодня в';
      else if (lang === 'العربية') dayPrefix = 'اليوم في';
      else if (lang === 'हिन्दी') dayPrefix = 'आज';
      else if (lang === '한국어') dayPrefix = '오늘';
      else dayPrefix = 'Today at';
      return `${dayPrefix} ${timeStr}`;
    } else if (isYesterday) {
      if (lang === 'Português (BR)') dayPrefix = 'Ontem às';
      else if (lang === 'English') dayPrefix = 'Yesterday at';
      else if (lang === 'Español') dayPrefix = 'Ayer a las';
      else if (lang === 'Français') dayPrefix = 'Hier à';
      else if (lang === 'Deutsch') dayPrefix = 'Gestern um';
      else if (lang === 'Italiano') dayPrefix = 'Ieri alle';
      else if (lang === '日本語') dayPrefix = '昨日';
      else if (lang === '中文') dayPrefix = '昨天';
      else if (lang === 'Русский') dayPrefix = 'Вчера в';
      else if (lang === 'العربية') dayPrefix = 'أمس في';
      else if (lang === 'हिन्दी') dayPrefix = 'कल';
      else if (lang === '한국어') dayPrefix = '어제';
      else dayPrefix = 'Yesterday at';
      return `${dayPrefix} ${timeStr}`;
    } else {
      return `${date.toLocaleDateString([], { day: '2-digit', month: '2-digit' })} ${timeStr}`;
    }
  };

  // Renderiza ícone específico do tipo de notificação
  const renderIcone = (type) => {
    switch (type) {
      case 'like':
        return <Heart size={10} className="text-red-500 fill-red-500" />;
      case 'comment':
        return <MessageSquare size={10} className="text-blue-500 fill-blue-500" />;
      case 'follow':
        return <UserPlus size={10} className="text-green-500" />;
      case 'repost':
        return <Repeat size={10} className="text-purple-500" />;
      default:
        return <Sparkles size={10} className="text-purple-500" />;
    }
  };

  // Filtragem das notificações baseadas na aba ativa
  const notificacoesFiltradas = notificacoes.filter(n => {
    if (activeTab === 'all') return true;
    return n.type === activeTab;
  });

  // Conta não lidas por aba
  const countNaoLidas = (type) => {
    if (type === 'all') return notificacoes.filter(n => !n.is_read).length;
    return notificacoes.filter(n => n.type === type && !n.is_read).length;
  };

  const temNaoLidasGlobal = countNaoLidas('all') > 0;

  return (
    <div className="w-full max-w-[680px] mx-auto space-y-6 md:pt-2">
      
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-purple-500/10 pb-5 px-1">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/feed')} 
            className="p-2 text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-[15px] font-bold text-gray-950 dark:text-gray-100 tracking-widest uppercase">
            {t('title')}
          </h1>
        </div>
        
        {/* Ações globais (Lidas / Limpar) */}
        <div className="flex items-center gap-2">
          {temNaoLidasGlobal && (
            <button
              onClick={marcarTodasComoLidas}
              className="p-2 text-gray-400 hover:text-[#8b5cf6] hover:bg-purple-50/50 dark:hover:bg-purple-950/20 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title={t('markAllRead')}
            >
              <CheckCheck size={16} />
              <span className="hidden sm:inline">{t('markAllRead')}</span>
            </button>
          )}
          {notificacoes.length > 0 && (
            <button
              onClick={limparHistorico}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/20 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title={t('deleteAll')}
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">{t('deleteAll')}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Filtros de Categorias (Tabs) */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 select-none">
        {[
          { id: 'all', key: 'all' },
          { id: 'like', key: 'likes' },
          { id: 'comment', key: 'comments' },
          { id: 'follow', key: 'follows' }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          const unreadCount = countNaoLidas(tab.id);
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-2xl text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-transparent ${
                isActive
                  ? 'bg-gradient-to-tr from-[#3b82f6] to-[#8b5cf6] text-white shadow-md shadow-blue-500/10'
                  : 'bg-white dark:bg-[#12101b] border-gray-100 dark:border-purple-500/10 text-gray-650 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {t(tab.key)}
              {unreadCount > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                  isActive ? 'bg-white text-purple-600' : 'bg-red-500 text-white'
                }`}>
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Listagem */}
      {carregando ? (
        <div className="text-center text-gray-400 text-xs py-20 flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin" />
          <span>{t('loading')}</span>
        </div>
      ) : notificacoesFiltradas.length === 0 ? (
        // Estado Vazio
        <div className="bg-white dark:bg-[#12101b] border border-gray-100 dark:border-purple-500/10 rounded-[2rem] p-12 text-center text-gray-450 dark:text-gray-400 flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 bg-gray-50 dark:bg-purple-950/10 rounded-full flex items-center justify-center text-gray-400 mb-1">
            <Bell size={24} strokeWidth={1.5} />
          </div>
          <p className="text-[13px] max-w-[340px] leading-relaxed font-light">{t('empty')}</p>
        </div>
      ) : (
        // Cards de Notificações
        <div className="bg-white dark:bg-[#12101b] border border-gray-100 dark:border-purple-500/10 rounded-[2.2rem] overflow-hidden divide-y divide-gray-50 dark:divide-purple-500/5 shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
          {notificacoesFiltradas.map((notif) => {
            const perfil = profilesMap[notif.actor_id];
            const nomeExibido = perfil?.nome || notif.actor_handle;
            const handleExibido = perfil?.nome 
              ? `@${perfil.nome.toLowerCase().replace(/\s+/g, '')}` 
              : notif.actor_handle;
            const iniciais = perfil?.nome 
              ? perfil.nome.substring(0, 2).toUpperCase() 
              : notif.actor_handle.replace('@', '').substring(0, 2).toUpperCase();

            return (
              <div 
                key={notif.id} 
                onClick={() => lidarComCliqueNotif(notif)}
                className={`p-5 flex items-center justify-between gap-4 transition-all duration-300 cursor-pointer group ${
                  !notif.is_read 
                    ? 'bg-purple-50/15 dark:bg-purple-950/10 hover:bg-purple-50/25 dark:hover:bg-purple-950/15' 
                    : 'hover:bg-gray-50/40 dark:hover:bg-[#161424]/40'
                }`}
              >
                <div className="flex items-center gap-4 flex-1 overflow-hidden">
                  
                  {/* Foto/Iniciais do Ator com Badge de Ação */}
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 bg-white border border-gray-100 dark:border-purple-500/20 rounded-full flex items-center justify-center text-[12px] font-bold text-gray-700 dark:text-gray-300 overflow-hidden shadow-inner">
                      {perfil?.avatar_url ? (
                        <img src={perfil.avatar_url} alt={nomeExibido} className="w-full h-full object-cover" />
                      ) : (
                        iniciais
                      )}
                    </div>
                    {/* Badge do tipo */}
                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-[#12101b] p-1 rounded-full shadow-sm border border-gray-100 dark:border-purple-500/10 flex items-center justify-center">
                      {renderIcone(notif.type)}
                    </div>
                  </div>

                  {/* Conteúdo do Texto */}
                  <div className="text-[13px] text-gray-650 dark:text-gray-350 leading-relaxed overflow-hidden">
                    <span className="font-extrabold text-gray-950 dark:text-gray-100 mr-1.5 hover:underline truncate">
                      {nomeExibido}
                    </span>
                    <span className="text-gray-400 text-[11px] font-light mr-1.5">
                      {handleExibido}
                    </span>
                    <span className="font-medium text-gray-705 dark:text-gray-300">
                      {notif.content}
                    </span>
                  </div>
                </div>

                {/* Data e Ações da Notificação */}
                <div className="flex items-center gap-3.5 flex-shrink-0 select-none">
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] text-gray-400 font-light whitespace-nowrap">
                      {formatarDataRelativa(notif.created_at)}
                    </span>
                    {!notif.is_read && (
                      <span className="w-2 h-2 bg-[#8b5cf6] rounded-full shadow-sm shadow-[#8b5cf6]/35" title="Não lida" />
                    )}
                  </div>
                  
                  {/* Botão de excluir específico */}
                  <button
                    onClick={(e) => excluirNotificacao(e, notif.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all cursor-pointer"
                    title={t('delete')}
                  >
                    <Trash size={13} />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}