const mongoose = require('mongoose');
 
const aluguelSchema = new mongoose.Schema({
  anuncio: { type: mongoose.Schema.Types.ObjectId, ref: 'Anuncio', required: true },
  locatario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  locador: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
 
  dataInicio: { type: Date, required: true },
  dataFim: { type: Date, required: true },
  horarioRetirada: { type: String, default: '09:00' },
  horarioDevolucao: { type: String, default: '17:00' },
 
  precoTotal: { type: Number, required: true },
  taxaServico: { type: Number, default: 0 },
  caucao: { type: Number, default: 0 },
 
  status: { 
    type: String, 
    enum: ['pendente', 'aceito', 'recusado', 'andamento', 'aguardando_confirmacao', 'concluido', 'cancelado'], 
    default: 'pendente' 
  }
}, {
  timestamps: true
});
 
module.exports = mongoose.model('Aluguel', aluguelSchema);