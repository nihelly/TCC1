import { useState } from 'react';
import { Globe } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../hooks/useLanguage';

const idiomasTraducao = [
  { code: 'pt', name: 'Português' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'ja', name: '日本語' },
  { code: 'zh-CN', name: '中文' },
  { code: 'ru', name: 'Русский' },
  { code: 'ar', name: 'العربية' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'ko', name: '한국어' }
];

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

export function TradutorInput({ value, onChange, placeholder, className, ...props }) {
  const { lang } = useLanguage();
  const [mostrarTradutor, setMostrarTradutor] = useState(false);
  const [idiomaDestino, setIdiomaDestino] = useState('en');
  const [traduzindo, setTraduzindo] = useState(false);

  const decodificarEntidadesHtml = (texto) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = texto;
    return txt.value;
  };

  const handleTraduzir = async (e) => {
    e.preventDefault();
    if (!value.trim()) {
      toast.warning("Digite um texto para traduzir!");
      return;
    }
    setTraduzindo(true);
    let sourceLang = langToCode[lang] || 'pt';
    let targetLang = idiomaDestino;

    if (sourceLang === targetLang) {
      if (targetLang === 'pt') {
        const cleanText = value.toLowerCase().replace(/[^\w\s]/g, '');
        const words = cleanText.split(/\s+/);
        const esWords = new Set(['el', 'la', 'los', 'las', 'en', 'para', 'con', 'no', 'un', 'una', 'es', 'usted', 'como', 'está', 'todo', 'bien', 'gracias', 'buenos', 'dias', 'buenas', 'tardes', 'noches']);
        let esCount = 0;
        for (const word of words) {
          if (esWords.has(word)) esCount++;
        }
        sourceLang = esCount > 0 ? 'es' : 'en';
      } else {
        sourceLang = 'pt';
      }
    }

    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(value)}&langpair=${sourceLang}|${targetLang}&de=suporte.educonnect@gmail.com`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Erro na rede");
      const data = await response.json();
      if (data && data.responseData && data.responseData.translatedText) {
        onChange(decodificarEntidadesHtml(data.responseData.translatedText));
        toast.success("Texto traduzido com sucesso!");
      } else {
        throw new Error("Erro ao obter tradução");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao traduzir o texto. Tente novamente.");
    } finally {
      setTraduzindo(false);
    }
  };

  return (
    <div className="w-full relative flex flex-col gap-1.5">
      <div className="relative flex items-center w-full">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${className} pr-10`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setMostrarTradutor(!mostrarTradutor)}
          className="absolute right-3 text-gray-400 hover:text-purple-650 transition-colors p-1 rounded-lg cursor-pointer"
          title="Traduzir texto"
        >
          <Globe size={15} />
        </button>
      </div>

      {mostrarTradutor && (
        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-purple-950/20 border border-gray-100 dark:border-purple-500/10 rounded-xl animate-in slide-in-from-top-2 duration-200">
          <select
            value={idiomaDestino}
            onChange={(e) => setIdiomaDestino(e.target.value)}
            className="bg-white dark:bg-[#151322] border border-gray-150 dark:border-purple-500/20 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-gray-700 dark:text-gray-200 outline-none cursor-pointer"
          >
            {idiomasTraducao.map(idioma => (
              <option key={idioma.code} value={idioma.code}>
                {idioma.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleTraduzir}
            disabled={traduzindo}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-705 text-white rounded-lg text-[10px] font-bold shadow-sm cursor-pointer disabled:opacity-50 transition-colors"
          >
            {traduzindo ? "..." : "Traduzir"}
          </button>
        </div>
      )}
    </div>
  );
}

export function TradutorTextArea({ value, onChange, placeholder, className, ...props }) {
  const { lang } = useLanguage();
  const [mostrarTradutor, setMostrarTradutor] = useState(false);
  const [idiomaDestino, setIdiomaDestino] = useState('en');
  const [traduzindo, setTraduzindo] = useState(false);

  const decodificarEntidadesHtml = (texto) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = texto;
    return txt.value;
  };

  const handleTraduzir = async (e) => {
    e.preventDefault();
    if (!value.trim()) {
      toast.warning("Digite um texto para traduzir!");
      return;
    }
    setTraduzindo(true);
    let sourceLang = langToCode[lang] || 'pt';
    let targetLang = idiomaDestino;

    if (sourceLang === targetLang) {
      if (targetLang === 'pt') {
        const cleanText = value.toLowerCase().replace(/[^\w\s]/g, '');
        const words = cleanText.split(/\s+/);
        const esWords = new Set(['el', 'la', 'los', 'las', 'en', 'para', 'con', 'no', 'un', 'una', 'es', 'usted', 'como', 'está', 'todo', 'bien', 'gracias', 'buenos', 'dias', 'buenas', 'tardes', 'noches']);
        let esCount = 0;
        for (const word of words) {
          if (esWords.has(word)) esCount++;
        }
        sourceLang = esCount > 0 ? 'es' : 'en';
      } else {
        sourceLang = 'pt';
      }
    }

    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(value)}&langpair=${sourceLang}|${targetLang}&de=suporte.educonnect@gmail.com`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Erro na rede");
      const data = await response.json();
      if (data && data.responseData && data.responseData.translatedText) {
        onChange(decodificarEntidadesHtml(data.responseData.translatedText));
        toast.success("Texto traduzido com sucesso!");
      } else {
        throw new Error("Erro ao obter tradução");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao traduzir o texto. Tente novamente.");
    } finally {
      setTraduzindo(false);
    }
  };

  return (
    <div className="w-full relative flex flex-col gap-1.5">
      <div className="relative w-full">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${className} pr-10`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setMostrarTradutor(!mostrarTradutor)}
          className="absolute right-3 bottom-3 text-gray-400 hover:text-purple-650 transition-colors p-1 rounded-lg cursor-pointer"
          title="Traduzir texto"
        >
          <Globe size={15} />
        </button>
      </div>

      {mostrarTradutor && (
        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-purple-950/20 border border-gray-100 dark:border-purple-500/10 rounded-xl animate-in slide-in-from-top-2 duration-200">
          <select
            value={idiomaDestino}
            onChange={(e) => setIdiomaDestino(e.target.value)}
            className="bg-white dark:bg-[#151322] border border-gray-150 dark:border-purple-500/20 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-gray-700 dark:text-gray-200 outline-none cursor-pointer"
          >
            {idiomasTraducao.map(idioma => (
              <option key={idioma.code} value={idioma.code}>
                {idioma.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleTraduzir}
            disabled={traduzindo}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-705 text-white rounded-lg text-[10px] font-bold shadow-sm cursor-pointer disabled:opacity-50 transition-colors"
          >
            {traduzindo ? "..." : "Traduzir"}
          </button>
        </div>
      )}
    </div>
  );
}
