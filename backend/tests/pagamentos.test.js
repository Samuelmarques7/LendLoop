const test = require('node:test');
const assert = require('node:assert/strict');
const { statusPagamentoDaOrder, aluguelPodeIniciar, pagamentoVencido } = require('../utils/pagamentos');

test('traduz os estados financeiros da Order', () => {
  assert.equal(statusPagamentoDaOrder({ status: 'processed' }), 'confirmado');
  assert.equal(statusPagamentoDaOrder({ status: 'refunded' }), 'reembolsado');
  assert.equal(statusPagamentoDaOrder({ status: 'charged_back' }), 'contestado');
  assert.equal(statusPagamentoDaOrder({ status: 'processed', status_detail: 'partially_refunded' }), 'reembolsado');
  assert.equal(statusPagamentoDaOrder({ status: 'desconhecido' }), null);
});

test('só inicia o aluguel na data combinada', () => {
  const agora = new Date('2026-09-24T18:00:00.000Z');
  assert.equal(aluguelPodeIniciar('2026-09-24T00:00:00.000Z', agora), true);
  assert.equal(aluguelPodeIniciar('2026-09-25T00:00:00.000Z', agora), false);
});

test('considera vencido apenas depois do dia limite', () => {
  const agora = new Date('2026-09-24T18:00:00.000Z');
  assert.equal(pagamentoVencido('2026-09-23T00:00:00.000Z', agora), true);
  assert.equal(pagamentoVencido('2026-09-24T00:00:00.000Z', agora), false);
});
