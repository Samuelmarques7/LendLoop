const test = require('node:test');
const assert = require('node:assert/strict');
const { criarFiltroBusca, extrairTermosBusca, normalizarTexto, pontuarAnuncio } = require('../utils/busca');

test('normaliza acentos e pontuação', () => {
  assert.equal(normalizarTexto('  Carrinho de Bebê! '), 'carrinho de bebe');
});

test('ignora palavras de ligação e mantém os termos importantes', () => {
  assert.deepEqual(extrairTermosBusca('carrinho de bebê'), ['carrinho', 'bebe']);
  assert.deepEqual(extrairTermosBusca('máquina para algodão doce'), ['maquina', 'algodao', 'doce']);
});

test('cria regex que aceita o mesmo termo com ou sem acento', () => {
  const filtro = criarFiltroBusca('bebe');
  const regex = filtro.$and[0].$or[0].titulo;
  assert.equal(regex.test('Bebê conforto'), true);
  assert.equal(regex.test('Itens para bebe'), true);
});

test('prioriza correspondências no título', () => {
  const noTitulo = { titulo: 'Carrinho para bebê', descricao: '', categoria: 'outros' };
  const naDescricao = { titulo: 'Item infantil', descricao: 'Carrinho para bebê', categoria: 'outros' };
  assert.ok(pontuarAnuncio(noTitulo, 'carrinho de bebe') > pontuarAnuncio(naDescricao, 'carrinho de bebe'));
});
