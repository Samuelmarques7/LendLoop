const mongoose = require('mongoose');

const pagamentoSchema = new mongoose.Schema({
  aluguel: { type: mongoose.Schema.Types.ObjectId, ref: 'Aluguel', required: true },
  locatario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },

  valor: { type: Number, required: true },
  vencimento: { type: Date, required: true },

  status: {
    type: String,
    enum: ['pendente', 'processando', 'confirmado', 'atrasado', 'falhou'],
    default: 'pendente'
  },

  metodo: {
    type: String,
    enum: ['pix', 'cartao', 'boleto'],
    required: false
  },

  mpOrderId: { type: String },
  mpPaymentId: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('Pagamento', pagamentoSchema);