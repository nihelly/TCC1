import { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Send, MessageSquare, Search, Phone, Video, 
  Paperclip, Smile, Mic, X, Camera, CameraOff, MicOff, Ban,
  Trash2, Globe, ChevronDown, MoreHorizontal, Sparkles, Wand2,
  Layers, Image, RotateCw, Volume2
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { useLanguage } from '../hooks/useLanguage';

export default function Mensagens() {
  const { translate } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const lastDestinatarioIdRef = useRef(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioStreamRef = useRef(null);
  const deveEnviarAudioRef = useRef(false);
  const audioElementsRef = useRef({});
  const [duracaoAudio, setDuracaoAudio] = useState({});

  const [me, setMe] = useState(null);
  const [usuarios, setUsuarios] = useState([]); // Lista de contatos
  const [destinatario, setDestinatario] = useState(null); // Contato selecionado
  const [mensagens, setMensagens] = useState([]);
  const [novoTexto, setNovoTexto] = useState('');
  const [filtro, setFiltro] = useState(''); // Filtro de busca

  // Estados extras de Mensageria
  const [mostrarEmojis, setMostrarEmojis] = useState(false);
  const [gravandoAudio, setGravandoAudio] = useState(false);
  const [tempoGravacao, setTempoGravacao] = useState(0);
  const [chamadaAtiva, setChamadaAtiva] = useState(null); // { type: 'audio'|'video', user: obj, status: 'calling'|'connected', seconds: 0 }
  const [enviandoImagem, setEnviandoImagem] = useState(false);

  // Estados de controle de mídia na chamada
  const [videoLigado, setVideoLigado] = useState(true);
  const [micLigado, setMicLigado] = useState(true);
  const [localStream, setLocalStream] = useState(null);

  const emojisPopulares = ['👍', '❤️', '😂', '🔥', '👏', '😮', '😢', '🚀', '🎓', '📖', '🎉', '💡'];

  const [mostrarTradutor, setMostrarTradutor] = useState(false);
  const [idiomaDestino, setIdiomaDestino] = useState('en');
  const [traduzindo, setTraduzindo] = useState(false);

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

  const decodificarEntidadesHtml = (texto) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = texto;
    return txt.value;
  };

  const handleTraduzirTexto = async () => {
    if (!novoTexto.trim()) {
      toast.warning("Digite um texto para traduzir!");
      return;
    }
    setTraduzindo(true);
    let sourceLang = langToCode[lang] || 'pt';
    let targetLang = idiomaDestino;

    if (sourceLang === targetLang) {
      if (targetLang === 'pt') {
        const cleanText = novoTexto.toLowerCase().replace(/[^\w\s]/g, '');
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
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(novoTexto)}&langpair=${sourceLang}|${targetLang}&de=suporte.educonnect@gmail.com`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Erro na rede");
      const data = await response.json();
      if (data && data.responseData && data.responseData.translatedText) {
        setNovoTexto(decodificarEntidadesHtml(data.responseData.translatedText));
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

  const [mensagensTraduzidas, setMensagensTraduzidas] = useState({});

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

  const { lang } = useLanguage();

  const toggleTraducaoMensagem = async (msgId, originalContent, isMinha) => {
    if (mensagensTraduzidas[msgId]) {
      setMensagensTraduzidas(prev => {
        const copy = { ...prev };
        delete copy[msgId];
        return copy;
      });
      return;
    }

    let sourceLangCode = 'pt';
    let targetLangCode = langToCode[lang] || 'pt';

    if (isMinha) {
      // Se a mensagem foi escrita por mim, traduzir do meu idioma para o idioma selecionado no tradutor (idiomaDestino)
      sourceLangCode = langToCode[lang] || 'pt';
      targetLangCode = idiomaDestino || 'en';
      if (sourceLangCode === targetLangCode) {
        // Evitar pt|pt. Se coincidir, traduzir para inglês (en)
        targetLangCode = sourceLangCode === 'pt' ? 'en' : 'pt';
      }
    } else {
      // Se a mensagem foi escrita pelo outro, traduzir do idioma dele para o meu idioma
      const targetLang = langToCode[lang] || 'pt';
      let sourceLang = 'pt';
      if (targetLang === 'pt') {
        const cleanText = originalContent.toLowerCase().replace(/[^\w\s]/g, '');
        const words = cleanText.split(/\s+/);
        const enWords = new Set(['the', 'of', 'to', 'and', 'a', 'in', 'is', 'it', 'you', 'that', 'for', 'on', 'are', 'as', 'with', 'they', 'i', 'hello', 'how', 'good', 'morning', 'afternoon', 'night']);
        const esWords = new Set(['el', 'la', 'los', 'las', 'en', 'para', 'con', 'no', 'un', 'una', 'es', 'usted', 'como', 'está', 'todo', 'bien', 'gracias', 'buenos', 'dias', 'buenas', 'tardes', 'noches']);
        
        let enCount = 0;
        let esCount = 0;
        for (const word of words) {
          if (enWords.has(word)) enCount++;
          if (esWords.has(word)) esCount++;
        }
        sourceLang = esCount > enCount ? 'es' : 'en';
      } else {
        sourceLang = 'pt';
      }
      sourceLangCode = sourceLang;
      targetLangCode = targetLang;

      if (sourceLangCode === targetLangCode) {
        toast.info("A mensagem já está no idioma do seu sistema!");
        return;
      }
    }

    const toastId = toast.loading("Traduzindo mensagem...");
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(originalContent)}&langpair=${sourceLangCode}|${targetLangCode}&de=suporte.educonnect@gmail.com`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Erro na rede");
      const data = await response.json();
      if (data && data.responseData && data.responseData.translatedText) {
        setMensagensTraduzidas(prev => ({
          ...prev,
          [msgId]: decodificarEntidadesHtml(data.responseData.translatedText)
        }));
        toast.success("Mensagem traduzida!", { id: toastId });
      } else {
        throw new Error("Falha na tradução");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao traduzir mensagem.", { id: toastId });
    }
  };

  // Controle de áudio simulado (reprodução)
  const [audioTocandoId, setAudioTocandoId] = useState(null);
  const [progressoAudio, setProgressoAudio] = useState({}); // { msgId: percent }

  // Auto scroll para o final condicional
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const destinatarioMudou = lastDestinatarioIdRef.current !== destinatario?.id;
    lastDestinatarioIdRef.current = destinatario?.id;

    // Se o destinatário mudou (nova conversa), scrolla pro fim instantaneamente
    if (destinatarioMudou) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      return;
    }

    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    const ultimaMsg = mensagens[mensagens.length - 1];
    const enviadaPorMim = ultimaMsg?.sender_id === me?.id;

    if (isNearBottom || enviadaPorMim) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensagens, me, destinatario]);

  // Bloqueia a rolagem do body principal enquanto estiver no chat
  useEffect(() => {
    document.documentElement.classList.add('overflow-hidden-page');
    return () => {
      document.documentElement.classList.remove('overflow-hidden-page');
    };
  }, []);

  // Carrega dados iniciais do usuário e contatos
  useEffect(() => {
    async function carregarDados() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setMe(user);

      const { data: perfis, error } = await supabase
        .from('profiles')
        .select('id, nome, avatar_url')
        .neq('id', user.id);

      if (!error && perfis) {
        const listaFormatada = perfis.map(p => {
          const handleName = p.nome ? p.nome.toLowerCase().replace(/\s+/g, '') : 'usuario';
          return {
            id: p.id,
            nome: p.nome || 'Usuário Sem Nome',
            handle: `@${handleName}`,
            iniciais: p.nome ? p.nome.substring(0, 2).toUpperCase() : 'US',
            avatar_url: p.avatar_url
          };
        });
        setUsuarios(listaFormatada);

        // Se veio do perfil para enviar mensagem, seleciona automaticamente
        const preSelectedId = location.state?.destinatarioId;
        if (preSelectedId) {
          const selecionado = listaFormatada.find(u => u.id === preSelectedId);
          if (selecionado) {
            setDestinatario(selecionado);
          }
        }
      }
    }
    carregarDados();
  }, [location.state]);

  // Sistema de Bloqueio de Usuários (Persistido no LocalStorage)
  const [bloqueados, setBloqueados] = useState([]);
  useEffect(() => {
    const salvos = localStorage.getItem('educonnect-blocked-users');
    if (salvos) {
      setBloqueados(JSON.parse(salvos));
    }
  }, []);

  // Presença em Tempo Real (Supabase Realtime Presence)
  const [usuariosOnline, setUsuariosOnline] = useState(new Set());
  useEffect(() => {
    if (!me?.id) return;

    const canalPresenca = supabase.channel('global_presence', {
      config: {
        presence: {
          key: me.id,
        },
      },
    });

    canalPresenca
      .on('presence', { event: 'sync' }, () => {
        const state = canalPresenca.presenceState();
        const idsOnline = new Set(Object.keys(state));
        setUsuariosOnline(idsOnline);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await canalPresenca.track({
            user_id: me.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      canalPresenca.unsubscribe();
    };
  }, [me]);

  const isBloqueado = (userId) => bloqueados.includes(userId);

  const toggleBloquear = (userId) => {
    let novaLista;
    if (bloqueados.includes(userId)) {
      novaLista = bloqueados.filter(id => id !== userId);
      toast.success("Usuário desbloqueado com sucesso.");
    } else {
      novaLista = [...bloqueados, userId];
      toast.success("Usuário bloqueado com sucesso.");
    }
    setBloqueados(novaLista);
    localStorage.setItem('educonnect-blocked-users', JSON.stringify(novaLista));
  };

  const apagarMensagem = async (msgId) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', msgId);

      if (error) throw error;

      setMensagens(prev => prev.filter(m => m.id !== msgId));
      toast.success("Mensagem apagada.");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao apagar mensagem.");
    }
  };

  const apagarConversa = async () => {
    if (!me || !destinatario) return;

    if (!window.confirm("Deseja realmente apagar todo o histórico de conversa com este contato?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .or(`and(sender_id.eq.${me.id},receiver_id.eq.${destinatario.id}),and(sender_id.eq.${destinatario.id},receiver_id.eq.${me.id})`);

      if (error) throw error;

      setMensagens([]);
      toast.success("Conversa apagada.");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao apagar conversa.");
    }
  };

  // Histórico de mensagens + Realtime
  useEffect(() => {
    if (!me || !destinatario) return;

    async function buscarMensagens() {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${me.id},receiver_id.eq.${destinatario.id}),and(sender_id.eq.${destinatario.id},receiver_id.eq.${me.id})`)
        .order('created_at', { ascending: true });

      if (!error) setMensagens(data);
    }

    buscarMensagens();

    const channel = supabase
      .channel('chat-realtime')
      .on('postgres_changes', { event: '*', table: 'messages' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const nova = payload.new;
          if (
            (nova.sender_id === me.id && nova.receiver_id === destinatario.id) ||
            (nova.sender_id === destinatario.id && nova.receiver_id === me.id)
          ) {
            setMensagens(prev => {
              const indexTemp = prev.findIndex(m => m.sender_id === me.id && typeof m.id === 'number' && m.content === nova.content);
              if (indexTemp !== -1) {
                const copia = [...prev];
                copia[indexTemp] = nova;
                return copia;
              }
              if (prev.some(m => m.id === nova.id)) return prev;
              return [...prev, nova];
            });
          }
        } else if (payload.eventType === 'DELETE') {
          const antigaId = payload.old.id;
          setMensagens(prev => prev.filter(m => m.id !== antigaId));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [me, destinatario]);

  // Timer para gravação de áudio simulado
  useEffect(() => {
    let intervalo;
    if (gravandoAudio) {
      intervalo = setInterval(() => {
        setTempoGravacao(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (intervalo) clearInterval(intervalo);
    };
  }, [gravandoAudio]);

  // Chamada Real via Jitsi Meet dispensa captura de câmera externa redundante no pai

  // Contador de Tempo da Chamada
  const isChamadaAtiva = !!chamadaAtiva;
  useEffect(() => {
    let timerCall;
    if (isChamadaAtiva) {
      timerCall = setInterval(() => {
        setChamadaAtiva(prev => {
          if (!prev) return null;
          const nextStatus = prev.seconds >= 2 ? 'connected' : 'calling';
          return {
            ...prev,
            status: nextStatus,
            seconds: prev.seconds + 1
          };
        });
      }, 1000);
    }
    return () => {
      if (timerCall) clearInterval(timerCall);
    };
  }, [isChamadaAtiva]);

  // Envia Mensagem de Texto
  const handleEnviar = async (e) => {
    if (e) e.preventDefault();
    if (!novoTexto.trim() || !me || !destinatario) return;
    if (isBloqueado(destinatario.id)) {
      toast.error('Desbloqueie o usuário para enviar mensagens');
      return;
    }

    const texto = novoTexto.trim();
    setNovoTexto('');
    setMostrarEmojis(false);

    await enviarMensagemBanco(texto);
  };

  // Método auxiliar para salvar no banco
  const enviarMensagemBanco = async (conteudo) => {
    const mensagemOtimista = {
      id: Date.now(),
      sender_id: me.id,
      receiver_id: destinatario.id,
      content: conteudo,
      created_at: new Date().toISOString()
    };
    setMensagens(prev => [...prev, mensagemOtimista]);

    const { error } = await supabase
      .from('messages')
      .insert([
        { sender_id: me.id, receiver_id: destinatario.id, content: conteudo }
      ]);

    if (error) {
      toast.error('Erro ao enviar mensagem');
      setMensagens(prev => prev.filter(m => m.id !== mensagemOtimista.id));
    }
  };

  // Gravação de Áudio Real (MediaRecorder API + Supabase Storage upload)
  const iniciarGravacaoAudio = async () => {
    // 1. Verificação de Ambiente Seguro (HTTPS / Localhost) e API de mídia do Navegador
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error(
        "Acesso ao microfone indisponível neste navegador. Certifique-se de acessar o aplicativo por meio de um ambiente seguro (https:// ou http://localhost:5173)."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      audioChunksRef.current = [];
      deveEnviarAudioRef.current = false;

      // 2. Fallbacks de formatos de áudio para ampla compatibilidade (Chrome, Safari, iOS, etc.)
      let mediaRecorder;
      try {
        let options = {};
        if (typeof MediaRecorder.isTypeSupported === 'function') {
          if (MediaRecorder.isTypeSupported('audio/webm')) {
            options = { mimeType: 'audio/webm' };
          } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
            options = { mimeType: 'audio/ogg' };
          } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            options = { mimeType: 'audio/mp4' };
          }
        }
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (errMime) {
        console.warn("MIME type não suportado, usando padrão do navegador:", errMime);
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (!deveEnviarAudioRef.current) return;
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        if (audioBlob.size < 500) return; // ignora gravações vazias/nulas

        const toastId = toast.loading("Enviando áudio...");
        try {
          const extension = mediaRecorder.mimeType?.includes('ogg') ? 'ogg' : mediaRecorder.mimeType?.includes('mp4') ? 'mp4' : 'webm';
          const fileName = `audio-${me.id}-${Date.now()}.${extension}`;
          
          const { error: uploadError } = await supabase.storage
            .from('post-images')
            .upload(fileName, audioBlob, {
              contentType: mediaRecorder.mimeType || 'audio/webm'
            });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('post-images')
            .getPublicUrl(fileName);

          await enviarMensagemBanco(`[AUDIO]:${publicUrl}`);
          toast.success("Mensagem de áudio enviada!", { id: toastId });
        } catch (err) {
          console.error("Erro ao enviar áudio:", err);
          toast.error("Erro ao enviar mensagem de áudio.", { id: toastId });
        }
      };

      mediaRecorder.start();
      setGravandoAudio(true);
      setTempoGravacao(0);
    } catch (err) {
      console.error("Erro ao acessar microfone:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast.error("Permissão de acesso ao microfone negada. Clique no ícone de cadeado (🔒) à esquerda da barra de endereços do navegador e ative a permissão de Microfone.");
      } else {
        toast.error(`Não foi possível acessar o microfone: ${err.message || err}`);
      }
    }
  };

  // Parar gravação e disparar upload
  const handleEnviarAudio = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      deveEnviarAudioRef.current = true;
      mediaRecorderRef.current.stop();
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setGravandoAudio(false);
  };

  // Cancelar gravação e liberar recursos
  const handleCancelarAudio = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      deveEnviarAudioRef.current = false;
      mediaRecorderRef.current.stop();
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setGravandoAudio(false);
    toast.info("Gravação de áudio cancelada.");
  };

  // Trata anexar imagem
  const handleAnexarImagem = async (e) => {
    const file = e.target.files[0];
    if (!file || !me || !destinatario) return;
    if (isBloqueado(destinatario.id)) {
      toast.error('Desbloqueie o usuário para enviar mensagens');
      return;
    }

    setEnviandoImagem(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `chat-${me.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(fileName);

      await enviarMensagemBanco(`[IMAGE]:${publicUrl}`);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao enviar imagem de anexo');
    } finally {
      setEnviandoImagem(false);
    }
  };

  // Disparar Chamada Real via Jitsi Meet e Mensagens do Banco
  const iniciarChamada = async (tipo) => {
    if (!destinatario || !me) return;
    if (isBloqueado(destinatario.id)) {
      toast.error('Desbloqueie o usuário para fazer chamadas');
      return;
    }
    const room = [me.id, destinatario.id].sort().join('-');
    // Envia mensagem de início de chamada para notificar o outro lado em tempo real
    await enviarMensagemBanco(`[CALL]:${tipo}:${room}:started`);

    setMicLigado(true);
    setVideoLigado(true);
    setChamadaAtiva({
      type: tipo,
      user: destinatario,
      roomName: room,
      status: 'connected',
      seconds: 0
    });
  };

  // Desconectar Chamada
  const encerrarChamada = async () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (me && destinatario && chamadaAtiva?.roomName) {
      // Envia mensagem de encerramento de chamada
      await enviarMensagemBanco(`[CALL]:${chamadaAtiva.type}:${chamadaAtiva.roomName}:ended`);
    }
    setChamadaAtiva(null);
    toast.info("Chamada encerrada.");
  };

  // Reprodução de áudio real com HTML5 Audio
  const iniciarAudioPlayer = (msgId, audioUrl) => {
    if (audioTocandoId === msgId) {
      const audio = audioElementsRef.current[msgId];
      if (audio) audio.pause();
      setAudioTocandoId(null);
      return;
    }

    if (audioTocandoId && audioElementsRef.current[audioTocandoId]) {
      audioElementsRef.current[audioTocandoId].pause();
    }

    let audio = audioElementsRef.current[msgId];
    if (!audio) {
      audio = new Audio(audioUrl);
      audioElementsRef.current[msgId] = audio;

      audio.addEventListener('timeupdate', () => {
        const pct = (audio.currentTime / audio.duration) * 100 || 0;
        setProgressoAudio(prev => ({ ...prev, [msgId]: pct }));
        setDuracaoAudio(prev => ({ ...prev, [msgId]: audio.duration }));
      });

      audio.addEventListener('ended', () => {
        setAudioTocandoId(null);
        setProgressoAudio(prev => ({ ...prev, [msgId]: 0 }));
      });
    }

    audio.play()
      .then(() => {
        setAudioTocandoId(msgId);
      })
      .catch(err => {
        console.error("Erro ao reproduzir áudio:", err);
        toast.error("Não foi possível reproduzir este áudio.");
      });
  };

  const formatarTempo = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const usuariosFiltrados = usuarios.filter(u => 
    u.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    u.handle.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="w-full max-w-[1100px] mx-auto h-[calc(100dvh-180px)] md:h-[calc(100dvh-140px)] flex flex-col space-y-3 md:space-y-4">
      
      {/* Cabeçalho da Página */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/feed')} className="p-2 text-gray-400 hover:text-black rounded-xl cursor-pointer">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-[15px] font-bold text-gray-950 tracking-widest uppercase">{translate('messagesTitle')}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 bg-white border border-gray-100 rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.01)] overflow-hidden flex-1 min-h-0 relative">
        
        {/* COLUNA ESQUERDA: LISTA DE CONTATOS */}
        <div className={`border-r border-gray-100 flex flex-col bg-gray-50 dark:bg-[#0b0a12] p-4 space-y-3 h-full min-h-0 ${destinatario ? 'hidden md:flex' : 'flex'}`}>
          <div className="relative flex-shrink-0">
            <input 
              type="text"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder={translate('searchContacts')}
              className="w-full bg-white border border-gray-100 rounded-2xl pl-10 pr-4 py-2.5 text-[12px] text-gray-700 outline-none focus:border-black transition-colors"
            />
            <Search size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
          </div>

          <span className="text-[10px] font-bold text-gray-400 px-1 pt-1 tracking-wider block flex-shrink-0">{translate('contactsAvailable')}</span>
          
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {usuariosFiltrados.map(u => (
              <button
                key={u.id}
                onClick={() => setDestinatario(u)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all cursor-pointer border ${
                  destinatario?.id === u.id 
                    ? 'bg-white dark:bg-[#151322] text-gray-950 font-bold border-purple-500/10 shadow-[0_4px_15px_rgba(0,0,0,0.02)]' 
                    : 'hover:bg-gray-100/50 dark:hover:bg-[#151322]/40 border-transparent text-gray-600 dark:text-gray-300'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 bg-white border border-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 overflow-hidden shadow-inner">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt={u.nome} className="w-full h-full object-cover" />
                    ) : (
                      u.iniciais
                    )}
                  </div>
                  {usuariosOnline.has(u.id) && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-[#0c0b14] rounded-full animate-pulse" />
                  )}
                </div>
                <div className="overflow-hidden flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <h3 className="text-[12.5px] font-bold text-gray-900 dark:text-gray-150 leading-none truncate">{u.nome}</h3>
                    {isBloqueado(u.id) && (
                      <span className="text-[8px] bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-400 font-bold px-1.5 py-0.5 rounded flex-shrink-0 uppercase tracking-wider">
                        Bloqueado
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 font-light truncate block mt-0.5">{u.handle}</span>
                </div>
              </button>
            ))}
            {usuariosFiltrados.length === 0 && (
              <div className="text-center py-10 text-[11px] text-gray-400 italic">
                {translate('noContacts')}
              </div>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA: JANELA DO CHAT */}
        <div className={`md:col-span-2 flex flex-col bg-white dark:bg-[#07060c] h-full min-h-0 ${destinatario ? 'flex' : 'hidden md:flex'}`}>
          {destinatario ? (
            <>
              {/* Topo do Chat Ativo */}
              <div className="px-6 py-4 border-b border-gray-100 bg-white dark:bg-[#07060c] flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setDestinatario(null)} 
                    className="md:hidden p-1.5 text-gray-400 hover:text-black dark:hover:text-white rounded-xl cursor-pointer mr-1"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div className="w-8 h-8 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold overflow-hidden shadow-inner">
                    {destinatario.avatar_url ? (
                      <img src={destinatario.avatar_url} alt={destinatario.nome} className="w-full h-full object-cover" />
                    ) : (
                      destinatario.iniciais
                    )}
                  </div>
                  <div>
                    <h2 className="text-[13px] font-bold text-gray-950 leading-none">{destinatario.nome}</h2>
                    {usuariosOnline.has(destinatario.id) ? (
                      <span className="text-[9px] text-green-500 font-medium block mt-0.5">● {translate('connected')}</span>
                    ) : (
                      <span className="text-[9px] text-gray-400 font-medium block mt-0.5">● Offline</span>
                    )}
                  </div>
                </div>

                {/* BOTÕES DE LIGAÇÃO DE ÁUDIO E VÍDEO + BLOQUEAR */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => iniciarChamada('audio')} 
                    className="p-2 text-gray-400 hover:text-[#3b82f6] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
                    title={translate('audioCall')}
                  >
                    <Phone size={16} />
                  </button>
                  <button 
                    onClick={() => iniciarChamada('video')} 
                    className="p-2 text-gray-400 hover:text-[#8b5cf6] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
                    title={translate('videoCall')}
                  >
                    <Video size={16} />
                  </button>
                  <button 
                    onClick={() => toggleBloquear(destinatario.id)} 
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      isBloqueado(destinatario.id)
                        ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20'
                        : 'text-gray-400 hover:text-red-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    title={isBloqueado(destinatario.id) ? translate('unblockUser') : translate('blockUser')}
                  >
                    <Ban size={16} />
                  </button>
                  <button 
                    onClick={apagarConversa} 
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors cursor-pointer"
                    title="Apagar conversa"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Mensagens */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#fafafc] dark:bg-[#050408]">
                {mensagens.map(msg => {
                  const isMinha = msg.sender_id === me.id;

                  // Renderização de Imagem
                  if (typeof msg.content === 'string' && msg.content.startsWith('[IMAGE]:')) {
                    const url = msg.content.replace('[IMAGE]:', '');
                    return (
                      <div key={msg.id} className={`flex flex-col max-w-[70%] group relative ${isMinha ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                        <button
                          onClick={() => apagarMensagem(msg.id)}
                          className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 cursor-pointer ${
                            isMinha ? '-left-8' : '-right-8'
                          }`}
                          title="Apagar mensagem"
                        >
                          <Trash2 size={12} />
                        </button>
                        <div className="rounded-[1.4rem] overflow-hidden border border-gray-100 dark:border-purple-500/10 shadow-sm max-w-[240px]">
                          <img src={url} alt="Imagem compartilhada" className="w-full h-full object-cover max-h-[180px] hover:scale-102 transition-transform duration-300 cursor-pointer" onClick={() => window.open(url)} />
                        </div>
                        <span className="text-[9px] text-gray-400 mt-1 px-1 font-light">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  }

                  // Renderização de Chamada em Tempo Real (Áudio / Vídeo)
                  if (typeof msg.content === 'string' && msg.content.startsWith('[CALL]:')) {
                    const [, tipoChamada, room, status] = msg.content.split(':');
                    const isVideo = tipoChamada === 'video';
                    const isEnded = status === 'ended';

                    return (
                      <div key={msg.id} className={`flex flex-col max-w-[75%] md:max-w-[50%] group relative ${isMinha ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                        <button
                          onClick={() => apagarMensagem(msg.id)}
                          className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 cursor-pointer ${
                            isMinha ? '-left-8' : '-right-8'
                          }`}
                          title="Apagar mensagem"
                        >
                          <Trash2 size={12} />
                        </button>
                        <div className={`px-5 py-4 rounded-[1.6rem] border shadow-sm flex items-center gap-4 ${
                          isMinha
                            ? 'bg-gradient-to-tr from-blue-600/10 to-purple-600/10 dark:from-blue-500/10 dark:to-purple-500/10 text-gray-900 dark:text-gray-150 border-purple-500/10 rounded-tr-sm'
                            : 'bg-white dark:bg-[#151322] text-gray-900 dark:text-gray-100 border-gray-100 dark:border-purple-500/10 rounded-tl-sm'
                        }`}>
                          <div className={`p-3.5 rounded-2xl flex-shrink-0 ${
                            isEnded
                              ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                              : 'bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400 animate-pulse'
                           }`}>
                            {isVideo ? <Video size={20} /> : <Phone size={20} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[12.5px] font-bold truncate leading-snug">
                              {isVideo ? 'Chamada de Vídeo' : 'Chamada de Áudio'}
                            </h4>
                            <p className="text-[10px] text-gray-405 dark:text-gray-400 mt-1 leading-normal font-light">
                              {isEnded ? 'Chamada encerrada' : 'Chamada em andamento...'}
                            </p>
                            {!isEnded && (
                              <button
                                onClick={() => setChamadaAtiva({
                                  type: tipoChamada,
                                  user: destinatario,
                                  roomName: room,
                                  status: 'connected',
                                  seconds: 0
                                })}
                                className="mt-3 px-4 py-1.5 bg-green-500 hover:bg-green-650 text-white text-[10px] font-bold rounded-xl shadow-md shadow-green-500/15 cursor-pointer active:scale-98 transition-all flex items-center gap-1.5"
                              >
                                <Phone size={12} />
                                <span>Participar</span>
                              </button>
                            )}
                          </div>
                        </div>
                        <span className="text-[9px] text-gray-400 mt-1.5 px-1 font-light">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  }

                  // Renderização de Áudio Waveform Real via AudioBubble
                  if (typeof msg.content === 'string' && msg.content.startsWith('[AUDIO]:')) {
                    return (
                      <AudioBubble 
                        key={msg.id}
                        msg={msg}
                        isMinha={isMinha}
                        audioTocandoId={audioTocandoId}
                        progressoAudio={progressoAudio}
                        iniciarAudioPlayer={iniciarAudioPlayer}
                        formatarTempo={formatarTempo}
                        apagarMensagem={apagarMensagem}
                        translate={translate}
                      />
                    );
                  }

                   // Renderização de Texto Padrão
                  return (
                    <div key={msg.id} className={`flex flex-col max-w-[70%] group relative ${isMinha ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                      <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all duration-200 ${
                        isMinha ? '-left-16' : '-right-16'
                      }`}>
                        {/* Translate Button */}
                        <button
                          onClick={() => toggleTraducaoMensagem(msg.id, msg.content, isMinha)}
                          className="p-1.5 text-gray-400 hover:text-purple-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
                          title={mensagensTraduzidas[msg.id] ? "Ver original" : "Traduzir mensagem"}
                        >
                          <Globe size={12} className={mensagensTraduzidas[msg.id] ? 'text-purple-500 animate-pulse' : ''} />
                        </button>
                        {/* Delete Button */}
                        <button
                          onClick={() => apagarMensagem(msg.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
                          title="Apagar mensagem"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div className={`px-4 py-2.5 rounded-[1.4rem] text-[12.5px] leading-relaxed shadow-sm ${isMinha 
                        ? 'bg-gradient-to-tr from-[#3b82f6] to-[#8b5cf6] text-white rounded-tr-sm shadow-blue-500/10' 
                        : 'bg-white dark:bg-[#151322] text-gray-800 dark:text-gray-100 rounded-tl-sm border border-gray-100 dark:border-purple-500/10'}`}>
                        {mensagensTraduzidas[msg.id] ? (
                          <div className="space-y-1">
                            <div className="italic text-[12px] opacity-90">{mensagensTraduzidas[msg.id]}</div>
                            <div className="text-[9px] opacity-60 flex items-center gap-1 border-t border-current/10 pt-1">
                              <Globe size={8} /> Traduzido
                            </div>
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>
                      <span className="text-[9px] text-gray-405 mt-1.5 px-1 font-light">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Formulário de Envio / Gravação de Áudio ou Painel de Bloqueio */}
              {isBloqueado(destinatario.id) ? (
                <div className="p-6 border-t border-gray-100 dark:border-purple-500/10 bg-red-50/5 dark:bg-red-950/5 flex flex-col items-center justify-center text-center gap-3 flex-shrink-0">
                  <div className="p-3 bg-red-100 dark:bg-red-950/40 text-red-500 dark:text-red-400 rounded-full">
                    <Ban size={20} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-[13px] font-bold text-gray-900 dark:text-gray-100">
                      {translate('blockedContact')}
                    </h3>
                    <p className="text-[11px] text-gray-400 max-w-[340px] leading-relaxed">
                      {translate('blockedContactDesc')}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleBloquear(destinatario.id)}
                    className="px-5 py-1.5 bg-red-500 hover:bg-red-650 text-white rounded-full text-[11px] font-bold shadow-md shadow-red-500/10 cursor-pointer active:scale-98 transition-all"
                  >
                    {translate('unblockUser')}
                  </button>
                </div>
              ) : (
                <>
                  {/* BARRA DE EMOJIS POPULARES */}
                  {mostrarEmojis && (
                    <div className="px-4 py-3 bg-gray-50 dark:bg-[#0b0a12] border-t border-gray-100/50 flex gap-2 overflow-x-auto select-none">
                      {emojisPopulares.map(emoji => (
                        <button 
                          key={emoji}
                          onClick={() => setNovoTexto(prev => prev + emoji)}
                          className="text-lg hover:scale-120 active:scale-95 transition-transform p-1 cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* BARRA DO TRADUTOR DE IDIOMAS */}
                  {mostrarTradutor && (
                    <div className="px-6 py-3 bg-gray-50 dark:bg-[#0b0a12] border-t border-gray-100/50 flex items-center justify-between gap-3 flex-wrap animate-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Traduzir para:</span>
                        <select 
                          value={idiomaDestino}
                          onChange={(e) => setIdiomaDestino(e.target.value)}
                          className="bg-white dark:bg-[#12101b] border border-gray-200 dark:border-purple-500/10 rounded-xl px-3 py-1.5 text-[11px] text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
                        >
                          {idiomasTraducao.map(idioma => (
                            <option key={idioma.code} value={idioma.code}>
                              {idioma.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={handleTraduzirTexto}
                        disabled={traduzindo}
                        className="px-4 py-1.5 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-400 text-white rounded-xl text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm shadow-purple-500/10"
                      >
                        {traduzindo ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : null}
                        <span>{traduzindo ? 'Traduzindo...' : 'Traduzir'}</span>
                      </button>
                    </div>
                  )}

                  {/* Formulário de Envio / Gravação de Áudio */}
                  <div className="p-4 border-t border-gray-100 bg-white dark:bg-[#07060c] flex items-center gap-2 relative flex-shrink-0">
                    
                    {/* Inputs de arquivo ocultos */}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleAnexarImagem} 
                      accept="image/*" 
                      className="hidden" 
                    />

                    {gravandoAudio ? (
                      // Painel de Gravação de Áudio Ativo
                      <div className="flex-1 flex items-center justify-between bg-red-50/50 dark:bg-red-950/20 border border-red-100/50 rounded-2xl px-5 py-3 transition-all">
                        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                          <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping" />
                          <span className="text-[12.5px] font-medium">{translate('recordingVoice')} {formatarTempo(tempoGravacao)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={handleCancelarAudio}
                            className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
                            title={translate('cancel')}
                          >
                            <X size={16} />
                          </button>
                          <button 
                            onClick={handleEnviarAudio}
                            className="px-3.5 py-1.5 bg-red-600 text-white text-[11px] font-bold rounded-lg hover:bg-red-700 cursor-pointer transition-colors"
                          >
                            {translate('sendAudio')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Formulário Normal
                      <>
                        {/* Botão de Anexo */}
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={enviandoImagem}
                          className="p-2.5 text-gray-400 hover:text-[#3b82f6] rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
                          title={translate('sendImage')}
                        >
                          {enviandoImagem ? (
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Paperclip size={16} />
                          )}
                        </button>

                        {/* Botão Emoji */}
                        <button 
                          onClick={() => {
                            setMostrarEmojis(!mostrarEmojis);
                            if (mostrarTradutor) setMostrarTradutor(false);
                          }}
                          className={`p-2.5 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${mostrarEmojis ? 'text-[#8b5cf6]' : 'text-gray-400'}`}
                          title={translate('emojis')}
                        >
                          <Smile size={16} />
                        </button>

                        {/* Botão Tradutor */}
                        <button 
                          onClick={() => {
                            setMostrarTradutor(!mostrarTradutor);
                            if (mostrarEmojis) setMostrarEmojis(false);
                          }}
                          className={`p-2.5 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${mostrarTradutor ? 'text-[#8b5cf6]' : 'text-gray-400'}`}
                          title="Traduzir Mensagem"
                        >
                          <Globe size={16} />
                        </button>

                        {/* Input de Texto */}
                        <form onSubmit={handleEnviar} className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={novoTexto}
                            onChange={(e) => setNovoTexto(e.target.value)}
                            placeholder={`${translate('chatPlaceholder')} ${destinatario.nome}...`}
                            className="flex-1 bg-[#fcfcfc] dark:bg-[#12101b] border border-gray-100 dark:border-purple-500/10 rounded-2xl px-5 py-3 text-[12.5px] outline-none focus:bg-white focus:border-purple-500/20 focus:ring-1 focus:ring-purple-500/20 transition-all text-gray-900 dark:text-gray-100"
                          />

                          {/* Botão Gravar Microfone */}
                          {novoTexto.trim() === '' ? (
                            <button 
                              type="button"
                              onClick={iniciarGravacaoAudio}
                              className="p-3 text-gray-400 hover:text-red-500 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                              title={translate('recordVoiceMsg')}
                            >
                              <Mic size={15} />
                            </button>
                          ) : (
                            // Botão Enviar Texto
                            <button type="submit" className="p-3 bg-gradient-to-tr from-[#3b82f6] to-[#8b5cf6] text-white rounded-xl shadow-md shadow-blue-500/15 hover:opacity-90 cursor-pointer transition-opacity">
                              <Send size={14} />
                            </button>
                          )}
                        </form>
                      </>
                    )}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400 gap-2 bg-white dark:bg-[#07060c]">
              <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-[#0b0a12] flex items-center justify-center text-gray-300 mb-2 border border-gray-100/50 dark:border-purple-500/10">
                <MessageSquare size={26} strokeWidth={1.5} />
              </div>
              <h3 className="text-[13px] font-bold text-gray-950">{translate('yourConversations')}</h3>
              <p className="text-[12px] text-gray-400 font-light max-w-xs">{translate('selectContactDesc')}</p>
            </div>
          )}
        </div>

        {/* OVERLAY DE CHAMADA PERSONALIZADA (ESTILO WHATSAPP/INSTAGRAM CONFORME PRINTS) */}
        {chamadaAtiva && (
          <div className="absolute inset-0 z-50 bg-[#0c0b14] flex flex-col justify-between p-6 text-white select-none overflow-hidden font-sans">
            
            {/* 1. PLANO DE FUNDO BLURRED (Para Chamadas de Áudio ou fallback de vídeo) */}
            {chamadaAtiva.type === 'audio' ? (
              <div className="absolute inset-0 z-0 overflow-hidden bg-[#1e1a2f]">
                {/* Imagem desfocada do contato */}
                <div 
                  className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-30 scale-125 transition-all duration-700"
                  style={{ backgroundImage: `url(${chamadaAtiva.user.avatar_url || 'https://images.unsplash.com/photo-1557683316-973673baf926'})` }}
                />
                {/* Linhas ou quadros abstratos imitando o fundo pixelado da imagem */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.4)_1px,transparent_1px)] bg-[size:40px_40px] opacity-15" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/10 to-black/85" />
              </div>
            ) : (
              // Plano de Fundo de Vídeo Real (Jitsi Meet sem controles)
              <div className="absolute inset-0 z-0 bg-black">
                <iframe
                  src={`https://meet.jit.si/educonnect-call-${chamadaAtiva.roomName || [me.id, destinatario.id].sort().join('-')}#config.prejoinPageEnabled=false&config.toolbarButtons=[]&config.minimalUI=true&config.startWithAudioMuted=${!micLigado}&config.startWithVideoMuted=${!videoLigado}`}
                  allow="camera; microphone; fullscreen; display-capture; autoplay"
                  className="w-full h-full border-none pointer-events-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/75 pointer-events-none" />
              </div>
            )}

            {/* 2. CABEÇALHO SUPERIOR (ChevronDown + Avatar Redondo + Nome + Status) */}
            <div className="w-full flex flex-col items-center text-center z-10 pt-4 relative">
              {/* Botão Minimizar (ChevronDown) */}
              <button 
                onClick={encerrarChamada} 
                className="absolute left-1 top-2 p-2 text-white/90 hover:text-white transition-colors cursor-pointer bg-black/20 hover:bg-black/45 rounded-full"
              >
                <ChevronDown size={22} />
              </button>

              {/* Botão Mais Opções (...) */}
              <button 
                className="absolute right-1 top-2 p-2 text-white/90 hover:text-white transition-colors cursor-pointer bg-black/20 hover:bg-black/45 rounded-full"
                onClick={() => toast.info("Configurações adicionais de criptografia")}
              >
                <MoreHorizontal size={22} />
              </button>

              {/* Avatar Circular do Recipiente */}
              <div className="w-20 h-20 rounded-full border border-white/10 overflow-hidden shadow-2xl mb-3 flex-shrink-0 animate-in zoom-in-50 duration-500">
                {chamadaAtiva.user.avatar_url ? (
                  <img src={chamadaAtiva.user.avatar_url} alt={chamadaAtiva.user.nome} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-lg text-white">
                    {chamadaAtiva.user.iniciais}
                  </div>
                )}
              </div>

              {/* Nome do Contato e Status do Call */}
              <h2 className="text-[14.5px] font-semibold text-white tracking-wide leading-tight">{chamadaAtiva.user.handle || chamadaAtiva.user.nome}</h2>
              <span className="text-[11px] text-white/70 font-light mt-1.5 block">
                {chamadaAtiva.status === 'calling' 
                  ? 'Entrando em contato...' 
                  : `Chamando...`}
              </span>
            </div>

            {/* 3. FLUTUANTE LATERAL DE EFEITOS (Somente na Chamada de Vídeo) */}
            {chamadaAtiva.type === 'video' && (
              <div className="absolute left-6 top-1/3 flex flex-col gap-5.5 z-10 text-white/80 p-2 bg-black/20 backdrop-blur-md rounded-2xl border border-white/5">
                <button className="hover:text-white hover:scale-110 active:scale-95 transition-all cursor-pointer p-1"><Sparkles size={18} /></button>
                <button className="hover:text-white hover:scale-110 active:scale-95 transition-all cursor-pointer p-1"><Wand2 size={18} /></button>
                <button className="hover:text-white hover:scale-110 active:scale-95 transition-all cursor-pointer p-1"><Layers size={18} /></button>
                <button className="hover:text-white hover:scale-110 active:scale-95 transition-all cursor-pointer p-1"><Image size={18} /></button>
              </div>
            )}

            {/* 4. BARRA DE CONTROLES INFERIOR FLUTUANTE (Estilo WhatsApp) */}
            <div className="w-full max-w-[340px] mx-auto bg-black/40 backdrop-blur-2xl border border-white/10 p-3 rounded-[2.2rem] flex items-center justify-around gap-2 z-10 mb-6 shadow-2xl">
              
              {/* Botão Vídeo (Ativar/Desativar Câmera) */}
              <button 
                onClick={() => {
                  setVideoLigado(!videoLigado);
                  toast.success(videoLigado ? "Câmera desligada" : "Câmera ativada");
                }}
                className={`p-3.5 rounded-full transition-all cursor-pointer active:scale-95 ${
                  videoLigado 
                    ? 'text-white hover:bg-white/10' 
                    : 'bg-red-500/20 text-red-400 border border-red-500/20 hover:bg-red-500/30'
                }`}
                title={videoLigado ? "Desativar Câmera" : "Ativar Câmera"}
              >
                {videoLigado ? <Video size={19} /> : <CameraOff size={19} />}
              </button>

              {/* Botão Microfone (Mute/Unmute) */}
              <button 
                onClick={() => {
                  setMicLigado(!micLigado);
                  toast.success(micLigado ? "Microfone mutado" : "Microfone ativado");
                }}
                className={`p-3.5 rounded-full transition-all cursor-pointer active:scale-95 ${
                  micLigado 
                    ? 'text-white hover:bg-white/10' 
                    : 'bg-red-500/20 text-red-400 border border-red-500/20 hover:bg-red-500/30'
                }`}
                title={micLigado ? "Mutar Microfone" : "Ativar Microfone"}
              >
                {micLigado ? <Mic size={19} /> : <MicOff size={19} />}
              </button>

              {/* Botão Rotacionar Câmera (Vídeo) ou Auto-falante (Áudio) */}
              <button 
                onClick={() => toast.info("Alternando saída de mídia...")}
                className="p-3.5 text-white hover:bg-white/10 rounded-full transition-all cursor-pointer active:scale-95"
                title={chamadaAtiva.type === 'video' ? "Rotacionar Câmera" : "Viva-voz"}
              >
                {chamadaAtiva.type === 'video' ? <RotateCw size={19} /> : <Volume2 size={19} />}
              </button>

              {/* Botão Desligar Redondo (Rotated Phone Icon) */}
              <button 
                onClick={encerrarChamada}
                className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all active:scale-90 hover:scale-105 shadow-xl shadow-red-600/30 flex items-center justify-center cursor-pointer"
                title="Desligar Chamada"
              >
                <Phone size={20} className="rotate-[135deg]" />
              </button>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}

// COMPONENTE AUXILIAR PARA RENDERIZAR MENSAGENS DE ÁUDIO REAIS COM METADADOS
function AudioBubble({ msg, isMinha, audioTocandoId, progressoAudio, iniciarAudioPlayer, formatarTempo, apagarMensagem, translate }) {
  const audioUrl = msg.content.replace('[AUDIO]:', '');
  const [duracao, setDuracao] = useState(0);

  useEffect(() => {
    if (!audioUrl) return;
    const audioObj = new Audio(audioUrl);
    const handleMetadata = () => {
      setDuracao(audioObj.duration);
    };
    audioObj.addEventListener('loadedmetadata', handleMetadata);
    return () => {
      audioObj.removeEventListener('loadedmetadata', handleMetadata);
    };
  }, [audioUrl]);

  const tocando = audioTocandoId === msg.id;
  const pct = progressoAudio[msg.id] || 0;

  return (
    <div key={msg.id} className={`flex flex-col max-w-[70%] group relative ${isMinha ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
      <button
        onClick={() => apagarMensagem(msg.id)}
        className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 cursor-pointer ${
          isMinha ? '-left-8' : '-right-8'
        }`}
        title="Apagar mensagem"
      >
        <Trash2 size={12} />
      </button>
      <div className={`px-4 py-3 rounded-[1.4rem] text-[12.5px] leading-relaxed shadow-sm flex items-center gap-3 w-[220px] ${isMinha 
        ? 'bg-gradient-to-tr from-[#3b82f6] to-[#8b5cf6] text-white rounded-tr-sm shadow-blue-500/10' 
        : 'bg-white dark:bg-[#151322] text-gray-800 dark:text-gray-100 rounded-tl-sm border border-gray-100 dark:border-purple-500/10'}`}>
        
        {/* Play/Pause Button */}
        <button 
          onClick={() => iniciarAudioPlayer(msg.id, audioUrl)}
          className={`p-2 rounded-full cursor-pointer flex items-center justify-center flex-shrink-0 transition-colors ${
            isMinha ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-purple-600'
          }`}
        >
          {tocando ? (
            <div className="flex gap-0.5 items-end justify-center w-3.5 h-3.5">
              <span className="w-[2px] bg-current animate-bounce" style={{ height: '80%', animationDelay: '0.1s' }} />
              <span className="w-[2px] bg-current animate-bounce" style={{ height: '50%', animationDelay: '0.3s' }} />
              <span className="w-[2px] bg-current animate-bounce" style={{ height: '100%', animationDelay: '0.5s' }} />
            </div>
          ) : (
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>

        {/* Onda de áudio estilizada */}
        <div className="flex-1 flex flex-col gap-1 justify-center">
          <div className="h-6 flex items-center gap-0.5 relative">
            {/* Barra de Progresso Real */}
            <div className="absolute inset-y-0 left-0 bg-transparent flex items-center gap-0.5 overflow-hidden" style={{ width: `${pct}%`, zIndex: 10 }}>
              {[...Array(16)].map((_, i) => (
                <span key={i} className={`w-[2px] rounded-full flex-shrink-0 ${isMinha ? 'bg-white' : 'bg-purple-600'}`} style={{ height: `${20 + Math.sin(i) * 50}%` }} />
              ))}
            </div>
            {/* Onda Estática de Fundo */}
            <div className="absolute inset-0 flex items-center gap-0.5 opacity-30">
              {[...Array(16)].map((_, i) => (
                <span key={i} className={`w-[2px] rounded-full flex-shrink-0 ${isMinha ? 'bg-white' : 'bg-gray-400'}`} style={{ height: `${20 + Math.sin(i) * 50}%` }} />
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center text-[9px] opacity-80">
            <span>{translate('voiceMsg')}</span>
            <span>{duracao ? formatarTempo(Math.round(duracao)) : '...'}</span>
          </div>
        </div>
      </div>
      <span className="text-[9px] text-gray-400 mt-1.5 px-1 font-light">
        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
}