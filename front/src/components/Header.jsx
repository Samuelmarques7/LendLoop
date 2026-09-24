import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LuLogOut, LuMenu, LuPackage, LuSettings, LuShieldCheck, LuShoppingBag, LuUser, LuX } from 'react-icons/lu';
import logo from '../assets/logocompleta.png';
import { NotificacaoSino } from './NotificacaoSino';
import { useConfirmacao } from '../context/ConfirmacaoContext';

export function Header({ variant = 'standard' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const confirmar = useConfirmacao();
  const [menuAberto, setMenuAberto] = useState(false);
  const isLogado = localStorage.getItem('usuarioLogado') === 'true';
  const dadosUsuario = JSON.parse(localStorage.getItem('dadosUsuario') || 'null');
  const objetivo = dadosUsuario?.objetivo || 'ambos';
  const isAdmin = isLogado && (dadosUsuario?.papel === 'admin' || dadosUsuario?.role === 'admin');
  const noPainelLocatario = location.pathname.toLowerCase() === '/painellocatario';
  const noPainelLocador = location.pathname.toLowerCase() === '/painellocador';
  const iniciais = dadosUsuario?.nome?.charAt(0).toUpperCase() || 'U';
  const nomeUsuario = dadosUsuario?.nome ? dadosUsuario.nome.split(' ').slice(0, 2).join(' ') : 'Minha conta';
  const isExplorar = location.pathname === '/busca';
  const isComoFunciona = ['/sobre', '/faq', '/contato'].includes(location.pathname);
  const isHero = variant === 'hero' || variant === 'standard';

  useEffect(() => {
    setMenuAberto(false);
  }, [location.pathname]);

  function navegar(rota) {
    setMenuAberto(false);
    navigate(rota);
  }

  async function fazerLogout() {
    const confirmou = await confirmar({
      titulo: 'Sair da conta?',
      mensagem: 'Você precisará entrar novamente para acessar seus painéis e informações.',
      textoConfirmar: 'Sair',
      textoCancelar: 'Ficar',
      variante: 'perigo',
    });

    if (!confirmou) return;

    localStorage.removeItem('usuarioLogado');
    localStorage.removeItem('dadosUsuario');
    localStorage.removeItem('token');
    setMenuAberto(false);
    navigate('/');
  }

  const classeLinkPublico = (ativo) => `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isHero
      ? ativo ? 'text-white' : 'text-white/70 hover:text-white'
      : ativo ? 'text-verde-escuro' : 'text-slate-500 hover:text-verde-escuro'
  }`;

  return (
    <header className={variant === 'hero' ? 'absolute inset-x-0 top-0 z-50 bg-gradient-to-b from-slate-950/55 to-transparent' : 'sticky top-0 z-50 bg-[#031f3b] shadow-[0_8px_24px_rgba(3,24,48,0.2)]'}>
      <div className={`relative mx-auto flex min-h-[5.25rem] items-center justify-between gap-3 px-5 sm:px-8 ${isHero ? 'max-w-none lg:px-6' : 'max-w-7xl lg:px-10'}`}>
        <button type="button" onClick={() => navegar('/')} aria-label="Ir para a página inicial" className="shrink-0 transition-opacity hover:opacity-80 focus-visible:outline-offset-3">
          {isHero ? (
            <span className="flex items-center gap-2" aria-hidden="true">
              <span className="relative block h-11 w-11 shrink-0 overflow-hidden sm:h-12 sm:w-12">
                <img src={logo} alt="" style={{ maxWidth: 'none' }} className="absolute left-0 top-0 h-11 w-auto drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)] sm:h-12" />
              </span>
              <span className="relative block h-10 w-[124px] overflow-hidden sm:h-11 sm:w-[138px]">
                <img src={logo} alt="" style={{ maxWidth: 'none' }} className="absolute left-[-36px] top-0 h-10 w-auto brightness-0 invert drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)] sm:left-[-40px] sm:h-11" />
              </span>
            </span>
          ) : (
            <img src={logo} alt="LendLoop" className="h-8 w-auto sm:h-9" />
          )}
        </button>

        {!isLogado && (
          <nav className="hidden flex-1 items-center justify-center gap-1 md:flex" aria-label="Navegação pública">
            <button type="button" onClick={() => navegar('/')} className={classeLinkPublico(location.pathname === '/')}>Início</button>
            <button type="button" onClick={() => navegar('/busca')} className={classeLinkPublico(isExplorar)}>Explorar</button>
            <button type="button" onClick={() => navegar('/sobre')} className={classeLinkPublico(isComoFunciona)}>Como funciona</button>
          </nav>
        )}

        <nav className="hidden items-center gap-2 sm:gap-3 md:flex" aria-label="Navegação da conta">
          {isAdmin ? (
            <div className="flex items-center gap-4">
              <NotificacaoSino variant={isHero ? 'hero' : 'standard'} />
              <span className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${isHero ? 'border border-white/20 bg-white/10 text-white' : 'bg-verde-escuro/8 text-verde-escuro'}`}><LuShieldCheck size={17} /> Painel administrador</span>
              <button type="button" onClick={fazerLogout} className={`flex items-center gap-2 px-2 py-2 text-sm font-semibold transition-colors ${isHero ? 'text-red-200 hover:text-white' : 'text-red-500 hover:text-red-700'}`}><LuLogOut size={17} /> Sair</button>
            </div>
          ) : (
            <>
              {!isLogado && (
                <>
                  <button type="button" onClick={() => navigate('/login')} className={`px-3 py-2 text-sm font-semibold transition-colors ${isHero ? 'text-white/90 hover:text-white' : 'text-verde-escuro hover:text-verde-agua'}`}>Entrar</button>
                  <button type="button" onClick={() => navigate('/cadastro')} className={`rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-all hover:-translate-y-px hover:shadow-md ${isHero ? 'border border-white/70 bg-white/10 text-white hover:bg-white/20' : 'bg-verde-agua text-white hover:bg-[#22ae40]'}`}>Criar conta</button>
                </>
              )}
              {isLogado && objetivo === 'ambos' && (
                <div className={`flex items-center rounded-xl border p-1 ${isHero ? 'border-white/20 bg-white/10' : 'border-ciano/25 bg-ciano/8'}`}>
                  <button type="button" onClick={() => navigate('/painellocatario')} title="Modo locatário" className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${noPainelLocatario ? 'bg-white text-azul-oceano shadow-sm' : isHero ? 'text-white/75 hover:text-white' : 'text-verde-escuro/70 hover:text-verde-agua'}`}><LuShoppingBag size={16} /> Locatário</button>
                  <span className={`h-5 w-px ${isHero ? 'bg-white/25' : 'bg-ciano/30'}`} aria-hidden="true" />
                  <button type="button" onClick={() => navigate('/painelLocador')} title="Modo locador" className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${noPainelLocador ? 'bg-white text-azul-oceano shadow-sm' : isHero ? 'text-white/75 hover:text-white' : 'text-verde-escuro/70 hover:text-verde-agua'}`}><LuPackage size={16} /> Locador</button>
                </div>
              )}
              {isLogado && objetivo === 'locatario' && <button type="button" onClick={() => navigate('/painellocatario')} title="Painel locatário" className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${isHero ? 'border-white/20 bg-white/10 text-white hover:bg-white/20' : 'border-ciano/25 bg-ciano/8 text-azul-oceano hover:bg-ciano/15'}`}><LuShoppingBag size={16} /> Painel locatário</button>}
              {isLogado && objetivo === 'locador' && <button type="button" onClick={() => navigate('/painelLocador')} title="Painel locador" className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${isHero ? 'border-white/20 bg-white/10 text-white hover:bg-white/20' : 'border-ciano/25 bg-ciano/8 text-azul-oceano hover:bg-ciano/15'}`}><LuPackage size={16} /> Painel locador</button>}
              {isLogado && (
                <div className={`flex items-center gap-1.5 border-l pl-3 ${isHero ? 'border-white/20' : 'border-slate-200'}`}>
                  <NotificacaoSino variant={isHero ? 'hero' : 'standard'} />
                  <button type="button" onClick={() => navegar('/configuracoes')} title="Configurações" aria-label="Abrir configurações" className={`rounded-full p-2.5 transition-colors ${isHero ? 'border border-verde-agua/75 bg-verde-agua/15 text-white shadow-[0_0_0_3px_rgba(46,195,77,0.12)] hover:bg-verde-agua' : 'text-slate-500 hover:bg-slate-100 hover:text-verde-agua'}`}><LuSettings size={18} /></button>
                  <button type="button" onClick={() => navigate('/meu-perfil')} className={`group flex items-center gap-2 rounded-full p-1 transition-colors ${isHero ? 'border border-verde-agua/75 bg-verde-agua/15 pr-2 shadow-[0_0_0_3px_rgba(46,195,77,0.12)] hover:bg-verde-agua/25' : 'hover:bg-slate-50'}`}>
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-semibold text-white ${isHero ? 'bg-verde-agua ring-2 ring-white/70' : 'bg-verde-escuro'}`}>{dadosUsuario?.avatar ? <img src={dadosUsuario.avatar} alt={dadosUsuario.nome} className="h-full w-full object-cover" /> : iniciais}</span>
                    <span className="hidden min-w-0 pr-2 text-left lg:block"><span className={`block max-w-32 truncate text-[14px] font-semibold leading-tight group-hover:text-verde-agua ${isHero ? 'text-white' : 'text-verde-escuro'}`}>{nomeUsuario}</span><span className={`block text-[12px] leading-tight ${isHero ? 'text-white/50' : 'text-slate-400'}`}>Meu perfil</span></span>
                  </button>
                </div>
              )}
            </>
          )}
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          {!isLogado ? (
            <button type="button" onClick={() => navigate('/login')} className={`px-3 py-2 text-sm font-semibold transition-colors ${isHero ? 'text-white/85 hover:text-white' : 'text-verde-escuro hover:text-verde-agua'}`}>Entrar</button>
          ) : (
            <>
              <NotificacaoSino variant={isHero ? 'hero' : 'standard'} />
              <button type="button" onClick={() => setMenuAberto((aberto) => !aberto)} aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuAberto} aria-controls="menu-mobile" className={`rounded-full p-2.5 transition-colors ${isHero ? 'text-white hover:bg-white/10' : 'text-verde-escuro hover:bg-slate-100'}`}>{menuAberto ? <LuX size={20} /> : <LuMenu size={20} />}</button>
            </>
          )}
        </div>

        {isLogado && menuAberto && (
          <div id="menu-mobile" className="absolute inset-x-3 top-[calc(100%+0.5rem)] z-40 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl md:hidden" aria-label="Menu da conta">
            <button type="button" onClick={() => navegar('/meu-perfil')} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-slate-50">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-verde-escuro font-semibold text-white">{dadosUsuario?.avatar ? <img src={dadosUsuario.avatar} alt={dadosUsuario.nome} className="h-full w-full object-cover" /> : iniciais}</span>
              <span className="min-w-0"><span className="block truncate text-sm font-semibold text-verde-escuro">{nomeUsuario}</span><span className="block text-xs text-slate-400">Meu perfil</span></span>
            </button>
            {isAdmin ? (
              <div className="mt-2 space-y-1 border-t border-slate-100 pt-2">
                <button type="button" onClick={() => navegar('/paineladmin')} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-verde-escuro hover:bg-verde-escuro/5"><LuShieldCheck size={18} /> Painel administrador</button>
                <button type="button" onClick={fazerLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-red-500 hover:bg-red-50"><LuLogOut size={18} /> Sair</button>
              </div>
            ) : (
              <div className="mt-2 space-y-1 border-t border-slate-100 pt-2">
                {objetivo !== 'locador' && <button type="button" onClick={() => navegar('/painellocatario')} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${noPainelLocatario ? 'bg-ciano/10 text-azul-oceano' : 'text-verde-escuro hover:bg-slate-50'}`}><LuShoppingBag size={18} /> Painel locatário</button>}
                {objetivo !== 'locatario' && <button type="button" onClick={() => navegar('/painelLocador')} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${noPainelLocador ? 'bg-ciano/10 text-azul-oceano' : 'text-verde-escuro hover:bg-slate-50'}`}><LuPackage size={18} /> Painel locador</button>}
                <button type="button" onClick={() => navegar('/configuracoes')} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-verde-escuro hover:bg-slate-50"><LuSettings size={18} /> Configurações</button>
                <button type="button" onClick={() => navegar('/meu-perfil')} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-verde-escuro hover:bg-slate-50"><LuUser size={18} /> Meu perfil</button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
