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

  const handleLogout = () => {
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
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <p className="text-gray-500 font-medium">Carregando perfil...</p>
      </div>
    );
  }

  if (erro && !usuario) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
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
    <div className="min-h-screen bg-[#F8F9FA] font-sans flex flex-col text-[#1A1A1A]">
      <Header />

      <main className="flex-grow w-full pb-16">
        <section className="w-full bg-white border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-6 sm:px-8 py-10 flex flex-col sm:flex-row items-center sm:items-center gap-6">
            <div className={`relative group ${ehPerfilProprio ? 'cursor-pointer' : ''}`} onClick={ehPerfilProprio ? handleAvatarClick : undefined}>
              <div className="w-32 h-32 rounded-full border-4 border-[#F8F9FA] bg-white shadow-md overflow-hidden relative">
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
                <h1 className="text-2xl font-black text-[#1A1A1A]">{usuario.nome}</h1>
                {temVerificacao && <SeloVerificado />}
              </div>
              {ehPerfilProprio && <p className="text-gray-500 font-medium mt-1">{usuario.email}</p>}
              {erro && <p className="text-red-600 text-sm font-medium mt-2">{erro}</p>}
            </div>

            {ehPerfilProprio && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={abrirModalEdicao}
                  className="flex items-center gap-2 bg-white border border-gray-200 text-[#1A1A1A] font-bold px-6 py-2.5 rounded-xl hover:border-[#29C354] hover:text-[#29C354] transition-colors shadow-sm cursor-pointer"
                >
                  <LuSettings size={16} /> Editar Perfil
                </button>

                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 bg-white border-2 border-red-100 text-red-500 font-bold px-6 py-2 rounded-xl hover:border-red-400 hover:bg-red-50 transition-colors shadow-sm cursor-pointer"
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
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                  {objetivoUsuario === 'ambos' ? 'Alternar Painel' : 'Meu Painel'}
                </h2>

                <div className="space-y-3">
                  {(objetivoUsuario === 'ambos' || objetivoUsuario === 'locatario') && (
                    <button
                      onClick={() => navigate('/painellocatario')}
                      className="w-full flex items-center p-4 rounded-2xl border-2 border-transparent hover:border-[#29C354] bg-gray-50 hover:bg-[#29C354]/5 transition-all text-left group cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#0068F3] flex items-center justify-center shrink-0 mr-4 group-hover:bg-[#29C354] group-hover:text-white transition-colors">
                        <LuShoppingBag size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#1A1A1A]">Modo Locatário</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Gerenciar meus aluguéis</p>
                      </div>
                    </button>
                  )}

                  {(objetivoUsuario === 'ambos' || objetivoUsuario === 'locador') && (
                    <button
                      onClick={() => navigate('/painelLocador')}
                      className="w-full flex items-center p-4 rounded-2xl border-2 border-transparent hover:border-[#29C354] bg-gray-50 hover:bg-[#29C354]/5 transition-all text-left group cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-500 flex items-center justify-center shrink-0 mr-4 group-hover:bg-[#29C354] group-hover:text-white transition-colors">
                        <LuPackage size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#1A1A1A]">Modo Locador</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Meus anúncios e ganhos</p>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Informações da Conta</h2>
              <ul className="space-y-4">
                {/* Exibe o telefone (apenas se for o próprio perfil e o telefone estiver preenchido) */}
                {temTelefone && (
                  <li className="flex items-center gap-3 text-sm text-[#1A1A1A] font-medium">
                    <LuPhone className="text-[#29C354]" size={18} /> {usuario.telefone}
                  </li>
                )}
                
                {/* Exibe o status de verificação (visível para o dono da conta E visitantes, garantindo confiança!) */}
                {temVerificacao && (
                  <li className="flex items-center gap-3 text-sm text-[#1A1A1A] font-medium">
                    <LuShieldCheck className="text-[#29C354]" size={18} /> Documentação verificada
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
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">Sobre {ehPerfilProprio ? 'mim' : usuario.nome}</h2>
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
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 relative">
            <button
              onClick={() => setModalAberto(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-[#1A1A1A] cursor-pointer"
            >
              <LuX size={22} />
            </button>

            <h2 className="text-xl font-bold text-[#1A1A1A] mb-6">Editar Perfil</h2>

            {erroForm && (
              <div className="p-3 mb-4 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm font-medium">
                {erroForm}
              </div>
            )}

            <form onSubmit={handleSalvarEdicao} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Nome</label>
                <input
                  type="text"
                  value={formEdicao.nome}
                  onChange={(e) => setFormEdicao({ ...formEdicao, nome: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0297AA] outline-none text-[#1A1A1A]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Telefone</label>
                <input
                  type="tel"
                  value={formEdicao.telefone}
                  onChange={(e) => setFormEdicao({ ...formEdicao, telefone: e.target.value })}
                  placeholder="(35) 99999-9999"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0297AA] outline-none text-[#1A1A1A]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Bio</label>
                <textarea
                  value={formEdicao.bio}
                  onChange={(e) => setFormEdicao({ ...formEdicao, bio: e.target.value })}
                  rows={4}
                  placeholder="Conte um pouco sobre você..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0297AA] outline-none text-[#1A1A1A] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={salvando}
                className={`w-full text-white font-bold py-3 rounded-lg transition-colors mt-2 shadow-md cursor-pointer ${salvando ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#29C354] hover:bg-[#032D54]'}`}
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