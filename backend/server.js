require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ 
    mensagem: 'Bem-vindo à API do LendLoop! 🚀',
    status: 'Servidor rodando perfeitamente.'
  });
});

const PORT = process.env.PORT || 3000;

connectDB();

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`👉 Teste no navegador: http://localhost:${PORT}`);
});