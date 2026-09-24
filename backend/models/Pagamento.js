const mongoose = require('mongoose');

const pagamentoSchema = new mongoose.Schema({
  aluguel: { type: mongoose.Schema.Types.ObjectId, ref: 'Aluguel', required: true, unique: true, index: true },
  locatario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },

  valor: { type: Number, required: true },
  vencimento: { type: Date, required: true },

  status: {
    type: String,
    enum: ['pendente', 'processando', 'confirmado', 'atrasado', 'falhou', 'cancelado', 'reembolsado', 'contestado'],
    default: 'pendente'
  },

  metodo: {
    type: String,
    enum: ['pix', 'cartao', 'boleto'],
    required: false
  },

  mpOrderId: { type: String },
  mpPaymentId: { type: String },
  mpStatusDetail: { type: String },

  // Compõe a chave de idempotência do checkout. Só avança depois de uma
  // recusa definitiva, então repetir o envio nunca gera uma segunda cobrança.
  tentativas: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Pagamento', pagamentoSchema);
