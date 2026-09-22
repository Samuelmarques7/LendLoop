import { useState } from 'react';
import { LuCloudUpload, LuShieldCheck, LuTriangleAlert, LuCircleCheck } from "react-icons/lu";

export function VerificacaoIdentidade({ usuarioId, statusAtual, onVerificacaoEnviada }) {
  const [cpf, setCpf] = useState('');
  const [arquivos, setArquivos] = useState({ frente: null, verso: null, selfie: null });
  const [enviando, setEnviando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState('');

  if (statusAtual === 'aprovado') {
    return (
      <div className="bg-verde-escuro/10 border border-verde-escuro/30 p-6 rounded-2xl flex flex-col items-center text-center">
        <LuCircleCheck size={40} className="text-verde-escuro mb-3" />
        <h3 className="text-verde-escuro font-bold text-lg">Identidade Verificada</h3>
        <p className="text-verde-escuro/80 text-sm mt-1">Sua conta está aprovada com segurança máxima na plataforma.</p>
      </div>
    );
  }

  if (statusAtual === 'pendente') {
    return (
      <div className="bg-azul-oceano/10 border border-azul-oceano/30 p-6 rounded-2xl flex flex-col items-center text-center">
        <LuShieldCheck size={40} className="text-azul-oceano mb-3 animate-pulse" />
        <h3 className="text-azul-oceano font-bold text-lg">Documentos em Análise</h3>
        <p className="text-azul-oceano/80 text-sm mt-1">Nossa equipe está avaliando seus documentos. Isso pode levar até 24 horas.</p>
      </div>
    );
  }

  function handleFileChange(e, tipo) {
    setMensagemErro(''); // Limpa o erro quando o usuário tenta corrigir
    setArquivos({ ...arquivos, [tipo]: e.target.files[0] });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMensagemErro(''); // Limpa erros antigos

    if (!cpf || !arquivos.frente || !arquivos.verso || !arquivos.selfie) {
      setMensagemErro('Por favor, preencha o CPF e anexe as 3 fotos solicitadas antes de enviar.');
      return;
    }

    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append('cpf', cpf);
      formData.append('frente', arquivos.frente);
      formData.append('verso', arquivos.verso); // <-- Nome batendo com o server.js
      formData.append('selfie', arquivos.selfie);

      const token = localStorage.getItem('token');

      // ATENÇÃO: Se o seu backend rodar em outra porta (ex: 5000), mude o "3000" aqui abaixo!
      const res = await fetch(`http://localhost:3000/api/usuarios/${usuarioId}/verificacao`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token
        },
        body: formData,
      });

      // Lemos como texto primeiro para evitar o erro do "<!DOCTYPE"
      const textoResposta = await res.text();

      let data;
      try {
        data = JSON.parse(textoResposta);
      } catch {
        // Se cair aqui, o servidor devolveu HTML em vez de JSON
        console.error("Resposta HTML recebida:", textoResposta);
        throw new Error("Erro 404: Rota de upload não encontrada no servidor. Verifique o server.js!");
      }

      if (!res.ok) throw new Error(data.erro || 'Erro ao enviar documentos.');

      // Verifica se a função existe. Se não existir, apenas recarrega a página 
      // para puxar o novo status do banco de dados e mostrar a tela azul de "Pendente"
      if (typeof onVerificacaoEnviada === 'function') {
        onVerificacaoEnviada('pendente');
      } else {
        window.location.reload();
      }
      
    } catch (erro) {
      setMensagemErro(erro.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-6 rounded-2xl space-y-5 shadow-sm">
      <div>
        <h3 className="text-lg font-bold text-grafite">Verificação de Identidade (KYC)</h3>
        <p className="text-sm text-gray-500 mt-1">Para garantir a segurança do LendLoop, precisamos verificar sua identidade.</p>
      </div>

      {statusAtual === 'recusado' && (
        <div className="bg-red-50 text-[#A32D2D] p-4 rounded-xl border border-red-200 flex items-start gap-3">
          <LuTriangleAlert size={20} className="flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold">Documentos recusados</p>
            <p>Por favor, envie fotos mais nítidas e legíveis para tentarmos novamente.</p>
          </div>
        </div>
      )}

      {/* NOVO AVISO DE ERRO INTEGRADO NA UI */}
      {mensagemErro && (
        <div className="bg-red-50 text-[#A32D2D] p-4 rounded-xl border border-red-200 flex items-center gap-3 animate-fade-in">
          <LuTriangleAlert size={18} className="flex-shrink-0" />
          <p className="text-sm font-medium">{mensagemErro}</p>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">CPF</label>
        <input
          type="text"
          value={cpf}
          onChange={(e) => {
            setCpf(e.target.value);
            setMensagemErro(''); // Limpa o erro ao digitar
          }}
          placeholder="000.000.000-00"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-azul-oceano"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
    <label className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors text-center relative overflow-hidden group">
      <LuCloudUpload size={24} className={arquivo ? "text-verde-escuro" : "text-gray-400 group-hover:text-azul-oceano transition-colors"} />
      <span className="text-xs font-bold text-gray-700 z-10 relative">{label}</span>
      <span className={`text-[10px] truncate max-w-full px-2 z-10 relative ${arquivo ? "text-verde-escuro font-semibold" : "text-gray-400"}`}>
        {arquivo ? arquivo.name : 'Clique para selecionar'}
      </span>
      <input type="file" accept="image/*" className="hidden" onChange={onChange} />
      
      {/* Fundo verde suave se o arquivo foi selecionado */}
      {arquivo && <div className="absolute inset-0 bg-verde-escuro/5 pointer-events-none"></div>}
    </label>
  );
}
