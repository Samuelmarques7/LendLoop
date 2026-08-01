import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

export function Header() {
  const navigate = useNavigate();
  
  const isLogado = localStorage.getItem('usuarioLogado') === 'true';

  const handleCriarAnuncio = () => {
    if (isLogado) {
      navigate('/criar-anuncio');
    } else {
      navigate('/login');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('usuarioLogado');
    window.location.reload(); 
  };

  return (
    <header className="bg-white border-b border-gray-100 px-8 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      
      <img
        src={logo}
        alt="LendLoop"
        className="h-19 w-auto cursor-pointer"
        onClick={() => navigate('/')}
      />

      <nav className="flex items-center gap-6">
        
        {isLogado ? (
          <div className="flex items-center gap-4">       
            <button 
              onClick={() => navigate('/meu-perfil')}
              className="text-[#006861] hover:text-[#00B795] font-semibold transition-colors cursor-pointer"
            >
              Meu Perfil
            </button>
          </div>
        ) : (
          <button 
            onClick={() => navigate('/login')}
            className="text-[#006861] hover:text-[#00B795] font-semibold transition-colors cursor-pointer"
          >
            Entrar
          </button>
        )}

        <button 
          onClick={handleCriarAnuncio}
          className="bg-[#00B795] text-white px-5 py-2 rounded-lg font-semibold hover:bg-[#006861] transition-colors cursor-pointer"
        >
          Criar Anúncio
        </button>

      </nav>
    </header>
  );
}