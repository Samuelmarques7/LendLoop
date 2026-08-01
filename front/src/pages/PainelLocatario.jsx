import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

import {
  LuLayoutDashboard,
  LuPackage,
  LuSend,
  LuWallet,
  LuMessageSquare,
  LuUser,
  LuSettings,
  LuCalendar,
  LuMailWarning,
  LuBell,
  LuX,
  LuCircleCheckBig
} from "react-icons/lu";

export default function PainelLocatario() {
  const [activeTab, setActiveTab] = useState('painel');
  const navigate = useNavigate();

  const [abaAlugueis, setAbaAlugueis] = useState('andamento');
  const [abaPagamentos, setAbaPagamentos] = useState('pendentes');

  const [solicitacoesEnviadas, setSolicitacoesEnviadas] = useState([]);
  const [alugueis, setAlugueis] = useState({
    andamento: [],
    pendente: [],
    concluido: []
  });
  const [pagamentos, setPagamentos] = useState({
    pendentes: [],
    confirmados: []
  });

  const stats = [
    { id: 1, titulo: "Próximos Aluguéis", valor: "0", icon: LuCalendar, color: "text-[#00639E]", bg: "bg-blue-50" },
    { id: 2, titulo: "Solicitações Pendentes", valor: String(solicitacoesEnviadas.length), icon: LuMailWarning, color: "text-orange-500", bg: "bg-orange-50" },
    { id: 3, titulo: "Pagamentos Pendentes", valor: `R$ ${pagamentos.pendentes.reduce((soma, p) => soma + p.valor, 0)}`, icon: LuWallet, color: "text-[#00B795]", bg: "bg-[#00B795]/10" },
    { id: 4, titulo: "Mensagens Não Lidas", valor: "0", icon: LuMessageSquare, color: "text-[#05BFBE]", bg: "bg-[#05BFBE]/10" }
  ];

  const menuItems = [
    { id: 'painel', label: 'Painel', icon: LuLayoutDashboard },
    { id: 'alugueis', label: 'Meus Aluguéis', icon: LuPackage },
    { id: 'solicitacoes', label: 'Solicitações Enviadas', icon: LuSend },
    { id: 'pagamentos', label: 'Pagamentos', icon: LuWallet },
    { id: 'mensagens', label: 'Mensagens', icon: LuMessageSquare },
    { id: 'perfil', label: 'Perfil', icon: LuUser },
    { id: 'config', label: 'Configurações', icon: LuSettings },
  ];

  function cancelarSolicitacao(id) {
    setSolicitacoesEnviadas(prev => prev.filter(s => s.id !== id));
  }

  function renderConteudo() {
    switch (activeTab) {
      case 'painel':
        return <SecaoPainel
          stats={stats}
          alugueis={alugueis}
          pagamentos={pagamentos}
          solicitacoesEnviadas={solicitacoesEnviadas}
          abaAlugueis={abaAlugueis}
          setAbaAlugueis={setAbaAlugueis}
          abaPagamentos={abaPagamentos}
          setAbaPagamentos={setAbaPagamentos}
          onCancelarSolicitacao={cancelarSolicitacao}
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
            <div className="w-10 h-10 rounded-full bg-[#00639E] text-white flex items-center justify-center font-bold text-lg">
              U
            </div>
            <div>
              <p className="text-sm font-bold text-[#1A1A1A]">Usuário LendLoop</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Locatário</p>
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

function SecaoPainel({ stats, alugueis, pagamentos, solicitacoesEnviadas, abaAlugueis, setAbaAlugueis, abaPagamentos, setAbaPagamentos, onCancelarSolicitacao }) {
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

      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-[#1A1A1A]">Meus Aluguéis</h2>
          <div className="flex gap-2">
            {[
              { key: 'andamento', label: 'Em Andamento' },
              { key: 'pendente', label: 'Pendente' },
              { key: 'concluido', label: 'Concluído' }
            ].map((aba) => (
              <button
                key={aba.key}
                onClick={() => setAbaAlugueis(aba.key)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                  abaAlugueis === aba.key
                    ? 'bg-[#1A1A1A] text-white'
                    : 'bg-gray-50 text-gray-400 hover:text-[#1A1A1A]'
                }`}
              >
                {aba.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-2">
          {alugueis[abaAlugueis].length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <LuCircleCheckBig size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-bold">Nenhum aluguel nesta categoria</p>
            </div>
          ) : (
            alugueis[abaAlugueis].map((aluguel) => (
              <div key={aluguel.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors group">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0"></div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-[#1A1A1A] text-sm group-hover:text-[#00B795] transition-colors truncate">{aluguel.item}</h3>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">por {aluguel.dono} • {aluguel.periodo}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-md ${
                    aluguel.status === 'Ativo' ? 'bg-[#00B795]/10 text-[#00B795]' :
                    aluguel.status === 'Concluído' ? 'bg-gray-100 text-gray-500' :
                    'bg-orange-50 text-orange-500'
                  }`}>
                    {aluguel.status}
                  </span>

                  <span className="font-black text-[#1A1A1A] text-sm w-16 text-right">R$ {aluguel.precoTotal}</span>

                  {abaAlugueis === 'andamento' && (
                    <button className="bg-[#1A1A1A] text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-black transition-colors cursor-pointer shadow-sm">
                      Item Devolvido
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-[#1A1A1A]">Solicitações Enviadas</h2>
          </div>
          <div className="p-2 flex-grow">
            {solicitacoesEnviadas.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <LuCircleCheckBig size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-bold">Nenhuma solicitação enviada</p>
              </div>
            ) : (
              solicitacoesEnviadas.map((solicitacao) => (
                <div key={solicitacao.id} className="p-4 hover:bg-gray-50 rounded-2xl transition-colors border border-transparent hover:border-gray-100 mb-2">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-[#1A1A1A] text-sm">{solicitacao.item}</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{solicitacao.periodo}</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-orange-50 text-orange-500 px-3 py-1.5 rounded-md shrink-0">
                      Pendente
                    </span>
                  </div>
                  <button
                    onClick={() => onCancelarSolicitacao(solicitacao.id)}
                    className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold py-2.5 rounded-xl hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors cursor-pointer shadow-sm"
                  >
                    <LuX size={14} /> Cancelar Solicitação
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-[#1A1A1A]">Pagamentos</h2>
            <div className="flex gap-2">
              {[
                { key: 'pendentes', label: 'Pendentes' },
                { key: 'confirmados', label: 'Confirmados' }
              ].map((aba) => (
                <button
                  key={aba.key}
                  onClick={() => setAbaPagamentos(aba.key)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                    abaPagamentos === aba.key
                      ? 'bg-[#1A1A1A] text-white'
                      : 'bg-gray-50 text-gray-400 hover:text-[#1A1A1A]'
                  }`}
                >
                  {aba.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-2 flex-grow">
            {pagamentos[abaPagamentos].length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <LuCircleCheckBig size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-bold">Nenhum pagamento nesta categoria</p>
              </div>
            ) : (
              pagamentos[abaPagamentos].map((pagamento) => (
                <div key={pagamento.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors">
                  <div className="min-w-0">
                    <h3 className="font-bold text-[#1A1A1A] text-sm truncate">{pagamento.item}</h3>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">Vencimento: {pagamento.vencimento}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-black text-[#1A1A1A] text-sm">R$ {pagamento.valor}</span>

                    {pagamento.emAtraso && (
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-red-50 text-red-500 px-2.5 py-1.5 rounded-md">
                        Em atraso
                      </span>
                    )}

                    {abaPagamentos === 'pendentes' && (
                      <button className="bg-[#00B795] text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-[#006861] transition-colors cursor-pointer shadow-sm">
                        Pagar Agora
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}