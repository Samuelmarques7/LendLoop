require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const upload = require('./config/upload');
const bcrypt = require('bcrypt');

const Usuario = require('./models/Usuario');
const Anuncio = require('./models/Anuncio');
const Aluguel = require('./models/Aluguel');
const Pagamento = require('./models/Pagamento');
const Avaliacao = require('./models/Avaliacao');

const app = express();

app.use(cors());
app.use(express.json());

// --- Rotas LendLoop ---

// Cadastro
app.post('/api/usuarios', async (req, res) => {
  try {
    const { nome, email, senha, telefone,localizacao } = req.body;
    const senhaCriptografada = await bcrypt.hash(senha, 10);
    const novoUsuario = new Usuario({ nome, email, senha: senhaCriptografada, telefone, localizacao });
    
    await novoUsuario.save();

    res.status(201).json({
      mensagem: 'Usuário criado com sucesso no LendLoop!',
      usuario: {
        id: novoUsuario._id,
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        localizacao: novoUsuario.localizacao,
        createdAt: novoUsuario.createdAt
      }
    });
  } catch (erro) {

    if(erro.code === 11000) {
      return res.status(409).json({erro: 'Este e-mail já está cadastrado.'});
    }
    res.status(500).json({ erro: 'Erro ao criar usuário', detalhes: erro.message });
  }
});

// Listagem
app.get('/api/usuarios', async (req, res) => {
  try {
    const usuarios = await Usuario.find().select('-senha');
    res.status(200).json(usuarios);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar usuários' });
  }
});

// Excluir conta (soft delete: anonimiza o usuário e apaga seus anúncios)
app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);

    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    // Apaga de fato os anúncios do usuário (só afetam o próprio dono)
    await Anuncio.deleteMany({ locador: usuario._id });

    // Anonimiza o usuário em vez de apagar, preservando histórico de terceiros
    usuario.nome = 'Usuário removido';
    usuario.email = `removido_${usuario._id}@lendloop.com`;
    usuario.senha = await bcrypt.hash(Math.random().toString(36), 10);
    usuario.telefone = '';
    usuario.avatar = '';
    usuario.ativo = false;

    await usuario.save();

    res.status(200).json({ mensagem: 'Conta excluída com sucesso.' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao excluir conta', detalhes: erro.message });
  }
});

// Atualizar dados do usuário (avatar, bio, localização, etc.)
app.patch('/api/usuarios/:id', async (req, res) => {
  try {
    const { avatar, bio, localizacao } = req.body;

    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      { avatar, bio, localizacao },
      { new: true }
    ).select('-senha');

    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    res.status(200).json({
      mensagem: 'Perfil atualizado com sucesso!',
      usuario
    });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao atualizar perfil', detalhes: erro.message });
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

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'Senha incorreta.' });
    }

    res.status(200).json({ 
      mensagem: 'Login realizado com sucesso!', 
      usuario: { 
        id: usuario._id,
        nome: usuario.nome, 
        email: usuario.email,
        avatar: usuario.avatar,
        localizacao: usuario.localizacao,
        createdAt: usuario.createdAt,
      } 
    });
  } catch (erro) {
    console.error("Erro no login:", erro);
    res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
});

// --- Upload de Fotos ---
app.post('/api/upload', upload.array('fotos', 6), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ erro: 'Nenhuma foto enviada.' });
    }

    const urls = req.files.map(arquivo => arquivo.path);

    res.status(200).json({ urls });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao enviar fotos', detalhes: erro.message });
  }
});

// --- Anúncio ---

// Criar anúncio
app.post('/api/anuncios', async (req, res) => {
  try {
    const { titulo, descricao, categoria, subcategoria, fotos, endereco, disponivel, precos, status, locador } = req.body;

    const novoAnuncio = new Anuncio({
      titulo, descricao, categoria, subcategoria,
      fotos, endereco, disponivel, precos,
      status, locador
    });

    await novoAnuncio.save();

    res.status(201).json({
      mensagem: 'Anúncio criado com sucesso!',
      anuncio: novoAnuncio
    });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao criar anúncio', detalhes: erro.message });
  }
});

// Listar todos os anúncios (usado em ResultadosBusca)
app.get('/api/anuncios', async (req, res) => {
  try {
    const { busca, dataInicio, dataFim } = req.query;
    const filtro = { status: 'publicado' };

    if (busca) {
      const regex = new RegExp(busca, 'i'); // 'i' para case-insensitive
      filtro.$or = [
        {titulo: regex},
        {descricao: regex},
      ];
    }

    if (dataInicio || dataFim) {
      const condicaoData = {};
      
      if (dataInicio) condicaoData.$gte = new Date(dataInicio);
      if (dataFim) condicaoData.$lte = new Date(dataFim);
      filtro.disponivel = {$elemMatch: condicaoData };
    }

    const anuncios = await Anuncio.find(filtro).populate('locador', 'nome email');
    res.status(200).json(anuncios);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar anúncios' });
  }
});

