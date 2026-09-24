const mongoose = require('mongoose');

const ocupacaoDiaSchema = new mongoose.Schema({
  anuncio: { type: mongoose.Schema.Types.ObjectId, ref: 'Anuncio', required: true },
  dia: { type: String, required: true }, // 'YYYY-MM-DD'
  aluguel: { type: mongoose.Schema.Types.ObjectId, ref: 'Aluguel', required: true }
});

// Um dia de um anúncio só pode pertencer a um aluguel ativo.
ocupacaoDiaSchema.index({ anuncio: 1, dia: 1 }, { unique: true });
ocupacaoDiaSchema.index({ aluguel: 1 });

module.exports = mongoose.model('OcupacaoDia', ocupacaoDiaSchema);