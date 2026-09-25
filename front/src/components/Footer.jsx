import { Link } from 'react-router-dom';
import { LuMail, LuShieldCheck } from 'react-icons/lu';
import logoMarcaPainel from '../assets/logo-painel-transparente.webp';

const linksInstitucionais = [
  { to: '/sobre', label: 'Sobre nós' },
  { to: '/faq', label: 'Perguntas frequentes' },
  { to: '/contato', label: 'Contato' },
];

const linksLegais = [
  { to: '/termos', label: 'Termos de uso' },
  { to: '/privacidade', label: 'Política de privacidade' },
];

export function Footer() {
  return (
    <footer className="mt-auto bg-verde-escuro text-white">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 2xl:max-w-[1440px] 2xl:px-10">
        <div className="grid gap-10 py-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_.7fr_.9fr] lg:gap-16 lg:py-12 2xl:gap-24 2xl:py-14">
          <div className="max-w-sm">
            <Link to="/" aria-label="LendLoop — voltar para a página inicial" className="inline-flex items-center gap-2">
              <img src={logoMarcaPainel} alt="" className="h-11 w-11 shrink-0 scale-[1.2] object-contain" />
              <span className="text-[25px] font-semibold leading-none tracking-[-0.06em] text-white" aria-hidden="true">LendLoop</span>
            </Link>
            <p className="mt-5 text-sm leading-relaxed text-white/65">Alugue o que precisa perto de você. Mais acesso, menos acúmulo e mais possibilidades para o dia a dia.</p>
            <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-white/80"><LuShieldCheck size={16} className="text-verde-agua" /> Uma experiência feita para a sua região</span>
          </div>

          <nav aria-label="Links institucionais">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-verde-agua">LendLoop</h2>
            <ul className="mt-5 space-y-3">
              {linksInstitucionais.map(({ to, label }) => (
                <li key={to}><Link to={to} className="text-sm text-white/70 transition-colors hover:text-white">{label}</Link></li>
              ))}
            </ul>
          </nav>

          <div>
            <nav aria-label="Links legais">
              <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-verde-agua">Informações</h2>
              <ul className="mt-5 space-y-3">
                {linksLegais.map(({ to, label }) => (
                  <li key={to}><Link to={to} className="text-sm text-white/70 transition-colors hover:text-white">{label}</Link></li>
                ))}
              </ul>
            </nav>
            <Link to="/contato" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-white transition-colors hover:text-verde-agua">
              <LuMail size={17} className="text-verde-agua" /> Fale com a equipe
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 py-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} LendLoop. Todos os direitos reservados.</p>
          <p>Feito para compartilhar melhor o que já existe.</p>
        </div>
      </div>
    </footer>
  );
}
