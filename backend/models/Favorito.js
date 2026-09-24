const mongoose = require('mongoose');

const favoritoSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  anuncio: { type: mongoose.Schema.Types.ObjectId, ref: 'Anuncio', required: true }
}, {
  timestamps: true
});

favoritoSchema.index({ usuario: 1, anuncio: 1 }, { unique: true });

module.exports = mongoose.model('Favorito', favoritoSchema);
