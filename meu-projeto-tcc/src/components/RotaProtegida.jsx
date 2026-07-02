import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Componente de Ordem Superior (HOC) para proteger rotas.
 * Ele verifica se o usuário está logado e se tem o papel necessário.
 */
export const RotaProtegida = ({ children, apenasProfessor = false }) => {
  const { usuario, carregando, ehProfessor } = useAuth();

  // 1. Enquanto o Supabase verifica a sessão, mostramos uma tela de carregamento limpa
  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // 2. Se não estiver logado, manda para o Login
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // 3. Regra de Negócio: Se for primeiro acesso, você pode forçar a troca de senha
  // Descomente a linha abaixo quando criar a página de trocar senha
  // if (perfil?.primeiro_acesso) return <Navigate to="/trocar-senha" />;

  // 4. Proteção por Papel (Role-Based Access Control)
  // Se a rota exige ser professor e o usuário é aluno, manda para o feed comum
  if (apenasProfessor && !ehProfessor) {
    return <Navigate to="/feed" replace />;
  }

  // Se passou por tudo, renderiza o conteúdo da página
  return children;
};