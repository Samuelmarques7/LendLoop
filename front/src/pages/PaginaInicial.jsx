import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { LuWrench, LuMonitor, LuDumbbell, LuFlower2, LuPartyPopper, LuSearch, LuClock, LuTrendingUp, LuX, LuShieldCheck, LuSparkles } from 'react-icons/lu';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import heroEscuro from '../assets/hero/lendloop-hero-dark-v5.png';
import { useBuscasRecentes } from '../hooks/useBuscasRecentes';
import { SUGESTOES_POPULARES, BANCO_DE_PALAVRAS } from '../constants/buscasPopulares';

const categorias = [
  { nome: 'Ferramentas', icone: <LuWrench size={32} />, categoria: 'ferramentas' },
  { nome: 'Eletrônicos', icone: <LuMonitor size={32} />, categoria: 'eletronicos' },
  { nome: 'Esportes', icone: <LuDumbbell size={32} />, categoria: 'esportes-lazer' },
  { nome: 'Casa & Jardim', icone: <LuFlower2 size={32} />, busca: 'casa e jardim' },
  { nome: 'Festas', icone: <LuPartyPopper size={32} />, categoria: 'festas-eventos' },
];

const passosLocatario = [
  { titulo: 'Buscar e Explorar', descricao: 'Encontre o item perfeito na sua região usando nossos filtros de busca' },
  { titulo: 'Reservar e Pagar', descricao: 'Selecione suas datas e pague com segurança através da nossa plataforma' },
  { titulo: 'Retirar e Aproveitar', descricao: 'Coordene a retirada com o proprietário e aproveite seu aluguel' },
];

const passosAnfitriao = [
  { titulo: 'Anunciar Seus Itens', descricao: 'Faça upload de fotos e detalhes dos itens que você quer alugar' },
  { titulo: 'Aceitar Reservas', descricao: 'Analise e aprove solicitações de aluguel de usuários próximos' },
  { titulo: 'Ganhar Dinheiro', descricao: 'Receba automaticamente quando o período de aluguel terminar' },
];

// Função para destacar a parte da palavra que o usuário está digitando
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
          : <span key={i} className="text-[#1A1A1A] font-bold">{parte}</span>
      )}
    </span>
  );
}

