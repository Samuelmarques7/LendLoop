import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LuLogOut, LuMenu, LuPackage, LuSettings, LuShieldCheck, LuShoppingBag, LuUser, LuX } from 'react-icons/lu';
import logo from '../assets/logocompleta.png';
import { NotificacaoSino } from './NotificacaoSino';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);

  const isLogado = localStorage.getItem('usuarioLogado') === 'true';
  const dadosUsuario = JSON.parse(localStorage.getItem('dadosUsuario') || 'null');
  const objetivo = dadosUsuario?.objetivo || 'ambos';
  const isAdmin = isLogado && (dadosUsuario?.papel === 'admin' || dadosUsuario?.role === 'admin');
  const noPainelLocatario = location.pathname.toLowerCase() === '/painellocatario';
  const noPainelLocador = location.pathname.toLowerCase() === '/painellocador';
  const iniciais = dadosUsuario?.nome?.charAt(0).toUpperCase() || 'U';
  const nomeUsuario = dadosUsuario?.nome ? dadosUsuario.nome.split(' ').slice(0, 2).join(' ') : 'Minha conta';

  useEffect(() => {
    setMenuAberto(false);
  }, [location.pathname]);

  function navegar(rota) {
    setMenuAberto(false);
    navigate(rota);
  }

  function abrirConfiguracoes() {
    navegar('/configuracoes');
  }

  function fazerLogout() {
    localStorage.removeItem('usuarioLogado');
    localStorage.removeItem('dadosUsuario');
    localStorage.removeItem('token');
    setMenuAberto(false);
    navigate('/login');
  }

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-gray-100 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-6 lg:px-8">
      <button type="button" onClick={() => navegar('/')} aria-label="Ir para a página inicial" className="shrink-0">
        <img src={logo} alt="LendLoop" className="h-9 w-auto sm:h-12" />
      </button>

      <nav className="hidden items-center gap-2 sm:gap-4 lg:gap-6 md:flex" aria-label="Navegação principal">
        {isAdmin ? (
          <div className="flex items-center gap-6">
            <NotificacaoSino />
            <span className="flex items-center gap-2 rounded-full bg-verde-escuro/10 px-4 py-1.5 text-sm font-bold text-verde-escuro"><LuShieldCheck size={18} /> Painel Administrador</span>
            <button onClick={fazerLogout} className="flex items-center gap-2 font-bold text-red-500 transition-colors hover:text-red-700"><LuLogOut size={18} /> Sair</button>
          </div>
        ) : (
          <>
            {!isLogado && <button onClick={() => navigate('/login')} className="font-semibold text-verde-escuro transition-colors hover:text-verde-agua">Entrar</button>}
            {isLogado && objetivo === 'ambos' && (
              <div className="flex items-center rounded-full border border-ciano/30 bg-ciano/10 p-1">
                <button onClick={() => navigate('/painellocatario')} title="Modo Locatário" className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${noPainelLocatario ? 'bg-white text-azul-oceano shadow-sm' : 'text-verde-escuro/70 hover:text-verde-agua'}`}><LuShoppingBag size={16} /> Locatário</button>
                <div className="h-5 w-px bg-ciano/40" />
                <button onClick={() => navigate('/painelLocador')} title="Modo Locador" className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${noPainelLocador ? 'bg-white text-azul-oceano shadow-sm' : 'text-verde-escuro/70 hover:text-verde-agua'}`}><LuPackage size={16} /> Locador</button>
              </div>
            )}
            {isLogado && objetivo === 'locatario' && <button onClick={() => navigate('/painellocatario')} title="Painel Locatário" className="flex items-center gap-1.5 rounded-full border border-ciano/30 bg-ciano/10 px-4 py-1.5 text-sm font-semibold text-azul-oceano transition-colors hover:bg-ciano/20"><LuShoppingBag size={16} /> Painel Locatário</button>}
            {isLogado && objetivo === 'locador' && <button onClick={() => navigate('/painelLocador')} title="Painel Locador" className="flex items-center gap-1.5 rounded-full border border-ciano/30 bg-ciano/10 px-4 py-1.5 text-sm font-semibold text-azul-oceano transition-colors hover:bg-ciano/20"><LuPackage size={16} /> Painel Locador</button>}
            {isLogado && (
              <div className="flex items-center gap-2">
                <NotificacaoSino />
                <button onClick={abrirConfiguracoes} title="Configurações" className="rounded-full bg-gray-50 p-2.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-verde-agua"><LuSettings size={18} /></button>
                <button onClick={() => navigate('/meu-perfil')} className="group ml-1 flex items-center gap-2.5 border-l border-gray-200 pl-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-verde-escuro text-sm font-semibold text-white">{dadosUsuario?.avatar ? <img src={dadosUsuario.avatar} alt={dadosUsuario.nome} className="h-full w-full object-cover" /> : iniciais}</div>
                  <div className="hidden min-w-0 text-left lg:block"><p className="whitespace-nowrap text-[14px] font-semibold leading-tight text-verde-escuro transition-colors group-hover:text-verde-agua">{nomeUsuario}</p><p className="text-[12px] leading-tight text-gray-400">Ver perfil</p></div>
                </button>
              </div>
            )}
          </>
        )}
      </nav>

      <div className="flex items-center gap-2 md:hidden">
        {!isLogado ? (
          <button onClick={() => navigate('/login')} className="rounded-lg px-3 py-2 text-sm font-semibold text-verde-escuro transition-colors hover:bg-gray-50 hover:text-verde-agua">Entrar</button>
        ) : (
          <>
            <NotificacaoSino />
            <button type="button" onClick={() => setMenuAberto((aberto) => !aberto)} aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuAberto} aria-controls="menu-mobile" className="rounded-full bg-gray-50 p-2.5 text-verde-escuro transition-colors hover:bg-gray-100">{menuAberto ? <LuX size={20} /> : <LuMenu size={20} />}</button>
          </>
        )}
      </div>

      {isLogado && menuAberto && (
        <div id="menu-mobile" className="absolute inset-x-3 top-[calc(100%+0.5rem)] z-40 rounded-2xl border border-gray-100 bg-white p-3 shadow-xl md:hidden" aria-label="Menu da conta">
          <button onClick={() => navegar('/meu-perfil')} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-gray-50">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-verde-escuro font-semibold text-white">{dadosUsuario?.avatar ? <img src={dadosUsuario.avatar} alt={dadosUsuario.nome} className="h-full w-full object-cover" /> : iniciais}</div>
            <span className="min-w-0"><span className="block truncate text-sm font-semibold text-verde-escuro">{nomeUsuario}</span><span className="block text-xs text-gray-400">Ver perfil</span></span>
          </button>
          {isAdmin ? (
            <div className="mt-2 space-y-1 border-t border-gray-100 pt-2">
              <button onClick={() => navegar('/paineladmin')} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-verde-escuro hover:bg-verde-escuro/5"><LuShieldCheck size={18} /> Painel administrador</button>
              <button onClick={fazerLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-red-500 hover:bg-red-50"><LuLogOut size={18} /> Sair</button>
            </div>
          ) : (
            <div className="mt-2 space-y-1 border-t border-gray-100 pt-2">
              {objetivo !== 'locador' && <button onClick={() => navegar('/painellocatario')} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${noPainelLocatario ? 'bg-ciano/10 text-azul-oceano' : 'text-verde-escuro hover:bg-gray-50'}`}><LuShoppingBag size={18} /> Painel locatário</button>}
              {objetivo !== 'locatario' && <button onClick={() => navegar('/painelLocador')} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${noPainelLocador ? 'bg-ciano/10 text-azul-oceano' : 'text-verde-escuro hover:bg-gray-50'}`}><LuPackage size={18} /> Painel locador</button>}
              <button onClick={abrirConfiguracoes} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-verde-escuro hover:bg-gray-50"><LuSettings size={18} /> Configurações</button>
              <button onClick={() => navegar('/meu-perfil')} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-verde-escuro hover:bg-gray-50"><LuUser size={18} /> Meu perfil</button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
