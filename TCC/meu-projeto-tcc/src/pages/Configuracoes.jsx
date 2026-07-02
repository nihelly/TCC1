import { useState, useEffect } from 'react';
import { 
  Shield, 
  Lock, 
  Moon, 
  Accessibility, 
  LogOut, 
  ChevronDown, 
  ChevronUp, 
  Key, 
  Globe,
  Mail,
  UserCheck,
  EyeOff,
  Type
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '../hooks/useLanguage';

// COMPONENTE DE SELEÇÃO PREMIUM (CUSTOM TOGGLE SWITCH)
const CustomToggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    className={`w-12 h-6 rounded-full p-0.5 transition-all duration-300 focus:outline-none relative cursor-pointer flex items-center ${
      checked 
        ? 'bg-gradient-to-tr from-[#3b82f6] to-[#8b5cf6] shadow-md shadow-blue-500/10' 
        : 'bg-gray-200 dark:bg-[#1f1d2e] border border-gray-300/40 dark:border-purple-950/20'
    }`}
  >
    <span
      className={`w-5 h-5 rounded-full bg-white shadow-md block transition-transform duration-300 ${
        checked ? 'translate-x-6' : 'translate-x-0'
      }`}
    />
  </button>
);

export default function Configuracoes() {
  const navigate = useNavigate();
  const { translate } = useLanguage();
  const [abaAberta, setAbaAberta] = useState(null);

  // Estados dos Toggles com persistência no LocalStorage
  const [verificacaoDuasEtapas, setVerificacaoDuasEtapas] = useState(() => {
    return localStorage.getItem('educonnect-2fa') === 'true';
  });
  const [contaPrivada, setContaPrivada] = useState(() => {
    return localStorage.getItem('educonnect-private') === 'true';
  });
  const [ocultarAtividade, setOcultarAtividade] = useState(() => {
    return localStorage.getItem('educonnect-hide-active') === 'true';
  });
  const [modoNocturno, setModoNocturno] = useState(() => {
    return localStorage.getItem('educonnect-dark-mode') === 'true';
  });
  const [altoContraste, setAltoContraste] = useState(() => {
    return localStorage.getItem('educonnect-high-contrast') === 'true';
  });

  // Tamanho da fonte e idioma
  const [tamanhoFonte, setTamanhoFonte] = useState(() => {
    return localStorage.getItem('educonnect-font-size') || 'media';
  });
  const [mencoes, setMencoes] = useState(() => {
    return localStorage.getItem('educonnect-mentions') || 'Todos';
  });
  const [idioma, setIdioma] = useState(() => {
    return localStorage.getItem('educonnect-lang') || 'Português (BR)';
  });
  const [emailRecuperacao, setEmailRecuperacao] = useState(() => {
    return localStorage.getItem('educonnect-recovery-email') || '';
  });

  // Salva Toggles no LocalStorage ao mudar
  useEffect(() => {
    localStorage.setItem('educonnect-2fa', String(verificacaoDuasEtapas));
  }, [verificacaoDuasEtapas]);

  useEffect(() => {
    localStorage.setItem('educonnect-private', String(contaPrivada));
  }, [contaPrivada]);

  useEffect(() => {
    localStorage.setItem('educonnect-hide-active', String(ocultarAtividade));
  }, [ocultarAtividade]);

  // Efeito que aplica/remove a classe 'dark' no HTML
  useEffect(() => {
    if (modoNocturno) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('educonnect-dark-mode', String(modoNocturno));
  }, [modoNocturno]);

  // Efeito para aplicar Alto Contraste
  useEffect(() => {
    if (altoContraste) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    localStorage.setItem('educonnect-high-contrast', String(altoContraste));
  }, [altoContraste]);

  // Efeito para ajustar tamanho global da fonte do HTML (Acessibilidade Real)
  useEffect(() => {
    localStorage.setItem('educonnect-font-size', tamanhoFonte);
    const root = document.documentElement;
    if (tamanhoFonte === 'pequena') {
      root.style.fontSize = '14px';
    } else if (tamanhoFonte === 'grande') {
      root.style.fontSize = '18px';
    } else {
      root.style.fontSize = '16px';
    }
  }, [tamanhoFonte]);

  const alternarAba = (nomeAba) => {
    setAbaAberta(abaAberta === nomeAba ? null : nomeAba);
  };

  const salvarEmail = (valor) => {
    setEmailRecuperacao(valor);
    localStorage.setItem('educonnect-recovery-email', valor);
  };

  const lidarComSair = async () => {
    const confirmar = window.confirm("Deseja realmente sair da conta?");
    if (confirmar) {
      await supabase.auth.signOut();
      navigate('/');
    }
  };

  return (
    <div className="max-w-[700px] mx-auto pt-4 pb-20 px-4 animate-in fade-in duration-500">
      
      {/* Título Superior */}
      <h1 className="text-center text-[12px] font-bold tracking-[0.3em] text-gray-800 dark:text-gray-200 uppercase mb-10">
        {translate('settingsTitle')}
      </h1>

      <div className="space-y-4">
        
        {/* ================= SEÇÃO: SEGURANÇA ================= */}
        <div className="bg-white dark:bg-[#0c0b12] rounded-[2rem] shadow-[0_4px_25px_rgba(0,0,0,0.005)] border border-gray-100 dark:border-purple-500/10 overflow-hidden transition-all duration-300">
          <button 
            onClick={() => alternarAba('seguranca')}
            className={`w-full flex items-center justify-between p-6 text-left transition-colors cursor-pointer ${
              abaAberta === 'seguranca' 
                ? 'bg-gray-50/50 dark:bg-[#151322]/20' 
                : 'hover:bg-gray-50/30 dark:hover:bg-[#151322]/10'
            }`}
          >
            <div className="flex items-center gap-3.5 text-gray-800 dark:text-gray-100 font-semibold text-[13.5px]">
              <div className="p-2 bg-blue-500/10 text-[#3b82f6] rounded-xl">
                <Shield size={16} />
              </div>
              <span>{translate('security')}</span>
            </div>
            {abaAberta === 'seguranca' ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>
          
          {abaAberta === 'seguranca' && (
            <div className="p-6 bg-white dark:bg-[#0c0b12] border-t border-gray-100 dark:border-purple-500/5 space-y-5 animate-in slide-in-from-top-2 duration-300">
              
              {/* Alterar Senha */}
              <div className="flex items-center justify-between text-[13px]">
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                  <Key size={16} className="text-gray-400" />
                  <span>{translate('changePassword')}</span>
                </div>
                <button 
                  onClick={() => {
                    navigate('/fluxo-senha');
                    toast.info("Redirecionando para fluxo de recuperação de senha.");
                  }}
                  className="bg-white hover:bg-gray-50 dark:bg-gray-800/50 dark:hover:bg-gray-800 border border-gray-200 dark:border-purple-500/10 px-4 py-1.5 rounded-xl font-bold text-gray-700 dark:text-gray-300 text-[11px] transition-colors cursor-pointer"
                >
                  {translate('changePassword') ? 'alterar' : 'change'}
                </button>
              </div>

              {/* Verificação em duas etapas */}
              <div className="flex items-center justify-between text-[13px]">
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                  <Lock size={16} className="text-gray-400" />
                  <span>{translate('twoFactor')}</span>
                </div>
                <CustomToggle 
                  checked={verificacaoDuasEtapas} 
                  onChange={() => {
                    setVerificacaoDuasEtapas(!verificacaoDuasEtapas);
                    toast.success(verificacaoDuasEtapas ? "Autenticação 2FA desativada." : "Autenticação 2FA ativada com sucesso!");
                  }} 
                />
              </div>

              {/* E-mail de recuperação */}
              <div className="flex items-center justify-between text-[13px]">
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                  <Mail size={16} className="text-gray-400" />
                  <span>{translate('recoveryEmail')}</span>
                </div>
                <input 
                  type="email" 
                  value={emailRecuperacao}
                  onChange={(e) => salvarEmail(e.target.value)}
                  placeholder="seu@email.com" 
                  className="bg-white dark:bg-[#12101b] border border-gray-200 dark:border-purple-500/10 rounded-xl px-4 py-2 text-[12px] text-gray-800 dark:text-gray-300 outline-none w-52 focus:border-purple-500/25 transition-all text-right"
                />
              </div>
            </div>
          )}
        </div>

        {/* ================= SEÇÃO: PRIVACIDADE ================= */}
        <div className="bg-white dark:bg-[#0c0b12] rounded-[2rem] shadow-[0_4px_25px_rgba(0,0,0,0.005)] border border-gray-100 dark:border-purple-500/10 overflow-hidden transition-all duration-300">
          <button 
            onClick={() => alternarAba('privacidade')}
            className={`w-full flex items-center justify-between p-6 text-left transition-colors cursor-pointer ${
              abaAberta === 'privacidade' 
                ? 'bg-gray-50/50 dark:bg-[#151322]/20' 
                : 'hover:bg-gray-50/30 dark:hover:bg-[#151322]/10'
            }`}
          >
            <div className="flex items-center gap-3.5 text-gray-800 dark:text-gray-100 font-semibold text-[13.5px]">
              <div className="p-2 bg-purple-500/10 text-[#8b5cf6] rounded-xl">
                <Lock size={16} />
              </div>
              <span>{translate('privacy')}</span>
            </div>
            {abaAberta === 'privacidade' ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>
          
          {abaAberta === 'privacidade' && (
            <div className="p-6 bg-white dark:bg-[#0c0b12] border-t border-gray-100 dark:border-purple-500/5 space-y-5 animate-in slide-in-from-top-2 duration-300">
              
              {/* Conta Privada */}
              <div className="flex items-center justify-between text-[13px]">
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                  <EyeOff size={16} className="text-gray-400" />
                  <span>{translate('privateAccount')}</span>
                </div>
                <CustomToggle 
                  checked={contaPrivada} 
                  onChange={() => {
                    setContaPrivada(!contaPrivada);
                    toast.success(contaPrivada ? "Sua conta agora é pública." : "Sua conta agora é privada.");
                  }} 
                />
              </div>

              {/* Ocultar minha atividade */}
              <div className="flex items-center justify-between text-[13px]">
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                  <UserCheck size={16} className="text-gray-400" />
                  <span>{translate('hideActivity')}</span>
                </div>
                <CustomToggle 
                  checked={ocultarAtividade} 
                  onChange={() => {
                    setOcultarAtividade(!ocultarAtividade);
                    toast.info(ocultarAtividade ? "Seu status de atividade agora está visível." : "Status de atividade ocultado.");
                  }} 
                />
              </div>

              {/* Quem pode me mencionar */}
              <div className="flex items-center justify-between text-[13px] pt-1">
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                  <Accessibility size={16} className="text-gray-400" />
                  <span>{translate('whoMention')}</span>
                </div>
                <select 
                  value={mencoes}
                  onChange={(e) => {
                    setMencoes(e.target.value);
                    localStorage.setItem('educonnect-mentions', e.target.value);
                    toast.success(`Preferência de menções salva: ${e.target.value}`);
                  }}
                  className="bg-white dark:bg-[#12101b] border border-gray-200 dark:border-purple-500/10 rounded-xl px-3 py-2 text-[12px] text-gray-800 dark:text-gray-350 outline-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-850 transition-colors"
                >
                  <option className="bg-white text-gray-800 dark:bg-[#12101b] dark:text-gray-100" value="Todos">{translate('all')}</option>
                  <option className="bg-white text-gray-800 dark:bg-[#12101b] dark:text-gray-100" value="Seguidores">{translate('onlyFollowers')}</option>
                  <option className="bg-white text-gray-800 dark:bg-[#12101b] dark:text-gray-100" value="Ninguem">{translate('nobody')}</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ================= SEÇÃO: MODO NOTURNO ================= */}
        <div className="bg-white dark:bg-[#0c0b12] rounded-[2rem] shadow-[0_4px_25px_rgba(0,0,0,0.005)] border border-gray-100 dark:border-purple-500/10 overflow-hidden transition-all duration-300">
          <div className="w-full flex items-center justify-between p-6">
            <div className="flex items-center gap-3.5 text-gray-800 dark:text-gray-100 font-semibold text-[13.5px]">
              <div className="p-2 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-xl">
                <Moon size={16} />
              </div>
              <span>{translate('nightMode')}</span>
            </div>
            <CustomToggle 
              checked={modoNocturno} 
              onChange={() => setModoNocturno(!modoNocturno)} 
            />
          </div>
        </div>

        {/* ================= SEÇÃO: ACESSIBILIDADE ================= */}
        <div className="bg-white dark:bg-[#0c0b12] rounded-[2rem] shadow-[0_4px_25px_rgba(0,0,0,0.005)] border border-gray-100 dark:border-purple-500/10 overflow-hidden transition-all duration-300">
          <button 
            onClick={() => alternarAba('acessibilidade')}
            className={`w-full flex items-center justify-between p-6 text-left transition-colors cursor-pointer ${
              abaAberta === 'acessibilidade' 
                ? 'bg-gray-50/50 dark:bg-[#151322]/20' 
                : 'hover:bg-gray-50/30 dark:hover:bg-[#151322]/10'
            }`}
          >
            <div className="flex items-center gap-3.5 text-gray-800 dark:text-gray-100 font-semibold text-[13.5px]">
              <div className="p-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl">
                <Accessibility size={16} />
              </div>
              <span>{translate('accessibility')}</span>
            </div>
            {abaAberta === 'acessibilidade' ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>
          
          {abaAberta === 'acessibilidade' && (
            <div className="p-6 bg-white dark:bg-[#0c0b12] border-t border-gray-100 dark:border-purple-500/5 space-y-6 animate-in slide-in-from-top-2 duration-300">
              
              {/* Alto Contraste */}
              <div className="flex items-center justify-between text-[13px]">
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                  <Accessibility size={16} className="text-gray-400" />
                  <span>{translate('highContrast')}</span>
                </div>
                <CustomToggle 
                  checked={altoContraste} 
                  onChange={() => setAltoContraste(!altoContraste)} 
                />
              </div>

              {/* Tamanho da Fonte */}
              <div className="space-y-3">
                <span className="text-[11px] text-gray-400 font-medium block">{translate('textSize')}</span>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'pequena', label: translate('small') },
                    { id: 'media', label: translate('medium') },
                    { id: 'grande', label: translate('large') }
                  ].map((fonte) => (
                    <button
                      key={fonte.id}
                      onClick={() => setTamanhoFonte(fonte.id)}
                      className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer
                        ${tamanhoFonte === fonte.id 
                          ? 'border-purple-500 bg-purple-500/5 text-[#8b5cf6] font-semibold' 
                          : 'border-gray-200 dark:border-purple-500/10 bg-white dark:bg-[#12101b] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                    >
                      <Type size={fonte.id === 'pequena' ? 12 : fonte.id === 'media' ? 15 : 18} />
                      <span className="text-[10px]">{fonte.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Idioma */}
              <div className="flex items-center justify-between text-[13px] pt-3 border-t border-gray-100 dark:border-purple-500/5">
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                  <Globe size={16} className="text-gray-400" />
                  <span>{translate('systemLanguage')}</span>
                </div>
                <select 
                  value={idioma}
                  onChange={(e) => {
                    setIdioma(e.target.value);
                    localStorage.setItem('educonnect-lang', e.target.value);
                    window.dispatchEvent(new Event('educonnect-language-change'));
                    const confirmations = {
                      'Português (BR)': `Idioma alterado para: ${e.target.value}`,
                      'English': `Language changed to: ${e.target.value}`,
                      'Español': `Idioma cambiado a: ${e.target.value}`,
                      'Français': `Langue changée en: ${e.target.value}`,
                      'Deutsch': `Sprache geändert auf: ${e.target.value}`,
                      'Italiano': `Lingua cambiata in: ${e.target.value}`,
                      '日本語': `言語が ${e.target.value} に変更されました`,
                      '中文': `语言已更改为：${e.target.value}`,
                      'Русский': `Язык изменен на: ${e.target.value}`,
                      'العربية': `تم تغيير اللغة إلى: ${e.target.value}`,
                      'हिन्दी': `भाषा बदलकर ${e.target.value} कर दी गई है`,
                      '한국어': `언어가 ${e.target.value}로 변경되었습니다`
                    };
                    toast.info(confirmations[e.target.value] || `Idioma alterado para: ${e.target.value}`);
                  }}
                  className="bg-white dark:bg-[#12101b] border border-gray-200 dark:border-purple-500/10 rounded-xl px-3 py-2 text-[12px] text-gray-800 dark:text-gray-350 outline-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-850 transition-colors"
                >
                  <option className="bg-white text-gray-800 dark:bg-[#12101b] dark:text-gray-100" value="Português (BR)">Português (BR)</option>
                  <option className="bg-white text-gray-800 dark:bg-[#12101b] dark:text-gray-100" value="English">English</option>
                  <option className="bg-white text-gray-800 dark:bg-[#12101b] dark:text-gray-100" value="Español">Español</option>
                  <option className="bg-white text-gray-800 dark:bg-[#12101b] dark:text-gray-100" value="Français">Français</option>
                  <option className="bg-white text-gray-800 dark:bg-[#12101b] dark:text-gray-100" value="Deutsch">Deutsch</option>
                  <option className="bg-white text-gray-800 dark:bg-[#12101b] dark:text-gray-100" value="Italiano">Italiano</option>
                  <option className="bg-white text-gray-800 dark:bg-[#12101b] dark:text-gray-100" value="日本語">日本語</option>
                  <option className="bg-white text-gray-800 dark:bg-[#12101b] dark:text-gray-100" value="中文">中文</option>
                  <option className="bg-white text-gray-800 dark:bg-[#12101b] dark:text-gray-100" value="Русский">Русский</option>
                  <option className="bg-white text-gray-800 dark:bg-[#12101b] dark:text-gray-100" value="العربية">العربية</option>
                  <option className="bg-white text-gray-800 dark:bg-[#12101b] dark:text-gray-100" value="हिन्दी">हिन्दी</option>
                  <option className="bg-white text-gray-800 dark:bg-[#12101b] dark:text-gray-100" value="한국어">한국어</option>
                </select>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Botão Sair da Conta */}
      <div className="mt-12 flex justify-center">
        <button 
          onClick={lidarComSair}
          className="flex items-center gap-2 text-red-500 font-semibold text-[13px] hover:text-red-600 hover:underline transition-all cursor-pointer"
        >
          <span>{translate('logout')}</span>
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}