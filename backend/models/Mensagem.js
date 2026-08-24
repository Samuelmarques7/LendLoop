const mongoose = require('mongoose');

const mensagemSchema = new mongoose.Schema({
  conversa: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversa', required: true },
  remetente: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  destinatario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },

  texto: { type: String, required: true, trim: true },
  lida: { type: Boolean, default: false }
}, {
  timestamps: true
});

module.exports = mongoose.model('Mensagem', mensagemSchema);