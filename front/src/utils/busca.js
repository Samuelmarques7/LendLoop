const PALAVRAS_IGNORADAS = new Set([
  'a', 'as', 'o', 'os', 'de', 'da', 'das', 'do', 'dos', 'e', 'em',
  'na', 'nas', 'no', 'nos', 'para', 'por', 'com', 'um', 'uma',
]);

export function normalizarBusca(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function correspondeBusca(texto, busca) {
  const textoNormalizado = normalizarBusca(texto);
  const palavras = normalizarBusca(busca).split(/\s+/).filter(Boolean);
  const relevantes = palavras.filter((palavra) => !PALAVRAS_IGNORADAS.has(palavra));
  const termos = relevantes.length > 0 ? relevantes : palavras;
  return termos.every((termo) => textoNormalizado.includes(termo));
}
