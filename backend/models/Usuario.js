const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  cep: { type: String },
  localizacao: { type: String, default: '' },
  telefone: { type: String }, // Removida a obrigatoriedade (required: true)
  bio: { type: String, default: '', maxlength: 1000 },
  avatar: { type: String, default: "" },
  ativo: { type: Boolean, default: true },
  objetivo: { type: String, enum: ['ambos', 'locatario', 'locador'], default: 'ambos' },

  // Mantidos fora das respostas usuais para não expor credenciais temporárias.
  tokenRecuperacaoSenha: { type: String, default: null, select: false },
  tokenRecuperacaoExpira: { type: Date, default: null, select: false },
  versaoSessao: { type: Number, default: 0, select: false },
  
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
