import { Navigate, Outlet } from 'react-router-dom';

export function RotaAdmin() {
  const dadosUsuarioRaw = localStorage.getItem('dadosUsuario');
  
  if (!dadosUsuarioRaw) {
    return <Navigate to="/login" replace />;
  }

  const usuarioLogado = JSON.parse(dadosUsuarioRaw);

  if (usuarioLogado.papel !== 'admin') {
    return <Navigate to="/" replace />; // Se não for admin, joga para a Home
  }

  return <Outlet />;
}