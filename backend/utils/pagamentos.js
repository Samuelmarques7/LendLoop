const STATUS_POR_ORDER = {
  processed: 'confirmado',
  failed: 'falhou',
  canceled: 'falhou',
  cancelled: 'falhou',
  expired: 'falhou',
  created: 'processando',
  processing: 'processando',
  action_required: 'processando',
  refunded: 'reembolsado',
  charged_back: 'contestado'
};

function statusPagamentoDaOrder(order = {}) {
  if (order.status === 'processed' && order.status_detail === 'partially_refunded') {
    return 'reembolsado';
  }
  return STATUS_POR_ORDER[order.status] || null;
}

function dataUtc(valor) {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return null;
  return new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()));
}

function aluguelPodeIniciar(dataInicio, agora = new Date()) {
  const inicio = dataUtc(dataInicio);
  const hoje = dataUtc(agora);
  return Boolean(inicio && hoje && inicio <= hoje);
}

function pagamentoVencido(vencimento, agora = new Date()) {
  const limite = dataUtc(vencimento);
  const hoje = dataUtc(agora);
  return Boolean(limite && hoje && limite < hoje);
}

module.exports = { statusPagamentoDaOrder, aluguelPodeIniciar, pagamentoVencido };
