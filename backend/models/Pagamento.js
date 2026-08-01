const mongoose = require('mongoose');
 
const pagamentoSchema = new mongoose.Schema({
  aluguel: { type: mongoose.Schema.Types.ObjectId, ref: 'Aluguel', required: true },
  locatario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
 
  valor: { type: Number, required: true },
  vencimento: { type: Date, required: true },
 
  status: {
    type: String,
    enum: ['pendente', 'confirmado', 'atrasado'],
    default: 'pendente'
  },
 
  metodo: { type: String, required: false }
}, {
  timestamps: true
});
 
module.exports = mongoose.model('Pagamento', pagamentoSchema);