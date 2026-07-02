import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

export default function CriarAviso() {
  const navigate = useNavigate();
  
  // Estados do formulário e controle
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [materia, setMateria] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [verificandoPapel, setVerificandoPapel] = useState(true);
  const [usuarioPerfil, setUsuarioPerfil] = useState(null);

  // Verifica se o usuário logado realmente é um professor
  useEffect(() => {
    async function verificarPermissao() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        const { data: perfil, error } = await supabase
          .from('profiles')
          .select('nome, papel')
          .eq('id', user.id)
          .single();

        if (error || !perfil || perfil.papel !== 'professor') {
          toast.error('Acesso negado: Apenas professores podem criar avisos.');
          navigate('/feed'); // Redireciona alunos invasores
          return;
        }

        setUsuarioPerfil(perfil);
      } catch (err) {
        console.error(err);
        navigate('/feed');
      } finally {
        setVerificandoPapel(false);
      }
    }
    verificarPermissao();
  }, [navigate]);

  async function handlePublicarAviso(e) {
    e.preventDefault();

    if (!titulo.trim() || !conteudo.trim() || !materia.trim()) {
      return toast.error('Por favor, preencha todos os campos do aviso.');
    }

    try {
      setEnviando(true);
      const { data: { user } } = await supabase.auth.getUser();

      const formatMateria = materia.trim().toUpperCase();
      const formatTitulo = titulo.trim();
      const titleEncoded = `AVISO:${formatMateria}:${formatTitulo}`;
      const autorHandle = usuarioPerfil?.nome 
        ? `@${usuarioPerfil.nome.toLowerCase().replace(/\s+/g, '')}` 
        : '@professor';

      const { error } = await supabase
        .from('posts')
        .insert([
          {
            user_id: user.id,
            title: titleEncoded,
            content: conteudo.trim(),
            author_handle: autorHandle,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;

      toast.success('Mural atualizado! Aviso publicado com sucesso.');
      navigate('/feed'); // Volta para a página principal para ver o aviso no mural
    } catch (err) {
      console.error(err);
      toast.error('Falha ao publicar aviso no sistema.');
    } finally {
      setEnviando(false);
    }
  }

  if (verificandoPapel) {
    return <div className="text-center py-20 text-gray-400 text-sm">Validando credenciais docentes...</div>;
  }

  return (
    <div className="w-full max-w-[600px] mx-auto space-y-8">
      
      {/* Botão de Voltar e Título */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer text-gray-500 hover:text-black"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-[13px] font-bold text-gray-950 tracking-widest uppercase flex items-center gap-2">
            <Megaphone size={16} className="text-black" /> NOVO AVISO AO MURAL
          </h1>
          <p className="text-[11px] text-gray-400 font-medium mt-0.5">Publicando como: {usuarioPerfil?.nome}</p>
        </div>
      </div>

      {/* Formulário de Criação */}
      <form onSubmit={handlePublicarAviso} className="bg-white border border-gray-100 rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.01)] space-y-5">
        
        {/* Campo Disciplina / Matéria */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-400 tracking-wider uppercase pl-1">Matéria / Disciplina</label>
          <input 
            type="text"
            placeholder="Ex: BANCO DE DADOS, ALGORITMOS..."
            value={materia}
            onChange={(e) => setMateria(e.target.value.toUpperCase())} // Sempre caixa alta para o padrão do design
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[12px] font-semibold text-gray-800 outline-none focus:border-gray-300 transition-colors"
          />
        </div>

        {/* Campo Título */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-400 tracking-wider uppercase pl-1">Título do Aviso</label>
          <input 
            type="text"
            placeholder="Ex: Prova adiada, Material disponível..."
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[13px] font-bold text-gray-950 outline-none focus:border-gray-300 transition-colors placeholder:font-normal"
          />
        </div>

        {/* Campo Conteúdo detalhado */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-400 tracking-wider uppercase pl-1">Conteúdo do Informativo</label>
          <textarea 
            rows={4}
            placeholder="Digite os detalhes do comunicado para os alunos..."
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-[12px] text-gray-600 font-light leading-relaxed outline-none resize-none focus:border-gray-300 transition-colors"
          />
        </div>

        {/* Botão de Envio */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-black text-white py-3.5 rounded-xl text-[12px] font-bold tracking-wider uppercase hover:bg-gray-900 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {enviando ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Disparando Comunicado...</span>
              </>
            ) : (
              <span>Publicar no Mural</span>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}