import { useState, useEffect } from 'react';
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
  LuPackageX
} from "react-icons/lu";
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { CATEGORIAS } from '../constants/categorias';

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

  async function buscarAnuncios() {
    const params = new URLSearchParams();
    
    if (busca) params.append('busca', busca);
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
    buscarAnuncios();
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

  // Texto do cabeçalho reflete o filtro que veio da Home (categoria ou busca),
  // em vez de sempre mostrar "Ferramentas" fixo.
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

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-[#1A1A1A] flex flex-col">
      <Header />

      <main className="max-w-7xl mx-auto w-full flex-grow p-6 pt-10">
        
        <section className="mb-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#1A1A1A]">Resultados da Busca</h1>
              <p className="text-gray-400 text-sm mt-1">{obterSubtitulo()}</p>
            </div>
            <span className="text-[#0068F3] text-[10px] font-bold bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-wider">
              {produtos.length} itens encontrados
            </span>
          </div>

          <form onSubmit={handleSubmitBusca} className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5 relative">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">O que você busca?</label>
              <div className="relative">
                <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Ex: Furadeira, Barraca, categoria ou subcategoria..." 
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 pl-10 text-sm focus:ring-2 focus:ring-[#29C354]/20 focus:border-[#29C354] outline-none transition-all" />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Início</label>
              <div className="relative">
                <LuCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input 
                  type="date" 
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 pl-10 text-sm outline-none focus:border-[#29C354] cursor-pointer" />
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
                  className="w-full border border-gray-200 rounded-xl p-3 pl-10 text-sm outline-none focus:border-[#29C354] cursor-pointer" />
              </div>
            </div>

            <div className="md:col-span-3 flex items-end">
              <button 
                type="submit"
                className="w-full bg-[#29C354] text-white font-bold py-3.5 rounded-xl hover:bg-[#032D54] transition-all shadow-sm active:scale-[0.98] cursor-pointer">
                Atualizar Busca
              </button>
            </div>
          </form>
        </section>

        <div className="flex gap-8 flex-col lg:flex-row">
          
          <aside className="w-full lg:w-64 shrink-0">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-[#1A1A1A]">Filtros</h3>
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="text-xs text-gray-400 hover:text-[#29C354] transition-colors cursor-pointer"
                >
                    Limpar tudo
                </button>
                </div>

                <div className="space-y-6">
                <div className="border-b border-gray-50 pb-4">
                    <h4 className="text-sm font-bold text-[#1A1A1A] mb-3">Faixa de Preço</h4>
                    <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="Mín"
                      value={precoMin}
                      onChange={(e) => setPrecoMin(e.target.value)}
                      className="w-full border border-gray-100 bg-gray-50 rounded-lg p-2 text-xs outline-none focus:bg-white focus:border-[#29C354]" />
                    <input
                      type="number"
                      min="0"
                      placeholder="Máx"
                      value={precoMax}
                      onChange={(e) => setPrecoMax(e.target.value)}
                      className="w-full border border-gray-100 bg-gray-50 rounded-lg p-2 text-xs outline-none focus:bg-white focus:border-[#29C354]" />
                    </div>
                    <p className="text-[10px] text-gray-300 mt-2 uppercase tracking-widest">Por dia</p>
                </div>

                <div>
                    <h4 className="text-sm font-bold text-[#1A1A1A] mb-3">Categoria</h4>
                    <div className="space-y-2">
                    {CATEGORIAS.map((cat) => (
                        <label key={cat.value} className="flex items-center gap-3 text-sm text-gray-500 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={categoriasSelecionadas.includes(cat.value)}
                          onChange={() => toggleCategoria(cat.value)}
                          className="w-4 h-4 rounded border-gray-300 accent-[#29C354] cursor-pointer" />
                        <span className="group-hover:text-[#1A1A1A] transition-colors">{cat.label}</span>
                        </label>
                    ))}
                    </div>
                </div>
                </div>

                <button
                  type="button"
                  onClick={buscarAnuncios}
                  className="w-full mt-6 bg-[#1A1A1A] text-white text-xs font-bold py-3 rounded-xl hover:bg-black transition-all uppercase tracking-widest cursor-pointer"
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
                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Nenhum item encontrado</h2>
                <p className="text-gray-400 max-w-md">
                  Ainda não temos itens disponíveis com esses filtros em Santa Rita do Sapucaí. Tente buscar por outra categoria ou limpar os filtros atuais.
                </p>
                <button
                  onClick={limparFiltros}
                  className="mt-6 border-2 border-[#29C354] text-[#29C354] px-6 py-2.5 rounded-xl font-bold hover:bg-[#29C354]/10 transition-colors cursor-pointer">
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
                          <h2 className="text-xl font-bold text-[#1A1A1A] group-hover:text-[#29C354] transition-colors leading-tight">
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
                      
                      <div className="mt-4 flex flex-wrap gap-5 text-[10px] font-bold text-[#0068F3] uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <LuMapPin size={15} className="text-[#29C354]"/>
                          {produto.endereco?.bairro ? `${produto.endereco.bairro}, ${produto.endereco.cidade}` : 'Santa Rita do Sapucaí'}
                        </span>
                        <span className="flex items-center gap-1.5"><LuUser size={15} className="text-[#29C354]"/> {produto.locador?.nome || 'Anunciante removido'}</span>
                        <span className="text-[#0297AA] flex items-center gap-1.5"><LuZap size={15}/> {produto.status}</span>
                      </div>
                    </div>
                    
                    <div className="p-6 bg-gray-50/50 md:border-l border-gray-100 flex flex-col justify-center items-center min-w-[180px]">
                      <div className="text-3xl font-black text-[#1A1A1A]">
                        R$ {produto.precos.precoPorDia} <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">/dia</span>
                      </div>
                      <div className="w-full space-y-2 mt-4">
                        <button 
                          onClick={() => navigate(`/produto/${produto._id}`)}
                          className="w-full bg-[#1A1A1A] text-white text-[11px] font-black py-3 rounded-xl hover:bg-black transition-all uppercase tracking-widest cursor-pointer active:scale-95 shadow-sm"
                        >
                          Reservar
                        </button>
                        <button 
                          onClick={() => navigate(`/produto/${produto._id}`)}
                          className="w-full bg-white border border-gray-200 text-[#1A1A1A] text-[10px] font-bold py-2 rounded-lg hover:border-[#29C354] hover:text-[#29C354] transition-all uppercase tracking-wider cursor-pointer"
                        >
                          Ver detalhes
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex justify-center items-center gap-2 mt-6 py-4">
                  <button className="p-2 border border-gray-200 rounded-xl hover:bg-white hover:border-[#29C354] text-gray-400 hover:text-[#29C354] transition-all cursor-pointer">
                    <LuChevronLeft size={18} />
                  </button>
                  <button className="w-10 h-10 bg-[#1A1A1A] text-white rounded-xl font-bold shadow-lg active:scale-95 cursor-pointer">1</button>
                  <button className="p-2 border border-gray-200 rounded-xl hover:bg-white hover:border-[#29C354] text-gray-400 hover:text-[#29C354] transition-all cursor-pointer">
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