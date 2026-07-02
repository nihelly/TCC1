import { Bell, Mail, Plus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import GeometricBackground from '../components/GeometricBackground';

// Mapeamento de rota para título
const tituloPorRota = {
  '/feed': 'INÍCIO',
  '/busca': 'BUSCAR',
  '/mensagens': 'MENSAGENS',
  '/notificacoes': 'NOTIFICAÇÕES',
  '/configuracoes': 'CONFIGURAÇÕES',
  '/criar-post': 'NOVA PUBLICAÇÃO',
  '/criar-aviso': 'NOVO AVISO',
};

export function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Determina o título com base na rota atual
  const tituloAtual = tituloPorRota[location.pathname] || 
    (location.pathname.startsWith('/perfil') ? 'PERFIL' : 'EDUCONNECT');

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
                className="p-2.5 rounded-xl hover:bg-gray-50 transition-colors text-gray-600 cursor-pointer"
                title="Notificações"
              >
                <Bell size={18} strokeWidth={1.8} />
              </button>
              <button 
                onClick={() => navigate('/mensagens')} 
                className="p-2.5 rounded-xl hover:bg-gray-50 transition-colors text-gray-600 cursor-pointer"
                title="Mensagens"
              >
                <Mail size={18} strokeWidth={1.8} />
              </button>
              <button 
                onClick={() => navigate('/criar-post')} 
                className="p-2.5 rounded-xl hover:bg-gray-50 transition-colors text-gray-600 cursor-pointer"
                title="Nova publicação"
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
