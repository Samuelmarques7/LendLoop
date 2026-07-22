require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ 
    mensagem: 'Bem-vindo à API do LendLoop! 🚀',
    status: 'Servidor rodando perfeitamente.'
  });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('📦 Conectado ao MongoDB com sucesso!');
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`👉 Teste no navegador: http://localhost:${PORT}`);
    });
  })
  .catch((erro) => {
    console.error('❌ Erro ao conectar no MongoDB:', erro);
  });