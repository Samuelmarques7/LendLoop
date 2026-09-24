import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuBell, LuTrash2, LuCheck, LuCheckCheck } from 'react-icons/lu';
import { apiRequest } from '../services/api';

const ICONE_POR_TIPO = {
  mensagem: '💬',
  solicitacao: '📩',
  status_aluguel: '📦',
  pagamento: '💳',
  avaliacao: '⭐',
};

function tempoRelativo(data) {
  const diffMs = Date.now() - new Date(data).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min}min`;
  const horas = Math.floor(min / 60);
  if (horas < 24) return `${horas}h`;
  const dias = Math.floor(horas / 24);
  return `${dias}d`;
}

export function NotificacaoSino({ variant = 'standard' }) {
  const navigate = useNavigate();
  const dadosUsuario = JSON.parse(localStorage.getItem('dadosUsuario') || 'null');
  const usuarioId = dadosUsuario?.id;

  const [aberto, setAberto] = useState(false);
  const [notificacoes, setNotificacoes] = useState([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const containerRef = useRef(null);

  // Fecha o painel ao clicar fora
  useEffect(() => {
    function aoClicarFora(evento) {
      if (containerRef.current && !containerRef.current.contains(evento.target)) {
        setAberto(false);
      }
    }
    document.addEventListener('mousedown', aoClicarFora);
    return () => document.removeEventListener('mousedown', aoClicarFora);
  }, []);

  // Busca a contagem de não lidas periodicamente (mesmo padrão usado para mensagens não lidas)
  useEffect(() => {
    if (!usuarioId) return;

    async function buscarContagem() {
      try {
        const dados = await apiRequest(`/api/notificacoes/${usuarioId}/contagem`);
        setNaoLidas(dados.total);
      } catch {
        // silencioso: badge não é crítico
      }
    }

    buscarContagem();
    const intervalo = setInterval(buscarContagem, 15000);
    return () => clearInterval(intervalo);
  }, [usuarioId]);

  // Busca a lista completa só quando o painel é aberto
  useEffect(() => {
    if (!aberto || !usuarioId) return;

    async function buscarNotificacoes() {
      try {
        const dados = await apiRequest(`/api/notificacoes/${usuarioId}`);
        setNotificacoes(dados);
      } catch {
        // silencioso
      }
    }

    buscarNotificacoes();
  }, [aberto, usuarioId]);

  async function marcarComoLida(id) {
    setNotificacoes((atual) => atual.map((n) => (n._id === id ? { ...n, lida: true } : n)));
    setNaoLidas((atual) => Math.max(0, atual - 1));
    try {
      await apiRequest(`/api/notificacoes/${id}/lida`, { method: 'PATCH' });
    } catch {
      // já atualizou localmente; próxima sincronização corrige se necessário
    }
  }

  async function marcarTodasComoLidas() {
    setNotificacoes((atual) => atual.map((n) => ({ ...n, lida: true })));
    setNaoLidas(0);
    try {
      await apiRequest(`/api/notificacoes/${usuarioId}/marcar-todas-lidas`, { method: 'PATCH' });
    } catch {
      // silencioso
    }
  }

  async function excluirNotificacao(evento, id, estavaLida) {
    evento.stopPropagation();
    setNotificacoes((atual) => atual.filter((n) => n._id !== id));
    if (!estavaLida) setNaoLidas((atual) => Math.max(0, atual - 1));
    try {
      await apiRequest(`/api/notificacoes/${id}`, { method: 'DELETE' });
    } catch {
      // silencioso
    }
  }

  function abrirNotificacao(notificacao) {
    if (!notificacao.lida) marcarComoLida(notificacao._id);

    // Se a notificação não tem um painel fixo (ex: mensagem), decide com
    // base no próprio objetivo do usuário logado, igual ao Header já faz.
    const linkPainel =
      notificacao.linkPainel ||
      (dadosUsuario?.objetivo === 'locador' ? '/painelLocador' : '/painellocatario');

    setAberto(false);
    navigate(linkPainel, { state: notificacao.estadoNavegacao || {} });
  }

  if (!usuarioId) return null;

  const estilosBotao = {
    hero: 'border border-verde-agua/75 bg-verde-agua/15 text-white shadow-[0_0_0_3px_rgba(46,195,77,0.12)] hover:bg-verde-agua hover:text-white',
    locatario: 'border border-white/25 bg-white/10 text-white hover:bg-white/20',
    locador: 'border border-white/25 bg-white/10 text-white hover:bg-white/20',
    standard: 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-verde-agua',
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setAberto((v) => !v)}
        title="Notificações"
        className={`relative rounded-full p-2.5 transition-colors cursor-pointer ${estilosBotao[variant] || estilosBotao.standard}`}
      >
        <LuBell size={18} />
        {naoLidas > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div className="fixed inset-x-4 top-[4.75rem] z-[60] flex max-h-[calc(100dvh-6rem)] w-auto flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:max-h-[28rem] sm:w-[calc(100vw-2rem)] sm:max-w-80">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-verde-escuro">Notificações</span>
            {naoLidas > 0 && (
              <button
                onClick={marcarTodasComoLidas}
                className="flex items-center gap-1 text-xs font-semibold text-azul-oceano hover:text-verde-agua transition-colors cursor-pointer"
              >
                <LuCheckCheck size={14} /> Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="overflow-y-auto">
            {notificacoes.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">
                Nenhuma notificação por aqui.
              </div>
            ) : (
              notificacoes.map((n) => (
                <div
                  key={n._id}
                  onClick={() => abrirNotificacao(n)}
                  className={`group flex gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 ${
                    !n.lida ? 'bg-azul-oceano/5' : ''
                  }`}
                >
                  <div className="text-lg leading-none mt-0.5">
                    {ICONE_POR_TIPO[n.tipo] || '🔔'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {!n.lida && <span className="w-2 h-2 rounded-full bg-azul-oceano shrink-0" />}
                      <p className={`text-sm truncate ${!n.lida ? 'font-semibold text-verde-escuro' : 'font-medium text-gray-600'}`}>
                        {n.titulo}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{n.texto}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{tempoRelativo(n.createdAt)}</p>
                  </div>

                  <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {!n.lida && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          marcarComoLida(n._id);
                        }}
                        title="Marcar como lida"
                        className="p-1 rounded-full text-gray-400 hover:text-verde-agua hover:bg-gray-100 cursor-pointer"
                      >
                        <LuCheck size={14} />
                      </button>
                    )}
                    <button
                      onClick={(e) => excluirNotificacao(e, n._id, n.lida)}
                      title="Excluir notificação"
                      className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-100 cursor-pointer"
                    >
                      <LuTrash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