// Buscar um anúncio específico (usado em DetalhesProduto)
app.get('/api/anuncios/:id', async (req, res) => {
  try {
    const anuncio = await Anuncio.findById(req.params.id).populate('locador', 'nome email');
    if (!anuncio) {
      return res.status(404).json({ erro: 'Anúncio não encontrado' });
    }
    res.status(200).json(anuncio);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar anúncio' });
  }
});

// Listar anúncios de um locador específico (usado em PainelLocador)
app.get('/api/anuncios/locador/:locadorId', async (req, res) => {
  try {
    const anuncios = await Anuncio.find({ locador: req.params.locadorId });
    res.status(200).json(anuncios);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar anúncios do locador' });
  }
});

// --- Aluguel ---

// Criar solicitação de aluguel (botão "Solicitar Aluguel" em DetalhesProduto)
app.post('/api/alugueis', async (req, res) => {
  try {
    const { anuncio, locatario, locador, dataInicio, dataFim, horarioRetirada, precoTotal, taxaServico, caucao } = req.body;

    const novoAluguel = new Aluguel({
      anuncio, locatario, locador,
      dataInicio, dataFim, horarioRetirada,
      precoTotal, taxaServico, caucao
    });

    await novoAluguel.save();

    res.status(201).json({
      mensagem: 'Solicitação de aluguel enviada com sucesso!',
      aluguel: novoAluguel
    });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao criar solicitação de aluguel', detalhes: erro.message });
  }
});

// Listar aluguéis de um locatário (usado em PainelLocatario)
app.get('/api/alugueis/locatario/:locatarioId', async (req, res) => {
  try {
    const alugueis = await Aluguel.find({ locatario: req.params.locatarioId }).populate('anuncio');
    res.status(200).json(alugueis);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar aluguéis do locatário' });
  }
});

// Listar solicitações recebidas por um locador (usado em PainelLocador)
app.get('/api/alugueis/locador/:locadorId', async (req, res) => {
  try {
    const alugueis = await Aluguel.find({ locador: req.params.locadorId }).populate('anuncio locatario');
    res.status(200).json(alugueis);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar solicitações do locador' });
  }
});

// Atualizar status de um aluguel (aceitar, recusar, marcar como devolvido, etc.)
app.patch('/api/alugueis/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    const aluguel = await Aluguel.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!aluguel) {
      return res.status(404).json({ erro: 'Aluguel não encontrado' });
    }

    res.status(200).json({
      mensagem: 'Status do aluguel atualizado com sucesso!',
      aluguel
    });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao atualizar status do aluguel', detalhes: erro.message });
  }
});

// --- Pagamento ---

// Criar pagamento (gerado a partir de um aluguel)
app.post('/api/pagamentos', async (req, res) => {
  try {
    const { aluguel, locatario, valor, vencimento, metodo } = req.body;

    const novoPagamento = new Pagamento({ aluguel, locatario, valor, vencimento, metodo });

    await novoPagamento.save();

    res.status(201).json({
      mensagem: 'Pagamento criado com sucesso!',
      pagamento: novoPagamento
    });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao criar pagamento', detalhes: erro.message });
  }
});

// Listar pagamentos de um locatário (usado em PainelLocatario)
app.get('/api/pagamentos/locatario/:locatarioId', async (req, res) => {
  try {
    const pagamentos = await Pagamento.find({ locatario: req.params.locatarioId }).populate('aluguel');
    res.status(200).json(pagamentos);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar pagamentos do locatário' });
  }
});

// Confirmar pagamento (botão "Pagar Agora")
app.patch('/api/pagamentos/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    const pagamento = await Pagamento.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!pagamento) {
      return res.status(404).json({ erro: 'Pagamento não encontrado' });
    }

    res.status(200).json({
      mensagem: 'Status do pagamento atualizado com sucesso!',
      pagamento
    });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao atualizar status do pagamento', detalhes: erro.message });
  }
});

// --- Avaliação ---

// Criar avaliação (após aluguel concluído)
app.post('/api/avaliacoes', async (req, res) => {
  try {
    const { anuncio, aluguel, autor, locador, nota, comentario } = req.body;

    const novaAvaliacao = new Avaliacao({ anuncio, aluguel, autor, locador, nota, comentario });

    await novaAvaliacao.save();

    res.status(201).json({
      mensagem: 'Avaliação enviada com sucesso!',
      avaliacao: novaAvaliacao
    });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao criar avaliação', detalhes: erro.message });
  }
});

// Listar avaliações de um anúncio (nota média e comentários em DetalhesProduto)
app.get('/api/avaliacoes/anuncio/:anuncioId', async (req, res) => {
  try {
    const avaliacoes = await Avaliacao.find({ anuncio: req.params.anuncioId }).populate('autor', 'nome');
    res.status(200).json(avaliacoes);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar avaliações do anúncio' });
  }
});

// ==========================================
// CONFIGURAÇÃO DO BANCO E SERVIDOR
// ==========================================

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
  });
});