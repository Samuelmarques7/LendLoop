import { useState, useEffect } from 'react';
import { LuStar } from 'react-icons/lu';
import { apiRequest } from '../services/api';

const tamanhos = {
  sm: { icone: 14, texto: 'text-xs' },
  md: { icone: 16, texto: 'text-sm' },
  lg: { icone: 18, texto: 'text-base' }
};

export function MediaAvaliacao({ usuarioId, dadosExternos, tamanho = 'md', className = '' }) {
  const [dados, setDados] = useState(dadosExternos || null);
  const { icone, texto } = tamanhos[tamanho] || tamanhos.md;

  useEffect(() => {
    if (dadosExternos !== undefined) {
      setDados(dadosExternos);
      return;
    }

    async function carregar() {
      try {
        const resposta = await apiRequest(`/api/avaliacoes/usuario/${usuarioId}`);
        setDados(resposta);
      } catch (e) {
        setDados(null);
      }
    }
    if (usuarioId) carregar();
  }, [usuarioId, dadosExternos]);

  if (!dados || dados.total === 0) {
    return (
      <span className={`${texto} text-gray-400 font-medium ${className}`}>
        Sem avaliações ainda
      </span>
    );
  }

  return (
    <span className={`flex items-center gap-1.5 ${texto} font-bold text-[#1A1A1A] ${className}`}>
      <LuStar size={icone} className="text-yellow-400" fill="currentColor" />
      {dados.media}
      <span className="text-gray-400 font-medium">
        ({dados.total} avaliaç{dados.total === 1 ? 'ão' : 'ões'})
      </span>
    </span>
  );
}