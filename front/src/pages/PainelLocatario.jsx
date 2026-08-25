import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiRequest } from '../services/api';
import logo from '../assets/logo.png';
import { BotaoAvaliar } from '../components/BotaoAvaliar';
import { PainelMensagens } from '../components/PainelMensagens';

import {
  LuLayoutDashboard,
  LuPackage,
  LuSend,
  LuWallet,
  LuMessageSquare,
  LuSettings,
  LuCalendar,
  LuMailWarning,
  LuBell,
  LuX,
  LuCircleCheckBig,
  LuTrash2,
  LuShieldCheck,
  LuTriangleAlert
} from "react-icons/lu";

export default function PainelLocatario() {
  const [activeTab, setActiveTab] = useState('painel');
  const navigate = useNavigate();
  const location = useLocation();

  const usuarioLogado = JSON.parse(localStorage.getItem('dadosUsuario'));

  const [dadosLocatario, setDadosLocatario] = useState(null);

  const [abaAlugueis, setAbaAlugueis] = useState('andamento');
  const [abaPagamentos, setAbaPagamentos] = useState('pendentes');

  const [todosAlugueis, setTodosAlugueis] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);
  const [mensagensNaoLidas, setMensagensNaoLidas] = useState(0);

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

  const solicitacoesEnviadas = useMemo(
    () => todosAlugueis.filter(a => a.status === 'pendente'),
    [todosAlugueis]
  );

  const alugueis = useMemo(() => ({
    andamento: todosAlugueis.filter(a => a.status === 'aceito' || a.status === 'andamento'),
    pendente: todosAlugueis.filter(a => a.status === 'pendente'),
    concluido: todosAlugueis.filter(a => a.status === 'concluido'),
  }), [todosAlugueis]);

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
    } catch (e) {
      alert(e.message);
    }
  }

  async function pagarAgora(id) {
    try {
      await apiRequest(`/api/pagamentos/${id}/status`, {
        method: 'PATCH',
        body: { status: 'confirmado' }
      })
      setPagamentos(prev => prev.map(p => p._id === id ? { ...p, status: 'confirmado' } : p));
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
      setDadosLocatario(data.usuario);

      if (novoObjetivo === 'locador') {
        navigate('/painelLocador', { replace: true });
      }
    } catch (e) {
      alert(e.message);
    }
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
          usuarioLogadoId={usuarioLogado?.id}
        />;
      case 'alugueis':
        return <SecaoAlugueis alugueis={alugueis} abaAlugueis={abaAlugueis} setAbaAlugueis={setAbaAlugueis} usuarioLogadoId={usuarioLogado?.id} />;
      case 'solicitacoes':
        return <SecaoSolicitacoesEnviadas solicitacoesEnviadas={solicitacoesEnviadas} onCancelarSolicitacao={cancelarSolicitacao} />;
      case 'pagamentos':
        return <SecaoPagamentos pagamentos={pagamentosPorAba} abaPagamentos={abaPagamentos} setAbaPagamentos={setAbaPagamentos} onPagarAgora={pagarAgora} />;
      case 'mensagens':
        return <PainelMensagens
          usuarioLogadoId={usuarioLogado?.id}
          corPrimaria="#0068F3"
          conversaParaAbrir={location.state?.abrirConversa}
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
                  <Icon size={16} className={isActive ? 'text-[#0068F3]' : 'text-gray-400'} />
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
                {dadosLocatario?.avatar ? (
                  <img src={dadosLocatario.avatar} alt={dadosLocatario.nome} className="w-full h-full object-cover" />
                ) : (
                  dadosLocatario?.nome?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <div className="hidden lg:block text-left min-w-0">
                <p className="text-[13px] font-semibold text-[#1A1A1A] whitespace-nowrap leading-tight group-hover:text-[#0068F3] transition-colors">
                  {dadosLocatario?.nome ? dadosLocatario.nome.split(' ').slice(0, 2).join(' ') : 'Carregando...'}
                </p>
                <p className="text-[11px] text-gray-400 leading-tight">Locatário</p>
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
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    andamento: { label: 'Em andamento', dot: 'bg-[#0F6E56]', text: 'text-[#0F6E56]', bg: 'bg-[#0F6E56]/[0.08]' },
    aceito: { label: 'Em andamento', dot: 'bg-[#0F6E56]', text: 'text-[#0F6E56]', bg: 'bg-[#0F6E56]/[0.08]' },
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
          className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all cursor-pointer ${
            atual === aba.key
              ? 'bg-white text-[#1A1A1A] shadow-sm'
              : 'text-gray-500 hover:text-[#1A1A1A]'
          }`}
        >
          {aba.label}
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

function ListaAlugueis({ alugueis, aba, usuarioLogadoId }) {
  if (alugueis.length === 0) {
    return <EstadoVazio texto="Nenhum aluguel nesta categoria" />;
  }

  return alugueis.map((aluguel) => (
    <div key={aluguel._id} className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 rounded-xl transition-colors border-b border-gray-100 last:border-0">
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

      <div className="flex items-center gap-4 shrink-0">
        <StatusPill status={aluguel.status} />
        <span className="font-semibold text-[#1A1A1A] text-sm w-16 text-right tabular-nums">R$ {aluguel.precoTotal}</span>

        {aba === 'concluido' && aluguel.locador && (
          <BotaoAvaliar
            aluguelId={aluguel._id}
            autorId={usuarioLogadoId}
            nomeAvaliado={aluguel.locador.nome}
          />
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

function SecaoAlugueis({ alugueis, abaAlugueis, setAbaAlugueis, usuarioLogadoId }) {
  return (
    <CardSecao
      titulo="Meus aluguéis"
      acao={
        <AbaFiltro
          abas={[
            { key: 'andamento', label: 'Em andamento' },
            { key: 'pendente', label: 'Pendente' },
            { key: 'concluido', label: 'Concluído' }
          ]}
          atual={abaAlugueis}
          onChange={setAbaAlugueis}
        />
      }
    >
      <ListaAlugueis alugueis={alugueis[abaAlugueis]} aba={abaAlugueis} usuarioLogadoId={usuarioLogadoId} />
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

function SecaoPainel({ stats, toneClasses, alugueis, pagamentos, solicitacoesEnviadas, abaAlugueis, setAbaAlugueis, abaPagamentos, setAbaPagamentos, onCancelarSolicitacao, onPagarAgora, usuarioLogadoId }) {
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

      <SecaoAlugueis alugueis={alugueis} abaAlugueis={abaAlugueis} setAbaAlugueis={setAbaAlugueis} usuarioLogadoId={usuarioLogadoId} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SecaoSolicitacoesEnviadas solicitacoesEnviadas={solicitacoesEnviadas} onCancelarSolicitacao={onCancelarSolicitacao} />
        <SecaoPagamentos pagamentos={pagamentos} abaPagamentos={abaPagamentos} setAbaPagamentos={setAbaPagamentos} onPagarAgora={onPagarAgora} />
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