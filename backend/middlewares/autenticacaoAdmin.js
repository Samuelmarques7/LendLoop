const Usuario = require('../models/Usuario');

async function autenticacaoAdmin(req, res, next) {
  try {
    // Pegamos o ID que o middleware 'autenticacao' (que roda antes desse) já decodificou do Token JWT
    const usuarioId = req.usuarioId; 
    
    if (!usuarioId) {
      return res.status(401).json({ erro: 'ID do usuário não fornecido na requisição.' });
    }

    const usuario = await Usuario.findById(usuarioId);

    if (!usuario || usuario.papel !== 'admin') {
      return res.status(403).json({ erro: 'Acesso negado. Apenas administradores podem acessar esta rota.' });
    }

    req.admin = usuario;
    next();
  } catch (erro) {
    res.status(500).json({ erro: 'Erro na autenticação do administrador.' });
  }
}

module.exports = autenticacaoAdmin;