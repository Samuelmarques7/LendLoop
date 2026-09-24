import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LuArrowRight, LuCalendarDays, LuCamera, LuCircleAlert, LuCircleCheck, LuClock3, LuImageOff, LuLogOut, LuMapPin, LuPackage, LuPencil, LuSettings, LuShieldCheck, LuShoppingBag, LuStar, LuX } from 'react-icons/lu';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import SeloVerificado from '../components/SeloVerificado';
import { apiRequest } from '../services/api';
import { PainelAvaliacoes } from '../components/PainelAvaliacoes';
import { useConfirmacao } from '../context/ConfirmacaoContext';

function urlAvatarPadrao(nome) {
  const nomeSeguro = (nome || 'Usuário').trim() || 'Usuário';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(nomeSeguro)}&background=29C354&color=fff&size=240`;
}

function lerUsuarioLocal() {
  try { return JSON.parse(localStorage.getItem('dadosUsuario') || 'null'); } catch { return null; }
}

function formatarMembroDesde(valor) {
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? 'data não informada' : data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

const VERIFICACAO = {
  aprovado: { titulo: 'Identidade verificada', texto: 'Documentação analisada e aprovada.', icone: LuCircleCheck, estilo: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  pendente: { titulo: 'Verificação em análise', texto: 'Seus documentos estão sendo conferidos.', icone: LuClock3, estilo: 'border-blue-200 bg-blue-50 text-azul-oceano' },
  rejeitado: { titulo: 'Verificação precisa de atenção', texto: 'Revise os documentos enviados.', icone: LuCircleAlert, estilo: 'border-red-200 bg-red-50 text-red-600' },
  nao_enviado: { titulo: 'Identidade não verificada', texto: 'Verifique sua identidade para aumentar a confiança.', icone: LuShieldCheck, estilo: 'border-slate-200 bg-slate-50 text-slate-600' },
};

function CardAnuncioPerfil({ anuncio, onAbrir }) {
  return (
    <button type="button" onClick={() => onAbrir(anuncio._id)} className="group min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition-all hover:-translate-y-0.5 hover:border-azul-oceano/25 hover:shadow-lg">
      <div className="relative h-36 overflow-hidden bg-slate-100">
        {anuncio.fotos?.[0] ? <img src={anuncio.fotos[0]} alt={anuncio.titulo} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center"><LuImageOff size={30} className="text-slate-300" /></div>}
        <span className="absolute right-3 top-3 rounded-lg bg-white/95 px-2 py-1 text-[10px] font-bold text-emerald-700 shadow-sm">Disponível</span>
      </div>
      <div className="p-4">
        <h3 className="truncate font-bold text-grafite group-hover:text-azul-oceano">{anuncio.titulo}</h3>
        <p className="mt-1 font-black text-verde-escuro">R$ {anuncio.precos?.precoPorDia}<span className="text-xs font-semibold text-slate-400"> /dia</span></p>
        <p className="mt-2 flex items-center gap-1 truncate text-xs text-slate-500"><LuMapPin size={13} className="text-azul-oceano" /> {anuncio.endereco?.cidade || 'Localização não informada'}</p>
      </div>
    </button>
  );
}

function EstadoCarregamento() {
  return <div className="page-shell flex min-h-screen flex-col"><Header /><main className="mx-auto w-full max-w-[1440px] flex-grow animate-pulse px-4 py-8 sm:px-8"><div className="h-56 rounded-3xl bg-white shadow-sm" /><div className="mt-6 grid gap-6 lg:grid-cols-12"><div className="h-96 rounded-3xl bg-white lg:col-span-4" /><div className="h-[520px] rounded-3xl bg-white lg:col-span-8" /></div></main><Footer /></div>;
}

export default function MeuPerfil() {
  const navigate = useNavigate();
  const { id: idDaRota } = useParams();
  const confirmar = useConfirmacao();
  const fileInputRef = useRef(null);
  const usuarioLogadoId = lerUsuarioLocal()?.id || null;
  const ehPerfilProprio = !idDaRota || idDaRota === usuarioLogadoId;
  const idAlvo = idDaRota || usuarioLogadoId;
  const [usuario, setUsuario] = useState(null);
  const [anuncios, setAnuncios] = useState([]);
  const [avaliacoes, setAvaliacoes] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [enviandoAvatar, setEnviandoAvatar] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [formEdicao, setFormEdicao] = useState({ nome: '', telefone: '', bio: '' });
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState('');

  useEffect(() => {
    if (!idDaRota && !usuarioLogadoId) { navigate('/login'); return; }
    if (!idAlvo) return;
    async function carregarPerfil() {
      setCarregando(true);
      try {
        const [dadosUsuario, dadosAnuncios, dadosAvaliacoes] = await Promise.all([
          apiRequest(`/api/usuarios/${idAlvo}`), apiRequest(`/api/anuncios/locador/${idAlvo}`), apiRequest(`/api/avaliacoes/usuario/${idAlvo}`),
        ]);
        setUsuario(dadosUsuario);
        setAnuncios(dadosAnuncios.filter((anuncio) => anuncio.status === 'publicado'));
        setAvaliacoes(dadosAvaliacoes);
      } catch (e) { setErro(e.message || 'Não foi possível carregar o perfil.'); } finally { setCarregando(false); }
    }
    carregarPerfil();
  }, [idAlvo, idDaRota, navigate, usuarioLogadoId]);

  function atualizarLocalStorage(atualizado) {
    const atual = lerUsuarioLocal() || {};
    localStorage.setItem('dadosUsuario', JSON.stringify({ ...atual, nome: atualizado.nome, email: atualizado.email, avatar: atualizado.avatar }));
  }

  async function handleFileChange(evento) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo || !usuario) return;
    if (!arquivo.type.startsWith('image/')) { setErro('Selecione uma imagem válida para o perfil.'); evento.target.value = ''; return; }
    if (arquivo.size > 5 * 1024 * 1024) { setErro('A foto de perfil deve ter no máximo 5 MB.'); evento.target.value = ''; return; }
    setEnviandoAvatar(true); setErro('');
    try {
      const formData = new FormData(); formData.append('fotos', arquivo);
      const upload = await apiRequest('/api/upload', { method: 'POST', body: formData });
      const resposta = await apiRequest(`/api/usuarios/${usuario._id}`, { method: 'PUT', body: { avatar: upload.urls[0] } });
      setUsuario(resposta.usuario); atualizarLocalStorage(resposta.usuario);
    } catch (e) { setErro(e.message); } finally { setEnviandoAvatar(false); evento.target.value = ''; }
  }

  async function handleLogout() {
    const confirmou = await confirmar({ titulo: 'Sair da conta?', mensagem: 'Você precisará entrar novamente para acessar seus painéis e informações.', textoConfirmar: 'Sair', textoCancelar: 'Ficar', variante: 'perigo' });
    if (!confirmou) return;
    localStorage.removeItem('usuarioLogado'); localStorage.removeItem('dadosUsuario'); localStorage.removeItem('token'); navigate('/');
  }

  function abrirModalEdicao() {
    setFormEdicao({ nome: usuario.nome || '', telefone: usuario.telefone || '', bio: usuario.bio || '' }); setErroForm(''); setModalAberto(true);
  }

  async function handleSalvarEdicao(evento) {
    evento.preventDefault(); setSalvando(true); setErroForm('');
    try {
      const resposta = await apiRequest(`/api/usuarios/${usuario._id}`, { method: 'PUT', body: formEdicao });
      setUsuario(resposta.usuario); atualizarLocalStorage(resposta.usuario); setModalAberto(false);
    } catch (e) { setErroForm(e.message); } finally { setSalvando(false); }
  }

  if (carregando) return <EstadoCarregamento />;
  if (!usuario) return <div className="page-shell flex min-h-screen flex-col"><Header /><main className="flex flex-grow items-center justify-center px-4"><div className="max-w-md text-center"><LuCircleAlert size={42} className="mx-auto text-red-400" /><h1 className="mt-4 text-2xl font-bold text-grafite">Perfil indisponível</h1><p className="mt-2 text-slate-500">{erro}</p><button type="button" onClick={() => navigate(-1)} className="mt-6 rounded-xl bg-azul-oceano px-5 py-3 font-bold text-white">Voltar</button></div></main><Footer /></div>;

  const objetivoUsuario = usuario.objetivo || 'ambos';
  const statusVerificacao = usuario.verificacao?.status || 'nao_enviado';
  const verificacao = VERIFICACAO[statusVerificacao] || VERIFICACAO.nao_enviado;
  const IconeVerificacao = verificacao.icone;
  const totalAvaliacoes = avaliacoes?.total || 0;
  const mediaAvaliacoes = avaliacoes?.media || 0;

  return (
    <div className="page-shell flex min-h-screen flex-col font-sans text-grafite"><Header />
      <main className="mx-auto w-full max-w-[1440px] flex-grow px-4 pb-16 pt-6 sm:px-8 lg:pt-8">
        <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_40px_rgba(7,43,74,0.07)] sm:p-7 lg:p-8">
          <div className="flex flex-col items-center gap-6 md:flex-row">
            <div className="relative shrink-0"><div className="h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-md ring-4 ring-azul-oceano/10 sm:h-36 sm:w-36"><img src={usuario.avatar || urlAvatarPadrao(usuario.nome)} alt={`Foto de ${usuario.nome}`} className="h-full w-full object-cover" /></div>
              {ehPerfilProprio && <><button type="button" onClick={() => !enviandoAvatar && fileInputRef.current?.click()} disabled={enviandoAvatar} aria-label="Alterar foto de perfil" className="absolute bottom-1 right-1 flex h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-azul-oceano text-white shadow-lg transition-transform hover:scale-105 disabled:opacity-60"><LuCamera size={19} /></button><input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" /></>}
            </div>
            <div className="min-w-0 flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start"><h1 className="text-3xl font-black tracking-tight text-verde-escuro sm:text-4xl">{usuario.nome}</h1>{statusVerificacao === 'aprovado' && <SeloVerificado />}</div>
              {ehPerfilProprio && <p className="mt-1 text-sm text-slate-500">{usuario.email}</p>}
              <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-semibold text-slate-600 md:justify-start">
                {usuario.localizacao && <span className="flex items-center gap-1.5"><LuMapPin className="text-azul-oceano" /> {usuario.localizacao}</span>}
                <span className="flex items-center gap-1.5"><LuCalendarDays className="text-azul-oceano" /> Membro desde {formatarMembroDesde(usuario.createdAt)}</span>
                <span className="flex items-center gap-1.5"><LuStar className="text-yellow-400" fill="currentColor" /> {totalAvaliacoes ? `${mediaAvaliacoes} · ${totalAvaliacoes} avaliações` : 'Ainda sem avaliações'}</span>
              </div>{erro && <p role="alert" className="mt-3 text-sm font-semibold text-red-600">{erro}</p>}
            </div>
            <div className="flex w-full flex-col gap-2 md:w-auto md:min-w-48">
              {ehPerfilProprio ? <><button type="button" onClick={abrirModalEdicao} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-azul-oceano bg-white px-5 text-sm font-bold text-azul-oceano hover:bg-azul-oceano/5"><LuPencil /> Editar perfil</button><button type="button" onClick={() => navigate('/configuracoes')} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-100 px-5 text-sm font-bold hover:bg-slate-200"><LuSettings /> Configurações</button></> : <button type="button" onClick={() => document.getElementById('anuncios-perfil')?.scrollIntoView({ behavior: 'smooth' })} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-azul-oceano px-5 text-sm font-bold text-white">Ver anúncios <LuArrowRight /></button>}
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-12 lg:items-start">
          <aside className="space-y-6 lg:sticky lg:top-24 lg:col-span-4 xl:col-span-3">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 font-bold text-verde-escuro"><LuShieldCheck className="text-verde-agua" /> Confiança e segurança</h2><div className={`mt-4 rounded-xl border p-4 ${verificacao.estilo}`}><div className="flex items-start gap-3"><IconeVerificacao size={22} className="mt-0.5 shrink-0" /><div><p className="text-sm font-bold">{verificacao.titulo}</p><p className="mt-1 text-xs leading-relaxed opacity-80">{verificacao.texto}</p></div></div></div>
              {ehPerfilProprio && statusVerificacao !== 'aprovado' && <button type="button" onClick={() => navigate('/configuracoes')} className="mt-3 flex items-center gap-1 text-xs font-bold text-azul-oceano">Gerenciar verificação <LuArrowRight /></button>}
              <dl className="mt-5 space-y-4 border-t border-slate-100 pt-5 text-sm"><div className="flex justify-between"><dt className="text-slate-500">Avaliação média</dt><dd className="font-bold">{totalAvaliacoes ? mediaAvaliacoes : '—'}</dd></div><div className="flex justify-between"><dt className="text-slate-500">Avaliações</dt><dd className="font-bold">{totalAvaliacoes}</dd></div><div className="flex justify-between"><dt className="text-slate-500">Anúncios ativos</dt><dd className="font-bold">{anuncios.length}</dd></div></dl>
            </section>
            {ehPerfilProprio && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold text-verde-escuro">Acessos rápidos</h2><div className="mt-4 space-y-3">
              {(objetivoUsuario === 'ambos' || objetivoUsuario === 'locatario') && <button type="button" onClick={() => navigate('/painellocatario')} className="flex w-full items-center gap-3 rounded-xl bg-azul-oceano p-4 text-left text-white hover:-translate-y-0.5"><LuShoppingBag size={23} /><span className="flex-1"><strong className="block text-sm">Modo locatário</strong><span className="text-xs text-white/75">Gerenciar meus aluguéis</span></span><LuArrowRight /></button>}
              {(objetivoUsuario === 'ambos' || objetivoUsuario === 'locador') && <button type="button" onClick={() => navigate('/painelLocador')} className="flex w-full items-center gap-3 rounded-xl bg-verde-agua p-4 text-left text-white hover:-translate-y-0.5"><LuPackage size={23} /><span className="flex-1"><strong className="block text-sm">Modo locador</strong><span className="text-xs text-white/80">Meus anúncios e ganhos</span></span><LuArrowRight /></button>}
              </div><button type="button" onClick={handleLogout} className="mt-5 flex items-center gap-2 text-sm font-semibold text-red-500"><LuLogOut /> Sair da conta</button></section>}
          </aside>

          <div className="space-y-6 lg:col-span-8 xl:col-span-9">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7"><div className="flex items-center justify-between gap-4"><h2 className="text-xl font-bold text-verde-escuro">Sobre {ehPerfilProprio ? 'mim' : usuario.nome}</h2>{ehPerfilProprio && <button type="button" onClick={abrirModalEdicao} className="flex items-center gap-1.5 text-xs font-bold text-azul-oceano"><LuPencil /> Editar</button>}</div><p className={`mt-4 leading-relaxed ${usuario.bio ? 'text-slate-600' : 'italic text-slate-400'}`}>{usuario.bio || (ehPerfilProprio ? 'Conte um pouco sobre você para tornar seu perfil mais próximo e confiável.' : 'Este usuário ainda não escreveu uma apresentação.')}</p></section>
            <section id="anuncios-perfil" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7"><div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-bold text-verde-escuro">{ehPerfilProprio ? 'Meus anúncios' : `Anúncios de ${usuario.nome}`}</h2><p className="mt-1 text-sm text-slate-500">Itens publicados e disponíveis para aluguel.</p></div>{ehPerfilProprio && <button type="button" onClick={() => navigate('/painelLocador')} className="hidden items-center gap-1 text-sm font-bold text-azul-oceano sm:flex">Gerenciar <LuArrowRight /></button>}</div>
              {anuncios.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{anuncios.slice(0, 6).map((anuncio) => <CardAnuncioPerfil key={anuncio._id} anuncio={anuncio} onAbrir={(id) => navigate(`/produto/${id}`)} />)}</div> : <div className="mt-5 rounded-xl border border-dashed border-slate-200 px-5 py-10 text-center"><LuPackage size={28} className="mx-auto text-slate-300" /><p className="mt-3 text-sm text-slate-500">{ehPerfilProprio ? 'Você ainda não possui anúncios publicados.' : 'Este usuário ainda não possui anúncios publicados.'}</p>{ehPerfilProprio && <button type="button" onClick={() => navigate('/criar-anuncio')} className="mt-4 text-sm font-bold text-verde-agua">Criar meu primeiro anúncio</button>}</div>}
            </section>
            <PainelAvaliacoes usuarioId={usuario._id || usuario.id} dadosExternos={avaliacoes} titulo="Avaliações recentes" />
          </div>
        </div>
      </main><Footer />

      {modalAberto && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setModalAberto(false)}><div role="dialog" aria-modal="true" aria-labelledby="titulo-editar-perfil" className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8"><button type="button" onClick={() => setModalAberto(false)} aria-label="Fechar edição do perfil" className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100"><LuX size={20} /></button><h2 id="titulo-editar-perfil" className="text-xl font-bold text-verde-escuro">Editar perfil</h2><p className="mt-1 text-sm text-slate-500">Mantenha suas informações claras para gerar mais confiança.</p>
        {erroForm && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{erroForm}</p>}
        <form onSubmit={handleSalvarEdicao} className="mt-6 space-y-4"><label className="block text-sm font-semibold">Nome<input autoFocus type="text" maxLength={80} value={formEdicao.nome} onChange={(e) => setFormEdicao((atual) => ({ ...atual, nome: e.target.value }))} required className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-azul-oceano focus:ring-2 focus:ring-azul-oceano/10" /></label><label className="block text-sm font-semibold">Telefone<input type="tel" value={formEdicao.telefone} onChange={(e) => setFormEdicao((atual) => ({ ...atual, telefone: e.target.value }))} placeholder="(35) 99999-9999" className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-azul-oceano focus:ring-2 focus:ring-azul-oceano/10" /></label><label className="block text-sm font-semibold">Sobre você<textarea maxLength={1000} value={formEdicao.bio} onChange={(e) => setFormEdicao((atual) => ({ ...atual, bio: e.target.value }))} rows={5} placeholder="Conte um pouco sobre você..." className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-azul-oceano focus:ring-2 focus:ring-azul-oceano/10" /></label><p className="-mt-2 text-right text-xs text-slate-400">{formEdicao.bio.length}/1000</p><button type="submit" disabled={salvando} className="w-full rounded-xl bg-azul-oceano py-3.5 text-sm font-bold text-white hover:bg-[#0b4d7a] disabled:opacity-60">{salvando ? 'Salvando...' : 'Salvar alterações'}</button></form>
      </div></div>}
    </div>
  );
}
