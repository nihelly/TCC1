import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, User, Settings, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../hooks/useLanguage';

export default function Sidebar() {
  const [userId, setUserId] = useState(null);
  const { translate } = useLanguage();

  // Busca o ID do usuário logado para montar a rota dinâmica do perfil
  useEffect(() => {
    async function obterUsuarioLogado() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    }
    obterUsuarioLogado();
  }, []);

  // Estilo dinâmico para os links (sidebar compacta, só ícones)
  const linkStyle = ({ isActive }) => 
    `flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300 group ${
      isActive 
        ? 'bg-gradient-to-tr from-[#3b82f6] to-[#8b5cf6] text-white shadow-lg shadow-blue-500/15 scale-105' 
        : 'text-gray-400 hover:text-[#8b5cf6] hover:bg-gray-50/60 dark:hover:bg-[#1a1a2e]/30'
    }`;

  return (
    <aside className="hidden md:flex w-[60px] h-screen bg-white border-r border-r-gray-100 flex-col items-center justify-between py-6 sticky top-0 select-none flex-shrink-0">
      
      {/* Bloco Superior: Logo + Navegação */}
      <div className="flex flex-col items-center gap-6">
        
        {/* LOGO DO EDUCONNECT (só ícone) */}
        <div className="mb-2">
          <img src="/src/assets/logo-educonnect.png" alt="EduConnect" className="w-8 h-8 object-contain" />
        </div>

        {/* LINKS DE NAVEGAÇÃO */}
        <nav className="flex flex-col items-center gap-2">
          <NavLink to="/feed" className={linkStyle} title={translate('home')}>
            <Home size={20} strokeWidth={1.8} />
          </NavLink>

          <NavLink to="/busca" className={linkStyle} title={translate('search')}>
            <Search size={20} strokeWidth={1.8} />
          </NavLink>

          {/* ROTA DINÂMICA DO PERFIL */}
          {userId ? (
            <NavLink to={`/perfil/${userId}`} className={linkStyle} title={translate('profile')}>
              <User size={20} strokeWidth={1.8} />
            </NavLink>
          ) : (
            <div className="flex items-center justify-center w-11 h-11 text-gray-300">
              <Loader2 size={20} className="animate-spin" />
            </div>
          )}
        </nav>
      </div>

      {/* Bloco Inferior: Configurações */}
      <div>
        <NavLink to="/configuracoes" className={linkStyle} title={translate('settings')}>
          <Settings size={20} strokeWidth={1.8} />
        </NavLink>
      </div>

    </aside>
  );
}