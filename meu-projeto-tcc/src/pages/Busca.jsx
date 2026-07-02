import { useState, useRef, useEffect } from 'react';
import { Search, Megaphone, Hash } from 'lucide-react';

export default function Busca() {
  const [pesquisa, setPesquisa] = useState('');
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const containerRef = useRef(null);

  // Fecha o dropdown de busca se o usuário clicar fora dele
  useEffect(() => {
    function cliqueFora(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setMostrarDropdown(false);
      }
    }
    document.addEventListener('mousedown', cliqueFora);
    return () => document.removeEventListener('mousedown', cliqueFora);
  }, []);

  return (
    <div className="max-w-[750px] mx-auto pt-4 pb-20 px-4 animate-in fade-in duration-500">
      
      {/* TÍTULO DA PÁGINA */}
      <h1 className="text-[11px] font-bold tracking-[0.2em] text-gray-800 uppercase mb-6 pl-1">
        Buscar
      </h1>

      {/* BARRA DE PESQUISA COM DROPDOWN FLUTUANTE */}
      <div ref={containerRef} className="relative mb-10">
        <div className="relative flex items-center">
          <Search size={18} className="absolute left-5 text-gray-400" />
          <input
            type="text"
            value={pesquisa}
            onChange={(e) => {
              setPesquisa(e.target.value);
              setMostrarDropdown(true);
            }}
            onFocus={() => setMostrarDropdown(true)}
            placeholder="Buscar posts, pessoas, tags..."
            className="w-full bg-[#fcfcfc] border border-gray-100 rounded-full py-3.5 pl-12 pr-6 text-[13px] text-gray-700 outline-none focus:bg-white focus:border-blue-400 focus:shadow-[0_0_0_1px_rgba(96,165,250,0.5)] transition-all"
          />
        </div>

        {/* MENU SUSPENSO DE RESULTADOS (DROPDOWN) */}
        {mostrarDropdown && (
          <div className="absolute top-[110%] left-0 w-full bg-white border border-gray-100 rounded-[1.5rem] shadow-xl z-50 overflow-hidden max-h-[420px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Histórico/Sugestões de Termos */}
            <div className="p-4 space-y-3.5 border-b border-gray-50">
              {['banco de dados', 'tcc engenharia', 'react hooks', 'lista de algoritmos'].map((termo, idx) => (
                <div key={idx} className="flex items-center gap-3 text-gray-600 hover:text-black cursor-pointer transition-colors px-2">
                  <Search size={15} className="text-gray-400" />
                  <span className="text-[13px]">{termo}</span>
                </div>
              ))}
            </div>

            {/* Sugestões de Usuários/Perfis */}
            <div className="p-2 space-y-1">
              {[
                { nome: 'Helena Souza', user: '@profhelena', desc: 'Professora', iniciais: 'HS' },
                { nome: 'Marcos Lima', user: '@marcosl', desc: 'Aluno • 6º sem', iniciais: 'ML' },
                { nome: 'Ana Ribeiro', user: '@anar', desc: 'Professora', iniciais: 'AR' },
                { nome: 'João Pedro', user: '@jpedro', desc: 'Aluno • 4º sem', iniciais: 'JP' }
              ].map((perfil, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2.5 hover:bg-gray-50/70 rounded-xl cursor-pointer transition-colors">
                  <div className="w-10 h-10 bg-gray-100 text-gray-600 font-semibold rounded-full flex items-center justify-center text-[12px]">
                    {perfil.iniciais}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-gray-800 leading-tight">{perfil.nome}</span>
                    <span className="text-[11px] text-gray-400">{perfil.user} · {perfil.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SEÇÃO: ANÚNCIOS DOS PROFESSORES */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4 pl-1 text-gray-700 font-bold text-[11px] tracking-wider uppercase">
          <Megaphone size={14} className="text-gray-800" />
          <span>Anúncios dos Professores</span>
        </div>

        <div className="bg-white border border-gray-100 rounded-[1.8rem] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.01)]">
          {[
            { prof: 'PROF. HELENA', materia: 'BANCO DE DADOS', titulo: 'Prova adiada', tempo: '2h' },
            { prof: 'PROF. MARCOS', materia: 'ENGENHARIA DE SOFTWARE', titulo: 'Material disponível', tempo: '5h' },
            { prof: 'PROF. ANA', materia: 'ALGORITMOS', titulo: 'Aula extra', tempo: '1d' }
          ].map((anuncio, idx) => (
            <div 
              key={idx} 
              className={`p-5 flex justify-between items-start transition-colors hover:bg-gray-50/30 
                ${idx !== 0 ? 'border-t border-gray-100' : ''}`}
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-400 tracking-wide uppercase">
                  {anuncio.prof} • {anuncio.materia}
                </span>
                <h3 className="text-[13px] font-bold text-gray-800">
                  {anuncio.titulo}
                </h3>
              </div>
              <span className="text-[11px] text-gray-400 pr-1">
                {anuncio.tempo}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* SEÇÃO: MAIS UTILIZADAS */}
      <div>
        <div className="flex items-center gap-2 mb-4 pl-1 text-gray-700 font-bold text-[11px] tracking-wider uppercase">
          <Hash size={14} className="text-gray-800" />
          <span>Mais Utilizadas</span>
        </div>

        <div className="bg-white border border-gray-100 rounded-[1.8rem] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.01)]">
          <div className="flex flex-wrap gap-2.5">
            {[
              { tag: 'banco-de-dados', qtd: 142 },
              { tag: 'tcc', qtd: 98 },
              { tag: 'algoritmos', qtd: 87 },
              { tag: 'react', qtd: 64 },
              { tag: 'duvida', qtd: 53 },
              { tag: 'engenharia-software', qtd: 41 },
              { tag: 'calculo', qtd: 33 },
              { tag: 'estagio', qtd: 28 }
            ].map((tagItem, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-2 bg-[#f5f5f5] hover:bg-gray-100 px-3.5 py-1.5 rounded-full text-[12px] text-gray-600 font-medium cursor-pointer transition-colors"
              >
                <span>#{tagItem.tag}</span>
                <span className="text-[10px] text-gray-400 font-normal bg-white px-1.5 py-0.5 rounded-full border border-gray-100/50">
                  {tagItem.qtd}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}