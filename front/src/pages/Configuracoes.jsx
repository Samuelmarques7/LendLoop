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
  LuCircleX
} from 'react-icons/lu';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { VerificacaoIdentidade } from '../components/VerificacaoIdentidade';
import { apiRequest } from '../services/api';
import { useConfirmacao } from '../context/ConfirmacaoContext';

const OPCOES_OBJETIVO = [
  { valor: 'ambos', titulo: 'Ambos', descricao: 'Quero alugar e também disponibilizar meus itens' },
  { valor: 'locatario', titulo: 'Apenas Alugar', descricao: 'Quero procurar itens para pegar emprestado' },
  { valor: 'locador', titulo: 'Apenas Disponibilizar', descricao: 'Quero colocar meus itens na plataforma para render uma grana' },
];

export default function Configuracoes() {
  const navigate = useNavigate();

  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [objetivoAtual, setObjetivoAtual] = useState('ambos');
  const [statusVerificacao, setStatusVerificacao] = useState('nao_enviado'); 
  const [motivoRejeicao, setMotivoRejeicao] = useState(''); // Guarda o motivo que o admin escreveu
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
    const isLogado = localStorage.getItem('usuarioLogado') === 'true';
    const dados = JSON.parse(localStorage.getItem('dadosUsuario') || 'null');

    if (!isLogado || !dados) {
      return;
    }

    setUsuarioLogado(dados);
    setObjetivoAtual(dados.objetivo || 'ambos');
    
    // Carrega o status salvo na memória primeiro para não a tela não piscar
    setStatusVerificacao(dados.verificacao?.status || 'nao_enviado');
    setMotivoRejeicao(dados.verificacao?.motivoRejeicao || '');

    // Busca silenciosa no servidor para garantir que estamos mostrando o status real (caso o admin tenha aprovado/rejeitado)
    async function sincronizarKYC() {
      try {
        const verificacaoAtualizada = await apiRequest(`/api/usuarios/${dados.id}/verificacao`);
        
        setStatusVerificacao(verificacaoAtualizada.status || 'nao_enviado');
        setMotivoRejeicao(verificacaoAtualizada.motivoRejeicao || '');

        // Atualiza a memória do navegador para o resto do site saber da novidade
        const dadosAtualizados = { ...dados, verificacao: verificacaoAtualizada };
        setUsuarioLogado(dadosAtualizados);
        localStorage.setItem('dadosUsuario', JSON.stringify(dadosAtualizados));
      } catch (e) {
        console.error("Erro ao sincronizar status de verificação:", e);
      }
    }

    sincronizarKYC();
  }, []);

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
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvandoObjetivo(false);
    }
  }

  async function handleExcluirConta() {
    if (!usuarioLogado) return;

    const confirmado = await confirmar({
      titulo: 'Excluir conta',
      mensagem: 'Tem certeza que deseja excluir sua conta? Essa ação não pode ser desfeita.',
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
    <div className="min-h-screen bg-[#F8F9FA] font-sans flex flex-col text-[#1A1A1A]">
      <Header />

      <main className="flex-grow w-full pb-16">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 pt-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-[#1A1A1A] transition-colors cursor-pointer"
          >
            <LuArrowLeft size={15} />
            Voltar
          </button>

          <h1 className="text-2xl font-black text-[#1A1A1A] mt-4">Configurações</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gerencie sua conta e as preferências da plataforma.
          </p>

          {erro && (
            <div className="mt-6 bg-red-50 border border-red-100 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">
              {erro}
            </div>
          )}

          <div className="mt-8 space-y-8">

            {usuarioLogado ? (
              <>
                {/* === SESSÃO DE VERIFICAÇÃO DE IDENTIDADE (KYC) === */}
                <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                    <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#0F6E56]/10 text-[#0F6E56]">
                      <LuIdCard size={20} />
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-[#1A1A1A]">Verificação de Identidade (KYC)</h2>
                      <p className="text-xs text-gray-400 mt-1">
                        Envie seus documentos oficiais para liberar todos os recursos da plataforma.
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-gray-50/50">
                    {/* ESTADO 1: APROVADO */}
                    {statusVerificacao === 'aprovado' && (
                      <div className="bg-[#29C354]/10 border border-[#29C354]/30 rounded-2xl p-6 flex items-center gap-4 animate-fade-in">
                        <LuCircleCheck size={36} className="text-[#29C354] flex-shrink-0" />
                        <div>
                          <h3 className="text-[#0F6E56] font-bold text-lg">Identidade Verificada!</h3>
                          <p className="text-[#0F6E56]/80 text-sm mt-1">
                            Sua documentação foi aprovada com sucesso. Você já possui acesso total e seguro à plataforma.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ESTADO 2: PENDENTE */}
                    {statusVerificacao === 'pendente' && (
                      <div className="bg-[#0068F3]/10 border border-[#0068F3]/30 rounded-2xl p-6 flex items-center gap-4 animate-fade-in">
                        <LuTimer size={36} className="text-[#0068F3] flex-shrink-0" />
                        <div>
                          <h3 className="text-[#0068F3] font-bold text-lg">Documentação em Análise</h3>
                          <p className="text-[#0068F3]/80 text-sm mt-1">
                            Recebemos seus documentos! Nossa equipe fará a validação em breve. Fique de olho nas notificações.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ESTADO 3: NÃO ENVIADO OU REJEITADO */}
                    {(statusVerificacao === 'nao_enviado' || statusVerificacao === 'rejeitado') && (
                      <div className="animate-fade-in">
                        {statusVerificacao === 'rejeitado' && (
                          <div className="bg-red-50 border border-red-100 rounded-2xl p-5 mb-6 flex items-center gap-4">
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

                {/* === TIPO DE CONTA === */}
                <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                    <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#0068F3]/10 text-[#0068F3]">
                      <LuUserCog size={20} />
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-[#1A1A1A]">Tipo de Conta</h2>
                      <p className="text-xs text-gray-400 mt-1">
                        Mudou de ideia? Ajuste aqui o que você quer fazer no LendLoop.
                      </p>
                    </div>
                  </div>
                  <div className="p-6 space-y-3">
                    {OPCOES_OBJETIVO.map((op) => (
                      <div
                        key={op.valor}
                        onClick={() => handleAlterarObjetivo(op.valor)}
                        className={`p-4 border rounded-2xl cursor-pointer transition-all ${
                          objetivoAtual === op.valor
                            ? 'border-[#29C354] bg-[#29C354]/10 ring-1 ring-[#29C354]'
                            : 'border-gray-200 hover:border-[#29C354]/50'
                        } ${salvandoObjetivo ? 'opacity-60 pointer-events-none' : ''}`}
                      >
                        <span className={`block text-sm font-bold ${
                          objetivoAtual === op.valor ? 'text-[#032D54]' : 'text-[#1A1A1A]'
                        }`}>
                          {op.titulo}
                        </span>
                        <span className="block text-xs text-gray-500 mt-0.5">{op.descricao}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* === ZONA DE PERIGO === */}
                <section className="bg-white rounded-3xl border border-red-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-red-100 flex items-center gap-3">
                    <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 text-red-500">
                      <LuShieldAlert size={20} />
                    </span>
                    <h2 className="text-lg font-bold text-red-500">Zona de Perigo</h2>
                  </div>
                  <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-[#1A1A1A]">Excluir minha conta</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Essa ação é permanente e remove seus dados e anúncios.
                      </p>
                    </div>
                    <button
                      onClick={handleExcluirConta}
                      disabled={excluindo}
                      className="flex items-center justify-center gap-2 bg-red-50 text-red-500 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-red-100 transition-colors cursor-pointer uppercase tracking-widest disabled:opacity-60 disabled:pointer-events-none"
                    >
                      <LuTrash2 size={14} /> {excluindo ? 'Excluindo...' : 'Excluir Conta'}
                    </button>
                  </div>
                </section>
              </>
            ) : (
              <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-center">
                <p className="text-sm font-bold text-[#1A1A1A]">Faça login para gerenciar sua conta</p>
                <p className="text-xs text-gray-400 mt-1">
                  Entre na sua conta para alterar o tipo de conta ou excluí-la.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="mt-4 bg-[#29C354] text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-[#032D54] transition-colors cursor-pointer uppercase tracking-widest"
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