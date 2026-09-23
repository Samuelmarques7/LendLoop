import { useEffect, useMemo, useState } from 'react';
import { LuBell, LuCheck, LuCheckCheck, LuCircleX, LuLoaderCircle, LuMaximize2, LuShieldCheck, LuUser, LuUsers, LuX } from 'react-icons/lu';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { apiRequest, API_URL } from '../services/api';

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
  const [emailParaPromover, setEmailParaPromover] = useState('');
  const [promovendo, setPromovendo] = useState(false);
  const [mensagemAdmin, setMensagemAdmin] = useState('');
  const [notificacoes, setNotificacoes] = useState([]);
  const [carregandoNotificacoes, setCarregandoNotificacoes] = useState(false);

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

  async function buscarUsuarios(status) {
    setCarregando(true);
    setErro('');
    try {
      const dados = await apiRequest(`/api/admin/verificacoes?status=${status}`);
      setUsuarios(dados);
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
    if (!emailParaPromover.trim() || promovendo) return;

    setPromovendo(true);
    setMensagemAdmin('');
    setErro('');
    try {
      const resposta = await apiRequest('/api/admin/usuarios/promover', {
        method: 'PATCH',
        body: { email: emailParaPromover }
      });
      setMensagemAdmin(resposta.mensagem);
      setEmailParaPromover('');
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
    <div className="page-shell min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-7">
          <div className="bg-verde-escuro/10 p-3 rounded-2xl text-verde-escuro"><LuShieldCheck size={22} /></div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-verde-escuro">Central administrativa</h1>
            <p className="mt-1 text-sm text-gray-500">Gerencie verificações de identidade, alertas e permissões.</p>
          </div>
        </div>

        <nav className="mb-8 flex w-full gap-1 overflow-x-auto rounded-2xl border border-gray-100 bg-gray-50 p-1.5" aria-label="Áreas administrativas">
          {SECOES.map((secao) => {
            const Icone = secao.icone;
            const ativa = secaoAtiva === secao.valor;
            return (
              <button key={secao.valor} onClick={() => { setSecaoAtiva(secao.valor); setErro(''); }} className={`relative inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${ativa ? 'bg-white text-verde-escuro shadow-sm' : 'text-gray-500 hover:text-verde-escuro'}`}>
                <Icone size={17} /> {secao.titulo}
                {secao.valor === 'notificacoes' && documentosNaoLidos > 0 && <span className="min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">{documentosNaoLidos > 9 ? '9+' : documentosNaoLidos}</span>}
              </button>
            );
          })}
        </nav>

        {erro && <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-600"><LuCircleX size={18} /> {erro}</div>}

        {secaoAtiva === 'administradores' && (
          <section className="rounded-3xl border border-ciano/20 bg-ciano/5 p-6 sm:p-8">
            <div className="max-w-2xl">
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-ciano shadow-sm"><LuUsers size={23} /></span>
              <h2 className="text-xl font-black text-verde-escuro">Gerenciar administradores</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">Conceda acesso ao painel somente para pessoas responsáveis pela operação. A conta precisa existir e estar ativa.</p>
              <form onSubmit={promoverAdministrador} className="mt-6 flex max-w-xl flex-col gap-2 sm:flex-row">
                <input type="email" value={emailParaPromover} onChange={(evento) => setEmailParaPromover(evento.target.value)} placeholder="email@exemplo.com" required className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-ciano focus:ring-2 focus:ring-ciano/20" />
                <button type="submit" disabled={promovendo} className="rounded-xl bg-verde-escuro px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-azul-oceano disabled:cursor-not-allowed disabled:opacity-60">{promovendo ? 'Promovendo...' : 'Tornar admin'}</button>
              </form>
              {mensagemAdmin && <p className="mt-4 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-verde-escuro">{mensagemAdmin}</p>}
            </div>
          </section>
        )}

        {secaoAtiva === 'notificacoes' && (
          <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-100 bg-gray-50/60 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="text-lg font-black text-verde-escuro">Fila de verificações</h2><p className="mt-1 text-sm text-gray-500">Analise novos envios de identidade e tome uma decisão.</p></div>
              {documentosNaoLidos > 0 && <button onClick={marcarTodasComoLidas} className="inline-flex items-center justify-center gap-2 rounded-xl border border-ciano/30 bg-white px-4 py-2.5 text-sm font-bold text-azul-oceano hover:border-ciano hover:text-verde-escuro"><LuCheckCheck size={17} /> Marcar como lidas</button>}
            </div>
            <div className="divide-y divide-gray-100">
              {carregandoNotificacoes ? <div className="flex justify-center py-14 text-verde-escuro/50"><LuLoaderCircle className="animate-spin" size={30} /></div> : notificacoesDeDocumentos.length === 0 ? <div className="px-6 py-14 text-center text-sm text-gray-400">Nenhum documento novo para analisar.</div> : notificacoesDeDocumentos.map((notificacao) => (
                <button key={notificacao._id} onClick={() => abrirPelaNotificacao(notificacao)} className={`flex w-full items-start gap-4 px-6 py-5 text-left transition-colors hover:bg-gray-50 ${!notificacao.lida ? 'bg-azul-oceano/5' : ''}`}>
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ciano/10 text-ciano"><LuShieldCheck size={20} /></span>
                  <span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${notificacao.lida ? 'bg-transparent' : 'bg-azul-oceano'}`} /><span className={`text-sm ${notificacao.lida ? 'font-semibold text-gray-700' : 'font-bold text-verde-escuro'}`}>{notificacao.titulo}</span></span><span className="mt-1 block text-sm text-gray-600">{notificacao.texto}</span><span className="mt-2 block text-xs text-gray-400">{formatarData(notificacao.createdAt)} · Abrir verificação</span></span>
                </button>
              ))}
            </div>
          </section>
        )}

        {secaoAtiva === 'verificacoes' && <>
          <div className="mb-8 flex w-fit gap-2 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-sm">
            {ABAS.map((aba) => <button key={aba.valor} onClick={() => setAbaAtiva(aba.valor)} className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${abaAtiva === aba.valor ? 'bg-verde-escuro text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 hover:text-verde-escuro'}`}>{aba.titulo}</button>)}
          </div>
          <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
            <div className="flex h-fit max-h-[700px] flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gray-50/50 p-5"><h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">Solicitações</h2></div>
              <div className="flex-1 overflow-y-auto p-2">
                {carregando ? <div className="flex flex-col items-center justify-center py-16 text-verde-escuro/40"><LuLoaderCircle className="mb-2 animate-spin" size={32} /><p className="text-sm font-medium">Carregando lista...</p></div> : usuarios.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-gray-400"><LuUser size={40} className="mb-3 opacity-20" /><p className="text-sm font-medium">Fila vazia no momento.</p></div> : <div className="space-y-1">{usuarios.map((usuario) => <button key={usuario._id} onClick={() => abrirVerificacao(usuario)} className={`flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all ${selecionado?._id === usuario._id ? 'bg-verde-escuro/5 ring-1 ring-verde-escuro/20' : 'border border-transparent hover:bg-gray-50'}`}><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold ${selecionado?._id === usuario._id ? 'bg-verde-escuro text-white' : 'bg-gray-100 text-gray-500'}`}>{usuario.nome.charAt(0).toUpperCase()}</span><span className="min-w-0 flex-1"><span className={`block truncate font-bold ${selecionado?._id === usuario._id ? 'text-verde-escuro' : 'text-gray-800'}`}>{usuario.nome}</span><span className="block truncate text-xs text-gray-500">{usuario.email}</span></span></button>)}</div>}
              </div>
            </div>
            <div className="min-h-[500px] rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
              {!selecionado ? <div className="flex h-full flex-col items-center justify-center py-32 text-gray-400"><LuShieldCheck size={60} className="mb-4 opacity-20" /><p className="text-lg font-medium text-gray-500">Selecione um usuário para analisar</p><p className="mt-1 text-sm">Os documentos aparecerão aqui.</p></div> : <div>
                <div className="mb-8 border-b border-gray-100 pb-6"><h2 className="text-2xl font-black text-verde-escuro">{selecionado.nome}</h2><div className="mt-3 flex flex-wrap gap-3 text-sm font-medium text-gray-500"><span className="rounded-full bg-gray-100 px-3 py-1">{selecionado.email}</span>{selecionado.telefone && <span className="rounded-full bg-gray-100 px-3 py-1">{selecionado.telefone}</span>}{selecionado.verificacao?.enviadoEm && <span className="rounded-full bg-verde-escuro/10 px-3 py-1 text-verde-escuro">Enviado em {new Date(selecionado.verificacao.enviadoEm).toLocaleDateString('pt-BR')}</span>}</div></div>
                {carregandoDocumentos ? <div className="flex flex-col items-center justify-center py-20 text-verde-escuro/40"><LuLoaderCircle className="mb-3 animate-spin" size={40} /><p className="font-medium">Carregando documentos seguros...</p></div> : <><h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-800">Documentos anexados</h3><div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3"><ImageCard label="Frente do documento" url={urlsDocumentos.documentoFrente} onZoom={() => setImagemExpandida(urlsDocumentos.documentoFrente)} /><ImageCard label="Verso do documento" url={urlsDocumentos.documentoVerso} onZoom={() => setImagemExpandida(urlsDocumentos.documentoVerso)} /><ImageCard label="Selfie com documento" url={urlsDocumentos.selfie} onZoom={() => setImagemExpandida(urlsDocumentos.selfie)} /></div></>}
                {abaAtiva === 'pendente' && !carregandoDocumentos && <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-6"><h3 className="mb-3 text-sm font-bold text-gray-800">Decisão de análise</h3><textarea value={motivoRejeicao} onChange={(evento) => setMotivoRejeicao(evento.target.value)} placeholder="Motivo (obrigatório apenas se for rejeitar o documento)" rows={2} className="mb-4 w-full resize-none rounded-xl border border-gray-300 bg-white p-4 text-sm outline-none focus:border-verde-escuro focus:ring-2 focus:ring-verde-escuro/20" /><div className="flex flex-col gap-4 sm:flex-row"><button onClick={() => decidir('aprovar')} disabled={processando} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-verde-agua py-3.5 font-bold text-white hover:bg-ciano disabled:opacity-50"><LuCheck size={20} /> Aprovar perfil</button><button onClick={() => decidir('rejeitar')} disabled={processando} className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-red-100 bg-white py-3.5 font-bold text-red-500 hover:bg-red-50 disabled:opacity-50"><LuX size={20} /> Rejeitar documentos</button></div></div>}
                {selecionado.verificacao?.status === 'rejeitado' && selecionado.verificacao?.motivoRejeicao && <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-5"><p className="mb-2 text-xs font-bold uppercase tracking-wider text-red-500">Motivo da rejeição</p><p className="text-sm font-medium text-red-800">{selecionado.verificacao.motivoRejeicao}</p></div>}
              </div>}
            </div>
          </div>
        </>}
      </main>
      <Footer />
      {imagemExpandida && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setImagemExpandida(null)}><button className="absolute right-6 top-6 text-white/50 hover:text-white" onClick={() => setImagemExpandida(null)}><LuX size={40} /></button><img src={imagemExpandida} alt="Documento em tela cheia" className="max-h-[90vh] max-w-full rounded-lg object-contain" onClick={(evento) => evento.stopPropagation()} /></div>}
    </div>
  );
}

function ImageCard({ label, url, onZoom }) {
  return <div className="group flex flex-col"><p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">{label}</p>{url ? <button type="button" className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 text-left shadow-sm" onClick={onZoom}><img src={url} alt={label} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" /><span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white transition-colors group-hover:bg-black/10"><LuMaximize2 size={24} className="opacity-0 transition-opacity group-hover:opacity-100" /></span></button> : <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400"><LuCircleX size={24} className="mb-2 opacity-50" /><span className="text-xs font-medium">Indisponível</span></div>}</div>;
}
