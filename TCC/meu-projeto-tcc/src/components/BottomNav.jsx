import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, PlusSquare, User, Settings } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../hooks/useLanguage';

export default function BottomNav() {
  const [userId, setUserId] = useState(null);
  const { translate } = useLanguage();

  useEffect(() => {
    async function obterUsuarioLogado() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    }
    obterUsuarioLogado();
  }, []);

  const linkStyle = ({ isActive }) => 
    `flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-300 ${
      isActive 
        ? 'text-[#8b5cf6] scale-110' 
        : 'text-gray-400 dark:text-gray-500 hover:text-[#8b5cf6]'
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 h-16 bg-white dark:bg-[#0c0b12] border-t border-gray-100 dark:border-purple-500/10 flex items-center justify-around md:hidden px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
      
      <NavLink to="/feed" className={linkStyle} title={translate('home')}>
        <Home size={20} strokeWidth={1.8} />
      </NavLink>

      <NavLink to="/busca" className={linkStyle} title={translate('search')}>
        <Search size={20} strokeWidth={1.8} />
      </NavLink>

      <NavLink to="/criar-post" className={linkStyle} title="Nova publicação">
        <PlusSquare size={20} strokeWidth={1.8} />
      </NavLink>

      {userId ? (
        <NavLink to={`/perfil/${userId}`} className={linkStyle} title={translate('profile')}>
          <User size={20} strokeWidth={1.8} />
        </NavLink>
      ) : (
        <div className="w-10 h-10 flex items-center justify-center text-gray-300">
          <User size={20} strokeWidth={1.8} className="opacity-40" />
        </div>
      )}

      <NavLink to="/configuracoes" className={linkStyle} title={translate('settings')}>
        <Settings size={20} strokeWidth={1.8} />
      </NavLink>

    </nav>
  );
}
