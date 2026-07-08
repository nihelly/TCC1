import { useState, useEffect } from 'react';
import { Megaphone, GraduationCap, Plus, X, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { toast } from 'sonner';

const dictModal = {
  'Português (BR)': {
    close: 'Fechar',
    details: 'Detalhes do Aviso',
    by: 'Postado por'
  },
  'English': {
    close: 'Close',
    details: 'Announcement Details',
    by: 'Posted by'
  },
  'Español': {
    close: 'Cerrar',
    details: 'Detalles del Aviso',
    by: 'Publicado por'
  },
  'Français': {
    close: 'Fermer',
    details: 'Détails de l\'annonce',
    by: 'Publié par'
  },
  'Deutsch': {
    close: 'Schließen',
    details: 'Details zur Ankündigung',
    by: 'Veröffentlicht von'
  },
  'Italiano': {
    close: 'Chiudi',
    details: 'Dettagli dell\'Annuncio',
    by: 'Pubblicato da'
  },
  '日本語': {
    close: '閉じる',
    details: 'お知らせの詳細',
    by: '投稿者'
  },
  '中文': {
    close: '关闭',
    details: '公告详情',
    by: '发布者'
  },
  'Русский': {
    close: 'Закрыть',
    details: 'Детали объявления',
    by: 'Опубликовано'
  },
  'العربية': {
    close: 'إغلاق',
    details: 'تفاصيل الإعلان',
    by: 'نشر بواسطة'
  },
  'हिन्दी': {
    close: 'बंद करें',
    details: 'घोषणा विवरण',
    by: 'द्वारा पोस्ट किया गया'
  },
  '한국어': {
    close: '닫기',
    details: '공지 사항 상세 정보',
    by: '게시자'
  }
};

const langToCode = {
  'Português (BR)': 'pt',
  'English': 'en',
  'Español': 'es',
  'Français': 'fr',
  'Deutsch': 'de',
  'Italiano': 'it',
  '日本語': 'ja',
  '中文': 'zh-CN',
  'Русский': 'ru',
  'العربية': 'ar',
  'हिन्दी': 'hi',
  '한국어': 'ko'
};

export function Anuncios() {
  const navigate = useNavigate();
  const { ehProfessor } = useAuth();
  const { translate, lang } = useLanguage();
  const [professores, setProfessores] = useState([]);
  const [anuncios, setAnuncios] = useState([]);
  const [avisoSelecionado, setAvisoSelecionado] = useState(null);
  
  const [avisoTraduzido, setAvisoTraduzido] = useState(null);
  const [traduzindoAviso, setTraduzindoAviso] = useState(false);

  const t = (key) => {
    return (dictModal[lang] || dictModal['English'])[key];
  };

  const toggleTraducaoAviso = async () => {
    if (avisoTraduzido) {
      setAvisoTraduzido(null);
      return;
    }

    if (!avisoSelecionado) return;

    setTraduzindoAviso(true);
    const targetLangCode = langToCode[lang] || 'pt';

    // Heurística de idioma de origem para o aviso
    let sourceLangCode = 'pt';
    if (targetLangCode === 'pt') {
      const cleanText = (avisoSelecionado.titulo + " " + avisoSelecionado.descricao).toLowerCase().replace(/[^\w\s]/g, '');
      const words = cleanText.split(/\s+/);
      const enWords = new Set(['the', 'of', 'to', 'and', 'a', 'in', 'is', 'it', 'you', 'that', 'for', 'on', 'are', 'as', 'with', 'they', 'i', 'hello', 'how', 'good', 'morning', 'afternoon', 'night']);
      const esWords = new Set(['el', 'la', 'los', 'las', 'en', 'para', 'con', 'no', 'un', 'una', 'es', 'usted', 'como', 'está', 'todo', 'bien', 'gracias', 'buenos', 'dias', 'buenas', 'tardes', 'noches']);
      
      let enCount = 0;
      let esCount = 0;
      for (const word of words) {
        if (enWords.has(word)) enCount++;
        if (esWords.has(word)) esCount++;
      }
      sourceLangCode = esCount > enCount ? 'es' : 'en';
    } else {
      sourceLangCode = 'pt';
    }

    if (sourceLangCode === targetLangCode) {
      toast.info("O aviso já está no seu idioma!");
      setTraduzindoAviso(false);
      return;
    }

    try {
      // Traduzir Título
      const urlTitulo = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(avisoSelecionado.titulo)}&langpair=${sourceLangCode}|${targetLangCode}&de=suporte.educonnect@gmail.com`;
      const resTitulo = await fetch(urlTitulo);
      const dataTitulo = await resTitulo.json();
      const tituloTraduzido = dataTitulo?.responseData?.translatedText || avisoSelecionado.titulo;

      // Traduzir Descrição
      const urlDesc = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(avisoSelecionado.descricao)}&langpair=${sourceLangCode}|${targetLangCode}&de=suporte.educonnect@gmail.com`;
      const resDesc = await fetch(urlDesc);
      const dataDesc = await resDesc.json();
      const descTraduzida = dataDesc?.responseData?.translatedText || avisoSelecionado.descricao;

      const decodificarEntidadesHtml = (texto) => {
        const txt = document.createElement('textarea');
        txt.innerHTML = texto;
        return txt.value;
      };

      setAvisoTraduzido({
        titulo: decodificarEntidadesHtml(tituloTraduzido),
        descricao: decodificarEntidadesHtml(descTraduzida)
      });
      toast.success("Aviso traduzido!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao traduzir o aviso.");
    } finally {
      setTraduzindoAviso(false);
    }
  };

  useEffect(() => {
    async function carregarDados() {
      // Buscar professores reais
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, nome, avatar_url')
        .eq('papel', 'professor')
        .limit(6);

      if (profs) setProfessores(profs);

      // Buscar anúncios reais (posts com título AVISO:)
      const { data: avisosData } = await supabase
        .from('posts')
        .select('id, title, content, author_handle, created_at')
        .like('title', 'AVISO:%')
        .order('created_at', { ascending: false })
        .limit(5);

      if (avisosData) {
        const formatted = avisosData.map(post => {
          const partes = post.title.split(':');
          let materia = 'INFO';
          let titulo = post.title;
          if (partes.length >= 3) {
            materia = partes[1];
            titulo = partes.slice(2).join(':');
          } else if (partes.length === 2) {
            titulo = partes[1];
          }
          return { id: post.id, titulo, materia, descricao: post.content, professor: post.author_handle };
        });
        setAnuncios(formatted);
      }
    }
    carregarDados();
  }, []);

  return (
    <div className="space-y-6">
      {/* Professores */}
      {professores.length > 0 && (
        <div className="bg-white border border-gray-100 dark:border-purple-500/10 rounded-[1.5rem] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.02)] dark:bg-[#151322] space-y-3">
          <h3 className="text-[10px] font-bold text-gray-400 tracking-wider uppercase flex items-center gap-1.5 px-1">
            <GraduationCap size={13} /> {translate('teacher')}
          </h3>
          <div className="flex items-center gap-2.5 overflow-x-auto py-1 scrollbar-none">
            {professores.map(prof => (
              <button 
                key={prof.id} 
                onClick={() => navigate(`/perfil/${prof.id}`)}
                className="w-10 h-10 rounded-full border-2 border-purple-500/25 flex-shrink-0 flex items-center justify-center bg-gray-50 hover:bg-gray-100 dark:bg-purple-950/20 dark:hover:bg-purple-900/30 overflow-hidden transition-all cursor-pointer"
                title={prof.nome}
              >
                {prof.avatar_url ? (
                   <img src={prof.avatar_url} alt={prof.nome} className="w-full h-full object-cover" />
                ) : (
                  <GraduationCap size={16} className="text-gray-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Anúncios */}
      <div className="bg-white border border-gray-100 dark:border-purple-500/10 rounded-[1.5rem] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.02)] dark:bg-[#151322]">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-[10px] font-bold text-gray-400 tracking-wider uppercase flex items-center gap-1.5">
            <Megaphone size={12} /> {translate('muralTitle')}
          </h3>
          {ehProfessor && (
            <button
              onClick={() => navigate('/criar-aviso')}
              className="p-1 text-gray-400 hover:text-black dark:hover:text-white rounded-lg cursor-pointer"
            >
              <Plus size={14} />
            </button>
          )}
        </div>
        <div className="space-y-3">
          {anuncios.length > 0 ? (
            anuncios.map(a => (
              <div 
                key={a.id} 
                onClick={() => setAvisoSelecionado(a)}
                className="border-l-2 border-purple-400 pl-3 space-y-0.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-purple-950/20 py-1.5 px-2 rounded-r-xl transition-all"
              >
                <span className="text-[9px] font-bold text-purple-600 uppercase tracking-wider">{a.materia}</span>
                <p className="text-[11px] font-semibold text-gray-900 dark:text-gray-100 leading-tight">{a.titulo}</p>
                <span className="text-[9px] text-gray-400">{a.professor}</span>
              </div>
            ))
          ) : (
            <p className="text-[11px] text-gray-400 italic text-center py-3">{translate('noAnnouncements')}</p>
          )}
        </div>
      </div>

      {/* Modal de Detalhes do Aviso */}
      {avisoSelecionado && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151322] border border-gray-100 dark:border-purple-500/10 rounded-[1.8rem] max-w-md w-full p-6 shadow-xl relative animate-in fade-in-50 zoom-in-95 duration-200">
            {/* Botão Fechar superior */}
            <button
              onClick={() => { setAvisoSelecionado(null); setAvisoTraduzido(null); }}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
            >
              <X size={16} />
            </button>

            {/* Categoria/Matéria */}
            <span className="px-2.5 py-1 text-[9px] font-extrabold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 rounded-full uppercase tracking-wider">
              {avisoSelecionado.materia}
            </span>

            {/* Título */}
            <h2 className="text-base font-bold text-gray-900 dark:text-white mt-4 mb-1">
              {avisoTraduzido ? avisoTraduzido.titulo : avisoSelecionado.titulo}
            </h2>

            {/* Autor/Professor e Ação de Tradução */}
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-gray-400 font-medium">
                {t('by')}: <span className="text-purple-500">{avisoSelecionado.professor}</span>
              </p>
              <button
                onClick={toggleTraducaoAviso}
                disabled={traduzindoAviso}
                className="flex items-center gap-1 text-[10px] text-purple-600 dark:text-purple-400 hover:text-purple-750 dark:hover:text-purple-300 font-bold transition-colors cursor-pointer"
                title="Traduzir aviso"
              >
                <Globe size={11} className={traduzindoAviso ? "animate-spin" : ""} />
                {traduzindoAviso ? "..." : (avisoTraduzido ? "Ver Original" : "Traduzir")}
              </button>
            </div>

            {/* Linha Divisória */}
            <div className="border-b border-gray-150 dark:border-purple-500/10 my-4" />

            {/* Conteúdo */}
            <div className="max-h-[250px] overflow-y-auto pr-1">
              <p className="text-[12.5px] text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {avisoTraduzido ? avisoTraduzido.descricao : avisoSelecionado.descricao}
              </p>
              {avisoTraduzido && (
                <span className="text-[9px] text-gray-400 italic block mt-2">
                  * Traduzido automaticamente para o idioma do seu sistema
                </span>
              )}
            </div>

            {/* Rodapé */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => { setAvisoSelecionado(null); setAvisoTraduzido(null); }}
                className="px-5 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md shadow-purple-500/10 cursor-pointer transition-all"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}