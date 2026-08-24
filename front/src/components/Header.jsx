import { useNavigate, useLocation } from 'react-router-dom';
import { LuShoppingBag, LuPackage, LuSettings } from 'react-icons/lu';
import logo from '../assets/logocompleta.png';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const isLogado = localStorage.getItem('usuarioLogado') === 'true';
  const dadosUsuario = JSON.parse(localStorage.getItem('dadosUsuario') || 'null');
  const objetivo = dadosUsuario?.objetivo || 'ambos';

  const noPainelLocatario = location.pathname.toLowerCase() === '/painellocatario';
  const noPainelLocador = location.pathname.toLowerCase() === '/painellocador';

  function abrirConfiguracoes() {
  navigate('/configuracoes');
}

  return (
    <header className="bg-white border-b border-gray-100 px-8 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      
      <img
        src={logo}
        alt="LendLoop"
        className="h-14 w-auto cursor-pointer"
        onClick={() => navigate('/')}
      />

      <nav className="flex items-center gap-6">
        
        {isLogado ? (
          <div className="flex items-center gap-4">       
            <button 
              onClick={() => navigate('/meu-perfil')}
              className="text-[#032D54] hover:text-[#29C354] font-semibold transition-colors cursor-pointer"
            >
              Meu Perfil
            </button>
          </div>
        ) : (
          <button 
            onClick={() => navigate('/login')}
            className="text-[#032D54] hover:text-[#29C354] font-semibold transition-colors cursor-pointer"
          >
            Entrar
          </button>
        )}

        {isLogado && objetivo === 'ambos' && (
        <div className="flex items-center bg-[#0297AA]/10 border border-[#0297AA]/30 rounded-full p-1">
          <button
            onClick={() => navigate('/painellocatario')}
            title="Modo Locatário"
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
              noPainelLocatario
                ? 'bg-white text-[#0068F3] shadow-sm'
                : 'text-[#032D54]/70 hover:text-[#29C354]'
            }`}
          >
            <LuShoppingBag size={16} /> Locatário
          </button>

          <div className="w-px h-5 bg-[#0297AA]/40" />

          <button
            onClick={() => navigate('/painelLocador')}
            title="Modo Locador"
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
              noPainelLocador
                ? 'bg-white text-[#0068F3] shadow-sm'
                : 'text-[#032D54]/70 hover:text-[#29C354]'
            }`}
          >
            <LuPackage size={16} /> Locador
          </button>
        </div>
      )}

        {isLogado && objetivo === 'locatario' && (
          <button
            onClick={() => navigate('/painellocatario')}
            title="Painel Locatário"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold bg-[#0297AA]/10 border border-[#0297AA]/30 text-[#0068F3] hover:bg-[#0297AA]/20 transition-colors cursor-pointer"
          >
            <LuShoppingBag size={16} /> Painel Locatário
          </button>
        )}

        {isLogado && objetivo === 'locador' && (
          <button
            onClick={() => navigate('/painelLocador')}
            title="Painel Locador"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold bg-[#0297AA]/10 border border-[#0297AA]/30 text-[#0068F3] hover:bg-[#0297AA]/20 transition-colors cursor-pointer"
          >
            <LuPackage size={16} /> Painel Locador
          </button>
        )}

        {isLogado && (
          <button
            onClick={abrirConfiguracoes}
            title="Configurações"
            className="p-2.5 rounded-full bg-gray-50 text-gray-500 hover:text-[#29C354] hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <LuSettings size={18} />
          </button>
        )}

      </nav>
    </header>
  );
}