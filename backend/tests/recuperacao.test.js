const test = require('node:test');
const assert = require('node:assert/strict');
const { hashTokenRecuperacao, tokenRecuperacaoTemFormatoValido, versaoSessaoValida } = require('../utils/recuperacao');

test('aceita somente tokens de recuperação completos em hexadecimal', () => {
  assert.equal(tokenRecuperacaoTemFormatoValido('a'.repeat(64)), true);
  assert.equal(tokenRecuperacaoTemFormatoValido('A1'.repeat(32)), true);
  assert.equal(tokenRecuperacaoTemFormatoValido('a'.repeat(63)), false);
  assert.equal(tokenRecuperacaoTemFormatoValido('z'.repeat(64)), false);
  assert.equal(tokenRecuperacaoTemFormatoValido(undefined), false);
});

test('hash do token é determinístico e não preserva o token original', () => {
  const token = 'a1'.repeat(32);
  const hash = hashTokenRecuperacao(token);
  assert.equal(hash.length, 64);
  assert.notEqual(hash, token);
  assert.equal(hashTokenRecuperacao(token), hash);
});

test('sessões anteriores deixam de ser válidas depois da troca de senha', () => {
  assert.equal(versaoSessaoValida(0, 0), true);
  assert.equal(versaoSessaoValida(undefined, 0), true);
  assert.equal(versaoSessaoValida(0, 1), false);
  assert.equal(versaoSessaoValida(2, 2), true);
});
