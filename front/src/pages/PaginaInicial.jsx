import { createElement, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LuArrowRight,
  LuCalendarDays,
  LuCheck,
  LuClock,
  LuHandCoins,
  LuMapPin,
  LuPackage,
  LuSearch,
  LuShieldCheck,
  LuSparkles,
  LuTrendingUp,
  LuWallet,
  LuX,
} from 'react-icons/lu';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import heroEscuro from '../assets/hero/lendloop-hero-dark-v6.png';
import { useBuscasRecentes } from '../hooks/useBuscasRecentes';
import { SUGESTOES_POPULARES, BANCO_DE_PALAVRAS } from '../constants/buscasPopulares';
import { CATEGORIAS } from '../constants/categorias';

const beneficios = [
  { icone: LuMapPin, titulo: 'Perto de você', descricao: 'Encontre itens disponíveis na sua região, sem deslocamentos desnecessários.' },
  { icone: LuShieldCheck, titulo: 'Com mais segurança', descricao: 'Perfis verificados, conversa dentro da plataforma e registro da vistoria.' },
  { icone: LuWallet, titulo: 'Mais leve para o bolso', descricao: 'Use o que precisa pelo tempo certo, sem comprar algo que ficará parado.' },
];

const etapas = [
  { icone: LuSearch, numero: '01', titulo: 'Encontre', descricao: 'Pesquise o que precisa e descubra opções na sua região.' },
  { icone: LuCalendarDays, numero: '02', titulo: 'Combine', descricao: 'Escolha as datas e alinhe a retirada com tranquilidade.' },
  { icone: LuHandCoins, numero: '03', titulo: 'Aproveite', descricao: 'Use pelo tempo certo e devolva quando terminar.' },
];

