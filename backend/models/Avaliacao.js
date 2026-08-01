const mongoose = require('mongoose');
 
const avaliacaoSchema = new mongoose.Schema({
  anuncio: { type: mongoose.Schema.Types.ObjectId, ref: 'Anuncio', required: true },
  aluguel: { type: mongoose.Schema.Types.ObjectId, ref: 'Aluguel', required: true },
 
  locatario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true }, // locatário que avalia
  locador: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true }, // dono do anúncio avaliado
 
  nota: { type: Number, required: true, min: 1, max: 5 },
  comentario: { type: String, default: "" }
}, {
  timestamps: true
});
 
module.exports = mongoose.model('Avaliacao', avaliacaoSchema);