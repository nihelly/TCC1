import { useState, useEffect } from 'react';
import { Megaphone, GraduationCap, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';

export function Anuncios() {
  const navigate = useNavigate();
  const { ehProfessor } = useAuth();
  const [professores, setProfessores] = useState([]);
  const [anuncios, setAnuncios] = useState([]);

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
    <div className="space-y-4">
      {/* Professores */}
      {professores.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-[1.5rem] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
          <h3 className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-3 px-1">Docentes</h3>
          <div className="flex flex-wrap gap-2">
            {professores.map(prof => (
              <button
                key={prof.id}
                onClick={() => navigate(`/perfil/${prof.id}`)}
                className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden hover:scale-110 transition-transform cursor-pointer bg-gray-50 flex items-center justify-center"
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
      <div className="bg-white border border-gray-100 rounded-[1.5rem] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-[10px] font-bold text-gray-400 tracking-wider uppercase flex items-center gap-1.5">
            <Megaphone size={12} /> Mural
          </h3>
          {ehProfessor && (
            <button
              onClick={() => navigate('/criar-aviso')}
              className="p-1 text-gray-400 hover:text-black rounded-lg cursor-pointer"
            >
              <Plus size={14} />
            </button>
          )}
        </div>
        <div className="space-y-3">
          {anuncios.length > 0 ? (
            anuncios.map(a => (
              <div key={a.id} className="border-l-2 border-purple-400 pl-3 space-y-0.5">
                <span className="text-[9px] font-bold text-purple-600 uppercase tracking-wider">{a.materia}</span>
                <p className="text-[11px] font-semibold text-gray-900 leading-tight">{a.titulo}</p>
                <span className="text-[9px] text-gray-400">{a.professor}</span>
              </div>
            ))
          ) : (
            <p className="text-[11px] text-gray-400 italic text-center py-3">Nenhum aviso publicado.</p>
          )}
        </div>
      </div>
    </div>
  );
}