function escaparRegex(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function destacarTexto(texto, busca) {
  if (!busca) return texto;
  const regex = new RegExp(`(${escaparRegex(busca)})`, 'gi');

  return texto.split(regex).map((parte, indice) => (
    <span key={`${parte}-${indice}`} className={parte.toLowerCase() === busca.toLowerCase() ? 'text-azul-oceano font-semibold' : ''}>
      {parte}
    </span>
  ));
}

export function PaginaInicial() {
  const navigate = useNavigate();
  const [buscaHome, setBuscaHome] = useState('');
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const buscaRef = useRef(null);
  const { buscasRecentes, salvarBuscaRecente, removerBuscaRecente, limparBuscasRecentes } = useBuscasRecentes();
  const isLogado = localStorage.getItem('usuarioLogado') === 'true';

  useEffect(() => {
    function fecharAoClicarFora(evento) {
      if (buscaRef.current && !buscaRef.current.contains(evento.target)) setMostrarSugestoes(false);
    }

    document.addEventListener('mousedown', fecharAoClicarFora);
    return () => document.removeEventListener('mousedown', fecharAoClicarFora);
  }, []);

  function executarBusca(termo) {
    const termoFinal = (termo ?? buscaHome).trim();
    if (!termoFinal) return;

    salvarBuscaRecente(termoFinal);
    setMostrarSugestoes(false);
    navigate(`/busca?${new URLSearchParams({ busca: termoFinal }).toString()}`);
  }

  function abrirCategoria(categoria) {
    navigate(`/busca?${new URLSearchParams({ categoria: categoria.value }).toString()}`);
  }

  const buscaNormalizada = buscaHome.toLowerCase().trim();
  const recentesFiltradas = buscaNormalizada
    ? buscasRecentes.filter((termo) => termo.toLowerCase().includes(buscaNormalizada))
    : buscasRecentes;
  const sugestoesFiltradas = buscaNormalizada
    ? BANCO_DE_PALAVRAS
      .filter((termo) => termo.toLowerCase().includes(buscaNormalizada))
      .sort((primeiro, segundo) => Number(segundo.toLowerCase().startsWith(buscaNormalizada)) - Number(primeiro.toLowerCase().startsWith(buscaNormalizada)))
      .slice(0, 6)
    : SUGESTOES_POPULARES;
  const mostrarDropdown = mostrarSugestoes && (buscaNormalizada || recentesFiltradas.length || sugestoesFiltradas.length);

  return (
    <div className="page-shell min-h-screen text-grafite">
      <Header />

      <main>
        <section className="relative isolate overflow-visible bg-verde-escuro px-6 py-16 sm:px-8 lg:min-h-[540px] lg:py-20">
          <img src={heroEscuro} alt="Itens variados disponíveis para aluguel" className="hero-pan absolute inset-0 -z-30 h-full w-full object-cover object-center" />
          <div className="absolute inset-0 -z-20 bg-black/25" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,rgba(3,45,84,.25),transparent_52%,rgba(0,0,0,.22))]" />

          <div className="mx-auto flex w-full max-w-5xl flex-col items-center text-center">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-ciano/50 bg-ciano/15 px-4 py-2 text-[11px] font-bold tracking-[0.16em] text-white">
              <LuSparkles size={14} className="text-verde-agua" /> ALUGUE. USE. DEVOLVA.
            </span>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-6xl">
              O que você precisa,<br /><span className="text-verde-agua">sem precisar comprar.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              Descubra itens de pessoas da sua região para projetos, viagens, festas e o dia a dia.
            </p>

            <div ref={buscaRef} className="relative mt-9 w-full max-w-3xl text-left">
              <form onSubmit={(evento) => { evento.preventDefault(); executarBusca(); }} className="hero-search flex min-h-16 w-full items-center rounded-2xl bg-white p-2 shadow-2xl shadow-black/25 ring-1 ring-white/20">
                <LuSearch size={21} className="ml-3 mr-3 shrink-0 text-azul-oceano" />
                <input
                  type="text"
                  aria-label="Buscar itens para alugar"
                  aria-autocomplete="list"
                  aria-controls="sugestoes-de-busca"
                  aria-expanded={mostrarDropdown}
                  placeholder="O que você quer alugar hoje?"
                  value={buscaHome}
                  onFocus={() => setMostrarSugestoes(true)}
                  onChange={(evento) => setBuscaHome(evento.target.value)}
                  className="hero-search-input min-w-0 flex-1 bg-transparent py-3 text-base font-medium text-grafite outline-none placeholder:text-gray-400"
                />
                <button type="submit" className="hidden rounded-xl bg-verde-agua px-6 py-3 font-bold text-white transition-colors hover:bg-ciano focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-escuro sm:block">Buscar</button>
                <button type="submit" aria-label="Buscar" className="rounded-xl bg-verde-agua p-3 text-white transition-colors hover:bg-ciano focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-escuro sm:hidden"><LuSearch size={20} /></button>
              </form>

              {mostrarDropdown && (
                <div id="sugestoes-de-busca" className="absolute left-0 top-[calc(100%+10px)] z-30 w-full overflow-hidden rounded-2xl border border-gray-100 bg-white py-2 shadow-2xl shadow-verde-escuro/15">
                  {buscaNormalizada && (
                    <button onClick={() => executarBusca()} className="flex w-full items-center gap-3 bg-azul-oceano/5 px-5 py-3 text-left text-sm font-bold text-azul-oceano transition-colors hover:bg-azul-oceano/10">
                      <LuSearch size={16} /> Buscar por “{buscaHome}”
                    </button>
                  )}

                  {recentesFiltradas.length > 0 && (
                    <div className="py-2">
                      <div className="flex items-center justify-between px-5 pb-1 pt-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Buscas recentes</span>
                        {!buscaNormalizada && <button onClick={limparBuscasRecentes} className="text-[10px] font-bold uppercase tracking-wider text-azul-oceano hover:text-verde-escuro">Limpar</button>}
                      </div>
                      {recentesFiltradas.slice(0, 4).map((termo) => (
                        <div key={termo} className="flex items-center px-2 hover:bg-gray-50">
                          <button onClick={() => executarBusca(termo)} className="flex flex-1 items-center gap-3 px-3 py-2.5 text-left text-sm text-gray-600"><LuClock size={16} className="text-gray-400" /> {destacarTexto(termo, buscaNormalizada)}</button>
                          <button onClick={(evento) => removerBuscaRecente(termo, evento)} aria-label={`Remover ${termo}`} className="rounded-lg p-2 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"><LuX size={15} /></button>
                        </div>
                      ))}
                    </div>
                  )}

                  {sugestoesFiltradas.length > 0 && (
                    <div className="border-t border-gray-100 py-2">
                      <span className="block px-5 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">{buscaNormalizada ? 'Sugestões' : 'Mais procurados'}</span>
                      {sugestoesFiltradas.map((termo) => (
                        <button key={termo} onClick={() => executarBusca(termo)} className="flex w-full items-center gap-3 px-5 py-2.5 text-left text-sm font-medium text-grafite transition-colors hover:bg-gray-50">
                          {buscaNormalizada ? <LuSearch size={16} className="text-gray-400" /> : <LuTrendingUp size={16} className="text-verde-agua" />}
                          {destacarTexto(termo, buscaNormalizada)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-medium text-white/75">
              <span className="inline-flex items-center gap-1.5"><LuShieldCheck size={15} className="text-verde-agua" /> Perfis verificados</span>
              <span className="inline-flex items-center gap-1.5"><LuMapPin size={15} className="text-verde-agua" /> Alugue perto de você</span>
            </div>
          </div>
        </section>

        <section className="bg-white px-6 py-11 sm:px-8 lg:py-14">
          <div className="mx-auto max-w-6xl">
            <div className="mb-7 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-ciano">Explore por categoria</p><h2 className="text-3xl font-black tracking-tight text-verde-escuro">Encontre o item certo.</h2><p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-500">Do projeto de fim de semana à sua próxima comemoração.</p></div>
              <button onClick={() => navigate('/busca')} className="inline-flex items-center gap-2 text-sm font-bold text-azul-oceano transition-colors hover:text-verde-escuro focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-azul-oceano">Ver todos os itens <LuArrowRight size={17} /></button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {CATEGORIAS.slice(0, 6).map((categoria) => {
                const Icone = categoria.icone;
                return (
                  <button key={categoria.value} onClick={() => abrirCategoria(categoria)} className="group rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-ciano/40 hover:shadow-lg hover:shadow-azul-oceano/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azul-oceano">
                    <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-azul-oceano/10 text-azul-oceano transition-colors group-hover:bg-verde-agua group-hover:text-white"><Icone size={21} /></span>
                    <span className="block text-sm font-bold leading-tight text-grafite group-hover:text-verde-escuro">{categoria.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="overflow-hidden bg-verde-escuro px-6 py-12 sm:px-8 lg:py-16">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[.82fr_1.18fr] lg:items-center">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-verde-agua">Simples do começo ao fim</p>
              <h2 className="max-w-md text-3xl font-black tracking-tight text-white sm:text-4xl">Alugar deveria caber na sua rotina.</h2>
              <p className="mt-4 max-w-md leading-relaxed text-white/70">A LendLoop aproxima quem precisa de quem tem, com uma experiência direta, local e segura.</p>
              <button onClick={() => navigate('/busca')} className="mt-7 inline-flex items-center gap-2 rounded-xl border border-white/25 px-5 py-3 text-sm font-bold text-white transition-colors hover:border-verde-agua hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-verde-agua">Começar a explorar <LuArrowRight size={17} /></button>
            </div>
            <ol className="grid gap-3 sm:grid-cols-3">
              {etapas.map(({ icone: Icone, numero, titulo, descricao }) => (
                <li key={numero} className="relative rounded-2xl border border-white/10 bg-white/[0.07] p-5 sm:min-h-56">
                  <span className="text-xs font-bold tracking-[0.14em] text-verde-agua">{numero}</span>
                  <span className="mt-6 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">{createElement(Icone, { size: 20 })}</span>
                  <h3 className="mt-5 text-lg font-bold text-white">{titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{descricao}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="bg-gray-50 px-6 py-11 sm:px-8 lg:py-14">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 max-w-xl"><p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-ciano">Feito para a vida real</p><h2 className="text-3xl font-black tracking-tight text-verde-escuro">Mais acesso. Menos acúmulo.</h2></div>
            <div className="grid gap-4 md:grid-cols-3">
              {beneficios.map(({ icone, titulo, descricao }) => (
                <article key={titulo} className="rounded-2xl border border-gray-100 bg-white p-6">
                  <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-ciano/10 text-ciano">{createElement(icone, { size: 21 })}</span>
                  <h3 className="text-lg font-bold text-verde-escuro">{titulo}</h3><p className="mt-2 text-sm leading-relaxed text-gray-600">{descricao}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-6 py-11 sm:px-8 lg:py-14">
          <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-2">
            <article className="rounded-3xl bg-verde-escuro p-6 text-white sm:p-8">
              <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-verde-agua"><LuSearch size={23} /></span>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-verde-agua">Quero alugar</p><h2 className="mt-3 text-3xl font-black tracking-tight">Use o que precisa, pelo tempo que precisar.</h2>
              <ul className="mt-6 space-y-3 text-sm text-white/80"><li className="flex gap-2"><LuCheck size={18} className="shrink-0 text-verde-agua" /> Compare opções na sua região</li><li className="flex gap-2"><LuCheck size={18} className="shrink-0 text-verde-agua" /> Combine datas e retirada com facilidade</li></ul>
              <button onClick={() => navigate('/busca')} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-verde-agua px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-ciano">Explorar itens <LuArrowRight size={17} /></button>
            </article>

            <article className="rounded-3xl border border-ciano/20 bg-ciano/5 p-6 sm:p-8">
              <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-ciano/15 text-ciano"><LuPackage size={23} /></span>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-ciano">Tenho itens para anunciar</p><h2 className="mt-3 text-3xl font-black tracking-tight text-verde-escuro">Transforme itens parados em novas possibilidades.</h2>
              <ul className="mt-6 space-y-3 text-sm text-gray-600"><li className="flex gap-2"><LuCheck size={18} className="shrink-0 text-verde-agua" /> Publique fotos, preço e disponibilidade</li><li className="flex gap-2"><LuCheck size={18} className="shrink-0 text-verde-agua" /> Controle suas solicitações em um só painel</li></ul>
              <button onClick={() => navigate(isLogado ? '/criar-anuncio' : '/cadastro')} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-azul-oceano px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-verde-escuro">Criar anúncio <LuArrowRight size={17} /></button>
            </article>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
