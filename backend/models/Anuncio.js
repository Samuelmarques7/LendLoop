const mongoose = require('mongoose');
 
const anuncioSchema = new mongoose.Schema({

  titulo: { type: String, required: true },
  descricao: { type: String, required: true },
  categoria: { type: String, required: true },
  subcategoria: { type: String, required: false },
 
  fotos: [{ type: String }],

  endereco: {
    cep: { type: String, required: true },
    rua: { type: String, required: true },
    numero: { type: String, required: true },
    complemento: { type: String, default: "" },
    semComplemento: { type: Boolean, default: false },
    bairro: { type: String, required: true },
    cidade: { type: String, required: true },
    estado: { type: String, required: true }
  },
 
  disponivel: [{ type: Date }],
 
  precos: {
    precoPorDia: { type: Number, required: true },
    caucao: { type: Number, default: 0 },
    exigirCaucao: { type: Boolean, default: false },
    horarioRetirada: { type: String, default: '09:00' },
    horarioDevolucao: { type: String, default: '17:00' }
  },
 
  status: { type: String, enum: ['rascunho', 'publicado'], default: 'rascunho' },
 
  locador: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true }
}, {
  timestamps: true
});
 
module.exports = mongoose.model('Anuncio', anuncioSchema);