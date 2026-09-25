import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LuArrowLeft,
  LuTrash2,
  LuUserCog,
  LuShieldAlert,
  LuIdCard,
  LuCircleCheck,
  LuTimer,
  LuCircleX,
  LuCheck,
  LuBadgeCheck,
  LuMegaphone,
  LuShoppingBag
} from 'react-icons/lu';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { VerificacaoIdentidade } from '../components/VerificacaoIdentidade';
import { apiRequest } from '../services/api';
import { useConfirmacao } from '../context/ConfirmacaoContext';
import { useNotificacao } from '../context/NotificacaoContext';

const OPCOES_OBJETIVO = [
  { valor: 'ambos', titulo: 'Ambos', descricao: 'Quero alugar e também disponibilizar meus itens' },
  { valor: 'locatario', titulo: 'Apenas Alugar', descricao: 'Quero procurar itens para pegar emprestado' },
  { valor: 'locador', titulo: 'Apenas Disponibilizar', descricao: 'Quero colocar meus itens na plataforma para render uma grana' },
];

function lerUsuarioSalvo() {
  try {
    if (localStorage.getItem('usuarioLogado') !== 'true') return null;
    return JSON.parse(localStorage.getItem('dadosUsuario') || 'null');
  } catch {
    return null;
  }
}

