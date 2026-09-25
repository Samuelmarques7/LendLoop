const crypto = require('crypto');

function tokenRecuperacaoTemFormatoValido(token) {
  return /^[a-f0-9]{64}$/i.test(String(token || ''));
}

function hashTokenRecuperacao(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function versaoSessaoValida(versaoToken, versaoUsuario) {
  return Number(versaoToken || 0) === Number(versaoUsuario || 0);
}

module.exports = { hashTokenRecuperacao, tokenRecuperacaoTemFormatoValido, versaoSessaoValida };
