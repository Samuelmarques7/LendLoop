const mongoose = require('mongoose');

const notificacaoSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },

  tipo: {
    type: String,
    enum: ['mensagem', 'solicitacao', 'status_aluguel', 'avaliacao', 'verificacao'],
    required: true
  },

  titulo: { type: String, required: true },
  texto: { type: String, required: true },

  lida: { type: Boolean, default: false },

  linkPainel: { type: String, default: null },

  estadoNavegacao: { type: mongoose.Schema.Types.Mixed, default: {} }
}, {
  timestamps: true
});

notificacaoSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 3 });

module.exports = mongoose.model('Notificacao', notificacaoSchema);