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
  LuBell,
  LuPackageX,
  LuTrash2,
  LuWallet,
  LuClock,
  LuTriangleAlert
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

  const solicitacoesPendentes = useMemo(
    () => alugueis.filter(a => a.status === 'pendente'),
    [alugueis]
  );

  const alugueisConcluidos = useMemo(
    () => alugueis.filter(a => a.status === 'concluido'),
    [alugueis]
  );

  const alugueisAndamento = useMemo(
    () => alugueis.filter(a => a.status === 'aceito' || a.status === 'andamento'),
    [alugueis]
  );

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

  const stats = [
    { id: 1, titulo: "Ganhos este mês", valor: `R$ ${ganhosDoMes.toFixed(2)}`, icon: LuDollarSign, tone: 'success' },
    { id: 2, titulo: "Anúncios ativos", valor: String(meusAnuncios.length), icon: LuPackage, tone: 'neutral' },
    { id: 3, titulo: "Solicitações pendentes", valor: String(solicitacoesPendentes.length), icon: LuMailWarning, tone: 'warning' },
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

  async function aceitarSolicitacao(id) {
    try {
      await apiRequest(`/api/alugueis/${id}/status`, {
        method: 'PATCH',
        body: {status: 'aceito'}
      })

      setAlugueis(prev => prev.map(a => a._id === id ? { ...a, status: 'aceito' } : a));
    } catch (e) {
      alert(e.message);
    }
  }

  async function recusarSolicitacao(id) {
    try {
      await apiRequest(`/api/alugueis/${id}/status`, {
        method: 'PATCH',
        body: {status: 'recusado'}
      })

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

  async function excluirAnuncio(id) {
    const confirmar = window.confirm('Tem certeza que deseja excluir este anúncio? Essa ação não pode ser desfeita.');
    if (!confirmar) return;

    try {
      await apiRequest(`/api/anuncios/${id}`, {
        method: 'DELETE'
      });

      setMeusAnuncios(prev => prev.filter(a => a._id !== id));
    } catch (e) {
      alert(e.message);
    }
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
          onAceitar={aceitarSolicitacao}
          onRecusar={recusarSolicitacao}
          onNovoAnuncio={() => navigate('/criar-anuncio')}
          onAbrirAnuncio={(id) => navigate(`/produto/${id}`)}
          onExcluirAnuncio={excluirAnuncio}
        />;
      case 'anuncios':
        return <SecaoAnuncios
          meusAnuncios={meusAnuncios}
          onNovoAnuncio={() => navigate('/criar-anuncio')}
          onAbrirAnuncio={(id) => navigate(`/produto/${id}`)}
          onExcluirAnuncio={excluirAnuncio}
        />;
      case 'solicitacoes':
        return (
          <div className="animate-fade-in">
            <SecaoSolicitacoes solicitacoes={solicitacoesPendentes} onAceitar={aceitarSolicitacao} onRecusar={recusarSolicitacao} />
          </div>
        );
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
          conversaParaAbrir={location.state?.abrirConversa}
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
        <div className="max-w-[1600px] mx-auto w-full h-16 flex items-center px-10 gap-8">
          <button onClick={() => navigate('/')} className="flex-shrink-0 cursor-pointer">
            <img src={logo} alt="LendLoop" className="h-8 w-auto" />
          </button>

          <nav className="flex-1 flex items-center gap-1 h-full overflow-x-auto">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item)}
                  className={`h-full flex items-center gap-2 px-3.5 text-[13px] font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                    isActive
                      ? 'border-[#1A1A1A] text-[#1A1A1A]'
                      : 'border-transparent text-gray-500 hover:text-[#1A1A1A]'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-[#29C354]' : 'text-gray-400'} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-[#1A1A1A] transition-colors relative cursor-pointer">
              <LuBell size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#D85A30] rounded-full"></span>
            </button>
            <button
              onClick={() => navigate('/configuracoes')}
              title="Configurações"
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-[#1A1A1A] transition-colors cursor-pointer"
            >
              <LuSettings size={18} />
            </button>

            <button
              onClick={() => navigate('/meu-perfil')}
              className="flex items-center gap-2.5 pl-3 ml-1 border-l border-gray-200 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center font-semibold text-xs overflow-hidden flex-shrink-0">
                {dadosLocador?.avatar ? (
                  <img src={dadosLocador.avatar} alt={dadosLocador.nome} className="w-full h-full object-cover" />
                ) : (
                  dadosLocador?.nome?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <div className="hidden lg:block text-left min-w-0">
                <p className="text-[13px] font-semibold text-[#1A1A1A] whitespace-nowrap leading-tight group-hover:text-[#0068F3] transition-colors">
                  {dadosLocador?.nome ? dadosLocador.nome.split(' ').slice(0, 2).join(' ') : 'Carregando...'}
                </p>
                <p className="text-[11px] text-gray-400 leading-tight">Locador</p>
              </div>
            </button>
          </div>
        </div>
      </header>

      <main className="px-10 py-8 max-w-[1600px] mx-auto w-full space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A1A]">{secaoAtual?.label || 'Painel'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gerencie seus anúncios, solicitações e ganhos em um só lugar.</p>
        </div>
        {renderConteudo()}
      </main>
    </div>
  );
}

function CardAnuncio({ anuncio, onAbrirAnuncio, onExcluirAnuncio }) {
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
          <p className="text-xs text-gray-400 mt-0.5">{anuncio.precos.precoPorDia}/dia • 0 reservas</p>
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
            onExcluirAnuncio(anuncio._id);
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

function SecaoPainel({ stats, toneClasses, meusAnuncios, solicitacoes, onAceitar, onRecusar, onNovoAnuncio, onAbrirAnuncio, onExcluirAnuncio }) {
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
                <CardAnuncio key={anuncio._id} anuncio={anuncio} onAbrirAnuncio={onAbrirAnuncio} onExcluirAnuncio={onExcluirAnuncio} />
              ))
            )}
          </div>
        </section>

        <SecaoSolicitacoes solicitacoes={solicitacoes} onAceitar={onAceitar} onRecusar={onRecusar} />
      </div>
    </div>
  );
}

function SecaoAnuncios({ meusAnuncios, onNovoAnuncio, onAbrirAnuncio, onExcluirAnuncio }) {
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
            <CardAnuncio key={anuncio._id} anuncio={anuncio} onAbrirAnuncio={onAbrirAnuncio} onExcluirAnuncio={onExcluirAnuncio} />
          ))
        )}
      </div>
    </section>
  );
}

function SecaoSolicitacoes({ solicitacoes, onAceitar, onRecusar }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
      <div className="px-6 py-4.5 border-b border-gray-100">
        <h2 className="text-[15px] font-semibold text-[#1A1A1A]">Solicitações recebidas</h2>
      </div>
      <div className="p-2 flex-grow">
        {solicitacoes.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <LuCheck size={28} className="mx-auto mb-2.5 opacity-40" />
            <p className="text-sm font-medium">Nenhuma solicitação pendente</p>
          </div>
        ) : (
          solicitacoes.map((req) => (
            <div key={req._id} className="p-4 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100 mb-2 last:mb-0">
              <div className="flex justify-between items-start mb-3 gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-[#1A1A1A] text-sm truncate">{req.anuncio.titulo}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Solicitado por <span className="font-semibold text-[#1A1A1A]">{req.locatario.nome}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Data: {new Date(req.dataInicio).toLocaleDateString('pt-BR')}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-500/[0.1] text-amber-700 flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Pendente
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
          ))
        )}
      </div>
    </section>
  );
}

function SecaoGanhos({ ganhosTotais, ganhosDoMes, aReceber, alugueisConcluidos, alugueisAndamento, onMarcarDevolvido, usuarioLogadoId }) {
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

      <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
        <div className="px-6 py-4.5 border-b border-gray-100">
          <h2 className="text-[15px] font-semibold text-[#1A1A1A]">Histórico de aluguéis concluídos</h2>
        </div>
        <div className="p-2 flex-grow">
          {alugueisConcluidos.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <LuPackageX size={28} className="mx-auto mb-2.5 opacity-40" />
              <p className="text-sm font-medium">Nenhum aluguel concluído ainda</p>
            </div>
          ) : (
            alugueisConcluidos.map((a) => (
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
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {alugueisAndamento.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-6 py-4.5 border-b border-gray-100">
            <h2 className="text-[15px] font-semibold text-[#1A1A1A]">Aluguéis em andamento</h2>
          </div>
          <div className="p-2 flex-grow">
            {alugueisAndamento.map((a) => {
              const podeDevolver = new Date() >= new Date(a.dataFim);

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

                    {podeDevolver ? (
                      <button
                        onClick={() => onMarcarDevolvido(a._id)}
                        className="bg-[#1A1A1A] text-white text-[11px] font-semibold px-3.5 py-2 rounded-lg hover:bg-[#0F6E56] transition-colors cursor-pointer"
                      >
                        Marcar devolvido
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1.5 rounded-full">
                        <LuTriangleAlert size={12} /> Aguardando prazo
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
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
