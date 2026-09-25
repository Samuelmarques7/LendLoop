const test = require('node:test');
const assert = require('node:assert/strict');
const { aluguelBloqueiaEncerramento } = require('../utils/conta');

test('bloqueia encerramento enquanto houver compromisso aberto', () => {
  for (const status of ['pendente', 'aceito', 'andamento', 'aguardando_confirmacao']) {
    assert.equal(aluguelBloqueiaEncerramento(status), true, status);
  }
});

test('permite encerramento apenas depois do fim do compromisso', () => {
  for (const status of ['recusado', 'concluido', 'cancelado']) {
    assert.equal(aluguelBloqueiaEncerramento(status), false, status);
  }
});
