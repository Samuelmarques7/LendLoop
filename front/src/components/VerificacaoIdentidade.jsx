import { useState } from 'react';
import { LuCloudUpload, LuTriangleAlert } from "react-icons/lu";
import { apiRequest } from '../services/api';
import { cpfValido, formatarCpf } from '../utils/cpf';

const TIPOS_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp']);
const TAMANHO_MAXIMO = 5 * 1024 * 1024;

export function VerificacaoIdentidade({ usuarioId, onVerificacaoEnviada }) {
  const [cpf, setCpf] = useState('');
  const [arquivos, setArquivos] = useState({ frente: null, verso: null, selfie: null });
  const [enviando, setEnviando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState('');

  function handleFileChange(e, tipo) {
    const arquivo = e.target.files?.[0];
    setMensagemErro('');
    if (!arquivo) return;
    if (!TIPOS_PERMITIDOS.has(arquivo.type)) {
      setMensagemErro('Envie somente imagens JPG, PNG ou WebP.');
      e.target.value = '';
      return;
    }
    if (arquivo.size > TAMANHO_MAXIMO) {
      setMensagemErro('Cada imagem deve ter no máximo 5 MB.');
      e.target.value = '';
      return;
    }
    setArquivos((atuais) => ({ ...atuais, [tipo]: arquivo }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMensagemErro(''); // Limpa erros antigos

    if (!cpf || !arquivos.frente || !arquivos.verso || !arquivos.selfie) {
      setMensagemErro('Por favor, preencha o CPF e anexe as 3 fotos solicitadas antes de enviar.');
      return;
    }
    if (!cpfValido(cpf)) {
      setMensagemErro('Informe um CPF válido.');
      return;
    }

    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append('cpf', cpf);
      formData.append('frente', arquivos.frente);
      formData.append('verso', arquivos.verso); // <-- Nome batendo com o server.js
      formData.append('selfie', arquivos.selfie);

      await apiRequest(`/api/usuarios/${usuarioId}/verificacao`, {
        method: 'POST',
        body: formData,
      });
      onVerificacaoEnviada?.('pendente');
      
    } catch (erro) {
      setMensagemErro(erro.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
      {mensagemErro && (
        <div role="alert" className="bg-red-50 text-[#A32D2D] p-4 rounded-xl border border-red-200 flex items-center gap-3 animate-fade-in">
          <LuTriangleAlert size={18} className="flex-shrink-0" />
          <p className="text-sm font-medium">{mensagemErro}</p>
        </div>
      )}

      <div>
        <label htmlFor="cpf-verificacao" className="block text-xs font-bold text-gray-700 mb-1">CPF</label>
        <input
          id="cpf-verificacao"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={14}
          value={cpf}
          onChange={(e) => {
            setCpf(formatarCpf(e.target.value));
            setMensagemErro('');
          }}
          placeholder="000.000.000-00"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-azul-oceano"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <UploadBox label="RG/CNH (Frente)" onChange={(e) => handleFileChange(e, 'frente')} arquivo={arquivos.frente} />
        <UploadBox label="RG/CNH (Verso)" onChange={(e) => handleFileChange(e, 'verso')} arquivo={arquivos.verso} />
        <UploadBox label="Selfie c/ Documento" onChange={(e) => handleFileChange(e, 'selfie')} arquivo={arquivos.selfie} />
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="w-full bg-azul-oceano text-white font-bold py-3.5 rounded-xl hover:bg-azul-oceano transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {enviando ? 'Enviando arquivos...' : 'Enviar para análise'}
      </button>
    </form>
  );
}

function UploadBox({ label, onChange, arquivo }) {
  return (
    <label className="group relative flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-slate-200 p-4 text-center transition-colors hover:border-azul-oceano/35 hover:bg-azul-oceano/[0.025]">
      <LuCloudUpload size={24} className={arquivo ? "text-verde-escuro" : "text-gray-400 group-hover:text-azul-oceano transition-colors"} />
      <span className="text-xs font-bold text-gray-700 z-10 relative">{label}</span>
      <span className={`text-[10px] truncate max-w-full px-2 z-10 relative ${arquivo ? "text-verde-escuro font-semibold" : "text-gray-400"}`}>
        {arquivo ? arquivo.name : 'Clique para selecionar'}
      </span>
      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onChange} />
      
      {/* Fundo verde suave se o arquivo foi selecionado */}
      {arquivo && <div className="absolute inset-0 bg-verde-escuro/5 pointer-events-none"></div>}
    </label>
  );
}
