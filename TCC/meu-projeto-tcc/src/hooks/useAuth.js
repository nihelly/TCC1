import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useAuth() {
  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [carregando, setCarregando] = useState(true);

  async function buscarPerfil(id) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error.message);
      } else {
        setPerfil(data);
      }
    } catch (err) {
      console.error('Erro ao buscar perfil no Supabase:', err.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    // 1. Pega a sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuario(session?.user ?? null);
      if (session?.user) {
        buscarPerfil(session.user.id);
      } else {
        setCarregando(false);
      }
    });

    // 2. Escuta mudanças (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuario(session?.user ?? null);
      if (session?.user) {
        buscarPerfil(session.user.id);
      } else {
        setPerfil(null);
        setCarregando(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Retornamos um objeto com tudo o que o App precisa
  return { 
    usuario, 
    perfil, 
    carregando, 
    ehProfessor: perfil?.papel === 'professor' 
  };
}