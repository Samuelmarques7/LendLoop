const mongoose = require('mongoose');
 
const avaliacaoSchema = new mongoose.Schema({
  aluguel: { type: mongoose.Schema.Types.ObjectId, ref: 'Aluguel', required: true },

  autor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true }, // quem está avaliando
  avaliado: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true }, // quem está sendo avaliado

  nota: { type: Number, required: true, min: 1, max: 5 },
  comentario: { type: String, default: "" }
}, {
  timestamps: true
});

// Impede duas avaliações do mesmo autor para o mesmo aluguel
avaliacaoSchema.index({ aluguel: 1, autor: 1 }, { unique: true });
 
module.exports = mongoose.model('Avaliacao', avaliacaoSchema);