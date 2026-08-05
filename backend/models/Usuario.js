const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  telefone: { type: String, required: false },
  avatar: { type: String, default: "" },
  ativo: { type: Boolean, default: true}
}, {
  timestamps: true 
});

module.exports = mongoose.model('Usuario', usuarioSchema);