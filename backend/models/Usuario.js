const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  cep: { type: String }, // Campo de CEP adicionado
  telefone: { type: String }, // Removida a obrigatoriedade (required: true)
  avatar: { type: String, default: "" },
  objetivo: { type: String, enum: ['ambos', 'locatario', 'locador'], default: 'ambos' },
  
  // Campos para Admin e KYC
  papel: { type: String, enum: ['usuario', 'admin'], default: 'usuario' },
  cpf: { type: String, default: "" },
  verificacao: {
    status: { type: String, enum: ['nao_enviado', 'pendente', 'aprovado', 'rejeitado'], default: 'nao_enviado' },
    documentoFrente: { type: String, default: '' },
    documentoVerso: { type: String, default: '' },
    selfie: { type: String, default: '' },
    enviadoEm: { type: Date, default: null },
    motivoRejeicao: { type: String, default: '' },
    revisadoEm: { type: Date, default: null },
    revisadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Usuario', usuarioSchema);