export function PaginaInicial() {
  const navigate = useNavigate(); 
  const [buscaHome, setBuscaHome] = useState('');
  const { buscasRecentes, salvarBuscaRecente, removerBuscaRecente, limparBuscasRecentes } = useBuscasRecentes();
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const buscaRef = useRef(null);

  const isLogado = localStorage.getItem('usuarioLogado') === 'true';

  useEffect(() => {
    function handleClickFora(e) {
      if (buscaRef.current && !buscaRef.current.contains(e.target)) {
        setMostrarSugestoes(false);
      }
    }
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  function executarBusca(termo) {
    const termoFinal = (termo ?? buscaHome).trim();
    if (!termoFinal) return;

    salvarBuscaRecente(termoFinal);
    setMostrarSugestoes(false);

    const params = new URLSearchParams();
    params.append('busca', termoFinal);
    navigate(`/busca?${params.toString()}`);
  }

  function handleBuscarHome() {
    executarBusca();
  }

  function handleClicarSugestao(termo) {
    setBuscaHome(termo);
    executarBusca(termo);
  }

  function handleClicarCategoria(cat) {
    const params = new URLSearchParams();
    if (cat.categoria) params.append('categoria', cat.categoria);
    if (cat.busca) params.append('busca', cat.busca);
    navigate(`/busca?${params.toString()}`);
  }

  // Lógica inteligente de previsão (Autocomplete) usando as variáveis importadas
  const buscaLower = buscaHome.toLowerCase().trim();
  
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
    <div className="min-h-screen flex flex-col">

      <Header />

      <section
        className="relative isolate w-full overflow-visible flex items-center justify-center py-24 px-8 bg-[#061a30]"
      >
        <img src={heroEscuro} alt="" className="absolute inset-0 -z-30 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 -z-20 bg-black/45"></div>
        <div className="absolute inset-y-0 left-1/2 -z-10 w-[60%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(41,195,84,.15),transparent_68%)]"></div>
        <div className="max-w-3xl w-full flex flex-col items-center text-center gap-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#29C354]/35 bg-[#29C354]/10 px-4 py-2 text-xs font-bold tracking-widest text-white/90"><LuSparkles size={14} className="text-[#75e38e]" /> ALUGUEL LOCAL, DO SEU JEITO</span>
          <h1 className="text-5xl md:text-6xl font-black text-white leading-[1.05] tracking-tight">
            Use mais.<br /><span className="text-[#75e38e]">Compre menos.</span>
          </h1>
          <p className="text-white/90 text-lg max-w-md">
            Encontre ferramentas, eletrônicos e muito mais perto de você — sem precisar comprar.
          </p>
          <div ref={buscaRef} className="relative w-full max-w-2xl text-left">
            <div className="flex w-full bg-white rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10">
              <div className="flex items-center gap-2 px-4 text-[#0068F3]">
                <LuSearch size={20} />
              </div>
              <input
                type="text"
                placeholder="O que você quer alugar?"
                value={buscaHome}
                onFocus={() => setMostrarSugestoes(true)}
                onChange={(e) => setBuscaHome(e.target.value)}
                onKeyDown={(e) => {if (e.key === 'Enter') handleBuscarHome();}}
                className="flex-1 py-4 text-[#1A1A1A] outline-none text-base font-medium"
              />
              <button 
                onClick={handleBuscarHome}
                className="bg-[#29C354] hover:bg-[#032D54] text-white px-6 font-semibold transition-colors cursor-pointer"
              >
                Buscar
              </button>
            </div>

            {mostrarDropdown && (
              <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20">
                
                {buscaLower && (
                  <div className="py-2 border-b border-gray-50 bg-[#0068F3]/5">
                    <button
                      onClick={() => handleBuscarHome()}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#0068F3]/10 text-[#0068F3] transition-colors cursor-pointer text-sm font-bold"
                    >
                      <LuSearch size={16} className="shrink-0" />
                      Buscar por "{buscaHome}"
                    </button>
                  </div>
                )}

                {recentesFiltradas.length > 0 && (
                  <div className="py-2">
                    <div className="flex items-center justify-between px-4 py-1.5">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Buscas recentes</span>
                      {!buscaLower && (
                        <button
                          onClick={limparBuscasRecentes}
                          className="text-[11px] text-[#0068F3] hover:text-[#032D54] font-bold cursor-pointer uppercase tracking-wider"
                        >
                          Limpar
                        </button>
                      )}
                    </div>
                    {recentesFiltradas.map((termo) => (
                      <button
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
                        key={termo}
                        onClick={() => handleClicarSugestao(termo)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer text-sm"
                      >
                        {buscaLower ? (
                          <LuSearch size={16} className="text-gray-400 shrink-0" />
                        ) : (
                          <LuTrendingUp size={16} className="text-[#29C354] shrink-0" />
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
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium text-slate-300">
            <span className="inline-flex items-center gap-2"><LuShieldCheck size={16} className="text-[#72cfff]" /> Perfis verificados</span>
            <span>Itens incríveis perto de você</span>
          </div>
        </div>
      </section>

      <section className="py-16 px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[#032D54] mb-3">Categorias Populares</h2>
          <p className="text-center text-[#0068F3] mb-10">
            Encontre o que você precisa nas nossas categorias de aluguel mais populares
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {categorias.map((cat) => (
              <div
                key={cat.nome}
                onClick={() => handleClicarCategoria(cat)}
                className="flex flex-col items-center gap-2 cursor-pointer group"
              >
                <div className="w-full aspect-square bg-gray-50 border border-gray-100 shadow-sm rounded-xl flex items-center justify-center text-[#032D54] group-hover:bg-[#29C354] group-hover:text-white transition-colors">
                  {cat.icone}
                </div>
                <span className="text-sm font-semibold text-[#1A1A1A] mt-1">{cat.nome}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[#032D54] mb-3">Como Funciona</h2>
          <p className="text-center text-[#0068F3] mb-12">
            Passos simples para alugar ou compartilhar seus itens
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-center text-[#032D54] mb-8">Para Locatários</h3>
              <div className="flex flex-col gap-6">
                {passosLocatario.map((passo, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#29C354] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-bold text-[#1A1A1A]">{passo.titulo}</p>
                      <p className="text-[#0068F3] text-sm mt-1 leading-relaxed">{passo.descricao}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-center text-[#032D54] mb-8">Para Locadores</h3>
              <div className="flex flex-col gap-6">
                {passosAnfitriao.map((passo, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#29C354] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-bold text-[#1A1A1A]">{passo.titulo}</p>
                      <p className="text-[#0068F3] text-sm mt-1 leading-relaxed">{passo.descricao}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      <section className="bg-[#1A1A1A] py-20 px-8 flex flex-col items-center text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Seja um Locador</h2>
        <p className="text-gray-300 mb-8 max-w-md">
          Transforme seus itens não utilizados em renda. Comece a hospedar hoje.
        </p>
        <button 
          onClick={() => navigate(isLogado ? '/painelLocador' : '/cadastro')} 
          className="bg-[#29C354] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#0297AA] transition-colors cursor-pointer shadow-lg"
        >
          Começar a Hospedar (Grátis e Sem Compromisso)
        </button>
      </section>

      <Footer />

    </div>
  );
}
