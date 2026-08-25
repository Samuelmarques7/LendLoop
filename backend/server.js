require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const upload = require('./config/upload');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { enviarEmailRecuperacao } = require('./config/mailer');
const autenticacao = require('./middlewares/autenticacao');
const Usuario = require('./models/Usuario');
const Anuncio = require('./models/Anuncio');
const Aluguel = require('./models/Aluguel');
const Pagamento = require('./models/Pagamento');
const Avaliacao = require('./models/Avaliacao');
const Conversa = require('./models/Conversa');
const Mensagem = require('./models/Mensagem');
const Notificacao = require('./models/Notificacao');

const app = express();

app.use(cors());
app.use(express.json());

// --- Rotas LendLoop ---

async function criarNotificacao({ usuario, tipo, titulo, texto, linkPainel = null, estadoNavegacao = {} }) {
  try {
    await Notificacao.create({ usuario, tipo, titulo, texto, linkPainel, estadoNavegacao });
  } catch (erro) {
    console.error('Erro ao criar notificação:', erro);
  }
}

// Cadastro
app.post('/api/usuarios', async (req, res) => {
  try {
    const { nome, email, senha, telefone, localizacao, objetivo } = req.body;
    const senhaCriptografada = await bcrypt.hash(senha, 10);
    const novoUsuario = new Usuario({ nome, email, senha: senhaCriptografada, telefone, localizacao, objetivo });

    await novoUsuario.save();

    res.status(201).json({
      mensagem: 'Usuário criado com sucesso no LendLoop!',
      usuario: {
        id: novoUsuario._id,
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        localizacao: novoUsuario.localizacao,
        objetivo: novoUsuario.objetivo,
        createdAt: novoUsuario.createdAt
      }
    });
  } catch (erro) {
    if (erro.code === 11000) {
      return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });
    }
    res.status(500).json({ erro: 'Erro ao criar usuário', detalhes: erro.message });
  }
});

// Listagem
app.get('/api/usuarios', autenticacao, async (req, res) => {
  try {
    const usuarios = await Usuario.find().select('-senha');
    res.status(200).json(usuarios);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar usuários' });
  }
});

// Buscar um usuário específico (usado em MeuPerfil)
app.get('/api/usuarios/:id', async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select('-senha');
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }
    res.status(200).json(usuario);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar usuário' });
  }
});

