import { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuSend, LuMessageSquare, LuSearch, LuArrowLeft } from 'react-icons/lu';
import { apiRequest } from '../services/api';
import { useNotificacao } from '../context/NotificacaoContext';

function formatarHora(data) {
  return new Date(data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatarDivisorData(data) {
  const d = new Date(data);
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);

  if (d.toDateString() === hoje.toDateString()) return 'Hoje';
  if (d.toDateString() === ontem.toDateString()) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatarDataConversa(data) {
  const d = new Date(data);
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);

  if (d.toDateString() === hoje.toDateString()) return formatarHora(d);
  if (d.toDateString() === ontem.toDateString()) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function PainelMensagens({ usuarioLogadoId, corPrimaria = '#0073F3', conversaParaAbrir, onConversasAtualizadas }) {

  const navigate = useNavigate();
  const { notificar } = useNotificacao();

  const [conversas, setConversas] = useState([]);
  const [carregandoConversas, setCarregandoConversas] = useState(true);
  const [conversaAtivaId, setConversaAtivaId] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [textoNovaMensagem, setTextoNovaMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [busca, setBusca] = useState('');

  const fimDaListaRef = useRef(null);
  const jaAbriuConversaInicial = useRef(false);

  const buscarConversas = useCallback(async () => {
    try {
      const dados = await apiRequest(`/api/conversas/usuario/${usuarioLogadoId}`);
      setConversas(dados);
      onConversasAtualizadas?.(dados.reduce((soma, c) => soma + (c.naoLidas || 0), 0));
    } catch (e) {
      console.error(e);
    } finally {
      setCarregandoConversas(false);
    }
  }, [usuarioLogadoId, onConversasAtualizadas]);

  useEffect(() => {
    buscarConversas();
    const intervalo = setInterval(buscarConversas, 8000);
    return () => clearInterval(intervalo);
  }, [buscarConversas]);

  useEffect(() => {
    async function resolverConversa() {
      if (conversaParaAbrir && !jaAbriuConversaInicial.current) {
        jaAbriuConversaInicial.current = true;
        try {
          const conversa = await apiRequest('/api/conversas', {
            method: 'POST',
            body: {
              usuarioA: usuarioLogadoId,
              usuarioB: conversaParaAbrir
            }
          });

          if (conversa && conversa._id) {
            setConversas(prev => {
              const existe = prev.find(c => c._id === conversa._id);
              if (!existe) return [conversa, ...prev];
              return prev;
            });
            setConversaAtivaId(conversa._id);
          }
        } catch (erro) {
          console.error("Erro ao iniciar a conversa:", erro);
          notificar('Não foi possível carregar o chat. Tente novamente mais tarde.', 'erro');
        }
      }
    }
    resolverConversa();
  }, [conversaParaAbrir, usuarioLogadoId]);

  const buscarMensagens = useCallback(async () => {
    if (!conversaAtivaId) return;
    try {
      const dados = await apiRequest(`/api/mensagens/conversa/${conversaAtivaId}`);
      setMensagens(dados);
    } catch (e) {
      console.error(e);
    }
  }, [conversaAtivaId]);

  useEffect(() => {
    if (!conversaAtivaId) return;

    buscarMensagens();
    apiRequest(`/api/mensagens/conversa/${conversaAtivaId}/lida`, {
      method: 'PATCH',
      body: { usuarioId: usuarioLogadoId }
    }).then(buscarConversas).catch(() => {});

    const intervalo = setInterval(buscarMensagens, 4000);
    return () => clearInterval(intervalo);
  }, [conversaAtivaId, buscarMensagens, usuarioLogadoId, buscarConversas]);

  useEffect(() => {
    fimDaListaRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const conversaAtiva = conversas.find(c => c._id === conversaAtivaId);
  const outroParticipante = conversaAtiva?.participantes.find(p => p._id !== usuarioLogadoId);

  const conversasFiltradas = conversas.filter((c) => {
    const outro = c.participantes.find(p => p._id !== usuarioLogadoId);
    return outro?.nome?.toLowerCase().includes(busca.toLowerCase());
  });

  async function handleEnviarMensagem(e) {
    e.preventDefault();
    const texto = textoNovaMensagem.trim();
    if (!texto || !outroParticipante || enviando) return;

    setEnviando(true);
    setTextoNovaMensagem('');
    try {
      const novaMensagem = await apiRequest('/api/mensagens', {
        method: 'POST',
        body: {
          conversa: conversaAtivaId,
          remetente: usuarioLogadoId,
          destinatario: outroParticipante._id,
          texto
        }
      });
      setMensagens(prev => [...prev, novaMensagem]);
      buscarConversas();
    } catch (e) {
      notificar(e.message, 'erro');
      setTextoNovaMensagem(texto);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-13.5rem)] min-h-[28rem] overflow-hidden rounded-2xl border border-gray-200 bg-white sm:h-[calc(100dvh-220px)] sm:min-h-[500px]">

      <div className={`w-full sm:w-80 border-r border-gray-200 flex flex-col ${conversaAtivaId ? 'hidden sm:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <LuSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar conversas..."
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-azul-oceano/20 focus:border-azul-oceano transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {carregandoConversas ? (
            <p className="text-center text-sm text-gray-400 p-6">Carregando conversas...</p>
          ) : conversasFiltradas.length === 0 ? (
            <div className="text-center text-gray-400 p-8">
              <LuMessageSquare size={26} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">Nenhuma conversa ainda</p>
              <p className="text-xs mt-1">Suas conversas com locadores e locatários vão aparecer aqui.</p>
            </div>
          ) : (
            conversasFiltradas.map((c) => {
              const outro = c.participantes.find(p => p._id !== usuarioLogadoId);
              const ativa = c._id === conversaAtivaId;
              return (
                <button
                  key={c._id}
                  onClick={() => setConversaAtivaId(c._id)}
                  className={`w-full flex items-center gap-3 p-4 border-b border-gray-100 text-left transition-colors cursor-pointer hover:bg-gray-50 ${ativa ? 'bg-gray-50' : ''}`}
                >
                  {outro?.avatar ? (
                    <img src={outro.avatar} alt={outro.nome} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                      style={{ backgroundColor: corPrimaria }}
                    >
                      {outro?.nome?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm text-grafite truncate">{outro?.nome || 'Usuário removido'}</p>
                      <span className="text-[11px] text-gray-400 flex-shrink-0">{formatarDataConversa(c.ultimaMensagemEm)}</span>
                    </div>
                    {c.anuncio?.titulo && (
                      <p className="text-[11px] text-gray-400 truncate">sobre {c.anuncio.titulo}</p>
                    )}
                    <p className={`text-xs truncate mt-0.5 ${c.naoLidas > 0 ? 'font-semibold text-grafite' : 'text-gray-400'}`}>
                      {c.ultimaMensagem || 'Conversa iniciada'}
                    </p>
                  </div>
                  {c.naoLidas > 0 && (
                    <span
                      className="flex-shrink-0 min-w-[20px] h-5 rounded-full text-white text-[11px] font-semibold flex items-center justify-center px-1.5"
                      style={{ backgroundColor: corPrimaria }}
                    >
                      {c.naoLidas}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className={`flex-1 flex-col ${conversaAtivaId ? 'flex' : 'hidden sm:flex'}`}>
        {!conversaAtivaId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <LuMessageSquare size={32} className="mb-2 opacity-40" />
            <p className="text-sm font-semibold">Selecione uma conversa</p>
            <p className="text-xs mt-1">Escolha uma conversa na lista para ver as mensagens.</p>
          </div>
        ) : (
          <>
            <div className="flex h-16 flex-shrink-0 items-center gap-3 border-b border-gray-200 px-3 sm:px-5">
              <button
                onClick={() => setConversaAtivaId(null)}
                className="sm:hidden text-gray-400 hover:text-grafite cursor-pointer"
              >
                <LuArrowLeft size={18} />
              </button>
              {outroParticipante?.avatar ? (
                <img
                  src={outroParticipante.avatar}
                  alt={outroParticipante.nome}
                  onClick={() => outroParticipante?._id && navigate(`/usuario/${outroParticipante._id}`)}
                  className="w-9 h-9 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                />
              ) : (
                <div
                  onClick={() => outroParticipante?._id && navigate(`/usuario/${outroParticipante._id}`)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: corPrimaria }}
                >
                  {outroParticipante?.nome?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div
                className="min-w-0 cursor-pointer"
                onClick={() => outroParticipante?._id && navigate(`/usuario/${outroParticipante._id}`)}
              >
                <p className="font-semibold text-sm text-grafite truncate hover:text-verde-agua transition-colors">{outroParticipante?.nome || 'Usuário removido'}</p>
                {conversaAtiva?.anuncio?.titulo && (
                  <p className="text-[11px] text-gray-400 truncate">sobre {conversaAtiva.anuncio.titulo}</p>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto bg-white p-3 sm:p-5">
              {mensagens.length === 0 ? (
                <p className="text-center text-xs text-gray-400 mt-4">Nenhuma mensagem ainda. Diga olá.</p>
              ) : (
                mensagens.map((m, index) => {
                  const minha = m.remetente?._id === usuarioLogadoId;
                  const dataAtual = new Date(m.createdAt).toDateString();
                  const dataAnterior = index > 0 ? new Date(mensagens[index - 1].createdAt).toDateString() : null;
                  const mostrarDivisorData = dataAtual !== dataAnterior;

                  return (
                    <Fragment key={m._id}>
                      {mostrarDivisorData && (
                        <div className="flex justify-center my-2">
                          <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                            {formatarDivisorData(m.createdAt)}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${minha ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            minha ? 'text-white rounded-br-sm' : 'bg-white border border-gray-200 text-grafite rounded-bl-sm'
                          }`}
                          style={minha ? { backgroundColor: corPrimaria } : {}}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.texto}</p>
                          <p className={`text-[10px] mt-1 ${minha ? 'text-white/70' : 'text-gray-400'}`}>{formatarHora(m.createdAt)}</p>
                        </div>
                      </div>
                    </Fragment>
                  );
                })
              )}
              <div ref={fimDaListaRef} />
            </div>

            <form onSubmit={handleEnviarMensagem} className="flex flex-shrink-0 items-center gap-2 border-t border-gray-200 p-3 sm:gap-3 sm:p-4">
              <input
                value={textoNovaMensagem}
                onChange={(e) => setTextoNovaMensagem(e.target.value)}
                placeholder="Escreva uma mensagem..."
                className="flex-1 px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-azul-oceano/20 focus:border-azul-oceano transition-colors"
              />
              <button
                type="submit"
                disabled={!textoNovaMensagem.trim() || enviando}
                className="w-11 h-11 flex-shrink-0 rounded-lg flex items-center justify-center text-white transition-opacity cursor-pointer disabled:opacity-40"
                style={{ backgroundColor: corPrimaria }}
              >
                <LuSend size={18} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
