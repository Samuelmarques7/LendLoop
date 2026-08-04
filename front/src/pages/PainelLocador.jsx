import { useState, useEffect } from 'react';
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
  LuPackageX
} from "react-icons/lu";

export default function PainelLocador() {
  const [activeTab, setActiveTab] = useState('painel');
  const navigate = useNavigate(); 

  const [solicitacoes, setSolicitacoes] = useState([]);
  const [meusAnuncios, setMeusAnuncios] = useState([]);

  const usuarioLogado = JSON.parse(localStorage.getItem('dadosUsuario'));

  useEffect(() => {
    async function buscarMeusAnuncios() {
      const dados = await apiRequest(`/api/anuncios/locador/${usuarioLogado.id}`);
      setMeusAnuncios(dados);
    }
    buscarMeusAnuncios();
  }, []);

  useEffect(() => {
    async function buscarSolicitacoes() {
      const dados = await apiRequest(`/api/alugueis/locador/${usuarioLogado.id}`);
      console.log(dados);
      setSolicitacoes(dados.filter(s => s.status === 'pendente'));
    }
    buscarSolicitacoes();
  }, []);

  const stats = [
    { id: 1, titulo: "Ganhos Este Mês", valor: "R$ 0", icon: LuDollarSign, color: "text-[#00B795]", bg: "bg-[#00B795]/10" },
    { id: 2, titulo: "Anúncios Ativos", valor: String(meusAnuncios.length), icon: LuPackage, color: "text-[#1A1A1A]", bg: "bg-gray-100" },
    { id: 3, titulo: "Solicitações Pendentes", valor: String(solicitacoes.length), icon: LuInfo, color: "text-orange-500", bg: "bg-orange-50" },
    { id: 4, titulo: "Mensagens Não Lidas", valor: "0", icon: LuMessageSquare, color: "text-[#00639E]", bg: "bg-blue-50" }
  ];

  const menuItems = [
    { id: 'painel', label: 'Painel', icon: LuLayoutDashboard },
    { id: 'anuncios', label: 'Meus Anúncios', icon: LuPackage },
    { id: 'solicitacoes', label: 'Solicitações Recebidas', icon: LuInbox },
    { id: 'calendario', label: 'Calendário', icon: LuCalendar },
    { id: 'ganhos', label: 'Ganhos', icon: LuTrendingUp },
    { id: 'mensagens', label: 'Mensagens', icon: LuMessageSquare },
    { id: 'perfil', label: 'Perfil', icon: LuUser },
    { id: 'config', label: 'Configurações', icon: LuSettings },
  ];

  async function aceitarSolicitacao(id) {
    try {
      await apiRequest(`/api/alugueis/${id}/status`, {
        method: 'PATCH',
        body: {status: 'aceito'}
      })

      setSolicitacoes(prev => prev.filter(s => s._id !== id));
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

      setSolicitacoes(prev => prev.filter(s => s._id !== id));
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
          solicitacoes={solicitacoes}
          onAceitar={aceitarSolicitacao}
          onRecusar={recusarSolicitacao}
          onNovoAnuncio={() => navigate('/criar-anuncio')}
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
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col sticky top-0 h-screen shadow-sm z-10">
        
        <div className="h-20 flex items-center px-8 border-b border-gray-100">
          <img
            src={logo}
            alt="LendLoop"
            className="h-18 w-auto cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/')}
          />
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#1A1A1A] text-white shadow-md'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-[#00B795]'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-[#00B795]' : ''} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#00B795] text-white flex items-center justify-center font-bold text-lg">
              U
            </div>
            <div>
              <p className="text-sm font-bold text-[#1A1A1A]">Usuário LendLoop</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Membro</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <h1 className="text-xl font-bold text-[#1A1A1A] capitalize">
            {menuItems.find(i => i.id === activeTab)?.label}
          </h1>
          <div className="flex items-center gap-4">
            <button className="p-2.5 rounded-full bg-gray-50 text-gray-500 hover:text-[#00B795] transition-colors relative cursor-pointer">
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

function SecaoPainel({ stats, meusAnuncios, solicitacoes, onAceitar, onRecusar, onNovoAnuncio }) {
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
              className="flex items-center gap-2 text-xs font-bold text-[#00B795] bg-[#00B795]/10 px-4 py-2 rounded-lg hover:bg-[#00B795]/20 transition-colors cursor-pointer uppercase tracking-widest"
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
                <div key={anuncio._id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    {anuncio.fotos && anuncio.fotos.length > 0 ? (
                      <img src={anuncio.fotos[0]} alt={anuncio.titulo} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0 flex items-center justify-center ">
                        <LuPackageX size={20} className="text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-[#1A1A1A] text-sm group-hover:text-[#00B795] transition-colors">{anuncio.titulo}</h3>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">{anuncio.precos.precoPorDia}/dia • 0 reservas</p> {/* TODO: trocar 0 fixo por contagem real de reservas quando existir */}
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-md ${
                    anuncio.status === 'publicado' ? 'bg-[#00B795]/10 text-[#00B795]' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {anuncio.status}
                  </span>
                </div>
              ))
            )}

          </div>
        </section>

        <SecaoSolicitacoes solicitacoes={solicitacoes} onAceitar={onAceitar} onRecusar={onRecusar} />
      </div>
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
                  <LuCheck size={14} className="text-[#00B795]" /> Aceitar
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