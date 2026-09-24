import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom"; // <-- ADICIONADO useNavigate
import { apiRequest } from "../services/api";
import { MediaAvaliacao } from "../components/MediaAvaliacao";
import { GaleriaFotos } from "../components/GaleriaFotos";
import { PainelAvaliacoes } from "../components/PainelAvaliacoes";
import { CalendarioReserva, LegendaCalendario } from "../components/CalendarioReserva";
import { chaveDaApi, chaveDoDia, diasDoPeriodo, diasOcupados as calcularDiasOcupados, formatarChave } from "../utils/datasReserva";

import { 
  LuStar, 
  LuMapPin, 
  LuChevronRight, 
  LuShieldCheck, 
  LuCheck, 
  LuMessageCircle,
  LuCalendar,
  LuClock,
  LuSparkles,
  LuWallet
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

const DATA_CURTA = { day: 'numeric', month: 'short' };

function ItemDiretriz({ icone, titulo, children }) {
  const Icone = icone;
  return (
    <li className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-white text-verde-agua">
        <Icone size={18} />
      </span>
      <span>
        <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">{titulo}</span>
        <span className="block text-sm font-medium text-gray-600">{children}</span>
      </span>
    </li>
  );
}

async function buscarOcupacao(anuncioId) {
  try {
    return await apiRequest(`/api/anuncios/${anuncioId}/ocupacao`);
  } catch {
    // Sem a ocupação, o calendário mostra só a disponibilidade; a API ainda recusa conflitos.
    return [];
  }
}

import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import SeloVerificado from "../components/SeloVerificado";
import { buscarCategoriaPorValor } from "../constants/categorias";

export function DetalhesProduto() {
  const { id } = useParams();
  const navigate = useNavigate(); // <-- INICIALIZADO useNavigate

  const [anuncio, setAnuncio] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [horarioRetirada, setHorarioRetirada] = useState("09:00");
  const [horarioDevolucao, setHorarioDevolucao] = useState("17:00");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [avaliacoesLocador, setAvaliacoesLocador] = useState(null);
  const [ocupacoes, setOcupacoes] = useState([]);
  const [calendarioAberto, setCalendarioAberto] = useState(false);
  const seletorDatasRef = useRef(null);

  // Dias que podem ser reservados: liberados pelo anunciante, sem reserva e a partir de hoje.
  const diasOcupados = useMemo(() => calcularDiasOcupados(ocupacoes), [ocupacoes]);
  const diasLivres = useMemo(() => {
    const hoje = chaveDoDia(new Date());
    return new Set(
      (anuncio?.disponivel || [])
        .map(chaveDaApi)
        .filter((dia) => dia >= hoje && !diasOcupados.has(dia))
    );
  }, [anuncio, diasOcupados]);

  useEffect(() => {
    if (!calendarioAberto) return;

    function fecharAoClicarFora(evento) {
      if (!seletorDatasRef.current?.contains(evento.target)) setCalendarioAberto(false);
    }
    function fecharComEsc(evento) {
      if (evento.key === 'Escape') setCalendarioAberto(false);
    }

    document.addEventListener('mousedown', fecharAoClicarFora);
    document.addEventListener('keydown', fecharComEsc);
    return () => {
      document.removeEventListener('mousedown', fecharAoClicarFora);
      document.removeEventListener('keydown', fecharComEsc);
    };
  }, [calendarioAberto]);

  useEffect(() => {
    async function buscarAnuncio() {
      try {
        setCarregando(true);
        const dados = await apiRequest(`/api/anuncios/${id}`);
        setAnuncio(dados);
        setOcupacoes(await buscarOcupacao(id));

        // Conecta o horário padrão do formulário de reserva com o que o
        // locador definiu ao anunciar o item, em vez de usar um valor fixo.
        if (dados?.precos?.horarioRetirada) setHorarioRetirada(dados.precos.horarioRetirada);
        if (dados?.precos?.horarioDevolucao) setHorarioDevolucao(dados.precos.horarioDevolucao);

        try {
          const dadosAvaliacoes = await apiRequest(`/api/avaliacoes/anuncio/${id}`);
          setAvaliacoesLocador(dadosAvaliacoes);
        } catch {
          setAvaliacoesLocador(null);
        }
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
      <div className='page-shell min-h-screen flex flex-col'>
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
      <div className='page-shell min-h-screen flex flex-col'>
        <Header />
        <main className='flex-grow flex items-center justify-center'>
          <p className='text-red-500 font-medium'>{erro || 'Anúncio não encontrado'}</p>
        </main>
        <Footer />
      </div>
    );
  }
  
  const diasValidos = dataInicio && dataFim ? diasDoPeriodo(dataInicio, dataFim).length : 0;
  const subtotal = diasValidos * anuncio.precos.precoPorDia;
  const taxaServico = subtotal * 0.03;
  const caucao = anuncio.precos.caucao || 0;
  const total = subtotal + taxaServico + caucao;

  async function handleSolicitarAluguel() {
    setMensagem(null);

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

    if (!diasDoPeriodo(dataInicio, dataFim).every((dia) => diasLivres.has(dia))) {
      setMensagem({tipo: 'erro', texto: 'O anúncio não está disponível durante todo o período escolhido.'});
      return;
    }

    const usuarioLogado = JSON.parse(dadosUsuarioRaw);

    try {
      setEnviando(true);

      await apiRequest("/api/alugueis", {
        method: "POST",
        body: {
          anuncio: anuncio._id,
          locatario: usuarioLogado.id,
          locador: anuncio.locador._id,
          dataInicio,
          dataFim,
          horarioRetirada,
          horarioDevolucao,
          precoTotal: total,
          taxaServico,
          caucao: anuncio.precos.caucao,
        },
      });

      setMensagem({tipo: 'sucesso', texto: 'Solicitação de aluguel enviada com sucesso!'});
      setDataInicio("");
      setDataFim("");
      setOcupacoes(await buscarOcupacao(anuncio._id));
    } catch (e) {
      setMensagem({
        tipo: 'erro',
        texto: e.message,
        acao: e.data?.verificacaoNecessaria ? { label: 'Verificar identidade', rota: '/configuracoes' } : null,
      });
    } finally {
      setEnviando(false);
    }
  }

  function alterarPeriodo({ inicio, fim }) {
    setDataInicio(inicio);
    setDataFim(fim);
    setMensagem(null);
    if (inicio && fim) setCalendarioAberto(false);
  }

  const semDatasLivres = diasLivres.size === 0;
  const tituloCalendario = !dataInicio
    ? 'Escolha o dia da retirada'
    : !dataFim
      ? 'Agora escolha a devolução'
      : `${diasValidos} ${diasValidos === 1 ? 'diária' : 'diárias'}`;
  const subtituloCalendario = semDatasLivres
    ? 'Este item não tem datas disponíveis no momento.'
    : !dataInicio
      ? 'Os dias em verde estão disponíveis para aluguel.'
      : !dataFim
        ? `Retirada em ${formatarChave(dataInicio, { day: 'numeric', month: 'long' })}. A devolução pode ser até o primeiro dia indisponível.`
        : `${formatarChave(dataInicio, DATA_CURTA)} – ${formatarChave(dataFim, DATA_CURTA)}`;

  const propsCalendario = { diasLivres, diasOcupados, inicio: dataInicio, fim: dataFim, onChange: alterarPeriodo };

  // --- NOVA FUNÇÃO ADICIONADA AQUI ---
  function handleMensagemAnfitriao() {
    setMensagem(null);
    const dadosUsuarioRaw = localStorage.getItem("dadosUsuario");

    if (!dadosUsuarioRaw) {
      setMensagem({ tipo: 'erro', texto: 'Você precisa estar logado para enviar mensagens.' });
      return;
    }

    const usuarioLogado = JSON.parse(dadosUsuarioRaw);

    if (usuarioLogado.id === anuncio.locador._id) {
      setMensagem({ tipo: 'erro', texto: 'Você não pode enviar mensagem para o seu próprio anúncio.' });
      return;
    }

    // Define para qual painel redirecionar com base no objetivo do usuário
    const rotaPainel = usuarioLogado.objetivo === 'locador' ? '/painelLocador' : '/painelLocatario';

    // Redireciona para o painel, forçando a abertura da aba de mensagens e enviando o ID do anfitrião
    navigate(rotaPainel, {
      state: { abrirConversa: anuncio.locador._id }
    });
  }
  // -----------------------------------

  return (
    <div className="page-shell min-h-screen font-sans text-grafite flex flex-col">
      
      <Header />

      <main className="max-w-7xl mx-auto w-full flex-grow p-4 pt-6 sm:p-6 sm:pt-8">
        
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">
          <span className="cursor-pointer hover:text-verde-agua" onClick={() => navigate('/')}>Início</span>
          <LuChevronRight size={14} />
          <span className="text-grafite truncate max-w-[200px]">{anuncio?.titulo}</span>
        </div>

        <div className="mb-6">
          <h1 className="mb-3 text-2xl font-bold text-grafite sm:text-3xl">{anuncio?.titulo}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-gray-500 sm:gap-6">
              <MediaAvaliacao dadosExternos={avaliacoesLocador} tamanho="lg" />
            <span className="flex items-center gap-1.5">
              <LuMapPin className="text-verde-agua" size={18}/> {anuncio.endereco.cidade}, {anuncio.endereco.estado}
            </span>
          </div>

          {(anuncio.categoria || anuncio.subcategorias?.length > 0) && (
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {anuncio.categoria && (
                <span className="bg-verde-agua/10 text-verde-agua text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border border-verde-agua/20">
                  {buscarCategoriaPorValor(anuncio.categoria)?.label || anuncio.categoria}
                </span>
              )}
              {anuncio.subcategorias?.map((sub, index) => (
                <span
                  key={index}
                  className="bg-verde-agua/10 text-verde-agua text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border border-verde-agua/20"
                >
                  {sub}
                </span>
              ))}
            </div>
          )}
        </div>

        <GaleriaFotos key={id} fotos={anuncio.fotos} titulo={anuncio.titulo} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
          
          <div className="lg:col-span-2 space-y-12">
            
            <section>
              <h2 className="text-xl font-bold text-grafite mb-4">Descrição</h2>
              <p className="text-gray-500 leading-relaxed text-sm whitespace-pre-line">
                {anuncio.descricao}
              </p>
            </section>

            {anuncio.especificacoes?.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-grafite mb-4">Especificações</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm text-gray-600 font-medium">
                  {anuncio.especificacoes
                    .filter((esp) => esp.chave?.trim())
                    .map((esp, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <LuCheck className="text-verde-agua shrink-0" size={20}/>
                        <span>
                          <span className="text-grafite font-bold">{esp.chave}:</span>{' '}
                          {esp.valor?.trim() || '—'}
                        </span>
                      </div>
                  ))}
                </div>
              </section>
            )}

            {/* Diretrizes e disponibilidade lado a lado. Entre lg e xl o card de reserva
                estreita a coluna e o calendário não cabe na metade, então eles empilham. */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <section className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <h2 className="text-lg font-bold text-grafite mb-5">Diretrizes de Aluguel</h2>
                <ul className="space-y-5">
                  <ItemDiretriz icone={LuMapPin} titulo="Retirada e devolução">
                    {anuncio.endereco.bairro}, {anuncio.endereco.cidade} - {anuncio.endereco.estado}
                  </ItemDiretriz>
                  <ItemDiretriz icone={LuClock} titulo="Horários">
                    Retirada às {anuncio.precos.horarioRetirada} e devolução até {anuncio.precos.horarioDevolucao}
                  </ItemDiretriz>
                  {anuncio.precos.exigirCaucao && (
                    <ItemDiretriz icone={LuWallet} titulo="Depósito caução">
                      R$ {anuncio.precos.caucao}, necessário para alugar
                    </ItemDiretriz>
                  )}
                  <ItemDiretriz icone={LuSparkles} titulo="Cuidados">
                    Devolva o item limpo e nas mesmas condições
                  </ItemDiretriz>
                </ul>
              </section>

              <section className="flex flex-col bg-white p-6 rounded-2xl border border-gray-100">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-bold text-grafite">Disponibilidade</h2>
                  {dataInicio && (
                    <button
                      type="button"
                      onClick={() => alterarPeriodo({ inicio: '', fim: '' })}
                      className="shrink-0 pt-1 text-xs font-bold text-grafite underline underline-offset-2 cursor-pointer"
                    >
                      Limpar datas
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1 mb-3">
                  {dataInicio ? `${tituloCalendario} · ${subtituloCalendario}` : subtituloCalendario}
                </p>
                <div className="flex flex-1 justify-center overflow-x-auto">
                  <CalendarioReserva {...propsCalendario} />
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <LegendaCalendario />
                </div>
              </section>
            </div>

            <section className="border-t border-gray-200 pt-10">
              <div className="flex items-center justify-between mb-6">
                <div
                  className="flex items-center gap-4 cursor-pointer group"
                  onClick={() => navigate(`/usuario/${anuncio.locador._id}`)}
                >
                  {anuncio.locador.avatar ? (
                    <img src={anuncio.locador.avatar} alt={anuncio.locador.nome} className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 bg-verde-agua rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {anuncio.locador.nome?.[0]?.toUpperCase()}
                    </div>
                  )}
                 <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-bold text-grafite group-hover:text-verde-agua transition-colors">{anuncio.locador.nome}</h2>
                      {anuncio.locador.verificacao?.status === 'aprovado' && <SeloVerificado tamanho="sm" />}
                    </div>
                    {formatarMembroDesde(anuncio.locador.createdAt) && (
                      <p className="text-sm text-gray-500">{formatarMembroDesde(anuncio.locador.createdAt)}</p>
                    )}
                    <div className="mt-1">
                      <MediaAvaliacao usuarioId={anuncio.locador._id} tamanho="sm" />
                    </div>
                  </div>
                </div>
                
                {/* BOTÃO ATUALIZADO AQUI */}
                <button 
                  onClick={handleMensagemAnfitriao}
                  className="flex items-center gap-2 border border-grafite text-grafite px-6 py-2.5 rounded-xl hover:bg-gray-50 transition-colors font-bold text-sm cursor-pointer"
                >
                  <LuMessageCircle size={18}/> Mensagem ao Anfitrião
                </button>
                
              </div>
              {anuncio.locador.bio && (
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                  {anuncio.locador.bio}
                </p>
              )}
            </section>

            <section className="border-t border-gray-200 pt-10">
              <PainelAvaliacoes
                dadosExternos={avaliacoesLocador}
                titulo="Avaliações deste produto"
                textoVazio="Este produto ainda não recebeu avaliações."
              />
            </section>

          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-white border border-gray-100 rounded-3xl p-6 shadow-xl">
              
              <div className="flex items-end justify-between mb-6 border-b border-gray-100 pb-6">
                <div>
                  <span className="text-3xl font-black text-grafite">R$ {anuncio.precos.precoPorDia}</span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">/ dia</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-gray-500">
                  <MediaAvaliacao dadosExternos={avaliacoesLocador} tamanho="sm" />
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="relative" ref={seletorDatasRef}>
                  <button
                    type="button"
                    onClick={() => setCalendarioAberto((aberto) => !aberto)}
                    aria-expanded={calendarioAberto}
                    aria-haspopup="dialog"
                    className={`w-full grid grid-cols-2 text-left border rounded-xl transition-colors cursor-pointer ${calendarioAberto ? 'border-grafite ring-1 ring-grafite' : 'border-gray-200 hover:border-gray-400'}`}
                  >
                    <span className="p-3 border-r border-gray-200">
                      <span className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase mb-1">
                        <LuCalendar size={11} /> Retirada
                      </span>
                      <span className={`block text-sm font-bold ${dataInicio ? 'text-grafite' : 'text-gray-400'}`}>
                        {dataInicio ? formatarChave(dataInicio) : 'Adicionar data'}
                      </span>
                    </span>
                    <span className="p-3">
                      <span className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase mb-1">
                        <LuCalendar size={11} /> Devolução
                      </span>
                      <span className={`block text-sm font-bold ${dataFim ? 'text-grafite' : 'text-gray-400'}`}>
                        {dataFim ? formatarChave(dataFim) : 'Adicionar data'}
                      </span>
                    </span>
                  </button>

                  {calendarioAberto && (
                    <div
                      className="fixed inset-0 z-40 bg-black/30 sm:hidden"
                      onClick={() => setCalendarioAberto(false)}
                      aria-hidden="true"
                    />
                  )}

                  {calendarioAberto && (
                    // No celular abre como gaveta na parte de baixo da tela; a partir de sm, como painel sob os campos.
                    <div
                      role="dialog"
                      aria-label="Escolher datas do aluguel"
                      className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto bg-white rounded-t-3xl shadow-2xl p-5 sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:mt-2 sm:z-30 sm:max-h-none sm:overflow-visible sm:w-[21rem] sm:rounded-2xl sm:border sm:border-gray-100 sm:p-4"
                    >
                      <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-gray-200 sm:hidden" aria-hidden="true" />
                      <p className="text-sm font-bold text-grafite">{tituloCalendario}</p>
                      <p className="text-xs text-gray-400 mb-3">{subtituloCalendario}</p>

                      <div className="flex justify-center">
                        <CalendarioReserva {...propsCalendario} />
                      </div>

                      <div className="mt-3">
                        <LegendaCalendario />
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => alterarPeriodo({ inicio: '', fim: '' })}
                          disabled={!dataInicio}
                          className="text-xs font-bold text-grafite underline underline-offset-2 disabled:text-gray-300 disabled:no-underline"
                        >
                          Limpar datas
                        </button>
                        <button
                          type="button"
                          onClick={() => setCalendarioAberto(false)}
                          className="bg-grafite text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-black transition-colors cursor-pointer"
                        >
                          Fechar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-gray-200 rounded-xl p-3 relative">
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Horário de Retirada</label>
                    <input 
                      type="time" 
                      value={horarioRetirada} 
                      onChange={(e) => setHorarioRetirada(e.target.value)}
                      className="w-full text-sm font-bold outline-none bg-transparent cursor-pointer" />
                  </div>
                  <div className="border border-gray-200 rounded-xl p-3 relative">
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Horário de Devolução</label>
                    <input 
                      type="time" 
                      value={horarioDevolucao} 
                      onChange={(e) => setHorarioDevolucao(e.target.value)}
                      className="w-full text-sm font-bold outline-none bg-transparent cursor-pointer" />
                  </div>
                </div>
              </div>

              <div className="space-y-4 text-sm font-medium text-gray-600 mb-6">
                <div className="flex justify-between">
                  <span>R$ {anuncio.precos.precoPorDia} x {diasValidos} {diasValidos === 1 ? 'diária' : 'diárias'}</span>
                  <span className="text-grafite font-bold">R$ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa de Serviço</span>
                  <span className="text-grafite font-bold">R$ {taxaServico.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="underline cursor-pointer">Depósito de Segurança</span>
                  <span className="text-grafite font-bold">R$ {anuncio.precos.caucao}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 flex justify-between items-center mb-6">
                <span className="font-bold text-grafite">Total</span>
                <span className="text-xl font-black text-grafite">R$ {total.toFixed(2)}</span>
              </div>

              {mensagem && (
                <div className={`p-3 mb-3 rounded-lg text-sm font-medium ${mensagem.tipo === 'sucesso' ? 'bg-verde-agua/10 text-verde-escuro border border-verde-agua/30' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {mensagem.texto}
                  {mensagem.acao && (
                    <button
                      onClick={() => navigate(mensagem.acao.rota)}
                      className="block mt-2 font-bold underline underline-offset-2 cursor-pointer"
                    >
                      {mensagem.acao.label}
                    </button>
                  )}
                </div>
              )}

              <button 
                onClick={handleSolicitarAluguel}
                disabled={enviando}
                className="w-full bg-grafite text-white font-black py-4 rounded-xl hover:bg-black transition-all uppercase tracking-widest cursor-pointer shadow-lg active:scale-95 mb-3">
                {enviando ? "Enviando..." : "Solicitar Aluguel"}
              </button>

              <div className="text-center space-y-2">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Você ainda não será cobrado</p>
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-verde-agua">
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
