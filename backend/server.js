require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const Usuario = require('./models/Usuario');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// ==========================================
// ROTAS DA PLATAFORMA LENDLOOP
// ==========================================

app.post('/api/usuarios', async (req, res) => {
  try {
    const { nome, email, senha, telefone } = req.body;
    
    const novoUsuario = new Usuario({ nome, email, senha, telefone });
    
    await novoUsuario.save(); 

    res.status(201).json({ 
      mensagem: 'Usuário criado com sucesso no LendLoop!', 
      usuario: novoUsuario 
    });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao criar usuário', detalhes: erro.message });
  }
});

app.get('/api/usuarios', async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    res.status(200).json(usuarios);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar usuários' });
  }
});

// ==========================================
// CONFIGURAÇÃO DO BANCO E SERVIDOR
// ==========================================

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('📦 Conectado ao MongoDB com sucesso!');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`👉 Teste a rota: http://localhost:${PORT}/api/usuarios`);
    });
  })
  .catch((erro) => console.error('❌ Erro ao conectar no MongoDB:', erro));