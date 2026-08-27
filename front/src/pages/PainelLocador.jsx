import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiRequest } from '../services/api';
import logo from '../assets/logo.png';
import { BotaoAvaliar } from '../components/BotaoAvaliar';
import { PainelMensagens } from '../components/PainelMensagens';
import { NotificacaoSino } from '../components/NotificacaoSino';

import {
  LuLayoutDashboard,
  LuPackage,
  LuInbox,
  LuCalendar,
  LuDollarSign,
  LuMessageSquare,
  LuSettings,
  LuTrendingUp,
  LuMailWarning,
  LuCheck,
  LuX,
  LuPlus,
  LuPackageX,
  LuTrash2,
  LuPencil,
  LuWallet,
  LuClock,
  LuTriangleAlert,
  LuChevronLeft,
  LuChevronRight,
  LuUser,
  LuHistory,
  LuStar
} from "react-icons/lu";

const PAINEIS_DISPONIVEIS = [
  { id: 'painel', label: 'Painel Locador' },
  { id: 'anuncios', label: 'Meus anúncios' },
  { id: 'solicitacoes', label: 'Solicitações recebidas' },
  { id: 'calendario', label: 'Calendário' },
  { id: 'ganhos', label: 'Ganhos' },
  { id: 'mensagens', label: 'Mensagens' },
];

