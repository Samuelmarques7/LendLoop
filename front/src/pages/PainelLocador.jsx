import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api';
import logo from '../assets/logo.png'; 

import { 
  LuLayoutDashboard, 
  LuPackage, 
  LuInbox, 
  LuCalendar, 
  LuDollarSign, 
  LuMessageSquare, 
  LuUser, 
  LuSettings,
  LuTrendingUp,
  LuInfo,
  LuCheck,
  LuX,
  LuPlus,
  LuBell,
  LuPackageX,
  LuTrash2,
  LuArrowLeft,
  LuWallet,
  LuClock
} from "react-icons/lu";

const PAINEIS_DISPONIVEIS = [
  { id: 'painel', label: 'Painel Locador' },
  { id: 'anuncios', label: 'Meus Anúncios' },
  { id: 'solicitacoes', label: 'Solicitações Recebidas' },
  { id: 'calendario', label: 'Calendário' },
  { id: 'ganhos', label: 'Ganhos' },
  { id: 'mensagens', label: 'Mensagens' },
];

export default function PainelLocador() {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('painelPadrao') || 'painel');
  const navigate = useNavigate(); 

  const [alugueis, setAlugueis] = useState([]);
  const [meusAnuncios, setMeusAnuncios] = useState([]);
  const [dadosLocador, setDadosLocador] = useState(null);

  const usuarioLogado = JSON.parse(localStorage.getItem('dadosUsuario'));

  useEffect(() => {
    document.title = 'Painel Locador';
    return () => {
      document.title = 'LendLoop';
    };
  }, []);

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
    { id: 1, titulo: "Ganhos Este Mês", valor: `R$ ${ganhosDoMes.toFixed(2)}`, icon: LuDollarSign, color: "text-[#29C354]", bg: "bg-[#29C354]/10" },
    { id: 2, titulo: "Anúncios Ativos", valor: String(meusAnuncios.length), icon: LuPackage, color: "text-[#1A1A1A]", bg: "bg-gray-100" },
    { id: 3, titulo: "Solicitações Pendentes", valor: String(solicitacoesPendentes.length), icon: LuInfo, color: "text-orange-500", bg: "bg-orange-50" },
    { id: 4, titulo: "Mensagens Não Lidas", valor: "0", icon: LuMessageSquare, color: "text-[#0068F3]", bg: "bg-blue-50" }
  ];

  const menuItems = [
    { id: 'painel', label: 'Painel Locador', icon: LuLayoutDashboard },
    { id: 'anuncios', label: 'Meus Anúncios', icon: LuPackage },
    { id: 'solicitacoes', label: 'Solicitações Recebidas', icon: LuInbox },
    { id: 'calendario', label: 'Calendário', icon: LuCalendar },
    { id: 'ganhos', label: 'Ganhos', icon: LuTrendingUp },
    { id: 'mensagens', label: 'Mensagens', icon: LuMessageSquare },
    { id: 'perfil', label: 'Perfil', icon: LuUser },
    { id: 'config', label: 'Configurações', icon: LuSettings },
  ];

  function handleMenuClick(item) {
    if (item.id === 'perfil') {
      navigate('/meu-perfil');
      return;
    }
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

  function renderConteudo() {
    switch (activeTab) {
      case 'painel':
        return <SecaoPainel
          stats={stats}
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
          />
        );
      case 'config':
        return <SecaoConfiguracoes
          activeTab={activeTab}
          onSalvarPainelPadrao={salvarPainelPadrao}
          onExcluirConta={excluirConta}
        />;
      default:
        return (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
            <p className="font-bold text-lg capitalize">{menuItems.find(i => i.id === activeTab)?.label}</p>
            <p className="text-sm mt-2">Conteúdo desta seção será implementado em breve.</p>
          </div>
        );
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans flex text-[#1A1A1A]">
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col sticky top-0 h-screen shadow-sm z-10">

        <div className="h-20 flex items-center px-6 border-b border-gray-100">
          <img
            src={logo}
            alt="LendLoop"
            className="h-18 w-auto cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/')}
          />
        </div>

        <div className="px-4 pt-4">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-[#1A1A1A] hover:bg-gray-50 transition-all cursor-pointer"
          >
            <LuArrowLeft size={15} />
            Voltar ao site
          </button>
        </div>

        <nav className="flex-1 px-4 pt-2 pb-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item)}
                className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#1A1A1A] text-white shadow-md shadow-black/10'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-[#1A1A1A]'
                }`}
              >
                <span className={`flex items-center justify-center w-8 h-8 rounded-xl transition-colors flex-shrink-0 ${
                  isActive ? 'bg-[#29C354] text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-[#29C354]/10 group-hover:text-[#29C354]'
                }`}>
                  <Icon size={16} />
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => navigate('/meu-perfil')}
            className="w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="w-11 h-11 rounded-full bg-[#29C354] text-white flex items-center justify-center font-bold text-lg overflow-hidden flex-shrink-0 ring-2 ring-[#29C354]/20">
              {dadosLocador?.avatar ? (
                <img src={dadosLocador.avatar} alt={dadosLocador.nome} className="w-full h-full object-cover" />
              ) : (
                dadosLocador?.nome?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            <div className="text-left min-w-0">
              <p className="text-sm font-bold text-[#1A1A1A] truncate">{dadosLocador?.nome || 'Carregando...'}</p>
              <span className="inline-block mt-0.5 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#29C354]/10 text-[#29C354]">
                Locador
              </span>
            </div>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <h1 className="text-xl font-bold text-[#1A1A1A] capitalize">
            {menuItems.find(i => i.id === activeTab)?.label}
          </h1>
          <div className="flex items-center gap-4">
            <button className="p-2.5 rounded-full bg-gray-50 text-gray-500 hover:text-[#29C354] transition-colors relative cursor-pointer">
              <LuBell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
          {renderConteudo()}
        </div>
      </main>
    </div>
  );
}

function CardAnuncio({ anuncio, onAbrirAnuncio, onExcluirAnuncio }) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors group">
      <div
        onClick={() => onAbrirAnuncio(anuncio._id)}
        className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer"
      >
        {anuncio.fotos && anuncio.fotos.length > 0 ? (
          <img src={anuncio.fotos[0]} alt={anuncio.titulo} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
        ) : (
          <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0 flex items-center justify-center ">
            <LuPackageX size={20} className="text-gray-400" />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-bold text-[#1A1A1A] text-sm group-hover:text-[#29C354] transition-colors truncate">{anuncio.titulo}</h3>
          <p className="text-xs text-gray-400 font-medium mt-0.5">{anuncio.precos.precoPorDia}/dia • 0 reservas</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-md ${
          anuncio.status === 'publicado' ? 'bg-[#29C354]/10 text-[#29C354]' : 'bg-gray-100 text-gray-500'
        }`}>
          {anuncio.status}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExcluirAnuncio(anuncio._id);
          }}
          title="Excluir anúncio"
          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
        >
          <LuTrash2 size={16} />
        </button>
      </div>
    </div>
  );
}

