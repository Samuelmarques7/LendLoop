import test from 'node:test';
import assert from 'node:assert/strict';
import { mensagemAmigavelPagamento } from '../src/utils/errosPagamento.js';

test('traduz BIN sem forma de pagamento sem expor o código interno', () => {
  const mensagem = mensagemAmigavelPagamento({ message: 'no_payment_method_for_provided_bin' });
  assert.equal(mensagem, 'Não conseguimos identificar a bandeira deste cartão. Confira o número ou tente outro cartão.');
  assert.equal(mensagem.includes('no_payment_method'), false);
});

test('traduz códigos mesmo quando aparecem em type ou em lista de erros', () => {
  assert.match(mensagemAmigavelPagamento({ type: 'card_token_creation_failed' }), /dados do cartão/);
  assert.match(mensagemAmigavelPagamento({ errors: [{ code: 'cc_rejected_insufficient_amount' }] }), /limite disponível/);
});

test('usa mensagem segura para erros desconhecidos', () => {
  const mensagem = mensagemAmigavelPagamento({ message: 'internal_technical_detail' });
  assert.equal(mensagem.includes('internal_technical_detail'), false);
  assert.match(mensagem, /Confira as informações/);
});