export default function PainelLocador() {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('painelPadrao') || 'painel');
  const navigate = useNavigate();
  const location = useLocation();

  const [alugueis, setAlugueis] = useState([]);
  const [meusAnuncios, setMeusAnuncios] = useState([]);
  const [dadosLocador, setDadosLocador] = useState(null);
  const [mensagensNaoLidas, setMensagensNaoLidas] = useState(0);

  const [anuncioParaEditar, setAnuncioParaEditar] = useState(null);
  const [anuncioParaExcluir, setAnuncioParaExcluir] = useState(null);
  const [reservaSelecionada, setReservaSelecionada] = useState(null);
  const [conversaParaAbrir, setConversaParaAbrir] = useState(location.state?.abrirConversa || null);

  const usuarioLogado = JSON.parse(localStorage.getItem('dadosUsuario'));

  useEffect(() => {
    document.title = 'Painel Locador';
    return () => {
      document.title = 'LendLoop';
    };
  }, []);

  useEffect(() => {
    if (usuarioLogado?.objetivo === 'locatario') {
      navigate('/painellocatario', { replace: true });
    }
  }, []);

  useEffect(() => {
    if (location.state?.abrirConfig) {
      setActiveTab('config');
    }
    if (location.state?.abrirConversa) {
      setActiveTab('mensagens');
      setConversaParaAbrir(location.state.abrirConversa);
    }
    if (location.state?.abrirAba) {
      setActiveTab(location.state.abrirAba);
    }
  }, [location.state]);

  useEffect(() => {
    async function buscarDadosLocador() {
      const dados = await apiRequest(`/api/usuarios/${usuarioLogado.id}`);
      setDadosLocador(dados);
    }
    buscarDadosLocador();
  }, []);

  useEffect(() => {
    async function buscarMeusAnuncios() {
      const dados = await apiRequest(`/api/anuncios/locador/${usuarioLogado.id}`);
      setMeusAnuncios(dados);
    }
    buscarMeusAnuncios();
  }, []);

  useEffect(() => {
    async function buscarAlugueis() {
      const dados = await apiRequest(`/api/alugueis/locador/${usuarioLogado.id}`);
      setAlugueis(dados);
    }
    buscarAlugueis();
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

  // --- FILTROS DE ALUGUÉIS ---
  const solicitacoesPendentes = useMemo(
    () => alugueis.filter(a => a.status === 'pendente'),
    [alugueis]
  );

  const devolucoesPendentes = useMemo(
    () => alugueis.filter(a => a.status === 'aguardando_confirmacao'),
    [alugueis]
  );

  const alugueisConcluidos = useMemo(
    () => alugueis.filter(a => a.status === 'concluido'),
    [alugueis]
  );

  const alugueisAndamento = useMemo(
    () => alugueis.filter(a => a.status === 'aceito' || a.status === 'andamento' || a.status === 'aguardando_confirmacao'),
    [alugueis]
  );

  // --- ESTATÍSTICAS ---
  const ganhosDoMes = useMemo(() => {
    const agora = new Date();
    return alugueisConcluidos
      .filter(a => {
        const data = new Date(a.dataFim);
        return data.getMonth() === agora.getMonth() && data.getFullYear() === agora.getFullYear();
      })
      .reduce((soma, a) => soma + (a.precoTotal - (a.taxaServico || 0)), 0);
  }, [alugueisConcluidos]);

  const ganhosTotais = useMemo(
    () => alugueisConcluidos.reduce((soma, a) => soma + (a.precoTotal - (a.taxaServico || 0)), 0),
    [alugueisConcluidos]
  );

  const aReceber = useMemo(
    () => alugueisAndamento.reduce((soma, a) => soma + (a.precoTotal - (a.taxaServico || 0)), 0),
    [alugueisAndamento]
  );

  const totalAcoesPendentes = solicitacoesPendentes.length + devolucoesPendentes.length;

  const stats = [
    { id: 1, titulo: "Ganhos este mês", valor: `R$ ${ganhosDoMes.toFixed(2)}`, icon: LuDollarSign, tone: 'success' },
    { id: 2, titulo: "Anúncios ativos", valor: String(meusAnuncios.length), icon: LuPackage, tone: 'neutral' },
    { id: 3, titulo: "Ações pendentes", valor: String(totalAcoesPendentes), icon: LuMailWarning, tone: 'warning' },
    { id: 4, titulo: "Mensagens não lidas", valor: String(mensagensNaoLidas), icon: LuMessageSquare, tone: 'accent' }
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
    { id: 'anuncios', label: 'Meus anúncios', icon: LuPackage },
    { id: 'solicitacoes', label: 'Solicitações recebidas', icon: LuInbox },
    { id: 'calendario', label: 'Calendário', icon: LuCalendar },
    { id: 'ganhos', label: 'Ganhos', icon: LuTrendingUp },
    { id: 'mensagens', label: 'Mensagens', icon: LuMessageSquare },
  ];

  function handleMenuClick(item) {
    setActiveTab(item.id);
  }

  // --- AÇÕES NOS ALUGUÉIS ---
  async function aceitarSolicitacao(id) {
    try {
      await apiRequest(`/api/alugueis/${id}/status`, {
        method: 'PATCH',
        body: { status: 'aceito' }
      });
      setAlugueis(prev => prev.map(a => a._id === id ? { ...a, status: 'aceito' } : a));
    } catch (e) {
      alert(e.message);
    }
  }

  async function recusarSolicitacao(id) {
    try {
      await apiRequest(`/api/alugueis/${id}/status`, {
        method: 'PATCH',
        body: { status: 'recusado' }
      });
      setAlugueis(prev => prev.map(a => a._id === id ? { ...a, status: 'recusado' } : a));
    } catch (e) {
      alert(e.message);
    }
  }

  async function marcarComoDevolvido(id) {
    try {
      await apiRequest(`/api/alugueis/${id}/status`, {
        method: 'PATCH',
        body: { status: 'concluido' }
      });
      setAlugueis(prev => prev.map(a => a._id === id ? { ...a, status: 'concluido' } : a));
    } catch (e) {
      alert(e.message);
    }
  }

  // --- AÇÕES NOS ANÚNCIOS ---
  async function confirmarExcluirAnuncio() {
    if (!anuncioParaExcluir) return;
    try {
      await apiRequest(`/api/anuncios/${anuncioParaExcluir._id}`, {
        method: 'DELETE'
      });
      setMeusAnuncios(prev => prev.filter(a => a._id !== anuncioParaExcluir._id));
      setAnuncioParaExcluir(null);
    } catch (e) {
      alert(e.message);
    }
  }

  async function salvarEdicaoAnuncio(anuncioEditado) {
    try {
      const res = await apiRequest(`/api/anuncios/${anuncioEditado._id}`, {
        method: 'PUT',
        body: anuncioEditado
      });
      const anuncioSalvo = res?.anuncio || anuncioEditado;
      setMeusAnuncios(prev => prev.map(a => a._id === anuncioSalvo._id ? { ...a, ...anuncioSalvo } : a));
      setAnuncioParaEditar(null);
    } catch (e) {
      alert(e.message);
    }
  }

  function abrirChatComLocatario(locatarioId) {
    if (!locatarioId) return;
    setConversaParaAbrir(locatarioId);
    setActiveTab('mensagens');
    setReservaSelecionada(null);
  }

  function salvarPainelPadrao(painelId) {
    localStorage.setItem('painelPadrao', painelId);
  }

  async function excluirConta() {
    const confirmar = window.confirm('Tem certeza que deseja excluir sua conta? Essa ação não pode ser desfeita.');
    if (!confirmar) return;

    try {
      await apiRequest(`/api/usuarios/${usuarioLogado.id}`, {
        method: 'DELETE'
      });
      localStorage.removeItem('dadosUsuario');
      navigate('/login');
    } catch (e) {
      alert(e.message);
    }
  }

  async function alterarObjetivo(novoObjetivo) {
    try {
      const data = await apiRequest(`/api/usuarios/${usuarioLogado.id}`, {
        method: 'PUT',
        body: { objetivo: novoObjetivo }
      });

      localStorage.setItem('dadosUsuario', JSON.stringify({ ...usuarioLogado, objetivo: data.usuario.objetivo }));
      setDadosLocador(data.usuario);

      if (novoObjetivo === 'locatario') {
        navigate('/painellocatario', { replace: true });
      }
    } catch (e) {
      alert(e.message);
    }
  }

  function renderConteudo() {
    switch (activeTab) {
      case 'painel':
        return <SecaoPainel
          stats={stats}
          toneClasses={toneClasses}
          meusAnuncios={meusAnuncios}
          solicitacoes={solicitacoesPendentes}
          devolucoes={devolucoesPendentes}
          onAceitar={aceitarSolicitacao}
          onRecusar={recusarSolicitacao}
          onConfirmarDevolucao={marcarComoDevolvido}
          onNovoAnuncio={() => navigate('/criar-anuncio')}
          onAbrirAnuncio={(id) => navigate(`/produto/${id}`)}
          onEditarAnuncio={(anuncio) => setAnuncioParaEditar(anuncio)}
          onPedirExcluirAnuncio={(anuncio) => setAnuncioParaExcluir(anuncio)}
        />;
      case 'anuncios':
        return <SecaoAnuncios
          meusAnuncios={meusAnuncios}
          onNovoAnuncio={() => navigate('/criar-anuncio')}
          onAbrirAnuncio={(id) => navigate(`/produto/${id}`)}
          onEditarAnuncio={(anuncio) => setAnuncioParaEditar(anuncio)}
          onPedirExcluirAnuncio={(anuncio) => setAnuncioParaExcluir(anuncio)}
        />;
      case 'solicitacoes':
        return (
          <div className="animate-fade-in">
            <SecaoSolicitacoes
              solicitacoes={solicitacoesPendentes}
              devolucoes={devolucoesPendentes}
              onAceitar={aceitarSolicitacao}
              onRecusar={recusarSolicitacao}
              onConfirmarDevolucao={marcarComoDevolvido}
            />
          </div>
        );
      case 'calendario':
        return <SecaoCalendario alugueis={alugueis} meusAnuncios={meusAnuncios} onAbrirDetalhes={setReservaSelecionada} />;
      case 'ganhos':
        return (
          <SecaoGanhos
            ganhosTotais={ganhosTotais}
            ganhosDoMes={ganhosDoMes}
            aReceber={aReceber}
            alugueisConcluidos={alugueisConcluidos}
            alugueisAndamento={alugueisAndamento}
            onMarcarDevolvido={marcarComoDevolvido}
            usuarioLogadoId={usuarioLogado?.id}
          />
        );
      case 'mensagens':
        return <PainelMensagens
          usuarioLogadoId={usuarioLogado?.id}
          corPrimaria="#29C354"
          conversaParaAbrir={conversaParaAbrir}
          onConversasAtualizadas={setMensagensNaoLidas}
        />;
      case 'config':
        return <SecaoConfiguracoes
          objetivoAtual={usuarioLogado?.objetivo || 'ambos'}
          onAlterarObjetivo={alterarObjetivo}
          onSalvarPainelPadrao={salvarPainelPadrao}
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
                  <Icon size={20} className={isActive ? 'text-[#29C354]' : 'text-gray-400'} />
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
                {dadosLocador?.avatar ? (
                  <img src={dadosLocador.avatar} alt={dadosLocador.nome} className="w-full h-full object-cover" />
                ) : (
                  dadosLocador?.nome?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <div className="hidden lg:block text-left min-w-0">
                <p className="text-[14px] font-semibold text-[#1A1A1A] whitespace-nowrap leading-tight group-hover:text-[#0068F3] transition-colors">
                  {dadosLocador?.nome ? dadosLocador.nome.split(' ').slice(0, 2).join(' ') : 'Carregando...'}
                </p>
                <p className="text-[12px] text-gray-400 leading-tight">Locador</p>
              </div>
            </button>
          </div>
        </div>
      </header>

      <main className="px-10 py-8 max-w-[1600px] mx-auto w-full space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A1A]">{secaoAtual?.label || 'Painel'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gerencie seus anúncios, solicitações, reservas e ganhos em um só lugar.</p>
        </div>
        {renderConteudo()}
      </main>

      <ModalEditarAnuncio
        anuncio={anuncioParaEditar}
        onClose={() => setAnuncioParaEditar(null)}
        onSalvar={salvarEdicaoAnuncio}
      />

      <ModalConfirmarExclusao
        anuncio={anuncioParaExcluir}
        onClose={() => setAnuncioParaExcluir(null)}
        onConfirmar={confirmarExcluirAnuncio}
      />

      <ModalDetalhesReserva
        reserva={reservaSelecionada}
        onClose={() => setReservaSelecionada(null)}
        onAbrirChat={abrirChatComLocatario}
      />
    </div>
  );
}

// ---------------- COMPONENTES DAS SEÇÕES ----------------

function CardAnuncio({ anuncio, onAbrirAnuncio, onEditarAnuncio, onPedirExcluirAnuncio }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 rounded-xl transition-colors border-b border-gray-100 last:border-0 group">
      <div
        onClick={() => onAbrirAnuncio(anuncio._id)}
        className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
      >
        {anuncio.fotos && anuncio.fotos.length > 0 ? (
          <img src={anuncio.fotos[0]} alt={anuncio.titulo} className="w-11 h-11 rounded-lg object-cover flex-shrink-0 border border-gray-200" />
        ) : (
          <div className="w-11 h-11 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center border border-gray-200">
            <LuPackageX size={18} className="text-gray-400" />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-semibold text-[#1A1A1A] text-sm truncate group-hover:text-[#0068F3] transition-colors">{anuncio.titulo}</h3>
          <p className="text-xs text-gray-400 mt-0.5">R$ {anuncio.precos?.precoPorDia}/dia</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
          anuncio.status === 'publicado' ? 'bg-[#0F6E56]/[0.08] text-[#0F6E56]' : 'bg-gray-100 text-gray-600'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${anuncio.status === 'publicado' ? 'bg-[#0F6E56]' : 'bg-gray-400'}`}></span>
          {anuncio.status}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditarAnuncio(anuncio);
          }}
          title="Editar anúncio"
          className="p-2 rounded-lg text-gray-400 hover:text-[#0068F3] hover:bg-blue-50 transition-colors cursor-pointer"
        >
          <LuPencil size={16} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPedirExcluirAnuncio(anuncio);
          }}
          title="Excluir anúncio"
          className="p-2 rounded-lg text-gray-400 hover:text-[#A32D2D] hover:bg-red-50 transition-colors cursor-pointer"
        >
          <LuTrash2 size={16} />
        </button>
      </div>
    </div>
  );
}

function SecaoPainel({ stats, toneClasses, meusAnuncios, solicitacoes, devolucoes, onAceitar, onRecusar, onConfirmarDevolucao, onNovoAnuncio, onAbrirAnuncio, onEditarAnuncio, onPedirExcluirAnuncio }) {
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-6 py-4.5 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-[15px] font-semibold text-[#1A1A1A]">Meus anúncios</h2>
            <button
              onClick={onNovoAnuncio}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-[#1A1A1A] px-3.5 py-2 rounded-lg hover:bg-[#0068F3] transition-colors cursor-pointer"
            >
              <LuPlus size={14} /> Novo anúncio
            </button>
          </div>
          <div className="p-2 flex-grow">
            {meusAnuncios.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <LuPackage size={28} className="mx-auto mb-2.5 opacity-40" />
                <p className="text-sm font-medium">Nenhum anúncio ativo</p>
                <p className="text-xs mt-1 text-gray-400">Clique em "Novo anúncio" para começar.</p>
              </div>
            ) : (
              meusAnuncios.map((anuncio) => (
                <CardAnuncio
                  key={anuncio._id}
                  anuncio={anuncio}
                  onAbrirAnuncio={onAbrirAnuncio}
                  onEditarAnuncio={onEditarAnuncio}
                  onPedirExcluirAnuncio={onPedirExcluirAnuncio}
                />
              ))
            )}
          </div>
        </section>

        <SecaoSolicitacoes 
          solicitacoes={solicitacoes} 
          devolucoes={devolucoes} 
          onAceitar={onAceitar} 
          onRecusar={onRecusar} 
          onConfirmarDevolucao={onConfirmarDevolucao} 
        />
      </div>
    </div>
  );
}

function SecaoAnuncios({ meusAnuncios, onNovoAnuncio, onAbrirAnuncio, onEditarAnuncio, onPedirExcluirAnuncio }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
      <div className="px-6 py-4.5 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-[15px] font-semibold text-[#1A1A1A]">Meus anúncios</h2>
        <button
          onClick={onNovoAnuncio}
          className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-[#1A1A1A] px-3.5 py-2 rounded-lg hover:bg-[#0068F3] transition-colors cursor-pointer"
        >
          <LuPlus size={14} /> Novo anúncio
        </button>
      </div>
      <div className="p-2 flex-grow">
        {meusAnuncios.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <LuPackage size={28} className="mx-auto mb-2.5 opacity-40" />
            <p className="text-sm font-medium">Nenhum anúncio ativo</p>
            <p className="text-xs mt-1 text-gray-400">Clique em "Novo anúncio" para começar.</p>
          </div>
        ) : (
          meusAnuncios.map((anuncio) => (
            <CardAnuncio
              key={anuncio._id}
              anuncio={anuncio}
              onAbrirAnuncio={onAbrirAnuncio}
              onEditarAnuncio={onEditarAnuncio}
              onPedirExcluirAnuncio={onPedirExcluirAnuncio}
            />
          ))
        )}
      </div>
    </section>
  );
}

function SecaoSolicitacoes({ solicitacoes, devolucoes, onAceitar, onRecusar, onConfirmarDevolucao }) {
  const total = solicitacoes.length + (devolucoes?.length || 0);

  return (
    <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
      <div className="px-6 py-4.5 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-[15px] font-semibold text-[#1A1A1A]">Solicitações recebidas</h2>
        {total > 0 && (
          <span className="bg-[#1A1A1A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{total}</span>
        )}
      </div>
      <div className="p-2 flex-grow overflow-y-auto max-h-[600px]">
        {total === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <LuCheck size={28} className="mx-auto mb-2.5 opacity-40" />
            <p className="text-sm font-medium">Nenhuma ação pendente</p>
          </div>
        ) : (
          <>
            {/* 1. DEVOLUÇÕES (Têm prioridade alta de visualização) */}
            {devolucoes?.map((req) => (
              <div key={req._id} className="p-4 bg-[#0068F3]/[0.03] border border-[#0068F3]/20 rounded-xl mb-2 last:mb-0">
                <div className="flex justify-between items-start mb-3 gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[#1A1A1A] text-sm truncate">{req.anuncio?.titulo || 'Anúncio'}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Devolução de <span className="font-semibold text-[#1A1A1A]">{req.locatario?.nome || 'Locatário'}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Fim do aluguel: {new Date(req.dataFim).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#0068F3]/10 text-[#0068F3] flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0068F3] animate-pulse"></span>
                    Aguardando confirmação
                  </span>
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => onConfirmarDevolucao(req._id)}
                    className="w-full flex items-center justify-center gap-2 bg-[#0068F3] text-white text-xs font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer shadow-sm shadow-blue-500/20"
                  >
                    <LuCheck size={14} /> Confirmar recebimento do item
                  </button>
                </div>
              </div>
            ))}

            {/* 2. NOVAS SOLICITAÇÕES DE ALUGUEL */}
            {solicitacoes.map((req) => (
              <div key={req._id} className="p-4 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100 mb-2 last:mb-0">
                <div className="flex justify-between items-start mb-3 gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[#1A1A1A] text-sm truncate">{req.anuncio?.titulo || 'Anúncio'}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Solicitado por <span className="font-semibold text-[#1A1A1A]">{req.locatario?.nome || 'Locatário'}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(req.dataInicio).toLocaleDateString('pt-BR')} até {new Date(req.dataFim).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-500/[0.1] text-amber-700 flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Novo pedido
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => onAceitar(req._id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#1A1A1A] text-white text-xs font-semibold py-2.5 rounded-lg hover:bg-[#0F6E56] transition-colors cursor-pointer"
                  >
                    <LuCheck size={14} /> Aceitar
                  </button>
                  <button
                    onClick={() => onRecusar(req._id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-600 text-xs font-semibold py-2.5 rounded-lg hover:bg-red-50 hover:text-[#A32D2D] hover:border-red-200 transition-colors cursor-pointer"
                  >
                    <LuX size={14} /> Recusar
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </section>
  );
}

function SecaoCalendario({ alugueis, meusAnuncios, onAbrirDetalhes }) {
  const [dataAtual, setDataAtual] = useState(new Date());
  const [anuncioFiltro, setAnuncioFiltro] = useState('todos');

  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const reservasAtivas = useMemo(() => {
    return alugueis.filter(a => {
      const matchStatus = a.status === 'aceito' || a.status === 'andamento' || a.status === 'aguardando_confirmacao';
      const matchAnuncio = anuncioFiltro === 'todos' || a.anuncio?._id === anuncioFiltro;
      return matchStatus && matchAnuncio;
    });
  }, [alugueis, anuncioFiltro]);

  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth();

  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const totalDiasMes = new Date(ano, mes + 1, 0).getDate();

  function proximoMes() {
    setDataAtual(new Date(ano, mes + 1, 1));
  }

  function mesAnterior() {
    setDataAtual(new Date(ano, mes - 1, 1));
  }

  function getReservasDoDia(dia) {
    const dataAlvo = new Date(ano, mes, dia);
    dataAlvo.setHours(0, 0, 0, 0);

    return reservasAtivas.filter(r => {
      const inicio = new Date(r.dataInicio);
      inicio.setHours(0, 0, 0, 0);
      const fim = new Date(r.dataFim);
      fim.setHours(23, 59, 59, 999);
      return dataAlvo >= inicio && dataAlvo <= fim;
    });
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-[#1A1A1A]">
              {meses[mes]} de {ano}
            </h2>
            <div className="flex items-center gap-1">
              <button onClick={mesAnterior} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer text-gray-600">
                <LuChevronLeft size={16} />
              </button>
              <button onClick={proximoMes} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer text-gray-600">
                <LuChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 font-medium">Filtrar item:</label>
            <select
              value={anuncioFiltro}
              onChange={(e) => setAnuncioFiltro(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-[#1A1A1A] outline-none cursor-pointer"
            >
              <option value="todos">Todos os anúncios</option>
              {meusAnuncios.map(an => (
                <option key={an._id} value={an._id}>{an.titulo}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-gray-400">
          <div>Dom</div>
          <div>Seg</div>
          <div>Ter</div>
          <div>Qua</div>
          <div>Qui</div>
          <div>Sex</div>
          <div>Sáb</div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: primeiroDiaSemana }).map((_, i) => (
            <div key={`vazio-${i}`} className="h-20 rounded-xl bg-gray-50/50"></div>
          ))}

          {Array.from({ length: totalDiasMes }).map((_, i) => {
            const dia = i + 1;
            const reservasDia = getReservasDoDia(dia);
            const estaOcupado = reservasDia.length > 0;

            return (
              <div
                key={`dia-${dia}`}
                onClick={() => estaOcupado && onAbrirDetalhes?.(reservasDia[0])}
                title={estaOcupado ? 'Ver detalhes do aluguel' : undefined}
                className={`h-20 p-2 rounded-xl border flex flex-col justify-between transition-all ${
                  estaOcupado
                    ? 'border-[#0068F3]/30 bg-[#0068F3]/[0.04] cursor-pointer hover:border-[#0068F3] hover:bg-[#0068F3]/[0.08]'
                    : 'border-gray-100 hover:border-gray-200 bg-white'
                }`}
              >
                <span className={`text-xs font-bold ${estaOcupado ? 'text-[#0068F3]' : 'text-gray-700'}`}>
                  {dia}
                </span>

                {estaOcupado && (
                  <div className="mt-1">
                    <span className="inline-block w-full truncate text-[10px] font-semibold text-[#0068F3] bg-[#0068F3]/10 px-1.5 py-0.5 rounded">
                      {reservasDia[0].anuncio?.titulo || 'Alugado'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col space-y-4">
        <h2 className="text-[15px] font-semibold text-[#1A1A1A] border-b border-gray-100 pb-3">
          Reservas confirmadas
        </h2>

        <div className="flex-1 overflow-y-auto space-y-3">
          {reservasAtivas.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <LuCalendar size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">Nenhuma reserva ativa no momento</p>
            </div>
          ) : (
            reservasAtivas.map(r => (
              <div
                key={r._id}
                onClick={() => onAbrirDetalhes?.(r)}
                title="Ver detalhes e conversar"
                className="p-3.5 rounded-xl border border-gray-100 bg-[#FAFAF9] space-y-2 cursor-pointer hover:border-[#0068F3]/40 hover:bg-[#0068F3]/[0.04] transition-colors group"
              >
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-semibold text-sm text-[#1A1A1A] truncate">{r.anuncio?.titulo}</h4>
                  <span className="text-[10px] font-semibold text-[#0F6E56] bg-[#0F6E56]/10 px-2 py-0.5 rounded-full flex-shrink-0">
                    Confirmado
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-gray-600 min-w-0">
                    <LuUser size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">Locatário: <strong className="text-[#1A1A1A]">{r.locatario?.nome || 'Cliente'}</strong></span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAbrirDetalhes?.(r);
                    }}
                    title="Ver detalhes e abrir chat"
                    className="p-1.5 rounded-lg text-gray-400 group-hover:text-[#0068F3] hover:bg-white transition-colors cursor-pointer flex-shrink-0"
                  >
                    <LuMessageSquare size={15} />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <LuCalendar size={14} className="text-gray-400" />
                  <span>{new Date(r.dataInicio).toLocaleDateString('pt-BR')} até {new Date(r.dataFim).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ModalDetalhesReserva({ reserva, onClose, onAbrirChat }) {
  if (!reserva) return null;

  const locatario = reserva.locatario;
  const primeiroNome = locatario?.nome?.split(' ')[0] || 'locatário';

  const statusLabel = {
    aceito: 'Aceito',
    andamento: 'Em andamento',
    aguardando_confirmacao: 'Aguardando devolução',
    concluido: 'Concluído',
  }[reserva.status] || reserva.status;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#1A1A1A]">Detalhes do aluguel</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-[#1A1A1A] cursor-pointer">
            <LuX size={20} />
          </button>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#FAFAF9] border border-gray-100">
          {locatario?.avatar ? (
            <img src={locatario.avatar} alt={locatario.nome} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[#0068F3] text-white flex items-center justify-center font-semibold flex-shrink-0">
              {locatario?.nome?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-sm text-[#1A1A1A] truncate">{locatario?.nome || 'Locatário'}</p>
            {locatario?.email && <p className="text-xs text-gray-500 truncate">{locatario.email}</p>}
            {locatario?.telefone && <p className="text-xs text-gray-500 truncate">{locatario.telefone}</p>}
          </div>
        </div>

        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-gray-500 flex-shrink-0">Item</span>
            <span className="font-semibold text-[#1A1A1A] text-right truncate">{reserva.anuncio?.titulo || '—'}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-500 flex-shrink-0">Período</span>
            <span className="font-semibold text-[#1A1A1A] text-right">
              {new Date(reserva.dataInicio).toLocaleDateString('pt-BR')} até {new Date(reserva.dataFim).toLocaleDateString('pt-BR')}
            </span>
          </div>
          {reserva.horarioRetirada && (
            <div className="flex justify-between gap-3">
              <span className="text-gray-500 flex-shrink-0">Horário de retirada</span>
              <span className="font-semibold text-[#1A1A1A]">{reserva.horarioRetirada}</span>
            </div>
          )}
          <div className="flex justify-between gap-3">
            <span className="text-gray-500 flex-shrink-0">Valor total</span>
            <span className="font-semibold text-[#1A1A1A]">R$ {Number(reserva.precoTotal || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center gap-3">
            <span className="text-gray-500 flex-shrink-0">Status</span>
            <span className="text-[11px] font-semibold text-[#0F6E56] bg-[#0F6E56]/10 px-2 py-0.5 rounded-full">
              {statusLabel}
            </span>
          </div>
        </div>

        <button
          onClick={() => onAbrirChat(locatario?._id)}
          disabled={!locatario?._id}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#1A1A1A] text-white text-xs font-semibold hover:bg-[#0068F3] transition-colors cursor-pointer disabled:opacity-40"
        >
          <LuMessageSquare size={15} /> Conversar com {primeiroNome}
        </button>
      </div>
    </div>
  );
}

function SecaoGanhos({ ganhosTotais, ganhosDoMes, aReceber, alugueisConcluidos, alugueisAndamento, onMarcarDevolvido, usuarioLogadoId }) {
  const [avaliacoesFeitas, setAvaliacoesFeitas] = useState({});
  const [verHistoricoCompleto, setVerHistoricoCompleto] = useState(false);

  function handleStatusAvaliacao(aluguelId, avaliado) {
    setAvaliacoesFeitas(prev => ({ ...prev, [aluguelId]: avaliado }));
  }

  const pendentesDeAvaliar = alugueisConcluidos.filter(a => avaliacoesFeitas[a._id] === false);

  const listaExibida = verHistoricoCompleto
    ? alugueisConcluidos
    : alugueisConcluidos.filter(a => avaliacoesFeitas[a._id] !== true);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 border-l-4 border-l-[#0F6E56] flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#0F6E56]/[0.08] text-[#0F6E56] flex-shrink-0">
            <LuWallet size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Ganhos este mês</p>
            <p className="text-xl font-semibold text-[#1A1A1A] tabular-nums">R$ {ganhosDoMes.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 border-l-4 border-l-gray-300 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gray-900/[0.05] text-gray-700 flex-shrink-0">
            <LuDollarSign size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Ganhos totais</p>
            <p className="text-xl font-semibold text-[#1A1A1A] tabular-nums">R$ {ganhosTotais.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 border-l-4 border-l-amber-500 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-amber-500/[0.1] text-amber-600 flex-shrink-0">
            <LuClock size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">A receber</p>
            <p className="text-xl font-semibold text-[#1A1A1A] tabular-nums">R$ {aReceber.toFixed(2)}</p>
          </div>
        </div>
      </section>

      {/* 2. ALUGUÉIS EM ANDAMENTO (NO TOPO) */}
      <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
        <div className="px-6 py-4.5 border-b border-gray-100">
          <h2 className="text-[15px] font-semibold text-[#1A1A1A]">Aluguéis em andamento</h2>
        </div>
        <div className="p-2 flex-grow">
          {alugueisAndamento.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <LuPackageX size={28} className="mx-auto mb-2.5 opacity-40" />
              <p className="text-sm font-medium">Nenhum aluguel em andamento no momento</p>
            </div>
          ) : (
            alugueisAndamento.map((a) => {
              const aguardandoConfirmacao = a.status === 'aguardando_confirmacao';

              return (
                <div key={a._id} className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 rounded-xl transition-colors border-b border-gray-100 last:border-0">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[#1A1A1A] text-sm truncate">{a.anuncio?.titulo}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Alugado por {a.locatario?.nome} • devolução em {new Date(a.dataFim).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-semibold text-amber-600 text-sm tabular-nums">
                      R$ {(a.precoTotal - (a.taxaServico || 0)).toFixed(2)}
                    </span>

                    {aguardandoConfirmacao ? (
                      <button
                        onClick={() => onMarcarDevolvido(a._id)}
                        className="bg-[#0068F3] text-white text-[11px] font-semibold px-3.5 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm shadow-blue-500/20 animate-pulse"
                      >
                        <LuCheck size={14} /> Confirmar devolução
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1.5 rounded-full">
                        <LuClock size={12} /> Com o locatário
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 3. HISTÓRICO DE ALUGUÉIS CONCLUÍDOS (EMBAIXO) */}
      <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
        <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-semibold text-[#1A1A1A]">
              {verHistoricoCompleto ? 'Histórico de aluguéis concluídos' : 'Pendentes de avaliação'}
            </h2>
            {pendentesDeAvaliar.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#0068F3] text-white text-[11px] font-semibold">
                {pendentesDeAvaliar.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setVerHistoricoCompleto(prev => !prev)}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-500 hover:text-[#0068F3] transition-colors cursor-pointer"
          >
            <LuHistory size={14} />
            {verHistoricoCompleto ? 'Ver só pendentes' : 'Ver histórico completo'}
          </button>
        </div>
        <div className="p-2 flex-grow">
          {listaExibida.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              {verHistoricoCompleto ? (
                <>
                  <LuPackageX size={28} className="mx-auto mb-2.5 opacity-40" />
                  <p className="text-sm font-medium">Nenhum aluguel concluído ainda</p>
                </>
              ) : (
                <>
                  <LuStar size={28} className="mx-auto mb-2.5 opacity-40" />
                  <p className="text-sm font-medium">Nenhuma avaliação pendente no momento</p>
                </>
              )}
            </div>
          ) : (
            listaExibida.map((a) => (
              <div key={a._id} className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 rounded-xl transition-colors border-b border-gray-100 last:border-0">
                <div className="min-w-0">
                  <h3 className="font-semibold text-[#1A1A1A] text-sm truncate">{a.anuncio?.titulo}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Alugado por {a.locatario?.nome} • {new Date(a.dataFim).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-semibold text-[#0F6E56] text-sm tabular-nums">
                    + R$ {(a.precoTotal - (a.taxaServico || 0)).toFixed(2)}
                  </span>
                  {a.locatario && (
                    <BotaoAvaliar
                      aluguelId={a._id}
                      autorId={usuarioLogadoId}
                      nomeAvaliado={a.locatario.nome}
                      onStatusChange={handleStatusAvaliacao}
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function ModalEditarAnuncio({ anuncio, onClose, onSalvar }) {
  if (!anuncio) return null;

  const [titulo, setTitulo] = useState(anuncio.titulo || '');
  const [descricao, setDescricao] = useState(anuncio.descricao || '');
  const [precoPorDia, setPrecoPorDia] = useState(anuncio.precos?.precoPorDia || 0);
  const [caucao, setCaucao] = useState(anuncio.precos?.caucao || 0);
  const [status, setStatus] = useState(anuncio.status || 'publicado');

  function handleSubmit(e) {
    e.preventDefault();
    onSalvar({
      ...anuncio,
      titulo,
      descricao,
      status,
      precos: {
        ...anuncio.precos,
        precoPorDia: Number(precoPorDia),
        caucao: Number(caucao)
      }
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <h2 className="text-base font-semibold text-[#1A1A1A]">Editar anúncio</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-[#1A1A1A] cursor-pointer">
            <LuX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Título</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#1A1A1A] outline-none focus:border-[#0068F3]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Descrição</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              required
              className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#1A1A1A] outline-none focus:border-[#0068F3]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Preço por dia (R$)</label>
              <input
                type="number"
                value={precoPorDia}
                onChange={(e) => setPrecoPorDia(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#1A1A1A] outline-none focus:border-[#0068F3]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Caução (R$)</label>
              <input
                type="number"
                value={caucao}
                onChange={(e) => setCaucao(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#1A1A1A] outline-none focus:border-[#0068F3]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#1A1A1A] outline-none cursor-pointer"
            >
              <option value="publicado">Publicado</option>
              <option value="rascunho">Rascunho</option>
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-lg bg-[#1A1A1A] text-white text-xs font-semibold hover:bg-[#0068F3] transition-colors cursor-pointer"
            >
              Salvar alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalConfirmarExclusao({ anuncio, onClose, onConfirmar }) {
  if (!anuncio) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl text-center space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-full bg-red-50 text-[#A32D2D] flex items-center justify-center mx-auto">
          <LuTrash2 size={24} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-[#1A1A1A]">Excluir anúncio?</h3>
          <p className="text-xs text-gray-500 mt-1">
            Você tem certeza que deseja remover <strong>"{anuncio.titulo}"</strong>? Esta ação é irreversível e desativará novas solicitações para este item.
          </p>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Voltar
          </button>
          <button
            onClick={onConfirmar}
            className="flex-1 py-2.5 rounded-lg bg-[#A32D2D] text-white text-xs font-semibold hover:bg-red-700 transition-colors cursor-pointer"
          >
            Excluir permanentemente
          </button>
        </div>
      </div>
    </div>
  );
}

function SecaoConfiguracoes({ onSalvarPainelPadrao, onExcluirConta, objetivoAtual, onAlterarObjetivo }) {
  const [painelPadrao, setPainelPadrao] = useState(() => localStorage.getItem('painelPadrao') || 'painel');
  const [salvandoObjetivo, setSalvandoObjetivo] = useState(false);

  function handleChangePainelPadrao(e) {
    const valor = e.target.value;
    setPainelPadrao(valor);
    onSalvarPainelPadrao(valor);
  }

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
                  ? 'border-[#0F6E56] bg-[#0F6E56]/[0.04] ring-1 ring-[#0F6E56]'
                  : 'border-gray-200 hover:border-gray-300'
              } ${salvandoObjetivo ? 'opacity-60 pointer-events-none' : ''}`}
            >
              <span className={`block text-sm font-semibold ${objetivoAtual === op.valor ? 'text-[#0F6E56]' : 'text-[#1A1A1A]'}`}>
                {op.titulo}
              </span>
              <span className="block text-xs text-gray-500 mt-0.5">{op.descricao}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4.5 border-b border-gray-100">
          <h2 className="text-[15px] font-semibold text-[#1A1A1A]">Preferências</h2>
        </div>
        <div className="p-6 space-y-2">
          <label className="text-sm font-semibold text-[#1A1A1A]">Painel exibido ao entrar</label>
          <p className="text-xs text-gray-500">Escolha qual seção abrir automaticamente quando você acessa o Painel Locador.</p>
          <select
            value={painelPadrao}
            onChange={handleChangePainelPadrao}
            className="w-full max-w-sm mt-2 px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#0068F3]/20 focus:border-[#0068F3] transition-colors cursor-pointer"
          >
            {PAINEIS_DISPONIVEIS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-red-100 overflow-hidden">
        <div className="px-6 py-4.5 border-b border-red-100">
          <h2 className="text-[15px] font-semibold text-[#A32D2D]">Zona de perigo</h2>
        </div>
        <div className="p-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A]">Excluir minha conta</p>
            <p className="text-xs text-gray-500 mt-1">Essa ação é permanente e remove seus anúncios.</p>
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