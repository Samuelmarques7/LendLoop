import { LuSettings } from 'react-icons/lu';
import { NotificacaoSino } from './NotificacaoSino';
import logoMarcaPainel from '../assets/logo-painel-transparente.png';

const VARIANTES = {
  locatario: {
    nome: 'Locatário',
    fundo: '#031f3b',
    abaAtiva: 'bg-azul-oceano text-white shadow-sm shadow-black/10',
    abaInativa: 'text-white/75 hover:bg-white/10 hover:text-white',
    ponto: 'bg-azul-oceano shadow-[0_0_0_3px_rgba(0,115,243,0.18)]',
    avatar: 'bg-azul-oceano text-white',
  },
  locador: {
    nome: 'Locador',
    fundo: '#031f3b',
    abaAtiva: 'bg-verde-agua text-[#031f3b] shadow-sm shadow-black/10',
    abaInativa: 'text-white/75 hover:bg-white/10 hover:text-white',
    ponto: 'bg-verde-agua shadow-[0_0_0_3px_rgba(46,195,77,0.16)]',
    avatar: 'bg-verde-agua text-[#031f3b]',
  },
};

export function DashboardHeader({
  variante,
  menuItems,
  activeTab,
  onSelecionarAba,
  onInicio,
  onConfiguracoes,
  onPerfil,
  usuario,
}) {
  const estilo = VARIANTES[variante];
  const iniciais = usuario?.nome?.charAt(0).toUpperCase() || 'U';
  const nome = usuario?.nome ? usuario.nome.trim().split(/\s+/)[0] : 'Minha conta';

  return (
    <header
      className="sticky top-0 z-50 text-white shadow-[0_10px_24px_rgba(3,45,84,0.16)]"
      style={{ backgroundColor: estilo.fundo }}
    >
      <div className="mx-auto flex min-h-[5.25rem] w-full max-w-[1920px] flex-wrap items-center justify-between gap-x-2 gap-y-1.5 px-3 py-2 sm:gap-x-4 sm:px-6 lg:flex-nowrap lg:justify-start lg:px-8 lg:py-0 2xl:px-12">
        <button
          type="button"
          onClick={onInicio}
          aria-label="Ir para a página inicial"
          className="flex shrink-0 items-center gap-2 border-0 bg-transparent shadow-none transition-opacity hover:opacity-85 focus-visible:outline-offset-3"
        >
          <img src={logoMarcaPainel} alt="" className="h-11 w-11 shrink-0 scale-[1.2] object-contain sm:h-12 sm:w-12" />
          <span className="hidden text-[25px] font-semibold leading-none tracking-[-0.06em] text-white lg:block" aria-hidden="true">LendLoop</span>
        </button>

        <div className="hidden shrink-0 items-center gap-2 2xl:flex">
          <span className="text-sm font-semibold">Painel {estilo.nome}</span>
          <span className={`h-2 w-2 rounded-full ${estilo.ponto}`} aria-hidden="true" />
        </div>

        <nav className="order-last flex h-11 w-full min-w-0 flex-none items-center gap-1.5 overflow-x-auto overscroll-x-contain px-0.5 [scrollbar-width:none] sm:gap-2 lg:order-none lg:h-[5.25rem] lg:w-auto lg:flex-1" aria-label={`Navegação do painel ${estilo.nome.toLowerCase()}`}>
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelecionarAba(item)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-2 text-[13px] font-semibold transition-colors sm:px-3 sm:text-sm ${isActive ? estilo.abaAtiva : estilo.abaInativa}`}
              >
                <Icon size={17} strokeWidth={isActive ? 2.4 : 2} aria-hidden="true" />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <NotificacaoSino variant={variante} />
          <button
            type="button"
            onClick={onConfiguracoes}
            title="Configurações"
            aria-label="Abrir configurações"
            className="rounded-full border border-white/25 bg-white/10 p-2.5 text-white transition-colors hover:bg-white/20"
          >
            <LuSettings size={18} />
          </button>
          <button
            type="button"
            onClick={onPerfil}
            aria-label="Abrir meu perfil"
            className="group flex items-center gap-2 rounded-full border border-white/25 bg-white/10 p-1 pr-2 transition-colors hover:bg-white/20 sm:pr-3"
          >
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold ${estilo.avatar}`}>
              {usuario?.avatar ? <img src={usuario.avatar} alt={usuario.nome} className="h-full w-full object-cover" /> : iniciais}
            </span>
            <span className="hidden min-w-0 text-left lg:block">
              <span className="block max-w-20 truncate text-[13px] font-semibold leading-tight xl:max-w-24 xl:text-[14px] 2xl:max-w-32">{nome}</span>
              <span className="hidden text-[11px] leading-tight text-white/65 2xl:block">Meu perfil</span>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
