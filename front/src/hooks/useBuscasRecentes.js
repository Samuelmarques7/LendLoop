import { useState } from 'react';
import { SUGESTOES_POPULARES } from '../constants/buscasPopulares';

const CHAVE_BUSCAS_RECENTES = 'buscasRecentes';
const MAX_BUSCAS_RECENTES = 5;
const termosPopulares = new Set(SUGESTOES_POPULARES.map((termo) => termo.toLocaleLowerCase('pt-BR')));

function ehBuscaPopular(termo) {
  return termosPopulares.has(termo.trim().toLocaleLowerCase('pt-BR'));
}

function carregarBuscasRecentes() {
  try {
    const salvas = JSON.parse(localStorage.getItem(CHAVE_BUSCAS_RECENTES) || '[]');
    return Array.isArray(salvas) ? salvas.filter((termo) => !ehBuscaPopular(termo)) : [];
  } catch {
    return [];
  }
}

export function useBuscasRecentes() {
  const [buscasRecentes, setBuscasRecentes] = useState(carregarBuscasRecentes);

  function salvarBuscaRecente(termo) {
    const termoLimpo = termo.trim();
    if (!termoLimpo || ehBuscaPopular(termoLimpo)) return;

    setBuscasRecentes((atual) => {
      const semDuplicata = atual.filter((b) => b.toLowerCase() !== termoLimpo.toLowerCase());
      const atualizado = [termoLimpo, ...semDuplicata].slice(0, MAX_BUSCAS_RECENTES);
      localStorage.setItem(CHAVE_BUSCAS_RECENTES, JSON.stringify(atualizado));
      return atualizado;
    });
  }

  function removerBuscaRecente(termo, e) {
    e?.stopPropagation();
    setBuscasRecentes((atual) => {
      const atualizado = atual.filter((b) => b !== termo);
      localStorage.setItem(CHAVE_BUSCAS_RECENTES, JSON.stringify(atualizado));
      return atualizado;
    });
  }

  function limparBuscasRecentes() {
    localStorage.removeItem(CHAVE_BUSCAS_RECENTES);
    setBuscasRecentes([]);
  }

  return { buscasRecentes, salvarBuscaRecente, removerBuscaRecente, limparBuscasRecentes };
}
