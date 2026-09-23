import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiRequest } from '../services/api';
import {
  LuSearch,
  LuCalendar,
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
  LuX
} from "react-icons/lu";
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { CATEGORIAS } from '../constants/categorias';
import { useBuscasRecentes } from '../hooks/useBuscasRecentes';
import { SUGESTOES_POPULARES, BANCO_DE_PALAVRAS } from '../constants/buscasPopulares';

function destacarTexto(texto, busca) {
  if (!busca) return texto;
  const regex = new RegExp(`(${busca})`, 'gi');
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
  const [searchParams] = useSearchParams();
  
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState(searchParams.get('busca') || '');
  const [dataInicio, setDataInicio] = useState(searchParams.get('dataInicio') || '');
  const [dataFim, setDataFim] = useState(searchParams.get('dataFim') || '');
  const [precoMin, setPrecoMin] = useState('');
  const [precoMax, setPrecoMax] = useState('');
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState(
    () => (searchParams.get('categoria') || '').split(',').filter(Boolean)
  );

  const { buscasRecentes, salvarBuscaRecente, removerBuscaRecente, limparBuscasRecentes } = useBuscasRecentes();
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const buscaRef = useRef(null);

  useEffect(() => {
    function handleClickFora(e) {
      if (buscaRef.current && !buscaRef.current.contains(e.target)) {
        setMostrarSugestoes(false);
      }
    }
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  async function buscarAnuncios(termoBusca) {
    const params = new URLSearchParams();
    const buscaAtual = termoBusca ?? busca;

    if (buscaAtual) params.append('busca', buscaAtual);
    if (dataInicio) params.append('dataInicio', dataInicio);
    if (dataFim) params.append('dataFim', dataFim);
    if (precoMin) params.append('precoMin', precoMin);
    if (precoMax) params.append('precoMax', precoMax);
    if (categoriasSelecionadas.length > 0) params.append('categoria', categoriasSelecionadas.join(','));

    const query = params.toString();
    const dados = await apiRequest(`/api/anuncios${query ? `?${query}` : ''}`);
    setProdutos(dados);
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

  function limparFiltros() {
    setBusca('');
    setDataInicio('');
    setDataFim('');
    setPrecoMin('');
    setPrecoMax('');
    setCategoriasSelecionadas([]);
  }

  function obterSubtitulo() {
    if (categoriasSelecionadas.length === 1) {
      const cat = CATEGORIAS.find(c => c.value === categoriasSelecionadas[0]);
      if (cat) return `${cat.label} disponíveis em Santa Rita do Sapucaí, MG`;
    }
    if (categoriasSelecionadas.length > 1) {
      return `${categoriasSelecionadas.length} categorias selecionadas em Santa Rita do Sapucaí, MG`;
    }
    if (busca) {
      return `Resultados para "${busca}" em Santa Rita do Sapucaí, MG`;
    }
    return 'Itens disponíveis em Santa Rita do Sapucaí, MG';
  }

  useEffect(() => {
    buscarAnuncios();
  }, []);

  // Lógica inteligente de previsão (Autocomplete)
  const buscaLower = busca.toLowerCase().trim();
  
  const recentesFiltradas = buscaLower 
    ? buscasRecentes.filter(t => t.toLowerCase().includes(buscaLower))
    : buscasRecentes;
    
  const sugestoesFiltradas = buscaLower
    ? BANCO_DE_PALAVRAS.filter(t => t.toLowerCase().includes(buscaLower))
        .sort((a, b) => {
          const aStarts = a.toLowerCase().startsWith(buscaLower);
          const bStarts = b.toLowerCase().startsWith(buscaLower);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          return 0;
        }).slice(0, 6)
    : SUGESTOES_POPULARES;

  const mostrarDropdown = mostrarSugestoes && (buscaLower !== '' || recentesFiltradas.length > 0 || sugestoesFiltradas.length > 0);

  return (
    <div className="page-shell min-h-screen font-sans text-grafite flex flex-col">
      <Header />

      <main className="max-w-7xl mx-auto w-full flex-grow p-4 pt-6 sm:p-6 sm:pt-10">
        
        <section className="mb-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-grafite">Resultados da Busca</h1>
              <p className="text-gray-400 text-sm mt-1">{obterSubtitulo()}</p>
            </div>
            <span className="text-azul-oceano text-[10px] font-bold bg-azul-oceano/10 px-3 py-1.5 rounded-full uppercase tracking-wider">
              {produtos.length} itens encontrados
            </span>
          </div>

          <form onSubmit={handleSubmitBusca} className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div ref={buscaRef} className="md:col-span-5 relative">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">O que você busca?</label>
              <div className="relative">
                <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Ex: Furadeira, Barraca, categoria ou subcategoria..." 
                  value={busca}
                  onFocus={() => setMostrarSugestoes(true)}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 pl-10 text-sm focus:ring-2 focus:ring-verde-agua/20 focus:border-verde-agua outline-none transition-all font-medium" />
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

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Início</label>
              <div className="relative">
                <LuCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input 
                  type="date" 
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 pl-10 text-sm outline-none focus:border-verde-agua cursor-pointer" />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Fim</label>
              <div className="relative">
                <LuCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input 
                  type="date" 
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 pl-10 text-sm outline-none focus:border-verde-agua cursor-pointer" />
              </div>
            </div>

            <div className="md:col-span-3 flex items-end">
              <button 
                type="submit"
                className="w-full bg-verde-agua text-white font-bold py-3.5 rounded-xl hover:bg-verde-escuro transition-all shadow-sm active:scale-[0.98] cursor-pointer">
                Atualizar Busca
              </button>
            </div>
          </form>
        </section>

        <div className="flex gap-8 flex-col lg:flex-row">
          
          <aside className="w-full lg:w-64 shrink-0">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-grafite">Filtros</h3>
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="text-xs text-gray-400 hover:text-verde-agua transition-colors cursor-pointer"
                >
                    Limpar tudo
                </button>
                </div>

                <div className="space-y-6">
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
                    <div className="space-y-2">
                    {CATEGORIAS.map((cat) => (
                        <label key={cat.value} className="flex items-center gap-3 text-sm text-gray-500 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={categoriasSelecionadas.includes(cat.value)}
                          onChange={() => toggleCategoria(cat.value)}
                          className="w-4 h-4 rounded border-gray-300 accent-verde-agua cursor-pointer" />
                        <span className="group-hover:text-grafite transition-colors">{cat.label}</span>
                        </label>
                    ))}
                    </div>
                </div>
                </div>

                <button
                  type="button"
                  onClick={buscarAnuncios}
                  className="w-full mt-6 bg-grafite text-white text-xs font-bold py-3 rounded-xl hover:bg-black transition-all uppercase tracking-widest cursor-pointer"
                >
                  Aplicar Filtros
                </button>
            </div>
            </aside>

          <section className="flex-grow space-y-4">
            
            {produtos.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-16 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
                  <LuSearch size={40} className="text-gray-300" />
                </div>
                <h2 className="text-2xl font-bold text-grafite mb-2">Nenhum item encontrado</h2>
                <p className="text-gray-400 max-w-md">
                  Ainda não temos itens disponíveis com esses filtros em Santa Rita do Sapucaí. Tente buscar por outra categoria ou limpar os filtros atuais.
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
                    className="bg-white flex flex-col md:flex-row border border-gray-100 rounded-3xl overflow-hidden hover:shadow-lg transition-all group cursor-pointer"
                  >
                    <div className="w-full md:w-72 h-48 bg-gray-50 relative overflow-hidden">
                      {produto.fotos && produto.fotos.length > 0 ? (  
                        <img src={produto.fotos[0]} alt={produto.titulo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <LuPackageX size={40} className="text-gray-300" />
                        </div>
                      )}
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 shadow-sm transition-colors cursor-pointer active:scale-90">
                          <LuHeart size={18} />
                        </button>
                    </div>
                    
                    <div className="p-6 flex-grow flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-4">
                          <h2 className="text-xl font-bold text-grafite group-hover:text-verde-agua transition-colors leading-tight">
                            {produto.titulo}
                          </h2>
                          {produto.avaliacao && (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600 bg-gray-50 border border-gray-100 px-2.5 py-1.5 rounded-lg shrink-0">
                              <LuStar className="text-yellow-400" fill="currentColor" /> {produto.avaliacao}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mt-2 line-clamp-2 leading-relaxed italic">
                          {produto.descricao}
                        </p>
                      </div>
                      
                      <div className="mt-4 flex flex-wrap gap-5 text-[10px] font-bold text-azul-oceano uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <LuMapPin size={15} className="text-verde-agua"/>
                          {produto.endereco?.bairro ? `${produto.endereco.bairro}, ${produto.endereco.cidade}` : 'Santa Rita do Sapucaí'}
                        </span>
                        <span className="flex items-center gap-1.5"><LuUser size={15} className="text-verde-agua"/> {produto.locador?.nome || 'Anunciante removido'}</span>
                        <span className="text-ciano flex items-center gap-1.5"><LuZap size={15}/> {produto.status}</span>
                      </div>
                    </div>
                    
                    <div className="p-6 bg-gray-50/50 md:border-l border-gray-100 flex flex-col justify-center items-center min-w-[180px]">
                      <div className="text-3xl font-black text-grafite">
                        R$ {produto.precos.precoPorDia} <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">/dia</span>
                      </div>
                      <div className="w-full space-y-2 mt-4">
                        <button 
                          onClick={() => navigate(`/produto/${produto._id}`)}
                          className="w-full bg-grafite text-white text-[11px] font-black py-3 rounded-xl hover:bg-black transition-all uppercase tracking-widest cursor-pointer active:scale-95 shadow-sm"
                        >
                          Reservar
                        </button>
                        <button 
                          onClick={() => navigate(`/produto/${produto._id}`)}
                          className="w-full bg-white border border-gray-200 text-grafite text-[10px] font-bold py-2 rounded-lg hover:border-verde-agua hover:text-verde-agua transition-all uppercase tracking-wider cursor-pointer"
                        >
                          Ver detalhes
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex justify-center items-center gap-2 mt-6 py-4">
                  <button className="p-2 border border-gray-200 rounded-xl hover:bg-white hover:border-verde-agua text-gray-400 hover:text-verde-agua transition-all cursor-pointer">
                    <LuChevronLeft size={18} />
                  </button>
                  <button className="w-10 h-10 bg-grafite text-white rounded-xl font-bold shadow-lg active:scale-95 cursor-pointer">1</button>
                  <button className="p-2 border border-gray-200 rounded-xl hover:bg-white hover:border-verde-agua text-gray-400 hover:text-verde-agua transition-all cursor-pointer">
                    <LuChevronRight size={18} />
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
