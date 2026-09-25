const STATUS_ALUGUEL_ABERTO = Object.freeze([
  'pendente',
  'aceito',
  'andamento',
  'aguardando_confirmacao',
]);

function aluguelBloqueiaEncerramento(status) {
  return STATUS_ALUGUEL_ABERTO.includes(status);
}

module.exports = { STATUS_ALUGUEL_ABERTO, aluguelBloqueiaEncerramento };
