const mongoose = require('mongoose');

const conversaSchema = new mongoose.Schema({
  participantes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true }],
  anuncio: { type: mongoose.Schema.Types.ObjectId, ref: 'Anuncio', default: null },

  ultimaMensagem: { type: String, default: '' },
  ultimaMensagemEm: { type: Date, default: Date.now },
  ultimaMensagemAutor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null }
}, {
  timestamps: true
});

module.exports = mongoose.model('Conversa', conversaSchema);