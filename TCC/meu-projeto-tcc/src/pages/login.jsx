import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import GeometricBackground from '../components/GeometricBackground';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  // Estados adicionais para Cadastro
  const [isRegistering, setIsRegistering] = useState(false);
  const [nome, setNome] = useState('');
  const [matricula, setMatricula] = useState('');
  const [papel, setPapel] = useState('aluno');

  const lidarComSubmit = async (e) => {
    e.preventDefault();
    
    // Validação simples antes de chamar o banco
    if (!email || !senha) {
      toast.warning('Atenção', { description: 'Por favor, preencha todos os campos.' });
      return;
    }

    setCarregando(true);

    try {
      if (isRegistering) {
        if (!nome.trim() || !matricula.trim()) {
          toast.warning('Atenção', { description: 'Por favor, insira o seu nome e número de matrícula.' });
          setCarregando(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: senha,
          options: {
            data: {
              nome: nome.trim(),
              matricula: matricula.trim(),
              papel: papel
            }
          }
        });

        if (error) throw error;

        // O perfil automático será criado no useAuth ao fazer o primeiro login pós-confirmação
        toast.success('Cadastro solicitado! 📩', {
          description: 'Por favor, confirme o link de ativação enviado para o seu e-mail para ativar a conta.',
        });
        
        setIsRegistering(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: senha,
        });

        if (error) throw error;

        toast.message('Bem-vindo de volta ao EduConnect!');
        navigate('/feed');
      }
    } catch (error) {
      let desc = error.message;
      if (!isRegistering && error.message === 'Invalid login credentials') {
        desc = 'E-mail ou senha incorretos.';
      }
      toast.error(isRegistering ? 'Falha no cadastro' : 'Falha na autenticação', {
        description: desc,
      });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center p-4 relative">
      <GeometricBackground />
      {/* Card de login acima do fundo geométrico */}
      <div className="relative z-10 w-full max-w-[440px] bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.015)] border border-gray-100 p-10 flex flex-col items-center">
        
        {/* Logo EduConnect */}
        <div className="mb-6">
          <img src="/src/assets/logo-educonnect.png" alt="EduConnect" className="w-20 h-20 object-contain mx-auto" />
        </div>

        {/* Textos Principais */}
        <h1 className="text-[20px] font-bold text-gray-950 text-center mb-1 tracking-tight">
          {isRegistering ? 'Criar uma conta' : 'Seja bem-vindo ao EduConnect!'}
        </h1>
        <p className="text-[12px] text-gray-400 text-center mb-8 font-light">
          {isRegistering ? 'Preencha os dados abaixo para se cadastrar.' : 'por favor, insira a senha.'}
        </p>

        {/* Formulário */}
        <form onSubmit={lidarComSubmit} className="w-full space-y-4">
          
          {/* Campo Nome (Apenas Cadastro) */}
          {isRegistering && (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <label htmlFor="nomeInput" className="text-[12px] font-semibold text-gray-700 pl-1 block">
                Nome completo
              </label>
              <input
                id="nomeInput"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Ana Silva"
                className="w-full bg-[#fcfcfc] border border-gray-100 rounded-2xl py-3 px-4 text-[13px] text-gray-700 outline-none focus:bg-white focus:border-black transition-all"
              />
            </div>
          )}

          {/* Campo Matrícula (Apenas Cadastro) */}
          {isRegistering && (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <label htmlFor="matriculaInput" className="text-[12px] font-semibold text-gray-700 pl-1 block">
                Número de matrícula
              </label>
              <input
                id="matriculaInput"
                type="text"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                placeholder="Ex: 2026002"
                className="w-full bg-[#fcfcfc] border border-gray-100 rounded-2xl py-3 px-4 text-[13px] text-gray-700 outline-none focus:bg-white focus:border-black transition-all"
              />
            </div>
          )}

          {/* Campo Papel/Role (Apenas Cadastro) */}
          {isRegistering && (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <label htmlFor="papelSelect" className="text-[12px] font-semibold text-gray-700 pl-1 block">
                Papel acadêmico
              </label>
              <select
                id="papelSelect"
                value={papel}
                onChange={(e) => setPapel(e.target.value)}
                className="w-full bg-[#fcfcfc] border border-gray-100 rounded-2xl py-3 px-4 text-[13px] text-gray-700 outline-none focus:bg-white focus:border-black transition-all cursor-pointer"
              >
                <option value="aluno">Aluno (Estudante)</option>
                <option value="professor">Professor (Docente)</option>
              </select>
            </div>
          )}

          {/* E-mail */}
          <div className="space-y-1.5">
            <label htmlFor="emailInput" className="text-[12px] font-semibold text-gray-700 pl-1 block">
              E-mail
            </label>
            <input
              id="emailInput"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@gmail.com"
              className="w-full bg-[#fcfcfc] border border-gray-100 rounded-2xl py-3 px-4 text-[13px] text-gray-700 outline-none focus:bg-white focus:border-black transition-all"
            />
          </div>

          {/* Senha */}
          <div className="space-y-1.5">
            <label htmlFor="senhaInput" className="text-[12px] font-semibold text-gray-700 pl-1 block">
              Senha
            </label>
            <input
              id="senhaInput"
              name="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#fcfcfc] border border-gray-100 rounded-2xl py-3 px-4 text-[13px] text-gray-700 outline-none focus:bg-white focus:border-black transition-all"
            />
          </div>

          {/* Links Inferiores */}
          <div className="flex items-center justify-between text-[11px] text-gray-400 font-light px-1 pt-1">
            <span 
              className="cursor-pointer hover:text-gray-600 hover:underline transition-all" 
              onClick={() => navigate('/fluxo-senha')}
            >
              Esqueci minha senha
            </span>
            <span 
              className="cursor-pointer hover:text-gray-600 hover:underline transition-all font-semibold"
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? 'Já tenho conta: Entrar' : 'Não tenho conta: Cadastrar'}
            </span>
          </div>

          {/* Botão de Envio */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-white border border-black hover:bg-gray-50 text-gray-900 font-semibold py-3 rounded-2xl text-[13px] transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              {carregando ? (isRegistering ? 'Cadastrando...' : 'Entrando...') : (isRegistering ? 'Registrar' : 'Entrar')}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
