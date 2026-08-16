import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "../services/api";

import { 
  LuStar, 
  LuMapPin, 
  LuChevronRight, 
  LuShieldCheck, 
  LuCheck, 
  LuMessageCircle,
  LuCalendar,
  LuClock
} from "react-icons/lu";

const mesesPtBr = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

function formatarMembroDesde(data) {
  if (!data) return null;
  const d = new Date(data);
  return `Membro desde ${mesesPtBr[d.getMonth()]} de ${d.getFullYear()}`;
}

import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

export function DetalhesProduto() {
  const { id } = useParams();

  const [anuncio, setAnuncio] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [horarioRetirada, setHorarioRetirada] = useState("09:00");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  useEffect(() => {
    async function buscarAnuncio() {
      try {
        setCarregando(true);
        const dados = await apiRequest(`/api/anuncios/${id}`);
        setAnuncio(dados);
      } catch (e) {
        setErro(e.message);
      } finally {
        setCarregando(false);
      }
    }
    buscarAnuncio();
  }, [id]);

  if (carregando) {
    return (
      <div className='min-h-screen bg-[#F8F9FA] flex flex-col'>
        <Header />
        <main className='flex-grow flex items-center justify-center'>
          <p className='text-gray-400 font-medium'> Carregando anúncio...</p>
        </main>
        <Footer />
      </div>
    );
  }  

  if (erro || !anuncio) {
    return (
      <div className='min-h-screen bg-[#F8F9FA] flex flex-col'>
        <Header />
        <main className='flex-grow flex items-center justify-center'>
          <p className='text-red-500 font-medium'>{erro || 'Anúncio não encontrado'}</p>
        </main>
        <Footer />
      </div>
    );
  }
  
  const dias = dataInicio && dataFim 
    ? Math.ceil((new Date(dataFim) - new Date(dataInicio)) / (1000 * 60 * 60 * 24)) : 0;

  const diasValidos = dias > 0 ? dias : 0;
  const subtotal = diasValidos * anuncio.precos.precoPorDia;
  const taxaServico = subtotal * 0.03;
  const caucao = anuncio.precos.caucao || 0;
  const total = subtotal + taxaServico + caucao;

  async function handleSolicitarAluguel() {
    setMensagem (null);

    const dadosUsuarioRaw = localStorage.getItem("dadosUsuario");

    if (!dadosUsuarioRaw) {
      setMensagem({tipo: 'erro', texto: 'Você precisa estar logado para solicitar o aluguel.'});
      return;
    }

    if (!dataInicio || !dataFim) {
      setMensagem({tipo: 'erro', texto: 'Selecione a data de início e a data de término.'});
      return;
    }

    if (diasValidos <= 0) {
      setMensagem({tipo: 'erro', texto: 'A data de término deve ser depois da data de início.'});
      return;
    }

    const usuarioLogado = JSON.parse(dadosUsuarioRaw);

    try {
      setEnviando(true);

      await apiRequest ("/api/alugueis", {
        method: "POST",
        body: {
          anuncio: anuncio._id,
          locatario: usuarioLogado.id,
          locador: anuncio.locador._id,
          dataInicio,
          dataFim,
          horarioRetirada,
          precoTotal: total,
          taxaServico,
          caucao: anuncio.precos.caucao,
        },
      });

      setMensagem({tipo: 'sucesso', texto: 'Solicitação de aluguel enviada com sucesso!'});
    } catch (e) {
      setMensagem({tipo: 'erro', texto: e.message});
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-[#1A1A1A] flex flex-col">
      
      <Header />

      <main className="max-w-7xl mx-auto w-full flex-grow p-6 pt-8">
        
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">
          <span className="cursor-pointer hover:text-[#29C354]">Início</span>
          <LuChevronRight size={14} />
          <span className="cursor-pointer hover:text-[#29C354]">Ferramentas e Equipamentos</span>
          <LuChevronRight size={14} />
          <span className="text-[#1A1A1A]">{anuncio?.titulo}</span>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-3">{anuncio?.titulo}</h1>
          <div className="flex items-center gap-6 text-sm text-gray-500 font-medium">
            <span className="flex items-center gap-1.5 text-[#1A1A1A] font-bold">
              <LuStar className="text-yellow-400" fill="currentColor" size={18}/> 
              4,8 <span className="text-gray-400 font-normal underline cursor-pointer">(24 avaliações)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <LuMapPin className="text-[#29C354]" size={18}/> {anuncio.endereco.cidade}, {anuncio.endereco.estado}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-4 grid-rows-2 gap-4 h-[400px] mb-12 rounded-3xl overflow-hidden">
          <div className="col-span-2 row-span-2 bg-gray-200 relative group cursor-pointer">
            {anuncio.fotos?.[0] ? (
              <img src={anuncio.fotos[0]} alt={anuncio.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm font-bold">Sem foto</div>
            )}
          </div>

        {[1, 2, 3, 4].map((indice) => (
          <div key={indice} className="bg-gray-200 relative group cursor-pointer overflow-hidden">
            {anuncio.fotos?.[indice] ? (
              <img src={anuncio.fotos[indice]} alt={`${anuncio.titulo} ${indice + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs font-bold">Sem foto</div>
          )}

        {indice === 4 && anuncio.fotos?.length > 5 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-lg hover:bg-black/50 transition-colors">
            +{anuncio.fotos.length - 5} mais
          </div>
        )}
        </div>
        ))}
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
          
          <div className="lg:col-span-2 space-y-12">
            
            <section>
              <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">Descrição</h2>
              <p className="text-gray-500 leading-relaxed text-sm whitespace-pre-line">
                {anuncio.descricao}
              </p>
            </section>

            {anuncio.especificacoes?.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">Especificações</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm text-gray-600 font-medium">
                  {anuncio.especificacoes
                    .filter((esp) => esp.chave?.trim())
                    .map((esp, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <LuCheck className="text-[#29C354] shrink-0" size={20}/>
                        <span>
                          <span className="text-[#1A1A1A] font-bold">{esp.chave}:</span>{' '}
                          {esp.valor?.trim() || '—'}
                        </span>
                      </div>
                  ))}
                </div>
              </section>
            )}

            <section className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <h2 className="text-lg font-bold text-[#1A1A1A] mb-4">Diretrizes de Aluguel</h2>
              <ul className="space-y-3 text-sm text-gray-600 font-medium">
                <li className="flex items-start gap-2">
                  <span>📍</span> Retirada e devolução em {anuncio.endereco.bairro}, {anuncio.endereco.cidade} - {anuncio.endereco.estado}
                </li>
                {anuncio.precos.exigirCaucao && (
                  <li className="flex items-start gap-2">
                    <span>💰</span> Depósito caução de R$ {anuncio.precos.caucao} necessário
                  </li>
                )}
                <li className="flex items-start gap-2"><span>✨</span> Favor devolver limpo e nas mesmas condições</li>
                <li className="flex items-start gap-2">
                  <span>🕒</span> Retirada às {anuncio.precos.horarioRetirada} e devolução até {anuncio.precos.horarioDevolucao}
                </li>
              </ul>
            </section>

            <section className="border-t border-gray-200 pt-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  {anuncio.locador.avatar ? (
                    <img src={anuncio.locador.avatar} alt={anuncio.locador.nome} className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 bg-[#29C354] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {anuncio.locador.nome?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-[#1A1A1A]">{anuncio.locador.nome}</h2>
                    {formatarMembroDesde(anuncio.locador.createdAt) && (
                      <p className="text-sm text-gray-500">{formatarMembroDesde(anuncio.locador.createdAt)}</p>
                    )}
                  </div>
                </div>
                <button className="flex items-center gap-2 border border-[#1A1A1A] text-[#1A1A1A] px-6 py-2.5 rounded-xl hover:bg-gray-50 transition-colors font-bold text-sm">
                  <LuMessageCircle size={18}/> Mensagem ao Anfitrião
                </button>
              </div>
              {anuncio.locador.bio && (
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                  {anuncio.locador.bio}
                </p>
              )}
            </section>

          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-white border border-gray-100 rounded-3xl p-6 shadow-xl">
              
              <div className="flex items-end justify-between mb-6 border-b border-gray-100 pb-6">
                <div>
                  <span className="text-3xl font-black text-[#1A1A1A]">R$ {anuncio.precos.precoPorDia}</span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">/ dia</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-gray-500">
                  <LuStar className="text-yellow-400" fill="currentColor" size={14}/> 4,8 (24 avaliações)
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-gray-200 rounded-xl p-3 relative">
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Data de Início</label>
                    <input 
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)} 
                      className="w-full text-sm font-bold outline-none bg-transparent cursor-pointer" />
                  </div>
                  <div className="border border-gray-200 rounded-xl p-3 relative">
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Data de Término</label>
                    <input
                      type = 'date'
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      className="w-full text-sm font-bold outline-none bg-transparent cursor-pointer"
                    />
                  </div>
                </div>
                <div className="border border-gray-200 rounded-xl p-3 relative">
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Horário de Retirada</label>
                  <input 
                    type="time" 
                    value={horarioRetirada} 
                    onChange={(e) => setHorarioRetirada(e.target.value)}
                    className="w-full text-sm font-bold outline-none bg-transparent cursor-pointer" />
                </div>
              </div>

              <div className="space-y-4 text-sm font-medium text-gray-600 mb-6">
                <div className="flex justify-between">
                  <span>R$ {anuncio.precos.precoPorDia} x {diasValidos} dias</span>
                  <span className="text-[#1A1A1A] font-bold">R$ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa de Serviço</span>
                  <span className="text-[#1A1A1A] font-bold">R$ {taxaServico.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="underline cursor-pointer">Depósito de Segurança</span>
                  <span className="text-[#1A1A1A] font-bold">R$ {anuncio.precos.caucao}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 flex justify-between items-center mb-6">
                <span className="font-bold text-[#1A1A1A]">Total</span>
                <span className="text-xl font-black text-[#1A1A1A]">R$ {total.toFixed(2)}</span>
              </div>

              {mensagem && (
                <div className={`p-3 mb-3 rounded-lg text-sm font-medium ${mensagem.tipo === 'sucesso' ? 'bg-[#29C354]/10 text-[#032D54] border border-[#29C354]/30' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {mensagem.texto}
                </div>
              )}

              <button 
                onClick={handleSolicitarAluguel}
                disabled={enviando}
                className="w-full bg-[#1A1A1A] text-white font-black py-4 rounded-xl hover:bg-black transition-all uppercase tracking-widest cursor-pointer shadow-lg active:scale-95 mb-3">
                {enviando ? "Enviando..." : "Solicitar Aluguel"}
              </button>

              <div className="text-center space-y-2">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Você ainda não será cobrado</p>
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#29C354]">
                  <LuShieldCheck size={16}/> Protegido por PROJETO Pagamentos Seguros
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
      <Footer />
      
    </div>
  );
}