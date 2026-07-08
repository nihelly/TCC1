import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Loader2, Check, X, ImagePlus } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

export default function EditarPerfil() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState(null);
  const bannerInputRef = useRef(null);

  // Estados do formulário
  const [nome, setNome] = useState('');
  const [handle, setHandle] = useState('');
  const [biografia, setBiografia] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [papel, setPapel] = useState('aluno');
  const [bannerUrl, setBannerUrl] = useState('');
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');

  useEffect(() => {
    async function obterDadosAtuais() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/login');
          return;
        }
        setUserId(user.id);

        const { data: perfil, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (perfil) {
          setNome(perfil.nome || '');
          const userHandle = perfil.nome
            ? perfil.nome.toLowerCase().replace(/\s+/g, '').replace(/\./g, '.')
            : (user.email ? user.email.split('@')[0] : 'usuario');
          setHandle(userHandle);
          setBiografia(perfil.bio || '');
          setAvatarUrl(perfil.avatar_url || '');
          setPreviewUrl(perfil.avatar_url || '');
          setPapel(perfil.papel || 'aluno');
          setBannerUrl(perfil.banner_url || '');
          setBannerPreview(perfil.banner_url || '');
        }
      } catch (err) {
        console.error(err);
        toast.error('Erro ao carregar dados de edição.');
      } finally {
        setLoading(false);
      }
    }
    obterDadosAtuais();
  }, [navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const formatosPermitidos = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!formatosPermitidos.includes(file.type)) {
        toast.error('Formato inválido. Selecione uma imagem JPG, JPEG, PNG ou WEBP.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 5MB.');
        return;
      }
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const formatosPermitidos = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!formatosPermitidos.includes(file.type)) {
        toast.error('Formato inválido. Selecione uma imagem JPG, JPEG, PNG ou WEBP.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('O banner deve ter no máximo 5MB.');
        return;
      }
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  async function handleSalvar(e) {
    e.preventDefault();
    
    if (!nome.trim()) return toast.error('O nome não pode ficar vazio.');

    try {
      setSaving(true);

      let novaAvatarUrl = avatarUrl;
      let novaBannerUrl = bannerUrl;

      // Upload avatar
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, imageFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        novaAvatarUrl = `${publicUrl}?t=${Date.now()}`;
      }

      // Upload banner
      if (bannerFile) {
        const fileExt = bannerFile.name.split('.').pop();
        const fileName = `banner-${userId}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, bannerFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        novaBannerUrl = `${publicUrl}?t=${Date.now()}`;
      }

      // Atualizar dados na tabela 'profiles'
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          nome: nome.trim(),
          bio: biografia.trim(),
          avatar_url: novaAvatarUrl,
          banner_url: novaBannerUrl,
          papel: papel,
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      toast.success('Perfil atualizado com sucesso!');
      navigate(`/perfil/${userId}`, { replace: true });
    } catch (err) {
      console.error(err);
      toast.error('Erro ao guardar as alterações.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-400 text-sm">Carregando editor de perfil...</div>;
  }

  return (
    <div className="w-full max-w-[600px] mx-auto space-y-8">
      {/* Barra de Topo */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <button 
          type="button"
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-[12px] font-bold text-gray-500 hover:text-black transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} /> VOLTAR
        </button>
        <h1 className="text-[13px] font-bold text-gray-950 tracking-widest uppercase">EDITAR PERFIL</h1>
        <div className="w-16"></div>
      </div>

      <form onSubmit={handleSalvar} className="space-y-6">
        
        {/* BANNER */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-700 tracking-wider uppercase">Banner do Perfil</label>
          <div 
            onClick={() => bannerInputRef.current?.click()}
            className="relative w-full h-36 rounded-2xl overflow-hidden border border-gray-200 cursor-pointer group transition-all hover:border-gray-400"
          >
            {bannerPreview ? (
              <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-[#e6f4ff] via-[#f0f3ff] to-[#f6f0ff] flex items-center justify-center">
                <div className="text-center space-y-1">
                  <ImagePlus size={24} className="text-gray-300 mx-auto" />
                  <span className="text-[11px] text-gray-400 block">Clique para adicionar banner</span>
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="text-white text-center">
                <Camera size={20} className="mx-auto mb-1" />
                <span className="text-[10px] font-bold">ALTERAR BANNER</span>
              </div>
            </div>
          </div>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            onChange={handleBannerChange}
            className="hidden"
          />
          <p className="text-[10px] text-gray-400 pl-1">Recomendado: 1500x500px, máximo 5MB</p>
        </div>

        {/* FOTO DE PERFIL */}
        <div className="flex flex-col items-center space-y-3">
          <div className="relative group w-28 h-28">
            <div className="w-full h-full bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center text-gray-400 overflow-hidden shadow-inner">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[30px] font-bold text-gray-300">
                  {handle ? `@${handle.substring(0, 2).toUpperCase()}` : '?'}
                </span>
              )}
            </div>
            
            <label 
              htmlFor="avatar-upload" 
              className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold"
            >
              <Camera size={18} className="mb-1" />
              ALTERAR FOTO
            </label>
            <input 
              id="avatar-upload" 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange} 
              className="hidden" 
            />
          </div>
          <p className="text-[11px] text-gray-400">Clique na imagem para fazer upload (Máx. 2MB)</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-700 tracking-wider uppercase">Nome no Ecossistema</label>
            <input 
              type="text" 
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Prof. Dr. Roberto"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] font-medium text-gray-800 outline-none focus:border-black transition-colors"
            />
          </div>

          <div className="space-y-1.5 animate-in fade-in duration-200">
            <label className="text-[11px] font-bold text-gray-700 tracking-wider uppercase">Papel Acadêmico</label>
            <select
              value={papel}
              onChange={(e) => setPapel(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] font-medium text-gray-800 outline-none focus:border-black transition-colors cursor-pointer"
            >
              <option value="aluno">Aluno (Estudante)</option>
              <option value="professor">Professor (Docente)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-700 tracking-wider uppercase">Identificador (@) (Não editável)</label>
            <div className="flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-[13px] opacity-70 cursor-not-allowed">
              <span className="text-gray-400 font-bold">@</span>
              <input 
                type="text" 
                value={handle}
                disabled
                className="bg-transparent outline-none w-full font-medium text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-700 tracking-wider uppercase">Biografia Acadêmica</label>
            <textarea 
              value={biografia}
              onChange={(e) => setBiografia(e.target.value)}
              rows={4}
              placeholder="Conte um pouco sobre a sua atuação, disciplinas ou linha de investigação..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-[12px] text-gray-700 outline-none resize-none focus:border-black transition-colors"
            />
          </div>
        </div>

        {/* BOTÕES */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button 
            type="button"
            onClick={() => navigate(-1)}
            disabled={saving}
            className="flex items-center gap-1 bg-gray-100 text-gray-600 px-5 py-2.5 rounded-xl text-[12px] font-bold hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={14} /> Cancelar
          </button>
          
          <button 
            type="submit"
            disabled={saving}
            className="flex items-center gap-1 bg-black text-white px-6 py-2.5 rounded-xl text-[12px] font-bold hover:bg-gray-800 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Salvando...
              </>
            ) : (
              <>
                <Check size={14} /> Salvar Alterações
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}