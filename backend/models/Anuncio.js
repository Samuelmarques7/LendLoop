const mongoose = require('mongoose');

const anuncioSchema = new mongoose.Schema({
  titulo: { 
    type: String, 
    required: true 
  },

  descricao: { 
    type: String, 
    required: true 
  },

  categoria: { 
    type: String, 
    required: true,
    enum: [
      'Ferramentas',
      'Eletrônicos',
      'Esportes',
      'Casa',
      'Jardinagem',
      'Festas',
      'Automotivo'
    ]
  },

  subcategoria: { 
    type: String, 
    required: true 
  },

  fotos: [{
    type: String
  }],

  endereco: {
    cep: { type: String, required: true },
    rua: { type: String, required: true },
    numero: { type: String, required: true },
    complemento: { type: String, default: "" },
    bairro: { type: String, required: true },
    cidade: { type: String, required: true },
    estado: { type: String, required: true }
  },

  disponibilidade: [{
    type: Date
  }],

  precoPorDia: { 
    type: Number, 
    required: true,
    min: 0
  },

  caucao: { 
    type: Number, 
    default: 0,
    min: 0
  },

  exigirCaucao: { 
    type: Boolean, 
    default: false 
  },

  horarioRetirada: { 
    type: String, 
    required: true 
  },

  horarioDevolucao: { 
    type: String, 
    required: true 
  },

  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },

  status: {
    type: String,
    enum: ['rascunho', 'publicado', 'pausado'],
    default: 'rascunho'
  },

  ativo: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true
});

module.exports = mongoose.model('Anuncio', anuncioSchema);