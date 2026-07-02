import { Heart, MessageCircle, Repeat2, User, MoreHorizontal } from 'lucide-react';

export const PostCard = ({ autor, titulo, conteudo, temImagem }) => {
  return (
    <div className="bg-white border border-gray-100 rounded-[1.8rem] p-6 mb-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
      {/* Header do Post */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-50 rounded-full border border-gray-100 flex items-center justify-center">
            <User size={18} className="text-gray-300" />
          </div>
          <span className="text-[13px] text-gray-400 font-medium">@{autor}</span>
        </div>
        <MoreHorizontal size={18} className="text-gray-300 cursor-pointer" />
      </div>

      {/* Título e Conteúdo */}
      <div className="px-1">
        <h2 className="text-[13px] font-bold text-gray-800 uppercase tracking-tight mb-2">
          {titulo}
        </h2>
        
        {conteudo && (
          <p className="text-[13px] text-gray-600 mb-4 leading-relaxed">
            {conteudo}
          </p>
        )}

        {/* Placeholder da Imagem exatamente como na foto */}
        {temImagem && (
          <div className="w-full aspect-[16/8] bg-white border border-gray-100 rounded-[1.5rem] mb-4 flex items-center p-4">
             <div className="flex flex-col">
                <span className="text-gray-300 text-lg font-bold leading-none flex items-center gap-1">
                  <img src="/vite.svg" className="w-5 opacity-20 grayscale" alt="" /> {titulo}
                </span>
             </div>
          </div>
        )}
      </div>

      {/* Footer / Interações */}
      <div className="flex items-center justify-between mt-2 px-1">
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5 text-gray-400 text-[12px]">
            <Heart size={16} /> 100
          </div>
          <div className="flex items-center gap-1.5 text-gray-400 text-[12px]">
            <MessageCircle size={16} /> 100
          </div>
          <div className="flex items-center gap-1.5 text-gray-400 text-[12px]">
            <Repeat2 size={16} /> 100
          </div>
        </div>
        <span className="text-[10px] text-gray-400 italic lowercase tracking-tight">
          (corpo da postagem)
        </span>
      </div>
    </div>
  );
};