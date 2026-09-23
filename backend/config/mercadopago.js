if (!process.env.MP_ACCESS_TOKEN) {
  throw new Error('MP_ACCESS_TOKEN precisa estar configurado.');
}

const URL_API = 'https://api.mercadopago.com';

// Erro de uma chamada à API do Mercado Pago. Diferente do SDK, preserva o
// corpo da resposta, que é onde o Mercado Pago explica o motivo da recusa.
class ErroMercadoPago extends Error {
  constructor(status, corpo) {
    const detalhes = (corpo?.errors || []).flatMap((erro) => erro.details || [erro.message]).filter(Boolean);
    super(detalhes.join(' ') || corpo?.message || `Mercado Pago respondeu ${status}`);
    this.status = status;
    this.corpo = corpo;
  }
}

async function chamarMercadoPago(metodo, caminho, { corpo, chaveIdempotencia } = {}) {
  const resposta = await fetch(`${URL_API}${caminho}`, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN.trim()}`,
      'Content-Type': 'application/json',
      ...(chaveIdempotencia ? { 'X-Idempotency-Key': chaveIdempotencia } : {}),
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
    signal: AbortSignal.timeout(20000),
  });

  const texto = await resposta.text();
  let dados = null;
  try {
    dados = texto ? JSON.parse(texto) : null;
  } catch {
    dados = { message: texto };
  }

  if (!resposta.ok) throw new ErroMercadoPago(resposta.status, dados);
  return dados;
}

module.exports = {
  ErroMercadoPago,
  criarOrder: (corpo, chaveIdempotencia) => chamarMercadoPago('POST', '/v1/orders', { corpo, chaveIdempotencia }),
  buscarOrder: (id) => chamarMercadoPago('GET', `/v1/orders/${encodeURIComponent(id)}`),
};