export default function Configuracoes() {
  const navigate = useNavigate();
  const confirmar = useConfirmacao();
  const { notificar } = useNotificacao();
  const [dadosIniciais] = useState(lerUsuarioSalvo);

  const [usuarioLogado, setUsuarioLogado] = useState(dadosIniciais);
  const [objetivoAtual, setObjetivoAtual] = useState(dadosIniciais?.objetivo || 'ambos');
  const [statusVerificacao, setStatusVerificacao] = useState(dadosIniciais?.verificacao?.status || 'nao_enviado');
  const [motivoRejeicao, setMotivoRejeicao] = useState(dadosIniciais?.verificacao?.motivoRejeicao || '');
  const [salvandoObjetivo, setSalvandoObjetivo] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    document.title = 'Configurações';
    return () => {
      document.title = 'LendLoop';
    };
  }, []);

  useEffect(() => {
    const dados = lerUsuarioSalvo();
    if (!dados) return;
    let ativo = true;

    // Busca silenciosa no servidor para garantir que estamos mostrando o status real (caso o admin tenha aprovado/rejeitado)
    async function sincronizarKYC() {
      try {
        const verificacaoAtualizada = await apiRequest(`/api/usuarios/${dados.id}/verificacao`);
        
        if (!ativo) return;
        setStatusVerificacao(verificacaoAtualizada.status || 'nao_enviado');
        setMotivoRejeicao(verificacaoAtualizada.motivoRejeicao || '');

        // Atualiza a memória do navegador para o resto do site saber da novidade
        const dadosAtualizados = { ...dados, verificacao: verificacaoAtualizada };
        setUsuarioLogado(dadosAtualizados);
        localStorage.setItem('dadosUsuario', JSON.stringify(dadosAtualizados));
      } catch (e) {
        if (ativo) notificar(e.message || 'Não foi possível atualizar o status da verificação.', 'erro');
      }
    }

    sincronizarKYC();
    return () => { ativo = false; };
  }, [notificar]);

  function handleVerificacaoEnviada(novoStatus) {
    setStatusVerificacao(novoStatus); 
    
    if (usuarioLogado) {
      const atualizado = {
        ...usuarioLogado,
        verificacao: {
          ...usuarioLogado.verificacao,
          status: novoStatus,
          motivoRejeicao: '' // Limpa o erro se ele enviou de novo
        }
      };
      setUsuarioLogado(atualizado);
      localStorage.setItem('dadosUsuario', JSON.stringify(atualizado));
    }
    notificar('Documentos enviados para análise.', 'sucesso');
  }

  async function handleAlterarObjetivo(valor) {
    if (!usuarioLogado || valor === objetivoAtual) return;

    setErro('');
    setSalvandoObjetivo(true);
    try {
      const data = await apiRequest(`/api/usuarios/${usuarioLogado.id}`, {
        method: 'PUT',
        body: { objetivo: valor },
      });

      const atualizado = { ...usuarioLogado, objetivo: data.usuario.objetivo };
      localStorage.setItem('dadosUsuario', JSON.stringify(atualizado));
      setUsuarioLogado(atualizado);
      setObjetivoAtual(data.usuario.objetivo);
      notificar('Preferência atualizada com sucesso.', 'sucesso');
    } catch (e) {
      notificar(e.message, 'erro');
    } finally {
      setSalvandoObjetivo(false);
    }
  }

  async function handleExcluirConta() {
    if (!usuarioLogado) return;

    const confirmado = await confirmar({
      titulo: 'Excluir conta',
      mensagem: 'Encerrar sua conta? Isso só é possível sem aluguéis em aberto. Seus dados pessoais serão removidos e o histórico concluído ficará anônimo.',
      textoConfirmar: 'Excluir conta',
      variante: 'perigo',
    });
    if (!confirmado) return;

    setErro('');
    setExcluindo(true);
    try {
      await apiRequest(`/api/usuarios/${usuarioLogado.id}`, {
        method: 'DELETE',
      });
      localStorage.removeItem('dadosUsuario');
      localStorage.removeItem('usuarioLogado');
      localStorage.removeItem('token');
      navigate('/login');
    } catch (e) {
      setErro(e.message);
      setExcluindo(false);
    }
  }

  return (
    <div className="page-shell min-h-screen font-sans flex flex-col text-grafite">
      <Header />

      <main className="w-full flex-grow pb-16">
        <div className="mx-auto w-full max-w-7xl px-5 pt-8 sm:px-8 lg:px-10 lg:pt-10 2xl:max-w-[1440px]">
          <button
            onClick={() => navigate(-1)}
            className="flex cursor-pointer items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-verde-escuro"
          >
            <LuArrowLeft size={15} />
            Voltar
          </button>

          <div className="mt-5 max-w-2xl">
            <h1 className="text-3xl font-semibold tracking-tight text-verde-escuro sm:text-4xl">Configurações da conta</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 sm:text-base">Gerencie sua identidade, a forma como você usa o LendLoop e os dados da sua conta.</p>
          </div>

          {erro && (
            <div className="mt-6 bg-red-50 border border-red-100 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">
              {erro}
            </div>
          )}

          <div className="mt-8">

            {usuarioLogado ? (
              <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(22rem,0.85fr)] xl:gap-8">
                <div className="space-y-6">
                {/* === SESSÃO DE VERIFICAÇÃO DE IDENTIDADE (KYC) === */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-5 sm:items-center sm:px-6">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-azul-oceano/10 text-azul-oceano">
                      <LuIdCard size={20} />
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-verde-escuro">Verificação de identidade</h2>
                      <p className="mt-1 text-sm leading-relaxed text-slate-500">
                        Confirme sua identidade para anunciar e alugar com mais segurança.
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    {/* ESTADO 1: APROVADO */}
                    {statusVerificacao === 'aprovado' && (
                      <div className="m-5 flex items-center gap-4 rounded-2xl border border-verde-agua/30 bg-verde-agua/10 p-6 animate-fade-in sm:m-6">
                        <LuCircleCheck size={36} className="text-verde-agua flex-shrink-0" />
                        <div>
                          <h3 className="text-verde-escuro font-bold text-lg">Identidade Verificada!</h3>
                          <p className="text-verde-escuro/80 text-sm mt-1">
                            Sua documentação foi aprovada com sucesso. Você já possui acesso total e seguro à plataforma.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ESTADO 2: PENDENTE */}
                    {statusVerificacao === 'pendente' && (
                      <div className="m-5 flex items-center gap-4 rounded-2xl border border-azul-oceano/25 bg-azul-oceano/10 p-6 animate-fade-in sm:m-6">
                        <LuTimer size={36} className="text-azul-oceano flex-shrink-0" />
                        <div>
                          <h3 className="text-azul-oceano font-bold text-lg">Documentação em Análise</h3>
                          <p className="text-azul-oceano/80 text-sm mt-1">
                            Recebemos seus documentos! Nossa equipe fará a validação em breve. Fique de olho nas notificações.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ESTADO 3: NÃO ENVIADO OU REJEITADO */}
                    {(statusVerificacao === 'nao_enviado' || statusVerificacao === 'rejeitado') && (
                      <div className="animate-fade-in">
                        {statusVerificacao === 'rejeitado' && (
                          <div className="mx-5 mt-5 flex items-center gap-4 rounded-2xl border border-red-100 bg-red-50 p-5 sm:mx-6 sm:mt-6">
                            <LuCircleX size={28} className="text-red-500 flex-shrink-0" />
                            <div>
                              <h3 className="text-red-600 font-bold text-base">Verificação Recusada</h3>
                              <p className="text-red-500/80 text-sm mt-0.5">
                                {motivoRejeicao || 'Houve um problema com as fotos enviadas. Por favor, envie novamente com imagens nítidas.'}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {/* Formulário de Envio (Só aparece se não estiver pendente ou aprovado) */}
                        <VerificacaoIdentidade 
                          usuarioId={usuarioLogado.id} 
                          onVerificacaoEnviada={handleVerificacaoEnviada} 
                        />
                      </div>
                    )}
                  </div>
                </section>

                <section className="relative overflow-hidden rounded-2xl bg-[#031f3b] p-5 text-white shadow-sm sm:p-6">
                  <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-ciano/15 blur-2xl" aria-hidden="true" />
                  <div className="relative">
                    <div className="max-w-xl">
                      <h2 className="text-xl font-bold">Mais confiança dos dois lados.</h2>
                      <p className="mt-1.5 text-sm leading-relaxed text-white/65">A verificação libera as principais formas de participar da comunidade.</p>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-3.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-verde-agua/15 text-verde-agua"><LuMegaphone size={18} /></span>
                        <span className="text-sm font-semibold">Publicar anúncios</span>
                      </div>
                      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-3.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-verde-agua/15 text-verde-agua"><LuShoppingBag size={18} /></span>
                        <span className="text-sm font-semibold">Solicitar aluguéis</span>
                      </div>
                      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-3.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-verde-agua/15 text-verde-agua"><LuBadgeCheck size={18} /></span>
                        <span className="text-sm font-semibold">Selo no perfil</span>
                      </div>
                    </div>
                  </div>
                </section>
                </div>

                <div className="space-y-6 xl:sticky xl:top-28">
                {/* === TIPO DE CONTA === */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center gap-3 border-b border-slate-100 p-5 sm:px-6">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ciano/10 text-ciano">
                      <LuUserCog size={20} />
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-verde-escuro">Como você usa o LendLoop</h2>
                      <p className="mt-1 text-sm leading-relaxed text-slate-500">
                        Escolha entre alugar, disponibilizar itens ou fazer os dois.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3 p-5 sm:p-6">
                    {OPCOES_OBJETIVO.map((op) => (
                      <button
                        type="button"
                        key={op.valor}
                        onClick={() => handleAlterarObjetivo(op.valor)}
                        disabled={salvandoObjetivo}
                        aria-pressed={objetivoAtual === op.valor}
                        className={`flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition-all ${
                          objetivoAtual === op.valor
                            ? 'border-verde-agua bg-verde-agua/10 shadow-sm ring-1 ring-verde-agua'
                            : 'border-gray-200 hover:border-azul-oceano/35 hover:bg-azul-oceano/[0.025]'
                        } ${salvandoObjetivo ? 'opacity-60 pointer-events-none' : ''}`}
                      >
                        <span>
                          <span className={`block text-sm font-semibold ${objetivoAtual === op.valor ? 'text-verde-escuro' : 'text-grafite'}`}>{op.titulo}</span>
                          <span className="mt-0.5 block text-xs text-gray-500">{op.descricao}</span>
                        </span>
                        {objetivoAtual === op.valor && <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-verde-agua text-white"><LuCheck size={15} /></span>}
                      </button>
                    ))}
                  </div>
                </section>

                {/* === ZONA DE PERIGO === */}
                <section className="overflow-hidden rounded-2xl border border-red-100 bg-white shadow-sm">
                  <div className="flex items-center gap-3 border-b border-red-100 bg-red-50/50 p-5 sm:px-6">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100/70 text-red-500">
                      <LuShieldAlert size={20} />
                    </span>
                    <h2 className="text-lg font-bold text-red-500">Zona de Perigo</h2>
                  </div>
                  <div className="flex flex-col gap-4 p-5 sm:p-6">
                    <div>
                      <p className="text-sm font-bold text-grafite">Excluir minha conta</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Disponível somente sem aluguéis em aberto. Seus dados pessoais serão removidos e o histórico concluído ficará anonimizado.
                      </p>
                    </div>
                    <button
                      onClick={handleExcluirConta}
                      disabled={excluindo}
                      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-red-500 transition-colors hover:bg-red-100 disabled:pointer-events-none disabled:opacity-60"
                    >
                      <LuTrash2 size={14} /> {excluindo ? 'Excluindo...' : 'Excluir Conta'}
                    </button>
                  </div>
                </section>
                </div>
              </div>
            ) : (
              <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-center">
                <p className="text-sm font-bold text-grafite">Faça login para gerenciar sua conta</p>
                <p className="text-xs text-gray-400 mt-1">
                  Entre na sua conta para alterar o tipo de conta ou excluí-la.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="mt-4 bg-verde-agua text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-verde-escuro transition-colors cursor-pointer uppercase tracking-widest"
                >
                  Entrar
                </button>
              </section>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
