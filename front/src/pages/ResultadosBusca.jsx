import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiRequest } from '../services/api';
import {
  LuSearch,
  LuMapPin,
  LuUser,
  LuZap,
  LuHeart,
  LuStar,
  LuChevronLeft,
  LuChevronRight,
  LuPackageX,
  LuClock,
  LuTrendingUp,
  LuX,
  LuCalendarCheck,
  LuArrowRight,
  LuSlidersHorizontal
} from "react-icons/lu";
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { CATEGORIAS } from '../constants/categorias';
import { useBuscasRecentes } from '../hooks/useBuscasRecentes';
import { SUGESTOES_POPULARES, BANCO_DE_PALAVRAS } from '../constants/buscasPopulares';
import { correspondeBusca, normalizarBusca } from '../utils/busca';
import { SeletorDataBusca } from '../components/SeletorDataBusca';
import { somarDias } from '../utils/datasReserva';

const ITENS_POR_PAGINA = 8;

function destacarTexto(texto, busca) {
  if (!busca) return texto;
  const termoSeguro = busca.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${termoSeguro})`, 'gi');
  const partes = texto.split(regex);
  return (
    <span>
      {partes.map((parte, i) => 
        parte.toLowerCase() === busca.toLowerCase() 
          ? <span key={i} className="text-gray-400 font-normal">{parte}</span> 
          : <span key={i} className="text-grafite font-bold">{parte}</span>
      )}
    </span>
  );
}

export function ResultadosBusca() {
  const navigate = useNavigate(); 
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState(searchParams.get('busca') || '');
  const [dataInicio, setDataInicio] = useState(searchParams.get('dataInicio') || '');
  const [dataFim, setDataFim] = useState(searchParams.get('dataFim') || '');
  const [precoMin, setPrecoMin] = useState(searchParams.get('precoMin') || '');
  const [precoMax, setPrecoMax] = useState(searchParams.get('precoMax') || '');
  const [cidade, setCidade] = useState(searchParams.get('cidade') || '');
  const [ordenacao, setOrdenacao] = useState(searchParams.get('ordenacao') || 'relevancia');
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState(
    () => (searchParams.get('categoria') || '').split(',').filter(Boolean)
  );

  const { buscasRecentes, salvarBuscaRecente, removerBuscaRecente, limparBuscasRecentes } = useBuscasRecentes();
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erroFiltros, setErroFiltros] = useState('');
  const [pagina, setPagina] = useState(Number(searchParams.get('pagina')) || 1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalItens, setTotalItens] = useState(0);
  const [favoritos, setFavoritos] = useState(() => new Set());
  const [favoritosCarregando, setFavoritosCarregando] = useState(() => new Set());
  const [mostrarFiltrosMobile, setMostrarFiltrosMobile] = useState(false);
  const buscaRef = useRef(null);
  const resultadosRef = useRef(null);

  function abrirDetalhes(evento, produtoId) {
    evento.stopPropagation();
    navigate(`/produto/${produtoId}`);
  }

  function iniciarReserva(evento, produtoId) {
    evento.stopPropagation();
    navigate(`/produto/${produtoId}?reservar=1`);
  }

  useEffect(() => {
    function handleClickFora(e) {
      if (buscaRef.current && !buscaRef.current.contains(e.target)) {
        setMostrarSugestoes(false);
      }
    }
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    apiRequest('/api/favoritos')
      .then((dados) => setFavoritos(new Set(dados.anuncios || [])))
      .catch(() => {});
  }, []);

  async function buscarAnuncios(termoBusca, sobrescrever = {}) {
    const params = new URLSearchParams();
    const buscaAtual = termoBusca ?? sobrescrever.busca ?? busca;
    const inicioAtual = sobrescrever.dataInicio ?? dataInicio;
    const fimAtual = sobrescrever.dataFim ?? dataFim;
    const minimoAtual = sobrescrever.precoMin ?? precoMin;
    const maximoAtual = sobrescrever.precoMax ?? precoMax;
    const cidadeAtual = sobrescrever.cidade ?? cidade;
    const ordenacaoAtual = sobrescrever.ordenacao ?? ordenacao;
    const categoriasAtuais = sobrescrever.categoriasSelecionadas ?? categoriasSelecionadas;
    const paginaAtual = sobrescrever.pagina ?? 1;

    if (inicioAtual && fimAtual && fimAtual <= inicioAtual) {
      setErroFiltros('A data final deve ser posterior à data inicial.');
      return;
    }
    if (minimoAtual !== '' && maximoAtual !== '' && Number(minimoAtual) > Number(maximoAtual)) {
      setErroFiltros('O preço mínimo não pode ser maior que o preço máximo.');
      return;
    }

    if (buscaAtual.trim()) params.append('busca', buscaAtual.trim());
    if (inicioAtual) params.append('dataInicio', inicioAtual);
    if (fimAtual) params.append('dataFim', fimAtual);
    if (minimoAtual !== '') params.append('precoMin', minimoAtual);
    if (maximoAtual !== '') params.append('precoMax', maximoAtual);
    if (cidadeAtual.trim()) params.append('cidade', cidadeAtual.trim());
    if (categoriasAtuais.length > 0) params.append('categoria', categoriasAtuais.join(','));
    if (ordenacaoAtual !== 'relevancia') params.append('ordenacao', ordenacaoAtual);
    params.append('pagina', String(paginaAtual));
    params.append('limite', String(ITENS_POR_PAGINA));

    const query = params.toString();
    setErroFiltros('');
    setCarregando(true);
    try {
      const dados = await apiRequest(`/api/anuncios${query ? `?${query}` : ''}`);
      const itens = Array.isArray(dados) ? dados : dados.itens;
      setProdutos(itens || []);
      setPagina(Array.isArray(dados) ? 1 : dados.pagina);
      setTotalPaginas(Array.isArray(dados) ? 1 : dados.totalPaginas);
      setTotalItens(Array.isArray(dados) ? dados.length : dados.totalItens);
      setSearchParams(params, { replace: true });
    } catch (error) {
      setErroFiltros(error.message || 'Não foi possível aplicar os filtros.');
    } finally {
      setCarregando(false);
    }
  }

  async function mudarPagina(novaPagina) {
    if (carregando || novaPagina < 1 || novaPagina > totalPaginas || novaPagina === pagina) return;
    await buscarAnuncios(undefined, { pagina: novaPagina });
    resultadosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function alternarFavorito(evento, produtoId) {
    evento.stopPropagation();
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    if (favoritosCarregando.has(produtoId)) return;

    const estavaFavorito = favoritos.has(produtoId);
    setFavoritos((atuais) => {
      const proximos = new Set(atuais);
      estavaFavorito ? proximos.delete(produtoId) : proximos.add(produtoId);
      return proximos;
    });
    setFavoritosCarregando((atuais) => new Set(atuais).add(produtoId));

    try {
      await apiRequest(`/api/favoritos/${produtoId}`, { method: estavaFavorito ? 'DELETE' : 'POST' });
    } catch (error) {
      setFavoritos((atuais) => {
        const proximos = new Set(atuais);
        estavaFavorito ? proximos.add(produtoId) : proximos.delete(produtoId);
        return proximos;
      });
      setErroFiltros(error.message || 'Não foi possível atualizar o favorito.');
    } finally {
      setFavoritosCarregando((atuais) => {
        const proximos = new Set(atuais);
        proximos.delete(produtoId);
        return proximos;
      });
    }
  }

  function handleSubmitBusca(e){
    e.preventDefault();
    setMostrarSugestoes(false);
    if (busca.trim()) salvarBuscaRecente(busca);
    buscarAnuncios();
  }

  function handleClicarSugestao(termo) {
    setBusca(termo);
    setMostrarSugestoes(false);
    salvarBuscaRecente(termo);
    buscarAnuncios(termo);
  }

  function toggleCategoria(valor) {
    setCategoriasSelecionadas(atual =>
      atual.includes(valor) ? atual.filter(c => c !== valor) : [...atual, valor]
    );
  }

  function removerCategoria(valor) {
    const proximasCategorias = categoriasSelecionadas.filter((categoria) => categoria !== valor);
    setCategoriasSelecionadas(proximasCategorias);
    buscarAnuncios(undefined, { categoriasSelecionadas: proximasCategorias });
  }

  function removerLocalizacao() {
    setCidade('');
    buscarAnuncios(undefined, { cidade: '' });
  }

  function removerPreco() {
    setPrecoMin('');
    setPrecoMax('');
    buscarAnuncios(undefined, { precoMin: '', precoMax: '' });
  }

  function alterarOrdenacao(evento) {
    const valor = evento.target.value;
    setOrdenacao(valor);
    buscarAnuncios(undefined, { ordenacao: valor });
  }

  function limparFiltros() {
    setBusca('');
    setDataInicio('');
    setDataFim('');
    setPrecoMin('');
    setPrecoMax('');
    setCidade('');
    setOrdenacao('relevancia');
    setCategoriasSelecionadas([]);
    setMostrarSugestoes(false);
    buscarAnuncios('', {
      dataInicio: '',
      dataFim: '',
      precoMin: '',
      precoMax: '',
      cidade: '',
      ordenacao: 'relevancia',
      categoriasSelecionadas: [],
    });
  }

  function obterSubtitulo() {
    if (categoriasSelecionadas.length === 1) {
      const cat = CATEGORIAS.find(c => c.value === categoriasSelecionadas[0]);
      if (cat) return `${cat.label} disponíveis${cidade ? ` em ${cidade}` : ' perto de você'}`;
    }
    if (categoriasSelecionadas.length > 1) {
      return `${categoriasSelecionadas.length} categorias selecionadas${cidade ? ` em ${cidade}` : ''}`;
    }
    if (busca) {
      return `Resultados para "${busca}"${cidade ? ` em ${cidade}` : ''}`;
    }
    return cidade ? `Itens disponíveis em ${cidade}` : 'Itens disponíveis perto de você';
  }

  const filtrosAtivos = categoriasSelecionadas.length
    + (precoMin !== '' || precoMax !== '' ? 1 : 0)
    + (cidade.trim() ? 1 : 0);

  const paginasVisiveis = Array.from({ length: totalPaginas }, (_, indice) => indice + 1)
    .filter((numero) => totalPaginas <= 5 || numero === 1 || numero === totalPaginas || Math.abs(numero - pagina) <= 1);

  useEffect(() => {
    buscarAnuncios(undefined, { pagina: Number(searchParams.get('pagina')) || 1 });
  }, []);

  // Lógica inteligente de previsão (Autocomplete)
  const buscaLower = normalizarBusca(busca);
  
  const recentesFiltradas = buscaLower 
    ? buscasRecentes.filter(t => correspondeBusca(t, buscaLower))
    : buscasRecentes;
    
  const sugestoesFiltradas = buscaLower
    ? BANCO_DE_PALAVRAS.filter(t => correspondeBusca(t, buscaLower))
        .sort((a, b) => {
          const aStarts = normalizarBusca(a).startsWith(buscaLower);
          const bStarts = normalizarBusca(b).startsWith(buscaLower);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          return 0;
        }).slice(0, 6)
    : SUGESTOES_POPULARES;

  const mostrarDropdown = mostrarSugestoes && (buscaLower !== '' || recentesFiltradas.length > 0 || sugestoesFiltradas.length > 0);

  return (
    <div className="page-shell flex min-h-screen min-w-0 flex-col overflow-x-hidden font-sans text-grafite">
      <Header />

      <main className="mx-auto min-w-0 w-full max-w-[1680px] flex-grow px-3 pb-10 pt-4 sm:px-6 sm:pt-6 2xl:px-10">
        
        <section className="mb-5 min-w-0 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_8px_30px_rgba(7,43,74,0.06)] sm:p-4 lg:mb-6">
          <form onSubmit={handleSubmitBusca} className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-12">
            <div ref={buscaRef} className="relative min-w-0 md:col-span-2 lg:col-span-5">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">O que você busca?</label>
              <div className="relative">
                <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text" 
                  placeholder="Ex: Furadeira, Barraca, categoria ou subcategoria..." 
                  value={busca}
                  onFocus={() => setMostrarSugestoes(true)}
                  onChange={(e) => setBusca(e.target.value)}
                  className="min-w-0 w-full rounded-xl border border-slate-200 p-3 pl-10 text-sm font-medium outline-none transition-all focus:border-azul-oceano focus:ring-2 focus:ring-azul-oceano/10" />
              </div>

              {mostrarDropdown && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20">

                  {buscaLower && (
                    <div className="py-2 border-b border-gray-50 bg-azul-oceano/5">
                      <button
                        type="button"
                        onClick={() => {
                          setMostrarSugestoes(false);
                          if (busca.trim()) salvarBuscaRecente(busca);
                          buscarAnuncios(busca);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-azul-oceano/10 text-azul-oceano transition-colors cursor-pointer text-sm font-bold"
                      >
                        <LuSearch size={16} className="shrink-0" />
                        Buscar por "{busca}"
                      </button>
                    </div>
                  )}

                  {recentesFiltradas.length > 0 && (
                    <div className="py-2">
                      <div className="flex items-center justify-between px-4 py-1.5">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Buscas recentes</span>
                        {!buscaLower && (
                          <button
                            type="button"
                            onClick={limparBuscasRecentes}
                            className="text-[11px] text-azul-oceano hover:text-verde-escuro font-bold cursor-pointer uppercase tracking-wider"
                          >
                            Limpar
                          </button>
                        )}
                      </div>
                      {recentesFiltradas.map((termo) => (
                        <button
                          type="button"
                          key={termo}
                          onClick={() => handleClicarSugestao(termo)}
                          className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer group"
                        >
                          <span className="flex items-center gap-3 text-gray-600 text-sm font-medium">
                            <LuClock size={16} className="text-gray-400 shrink-0" />
                            {destacarTexto(termo, buscaLower)}
                          </span>
                          <span
                            onClick={(e) => removerBuscaRecente(termo, e)}
                            className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                            title="Remover"
                          >
                            <LuX size={14} />
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {recentesFiltradas.length > 0 && sugestoesFiltradas.length > 0 && (
                    <div className="border-t border-gray-100" />
                  )}

                  {sugestoesFiltradas.length > 0 && (
                    <div className="py-2">
                      <div className="px-4 py-1.5">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                          {buscaLower ? 'Sugestões para você' : 'Buscas populares'}
                        </span>
                      </div>
                      {sugestoesFiltradas.map((termo) => (
                        <button
                          type="button"
                          key={termo}
                          onClick={() => handleClicarSugestao(termo)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer text-sm"
                        >
                          {buscaLower ? (
                            <LuSearch size={16} className="text-gray-400 shrink-0" />
                          ) : (
                            <LuTrendingUp size={16} className="text-verde-agua shrink-0" />
                          )}
                          <span className="flex-1 text-left">
                            {destacarTexto(termo, buscaLower)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="min-w-0 lg:col-span-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Início</label>
              <SeletorDataBusca
                valor={dataInicio}
                placeholder="Escolher data"
                onChange={(valor) => {
                  setDataInicio(valor);
                  if (valor && dataFim && dataFim <= valor) setDataFim('');
                }}
              />
            </div>

            <div className="min-w-0 lg:col-span-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Fim</label>
              <SeletorDataBusca
                valor={dataFim}
                placeholder="Escolher data"
                dataMinima={dataInicio ? somarDias(dataInicio, 1) : undefined}
                alinhar="right"
                onChange={setDataFim}
              />
            </div>

            <div className="flex items-end md:col-span-2 lg:col-span-3">
              <button 
                type="submit"
                className="w-full cursor-pointer rounded-xl bg-azul-oceano py-3.5 font-bold text-white shadow-sm transition-all hover:bg-[#0b4d7a] active:scale-[0.98]">
                Atualizar Busca
              </button>
            </div>
          </form>
        </section>

        <div className="mb-4 flex items-center justify-between lg:hidden">
          <button
            type="button"
            onClick={() => setMostrarFiltrosMobile((atual) => !atual)}
            aria-expanded={mostrarFiltrosMobile}
            className="flex min-h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-grafite shadow-sm"
          >
            <LuSlidersHorizontal size={17} className="text-azul-oceano" />
            {mostrarFiltrosMobile ? 'Ocultar filtros' : 'Filtrar resultados'}
            {filtrosAtivos > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-azul-oceano px-1.5 text-[10px] text-white">
                {filtrosAtivos}
              </span>
            )}
          </button>
          <span className="text-xs font-bold text-gray-400">Página {pagina} de {totalPaginas}</span>
        </div>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-6 xl:gap-7">
          
          <aside className={`${mostrarFiltrosMobile ? 'block' : 'hidden'} w-full shrink-0 lg:block lg:w-64 xl:w-72`}>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(7,43,74,0.05)] lg:sticky lg:top-24">
                <div className="flex justify-between items-center mb-6">
                <h3 className="flex items-center gap-2 font-bold text-lg text-grafite"><LuSlidersHorizontal className="text-azul-oceano" /> Filtros</h3>
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="cursor-pointer text-xs font-semibold text-azul-oceano transition-colors hover:text-[#0b4d7a]"
                >
                    Limpar tudo
                </button>
                </div>

                {erroFiltros && (
                  <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                    {erroFiltros}
                  </p>
                )}

                <div className="space-y-6">
                <div className="border-b border-gray-50 pb-4">
                    <label htmlFor="filtro-cidade" className="mb-3 block text-sm font-bold text-grafite">Localização</label>
                    <div className="relative">
                      <LuMapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-azul-oceano" size={15} />
                      <input
                        id="filtro-cidade"
                        type="text"
                        placeholder="Digite a cidade"
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                        className="w-full rounded-lg border border-gray-100 bg-gray-50 p-2.5 pl-9 text-xs outline-none focus:border-verde-agua focus:bg-white" />
                    </div>
                </div>
                <div className="border-b border-gray-50 pb-4">
                    <h4 className="text-sm font-bold text-grafite mb-3">Faixa de Preço</h4>
                    <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="Mín"
                      value={precoMin}
                      onChange={(e) => setPrecoMin(e.target.value)}
                      className="w-full border border-gray-100 bg-gray-50 rounded-lg p-2 text-xs outline-none focus:bg-white focus:border-verde-agua" />
                    <input
                      type="number"
                      min="0"
                      placeholder="Máx"
                      value={precoMax}
                      onChange={(e) => setPrecoMax(e.target.value)}
                      className="w-full border border-gray-100 bg-gray-50 rounded-lg p-2 text-xs outline-none focus:bg-white focus:border-verde-agua" />
                    </div>
                    <p className="text-[10px] text-gray-300 mt-2 uppercase tracking-widest">Por dia</p>
                </div>

                <div>
                    <h4 className="text-sm font-bold text-grafite mb-3">Categoria</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 lg:grid-cols-1">
                    {CATEGORIAS.map((cat) => (
                        <label key={cat.value} className="flex items-center gap-3 text-sm text-gray-500 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={categoriasSelecionadas.includes(cat.value)}
                          onChange={() => toggleCategoria(cat.value)}
                        className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-azul-oceano" />
                        <span className="group-hover:text-grafite transition-colors">{cat.label}</span>
                        </label>
                    ))}
                    </div>
                </div>
                </div>

                <button
                  type="button"
                  onClick={() => buscarAnuncios()}
                  disabled={carregando}
                  className="mt-6 w-full cursor-pointer rounded-xl bg-azul-oceano py-3 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-[#0b4d7a] disabled:cursor-wait disabled:opacity-60"
                >
                  {carregando ? 'Aplicando...' : 'Aplicar Filtros'}
                </button>
            </div>
            </aside>

          <section ref={resultadosRef} aria-busy={carregando} className={`min-w-0 flex-grow space-y-4 scroll-mt-24 transition-opacity ${carregando && produtos.length > 0 ? 'opacity-60' : ''}`}>
            <div className="flex flex-col gap-4 px-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-grafite sm:text-4xl">Resultados da busca</h1>
                <p className="mt-1 text-sm text-slate-500">{obterSubtitulo()}</p>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="whitespace-nowrap">Ordenar por</span>
                <select
                  value={ordenacao}
                  onChange={alterarOrdenacao}
                  disabled={carregando}
                  className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm font-bold text-grafite outline-none transition-colors focus:border-azul-oceano disabled:opacity-60"
                >
                  <option value="relevancia">Mais relevantes</option>
                  <option value="menor-preco">Menor preço</option>
                  <option value="maior-preco">Maior preço</option>
                  <option value="melhor-avaliacao">Melhor avaliação</option>
                </select>
              </label>
            </div>

            <div className="flex min-h-10 flex-wrap items-center gap-2 px-1">
              <strong className="mr-1 text-sm text-grafite">
                {totalItens} {totalItens === 1 ? 'item encontrado' : 'itens encontrados'}
              </strong>
              {cidade.trim() && (
                <button type="button" onClick={removerLocalizacao} className="flex items-center gap-1.5 rounded-lg bg-azul-oceano/10 px-3 py-2 text-xs font-bold text-azul-oceano transition-colors hover:bg-azul-oceano/15">
                  {cidade.trim()} <LuX size={13} />
                </button>
              )}
              {(precoMin !== '' || precoMax !== '') && (
                <button type="button" onClick={removerPreco} className="flex items-center gap-1.5 rounded-lg bg-azul-oceano/10 px-3 py-2 text-xs font-bold text-azul-oceano transition-colors hover:bg-azul-oceano/15">
                  R$ {precoMin || '0'} – R$ {precoMax || '∞'} <LuX size={13} />
                </button>
              )}
              {categoriasSelecionadas.map((valor) => {
                const categoria = CATEGORIAS.find((item) => item.value === valor);
                return (
                  <button key={valor} type="button" onClick={() => removerCategoria(valor)} className="flex items-center gap-1.5 rounded-lg bg-azul-oceano/10 px-3 py-2 text-xs font-bold text-azul-oceano transition-colors hover:bg-azul-oceano/15">
                    {categoria?.label || valor} <LuX size={13} />
                  </button>
                );
              })}
            </div>

            {erroFiltros && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 lg:hidden">
                {erroFiltros}
              </p>
            )}
            
            {carregando && produtos.length === 0 ? (
              <div className="space-y-4" aria-label="Carregando resultados">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-[330px] animate-pulse rounded-3xl border border-gray-100 bg-white sm:h-[360px] lg:h-52" />
                ))}
              </div>
            ) : produtos.length === 0 ? (
              <div className="flex min-h-[320px] h-full flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white p-8 text-center sm:min-h-[400px] sm:p-16">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
                  <LuSearch size={40} className="text-gray-300" />
                </div>
                <h2 className="text-2xl font-bold text-grafite mb-2">Nenhum item encontrado</h2>
                <p className="text-gray-400 max-w-md">
                  Ainda não temos itens disponíveis com esses filtros. Tente buscar em outra cidade, categoria ou limpar os filtros atuais.
                </p>
                <button
                  onClick={limparFiltros}
                  className="mt-6 border-2 border-verde-agua text-verde-agua px-6 py-2.5 rounded-xl font-bold hover:bg-verde-agua/10 transition-colors cursor-pointer">
                  Limpar Filtros
                </button>
              </div>
            ) : (
              <>
                {produtos.map((produto) => (
                  <div
                    key={produto._id}
                    onClick={() => navigate(`/produto/${produto._id}`)}
                    className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_5px_20px_rgba(7,43,74,0.04)] transition-all hover:-translate-y-0.5 hover:border-azul-oceano/20 hover:shadow-[0_14px_34px_rgba(7,43,74,0.10)] lg:flex-row"
                  >
                    <div className="relative h-52 w-full shrink-0 overflow-hidden bg-gray-50 sm:h-60 lg:h-auto lg:min-h-52 lg:w-64 xl:w-72">
                      {produto.fotos && produto.fotos.length > 0 ? (  
                        <img src={produto.fotos[0]} alt={produto.titulo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <LuPackageX size={40} className="text-gray-300" />
                        </div>
                      )}
                        <button
                          type="button"
                          onClick={(e) => alternarFavorito(e, produto._id)}
                          disabled={favoritosCarregando.has(produto._id)}
                          aria-pressed={favoritos.has(produto._id)}
                          aria-label={favoritos.has(produto._id) ? `Remover ${produto.titulo} dos favoritos` : `Adicionar ${produto.titulo} aos favoritos`}
                          className={`absolute right-4 top-4 rounded-full bg-white/95 p-2.5 shadow-sm backdrop-blur-sm transition-all active:scale-90 disabled:cursor-wait disabled:opacity-60 ${favoritos.has(produto._id) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}>
                          <LuHeart size={19} fill={favoritos.has(produto._id) ? 'currentColor' : 'none'} />
                        </button>
                    </div>
                    
                    <div className="flex min-w-0 flex-grow flex-col justify-between p-4 sm:p-5 xl:p-6">
                      <div>
                        <div className="flex justify-between items-start gap-4">
                          <h2 className="text-lg font-bold leading-tight text-grafite transition-colors group-hover:text-verde-agua sm:text-xl">
                            {produto.titulo}
                          </h2>
                          {produto.avaliacao && (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600 bg-gray-50 border border-gray-100 px-2.5 py-1.5 rounded-lg shrink-0">
                              <LuStar className="text-yellow-400" fill="currentColor" />
                              {produto.avaliacao}
                              <span className="font-medium text-gray-400">({produto.totalAvaliacoes})</span>
                            </div>
                          )}
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">
                          {produto.descricao}
                        </p>
                      </div>
                      
                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <LuMapPin size={15} className="text-azul-oceano"/>
                          {produto.endereco?.bairro && produto.endereco?.cidade
                            ? `${produto.endereco.bairro}, ${produto.endereco.cidade}`
                            : produto.endereco?.cidade || 'Localização não informada'}
                        </span>
                        <span className="flex items-center gap-1.5"><LuUser size={15} className="text-azul-oceano"/> {produto.locador?.nome || 'Anunciante removido'}</span>
                      </div>
                    </div>
                    
                    <div className="flex min-w-0 flex-col justify-center border-t border-slate-100 bg-slate-50/55 p-4 sm:p-5 lg:min-w-[210px] lg:border-l lg:border-t-0 xl:min-w-[230px]">
                      <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700">
                        <LuZap size={13} fill="currentColor" /> Disponível
                      </span>
                      <div className="flex items-end gap-1 text-3xl font-black leading-none text-grafite">
                        <span>R$ {produto.precos.precoPorDia}</span>
                        <span className="pb-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">/dia</span>
                      </div>
                      <div className="mt-4 w-full space-y-2.5">
                        <button
                          type="button"
                          onClick={(evento) => iniciarReserva(evento, produto._id)}
                          className="group/reservar flex min-h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-verde-agua px-3 py-3 text-sm font-bold text-white shadow-sm shadow-verde-agua/20 transition-all hover:-translate-y-0.5 hover:bg-verde-escuro hover:shadow-md active:translate-y-0 active:scale-[0.98]"
                        >
                          <LuCalendarCheck size={17} className="shrink-0 transition-transform group-hover/reservar:scale-110" />
                          Reservar agora
                        </button>
                        <button
                          type="button"
                          onClick={(evento) => abrirDetalhes(evento, produto._id)}
                          className="group/detalhes flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-azul-oceano/45 bg-white px-3 py-2.5 text-xs font-bold text-azul-oceano transition-all hover:border-azul-oceano hover:bg-azul-oceano/5"
                        >
                          Ver detalhes
                          <LuArrowRight size={14} className="shrink-0 transition-transform group-hover/detalhes:translate-x-0.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {totalPaginas > 1 && <nav aria-label="Paginação dos resultados" className="mt-6 flex items-center justify-center gap-2 py-4">
                  <button
                    type="button"
                    onClick={() => mudarPagina(pagina - 1)}
                    disabled={pagina === 1 || carregando}
                    aria-label="Página anterior"
                    className="rounded-xl border border-gray-200 p-2 text-gray-500 transition-all hover:border-verde-agua hover:bg-white hover:text-verde-agua disabled:cursor-not-allowed disabled:opacity-35">
                    <LuChevronLeft size={18} />
                  </button>
                  {paginasVisiveis.map((numero, indice) => {
                    const anterior = paginasVisiveis[indice - 1];
                    return (
                      <span key={numero} className="flex items-center gap-2">
                        {anterior && numero - anterior > 1 && <span className="px-1 text-gray-400">…</span>}
                        <button
                          type="button"
                          onClick={() => mudarPagina(numero)}
                          disabled={carregando}
                          aria-current={numero === pagina ? 'page' : undefined}
                          aria-label={`Ir para a página ${numero}`}
                          className={`h-10 w-10 rounded-xl font-bold transition-all active:scale-95 ${numero === pagina ? 'bg-grafite text-white shadow-lg' : 'border border-gray-200 bg-white text-gray-500 hover:border-verde-agua hover:text-verde-escuro'}`}
                        >
                          {numero}
                        </button>
                      </span>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => mudarPagina(pagina + 1)}
                    disabled={pagina === totalPaginas || carregando}
                    aria-label="Próxima página"
                    className="rounded-xl border border-gray-200 p-2 text-gray-500 transition-all hover:border-verde-agua hover:bg-white hover:text-verde-agua disabled:cursor-not-allowed disabled:opacity-35">
                    <LuChevronRight size={18} />
                  </button>
                </nav>}
              </>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
