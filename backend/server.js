require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const Usuario = require('./models/Usuario');

const app = express();

app.use(cors());
app.use(express.json());

// --- Rotas LendLoop ---

// Cadastro
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

// Listagem
app.get('/api/usuarios', async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    res.status(200).json(usuarios);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar usuários' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    const usuario = await Usuario.findOne({ email });

    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado. Verifique seu e-mail.' });
    }

    if (usuario.senha !== senha) {
      return res.status(401).json({ erro: 'Senha incorreta.' });
    }

    res.status(200).json({ 
      mensagem: 'Login realizado com sucesso!', 
      usuario: { 
        id: usuario._id,
        nome: usuario.nome, 
        email: usuario.email 
      } 
    });
  } catch (erro) {
    console.error("Erro no login:", erro);
    res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
});

// --- Configuração e Servidor ---

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('📦 Conectado ao MongoDB com sucesso!');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((erro) => console.error('❌ Erro ao conectar no MongoDB:', erro));