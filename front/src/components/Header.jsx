import { useNavigate, useLocation } from 'react-router-dom';
import { LuShoppingBag, LuPackage, LuSettings, LuShieldCheck, LuLogOut } from 'react-icons/lu';
import logo from '../assets/logocompleta.png';
import { NotificacaoSino } from './NotificacaoSino';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const isLogado = localStorage.getItem('usuarioLogado') === 'true';
  const dadosUsuario = JSON.parse(localStorage.getItem('dadosUsuario') || 'null');
  const objetivo = dadosUsuario?.objetivo || 'ambos';

  // Verifica se o usuário atual é o Administrador (Lembrando que arrumamos para 'papel' lá atrás!)
  const isAdmin = isLogado && (dadosUsuario?.papel === 'admin' || dadosUsuario?.role === 'admin');

  const noPainelLocatario = location.pathname.toLowerCase() === '/painellocatario';
  const noPainelLocador = location.pathname.toLowerCase() === '/painellocador';

  function abrirConfiguracoes() {
    navigate('/configuracoes');
  }

  // Função para o botão de sair do Admin
  function fazerLogout() {
    localStorage.removeItem('usuarioLogado');
    localStorage.removeItem('dadosUsuario');
    localStorage.removeItem('token');
    navigate('/login');
  }

  return (
    <header className="bg-white border-b border-gray-100 px-8 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      
      <img
        src={logo}
        alt="LendLoop"
        className="h-13 w-auto cursor-pointer"
        onClick={() => navigate('/')}
      />

      <nav className="flex items-center gap-6">
        
        {/* === VISUAL EXCLUSIVO DO ADMINISTRADOR === */}
        {isAdmin ? (
          <div className="flex items-center gap-6">
            <NotificacaoSino />
            <span className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold bg-verde-escuro/10 text-verde-escuro">
              <LuShieldCheck size={18} /> Painel Administrador
            </span>
            <button 
              onClick={fazerLogout}
              className="flex items-center gap-2 text-red-500 hover:text-red-700 font-bold transition-colors cursor-pointer"
            >
              <LuLogOut size={18} /> Sair
            </button>
          </div>
        ) : (
          
          /* === VISUAL DO USUÁRIO NORMAL (LOCADOR/LOCATÁRIO) === */
          <>
            {!isLogado && (
              <button 
                onClick={() => navigate('/login')}
                className="text-verde-escuro hover:text-verde-agua font-semibold transition-colors cursor-pointer"
              >
                Entrar
              </button>
            )}

            {isLogado && objetivo === 'ambos' && (
              <div className="flex items-center bg-ciano/10 border border-ciano/30 rounded-full p-1">
                <button
                  onClick={() => navigate('/painellocatario')}
                  title="Modo Locatário"
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                    noPainelLocatario
                      ? 'bg-white text-azul-oceano shadow-sm'
                      : 'text-verde-escuro/70 hover:text-verde-agua'
                  }`}
                >
                  <LuShoppingBag size={16} /> Locatário
                </button>

                <div className="w-px h-5 bg-ciano/40" />

                <button
                  onClick={() => navigate('/painelLocador')}
                  title="Modo Locador"
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                    noPainelLocador
                      ? 'bg-white text-azul-oceano shadow-sm'
                      : 'text-verde-escuro/70 hover:text-verde-agua'
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
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold bg-ciano/10 border border-ciano/30 text-azul-oceano hover:bg-ciano/20 transition-colors cursor-pointer"
              >
                <LuShoppingBag size={16} /> Painel Locatário
              </button>
            )}

            {isLogado && objetivo === 'locador' && (
              <button
                onClick={() => navigate('/painelLocador')}
                title="Painel Locador"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold bg-ciano/10 border border-ciano/30 text-azul-oceano hover:bg-ciano/20 transition-colors cursor-pointer"
              >
                <LuPackage size={16} /> Painel Locador
              </button>
            )}

            {isLogado && (
              <div className="flex items-center gap-2">
                <NotificacaoSino />

                <button
                  onClick={abrirConfiguracoes}
                  title="Configurações"
                  className="p-2.5 rounded-full bg-gray-50 text-gray-500 hover:text-verde-agua hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <LuSettings size={18} />
                </button>

                <button
                  onClick={() => navigate('/meu-perfil')}
                  className="flex items-center gap-2.5 pl-3 ml-1 border-l border-gray-200 cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-full bg-verde-escuro text-white flex items-center justify-center font-semibold text-sm overflow-hidden flex-shrink-0">
                    {dadosUsuario?.avatar ? (
                      <img src={dadosUsuario.avatar} alt={dadosUsuario.nome} className="w-full h-full object-cover" />
                    ) : (
                      dadosUsuario?.nome?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="hidden lg:block text-left min-w-0">
                    <p className="text-[14px] font-semibold text-verde-escuro whitespace-nowrap leading-tight group-hover:text-verde-agua transition-colors">
                      {dadosUsuario?.nome ? dadosUsuario.nome.split(' ').slice(0, 2).join(' ') : 'Carregando...'}
                    </p>
                    <p className="text-[12px] text-gray-400 leading-tight">Ver perfil</p>
                  </div>
                </button>
              </div>
            )}
          </>
        )}

      </nav>
    </header>
  );
}
