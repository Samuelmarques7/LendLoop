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
  LuTrendingUp,
  LuWallet,
  LuX,
} from 'react-icons/lu';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import heroEscuro from '../assets/hero/lendloop-hero-dark-v11.png';
import heroEscuroWide from '../assets/hero/lendloop-hero-dark-v12-wide.png';
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

function DestacarTexto({ texto, busca }) {
  if (!busca) return texto;
  const regex = new RegExp(`(${escaparRegex(busca)})`, 'gi');

  return texto.split(regex).map((parte, indice) => (
    <span key={`${parte}-${indice}`} className={parte.toLowerCase() === busca.toLowerCase() ? 'font-semibold text-azul-oceano' : ''}>
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
  const mostrarDropdown = mostrarSugestoes;

  return (
    <div className="min-h-screen bg-white text-grafite">
      <Header variant="hero" />

      <main>
        <section className="relative z-10 isolate overflow-visible bg-[#031f3b] px-5 pb-16 pt-28 sm:px-8 sm:pb-20 sm:pt-32 lg:min-h-[590px] lg:px-10 lg:pb-24 lg:pt-32 2xl:min-h-[680px] 2xl:pb-28 2xl:pt-36">
          <picture className="absolute inset-0 -z-10 block h-full w-full">
            <source media="(min-width: 1536px)" srcSet={heroEscuroWide} />
            <img src={heroEscuro} alt="Itens disponíveis para alugar, como câmera, furadeira, carrinho de bebê, piscina inflável, caixa de som, controle de videogame e livros" className="h-full w-full object-cover object-left sm:object-center 2xl:object-bottom" />
          </picture>

          <div className="relative z-10 mx-auto w-full max-w-7xl 2xl:max-w-[1540px]">
            <div className="max-w-[39rem]">
              <p className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-white/75"><span className="h-2 w-2 rounded-full bg-verde-agua" /> Itens úteis, pessoas por perto.</p>
              <h1 className="max-w-[39rem] text-[3.2rem] font-semibold leading-[1.02] tracking-[-0.045em] text-white sm:text-[4rem] lg:text-[4.75rem]">O que você precisa, <span className="text-verde-agua">por perto.</span></h1>
              <p className="mt-6 max-w-2xl text-[1.05rem] leading-relaxed text-white/75 sm:text-[1.125rem]">Alugue itens para o momento certo — sem comprar, acumular ou ir longe.</p>
            </div>

            <div ref={buscaRef} className="relative mt-9 w-full max-w-[34rem]">
              <form onSubmit={(evento) => { evento.preventDefault(); executarBusca(); }} onClick={() => setMostrarSugestoes(true)} className="hero-search flex min-h-[72px] w-full items-center rounded-2xl bg-white p-2 shadow-[0_22px_55px_rgba(0,0,0,.28)]">
                <LuSearch size={22} className="mx-3 shrink-0 text-azul-oceano" />
                <input
                  type="text"
                  aria-label="Buscar itens para alugar"
                  aria-autocomplete="list"
                  aria-controls="sugestoes-de-busca"
                  aria-expanded={mostrarDropdown}
                  placeholder="Busque ferramentas, itens para festa e muito mais"
                  value={buscaHome}
                  onFocus={() => setMostrarSugestoes(true)}
                  onChange={(evento) => setBuscaHome(evento.target.value)}
                  className="hero-search-input min-w-0 flex-1 bg-transparent py-3 text-[15px] font-medium text-grafite outline-none placeholder:text-slate-400 sm:text-base"
                />
                <button type="submit" className="hidden rounded-xl bg-verde-agua px-7 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#20ac40] sm:block">Buscar</button>
                <button type="submit" aria-label="Buscar" className="rounded-xl bg-verde-agua p-3.5 text-white transition-colors hover:bg-[#20ac40] sm:hidden"><LuSearch size={20} /></button>
              </form>

              {mostrarDropdown && (
                <div id="sugestoes-de-busca" className="absolute left-0 top-[calc(100%+10px)] z-30 w-full overflow-hidden rounded-2xl border border-slate-100 bg-white py-2 shadow-2xl shadow-slate-950/20">
                  {buscaNormalizada && <button onClick={() => executarBusca()} className="flex w-full items-center gap-3 bg-azul-oceano/5 px-5 py-3 text-left text-sm font-bold text-azul-oceano transition-colors hover:bg-azul-oceano/10"><LuSearch size={16} /> Buscar por “{buscaHome}”</button>}

                  {recentesFiltradas.length > 0 && (
                    <div className="py-2">
                      <div className="flex items-center justify-between px-5 pb-1 pt-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Buscas recentes</span>
                        {!buscaNormalizada && <button onClick={limparBuscasRecentes} className="text-[10px] font-bold uppercase tracking-wider text-azul-oceano hover:text-verde-escuro">Limpar</button>}
                      </div>
                      {recentesFiltradas.slice(0, 4).map((termo) => (
                        <div key={termo} className="flex items-center px-2 hover:bg-slate-50">
                          <button onClick={() => executarBusca(termo)} className="flex flex-1 items-center gap-3 px-3 py-2.5 text-left text-sm text-gray-600"><LuClock size={16} className="text-gray-400" /> <DestacarTexto texto={termo} busca={buscaNormalizada} /></button>
                          <button onClick={(evento) => removerBuscaRecente(termo, evento)} aria-label={`Remover ${termo}`} className="rounded-lg p-2 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"><LuX size={15} /></button>
                        </div>
                      ))}
                    </div>
                  )}

                  {sugestoesFiltradas.length > 0 && (
                    <div className="border-t border-slate-100 py-2">
                      <span className="block px-5 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">{buscaNormalizada ? 'Sugestões' : 'Mais procurados'}</span>
                      {sugestoesFiltradas.map((termo) => (
                        <button key={termo} onClick={() => executarBusca(termo)} className="flex w-full items-center gap-3 px-5 py-2.5 text-left text-sm font-medium text-grafite transition-colors hover:bg-slate-50">
                          {buscaNormalizada ? <LuSearch size={16} className="text-gray-400" /> : <LuTrendingUp size={16} className="text-verde-agua" />}
                          <DestacarTexto texto={termo} busca={buscaNormalizada} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex max-w-[34rem] flex-wrap gap-x-5 gap-y-3 border-t border-white/15 pt-5 text-xs font-medium text-white/75 sm:text-sm">
              <span className="inline-flex items-center gap-2"><LuShieldCheck size={16} className="text-verde-agua" /> Perfis verificados</span>
              <span className="inline-flex items-center gap-2"><LuMapPin size={16} className="text-verde-agua" /> Retirada combinada</span>
              <span className="inline-flex items-center gap-2"><LuCheck size={16} className="text-verde-agua" /> Vistoria registrada</span>
            </div>
          </div>
        </section>

        <section className="bg-white px-6 py-11 sm:px-8 lg:py-14">
          <div className="mx-auto max-w-7xl 2xl:max-w-[1440px]">
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
          <div className="mx-auto grid max-w-7xl gap-10 2xl:max-w-[1440px] lg:grid-cols-[.82fr_1.18fr] lg:items-center">
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
          <div className="mx-auto max-w-7xl 2xl:max-w-[1440px]">
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
          <div className="mx-auto grid max-w-7xl gap-5 2xl:max-w-[1440px] lg:grid-cols-2">
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
