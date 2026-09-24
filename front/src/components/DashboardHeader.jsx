import { LuSettings } from 'react-icons/lu';
import { NotificacaoSino } from './NotificacaoSino';
import logoMarcaPainel from '../assets/logo-painel-transparente.png';
import logoCompleta from '../assets/logocompleta.png';

const VARIANTES = {
  locatario: {
    nome: 'Locatário',
    fundo: '#0750a5',
    abaAtiva: 'bg-white/20 text-white',
    abaInativa: 'text-white/75 hover:bg-white/10 hover:text-white',
    ponto: 'bg-[#8bc4ff]',
    avatar: 'bg-white text-azul-oceano',
  },
  locador: {
    nome: 'Locador',
    fundo: '#087a3a',
    abaAtiva: 'bg-white/20 text-white',
    abaInativa: 'text-white/80 hover:bg-white/10 hover:text-white',
    ponto: 'bg-[#a4f6b7]',
    avatar: 'bg-white text-verde-escuro',
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
      <div className="flex min-h-[5.25rem] w-full items-center gap-2 px-3 sm:gap-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onInicio}
          aria-label="Ir para a página inicial"
          className="flex shrink-0 items-center gap-2 border-0 bg-transparent shadow-none transition-opacity hover:opacity-85 focus-visible:outline-offset-3"
        >
          <img src={logoMarcaPainel} alt="" className="h-11 w-11 shrink-0 scale-[1.2] object-contain sm:h-12 sm:w-12" />
          <span className="relative hidden h-10 w-[124px] overflow-hidden lg:block sm:h-11 sm:w-[138px]" aria-hidden="true">
            <img src={logoCompleta} alt="" style={{ maxWidth: 'none' }} className="absolute left-[-36px] top-0 h-10 w-auto brightness-0 invert sm:left-[-40px] sm:h-11" />
          </span>
        </button>

        <div className="hidden shrink-0 items-center gap-2 2xl:flex">
          <span className="text-sm font-semibold">Painel {estilo.nome}</span>
          <span className={`h-2 w-2 rounded-full ${estilo.ponto}`} aria-hidden="true" />
        </div>

        <nav className="flex h-[5.25rem] min-w-0 flex-1 items-center gap-0 overflow-x-auto overscroll-x-contain [scrollbar-width:none]" aria-label={`Navegação do painel ${estilo.nome.toLowerCase()}`}>
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
