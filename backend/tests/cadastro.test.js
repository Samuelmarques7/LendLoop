const test = require('node:test');
const assert = require('node:assert/strict');
const { cepValido, emailValido, senhaForteOSuficiente, validarCadastro } = require('../utils/cadastro');

test('valida e-mails e rejeita formatos incompletos', () => {
  assert.equal(emailValido('pessoa@exemplo.com'), true);
  assert.equal(emailValido('pessoa@exemplo'), false);
  assert.equal(emailValido('pessoa exemplo.com'), false);
});

test('aplica no backend a mesma política mínima de senha da interface', () => {
  assert.equal(senhaForteOSuficiente('12345678'), false);
  assert.equal(senhaForteOSuficiente('Lendloop123'), true);
  assert.equal(senhaForteOSuficiente('Segura#2026'), true);
});

test('aceita CEP formatado ou somente com números', () => {
  assert.equal(cepValido('01310-100'), true);
  assert.equal(cepValido('01310100'), true);
  assert.equal(cepValido('01310'), false);
});

test('valida o contrato completo do cadastro', () => {
  const cadastro = {
    nome: 'Maria da Silva',
    email: 'maria@exemplo.com',
    senha: 'Senha#2026',
    cep: '01310-100',
    localizacao: 'São Paulo, SP',
    objetivo: 'ambos'
  };
  assert.equal(validarCadastro(cadastro), null);
  assert.match(validarCadastro({ ...cadastro, objetivo: 'admin' }), /objetivo válido/i);
  assert.match(validarCadastro({ ...cadastro, localizacao: '' }), /CEP válido/i);
});
