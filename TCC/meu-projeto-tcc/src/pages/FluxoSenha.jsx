import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ShieldCheck, Lock, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import GeometricBackground from '../components/GeometricBackground';

export default function FluxoSenha() {
  const navigate = useNavigate();
  
  // Controle de estados do fluxo dinâmico
  const [passo, setPasso] = useState(1); // 1: E-mail, 2: Código, 3: Nova Senha
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  // Captura automática caso o usuário esteja logado e venha pelas Configurações
  useEffect(() => {
    async function checarUsuario() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setEmail(user.email);
        }
      } catch {
        console.log('Usuário não autenticado previamente (Acesso externo).');
      }
    }
    checarUsuario();
  }, []);

  // ETAPA 1: Enviar e-mail de recuperação com o Código
  const enviarCodigoVerificacao = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.warning('Atenção', { description: 'Por favor, insira seu e-mail institucional.' });
      return;
    }

    setCarregando(true);
    try {
      // Ajuste crucial de Redirecionamento configurado para evitar falhas do provedor
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/fluxo-senha`,
      });

      if (error) throw error;

      toast.success('Código enviado! 📩', {
        description: 'Verifique sua caixa de entrada e a pasta de spam.',
      });
      setPasso(2); // Avança para a etapa de inserção do código
    } catch (error) {
      toast.error('Não foi possível enviar', { 
        description: error.message || 'Verifique se o e-mail está correto ou tente mais tarde.' 
      });
    } finally {
      setCarregando(false);
    }
  };

  // ETAPA 2: Validar o Token / Código numérico
  const validarCodigoOtp = async (e) => {
    e.preventDefault();
    if (!codigo || codigo.length < 4) {
      toast.warning('Código incompleto', { description: 'Digite o código recebido no seu e-mail.' });
      return;
    }

    setCarregando(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: codigo,
        type: 'recovery',
      });

      if (error) throw error;

      toast.success('Identidade verificada! 🔓', {
        description: 'Agora insira sua nova credencial de acesso abaixo.',
      });
      setPasso(3); // Libera o formulário para criar a nova senha
    } catch {
      toast.error('Código inválido', { 
        description: 'O código inserido está incorreto ou já expirou.' 
      });
    } finally {
      setCarregando(false);
    }
  };

  // ETAPA 3: Salvar a Nova Senha no Supabase
  const salvarNovaSenha = async (e) => {
    e.preventDefault();
    if (!novaSenha || !confirmarSenha) {
      toast.warning('Campos vazios', { description: 'Preencha as senhas nos dois campos.' });
      return;
    }
    if (novaSenha.length < 6) {
      toast.warning('Senha muito curta', { description: 'A senha precisa conter ao menos 6 caracteres.' });
      return;
    }
    if (novaSenha !== confirmarSenha) {
      toast.error('Senhas divergentes', { description: 'A senha e a confirmação precisam ser idênticas.' });
      return;
    }

    setCarregando(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) throw error;

      toast.success('Senha redefinida com sucesso! 🎉', {
        description: 'Use suas novas credenciais no próximo login.',
      });

      // Redireciona de acordo com o status atual da sessão
      const { data: { session } } = await supabase.auth.getSession();
      navigate(session ? '/feed' : '/login');
    } catch (error) {
      toast.error('Erro ao atualizar', { description: error.message });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center p-4 animate-in fade-in duration-500 relative">
      <GeometricBackground />
      <div className="relative z-10 w-full max-w-[440px] bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.015)] border border-gray-100 p-10 flex flex-col items-center">
        
        {/* ÍCONE CENTRAL MUDANDO DE ACORDO COM O PASSO */}
        <div className="text-gray-800 mb-6 bg-gray-50 p-4 rounded-full border border-gray-100/50">
          {passo === 1 && <Mail size={36} strokeWidth={1.5} />}
          {passo === 2 && <ShieldCheck size={36} strokeWidth={1.5} className="text-blue-500" />}
          {passo === 3 && <Lock size={36} strokeWidth={1.5} className="text-green-500" />}
        </div>

        {/* CÓDIGO DE TEXTO DINÂMICO */}
        <h1 className="text-[20px] font-bold text-gray-950 text-center mb-1 tracking-tight">
          {passo === 1 && 'Verificar E-mail'}
          {passo === 2 && 'Inserir Código'}
          {passo === 3 && 'Nova Senha'}
        </h1>
        <p className="text-[12px] text-gray-400 text-center mb-8 font-light max-w-[290px]">
          {passo === 1 && 'Insira seu e-mail institucional para receber o código de verificação.'}
          {passo === 2 && `Enviamos o código de 6 dígitos de segurança para o e-mail: ${email}`}
          {passo === 3 && 'Escolha uma nova senha de acesso forte para proteger sua conta.'}
        </p>

        {/* RENDERIZAÇÃO CONDICIONAL DOS FORMULÁRIOS */}
        {passo === 1 && (
          <form onSubmit={enviarCodigoVerificacao} className="w-full space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="emailFluxo" className="text-[12px] font-semibold text-gray-700 pl-1 block">
                E-mail institucional
              </label>
              <input
                id="emailFluxo"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@conecta.com"
                className="w-full bg-[#fcfcfc] border border-gray-100 rounded-2xl py-3 px-4 text-[13px] text-gray-700 outline-none focus:bg-white focus:border-black transition-all"
              />
            </div>
            <button 
              type="submit" 
              disabled={carregando} 
              className="w-full bg-white border border-black hover:bg-gray-50 text-gray-900 font-medium py-3 rounded-2xl text-[13px] transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {carregando ? 'Enviando...' : 'Enviar código de verificação'}
            </button>
          </form>
        )}

        {passo === 2 && (
          <form onSubmit={validarCodigoOtp} className="w-full space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="codigoFluxo" className="text-[12px] font-semibold text-gray-700 pl-1 block">
                Código de 6 dígitos
              </label>
              <input
                id="codigoFluxo"
                type="text"
                maxLength={6}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="000000"
                className="w-full bg-[#fcfcfc] border border-gray-100 rounded-2xl py-3 px-4 text-center tracking-[0.5em] text-lg font-bold text-gray-800 outline-none focus:bg-white focus:border-black transition-all"
              />
            </div>
            <button 
              type="submit" 
              disabled={carregando} 
              className="w-full bg-white border border-black hover:bg-gray-50 text-gray-900 font-medium py-3 rounded-2xl text-[13px] transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {carregando ? 'Validando...' : 'Confirmar código'}
            </button>
            <button 
              type="button" 
              onClick={() => setPasso(1)} 
              className="text-[11px] text-gray-400 hover:text-gray-600 block mx-auto transition-colors mt-2"
            >
              E-mail incorreto? Corrigir
            </button>
          </form>
        )}

        {passo === 3 && (
          <form onSubmit={salvarNovaSenha} className="w-full space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="novaSenhaFluxo" className="text-[12px] font-semibold text-gray-700 pl-1 block">
                Nova Senha
              </label>
              <input
                id="novaSenhaFluxo"
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-[#fcfcfc] border border-gray-100 rounded-2xl py-3 px-4 text-[13px] text-gray-700 outline-none focus:bg-white focus:border-black transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="confirmarSenhaFluxo" className="text-[12px] font-semibold text-gray-700 pl-1 block">
                Confirmar Nova Senha
              </label>
              <input
                id="confirmarSenhaFluxo"
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full bg-[#fcfcfc] border border-gray-100 rounded-2xl py-3 px-4 text-[13px] text-gray-700 outline-none focus:bg-white focus:border-black transition-all"
              />
            </div>
            <button 
              type="submit" 
              disabled={carregando} 
              className="w-full bg-white border border-black hover:bg-gray-50 text-gray-900 font-medium py-3 rounded-2xl text-[13px] transition-all shadow-sm disabled:opacity-50 cursor-pointer mt-4"
            >
              {carregando ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </form>
        )}

        {/* BOTÃO VOLTAR */}
        {passo !== 3 && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-gray-600 text-[12px] mt-6 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Voltar</span>
          </button>
        )}

      </div>
    </div>
  );
}