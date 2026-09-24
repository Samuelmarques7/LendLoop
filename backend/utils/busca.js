const PALAVRAS_IGNORADAS = new Set([
  'a', 'as', 'o', 'os', 'de', 'da', 'das', 'do', 'dos', 'e', 'em',
  'na', 'nas', 'no', 'nos', 'para', 'por', 'com', 'um', 'uma',
]);

const VARIANTES_ACENTOS = {
  a: '[aáàâãä]',
  c: '[cç]',
  e: '[eéèêë]',
  i: '[iíìîï]',
  n: '[nñ]',
  o: '[oóòôõö]',
  u: '[uúùûü]',
};

function normalizarTexto(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function extrairTermosBusca(busca) {
  const palavras = normalizarTexto(busca).split(/\s+/).filter(Boolean);
  const relevantes = palavras.filter((palavra) => !PALAVRAS_IGNORADAS.has(palavra));
  return [...new Set(relevantes.length > 0 ? relevantes : palavras)].slice(0, 8);
}

function regexParaTermo(termo) {
  const expressao = [...termo]
    .map((caractere) => VARIANTES_ACENTOS[caractere] || caractere.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('');
  return new RegExp(expressao, 'i');
}

function criarFiltroBusca(busca) {
  const termos = extrairTermosBusca(busca);
  if (termos.length === 0) return {};

  const campos = [
    'titulo',
    'descricao',
    'categoria',
    'subcategorias',
    'especificacoes.chave',
    'especificacoes.valor',
  ];

  return {
    $and: termos.map((termo) => {
      const regex = regexParaTermo(termo);
      return { $or: campos.map((campo) => ({ [campo]: regex })) };
    }),
  };
}

function pontuarAnuncio(anuncio, busca) {
  const frase = normalizarTexto(busca);
  const termos = extrairTermosBusca(busca);
  const titulo = normalizarTexto(anuncio.titulo);
  const categoria = normalizarTexto(anuncio.categoria);
  const subcategorias = normalizarTexto((anuncio.subcategorias || []).join(' '));
  const especificacoes = normalizarTexto((anuncio.especificacoes || [])
    .map((item) => `${item.chave || ''} ${item.valor || ''}`)
    .join(' '));
  const descricao = normalizarTexto(anuncio.descricao);

  let pontos = 0;
  if (titulo === frase) pontos += 100;
  else if (titulo.includes(frase)) pontos += 50;

  for (const termo of termos) {
    if (titulo.includes(termo)) pontos += 12;
    if (categoria.includes(termo)) pontos += 6;
    if (subcategorias.includes(termo)) pontos += 4;
    if (especificacoes.includes(termo)) pontos += 3;
    if (descricao.includes(termo)) pontos += 1;
  }
  return pontos;
}

module.exports = { criarFiltroBusca, extrairTermosBusca, normalizarTexto, pontuarAnuncio };