function SecaoPainel({ stats, meusAnuncios, solicitacoes, onAceitar, onRecusar, onNovoAnuncio, onAbrirAnuncio, onExcluirAnuncio }) {
  return (
    <div className="animate-fade-in space-y-8">
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.titulo}</p>
                <p className="text-2xl font-black text-[#1A1A1A]">{stat.valor}</p>
              </div>
            </div>
          );
        })}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-[#1A1A1A]">Meus Anúncios</h2>
            <button
              onClick={onNovoAnuncio}
              className="flex items-center gap-2 text-xs font-bold text-[#29C354] bg-[#29C354]/10 px-4 py-2 rounded-lg hover:bg-[#29C354]/20 transition-colors cursor-pointer uppercase tracking-widest"
            >
              <LuPlus size={14} /> Novo Anúncio
            </button>
          </div>
          <div className="p-2 flex-grow">
            
            {meusAnuncios.length === 0 ? (
              <div className="p-8 text-center text-gray-400 flex flex-col items-center justify-center h-full">
                <LuPackage size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-bold">Nenhum anúncio ativo</p>
                <p className="text-xs mt-1">Clique em "Novo Anúncio" para começar.</p>
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
    <div className="animate-fade-in space-y-8">
      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-[#1A1A1A]">Meus Anúncios</h2>
          <button
            onClick={onNovoAnuncio}
            className="flex items-center gap-2 text-xs font-bold text-[#29C354] bg-[#29C354]/10 px-4 py-2 rounded-lg hover:bg-[#29C354]/20 transition-colors cursor-pointer uppercase tracking-widest"
          >
            <LuPlus size={14} /> Novo Anúncio
          </button>
        </div>
        <div className="p-2 flex-grow">
          {meusAnuncios.length === 0 ? (
            <div className="p-8 text-center text-gray-400 flex flex-col items-center justify-center h-full">
              <LuPackage size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-bold">Nenhum anúncio ativo</p>
              <p className="text-xs mt-1">Clique em "Novo Anúncio" para começar.</p>
            </div>
          ) : (
            meusAnuncios.map((anuncio) => (
              <CardAnuncio key={anuncio._id} anuncio={anuncio} onAbrirAnuncio={onAbrirAnuncio} onExcluirAnuncio={onExcluirAnuncio} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function SecaoSolicitacoes({ solicitacoes, onAceitar, onRecusar }) {
  return (
    <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-lg font-bold text-[#1A1A1A]">Solicitações Recebidas</h2>
      </div>
      <div className="p-2 flex-grow">
        {solicitacoes.length === 0 ? (
          <div className="p-8 text-center text-gray-400 flex flex-col items-center justify-center h-full">
            <LuCheck size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-bold">Nenhuma solicitação pendente</p>
          </div>
        ) : (
          solicitacoes.map((req) => (
            <div key={req._id} className="p-4 hover:bg-gray-50 rounded-2xl transition-colors border border-transparent hover:border-gray-100 mb-2">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-[#1A1A1A] text-sm">{req.anuncio.titulo}</h3>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    Solicitado por <span className="font-bold text-[#1A1A1A]">{req.locatario.nome}</span>
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Data: {new Date(req.dataInicio).toLocaleDateString('pt-BR')}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest bg-orange-50 text-orange-500 px-3 py-1.5 rounded-md">
                  Pendente
                </span>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => onAceitar(req._id)}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#1A1A1A] text-white text-xs font-bold py-2.5 rounded-xl hover:bg-black transition-colors cursor-pointer shadow-sm"
                >
                  <LuCheck size={14} className="text-[#29C354]" /> Aceitar
                </button>
                <button
                  onClick={() => onRecusar(req._id)}
                  className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold py-2.5 rounded-xl hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors cursor-pointer shadow-sm"
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

function SecaoGanhos({ ganhosTotais, ganhosDoMes, aReceber, alugueisConcluidos, alugueisAndamento }) {
  return (
    <div className="animate-fade-in space-y-8">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#29C354]/10 text-[#29C354]">
            <LuWallet size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Ganhos Este Mês</p>
            <p className="text-2xl font-black text-[#1A1A1A]">R$ {ganhosDoMes.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#1A1A1A]/5 text-[#1A1A1A]">
            <LuDollarSign size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Ganhos Totais</p>
            <p className="text-2xl font-black text-[#1A1A1A]">R$ {ganhosTotais.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-orange-50 text-orange-500">
            <LuClock size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">A Receber</p>
            <p className="text-2xl font-black text-[#1A1A1A]">R$ {aReceber.toFixed(2)}</p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#1A1A1A]">Histórico de Aluguéis Concluídos</h2>
        </div>
        <div className="p-2 flex-grow">
          {alugueisConcluidos.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <LuPackageX size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-bold">Nenhum aluguel concluído ainda</p>
            </div>
          ) : (
            alugueisConcluidos.map((a) => (
              <div key={a._id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors">
                <div className="min-w-0">
                  <h3 className="font-bold text-[#1A1A1A] text-sm truncate">{a.anuncio?.titulo}</h3>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">
                    Alugado por {a.locatario?.nome} • {new Date(a.dataFim).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <span className="font-black text-[#29C354] text-sm shrink-0">
                  + R$ {(a.precoTotal - (a.taxaServico || 0)).toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {alugueisAndamento.length > 0 && (
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-[#1A1A1A]">Aluguéis em Andamento</h2>
          </div>
          <div className="p-2 flex-grow">
            {alugueisAndamento.map((a) => (
              <div key={a._id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors">
                <div className="min-w-0">
                  <h3 className="font-bold text-[#1A1A1A] text-sm truncate">{a.anuncio?.titulo}</h3>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">
                    Alugado por {a.locatario?.nome} • devolução em {new Date(a.dataFim).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <span className="font-black text-orange-500 text-sm shrink-0">
                  R$ {(a.precoTotal - (a.taxaServico || 0)).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SecaoConfiguracoes({ onSalvarPainelPadrao, onExcluirConta }) {
  const [painelPadrao, setPainelPadrao] = useState(() => localStorage.getItem('painelPadrao') || 'painel');

  function handleChangePainelPadrao(e) {
    const valor = e.target.value;
    setPainelPadrao(valor);
    onSalvarPainelPadrao(valor);
  }

  return (
    <div className="animate-fade-in space-y-8">
      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#1A1A1A]">Preferências</h2>
        </div>
        <div className="p-6 space-y-3">
          <label className="text-sm font-bold text-[#1A1A1A]">Painel exibido ao entrar</label>
          <p className="text-xs text-gray-400">Escolha qual seção abrir automaticamente quando você acessa o Painel Locador.</p>
          <select
            value={painelPadrao}
            onChange={handleChangePainelPadrao}
            className="w-full max-w-sm mt-2 px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold text-[#1A1A1A] focus:outline-none focus:border-[#29C354] cursor-pointer"
          >
            {PAINEIS_DISPONIVEIS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-red-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-red-100">
          <h2 className="text-lg font-bold text-red-500">Zona de Perigo</h2>
        </div>
        <div className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-[#1A1A1A]">Excluir minha conta</p>
            <p className="text-xs text-gray-400 mt-1">Essa ação é permanente e remove seus anúncios.</p>
          </div>
          <button
            onClick={onExcluirConta}
            className="flex items-center gap-2 bg-red-50 text-red-500 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-red-100 transition-colors cursor-pointer uppercase tracking-widest"
          >
            <LuTrash2 size={14} /> Excluir Conta
          </button>
        </div>
      </section>
    </div>
  );
}