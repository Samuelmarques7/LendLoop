const mongoose = require('mongoose');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📦 Conectado ao MongoDB com sucesso!');
  } catch (erro) {
    console.error('❌ Erro ao conectar no MongoDB:', erro);
    process.exit(1);
  }
}

module.exports = connectDB;
