import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import {
  LuSearch,
  LuCalendar,
  LuSettings2,
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

export function ResultadosBusca() {
  const navigate = useNavigate(); 
  
  const [produtos, setProdutos] = useState([]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-[#1A1A1A] flex flex-col">
      <Header />

      <main className="max-w-7xl mx-auto w-full flex-grow p-6 pt-10">
        
        <section className="mb-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#1A1A1A]">Resultados da Busca</h1>
              <p className="text-gray-400 text-sm mt-1">Ferramentas disponíveis na sua região</p>
            </div>
            <span className="text-[#00639E] text-[10px] font-bold bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-wider">
              {produtos.length} itens encontrados
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-4 relative">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">O que você busca?</label>
              <div className="relative">
                <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Ex: Furadeira, Barraca..." className="w-full border border-gray-200 rounded-xl p-3 pl-10 text-sm focus:ring-2 focus:ring-[#00B795]/20 focus:border-[#00B795] outline-none transition-all" />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Início</label>
              <div className="relative">
                <LuCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input type="date" className="w-full border border-gray-200 rounded-xl p-3 pl-10 text-sm outline-none focus:border-[#00B795] cursor-pointer" />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Fim</label>
              <div className="relative">
                <LuCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input type="date" className="w-full border border-gray-200 rounded-xl p-3 pl-10 text-sm outline-none focus:border-[#00B795] cursor-pointer" />
              </div>
            </div>

            <div className="md:col-span-3 flex items-end">
              <button className="w-full bg-[#00B795] text-white font-bold py-3.5 rounded-xl hover:bg-[#006861] transition-all shadow-sm active:scale-[0.98] cursor-pointer">
                Atualizar Busca
              </button>
            </div>

            <div className="md:col-span-1 flex items-end">
              <button className="w-full flex justify-center items-center bg-gray-50 border border-gray-100 text-gray-500 h-[46px] rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                <LuSettings2 size={20} />
              </button>
            </div>
          </div>
        </section>

        <div className="flex gap-8 flex-col lg:flex-row">
          
          <aside className="w-full lg:w-64 shrink-0">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-[#1A1A1A]">Filtros</h3>
                <button className="text-xs text-gray-400 hover:text-[#00B795] transition-colors cursor-pointer">
                    Limpar tudo
                </button>
                </div>

                <div className="space-y-6">
                <div className="border-b border-gray-50 pb-4">
                    <h4 className="text-sm font-bold text-[#1A1A1A] mb-3">Faixa de Preço</h4>
                    <div className="flex items-center gap-2">
                    <input type="text" placeholder="Mín" className="w-full border border-gray-100 bg-gray-50 rounded-lg p-2 text-xs outline-none focus:bg-white focus:border-[#00B795]" />
                    <input type="text" placeholder="Máx" className="w-full border border-gray-100 bg-gray-50 rounded-lg p-2 text-xs outline-none focus:bg-white focus:border-[#00B795]" />
                    </div>
                    <p className="text-[10px] text-gray-300 mt-2 uppercase tracking-widest">Por dia</p>
                </div>

                <div className="border-b border-gray-50 pb-4">
                    <h4 className="text-sm font-bold text-[#1A1A1A] mb-3">Distância Máxima</h4>
                    <input 
                    type="range" 
                    min="1" 
                    max="50" 
                    defaultValue="15" 
                    className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#00B795]" 
                    />
                    <div className="flex justify-between mt-2">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest">1 km</span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest">50 km</span>
                    </div>
                </div>

                <div className="border-b border-gray-50 pb-4">
                    <h4 className="text-sm font-bold text-[#1A1A1A] mb-3">Categoria</h4>
                    <div className="space-y-2">
                    {['Ferramentas', 'Eletrônicos', 'Casa & Jardim', 'Esportes'].map((cat, idx) => (
                        <label key={cat} className="flex items-center gap-3 text-sm text-gray-500 cursor-pointer group">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 accent-[#00B795] cursor-pointer" />
                        <span className="group-hover:text-[#1A1A1A] transition-colors">{cat}</span>
                        </label>
                    ))}
                    </div>
                </div>

                <div className="border-b border-gray-50 pb-4">
                    <h4 className="text-sm font-bold text-[#1A1A1A] mb-3">Avaliação</h4>
                    <div className="space-y-2">
                    {[4.5, 4.0, 3.5].map((rate) => (
                        <label key={rate} className="flex items-center gap-3 text-sm text-gray-500 cursor-pointer group">
                        <input type="radio" name="rating" className="w-4 h-4 accent-[#00B795] cursor-pointer" />
                        <span className="group-hover:text-[#1A1A1A] flex items-center gap-1.5 transition-colors">
                            <LuStar size={14} className="text-yellow-400" fill="currentColor"/> {rate}+ estrelas
                        </span>
                        </label>
                    ))}
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-bold text-[#1A1A1A] mb-3">Disponibilidade</h4>
                    <div className="space-y-2">
                    <label className="flex items-center gap-3 text-sm text-gray-500 cursor-pointer group">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 accent-[#00B795] cursor-pointer" />
                        <span className="group-hover:text-[#1A1A1A] transition-colors">Reserva instantânea</span>
                    </label>
                    <label className="flex items-center gap-3 text-sm text-gray-500 cursor-pointer group">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 accent-[#00B795] cursor-pointer" />
                        <span className="group-hover:text-[#1A1A1A] transition-colors">Retirada no mesmo dia</span>
                    </label>
                    </div>
                </div>
                </div>
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
                  Ainda não temos itens disponíveis com esses filtros na sua região. Tente buscar por outra categoria ou limpar os filtros atuais.
                </p>
                <button className="mt-6 border-2 border-[#00B795] text-[#00B795] px-6 py-2.5 rounded-xl font-bold hover:bg-[#00B795]/10 transition-colors cursor-pointer">
                  Limpar Filtros
                </button>
              </div>
            ) : (
              <>
                {produtos.map((produto) => (
                  <div key={produto.id} className="bg-white flex flex-col md:flex-row border border-gray-100 rounded-3xl overflow-hidden hover:shadow-lg transition-all group cursor-pointer">
                    <div className="w-full md:w-72 h-48 bg-gray-50 relative overflow-hidden">
                      <img src={produto.imagem} alt={produto.nome} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <button className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 shadow-sm transition-colors cursor-pointer active:scale-90">
                        <LuHeart size={18} />
                      </button>
                    </div>
                    
                    <div className="p-6 flex-grow flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-4">
                          <h2 className="text-xl font-bold text-[#1A1A1A] group-hover:text-[#00B795] transition-colors leading-tight">
                            {produto.nome}
                          </h2>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600 bg-gray-50 border border-gray-100 px-2.5 py-1.5 rounded-lg shrink-0">
                            <LuStar className="text-yellow-400" fill="currentColor" /> {produto.avaliacao}
                          </div>
                        </div>
                        <p className="text-sm text-gray-400 mt-2 line-clamp-2 leading-relaxed italic">
                          {produto.descricao}
                        </p>
                      </div>
                      
                      <div className="mt-4 flex flex-wrap gap-5 text-[10px] font-bold text-[#00639E] uppercase tracking-wider">
                        <span className="flex items-center gap-1.5"><LuMapPin size={15} className="text-[#00B795]"/> {produto.distancia}</span>
                        <span className="flex items-center gap-1.5"><LuUser size={15} className="text-[#00B795]"/> {produto.dono}</span>
                        <span className="text-[#05BFBE] flex items-center gap-1.5"><LuZap size={15}/> {produto.status}</span>
                      </div>
                    </div>
                    
                    <div className="p-6 bg-gray-50/50 md:border-l border-gray-100 flex flex-col justify-center items-center min-w-[180px]">
                      <div className="text-3xl font-black text-[#1A1A1A]">
                        R$ {produto.preco} <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">/dia</span>
                      </div>
                      <div className="w-full space-y-2 mt-4">
                        <button 
                          onClick={() => navigate(`/produto/${produto.id}`)}
                          className="w-full bg-[#1A1A1A] text-white text-[11px] font-black py-3 rounded-xl hover:bg-black transition-all uppercase tracking-widest cursor-pointer active:scale-95 shadow-sm"
                        >
                          Reservar
                        </button>
                        <button 
                          onClick={() => navigate(`/produto/${produto.id}`)}
                          className="w-full bg-white border border-gray-200 text-[#1A1A1A] text-[10px] font-bold py-2 rounded-lg hover:border-[#00B795] hover:text-[#00B795] transition-all uppercase tracking-wider cursor-pointer"
                        >
                          Ver detalhes
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex justify-center items-center gap-2 mt-6 py-4">
                  <button className="p-2 border border-gray-200 rounded-xl hover:bg-white hover:border-[#00B795] text-gray-400 hover:text-[#00B795] transition-all cursor-pointer">
                    <LuChevronLeft size={18} />
                  </button>
                  <button className="w-10 h-10 bg-[#1A1A1A] text-white rounded-xl font-bold shadow-lg active:scale-95 cursor-pointer">1</button>
                  <button className="w-10 h-10 border border-gray-100 bg-white text-gray-400 rounded-xl font-bold hover:border-[#00B795] hover:text-[#00B795] transition-all active:scale-95 cursor-pointer">2</button>
                  <button className="w-10 h-10 border border-gray-100 bg-white text-gray-400 rounded-xl font-bold hover:border-[#00B795] hover:text-[#00B795] transition-all active:scale-95 cursor-pointer">3</button>
                  <span className="text-gray-300 font-bold px-1">...</span>
                  <button className="w-10 h-10 border border-gray-100 bg-white text-gray-400 rounded-xl font-bold hover:border-[#00B795] hover:text-[#00B795] transition-all active:scale-95 cursor-pointer">12</button>
                  <button className="p-2 border border-gray-200 rounded-xl hover:bg-white hover:border-[#00B795] text-gray-400 hover:text-[#00B795] transition-all cursor-pointer">
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