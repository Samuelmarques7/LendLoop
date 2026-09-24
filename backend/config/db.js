const mongoose = require('mongoose');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      // Evita deixar cada requisição presa por cerca de 30 segundos quando o
      // Atlas está temporariamente inacessível.
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    console.log('📦 Conectado ao MongoDB com sucesso!');
  } catch (erro) {
    console.error('❌ Erro ao conectar no MongoDB:', erro);
    process.exit(1);
  }
}

mongoose.connection.on('disconnected', () => {
  console.error('⚠️ Conexão com o MongoDB perdida. O driver tentará reconectar automaticamente.');
});

mongoose.connection.on('reconnected', () => {
  console.log('📦 Conexão com o MongoDB restabelecida.');
});

module.exports = connectDB;
