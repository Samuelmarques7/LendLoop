import { useEffect, useMemo, useState } from 'react';
import { LuArrowRight, LuBell, LuCheck, LuCheckCheck, LuCircleCheck, LuCircleX, LuLoaderCircle, LuMaximize2, LuSearch, LuShieldCheck, LuSparkles, LuUserPlus, LuUsers, LuX } from 'react-icons/lu';
import { Header } from '../components/Header';
import { apiRequest, API_URL } from '../services/api';
import { useConfirmacao } from '../context/ConfirmacaoContext';

const ABAS = [
  { valor: 'pendente', titulo: 'Pendentes' },
  { valor: 'aprovado', titulo: 'Aprovados' },
  { valor: 'rejeitado', titulo: 'Rejeitados' },
];

const SECOES = [
  { valor: 'verificacoes', titulo: 'Verificações', icone: LuShieldCheck },
  { valor: 'notificacoes', titulo: 'Notificações', icone: LuBell },
  { valor: 'administradores', titulo: 'Administradores', icone: LuUsers },
];

function formatarData(data) {
  return new Date(data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export default function PainelAdmin() {
  const confirmar = useConfirmacao();
  const [secaoAtiva, setSecaoAtiva] = useState('verificacoes');
  const [abaAtiva, setAbaAtiva] = useState('pendente');
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [selecionado, setSelecionado] = useState(null);
  const [urlsDocumentos, setUrlsDocumentos] = useState({ documentoFrente: '', documentoVerso: '', selfie: '' });
  const [carregandoDocumentos, setCarregandoDocumentos] = useState(false);
  const [motivoRejeicao, setMotivoRejeicao] = useState('');
  const [processando, setProcessando] = useState(false);
  const [imagemExpandida, setImagemExpandida] = useState(null);
  const [buscaPerfil, setBuscaPerfil] = useState('');
  const [sugestoesPerfis, setSugestoesPerfis] = useState([]);
  const [perfilParaPromover, setPerfilParaPromover] = useState(null);
  const [carregandoBusca, setCarregandoBusca] = useState(false);
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [promovendo, setPromovendo] = useState(false);
  const [mensagemAdmin, setMensagemAdmin] = useState('');
  const [notificacoes, setNotificacoes] = useState([]);
  const [carregandoNotificacoes, setCarregandoNotificacoes] = useState(false);
  const [contagens, setContagens] = useState({ pendente: 0, aprovado: 0, rejeitado: 0 });
  const [administradores, setAdministradores] = useState([]);
  const [carregandoAdministradores, setCarregandoAdministradores] = useState(false);

  const dadosUsuario = JSON.parse(localStorage.getItem('dadosUsuario') || 'null');
  const usuarioId = dadosUsuario?.id;
  const notificacoesDeDocumentos = useMemo(
    () => notificacoes.filter((notificacao) => notificacao.tipo === 'verificacao'),
    [notificacoes]
  );
  const documentosNaoLidos = notificacoesDeDocumentos.filter((notificacao) => !notificacao.lida).length;

  useEffect(() => {
    document.title = 'Painel Admin | LendLoop';
    return () => { document.title = 'LendLoop'; };
  }, []);

  useEffect(() => {
    if (secaoAtiva !== 'verificacoes') return;
    buscarUsuarios(abaAtiva);
    setSelecionado(null);
  }, [abaAtiva, secaoAtiva]);

  useEffect(() => {
    if (!usuarioId) return;

    async function buscarNotificacoes() {
      setCarregandoNotificacoes(true);
      try {
        const dados = await apiRequest(`/api/notificacoes/${usuarioId}`);
        setNotificacoes(dados);
      } catch {
        // A fila de KYC continua disponível mesmo se a central falhar.
      } finally {
        setCarregandoNotificacoes(false);
      }
    }

    buscarNotificacoes();
    const intervalo = setInterval(buscarNotificacoes, 15000);
    return () => clearInterval(intervalo);
  }, [usuarioId]);

  useEffect(() => {
    async function buscarResumo() {
      try {
        const listas = await Promise.all(ABAS.map((aba) => apiRequest(`/api/admin/verificacoes?status=${aba.valor}`)));
        setContagens(Object.fromEntries(ABAS.map((aba, indice) => [aba.valor, listas[indice].length])));
      } catch {
        // A listagem principal continua funcional mesmo se o resumo falhar.
      }
    }
    buscarResumo();
  }, []);

  useEffect(() => {
    buscarAdministradores();
  }, []);

  useEffect(() => {
    const termo = buscaPerfil.trim();
    if (perfilParaPromover || termo.length < 2) {
      setSugestoesPerfis([]);
      setCarregandoBusca(false);
      return;
    }

    let ativo = true;
    const temporizador = setTimeout(async () => {
      setCarregandoBusca(true);
      try {
        const resultados = await apiRequest(`/api/admin/usuarios/busca?q=${encodeURIComponent(termo)}`);
        if (ativo) {
          setSugestoesPerfis(resultados);
          setBuscaAberta(true);
        }
      } catch {
        if (ativo) setSugestoesPerfis([]);
      } finally {
        if (ativo) setCarregandoBusca(false);
      }
    }, 280);

    return () => {
      ativo = false;
      clearTimeout(temporizador);
    };
  }, [buscaPerfil, perfilParaPromover]);

  async function buscarAdministradores() {
    setCarregandoAdministradores(true);
    try {
      setAdministradores(await apiRequest('/api/admin/usuarios'));
    } catch (error) {
      setErro(error.message || 'Não foi possível carregar os administradores.');
    } finally {
      setCarregandoAdministradores(false);
    }
  }

  async function buscarUsuarios(status) {
    setCarregando(true);
    setErro('');
    try {
      const dados = await apiRequest(`/api/admin/verificacoes?status=${status}`);
      setUsuarios(dados);
      setContagens((atual) => ({ ...atual, [status]: dados.length }));
     return dados;
    } catch (error) {
      setErro(error.message || 'Não foi possível carregar a lista de usuários.');
      return [];
    } finally {
      setCarregando(false);
    }
  }

  async function buscarImagem(usuarioIdParaBusca, campo) {
    try {
      const token = localStorage.getItem('token');

      const resposta = await fetch(
        `${API_URL}/api/admin/verificacoes/${usuarioIdParaBusca}/documento/${campo}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!resposta.ok) return '';

      return URL.createObjectURL(await resposta.blob());
    } catch {
      return '';
    }
  }

  async function abrirVerificacao(usuario) {
    setSelecionado(usuario);
    setMotivoRejeicao('');
    setUrlsDocumentos({ documentoFrente: '', documentoVerso: '', selfie: '' });
    setCarregandoDocumentos(true);
    setErro('');

    const [frente, verso, selfie] = await Promise.all([
      buscarImagem(usuario._id, 'documentoFrente'),
      buscarImagem(usuario._id, 'documentoVerso'),
      buscarImagem(usuario._id, 'selfie'),
    ]);

    setUrlsDocumentos({
      documentoFrente: frente,
      documentoVerso: verso,
      selfie
    });

    setCarregandoDocumentos(false);
  }
  async function decidir(acao) {
    if (!selecionado) return;
    if (acao === 'rejeitar' && !motivoRejeicao.trim()) {
      setErro('Escreva o motivo da rejeição antes de confirmar.');
      return;
    }

    setProcessando(true);
    setErro('');
    try {
      await apiRequest(`/api/admin/verificacoes/${selecionado._id}`, {
        method: 'PATCH',
        body: { acao, motivo: motivoRejeicao },
      });
      setSelecionado(null);
      buscarUsuarios(abaAtiva);
    } catch (error) {
      setErro(error.message);
    } finally {
      setProcessando(false);
    }
  }

  async function promoverAdministrador(evento) {
    evento.preventDefault();
    if (!perfilParaPromover || promovendo) return;

    const email = perfilParaPromover.email;
    const confirmou = await confirmar({
      titulo: 'Conceder acesso administrativo?',
      mensagem: `${email} poderá visualizar documentos de identidade e tomar decisões administrativas.`,
      textoConfirmar: 'Conceder acesso',
      textoCancelar: 'Cancelar',
    });
    if (!confirmou) return;

    setPromovendo(true);
    setMensagemAdmin('');
    setErro('');
    try {
      const resposta = await apiRequest('/api/admin/usuarios/promover', {
        method: 'PATCH',
        body: { email }
      });
      setMensagemAdmin(resposta.mensagem);
      setBuscaPerfil('');
      setPerfilParaPromover(null);
      setSugestoesPerfis([]);
      buscarAdministradores();
    } catch (error) {
      setErro(error.message);
    } finally {
      setPromovendo(false);
    }
  }

  async function marcarNotificacaoComoLida(id) {
    const alvo = notificacoes.find((notificacao) => notificacao._id === id);
    if (!alvo || alvo.lida) return;
    setNotificacoes((atual) => atual.map((notificacao) => notificacao._id === id ? { ...notificacao, lida: true } : notificacao));
    try {
      await apiRequest(`/api/notificacoes/${id}/lida`, { method: 'PATCH' });
    } catch {
      setNotificacoes((atual) => atual.map((notificacao) => notificacao._id === id ? { ...notificacao, lida: false } : notificacao));
    }
  }

  async function marcarTodasComoLidas() {
    if (documentosNaoLidos === 0) return;
    const anteriores = notificacoes;
    const ids = notificacoesDeDocumentos.filter((notificacao) => !notificacao.lida).map((notificacao) => notificacao._id);
    setNotificacoes((atual) => atual.map((notificacao) => ids.includes(notificacao._id) ? { ...notificacao, lida: true } : notificacao));
    try {
      await Promise.all(ids.map((id) => apiRequest(`/api/notificacoes/${id}/lida`, { method: 'PATCH' })));
    } catch {
      setNotificacoes(anteriores);
    }
  }

  async function abrirPelaNotificacao(notificacao) {
    marcarNotificacaoComoLida(notificacao._id);
    setSecaoAtiva('verificacoes');
    setAbaAtiva('pendente');
    const fila = await buscarUsuarios('pendente');
    const usuario = fila.find((item) => item._id === notificacao.estadoNavegacao?.usuarioId);
    if (usuario) abrirVerificacao(usuario);
  }

  return (
    <div className="page-shell flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <section className="relative mb-7 overflow-hidden rounded-[2rem] bg-verde-escuro px-6 py-7 text-white shadow-[0_20px_55px_-28px_rgba(3,45,84,0.75)] sm:px-8 lg:px-10">
          <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-ciano/20 blur-3xl" aria-hidden="true" />
          <div className="absolute bottom-0 right-1/4 h-28 w-28 rounded-full bg-verde-agua/10 blur-2xl" aria-hidden="true" />
          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-verde-agua"><LuSparkles size={14} /> Visão operacional</span>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Central administrativa</h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">Acompanhe a segurança da comunidade, analise identidades e controle quem tem acesso às operações.</p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <ResumoCard valor={contagens.pendente} rotulo="Pendentes" destaque />
              <ResumoCard valor={documentosNaoLidos} rotulo="Não lidas" />
              <ResumoCard valor={administradores.length || '—'} rotulo="Admins" />
            </div>
          </div>
        </section>

        <nav className="mb-7 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm" aria-label="Áreas administrativas">
          {SECOES.map((secao) => {
            const Icone = secao.icone;
            const ativa = secaoAtiva === secao.valor;
            const numero = secao.valor === 'verificacoes' ? contagens.pendente : secao.valor === 'notificacoes' ? documentosNaoLidos : administradores.length;
            return <button key={secao.valor} onClick={() => { setSecaoAtiva(secao.valor); setErro(''); }} aria-current={ativa ? 'page' : undefined} className={`inline-flex min-w-max flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all ${ativa ? 'bg-verde-escuro text-white shadow-md shadow-verde-escuro/15' : 'text-slate-500 hover:bg-slate-50 hover:text-verde-escuro'}`}><Icone size={17} /> {secao.titulo}<span className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] ${ativa ? 'bg-white/15 text-white' : numero > 0 ? 'bg-ciano/10 text-ciano' : 'bg-slate-100 text-slate-400'}`}>{numero}</span></button>;
          })}
        </nav>

        {erro && <div role="alert" className="mb-6 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-600"><LuCircleX size={18} /> {erro}</div>}

        {secaoAtiva === 'administradores' && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,.85fr)]">
            <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5 sm:px-7"><p className="text-xs font-bold uppercase tracking-[.16em] text-ciano">Acessos ativos</p><div className="mt-1 flex items-end justify-between gap-4"><div><h2 className="text-xl font-black text-verde-escuro">Administradores</h2><p className="mt-1 text-sm text-slate-500">Pessoas com acesso às operações e documentos.</p></div><span className="rounded-full bg-verde-escuro/5 px-3 py-1 text-xs font-bold text-verde-escuro">{administradores.length} no total</span></div></div>
              <div className="divide-y divide-slate-100">
                {carregandoAdministradores ? <EstadoCarregando texto="Carregando acessos..." /> : administradores.length === 0 ? <EstadoVazio icone={LuUsers} titulo="Nenhum administrador encontrado" texto="Os acessos administrativos aparecerão aqui." /> : administradores.map((admin) => <div key={admin._id} className="flex items-center gap-4 px-6 py-4 sm:px-7"><span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-verde-escuro text-sm font-black text-white">{admin.avatar ? <img src={admin.avatar} alt="" className="h-full w-full object-cover" /> : admin.nome?.charAt(0).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate font-bold text-slate-800">{admin.nome}</span><span className="block truncate text-sm text-slate-500">{admin.email}</span></span><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${admin.ativo === false ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-700'}`}><span className={`h-1.5 w-1.5 rounded-full ${admin.ativo === false ? 'bg-red-400' : 'bg-emerald-500'}`} />{admin.ativo === false ? 'Inativo' : 'Ativo'}</span></div>)}
              </div>
            </section>
            <section className="h-fit rounded-3xl border border-ciano/20 bg-gradient-to-br from-ciano/[.08] to-white p-6 shadow-sm sm:p-7">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-ciano shadow-sm"><LuUserPlus size={22} /></span>
              <h2 className="mt-5 text-xl font-black text-verde-escuro">Conceder novo acesso</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">Busque pelo nome ou e-mail e escolha o perfil correto antes de conceder acesso às operações.</p>
              <form onSubmit={promoverAdministrador} className="mt-6 space-y-3">
                <label htmlFor="busca-admin" className="text-xs font-bold uppercase tracking-wider text-slate-500">Buscar perfil</label>
                <div className="relative">
                  <LuSearch className="absolute left-4 top-[1.15rem] z-10 text-slate-400" size={18} />
                  <input id="busca-admin" type="search" role="combobox" autoComplete="off" aria-expanded={buscaAberta && !perfilParaPromover} aria-controls="sugestoes-admin" value={buscaPerfil} onFocus={() => setBuscaAberta(true)} onBlur={() => setTimeout(() => setBuscaAberta(false), 120)} onChange={(evento) => { setBuscaPerfil(evento.target.value); setPerfilParaPromover(null); setMensagemAdmin(''); }} placeholder="Digite o nome ou e-mail" className={`w-full rounded-xl border bg-white py-3.5 pl-11 pr-11 text-sm outline-none transition focus:ring-2 ${perfilParaPromover ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-100' : 'border-slate-200 focus:border-ciano focus:ring-ciano/20'}`} />
                  {carregandoBusca ? <LuLoaderCircle className="absolute right-4 top-[1.1rem] animate-spin text-ciano" size={19} /> : perfilParaPromover && <LuCircleCheck className="absolute right-4 top-[1.1rem] text-emerald-500" size={19} />}
                  {buscaAberta && !perfilParaPromover && buscaPerfil.trim().length >= 2 && <div id="sugestoes-admin" role="listbox" className="absolute inset-x-0 top-[calc(100%+.5rem)] z-30 max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
                    {!carregandoBusca && sugestoesPerfis.length === 0 ? <p className="px-4 py-5 text-center text-sm text-slate-400">Nenhum perfil disponível encontrado.</p> : sugestoesPerfis.map((perfil) => <button key={perfil._id} type="button" role="option" aria-selected={perfilParaPromover?._id === perfil._id} onMouseDown={(evento) => evento.preventDefault()} onClick={() => { setPerfilParaPromover(perfil); setBuscaPerfil(perfil.nome); setBuscaAberta(false); setSugestoesPerfis([]); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-ciano/5"><span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-verde-escuro text-sm font-black text-white">{perfil.avatar ? <img src={perfil.avatar} alt="" className="h-full w-full object-cover" /> : perfil.nome.charAt(0).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-800">{perfil.nome}</span><span className="block truncate text-xs text-slate-500">{perfil.email}</span></span><LuArrowRight className="shrink-0 text-slate-300" /></button>)}
                  </div>}
                </div>
                {perfilParaPromover && <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3"><span className="min-w-0"><span className="block text-xs font-bold uppercase tracking-wider text-emerald-600">Perfil selecionado</span><span className="block truncate text-sm font-semibold text-emerald-800">{perfilParaPromover.email}</span></span><button type="button" onClick={() => { setPerfilParaPromover(null); setBuscaPerfil(''); }} className="shrink-0 text-xs font-bold text-emerald-700 hover:text-emerald-900">Trocar</button></div>}
                <button type="submit" disabled={promovendo || !perfilParaPromover} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-verde-escuro px-5 py-3.5 text-sm font-bold text-white transition-all hover:-translate-y-px hover:bg-azul-oceano hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-45">{promovendo ? <><LuLoaderCircle className="animate-spin" /> Concedendo acesso...</> : <>Tornar administrador <LuArrowRight /></>}</button>
              </form>
              {mensagemAdmin && <p className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"><LuCircleCheck size={18} /> {mensagemAdmin}</p>}
              <div className="mt-6 border-t border-ciano/15 pt-5"><p className="flex gap-2 text-xs leading-relaxed text-slate-500"><LuShieldCheck className="mt-0.5 shrink-0 text-ciano" size={16} /> Por segurança, a promoção exige uma confirmação antes de ser concluída.</p></div>
            </section>
          </div>
        )}

        {secaoAtiva === 'notificacoes' && (
          <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-ciano">Atualizações recentes</p><h2 className="mt-1 text-xl font-black text-verde-escuro">Notificações de identidade</h2><p className="mt-1 text-sm text-slate-500">Novos documentos enviados para análise.</p></div>{documentosNaoLidos > 0 && <button onClick={marcarTodasComoLidas} className="inline-flex items-center justify-center gap-2 rounded-xl border border-ciano/25 px-4 py-2.5 text-sm font-bold text-azul-oceano hover:bg-ciano/5"><LuCheckCheck size={17} /> Marcar como lidas</button>}</div>
            <div className="divide-y divide-slate-100">{carregandoNotificacoes ? <EstadoCarregando texto="Carregando notificações..." /> : notificacoesDeDocumentos.length === 0 ? <EstadoVazio icone={LuBell} titulo="Tudo em dia por aqui" texto="Quando alguém enviar documentos, o aviso aparecerá nesta área." /> : notificacoesDeDocumentos.map((notificacao) => <button key={notificacao._id} onClick={() => abrirPelaNotificacao(notificacao)} className={`group flex w-full items-start gap-4 px-6 py-5 text-left transition-colors hover:bg-slate-50 sm:px-7 ${!notificacao.lida ? 'bg-azul-oceano/[.035]' : ''}`}><span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ciano/10 text-ciano"><LuShieldCheck size={20} /></span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${notificacao.lida ? 'bg-slate-200' : 'bg-azul-oceano'}`} /><span className={`text-sm ${notificacao.lida ? 'font-semibold text-slate-700' : 'font-bold text-verde-escuro'}`}>{notificacao.titulo}</span></span><span className="mt-1 block text-sm text-slate-600">{notificacao.texto}</span><span className="mt-2 block text-xs text-slate-400">{formatarData(notificacao.createdAt)} · Abrir verificação</span></span><LuArrowRight className="mt-3 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-ciano" /></button>)}</div>
          </section>
        )}

        {secaoAtiva === 'verificacoes' && <>
          <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm sm:w-fit">
            {ABAS.map((aba) => <button key={aba.valor} onClick={() => setAbaAtiva(aba.valor)} aria-pressed={abaAtiva === aba.valor} className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all sm:flex-none ${abaAtiva === aba.valor ? 'bg-verde-escuro text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-verde-escuro'}`}>{aba.titulo}<span className={`rounded-full px-2 py-0.5 text-[10px] ${abaAtiva === aba.valor ? 'bg-white/15' : 'bg-slate-100 text-slate-500'}`}>{contagens[aba.valor]}</span></button>)}
          </div>
          <div className="grid gap-6 lg:grid-cols-[minmax(18rem,.8fr)_minmax(0,1.7fr)]">
            <section className="flex h-fit max-h-[680px] flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-slate-500">Solicitações</p><p className="mt-1 text-xs text-slate-400">{usuarios.length} {usuarios.length === 1 ? 'registro' : 'registros'}</p></div><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-verde-escuro/5 text-verde-escuro"><LuUsers size={18} /></span></div>
              <div className="flex-1 overflow-y-auto p-2">{carregando ? <EstadoCarregando texto="Carregando lista..." /> : usuarios.length === 0 ? <EstadoVazio compacto icone={LuCircleCheck} titulo={abaAtiva === 'pendente' ? 'Nenhuma pendência' : `Nenhum perfil ${abaAtiva}`} texto={abaAtiva === 'pendente' ? 'Novos envios aparecerão aqui automaticamente.' : 'Não há registros nesta categoria.'} /> : <div className="space-y-1">{usuarios.map((usuario) => <button key={usuario._id} onClick={() => abrirVerificacao(usuario)} className={`flex w-full items-center gap-3 rounded-2xl p-3.5 text-left transition-all ${selecionado?._id === usuario._id ? 'bg-verde-escuro text-white shadow-md' : 'hover:bg-slate-50'}`}><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black ${selecionado?._id === usuario._id ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-500'}`}>{usuario.nome.charAt(0).toUpperCase()}</span><span className="min-w-0 flex-1"><span className={`block truncate font-bold ${selecionado?._id === usuario._id ? 'text-white' : 'text-slate-800'}`}>{usuario.nome}</span><span className={`block truncate text-xs ${selecionado?._id === usuario._id ? 'text-white/60' : 'text-slate-500'}`}>{usuario.email}</span></span><LuArrowRight className={selecionado?._id === usuario._id ? 'text-white/60' : 'text-slate-300'} /></button>)}</div>}</div>
            </section>
            <section className="min-h-[360px] rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
              {!selecionado ? <EstadoVazio icone={usuarios.length === 0 ? LuCircleCheck : LuShieldCheck} titulo={usuarios.length === 0 ? 'Nada para analisar agora' : 'Selecione uma solicitação'} texto={usuarios.length === 0 ? 'A fila está organizada. Novos documentos aparecerão aqui.' : 'Os documentos e as ações de análise aparecerão neste espaço.'} /> : <div>
                <div className="mb-8 border-b border-gray-100 pb-6"><h2 className="text-2xl font-black text-verde-escuro">{selecionado.nome}</h2><div className="mt-3 flex flex-wrap gap-3 text-sm font-medium text-gray-500"><span className="rounded-full bg-gray-100 px-3 py-1">{selecionado.email}</span>{selecionado.telefone && <span className="rounded-full bg-gray-100 px-3 py-1">{selecionado.telefone}</span>}{selecionado.verificacao?.enviadoEm && <span className="rounded-full bg-verde-escuro/10 px-3 py-1 text-verde-escuro">Enviado em {new Date(selecionado.verificacao.enviadoEm).toLocaleDateString('pt-BR')}</span>}</div></div>
                {carregandoDocumentos ? <div className="flex flex-col items-center justify-center py-20 text-verde-escuro/40"><LuLoaderCircle className="mb-3 animate-spin" size={40} /><p className="font-medium">Carregando documentos seguros...</p></div> : <><h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-800">Documentos anexados</h3><div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3"><ImageCard label="Frente do documento" url={urlsDocumentos.documentoFrente} onZoom={() => setImagemExpandida(urlsDocumentos.documentoFrente)} /><ImageCard label="Verso do documento" url={urlsDocumentos.documentoVerso} onZoom={() => setImagemExpandida(urlsDocumentos.documentoVerso)} /><ImageCard label="Selfie com documento" url={urlsDocumentos.selfie} onZoom={() => setImagemExpandida(urlsDocumentos.selfie)} /></div></>}
                {abaAtiva === 'pendente' && !carregandoDocumentos && <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-6"><h3 className="mb-3 text-sm font-bold text-gray-800">Decisão de análise</h3><textarea value={motivoRejeicao} onChange={(evento) => setMotivoRejeicao(evento.target.value)} placeholder="Motivo (obrigatório apenas se for rejeitar o documento)" rows={2} className="mb-4 w-full resize-none rounded-xl border border-gray-300 bg-white p-4 text-sm outline-none focus:border-verde-escuro focus:ring-2 focus:ring-verde-escuro/20" /><div className="flex flex-col gap-4 sm:flex-row"><button onClick={() => decidir('aprovar')} disabled={processando} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-verde-agua py-3.5 font-bold text-white hover:bg-ciano disabled:opacity-50"><LuCheck size={20} /> Aprovar perfil</button><button onClick={() => decidir('rejeitar')} disabled={processando} className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-red-100 bg-white py-3.5 font-bold text-red-500 hover:bg-red-50 disabled:opacity-50"><LuX size={20} /> Rejeitar documentos</button></div></div>}
                {selecionado.verificacao?.status === 'rejeitado' && selecionado.verificacao?.motivoRejeicao && <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-5"><p className="mb-2 text-xs font-bold uppercase tracking-wider text-red-500">Motivo da rejeição</p><p className="text-sm font-medium text-red-800">{selecionado.verificacao.motivoRejeicao}</p></div>}
              </div>}
            </section>
          </div>
        </>}
      </main>
      <footer className="mt-8 border-t border-slate-200/80 bg-white/70"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10"><p>© {new Date().getFullYear()} LendLoop · Ambiente administrativo</p><p className="inline-flex items-center gap-1.5"><LuShieldCheck size={14} className="text-ciano" /> Acesso restrito e monitorado</p></div></footer>
      {imagemExpandida && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setImagemExpandida(null)}><button className="absolute right-6 top-6 text-white/50 hover:text-white" onClick={() => setImagemExpandida(null)}><LuX size={40} /></button><img src={imagemExpandida} alt="Documento em tela cheia" className="max-h-[90vh] max-w-full rounded-lg object-contain" onClick={(evento) => evento.stopPropagation()} /></div>}
    </div>
  );
}

function ResumoCard({ valor, rotulo, destaque = false }) {
  return <div className={`min-w-[5.5rem] rounded-2xl border px-3 py-3 sm:min-w-[7rem] sm:px-4 ${destaque ? 'border-verde-agua/30 bg-verde-agua/15' : 'border-white/10 bg-white/[.07]'}`}><strong className="block text-xl font-black sm:text-2xl">{valor}</strong><span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-wider text-white/55 sm:text-xs">{rotulo}</span></div>;
}

function EstadoCarregando({ texto }) {
  return <div className="flex min-h-48 flex-col items-center justify-center px-6 py-10 text-verde-escuro/45"><LuLoaderCircle className="mb-3 animate-spin" size={30} /><p className="text-sm font-semibold">{texto}</p></div>;
}

function EstadoVazio({ icone, titulo, texto, compacto = false }) {
  return <div className={`flex h-full flex-col items-center justify-center px-6 text-center ${compacto ? 'min-h-56 py-10' : 'min-h-72 py-12'}`}><span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">{icone({ size: 27 })}</span><p className="font-bold text-slate-600">{titulo}</p><p className="mt-1 max-w-xs text-sm leading-relaxed text-slate-400">{texto}</p></div>;
}

function ImageCard({ label, url, onZoom }) {
  return <div className="group flex flex-col"><p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">{label}</p>{url ? <button type="button" className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 text-left shadow-sm" onClick={onZoom}><img src={url} alt={label} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" /><span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white transition-colors group-hover:bg-black/10"><LuMaximize2 size={24} className="opacity-0 transition-opacity group-hover:opacity-100" /></span></button> : <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400"><LuCircleX size={24} className="mb-2 opacity-50" /><span className="text-xs font-medium">Indisponível</span></div>}</div>;
}
