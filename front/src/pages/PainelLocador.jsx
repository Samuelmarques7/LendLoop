import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LuLayoutDashboard, 
  LuPackage, 
  LuInbox, 
  LuCalendarDays, 
  LuCircleDollarSign, 
  LuMessageSquare, 
  LuUser, 
  LuSettings,
  LuTrendingUp,
  LuAlertCircle,
  LuCheckCircle2,
  LuXCircle,
  LuPlus,
  LuBell
} from "react-icons/lu";

export function PainelLocador() {
  const [activeTab, setActiveTab] = useState('painel');
  const navigate = useNavigate();

  const [solicitacoes, setSolicitacoes] = useState([
    { id: 1, item: "Furadeira Profissional", cliente: "Roberto Oliveira", data: "28/01/2025" },
    { id: 2, item: "Kit Câmera DSLR", cliente: "Marcos Castro", data: "20/01/2025" }
  ]);

  const stats = [
    { id: 1, titulo: "Ganhos Este Mês", valor: "R$ 1.240", icon: LuCircleDollarSign, color: "text-[#00B795]", bg: "bg-[#00B795]/10" },
    { id: 2, titulo: "Anúncios Ativos", valor: "8", icon: LuPackage, color: "text-[#1A1A1A]", bg: "bg-gray-100" },
    { id: 3, titulo: "Solicitações Pendentes", valor: String(solicitacoes.length), icon: LuAlertCircle, color: "text-orange-500", bg: "bg-orange-50" },
    { id: 4, titulo: "Mensagens Não Lidas", valor: "2", icon: LuMessageSquare, color: "text-[#00639E]", bg: "bg-blue-50" }
  ];

  const meusAnuncios = [
    { id: 1, nome: "Furadeira Profissional", preco: "R$ 15/dia", reservas: 5, status: "Ativo" },
    { id: 2, nome: "Kit Câmera DSLR", preco: "R$ 35/dia", reservas: 7, status: "Ativo" },
    { id: 3, nome: "Barraca de Camping 4 Pessoas", preco: "R$ 25/dia", reservas: 3, status: "Pausado" }
  ];

  const menuItems = [
    { id: 'painel', label: 'Painel', icon: LuLayoutDashboard },
    { id: 'anuncios', label: 'Meus Anúncios', icon: LuPackage },
    { id: 'solicitacoes', label: 'Solicitações Recebidas', icon: LuInbox },
    { id: 'calendario', label: 'Calendário', icon: LuCalendarDays },
    { id: 'ganhos', label: 'Ganhos', icon: LuTrendingUp },
    { id: 'mensagens', label: 'Mensagens', icon: LuMessageSquare },
    { id: 'perfil', label: 'Perfil', icon: LuUser },
    { id: 'config', label: 'Configurações', icon: LuSettings },
  ];

  function aceitarSolicitacao(id) {
    setSolicitacoes(prev => prev.filter(s => s.id !== id));
  }

  function recusarSolicitacao(id) {
    setSolicitacoes(prev => prev.filter(s => s.id !== id));
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
      case 'anuncios':
        return (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
            <LuPackage size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold">Seção de Anúncios</p>
            <p className="text-sm mt-1">Conteúdo a implementar</p>
          </div>
        );
      case 'solicitacoes':
        return (
          <SecaoSolicitacoes
            solicitacoes={solicitacoes}
            onAceitar={aceitarSolicitacao}
            onRecusar={recusarSolicitacao}
          />
        );
      case 'ganhos':
        return (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
            <LuTrendingUp size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold">Seção de Ganhos</p>
            <p className="text-sm mt-1">Conteúdo a implementar</p>
          </div>
        );
      case 'mensagens':
        return (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
            <LuMessageSquare size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold">Seção de Mensagens</p>
            <p className="text-sm mt-1">Conteúdo a implementar</p>
          </div>
        );
      default:
        return (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
            <p className="font-bold capitalize">{menuItems.find(i => i.id === activeTab)?.label}</p>
            <p className="text-sm mt-1">Conteúdo a implementar</p>
          </div>
        );
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans flex text-[#1A1A1A]">
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col sticky top-0 h-screen shadow-sm z-10">
        <div className="h-20 flex items-center px-8 border-b border-gray-100">
          <div className="text-2xl font-black tracking-tighter text-[#1A1A1A] uppercase">
            PROJETO
          </div>
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
              C
            </div>
            <div>
              <p className="text-sm font-bold text-[#1A1A1A]">Carlos Silva</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Locador</p>
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
    <>
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
            {meusAnuncios.map((anuncio) => (
              <div key={anuncio.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0"></div>
                  <div>
                    <h3 className="font-bold text-[#1A1A1A] text-sm group-hover:text-[#00B795] transition-colors">{anuncio.nome}</h3>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">{anuncio.preco} • {anuncio.reservas} reservas</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-md ${
                  anuncio.status === 'Ativo' ? 'bg-[#00B795]/10 text-[#00B795]' : 'bg-gray-100 text-gray-500'
                }`}>
                  {anuncio.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        <SecaoSolicitacoes solicitacoes={solicitacoes} onAceitar={onAceitar} onRecusar={onRecusar} />
      </div>
    </>
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
          <div className="p-8 text-center text-gray-400">
            <LuCheckCircle2 size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-bold">Nenhuma solicitação pendente</p>
          </div>
        ) : (
          solicitacoes.map((req) => (
            <div key={req.id} className="p-4 hover:bg-gray-50 rounded-2xl transition-colors border border-transparent hover:border-gray-100 mb-2">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-[#1A1A1A] text-sm">{req.item}</h3>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    Solicitado por <span className="font-bold text-[#1A1A1A]">{req.cliente}</span>
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Data: {req.data}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest bg-orange-50 text-orange-500 px-3 py-1.5 rounded-md">
                  Pendente
                </span>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => onAceitar(req.id)}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#1A1A1A] text-white text-xs font-bold py-2.5 rounded-xl hover:bg-black transition-colors cursor-pointer shadow-sm"
                >
                  <LuCheckCircle2 size={14} className="text-[#00B795]" /> Aceitar
                </button>
                <button
                  onClick={() => onRecusar(req.id)}
                  className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold py-2.5 rounded-xl hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors cursor-pointer shadow-sm"
                >
                  <LuXCircle size={14} /> Recusar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