// Atualizar perfil (nome, telefone, bio, avatar)
app.put('/api/usuarios/:id', autenticacao, async (req, res) => {
  try {
    if (req.usuarioId !== req.params.id) {
      return res.status(403).json({ erro: 'Você não tem permissão para editar este perfil.' });
    }

    const { nome, telefone, bio, avatar, objetivo } = req.body;

    const camposAtualizados = {};
    if (nome !== undefined) camposAtualizados.nome = nome;
    if (telefone !== undefined) camposAtualizados.telefone = telefone;
    if (bio !== undefined) camposAtualizados.bio = bio;
    if (avatar !== undefined) camposAtualizados.avatar = avatar;
    if (objetivo !== undefined) camposAtualizados.objetivo = objetivo;

    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      camposAtualizados,
      { new: true, runValidators: true }
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

// Excluir conta (soft delete: anonimiza o usuário e apaga seus anúncios)
app.delete('/api/usuarios/:id', autenticacao, async (req, res) => {
  try {
    if (req.usuarioId !== req.params.id) {
      return res.status(403).json({ erro: 'Você não tem permissão para excluir esta conta.' });
    }

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

    const token = jwt.sign(
      { id: usuario._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      mensagem: 'Login realizado com sucesso!',
      token,
      usuario: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        avatar: usuario.avatar,
        localizacao: usuario.localizacao,
        objetivo: usuario.objetivo,
        createdAt: usuario.createdAt,
      }
    });
  } catch (erro) {
    console.error("Erro no login:", erro);
    res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
});

// --- Recuperação de Senha ---

// Solicitar recuperação (envia e-mail com o link)
app.post('/api/esqueceu-senha', async (req, res) => {
  try {
    const { email } = req.body;
    const usuario = await Usuario.findOne({ email });

    // Não revela se o e-mail existe ou não, por segurança
    if (!usuario) {
      return res.status(200).json({
        mensagem: 'Se este e-mail estiver cadastrado, você receberá um link com as instruções de recuperação em breve.'
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    usuario.tokenRecuperacaoSenha = token;
    usuario.tokenRecuperacaoExpira = expira;
    await usuario.save();

    await enviarEmailRecuperacao(usuario.email, token);

    res.status(200).json({
      mensagem: 'Se este e-mail estiver cadastrado, você receberá um link com as instruções de recuperação em breve.'
    });
  } catch (erro) {
    console.error('Erro ao solicitar recuperação de senha:', erro);
    res.status(500).json({ erro: 'Erro ao solicitar recuperação de senha.' });
  }
});

// Redefinir senha (recebe token + nova senha)
app.post('/api/redefinir-senha', async (req, res) => {
  try {
    const { token, novaSenha } = req.body;

    if (!token || !novaSenha) {
      return res.status(400).json({ erro: 'Token e nova senha são obrigatórios.' });
    }

    const usuario = await Usuario.findOne({
      tokenRecuperacaoSenha: token,
      tokenRecuperacaoExpira: { $gt: new Date() }
    });

    if (!usuario) {
      return res.status(400).json({ erro: 'Token inválido ou expirado. Solicite a recuperação novamente.' });
    }

    usuario.senha = await bcrypt.hash(novaSenha, 10);
    usuario.tokenRecuperacaoSenha = null;
    usuario.tokenRecuperacaoExpira = null;
    await usuario.save();

    res.status(200).json({ mensagem: 'Senha redefinida com sucesso!' });
  } catch (erro) {
    console.error('Erro ao redefinir senha:', erro);
    res.status(500).json({ erro: 'Erro ao redefinir senha.' });
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
app.post('/api/anuncios', autenticacao, async (req, res) => {
  try {
    const { titulo, descricao, categoria, subcategorias, especificacoes, fotos, endereco, disponivel, precos, status } = req.body;

    const novoAnuncio = new Anuncio({
      titulo, descricao, categoria, subcategorias, especificacoes,
      fotos, endereco, disponivel, precos,
      status, locador: req.usuarioId
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
    const { busca, dataInicio, dataFim, categoria, precoMin, precoMax } = req.query;
    const filtro = { status: 'publicado' };

    if (busca) {
      const regex = new RegExp(busca, 'i'); // 'i' para case-insensitive
      filtro.$or = [
        { titulo: regex },
        { descricao: regex },
      ];
    }

    if (dataInicio || dataFim) {
      const condicaoData = {};

      if (dataInicio) condicaoData.$gte = new Date(dataInicio);
      if (dataFim) condicaoData.$lte = new Date(dataFim);
      filtro.disponivel = { $elemMatch: condicaoData };
    }

    if (categoria) {
      const categorias = categoria.split(',').filter(Boolean);
      if (categorias.length > 0) {
        filtro.categoria = { $in: categorias };
      }
    }

    if (precoMin || precoMax) {
      filtro['precos.precoPorDia'] = {};
      if (precoMin) filtro['precos.precoPorDia'].$gte = Number(precoMin);
      if (precoMax) filtro['precos.precoPorDia'].$lte = Number(precoMax);
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
    const anuncio = await Anuncio.findById(req.params.id).populate('locador', 'nome email bio avatar createdAt');
    if (!anuncio) {
      return res.status(404).json({ erro: 'Anúncio não encontrado' });
    }
    res.status(200).json(anuncio);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar anúncio' });
  }
});

app.get('/api/anuncios/locador/:locadorId', async (req, res) => {
  try {
    const anuncios = await Anuncio.find({ locador: req.params.locadorId });
    res.status(200).json(anuncios);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar anúncios do locador' });
  }
});

// Excluir anúncio (usado em PainelLocador)
app.delete('/api/anuncios/:id', autenticacao, async (req, res) => {
  try {
    const anuncio = await Anuncio.findById(req.params.id);

    if (!anuncio) {
      return res.status(404).json({ erro: 'Anúncio não encontrado' });
    }

    if (anuncio.locador.toString() !== req.usuarioId) {
      return res.status(403).json({ erro: 'Você não tem permissão para excluir este anúncio.' });
    }

    await Anuncio.findByIdAndDelete(req.params.id);

    res.status(200).json({ mensagem: 'Anúncio excluído com sucesso.' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao excluir anúncio', detalhes: erro.message });
  }
});

// --- Aluguel ---

// Criar solicitação de aluguel (botão "Solicitar Aluguel" em DetalhesProduto)
app.post('/api/alugueis', autenticacao, async (req, res) => {
  try {
    const { anuncio, dataInicio, dataFim, horarioRetirada, precoTotal, taxaServico, caucao } = req.body;

    const anuncioEncontrado = await Anuncio.findById(anuncio);

    if (!anuncioEncontrado) {
      return res.status(404).json({ erro: 'Anúncio não encontrado.' });
    }

    if (anuncioEncontrado.locador.toString() === req.usuarioId) {
      return res.status(400).json({ erro: 'Você não pode alugar seu próprio anúncio.' });
    }

    const novoAluguel = new Aluguel({
      anuncio,
      locatario: req.usuarioId,
      locador: anuncioEncontrado.locador,
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
app.get('/api/alugueis/locatario/:locatarioId', autenticacao, async (req, res) => {
  try {
    if (req.params.locatarioId !== req.usuarioId) {
      return res.status(403).json({ erro: 'Você não tem permissão para ver estes aluguéis.' });
    }

    const alugueis = await Aluguel.find({ locatario: req.params.locatarioId }).populate('anuncio').populate('locador', 'nome avatar');
    res.status(200).json(alugueis);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar aluguéis do locatário' });
  }
});

// Listar solicitações recebidas por um locador (usado em PainelLocador)
app.get('/api/alugueis/locador/:locadorId', autenticacao, async (req, res) => {
  try {
    if (req.params.locadorId !== req.usuarioId) {
      return res.status(403).json({ erro: 'Você não tem permissão para ver estas solicitações.' });
    }

    const alugueis = await Aluguel.find({ locador: req.params.locadorId }).populate('anuncio locatario');
    res.status(200).json(alugueis);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar solicitações do locador' });
  }
});

// Atualizar status de um aluguel (aceitar, recusar, marcar como devolvido, etc.)
app.patch('/api/alugueis/:id/status', autenticacao, async (req, res) => {
  try {
    const { status } = req.body;

    const aluguel = await Aluguel.findById(req.params.id);

    if (!aluguel) {
      return res.status(404).json({ erro: 'Aluguel não encontrado' });
    }

    if (aluguel.locador.toString() !== req.usuarioId && aluguel.locatario.toString() !== req.usuarioId) {
      return res.status(403).json({ erro: 'Você não tem permissão para alterar este aluguel.' });
    }

    // Regra específica: só pode marcar como concluído se já estava aceito
    // e se a data de devolução já passou. Evita chamadas diretas à API
    // "concluindo" um aluguel que ainda nem começou.
    if (status === 'concluido') {
      if (aluguel.status !== 'aceito' && aluguel.status !== 'andamento') {
        return res.status(400).json({ erro: 'Só é possível concluir um aluguel que está em andamento.' });
      }

      if (new Date() < new Date(aluguel.dataFim)) {
        return res.status(400).json({ erro: 'Ainda não é possível concluir: o período do aluguel não terminou.' });
      }
    }

    aluguel.status = status;
    await aluguel.save();

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
app.post('/api/pagamentos', autenticacao, async (req, res) => {
  try {
    const { aluguel, valor, vencimento, metodo } = req.body;

    const aluguelEncontrado = await Aluguel.findById(aluguel);

    if (!aluguelEncontrado) {
      return res.status(404).json({ erro: 'Aluguel não encontrado.' });
    }

    if (aluguelEncontrado.locatario.toString() !== req.usuarioId) {
      return res.status(403).json({ erro: 'Você não tem permissão para criar um pagamento para este aluguel.' });
    }

    const novoPagamento = new Pagamento({ aluguel, locatario: req.usuarioId, valor, vencimento, metodo });

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
app.get('/api/pagamentos/locatario/:locatarioId', autenticacao, async (req, res) => {
  try {
    if (req.params.locatarioId !== req.usuarioId) {
      return res.status(403).json({ erro: 'Você não tem permissão para ver estes pagamentos.' });
    }

    const pagamentos = await Pagamento.find({ locatario: req.params.locatarioId }).populate('aluguel');
    res.status(200).json(pagamentos);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar pagamentos do locatário' });
  }
});

// Confirmar pagamento (botão "Pagar Agora")
app.patch('/api/pagamentos/:id/status', autenticacao, async (req, res) => {
  try {
    const { status } = req.body;

    const pagamento = await Pagamento.findById(req.params.id);

    if (!pagamento) {
      return res.status(404).json({ erro: 'Pagamento não encontrado' });
    }

    if (pagamento.locatario.toString() !== req.usuarioId) {
      return res.status(403).json({ erro: 'Você não tem permissão para alterar este pagamento.' });
    }

    pagamento.status = status;
    await pagamento.save();

    res.status(200).json({
      mensagem: 'Status do pagamento atualizado com sucesso!',
      pagamento
    });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao atualizar status do pagamento', detalhes: erro.message });
  }
});

// --- Avaliação ---

// Criar avaliação (só permitido se o aluguel estiver concluído)
app.post('/api/avaliacoes', autenticacao, async (req, res) => {
  try {
    const { aluguel, nota, comentario } = req.body;
    const autor = req.usuarioId;

    const aluguelEncontrado = await Aluguel.findById(aluguel);

    if (!aluguelEncontrado) {
      return res.status(404).json({ erro: 'Aluguel não encontrado.' });
    }

    if (aluguelEncontrado.status !== 'concluido') {
      return res.status(400).json({ erro: 'Só é possível avaliar após o aluguel ser concluído.' });
    }

    // Determina quem é o avaliado com base no aluguel, não confia no que o front envia
    let avaliado;
    if (String(aluguelEncontrado.locatario) === String(autor)) {
      avaliado = aluguelEncontrado.locador;
    } else if (String(aluguelEncontrado.locador) === String(autor)) {
      avaliado = aluguelEncontrado.locatario;
    } else {
      return res.status(403).json({ erro: 'Você não faz parte deste aluguel.' });
    }

    const novaAvaliacao = new Avaliacao({ aluguel, autor, avaliado, nota, comentario });
    await novaAvaliacao.save();

    res.status(201).json({
      mensagem: 'Avaliação enviada com sucesso!',
      avaliacao: novaAvaliacao
    });
  } catch (erro) {
    if (erro.code === 11000) {
      return res.status(409).json({ erro: 'Você já avaliou este aluguel.' });
    }
    res.status(500).json({ erro: 'Erro ao criar avaliação', detalhes: erro.message });
  }
});

// Listar avaliações recebidas por um usuário (nota média e comentários)
app.get('/api/avaliacoes/usuario/:usuarioId', async (req, res) => {
  try {
    const avaliacoes = await Avaliacao.find({ avaliado: req.params.usuarioId })
      .populate('autor', 'nome avatar')
      .sort({ createdAt: -1 });

    const media = avaliacoes.length ? avaliacoes.reduce((soma, a) => soma + a.nota, 0) / avaliacoes.length : 0;

    res.status(200).json({
      avaliacoes,
      media: Number(media.toFixed(1)),
      total: avaliacoes.length
    });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar avaliações do usuário' });
  }
});

// Verificar se um aluguel específico já foi avaliado por um autor (usado para mostrar/esconder botão "Avaliar")
app.get('/api/avaliacoes/aluguel/:aluguelId/autor/:autorId', async (req, res) => {
  try {
    const avaliacao = await Avaliacao.findOne({
      aluguel: req.params.aluguelId,
      autor: req.params.autorId
    });

    res.status(200).json({ avaliado: !!avaliacao });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao verificar avaliação' });
  }
});

app.post('/api/conversas', autenticacao, async (req, res) => {
  try {
    const { usuarioB, anuncio } = req.body;
    const usuarioA = req.usuarioId;

    if (!usuarioA || !usuarioB) {
      return res.status(400).json({ erro: 'Os dois participantes são obrigatórios.' });
    }

    if (String(usuarioA) === String(usuarioB)) {
      return res.status(400).json({ erro: 'Não é possível iniciar uma conversa consigo mesmo.' });
    }

    const filtro = {
      participantes: { $all: [usuarioA, usuarioB], $size: 2 }
    };
    if (anuncio) filtro.anuncio = anuncio;

    let conversa = await Conversa.findOne(filtro);

    if (!conversa) {
      conversa = new Conversa({
        participantes: [usuarioA, usuarioB],
        anuncio: anuncio || null
      });
      await conversa.save();
    }

    const conversaPopulada = await Conversa.findById(conversa._id)
      .populate('participantes', 'nome avatar')
      .populate('anuncio', 'titulo fotos');

    res.status(200).json(conversaPopulada);
  } catch (erro) {
    console.error("ERRO AO INICIAR CONVERSA NO BACKEND:", erro);
    res.status(500).json({ erro: 'Erro ao iniciar conversa', detalhes: erro.message });
  }
});

// Listar conversas de um usuário (usado nos painéis)
app.get('/api/conversas/usuario/:usuarioId', autenticacao, async (req, res) => {
  try {
    const { usuarioId } = req.params;

    if (usuarioId !== req.usuarioId) {
      return res.status(403).json({ erro: 'Você não tem permissão para ver estas conversas.' });
    }

    const conversas = await Conversa.find({ participantes: usuarioId })
      .populate('participantes', 'nome avatar')
      .populate('anuncio', 'titulo fotos')
      .sort({ ultimaMensagemEm: -1 });

    const conversasComNaoLidas = await Promise.all(
      conversas.map(async (conversa) => {
        const naoLidas = await Mensagem.countDocuments({
          conversa: conversa._id,
          destinatario: usuarioId,
          lida: false
        });
        return { ...conversa.toObject(), naoLidas };
      })
    );

    res.status(200).json(conversasComNaoLidas);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar conversas' });
  }
});

// Contar total de mensagens não lidas de um usuário (usado nos cards de estatística)
app.get('/api/mensagens/nao-lidas/:usuarioId', autenticacao, async (req, res) => {
  try {
    if (req.params.usuarioId !== req.usuarioId) {
      return res.status(403).json({ erro: 'Você não tem permissão para ver estas mensagens.' });
    }

    const total = await Mensagem.countDocuments({
      destinatario: req.params.usuarioId,
      lida: false
    });
    res.status(200).json({ total });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao contar mensagens não lidas' });
  }
});

// Listar mensagens de uma conversa
app.get('/api/mensagens/conversa/:conversaId', autenticacao, async (req, res) => {
  try {
    const conversa = await Conversa.findById(req.params.conversaId);

    if (!conversa) {
      return res.status(404).json({ erro: 'Conversa não encontrada.' });
    }

    const ehParticipante = conversa.participantes.some(p => p.toString() === req.usuarioId);
    if (!ehParticipante) {
      return res.status(403).json({ erro: 'Você não faz parte desta conversa.' });
    }

    const mensagens = await Mensagem.find({ conversa: req.params.conversaId })
      .populate('remetente', 'nome avatar')
      .sort({ createdAt: 1 });

    res.status(200).json(mensagens);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar mensagens' });
  }
});

// Enviar mensagem
app.post('/api/mensagens', autenticacao, async (req, res) => {
  try {
    const { conversa, destinatario, texto } = req.body;
    const remetente = req.usuarioId;

    if (!conversa || !destinatario || !texto?.trim()) {
      return res.status(400).json({ erro: 'Conversa, destinatário e texto são obrigatórios.' });
    }

    const conversaExistente = await Conversa.findById(conversa);
    if (!conversaExistente) {
      return res.status(404).json({ erro: 'Conversa não encontrada.' });
    }

    const ehParticipante = conversaExistente.participantes.some(p => p.toString() === remetente);
    if (!ehParticipante) {
      return res.status(403).json({ erro: 'Você não faz parte desta conversa.' });
    }

    const novaMensagem = new Mensagem({ conversa, remetente, destinatario, texto: texto.trim() });
    await novaMensagem.save();

    conversaExistente.ultimaMensagem = texto.trim();
    conversaExistente.ultimaMensagemEm = novaMensagem.createdAt;
    conversaExistente.ultimaMensagemAutor = remetente;
    await conversaExistente.save();

    const mensagemPopulada = await novaMensagem.populate('remetente', 'nome avatar');

    res.status(201).json(mensagemPopulada);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao enviar mensagem', detalhes: erro.message });
  }
});
// Marcar mensagens de uma conversa como lidas por um usuário
app.patch('/api/mensagens/conversa/:conversaId/lida', autenticacao, async (req, res) => {
  try {
    await Mensagem.updateMany(
      { conversa: req.params.conversaId, destinatario: req.usuarioId, lida: false },
      { lida: true }
    );

    res.status(200).json({ mensagem: 'Mensagens marcadas como lidas.' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao marcar mensagens como lidas', detalhes: erro.message });
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