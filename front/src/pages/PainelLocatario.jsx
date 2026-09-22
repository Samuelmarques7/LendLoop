import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiRequest } from '../services/api';
import logo from '../assets/logo.png';
import { BotaoAvaliar } from '../components/BotaoAvaliar';
import { PainelMensagens } from '../components/PainelMensagens';
import { NotificacaoSino } from '../components/NotificacaoSino';
import { useNotificacao } from '../context/NotificacaoContext';
import { useConfirmacao } from '../context/ConfirmacaoContext';
import { VistoriaFotos } from '../components/VistoriaFotos';

import {
  LuLayoutDashboard,
  LuPackage,
  LuSend,
  LuWallet,
  LuMessageSquare,
  LuSettings,
  LuCalendar,
  LuMailWarning,
  LuX,
  LuCircleCheckBig,
  LuTrash2,
  LuShieldCheck,
  LuTriangleAlert,
  LuClock
} from "react-icons/lu";

export default function PainelLocatario() {
  const [activeTab, setActiveTab] = useState('painel');
  const navigate = useNavigate();
  const location = useLocation();

  const usuarioLogado = JSON.parse(localStorage.getItem('dadosUsuario'));
  const { notificar } = useNotificacao();
  const confirmar = useConfirmacao();

  const [dadosLocatario, setDadosLocatario] = useState(null);

  const [abaAlugueis, setAbaAlugueis] = useState('andamento');
  const [abaPagamentos, setAbaPagamentos] = useState('pendentes');

  const [todosAlugueis, setTodosAlugueis] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);
  const [mensagensNaoLidas, setMensagensNaoLidas] = useState(0);

  const [aluguelSelecionado, setAluguelSelecionado] = useState(null);
  const [avaliacoesFeitas, setAvaliacoesFeitas] = useState({});
  const [conversaParaAbrir, setConversaParaAbrir] = useState(location.state?.abrirConversa || null);
  const [enviandoVistoria, setEnviandoVistoria] = useState(false);

  useEffect(() => {
    document.title = 'Painel Locatário';
    return () => {
      document.title = 'LendLoop';
    };
  }, []);

  useEffect(() => {
    if (usuarioLogado?.objetivo === 'locador') {
      navigate('/painelLocador', { replace: true });
    }
  }, []);

  useEffect(() => {
    if (location.state?.abrirConfig) {
      setActiveTab('config');
    }
    if (location.state?.abrirConversa) {
      setActiveTab('mensagens');
    }
    if (location.state?.abrirAba) {
      setActiveTab(location.state.abrirAba);
    }
  }, [location.state]);

  useEffect(() => {
    async function buscarDadosLocatario() {
      const dados = await apiRequest(`/api/usuarios/${usuarioLogado.id}`);
      setDadosLocatario(dados);
    }
    buscarDadosLocatario();
  }, []);

  useEffect(() => {
    async function buscarAlugueis() {
      const dados = await apiRequest(`/api/alugueis/locatario/${usuarioLogado.id}`);
      setTodosAlugueis(dados);
    }
    buscarAlugueis();
  }, []);

  useEffect(() => {
    async function buscarPagamentos() {
      const dados = await apiRequest(`/api/pagamentos/locatario/${usuarioLogado.id}`);
      setPagamentos(dados);
    }
    buscarPagamentos();
  }, []);

  useEffect(() => {
    async function buscarMensagensNaoLidas() {
      try {
        const dados = await apiRequest(`/api/mensagens/nao-lidas/${usuarioLogado.id}`);
        setMensagensNaoLidas(dados.total);
      } catch {
        // silencioso: badge de mensagens não é crítico
      }
    }
    buscarMensagensNaoLidas();
    const intervalo = setInterval(buscarMensagensNaoLidas, 15000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    const concluidos = todosAlugueis.filter(a => a.status === 'concluido');
    const pendentesVerificacao = concluidos.filter(a => !(a._id in avaliacoesFeitas));
    if (pendentesVerificacao.length === 0) return;

    let cancelado = false;
    Promise.all(
      pendentesVerificacao.map(async (a) => {
        try {
          const data = await apiRequest(`/api/avaliacoes/aluguel/${a._id}/autor/${usuarioLogado.id}`);
          return { id: a._id, avaliado: data.avaliado };
        } catch {
          return { id: a._id, avaliado: false };
        }
      })
    ).then((resultados) => {
      if (cancelado) return;
      setAvaliacoesFeitas(prev => {
        const atualizado = { ...prev };
        resultados.forEach(r => { atualizado[r.id] = r.avaliado; });
        return atualizado;
      });
    });

    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todosAlugueis]);

  function handleStatusAvaliacao(aluguelId, avaliado) {
    setAvaliacoesFeitas(prev => ({ ...prev, [aluguelId]: avaliado }));
  }

  const solicitacoesEnviadas = useMemo(
    () => todosAlugueis.filter(a => a.status === 'pendente'),
    [todosAlugueis]
  );

  const alugueis = useMemo(() => {
    const concluidos = todosAlugueis.filter(a => a.status === 'concluido');
    return {
      andamento: todosAlugueis.filter(a => a.status === 'aceito' || a.status === 'andamento' || a.status === 'aguardando_confirmacao'),
      pendente: todosAlugueis.filter(a => a.status === 'pendente'),
      avaliar: concluidos.filter(a => avaliacoesFeitas[a._id] !== true),
      concluido: concluidos.filter(a => avaliacoesFeitas[a._id] === true),
    };
  }, [todosAlugueis, avaliacoesFeitas]);

  const pagamentosPorAba = useMemo(() => ({
    pendentes: pagamentos.filter(p => p.status === 'pendente' || p.status === 'atrasado'),
    confirmados: pagamentos.filter(p => p.status === 'confirmado'),
  }), [pagamentos]);

  const stats = [
  { id: 1, titulo: "Próximos aluguéis", valor: String(alugueis.andamento.length), icon: LuCalendar, tone: 'accent' },
  { id: 2, titulo: "Solicitações pendentes", valor: String(solicitacoesEnviadas.length), icon: LuMailWarning, tone: 'warning' },
  { id: 3, titulo: "Pagamentos pendentes", valor: `R$ ${pagamentosPorAba.pendentes.reduce((soma, p) => soma + p.valor, 0).toFixed(2)}`, icon: LuWallet, tone: pagamentosPorAba.pendentes.some(p => p.status === 'atrasado') ? 'danger' : 'success' },
  { id: 4, titulo: "Mensagens não lidas", valor: String(mensagensNaoLidas), icon: LuMessageSquare, tone: 'neutral' }
];

const toneClasses = {
  accent: { bg: 'bg-[#0068F3]/[0.08]', text: 'text-[#0068F3]', border: 'border-l-[#0068F3]' },
  warning: { bg: 'bg-amber-500/[0.1]', text: 'text-amber-600', border: 'border-l-amber-500' },
  success: { bg: 'bg-[#0F6E56]/[0.08]', text: 'text-[#0F6E56]', border: 'border-l-[#0F6E56]' },
  danger: { bg: 'bg-[#A32D2D]/[0.08]', text: 'text-[#A32D2D]', border: 'border-l-[#A32D2D]' },
  neutral: { bg: 'bg-gray-900/[0.05]', text: 'text-gray-700', border: 'border-l-gray-300' },
};

  const menuItems = [
    { id: 'painel', label: 'Painel', icon: LuLayoutDashboard },
    { id: 'alugueis', label: 'Meus aluguéis', icon: LuPackage },
    { id: 'solicitacoes', label: 'Solicitações enviadas', icon: LuSend },
    { id: 'pagamentos', label: 'Pagamentos', icon: LuWallet },
    { id: 'mensagens', label: 'Mensagens', icon: LuMessageSquare },
  ];

  function handleMenuClick(item) {
    setActiveTab(item.id);
  }

  async function cancelarSolicitacao(id) {
    try {
      await apiRequest(`/api/alugueis/${id}/status`, {
        method: 'PATCH',
        body: { status: 'cancelado' }
      })
      setTodosAlugueis(prev => prev.filter(s => s._id !== id));
      notificar('Solicitação cancelada!', 'sucesso');
    } catch (e) {
      notificar(e.message, 'erro');
    }
  }

  async function pagarAgora(id) {
    try {
      await apiRequest(`/api/pagamentos/${id}/status`, {
        method: 'PATCH',
        body: { status: 'confirmado' }
      })
      setPagamentos(prev => prev.map(p => p._id === id ? { ...p, status: 'confirmado' } : p));
      notificar('Pagamento confirmardo com sucesso!', 'sucesso');
    } catch (e) {
      notificar(e.message, 'erro');
    }
  }

  async function solicitarDevolucao(id, arquivos) {
    setEnviandoVistoria(true);
    try {
      const formulario = new FormData();
      arquivos.forEach((arquivo) => formulario.append('fotos', arquivo));
      const vistoria = await apiRequest(`/api/alugueis/${id}/vistoria/devolucao`, {
        method: 'POST', body: formulario
      });
      await apiRequest(`/api/alugueis/${id}/status`, {
        method: 'PATCH',
        body: { status: 'aguardando_confirmacao' }
      });
      // A resposta de upload traz apenas os IDs de anúncio e locador. Mantém os
      // objetos populados já carregados para o modal não perder nome e avatar.
      const atualizarAluguel = (anterior) => ({
        ...anterior,
        ...vistoria.aluguel,
        anuncio: anterior.anuncio,
        locador: anterior.locador,
        status: 'aguardando_confirmacao'
      });
      setTodosAlugueis(prev => prev.map(a => a._id === id ? atualizarAluguel(a) : a));
      setAluguelSelecionado(prev => prev && prev._id === id ? atualizarAluguel(prev) : prev);
      notificar('Devolução solicitada! Aguarde a confirmação do locador.', 'sucesso');
      return true;
  } catch (e) {
    notificar(e.message, 'erro');
    return false;
  } finally {
    setEnviandoVistoria(false);
  }
  }

  function abrirDetalhesAluguel(aluguel) {
    setAluguelSelecionado(aluguel);
  }

  function fecharDetalhesAluguel() {
    setAluguelSelecionado(null);
  }

  function abrirChatComLocador(locadorId) {
    if (!locadorId) return;
    setConversaParaAbrir(locadorId);
    setActiveTab('mensagens');
    setAluguelSelecionado(null);
  }

  async function alterarObjetivo(novoObjetivo) {
    try {
      const data = await apiRequest(`/api/usuarios/${usuarioLogado.id}`, {
        method: 'PUT',
        body: { objetivo: novoObjetivo }
      });

      localStorage.setItem('dadosUsuario', JSON.stringify({ ...usuarioLogado, objetivo: data.usuario.objetivo }));
      setDadosLocatario(data.usuario);

      if (novoObjetivo === 'locador') {
        navigate('/painelLocador', { replace: true });
      }
    } catch (e) {
      notificar(e.message, 'erro')
    }
  }

  async function excluirConta() {
    const confirmado = await confirmar({
      titulo: 'Excluir conta',
      mensagem: 'Tem certeza que deeja excluir sua conta? Essa ação não pode ser desfeita.',
      textoConfirmar: 'Excluir conta',
      variante: 'perigo',
    });
    if (!confirmado) return;

    try {
      await apiRequest(`/api/usuarios/${usuarioLogado.id}`, {
        method: 'DELETE'
      });
      localStorage.removeItem('dadosUsuario');
      localStorage.removeItem('usuarioLogado');
      localStorage.removeItem('token');
      navigate('/login');
    } catch (e) {
      notificar(e.message, 'erro');
    }
  }

  function renderConteudo() {
    switch (activeTab) {
      case 'painel':
        return <SecaoPainel
          stats={stats}
          toneClasses={toneClasses}
          alugueis={alugueis}
          pagamentos={pagamentosPorAba}
          solicitacoesEnviadas={solicitacoesEnviadas}
          abaAlugueis={abaAlugueis}
          setAbaAlugueis={setAbaAlugueis}
          abaPagamentos={abaPagamentos}
          setAbaPagamentos={setAbaPagamentos}
          onCancelarSolicitacao={cancelarSolicitacao}
          onPagarAgora={pagarAgora}
          onAbrirDetalhes={abrirDetalhesAluguel}
          usuarioLogadoId={usuarioLogado?.id}
          onStatusAvaliacao={handleStatusAvaliacao}
        />;
      case 'alugueis':
        return <SecaoAlugueis alugueis={alugueis} abaAlugueis={abaAlugueis} setAbaAlugueis={setAbaAlugueis} onAbrirDetalhes={abrirDetalhesAluguel} usuarioLogadoId={usuarioLogado?.id} onStatusAvaliacao={handleStatusAvaliacao} />;
      case 'solicitacoes':
        return <SecaoSolicitacoesEnviadas solicitacoesEnviadas={solicitacoesEnviadas} onCancelarSolicitacao={cancelarSolicitacao} />;
      case 'pagamentos':
        return <SecaoPagamentos pagamentos={pagamentosPorAba} abaPagamentos={abaPagamentos} setAbaPagamentos={setAbaPagamentos} onPagarAgora={pagarAgora} />;
      case 'mensagens':
        return <PainelMensagens
          usuarioLogadoId={usuarioLogado?.id}
          corPrimaria="#0068F3"
          conversaParaAbrir={conversaParaAbrir}
          onConversasAtualizadas={setMensagensNaoLidas}
        />;
      case 'config':
        return <SecaoConfiguracoes
          objetivoAtual={usuarioLogado?.objetivo || 'ambos'}
          onAlterarObjetivo={alterarObjetivo}
          onExcluirConta={excluirConta}
        />;
      default:
        return (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
            <p className="font-semibold text-lg capitalize">{menuItems.find(i => i.id === activeTab)?.label}</p>
            <p className="text-sm mt-2">Conteúdo desta seção será implementado em breve.</p>
          </div>
        );
    }
  }

  const secaoAtual = menuItems.find(i => i.id === activeTab) || (activeTab === 'config' ? { label: 'Configurações' } : null);

  return (
    <div className="min-h-screen bg-[#FAFAF9] font-sans text-[#1A1A1A]">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="w-full h-19 flex items-center px-8 gap-8">
          <button onClick={() => navigate('/')} className="flex-shrink-0 cursor-pointer">
            <img src={logo} alt="LendLoop" className="h-16 w-auto" />
          </button>

          <nav className="flex-1 flex items-center gap-1 h-full overflow-x-auto">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item)}
                  className={`h-full flex items-center gap-2 px-4 text-[15px] font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                    isActive
                      ? 'border-[#1A1A1A] text-[#1A1A1A]'
                      : 'border-transparent text-gray-500 hover:text-[#1A1A1A]'
                  }`}
                >
                  <Icon size={20} className={isActive ? 'text-[#0068F3]' : 'text-gray-400'} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 flex-shrink-0">
            <NotificacaoSino />
            <button
              onClick={() => navigate('/configuracoes')}
              title="Configurações"
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-[#1A1A1A] transition-colors cursor-pointer"
            >
              <LuSettings size={22} />
            </button>

            <button
              onClick={() => navigate('/meu-perfil')}
              className="flex items-center gap-2.5 pl-3 ml-1 border-l border-gray-200 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center font-semibold text-sm overflow-hidden flex-shrink-0">
                {dadosLocatario?.avatar ? (
                  <img src={dadosLocatario.avatar} alt={dadosLocatario.nome} className="w-full h-full object-cover" />
                ) : (
                  dadosLocatario?.nome?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <div className="hidden lg:block text-left min-w-0">
                <p className="text-[14px] font-semibold text-[#1A1A1A] whitespace-nowrap leading-tight group-hover:text-[#0068F3] transition-colors">
                  {dadosLocatario?.nome ? dadosLocatario.nome.split(' ').slice(0, 2).join(' ') : 'Carregando...'}
                </p>
                <p className="text-[12px] text-gray-400 leading-tight">Locatário</p>
              </div>
            </button>
          </div>
        </div>
      </header>

      <main className="px-10 py-8 max-w-[1600px] mx-auto w-full space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A1A]">{secaoAtual?.label || 'Painel'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Acompanhe seus aluguéis, solicitações e pagamentos em um só lugar.</p>
        </div>
        {renderConteudo()}
      </main>

      <ModalDetalhesAluguel
        aluguel={aluguelSelecionado}
        onClose={fecharDetalhesAluguel}
        onSolicitarDevolucao={solicitarDevolucao}
        enviandoVistoria={enviandoVistoria}
        usuarioLogadoId={usuarioLogado?.id}
        onStatusAvaliacao={handleStatusAvaliacao}
        onAbrirChat={abrirChatComLocador}
      />
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    andamento: { label: 'Em andamento', dot: 'bg-[#0F6E56]', text: 'text-[#0F6E56]', bg: 'bg-[#0F6E56]/[0.08]' },
    aceito: { label: 'Em andamento', dot: 'bg-[#0F6E56]', text: 'text-[#0F6E56]', bg: 'bg-[#0F6E56]/[0.08]' },
    aguardando_confirmacao: { label: 'Aguardando confirmação', dot: 'bg-[#0068F3]', text: 'text-[#0068F3]', bg: 'bg-[#0068F3]/[0.08]' },
    concluido: { label: 'Concluído', dot: 'bg-gray-400', text: 'text-gray-600', bg: 'bg-gray-100' },
    pendente: { label: 'Pendente', dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-500/[0.1]' },
  };
  const s = map[status] || map.pendente;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
      {s.label}
    </span>
  );
}

function AbaFiltro({ abas, atual, onChange }) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
      {abas.map((aba) => (
        <button
          key={aba.key}
          onClick={() => onChange(aba.key)}
          className={`relative px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all cursor-pointer ${
            atual === aba.key
              ? 'bg-white text-[#1A1A1A] shadow-sm'
              : 'text-gray-500 hover:text-[#1A1A1A]'
          }`}
        >
          {aba.label}
          {aba.badge > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#0068F3] text-white text-[10px] font-bold flex items-center justify-center">
              {aba.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function EstadoVazio({ texto }) {
  return (
    <div className="py-12 text-center text-gray-400">
      <LuCircleCheckBig size={28} className="mx-auto mb-2.5 opacity-40" />
      <p className="text-sm font-medium">{texto}</p>
    </div>
  );
}

function ListaAlugueis({ alugueis, aba, usuarioLogadoId, onAbrirDetalhes, onStatusAvaliacao }) {
  if (alugueis.length === 0) {
    return <EstadoVazio texto={aba === 'avaliar' ? 'Nenhuma avaliação pendente no momento' : 'Nenhum aluguel nesta categoria'} />;
  }

  return alugueis.map((aluguel) => (
    <div
      key={aluguel._id}
      onClick={() => onAbrirDetalhes(aluguel)}
      className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 rounded-xl transition-colors border-b border-gray-100 last:border-0 cursor-pointer"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        {aluguel.anuncio?.fotos?.[0] ? (
          <img src={aluguel.anuncio.fotos[0]} alt={aluguel.anuncio.titulo} className="w-11 h-11 rounded-lg object-cover flex-shrink-0 border border-gray-200" />
        ) : (
          <div className="w-11 h-11 bg-gray-100 rounded-lg flex-shrink-0 border border-gray-200"></div>
        )}
        <div className="min-w-0">
          <h3 className="font-semibold text-[#1A1A1A] text-sm truncate">{aluguel.anuncio?.titulo}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(aluguel.dataInicio).toLocaleDateString('pt-BR')} – {new Date(aluguel.dataFim).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <StatusPill status={aba === 'avaliar' ? 'concluido' : aluguel.status} />
        <span className="font-semibold text-[#1A1A1A] text-sm w-16 text-right tabular-nums">R$ {aluguel.precoTotal}</span>
        {aba === 'avaliar' && aluguel.locador && (
          <div onClick={(e) => e.stopPropagation()}>
            <BotaoAvaliar
              aluguelId={aluguel._id}
              autorId={usuarioLogadoId}
              nomeAvaliado={aluguel.locador.nome}
              onStatusChange={onStatusAvaliacao}
            />
          </div>
        )}
      </div>
    </div>
  ));
}

function CardSecao({ titulo, acao, children }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
      <div className="px-6 py-4.5 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-[15px] font-semibold text-[#1A1A1A]">{titulo}</h2>
        {acao}
      </div>
      <div className="p-2">
        {children}
      </div>
    </section>
  );
}

function SecaoAlugueis({ alugueis, abaAlugueis, setAbaAlugueis, onAbrirDetalhes, usuarioLogadoId, onStatusAvaliacao }) {
  return (
    <CardSecao
      titulo="Meus aluguéis"
      acao={
        <AbaFiltro
          abas={[
            { key: 'andamento', label: 'Em andamento' },
            { key: 'pendente', label: 'Pendente' },
            { key: 'avaliar', label: 'Aguardando avaliação', badge: alugueis.avaliar.length },
            { key: 'concluido', label: 'Concluído' }
          ]}
          atual={abaAlugueis}
          onChange={setAbaAlugueis}
        />
      }
    >
      <ListaAlugueis alugueis={alugueis[abaAlugueis]} aba={abaAlugueis} usuarioLogadoId={usuarioLogadoId} onAbrirDetalhes={onAbrirDetalhes} onStatusAvaliacao={onStatusAvaliacao} />
    </CardSecao>
  );
}

function CardSolicitacao({ solicitacao, onCancelarSolicitacao }) {
  return (
    <div className="p-4 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100 mb-2 last:mb-0">
      <div className="flex justify-between items-start mb-3 gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-[#1A1A1A] text-sm truncate">{solicitacao.anuncio?.titulo || 'Anúncio indisponível'}</h3>
          <p className="text-xs text-gray-400 mt-1">
            Início em {new Date(solicitacao.dataInicio).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <StatusPill status="pendente" />
      </div>
      <button
        onClick={() => onCancelarSolicitacao(solicitacao._id)}
        className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-600 text-xs font-semibold py-2.5 rounded-lg hover:bg-red-50 hover:text-[#A32D2D] hover:border-red-200 transition-colors cursor-pointer"
      >
        <LuX size={14} /> Cancelar solicitação
      </button>
    </div>
  );
}

function SecaoSolicitacoesEnviadas({ solicitacoesEnviadas, onCancelarSolicitacao }) {
  return (
    <CardSecao titulo="Solicitações enviadas">
      {solicitacoesEnviadas.length === 0 ? (
        <EstadoVazio texto="Nenhuma solicitação enviada" />
      ) : (
        solicitacoesEnviadas.map((solicitacao) => (
          <CardSolicitacao key={solicitacao._id} solicitacao={solicitacao} onCancelarSolicitacao={onCancelarSolicitacao} />
        ))
      )}
    </CardSecao>
  );
}

function LinhaPagamento({ pagamento, abaPagamentos, onPagarAgora }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 rounded-xl transition-colors border-b border-gray-100 last:border-0">
      <div className="min-w-0">
        <h3 className="font-semibold text-[#1A1A1A] text-sm truncate">{pagamento.aluguel?.anuncio?.titulo || 'Aluguel'}</h3>
        <p className="text-xs text-gray-400 mt-0.5">Vencimento em {new Date(pagamento.vencimento).toLocaleDateString('pt-BR')}</p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {pagamento.status === 'atrasado' && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#A32D2D] bg-red-50 px-2.5 py-1 rounded-full">
            <LuTriangleAlert size={12} /> Em atraso
          </span>
        )}

        <span className="font-semibold text-[#1A1A1A] text-sm tabular-nums">R$ {pagamento.valor}</span>

        {abaPagamentos === 'pendentes' && (
          <button
            onClick={() => onPagarAgora(pagamento._id)}
            className="bg-[#1A1A1A] text-white text-[11px] font-semibold px-3.5 py-2 rounded-lg hover:bg-[#0068F3] transition-colors cursor-pointer"
          >
            Pagar agora
          </button>
        )}
      </div>
    </div>
  );
}

function SecaoPagamentos({ pagamentos, abaPagamentos, setAbaPagamentos, onPagarAgora }) {
  return (
    <CardSecao
      titulo="Pagamentos"
      acao={
        <AbaFiltro
          abas={[
            { key: 'pendentes', label: 'Pendentes' },
            { key: 'confirmados', label: 'Confirmados' }
          ]}
          atual={abaPagamentos}
          onChange={setAbaPagamentos}
        />
      }
    >
      {pagamentos[abaPagamentos].length === 0 ? (
        <EstadoVazio texto="Nenhum pagamento nesta categoria" />
      ) : (
        pagamentos[abaPagamentos].map((pagamento) => (
          <LinhaPagamento key={pagamento._id} pagamento={pagamento} abaPagamentos={abaPagamentos} onPagarAgora={onPagarAgora} />
        ))
      )}
    </CardSecao>
  );
}

function SecaoPainel({ stats, toneClasses, alugueis, pagamentos, solicitacoesEnviadas, abaAlugueis, setAbaAlugueis, abaPagamentos, setAbaPagamentos, onCancelarSolicitacao, onPagarAgora, onAbrirDetalhes, usuarioLogadoId, onStatusAvaliacao }) {
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const tone = toneClasses[stat.tone];
          return (
            <div key={stat.id} className={`bg-white p-5 rounded-2xl border border-gray-200 border-l-4 ${tone.border} flex items-center gap-4`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tone.bg} ${tone.text} flex-shrink-0`}>
                <Icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5 truncate">{stat.titulo}</p>
                <p className="text-xl font-semibold text-[#1A1A1A] tabular-nums">{stat.valor}</p>
              </div>
            </div>
          );
        })}
      </section>

      <SecaoAlugueis alugueis={alugueis} abaAlugueis={abaAlugueis} setAbaAlugueis={setAbaAlugueis} onAbrirDetalhes={onAbrirDetalhes} usuarioLogadoId={usuarioLogadoId} onStatusAvaliacao={onStatusAvaliacao} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SecaoSolicitacoesEnviadas solicitacoesEnviadas={solicitacoesEnviadas} onCancelarSolicitacao={onCancelarSolicitacao} />
        <SecaoPagamentos pagamentos={pagamentos} abaPagamentos={abaPagamentos} setAbaPagamentos={setAbaPagamentos} onPagarAgora={onPagarAgora} />
      </div>
    </div>
  );
}

function ModalDetalhesAluguel({ aluguel, onClose, onSolicitarDevolucao, enviandoVistoria, usuarioLogadoId, onStatusAvaliacao, onAbrirChat }) {
  const navigate = useNavigate();
  const [mostrarVistoria, setMostrarVistoria] = useState(false);
  if (!aluguel) return null;

  const locador = aluguel.locador;
  const primeiroNome = locador?.nome?.split(' ')[0] || 'locador';
  const podeSolicitarDevolucao = aluguel.status === 'aceito' || aluguel.status === 'andamento';
  const aguardandoConfirmacao = aluguel.status === 'aguardando_confirmacao';
  const concluido = aluguel.status === 'concluido';

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4 gap-3">
          <h2 className="text-lg font-semibold text-[#1A1A1A] leading-tight">{aluguel.anuncio?.titulo || 'Aluguel'}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1A1A1A] transition-colors cursor-pointer flex-shrink-0"
          >
            <LuX size={20} />
          </button>
        </div>

        {aluguel.anuncio?.fotos?.[0] && (
          <img
            src={aluguel.anuncio.fotos[0]}
            alt={aluguel.anuncio.titulo}
            className="w-full h-40 object-cover rounded-xl mb-5 border border-gray-200"
          />
        )}

        {locador && (
          <div
            onClick={() => locador?._id && navigate(`/usuario/${locador._id}`)}
            className="flex items-center gap-3 p-3.5 rounded-xl bg-[#FAFAF9] border border-gray-100 mb-5 cursor-pointer hover:border-[#0068F3]/30 transition-colors"
          >
            {locador?.avatar ? (
              <img src={locador.avatar} alt={locador.nome} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#0068F3] text-white flex items-center justify-center font-semibold flex-shrink-0">
                {locador?.nome?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-sm text-[#1A1A1A] truncate">{locador?.nome || 'Locador'}</p>
              {locador?.email && <p className="text-xs text-gray-500 truncate">{locador.email}</p>}
            </div>
          </div>
        )}

        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Alugado em</span>
            <span className="font-semibold text-[#1A1A1A]">{new Date(aluguel.dataInicio).toLocaleDateString('pt-BR')}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Devolução prevista</span>
            <span className="font-semibold text-[#1A1A1A]">{new Date(aluguel.dataFim).toLocaleDateString('pt-BR')}</span>
          </div>
          {aluguel.horarioRetirada && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Horário de retirada</span>
              <span className="font-semibold text-[#1A1A1A]">{aluguel.horarioRetirada}</span>
            </div>
          )}
          {aluguel.horarioDevolucao && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Horário de devolução</span>
              <span className="font-semibold text-[#1A1A1A]">{aluguel.horarioDevolucao}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Valor total</span>
            <span className="font-semibold text-[#1A1A1A] tabular-nums">R$ {aluguel.precoTotal}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Status</span>
            <StatusPill status={aluguel.status} />
          </div>
        </div>

        {podeSolicitarDevolucao && (
          <button
            onClick={() => onAbrirChat?.(locador?._id)}
            disabled={!locador?._id}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-gray-200 text-[#1A1A1A] text-xs font-semibold hover:border-[#0068F3] hover:text-[#0068F3] transition-colors cursor-pointer disabled:opacity-40 mb-3"
          >
            <LuMessageSquare size={15} /> Conversar com {primeiroNome}
          </button>
        )}

        {podeSolicitarDevolucao && (
          <button
            onClick={() => setMostrarVistoria(true)}
            className="w-full bg-[#1A1A1A] text-white text-sm font-semibold py-3 rounded-lg hover:bg-[#0068F3] transition-colors cursor-pointer"
          >
            Registrar devolução com fotos
          </button>
        )}

        {mostrarVistoria && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={() => !enviandoVistoria && setMostrarVistoria(false)}>
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="mb-5 flex items-start justify-between gap-3">
                <div><h3 className="text-lg font-bold text-[#1A1A1A]">Vistoria de devolução</h3><p className="mt-1 text-sm text-gray-500">{aluguel.anuncio?.titulo}</p></div>
                <button onClick={() => setMostrarVistoria(false)} className="text-gray-400 hover:text-gray-800" aria-label="Fechar"><LuX size={20} /></button>
              </div>
              <VistoriaFotos
                titulo="Mostre como o item está sendo devolvido"
                descricao="Fotografe os mesmos detalhes da retirada, incluindo acessórios. O locador poderá comparar os registros antes de confirmar o recebimento."
                onEnviar={async (arquivos) => { if (await onSolicitarDevolucao(aluguel._id, arquivos)) setMostrarVistoria(false); }}
                enviando={enviandoVistoria}
              />
            </div>
          </div>
        )}

        {aguardandoConfirmacao && (
          <div className="flex items-center gap-2 justify-center text-[#0068F3] bg-[#0068F3]/[0.08] text-sm font-semibold py-3 rounded-lg">
            <LuClock size={16} /> Aguardando confirmação do locador
          </div>
        )}

        {concluido && aluguel.locador && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-gray-500">Devolução confirmada pelo locador. Que tal avaliar a experiência?</p>
            <BotaoAvaliar
              aluguelId={aluguel._id}
              autorId={usuarioLogadoId}
              nomeAvaliado={aluguel.locador.nome}
              onStatusChange={onStatusAvaliacao}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function SecaoConfiguracoes({ objetivoAtual, onAlterarObjetivo, onExcluirConta }) {
  const [salvandoObjetivo, setSalvandoObjetivo] = useState(false);

  async function handleAlterarObjetivo(valor) {
    if (valor === objetivoAtual) return;
    setSalvandoObjetivo(true);
    await onAlterarObjetivo(valor);
    setSalvandoObjetivo(false);
  }

  const opcoesObjetivo = [
    { valor: 'ambos', titulo: 'Ambos', descricao: 'Quero alugar e também disponibilizar meus itens' },
    { valor: 'locatario', titulo: 'Apenas alugar', descricao: 'Quero procurar itens para pegar emprestado' },
    { valor: 'locador', titulo: 'Apenas disponibilizar', descricao: 'Quero colocar meus itens na plataforma para render uma grana' },
  ];

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4.5 border-b border-gray-100">
          <h2 className="text-[15px] font-semibold text-[#1A1A1A]">Tipo de conta</h2>
          <p className="text-xs text-gray-500 mt-1">Mudou de ideia? Ajuste aqui o que você quer fazer no LendLoop.</p>
        </div>
        <div className="p-6 space-y-3">
          {opcoesObjetivo.map((op) => (
            <div
              key={op.valor}
              onClick={() => handleAlterarObjetivo(op.valor)}
              className={`p-4 border rounded-xl cursor-pointer transition-all ${
                objetivoAtual === op.valor
                  ? 'border-[#0068F3] bg-[#0068F3]/[0.04] ring-1 ring-[#0068F3]'
                  : 'border-gray-200 hover:border-gray-300'
              } ${salvandoObjetivo ? 'opacity-60 pointer-events-none' : ''}`}
            >
              <span className={`block text-sm font-semibold ${objetivoAtual === op.valor ? 'text-[#0068F3]' : 'text-[#1A1A1A]'}`}>
                {op.titulo}
              </span>
              <span className="block text-xs text-gray-500 mt-0.5">{op.descricao}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-red-100 overflow-hidden">
        <div className="px-6 py-4.5 border-b border-red-100">
          <h2 className="text-[15px] font-semibold text-[#A32D2D]">Zona de perigo</h2>
        </div>
        <div className="p-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A]">Excluir minha conta</p>
            <p className="text-xs text-gray-500 mt-1">Essa ação é permanente e não pode ser desfeita.</p>
          </div>
          <button
            onClick={onExcluirConta}
            className="flex items-center gap-2 bg-white border border-red-200 text-[#A32D2D] text-xs font-semibold px-4 py-2.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer flex-shrink-0"
          >
            <LuTrash2 size={14} /> Excluir conta
          </button>
        </div>
      </section>
    </div>
  );
}
