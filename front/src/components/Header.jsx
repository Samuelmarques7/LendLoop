import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

export function Header() {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-gray-100 px-8 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      <img
        src={logo}
        alt="LendLoop"
        className="h-12 w-auto cursor-pointer"
        onClick={() => navigate('/')}
      />
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/painelLocador')}
          className="text-verde-escuro hover:text-verde-agua font-semibold transition-colors cursor-pointer"
        >
          Entrar
        </button>
        
        <button 
          onClick={() => navigate('/criar-anuncio')}
          className="bg-verde-agua text-white px-5 py-2 rounded-lg font-semibold hover:bg-verde-escuro transition-colors cursor-pointer"
        >
          Criar Anúncio
        </button>
      </div>
    </header>
  );
}