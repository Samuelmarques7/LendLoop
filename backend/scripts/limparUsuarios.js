require('dotenv').config();
const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const resultado = await Usuario.deleteMany({});
  console.log(`${resultado.deletedCount} usuário(s) apagado(s).`);
  await mongoose.disconnect();
}).catch((erro) => {
  console.error('Erro ao conectar/apagar:', erro);
  process.exit(1);
});