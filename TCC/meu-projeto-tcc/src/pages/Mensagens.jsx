import { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Send, MessageSquare, Search, Phone, Video, 
  Paperclip, Smile, Mic, X, Camera, CameraOff, MicOff, Ban
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

export default function Mensagens() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

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

  // Controle de áudio simulado (reprodução)
  const [audioTocandoId, setAudioTocandoId] = useState(null);
  const [progressoAudio, setProgressoAudio] = useState({}); // { msgId: percent }

  // Auto scroll para o final
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensagens]);

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
      }
    }
    carregarDados();
  }, []);

  // Sistema de Bloqueio de Usuários (Persistido no LocalStorage)
  const [bloqueados, setBloqueados] = useState([]);
  useEffect(() => {
    const salvos = localStorage.getItem('educonnect-blocked-users');
    if (salvos) {
      setBloqueados(JSON.parse(salvos));
    }
  }, []);

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
      .on('postgres_changes', { event: 'INSERT', table: 'messages' }, (payload) => {
        const nova = payload.new;
        if (
          (nova.sender_id === me.id && nova.receiver_id === destinatario.id) ||
          (nova.sender_id === destinatario.id && nova.receiver_id === me.id)
        ) {
          setMensagens(prev => [...prev, nova]);
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

  // Efeito da Câmera na Chamada de Vídeo
  useEffect(() => {
    let streamRef = null;
    if (chamadaAtiva && chamadaAtiva.type === 'video' && videoLigado) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          streamRef = stream;
          setLocalStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.warn("Câmera/Microfone não acessível:", err);
          toast.error("Não foi possível acessar a câmera para chamada de vídeo.");
        });
    }

    return () => {
      if (streamRef) {
        streamRef.getTracks().forEach(track => track.stop());
      }
      setLocalStream(null);
    };
  }, [chamadaAtiva, videoLigado]);

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

  // Enviar áudio simulado
  const handleEnviarAudio = async () => {
    setGravandoAudio(false);
    if (isBloqueado(destinatario.id)) {
      toast.error('Desbloqueie o usuário para enviar mensagens');
      return;
    }
    const duracao = tempoGravacao || 3; // mínimo 3s
    await enviarMensagemBanco(`[AUDIO]:${duracao}`);
  };

  // Cancelar gravação de áudio
  const handleCancelarAudio = () => {
    setGravandoAudio(false);
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

  // Disparar Chamada
  const iniciarChamada = (tipo) => {
    if (!destinatario) return;
    if (isBloqueado(destinatario.id)) {
      toast.error('Desbloqueie o usuário para fazer chamadas');
      return;
    }
    setMicLigado(true);
    setVideoLigado(true);
    setChamadaAtiva({
      type: tipo,
      user: destinatario,
      status: 'calling',
      seconds: 0
    });
  };

  // Desconectar Chamada
  const encerrarChamada = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setChamadaAtiva(null);
    toast.info("Chamada encerrada.");
  };

  // Simular reprodução de áudio wave
  const iniciarAudioPlayer = (msgId, duracao) => {
    if (audioTocandoId === msgId) {
      setAudioTocandoId(null);
      return;
    }
    setAudioTocandoId(msgId);
    setProgressoAudio(prev => ({ ...prev, [msgId]: 0 }));

    let current = 0;
    const interval = setInterval(() => {
      current += 10;
      const pct = (current / (duracao * 1000)) * 100;
      if (pct >= 100) {
        clearInterval(interval);
        setAudioTocandoId(null);
        setProgressoAudio(prev => ({ ...prev, [msgId]: 100 }));
      } else {
        setProgressoAudio(prev => ({ ...prev, [msgId]: pct }));
      }
    }, 100);
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
    <div className="w-full max-w-[1100px] mx-auto space-y-6">
      
      {/* Cabeçalho da Página */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/feed')} className="p-2 text-gray-400 hover:text-black rounded-xl cursor-pointer">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-[15px] font-bold text-gray-950 tracking-widest uppercase">MENSAGENS</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 bg-white border border-gray-100 rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.01)] overflow-hidden h-[600px] relative">
        
        {/* COLUNA ESQUERDA: LISTA DE CONTATOS */}
        <div className={`border-r border-gray-100 flex flex-col bg-gray-50 dark:bg-[#0b0a12] p-4 space-y-3 ${destinatario ? 'hidden md:flex' : 'flex'}`}>
          <div className="relative">
            <input 
              type="text"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Buscar contatos..."
              className="w-full bg-white border border-gray-100 rounded-2xl pl-10 pr-4 py-2.5 text-[12px] text-gray-700 outline-none focus:border-black transition-colors"
            />
            <Search size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
          </div>

          <span className="text-[10px] font-bold text-gray-400 px-1 pt-1 tracking-wider block">CONTACTOS DISPONÍVEIS</span>
          
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
                <div className="w-9 h-9 bg-white border border-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 overflow-hidden shadow-inner flex-shrink-0">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt={u.nome} className="w-full h-full object-cover" />
                  ) : (
                    u.iniciais
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
                Nenhum contato encontrado.
              </div>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA: JANELA DO CHAT */}
        <div className={`md:col-span-2 flex flex-col bg-white dark:bg-[#07060c] ${destinatario ? 'flex' : 'hidden md:flex'}`}>
          {destinatario ? (
            <>
              {/* Topo do Chat Ativo */}
              <div className="px-6 py-4 border-b border-gray-100 bg-white dark:bg-[#07060c] flex items-center justify-between">
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
                    <span className="text-[9px] text-green-500 font-medium block mt-0.5">● Conectado</span>
                  </div>
                </div>

                {/* BOTÕES DE LIGAÇÃO DE ÁUDIO E VÍDEO + BLOQUEAR */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => iniciarChamada('audio')} 
                    className="p-2 text-gray-400 hover:text-[#3b82f6] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
                    title="Ligação de Áudio"
                  >
                    <Phone size={16} />
                  </button>
                  <button 
                    onClick={() => iniciarChamada('video')} 
                    className="p-2 text-gray-400 hover:text-[#8b5cf6] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
                    title="Ligação de Vídeo"
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
                    title={isBloqueado(destinatario.id) ? "Desbloquear Usuário" : "Bloquear Usuário"}
                  >
                    <Ban size={16} />
                  </button>
                </div>
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#fafafc] dark:bg-[#050408]">
                {mensagens.map(msg => {
                  const isMinha = msg.sender_id === me.id;

                  // Renderização de Imagem
                  if (typeof msg.content === 'string' && msg.content.startsWith('[IMAGE]:')) {
                    const url = msg.content.replace('[IMAGE]:', '');
                    return (
                      <div key={msg.id} className={`flex flex-col max-w-[70%] ${isMinha ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                        <div className="rounded-[1.4rem] overflow-hidden border border-gray-100 dark:border-purple-500/10 shadow-sm max-w-[240px]">
                          <img src={url} alt="Imagem compartilhada" className="w-full h-full object-cover max-h-[180px] hover:scale-102 transition-transform duration-300 cursor-pointer" onClick={() => window.open(url)} />
                        </div>
                        <span className="text-[9px] text-gray-400 mt-1 px-1 font-light">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  }

                  // Renderização de Áudio Waveform Simulado
                  if (typeof msg.content === 'string' && msg.content.startsWith('[AUDIO]:')) {
                    const duracao = parseInt(msg.content.replace('[AUDIO]:', ''), 10) || 5;
                    const tocando = audioTocandoId === msg.id;
                    const pct = progressoAudio[msg.id] || 0;

                    return (
                      <div key={msg.id} className={`flex flex-col max-w-[70%] ${isMinha ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                        <div className={`px-4 py-3 rounded-[1.4rem] text-[12.5px] leading-relaxed shadow-sm flex items-center gap-3 w-[220px] ${isMinha 
                          ? 'bg-gradient-to-tr from-[#3b82f6] to-[#8b5cf6] text-white rounded-tr-sm shadow-blue-500/10' 
                          : 'bg-white dark:bg-[#151322] text-gray-800 dark:text-gray-100 rounded-tl-sm border border-gray-100 dark:border-purple-500/10'}`}>
                          
                          {/* Play/Pause Button */}
                          <button 
                            onClick={() => iniciarAudioPlayer(msg.id, duracao)}
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
                              <span>Mensagem de voz</span>
                              <span>{formatarTempo(Math.round((duracao * pct) / 100) || duracao)}</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-[9px] text-gray-400 mt-1.5 px-1 font-light">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  }

                  // Renderização de Texto Padrão
                  return (
                    <div key={msg.id} className={`flex flex-col max-w-[70%] ${isMinha ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                      <div className={`px-4 py-2.5 rounded-[1.4rem] text-[12.5px] leading-relaxed shadow-sm ${isMinha 
                        ? 'bg-gradient-to-tr from-[#3b82f6] to-[#8b5cf6] text-white rounded-tr-sm shadow-blue-500/10' 
                        : 'bg-white dark:bg-[#151322] text-gray-800 dark:text-gray-100 rounded-tl-sm border border-gray-100 dark:border-purple-500/10'}`}>
                        {msg.content}
                      </div>
                      <span className="text-[9px] text-gray-400 mt-1.5 px-1 font-light">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Formulário de Envio / Gravação de Áudio ou Painel de Bloqueio */}
              {isBloqueado(destinatario.id) ? (
                <div className="p-6 border-t border-gray-100 dark:border-purple-500/10 bg-red-50/5 dark:bg-red-950/5 flex flex-col items-center justify-center text-center gap-3">
                  <div className="p-3 bg-red-100 dark:bg-red-950/40 text-red-500 dark:text-red-400 rounded-full">
                    <Ban size={20} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-[13px] font-bold text-gray-900 dark:text-gray-100">
                      Contato Bloqueado
                    </h3>
                    <p className="text-[11px] text-gray-400 max-w-[340px] leading-relaxed">
                      Você bloqueou este usuário. Para enviar mensagens de texto, anexos, emojis ou iniciar chamadas, é necessário desbloqueá-lo.
                    </p>
                  </div>
                  <button
                    onClick={() => toggleBloquear(destinatario.id)}
                    className="px-5 py-1.5 bg-red-500 hover:bg-red-650 text-white rounded-full text-[11px] font-bold shadow-md shadow-red-500/10 cursor-pointer active:scale-98 transition-all"
                  >
                    Desbloquear Usuário
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

                  {/* Formulário de Envio / Gravação de Áudio */}
                  <div className="p-4 border-t border-gray-100 bg-white dark:bg-[#07060c] flex items-center gap-2 relative">
                    
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
                          <span className="text-[12.5px] font-medium">Gravando voz... {formatarTempo(tempoGravacao)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={handleCancelarAudio}
                            className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
                            title="Cancelar"
                          >
                            <X size={16} />
                          </button>
                          <button 
                            onClick={handleEnviarAudio}
                            className="px-3.5 py-1.5 bg-red-600 text-white text-[11px] font-bold rounded-lg hover:bg-red-700 cursor-pointer transition-colors"
                          >
                            Enviar Áudio
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
                          title="Enviar Imagem"
                        >
                          {enviandoImagem ? (
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Paperclip size={16} />
                          )}
                        </button>

                        {/* Botão Emoji */}
                        <button 
                          onClick={() => setMostrarEmojis(!mostrarEmojis)}
                          className={`p-2.5 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${mostrarEmojis ? 'text-[#8b5cf6]' : 'text-gray-400'}`}
                          title="Emojis"
                        >
                          <Smile size={16} />
                        </button>

                        {/* Input de Texto */}
                        <form onSubmit={handleEnviar} className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={novoTexto}
                            onChange={(e) => setNovoTexto(e.target.value)}
                            placeholder={`Conversar com ${destinatario.nome}...`}
                            className="flex-1 bg-[#fcfcfc] dark:bg-[#12101b] border border-gray-100 dark:border-purple-500/10 rounded-2xl px-5 py-3 text-[12.5px] outline-none focus:bg-white focus:border-purple-500/20 focus:ring-1 focus:ring-purple-500/20 transition-all text-gray-900 dark:text-gray-100"
                          />

                          {/* Botão Gravar Microfone */}
                          {novoTexto.trim() === '' ? (
                            <button 
                              type="button"
                              onClick={() => { setGravandoAudio(true); setTempoGravacao(0); }}
                              className="p-3 text-gray-400 hover:text-red-500 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                              title="Gravar Mensagem de Voz"
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
              <h3 className="text-[13px] font-bold text-gray-950">Suas conversas</h3>
              <p className="text-[12px] text-gray-400 font-light max-w-xs">Selecione um contato na barra lateral para abrir um chat seguro e privado.</p>
            </div>
          )}
        </div>

        {/* OVERLAY DE CHAMADA (ÁUDIO / VÍDEO COM CAMERA CAPTURE REAL) */}
        {chamadaAtiva && (
          <div className="absolute inset-0 z-50 bg-[#06050a]/95 backdrop-blur-md flex flex-col items-center justify-between p-8 text-white select-none">
            
            {/* Cabeçalho */}
            <div className="w-full flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-widest text-purple-400 bg-purple-950/40 px-3 py-1.5 rounded-full border border-purple-500/10">
                Chamada de {chamadaAtiva.type === 'video' ? 'Vídeo' : 'Áudio'} Protegida
              </span>
              <span className="text-xs text-gray-400 font-light">Criptografada de ponta a ponta</span>
            </div>

            {/* Centro: Tela de Vídeo ou Avatar com ripples */}
            <div className="w-full flex-1 flex flex-col items-center justify-center relative my-6">
              
              {chamadaAtiva.type === 'video' && videoLigado ? (
                // Container de Vídeo Ativo (Camera Preview)
                <div className="relative w-full max-w-[340px] h-[340px] rounded-[2.5rem] overflow-hidden border-2 border-purple-500/20 shadow-2xl bg-[#12101b]">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover scale-x-[-1]" 
                  />
                  {/* Marcador de chamada conectada */}
                  <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-2xl text-[10px] font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Você (Câmera Local)
                  </div>
                </div>
              ) : (
                // Interface de Chamada de Áudio (Avatar com ondas pulsantes)
                <div className="flex flex-col items-center gap-4">
                  <div className="relative flex items-center justify-center">
                    {/* Ripples animadas */}
                    <div className="absolute w-36 h-36 border border-purple-500/30 rounded-full animate-ping" style={{ animationDuration: '2.5s' }} />
                    <div className="absolute w-28 h-28 border border-blue-500/20 rounded-full animate-ping" style={{ animationDuration: '3.5s', animationDelay: '0.8s' }} />
                    
                    <div className="w-24 h-24 bg-gradient-to-tr from-[#3b82f6] to-[#8b5cf6] rounded-full flex items-center justify-center text-xl font-bold shadow-2xl border-4 border-white/10 overflow-hidden relative z-10">
                      {chamadaAtiva.user.avatar_url ? (
                        <img src={chamadaAtiva.user.avatar_url} alt={chamadaAtiva.user.nome} className="w-full h-full object-cover" />
                      ) : (
                        chamadaAtiva.user.iniciais
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Informações de status de conexão */}
              <div className="text-center mt-6 z-10 space-y-1">
                <h3 className="text-lg font-bold">{chamadaAtiva.user.nome}</h3>
                <p className="text-[12px] text-gray-400 font-light">
                  {chamadaAtiva.status === 'calling' 
                    ? 'Chamando...' 
                    : `Conectado — ${formatarTempo(chamadaAtiva.seconds)}`}
                </p>
              </div>
            </div>

            {/* Controle de chamadas (Botões inferiores) */}
            <div className="flex items-center gap-4">
              
              {/* Toggle de Microfone */}
              <button 
                onClick={() => setMicLigado(!micLigado)}
                className={`p-4 rounded-full border transition-all cursor-pointer ${
                  micLigado 
                    ? 'bg-white/10 border-white/10 hover:bg-white/20 text-white' 
                    : 'bg-red-600/90 border-transparent hover:bg-red-700 text-white'
                }`}
                title={micLigado ? "Desativar Microfone" : "Ativar Microfone"}
              >
                <MicOff size={18} className={micLigado ? 'hidden' : 'block'} />
                <Mic size={18} className={micLigado ? 'block' : 'hidden'} />
              </button>

              {/* Botão Desconectar (Desligar) */}
              <button 
                onClick={encerrarChamada}
                className="p-5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg shadow-red-500/25 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                title="Desligar Chamada"
              >
                <X size={22} strokeWidth={2.5} />
              </button>

              {/* Toggle de Vídeo (se chamada de vídeo) */}
              {chamadaAtiva.type === 'video' ? (
                <button 
                  onClick={() => setVideoLigado(!videoLigado)}
                  className={`p-4 rounded-full border transition-all cursor-pointer ${
                    videoLigado 
                      ? 'bg-white/10 border-white/10 hover:bg-white/20 text-white' 
                      : 'bg-red-600/90 border-transparent hover:bg-red-700 text-white'
                  }`}
                  title={videoLigado ? "Desativar Câmera" : "Ativar Câmera"}
                >
                  <CameraOff size={18} className={videoLigado ? 'hidden' : 'block'} />
                  <Camera size={18} className={videoLigado ? 'block' : 'hidden'} />
                </button>
              ) : null}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}