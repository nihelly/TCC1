import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Sparkles, UploadCloud } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { useLanguage } from '../hooks/useLanguage';

export default function CriarPost() {
  const { translate } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [titulo, setTitulo] = useState('');
  const [corpo, setCorpo] = useState('');
  const [imagemUrl, setImagemUrl] = useState(''); // URL final pública da imagem
  const [carregando, setCarregando] = useState(false);
  const [enviandoImagem, setEnviandoImagem] = useState(false);

  // Função para fazer o Upload do arquivo para o Storage do Supabase
  const handleUploadImagem = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validações básicas de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Arquivo inválido', { description: 'Por favor, selecione uma imagem válida (PNG, JPG, JPEG).' });
      return;
    }

    setEnviandoImagem(true);
    try {
      // Cria um nome único para o arquivo para evitar colisões no banco
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      // Envia o arquivo para o bucket 'posts-images'
      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Busca a URL pública do arquivo recém-criado
      const { data } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath);

      setImagemUrl(data.publicUrl);
      toast.success('Imagem carregada com sucesso! 🖼️');
    } catch (error) {
      toast.error('Erro no upload', { description: error.message });
    } finally {
      setEnviandoImagem(false);
    }
  };

  // Envio final do formulário (Inserção do Post no Banco)
  const handleCriarPostagem = async (e) => {
    e.preventDefault();

    if (!titulo.trim()) {
      toast.warning('Título obrigatório', { description: 'Dê um título para a sua publicação.' });
      return;
    }

    setCarregando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      // Buscar nome do perfil para handle consistente
      const { data: meuPerfil } = await supabase
        .from('profiles')
        .select('nome')
        .eq('id', user.id)
        .single();

      const autorHandle = meuPerfil?.nome
        ? `@${meuPerfil.nome.toLowerCase().replace(/\s+/g, '')}`
        : (user.email ? `@${user.email.split('@')[0]}` : '@usuario');

      const { error } = await supabase
        .from('posts') 
        .insert([
          {
            title: titulo,
            content: corpo,
            image_url: imagemUrl || null,
            user_id: user.id,
            author_handle: autorHandle,
            created_at: new Date().toISOString(),
          }
        ]);

      if (error) throw error;

      toast.success('Publicado com sucesso! 🎉');
      navigate('/feed');
    } catch (error) {
      toast.error('Erro ao publicar', { description: error.message });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="w-full max-w-[640px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Cabeçalho interno */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-[17px] font-bold text-gray-950 tracking-tight">
            {translate('newPostTitle')}
          </h1>
        </div>
        <div className="text-gray-400">
          <Sparkles size={18} strokeWidth={1.5} />
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleCriarPostagem} className="space-y-5">
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.008)] space-y-5">
          
          {/* Título */}
          <div className="space-y-1.5">
            <label htmlFor="tituloPost" className="text-[12px] font-semibold text-gray-700 pl-1 block">
              {translate('postTitleLabel')}
            </label>
            <input
              id="tituloPost"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Resumos de IHC para a P2"
              className="w-full bg-[#fcfcfc] border border-gray-100 rounded-2xl py-3 px-4 text-[13px] text-gray-800 outline-none focus:bg-white focus:border-black transition-all"
              maxLength={80}
            />
          </div>

          {/* Conteúdo */}
          <div className="space-y-1.5">
            <label htmlFor="corpoPost" className="text-[12px] font-semibold text-gray-700 pl-1 block">
              {translate('postContentLabel')}
            </label>
            <textarea
              id="corpoPost"
              value={corpo}
              onChange={(e) => setCorpo(e.target.value)}
              placeholder={translate('postContentPlaceholder')}
              rows={4}
              className="w-full bg-[#fcfcfc] border border-gray-100 rounded-2xl py-3 px-4 text-[13px] text-gray-800 outline-none focus:bg-white focus:border-black transition-all resize-none leading-relaxed"
            />
          </div>

          {/* ÁREA DE UPLOAD DE IMAGEM REAL */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-gray-700 pl-1 block">
              {translate('coverImageLabel')}
            </label>
            
            {/* Input escondido nativo do HTML */}
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleUploadImagem}
              accept="image/*"
              className="hidden"
            />

            {!imagemUrl ? (
              /* Dropzone estilizado clique/arraste */
              <button
                type="button"
                disabled={enviandoImagem}
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-[140px] bg-[#fcfcfc] border border-dashed border-gray-200 hover:border-gray-400 rounded-2xl flex flex-col items-center justify-center gap-2 group transition-all cursor-pointer disabled:opacity-60"
              >
                <div className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 group-hover:text-gray-600 transition-colors shadow-sm">
                  <UploadCloud size={20} strokeWidth={1.8} />
                </div>
                <span className="text-[12px] text-gray-500 font-medium">
                  {enviandoImagem ? translate('uploading') : translate('clickSelectImage')}
                </span>
                <span className="text-[10px] text-gray-400">PNG, JPG de até 5MB</span>
              </button>
            ) : (
              /* Preview elegante com botão de exclusão */
              <div className="relative w-full h-[220px] rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                <img src={imagemUrl} alt="Preview do post" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImagemUrl('')}
                  className="absolute top-3 right-3 p-1.5 bg-black/80 text-white hover:bg-black rounded-full transition-colors cursor-pointer shadow-md"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-3 rounded-2xl text-[13px] font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100/50 transition-all cursor-pointer"
          >
            {translate('cancel')}
          </button>
          
          <button
            type="submit"
            disabled={carregando || enviandoImagem}
            className="bg-white border border-black hover:bg-gray-50 text-gray-900 font-medium py-3 px-8 rounded-2xl text-[13px] transition-all shadow-sm disabled:opacity-40 cursor-pointer"
          >
            {carregando ? translate('publishing') : translate('publishBtnText')}
          </button>
        </div>
      </form>

    </div>
  );
}