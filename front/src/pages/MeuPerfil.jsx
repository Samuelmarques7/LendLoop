import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  LuCamera,
  LuSettings,
  LuShoppingBag,
  LuPackage,
  LuCalendarDays,
  LuPhone,
  LuX,
  LuLogOut,
  LuShieldCheck // Ícone adicionado para a verificação
} from 'react-icons/lu';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import SeloVerificado from '../components/SeloVerificado';
import { apiRequest } from '../services/api';
import { PainelAvaliacoes } from '../components/PainelAvaliacoes';
import { useConfirmacao } from '../context/ConfirmacaoContext';

function urlAvatarPadrao(nome) {
  const nomeSeguro = (nome || 'Usuário').trim() || 'Usuário';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(nomeSeguro)}&background=29C354&color=fff&size=150`;
}

function formatarMembroDesde(dataCriacao) {
  const data = new Date(dataCriacao);
  const anoAtual = new Date().getFullYear();
  const anoCadastro = data.getFullYear();

  if (anoCadastro === anoAtual) {
    return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  return String(anoCadastro);
}

export default function MeuPerfil() {
  const navigate = useNavigate();
  const { id: idDaRota } = useParams();
  const confirmar = useConfirmacao();
  const fileInputRef = useRef(null);

  const dadosSalvos = localStorage.getItem('dadosUsuario');
  const usuarioLogadoId = dadosSalvos ? JSON.parse(dadosSalvos).id : null;

  const ehPerfilProprio = !idDaRota || idDaRota === usuarioLogadoId;
  const idAlvo = idDaRota || usuarioLogadoId;

  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [enviandoAvatar, setEnviandoAvatar] = useState(false);

  const [modalAberto, setModalAberto] = useState(false);
  const [formEdicao, setFormEdicao] = useState({ nome: '', telefone: '', bio: '' });
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState(null);

  useEffect(() => {
    if (!idDaRota && !dadosSalvos) {
      navigate('/login');
      return;
    }

    if (!idAlvo) {
      setErro('Usuário não encontrado.');
      setCarregando(false);
      return;
    }

    async function carregarUsuario() {
      try {
        const dados = await apiRequest(`/api/usuarios/${idAlvo}`);
        setUsuario(dados);
      } catch (e) {
        setErro(e.message);
      } finally {
        setCarregando(false);
      }
    }

    carregarUsuario();
  }, [idAlvo, navigate]);

  function atualizarLocalStorage(usuarioAtualizado) {
    const dadosSalvos = JSON.parse(localStorage.getItem('dadosUsuario') || '{}');
    localStorage.setItem('dadosUsuario', JSON.stringify({
      ...dadosSalvos,
      nome: usuarioAtualizado.nome,
      email: usuarioAtualizado.email,
      avatar: usuarioAtualizado.avatar
    }));
  }

  const handleAvatarClick = () => {
    if (enviandoAvatar) return;
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const arquivo = e.target.files[0];
    if (!arquivo || !usuario) return;

    setEnviandoAvatar(true);
    setErro(null);

    try {
      const formData = new FormData();
      formData.append('fotos', arquivo);

      const dadosUpload = await apiRequest('/api/upload', {
        method: 'POST',
        body: formData
      });

      const novaUrlAvatar = dadosUpload.urls[0];

      const resposta = await apiRequest(`/api/usuarios/${usuario._id}`, {
        method: 'PUT',
        body: { avatar: novaUrlAvatar }
      });

      setUsuario(resposta.usuario);
      atualizarLocalStorage(resposta.usuario);
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviandoAvatar(false);
      e.target.value = '';
    }
  };

  const handleLogout = async () => {
    const confirmou = await confirmar({
      titulo: 'Sair da conta?',
      mensagem: 'Você precisará entrar novamente para acessar seus painéis e informações.',
      textoConfirmar: 'Sair',
      textoCancelar: 'Ficar',
      variante: 'perigo',
    });

    if (!confirmou) return;

    localStorage.removeItem('usuarioLogado');
    localStorage.removeItem('dadosUsuario');
    localStorage.removeItem('token');
    navigate('/');
  };

  const abrirModalEdicao = () => {
    setFormEdicao({
      nome: usuario.nome || '',
      telefone: usuario.telefone || '',
      bio: usuario.bio || ''
    });
    setErroForm(null);
    setModalAberto(true);
  };

  const handleSalvarEdicao = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErroForm(null);

    try {
      const resposta = await apiRequest(`/api/usuarios/${usuario._id}`, {
        method: 'PUT',
        body: formEdicao
      });

      setUsuario(resposta.usuario);
      atualizarLocalStorage(resposta.usuario);
      setModalAberto(false);
    } catch (e) {
      setErroForm(e.message);
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <div className="page-shell min-h-screen flex items-center justify-center">
        <p className="text-gray-500 font-medium">Carregando perfil...</p>
      </div>
    );
  }

  if (erro && !usuario) {
    return (
      <div className="page-shell min-h-screen flex items-center justify-center">
        <p className="text-red-600 font-medium">{erro}</p>
      </div>
    );
  }

  const objetivoUsuario = usuario.objetivo || 'ambos';
  
  // Variável para organizar a linha divisória da seção "Informações da Conta"
  const temTelefone = ehPerfilProprio && usuario.telefone;
  const temVerificacao = usuario.verificacao?.status === 'aprovado';
  const mostrarLinhaDivisoria = temTelefone || temVerificacao;

  return (
    <div className="page-shell min-h-screen font-sans flex flex-col text-grafite">
      <Header />

      <main className="flex-grow w-full pb-16">
        <section className="w-full border-b border-verde-escuro/10 bg-verde-escuro/[0.025]">
          <div className="max-w-5xl mx-auto px-6 sm:px-8 py-10 flex flex-col sm:flex-row items-center sm:items-center gap-6">
            <div className={`relative group ${ehPerfilProprio ? 'cursor-pointer' : ''}`} onClick={ehPerfilProprio ? handleAvatarClick : undefined}>
              <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-white shadow-md ring-4 ring-verde-agua/15">
                <img
                  src={usuario.avatar || urlAvatarPadrao(usuario.nome)}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />

                {ehPerfilProprio && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-sm">
                    <LuCamera size={26} />
                    <span className="text-[10px] font-bold mt-1 uppercase tracking-widest">
                      {enviandoAvatar ? 'Enviando...' : 'Alterar'}
                    </span>
                  </div>
                )}
              </div>

              {ehPerfilProprio && (
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              )}
            </div>

            <div className="text-center sm:text-left flex-grow">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h1 className="text-2xl font-semibold text-grafite">{usuario.nome}</h1>
                {temVerificacao && <SeloVerificado />}
              </div>
              {ehPerfilProprio && <p className="mt-1 text-sm text-gray-500">{usuario.email}</p>}
              {erro && <p className="text-red-600 text-sm font-medium mt-2">{erro}</p>}
            </div>

            {ehPerfilProprio && (
              <div className="flex flex-col items-stretch gap-2 sm:items-stretch">
                <button
                  onClick={abrirModalEdicao}
                  className="flex items-center gap-2 rounded-xl border border-verde-agua/35 bg-white px-5 py-2.5 text-sm font-semibold text-verde-escuro shadow-sm transition-colors hover:border-verde-agua hover:bg-verde-agua/5 cursor-pointer"
                >
                  <LuSettings size={16} /> Editar Perfil
                </button>

                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-500 shadow-sm transition-colors hover:border-red-400 hover:bg-red-50 cursor-pointer"
                >
                <LuLogOut size={16} /> Sair
                </button>
              </div>
            )}
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-6 sm:px-8 grid grid-cols-1 md:grid-cols-12 gap-8 mt-12">

          <div className="md:col-span-4 space-y-8">

            {ehPerfilProprio && (
              <div className="rounded-3xl border border-gray-100 border-l-4 border-l-azul-oceano bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold text-grafite">
                  {objetivoUsuario === 'ambos' ? 'Acessos rápidos' : 'Seu painel'}
                </h2>

                <div className="space-y-3">
                  {(objetivoUsuario === 'ambos' || objetivoUsuario === 'locatario') && (
                    <button
                      onClick={() => navigate('/painellocatario')}
                      className="group flex w-full items-center rounded-2xl border border-gray-100 bg-gray-50 p-4 text-left transition-all hover:border-azul-oceano/35 hover:bg-azul-oceano/[0.03] cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-xl bg-azul-oceano/10 text-azul-oceano flex items-center justify-center shrink-0 mr-4 group-hover:bg-verde-agua group-hover:text-white transition-colors">
                        <LuShoppingBag size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-grafite">Modo locatário</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Gerenciar meus aluguéis</p>
                      </div>
                    </button>
                  )}

                  {(objetivoUsuario === 'ambos' || objetivoUsuario === 'locador') && (
                    <button
                      onClick={() => navigate('/painelLocador')}
                      className="group flex w-full items-center rounded-2xl border border-gray-100 bg-gray-50 p-4 text-left transition-all hover:border-verde-agua/40 hover:bg-verde-agua/[0.03] cursor-pointer"
                    >
                      <div className="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-verde-escuro/10 text-verde-escuro transition-colors group-hover:bg-verde-agua group-hover:text-white">
                        <LuPackage size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-grafite">Modo locador</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Meus anúncios e ganhos</p>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-3xl border border-gray-100 border-l-4 border-l-ciano bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-sm font-semibold text-grafite">Detalhes da conta</h2>
              <ul className="space-y-4">
                {/* Exibe o telefone (apenas se for o próprio perfil e o telefone estiver preenchido) */}
                {temTelefone && (
                  <li className="flex items-center gap-3 text-sm text-grafite font-medium">
                    <LuPhone className="text-verde-agua" size={18} /> {usuario.telefone}
                  </li>
                )}
                
                {/* Exibe o status de verificação (visível para o dono da conta E visitantes, garantindo confiança!) */}
                {temVerificacao && (
                  <li className="flex items-center gap-3 text-sm text-grafite font-medium">
                    <LuShieldCheck className="text-verde-agua" size={18} /> Documentação verificada
                  </li>
                )}
              </ul>

              {/* Data de registro no site, com a linha no topo só se existir o telefone ou a verificação */}
              <div className={`flex items-center gap-2 text-sm text-gray-500 font-medium ${mostrarLinhaDivisoria ? 'mt-8 pt-6 border-t border-gray-100' : ''}`}>
                <LuCalendarDays size={18} /> Membro desde {formatarMembroDesde(usuario.createdAt)}
              </div>
            </div>
          </div>

          <div className="md:col-span-8 space-y-8">
            <div className="rounded-3xl border border-gray-100 border-l-4 border-l-verde-agua bg-white p-7 shadow-sm sm:p-8">
              <h2 className="mb-4 text-lg font-semibold text-grafite">Sobre {ehPerfilProprio ? 'mim' : usuario.nome}</h2>
              {usuario.bio ? (
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{usuario.bio}</p>
              ) : (
                <p className="text-gray-400 italic">
                  {ehPerfilProprio
                    ? 'Você ainda não escreveu nada sobre você. Clique em "Editar Perfil" para adicionar uma bio.'
                    : 'Este usuário ainda não escreveu uma bio.'}
                </p>
              )}
            </div>

            <PainelAvaliacoes usuarioId={usuario._id} />

          </div>
        </div>
      </main>

      <Footer />

      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-xl sm:p-8">
            <button
              onClick={() => setModalAberto(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-grafite cursor-pointer"
            >
              <LuX size={22} />
            </button>

            <h2 className="mb-6 text-lg font-semibold text-grafite">Editar perfil</h2>

            {erroForm && (
              <div className="p-3 mb-4 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm font-medium">
                {erroForm}
              </div>
            )}

            <form onSubmit={handleSalvarEdicao} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-grafite mb-1">Nome</label>
                <input
                  type="text"
                  value={formEdicao.nome}
                  onChange={(e) => setFormEdicao({ ...formEdicao, nome: e.target.value })}
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-grafite focus:ring-2 focus:ring-ciano outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-grafite mb-1">Telefone</label>
                <input
                  type="tel"
                  value={formEdicao.telefone}
                  onChange={(e) => setFormEdicao({ ...formEdicao, telefone: e.target.value })}
                  placeholder="(35) 99999-9999"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-grafite focus:ring-2 focus:ring-ciano outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-grafite mb-1">Bio</label>
                <textarea
                  value={formEdicao.bio}
                  onChange={(e) => setFormEdicao({ ...formEdicao, bio: e.target.value })}
                  rows={4}
                  placeholder="Conte um pouco sobre você..."
                  className="w-full resize-none rounded-xl border border-gray-300 px-4 py-2.5 text-grafite focus:ring-2 focus:ring-ciano outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={salvando}
                className={`mt-2 w-full rounded-xl py-3 text-sm font-semibold text-white shadow-md transition-colors cursor-pointer ${salvando ? 'bg-gray-400 cursor-not-allowed' : 'bg-verde-agua hover:bg-verde-escuro'}`}
              >
                {salvando ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
