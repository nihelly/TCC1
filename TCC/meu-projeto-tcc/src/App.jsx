import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

// Importação dos Layouts
import { MainLayout } from './layouts/MainLayout';

// Importação do componente de proteção de rota
import { RotaProtegida } from './components/RotaProtegida';

// Importação das Páginas
import Login from './pages/login';
import FluxoSenha from './pages/FluxoSenha';
import Feed from './pages/Feed';
import CriarPost from './pages/CriarPost';
import Mensagens from './pages/Mensagens';
import Notificacoes from './pages/Notificacoes';
import CriarAviso from './pages/CriarAviso';
import Perfil from './pages/Perfil';
import EditarPerfil from './pages/EditarPerfil';
import Buscar from './pages/Buscar';
import Configuracoes from './pages/Configuracoes';

export default function App() {
  return (
    <Router>
      {/* Provedor global das notificações flutuantes (Toast) */}
      <Toaster position="top-right" richColors closeButton />

      <Routes>
        {/* ==================== ROTAS PÚBLICAS ==================== */}
        <Route path="/login" element={<Login />} />
        <Route path="/fluxo-senha" element={<FluxoSenha />} />

        {/* ==================== ROTAS PROTEGIDAS ==================== */}
        {/* Feed Principal */}
        <Route 
          path="/feed" 
          element={
            <RotaProtegida>
              <MainLayout><Feed /></MainLayout>
            </RotaProtegida>
          } 
        />

        {/* Perfil Próprio (Sem ID na URL) */}
        <Route 
          path="/perfil" 
          element={
            <RotaProtegida>
              <MainLayout><Perfil /></MainLayout>
            </RotaProtegida>
          } 
        />

        {/* Editar Perfil (DEVE vir ANTES de /perfil/:id) */}
        <Route 
          path="/perfil/editar" 
          element={
            <RotaProtegida>
              <MainLayout><EditarPerfil /></MainLayout>
            </RotaProtegida>
          } 
        />

        {/* Perfil de outro usuário (Com ID na URL) */}
        <Route 
          path="/perfil/:id" 
          element={
            <RotaProtegida>
              <MainLayout><Perfil /></MainLayout>
            </RotaProtegida>
          } 
        />

        {/* Criação de Postagem */}
        <Route 
          path="/criar-post" 
          element={
            <RotaProtegida>
              <MainLayout><CriarPost /></MainLayout>
            </RotaProtegida>
          } 
        />

        {/* Criação de Aviso (Professor) */}
        <Route 
          path="/criar-aviso" 
          element={
            <RotaProtegida>
              <MainLayout><CriarAviso /></MainLayout>
            </RotaProtegida>
          } 
        />

        {/* Mensagens */}
        <Route 
          path="/mensagens" 
          element={
            <RotaProtegida>
              <MainLayout><Mensagens /></MainLayout>
            </RotaProtegida>
          } 
        />

        {/* Notificações */}
        <Route 
          path="/notificacoes" 
          element={
            <RotaProtegida>
              <MainLayout><Notificacoes /></MainLayout>
            </RotaProtegida>
          } 
        />

        {/* Página de Busca */}
        <Route 
          path="/busca" 
          element={
            <RotaProtegida>
              <MainLayout><Buscar /></MainLayout>
            </RotaProtegida>
          } 
        />

        {/* Configurações */}
        <Route 
          path="/configuracoes" 
          element={
            <RotaProtegida>
              <MainLayout><Configuracoes /></MainLayout>
            </RotaProtegida>
          } 
        />

        {/* Redirecionamento padrão da raiz para o feed */}
        <Route path="/" element={<Navigate to="/feed" replace />} />

        {/* Fallback: Qualquer caminho inválido joga para o login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
