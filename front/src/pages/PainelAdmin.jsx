import { useEffect, useState } from 'react';
import { LuShieldCheck, LuCheck, LuX, LuLoaderCircle, LuUser, LuMaximize2, LuCircleX } from 'react-icons/lu';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { apiRequest, API_URL } from '../services/api';

const ABAS = [
  { valor: 'pendente', titulo: 'Pendentes' },
  { valor: 'aprovado', titulo: 'Aprovados' },
  { valor: 'rejeitado', titulo: 'Rejeitados' },
];

export default function PainelAdmin() {
  const [abaAtiva, setAbaAtiva] = useState('pendente');
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [selecionado, setSelecionado] = useState(null);
  
  const [urlsDocumentos, setUrlsDocumentos] = useState({ documentoFrente: '', documentoVerso: '', selfie: '' });
  const [carregandoDocumentos, setCarregandoDocumentos] = useState(false);
  const [motivoRejeicao, setMotivoRejeicao] = useState('');
  const [processando, setProcessando] = useState(false);
  const [imagemExpandida, setImagemExpandida] = useState(null); // Estado para o Zoom da imagem

  useEffect(() => {
    document.title = 'Painel Admin';
    return () => { document.title = 'LendLoop'; };
  }, []);

  useEffect(() => {
    buscarUsuarios(abaAtiva);
    setSelecionado(null);
  }, [abaAtiva]);

  async function buscarUsuarios(status) {
    setCarregando(true);
    setErro('');
    try {
      const dados = await apiRequest(`/api/admin/verificacoes?status=${status}`);
      setUsuarios(dados);
    } catch (e) {
      setErro('Não foi possível carregar a lista de usuários.');
    } finally {
      setCarregando(false);
    }
  }

  // Função isolada para buscar cada imagem sem quebrar a tela se der erro
  async function buscarImagem(usuarioId, campo) {
  try {
    const token = localStorage.getItem('token');
    const resposta = await fetch(`${API_URL}/api/admin/verificacoes/${usuarioId}/documento/${campo}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!resposta.ok) return '';

    const blob = await resposta.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    return '';
  }
}

  async function abrirVerificacao(usuario) {
    setSelecionado(usuario);
    setMotivoRejeicao('');
    setUrlsDocumentos({ documentoFrente: '', documentoVerso: '', selfie: '' });
    setCarregandoDocumentos(true);
    setErro('');

    try {
      // Busca as fotos de forma independente e à prova de falhas
      const [frente, verso, selfie] = await Promise.all([
        buscarImagem(usuario._id, 'documentoFrente'),
        buscarImagem(usuario._id, 'documentoVerso'),
        buscarImagem(usuario._id, 'selfie'),
      ]);
      
      setUrlsDocumentos({ 
        documentoFrente: frente, 
        documentoVerso: verso, 
        selfie: selfie 
      });
    } catch (e) {
      setErro('Ocorreu um erro ao carregar os documentos.');
    } finally {
      setCarregandoDocumentos(false);
    }
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
    } catch (e) {
      setErro(e.message);
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F8]">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-[#032D54]/10 p-3 rounded-2xl">
            <LuCircleX size={18} /> {erro}
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#032D54]">Centro de Verificação (KYC)</h1>
            <p className="text-sm text-gray-500 mt-1">Aprove ou rejeite documentos de identidade dos usuários.</p>
          </div>
        </div>

        <div className="flex gap-2 mb-8 bg-white p-1.5 rounded-2xl w-fit shadow-sm border border-gray-100">
          {ABAS.map((aba) => (
            <button
              key={aba.valor}
              onClick={() => setAbaAtiva(aba.valor)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                abaAtiva === aba.valor
                  ? 'bg-[#032D54] text-white shadow-md'
                  : 'bg-transparent text-gray-500 hover:text-[#032D54] hover:bg-gray-50'
              }`}
            >
              {aba.titulo}
            </button>
          ))}
        </div>

        {erro && (
          <div className="mb-6 px-5 py-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold flex items-center gap-2 animate-fade-in">
            <LuXCircle size={18} /> {erro}
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_2fr] gap-8">
          
          {/* LISTA DE USUÁRIOS */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden h-fit max-h-[700px] flex flex-col">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Lista de Requisições</h2>
            </div>
            
            <div className="overflow-y-auto flex-1 p-2">
              {carregando ? (
                <div className="flex flex-col items-center justify-center py-16 text-[#032D54]/40">
                  <LuLoaderCircle className="animate-spin mb-2" size={32} />
                  <p className="text-sm font-medium">Carregando lista...</p>
                </div>
              ) : usuarios.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <LuUser size={40} className="mb-3 opacity-20" />
                  <p className="text-sm font-medium">Fila vazia no momento.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {usuarios.map((usuario) => (
                    <button
                      key={usuario._id}
                      onClick={() => abrirVerificacao(usuario)}
                      className={`w-full text-left p-4 rounded-2xl transition-all cursor-pointer flex items-center gap-4 ${
                        selecionado?._id === usuario._id 
                        ? 'bg-[#032D54]/5 ring-1 ring-[#032D54]/20' 
                        : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                        selecionado?._id === usuario._id ? 'bg-[#032D54] text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {usuario.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold truncate ${selecionado?._id === usuario._id ? 'text-[#032D54]' : 'text-gray-800'}`}>
                          {usuario.nome}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{usuario.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* PAINEL DE VISUALIZAÇÃO E APROVAÇÃO */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 h-fit min-h-[500px]">
            {!selecionado ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-32">
                <LuShieldCheck size={60} className="opacity-20 mb-4" />
                <p className="text-lg font-medium text-gray-500">Selecione um usuário para analisar</p>
                <p className="text-sm mt-1">Os documentos aparecerão aqui.</p>
              </div>
            ) : (
              <div className="animate-fade-in">
                <div className="mb-8 pb-6 border-b border-gray-100">
                  <h2 className="text-2xl font-black text-[#032D54]">{selecionado.nome}</h2>
                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500 font-medium">
                    <span className="bg-gray-100 px-3 py-1 rounded-full">{selecionado.email}</span>
                    {selecionado.telefone && <span className="bg-gray-100 px-3 py-1 rounded-full">{selecionado.telefone}</span>}
                    {selecionado.verificacao?.enviadoEm && (
                      <span className="bg-[#032D54]/10 text-[#032D54] px-3 py-1 rounded-full">
                        Enviado em {new Date(selecionado.verificacao.enviadoEm).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>

                {carregandoDocumentos ? (
                  <div className="flex flex-col items-center justify-center py-20 text-[#032D54]/40">
                    <LuLoaderCircle className="animate-spin mb-3" size={40} />
                    <p className="font-medium">Carregando documentos seguros...</p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider">Documentos Anexados</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                      <ImageCard label="Frente do Documento" url={urlsDocumentos.documentoFrente} onZoom={() => setImagemExpandida(urlsDocumentos.documentoFrente)} />
                      <ImageCard label="Verso do Documento" url={urlsDocumentos.documentoVerso} onZoom={() => setImagemExpandida(urlsDocumentos.documentoVerso)} />
                      <ImageCard label="Selfie c/ Documento" url={urlsDocumentos.selfie} onZoom={() => setImagemExpandida(urlsDocumentos.selfie)} />
                    </div>
                  </>
                )}

                {abaAtiva === 'pendente' && !carregandoDocumentos && (
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 mt-6">
                    <h3 className="text-sm font-bold text-gray-800 mb-3">Decisão de Análise</h3>
                    <textarea
                      value={motivoRejeicao}
                      onChange={(e) => setMotivoRejeicao(e.target.value)}
                      placeholder="Motivo (obrigatório apenas se for rejeitar o documento)"
                      rows={2}
                      className="w-full text-sm border border-gray-300 rounded-xl p-4 mb-4 focus:outline-none focus:ring-2 focus:ring-[#032D54]/20 focus:border-[#032D54] transition-all resize-none bg-white"
                    />
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={() => decidir('aprovar')}
                        disabled={processando}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#29C354] text-white font-bold py-3.5 rounded-xl hover:bg-[#22a848] transition-colors cursor-pointer disabled:opacity-50 shadow-sm shadow-[#29C354]/30"
                      >
                        <LuCheck size={20} /> Aprovar Perfil
                      </button>
                      <button
                        onClick={() => decidir('rejeitar')}
                        disabled={processando}
                        className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-red-100 text-red-500 font-bold py-3.5 rounded-xl hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <LuX size={20} /> Rejeitar Documentos
                      </button>
                    </div>
                  </div>
                )}

                {selecionado.verificacao?.status === 'rejeitado' && selecionado.verificacao?.motivoRejeicao && (
                  <div className="mt-6 p-5 bg-red-50 border border-red-100 rounded-2xl">
                    <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2">Motivo da Rejeição</p>
                    <p className="text-sm text-red-800 font-medium">{selecionado.verificacao.motivoRejeicao}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* MODAL DE ZOOM DE IMAGEM */}
      {imagemExpandida && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setImagemExpandida(null)}>
          <button 
            className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors cursor-pointer"
            onClick={() => setImagemExpandida(null)}
          >
            <LuX size={40} />
          </button>
          <img 
            src={imagemExpandida} 
            alt="Documento em tela cheia" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()} // Evita fechar ao clicar na própria imagem
          />
        </div>
      )}
    </div>
  );
}

// Subcomponente interno para deixar o código principal mais limpo
function ImageCard({ label, url, onZoom }) {
  return (
    <div className="flex flex-col group">
      <p className="text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wider">{label}</p>
      {url ? (
        <div className="relative rounded-2xl border border-gray-200 overflow-hidden bg-gray-100 shadow-sm aspect-[4/3] cursor-zoom-in" onClick={onZoom}>
          <img src={url} alt={label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
             <LuMaximize2 size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 aspect-[4/3] flex flex-col items-center justify-center text-gray-400">
          <LuCircleX size={24} className="mb-2 opacity-50" />
          <span className="text-xs font-medium">Indisponível</span>
        </div>
      )}
    </div>
  );
}