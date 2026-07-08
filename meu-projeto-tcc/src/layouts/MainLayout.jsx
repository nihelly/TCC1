import { useEffect, useState } from 'react';
import { Bell, Mail, Plus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import GeometricBackground from '../components/GeometricBackground';
import { useLanguage } from '../hooks/useLanguage';
import { supabase } from '../lib/supabaseClient';

export function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { translate } = useLanguage();
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  useEffect(() => {
    let channel = null;

    async function fetchUnreadCount() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (!error && count !== null) {
        setUnreadNotificationsCount(count);
      }

      channel = supabase
        .channel('global-notifications-realtime')
        .on('postgres_changes', { 
          event: '*', 
          table: 'notifications', 
          filter: `user_id=eq.${user.id}` 
        }, async () => {
          const { count: newCount } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false);
          
          if (newCount !== null) {
            setUnreadNotificationsCount(newCount);
          }
        })
        .subscribe();
    }

    fetchUnreadCount();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [location.pathname]);

  // Mapeamento de rota para chaves de tradução
  const chavePorRota = {
    '/feed': 'feedTitle',
    '/busca': 'searchTitle',
    '/mensagens': 'messagesTitle',
    '/notificacoes': 'notificationsTitle',
    '/configuracoes': 'settingsTitle',
    '/criar-post': 'newPostTitle',
    '/criar-aviso': 'newAnnouncementTitle',
  };

  const getTituloAtual = () => {
    const chave = chavePorRota[location.pathname];
    if (chave) return translate(chave);
    if (location.pathname.startsWith('/perfil')) return translate('profileTitle');
    return 'EDUCONNECT';
  };

  const tituloAtual = getTituloAtual();

  return (
    <div className="flex min-h-screen w-full bg-[#fcfcfc] text-gray-900 antialiased selection:bg-gray-100 relative z-[1]">
      <GeometricBackground />
      
      {/* 1. Sidebar compacta (só ícones) — Visível apenas em computadores/tablets grandes */}
      <Sidebar />
 
      {/* 2. Área principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        
        {/* HEADER SUPERIOR — Título + Ícones de ação */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="w-full max-w-[1200px] mx-auto px-6 sm:px-8 md:px-12 h-14 flex items-center justify-between">
            
            {/* Título da página */}
            <h1 className="text-[14px] font-bold text-gray-950 tracking-[0.2em] uppercase">
              {tituloAtual}
            </h1>

            {/* Ícones de ação */}
            <div className="flex items-center gap-1">
              <button 
                onClick={() => navigate('/notificacoes')} 
                className="p-2.5 rounded-xl hover:bg-gray-50 transition-colors text-gray-600 cursor-pointer relative"
                title={translate('notificationsTitle')}
              >
                <Bell size={18} strokeWidth={1.8} />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
              <button 
                onClick={() => navigate('/mensagens')} 
                className="p-2.5 rounded-xl hover:bg-gray-50 transition-colors text-gray-600 cursor-pointer"
                title={translate('messagesTitle')}
              >
                <Mail size={18} strokeWidth={1.8} />
              </button>
              <button 
                onClick={() => navigate('/criar-post')} 
                className="p-2.5 rounded-xl hover:bg-gray-50 transition-colors text-gray-600 cursor-pointer"
                title={translate('newPostTitle')}
              >
                <Plus size={18} strokeWidth={1.8} />
              </button>
            </div>
          </div>
        </header>

        {/* Conteúdo da página — padding inferior responsivo para acomodar bottom bar no celular */}
        <main className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-6 sm:px-8 sm:py-8 md:px-12 md:py-8 pb-20 md:pb-8 animate-in fade-in duration-300">
          {children}
        </main>
        
      </div>

      {/* 3. Bottom bar para dispositivos móveis */}
      <BottomNav />
      
    </div>
  );
}
