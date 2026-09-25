const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const { versaoSessaoValida } = require('../utils/recuperacao');

async function autenticacao(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ erro: 'Token não fornecido.' });
  }

  const [tipo, token] = authHeader.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ erro: 'Formato de token inválido.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findById(payload.id).select('ativo +versaoSessao');
    if (!usuario || usuario.ativo === false) {
      return res.status(401).json({ erro: 'Sessão inválida ou conta desativada.' });
    }
    if (!versaoSessaoValida(payload.sessao, usuario.versaoSessao)) {
      return res.status(401).json({ erro: 'Sua senha foi alterada. Entre novamente.' });
    }
    req.usuarioId = payload.id;
    next();
  } catch (erro) {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
}

module.exports = autenticacao;
