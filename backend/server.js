require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const upload = require('./config/upload');
const uploadVerificacao = require('./config/uploadVerificacao');
const cloudinary = require('./config/cloudinary');
const autenticacaoAdmin = require('./middlewares/autenticacaoAdmin');
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
const Favorito = require('./models/Favorito');
const app = express();
const path = require('path');
const { WebhookSignatureValidator } = require('mercadopago');
const { ErroMercadoPago, criarOrder, buscarOrder } = require('./config/mercadopago');
const OcupacaoDia = require('./models/OcupacaoDia');
const { criarFiltroBusca, pontuarAnuncio } = require('./utils/busca');
const { statusPagamentoDaOrder, aluguelPodeIniciar, pagamentoVencido } = require('./utils/pagamentos');
const { arquivoImagemValido, caminhosDocumentos, cpfValido, removerArquivos } = require('./utils/verificacao');
const { STATUS_ALUGUEL_ABERTO } = require('./utils/conta');
const { emailValido, senhaForteOSuficiente, validarCadastro } = require('./utils/cadastro');
const { hashTokenRecuperacao, tokenRecuperacaoTemFormatoValido } = require('./utils/recuperacao');

const DIRETORIO_DOCUMENTOS = uploadVerificacao.diretorio;

const origensPermitidas = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origem) => origem.trim())
  .filter(Boolean);

app.use(cors({ origin: origensPermitidas }));
app.use(express.json());

function processarUploadFotos(limite) {
  const middlewareUpload = upload.array('fotos', limite);
  return (req, res, next) => {
    middlewareUpload(req, res, (erro) => {
      if (!erro) return next();
      if (erro.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ erro: 'Cada foto deve ter no máximo 5 MB.' });
      }
      return res.status(400).json({ erro: erro.message || 'Não foi possível enviar as fotos.' });
    });
  };
}

app.get('/api/health', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ status: 'indisponivel', servico: 'lendloop-api', banco: 'desconectado' });
    }

    await mongoose.connection.db.admin().ping();
    return res.status(200).json({ status: 'ok', servico: 'lendloop-api', banco: 'conectado' });
  } catch (erro) {
    console.error('Erro no health check do banco:', erro.message);
    return res.status(503).json({ status: 'indisponivel', servico: 'lendloop-api', banco: 'sem resposta' });
  }
});


// Cria uma notificação para um usuário. Nunca lança erro: uma falha aqui
// não pode derrubar a rota principal que a chamou (envio de mensagem, etc).
async function criarNotificacao({ usuario, tipo, titulo, texto, linkPainel = null, estadoNavegacao = {} }) {
  try {
    await Notificacao.create({ usuario, tipo, titulo, texto, linkPainel, estadoNavegacao });
  } catch (erro) {
    console.error('Erro ao criar notificação:', erro);
  }
}

// Valores monetários são comparados e enviados em centavos: o Mercado Pago
// rejeita valores com mais de 2 casas decimais.
const emCentavos = (valor) => Math.round(Number(valor) * 100);

function criarTokenDeSessao(usuarioId, versaoSessao = 0) {
  return jwt.sign({ id: usuarioId, sessao: Number(versaoSessao || 0) }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function normalizarData(valor) {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return null;
  return new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()));
}

function diasDoPeriodo(inicio, fim) {
  const dias = [];
  for (let dia = new Date(inicio); dia < fim; dia.setUTCDate(dia.getUTCDate() + 1)) {
    dias.push(dia.toISOString().slice(0, 10));
  }
  return dias;
}

function processarUploadVerificacao(req, res, next) {
  const middlewareUpload = uploadVerificacao.fields([
    { name: 'frente', maxCount: 1 },
    { name: 'verso', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
  ]);

  middlewareUpload(req, res, async (erro) => {
    if (!erro) return next();
    const arquivosParciais = Object.values(req.files || {}).flat();
    await removerArquivos(arquivosParciais.map((arquivo) => arquivo.path)).catch(() => {});
    if (erro.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ erro: 'Cada documento deve ter no máximo 5 MB.' });
    }
    return res.status(400).json({ erro: erro.message || 'Não foi possível enviar os documentos.' });
  });
}

class ErroHttp extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.statusHttp = status;
  }
}

function usuarioPublico(usuario) {
  return {
    id: usuario._id,
    nome: usuario.nome,
    avatar: usuario.avatar,
    bio: usuario.bio,
    localizacao: usuario.localizacao,
    createdAt: usuario.createdAt,
    verificacao: { status: usuario.verificacao?.status || 'nao_enviado' }
  };
}

// Remove o que fica pendurado em anúncios já apagados. Não apaga Aluguel,
// Pagamento nem Avaliacao: são histórico financeiro e de reputação de terceiros.
async function removerDependenciasDeAnuncios(idsAnuncios) {
  if (!idsAnuncios.length) return;
  await OcupacaoDia.deleteMany({ anuncio: { $in: idsAnuncios } });
  await Favorito.deleteMany({ anuncio: { $in: idsAnuncios } });
  await Conversa.updateMany({ anuncio: { $in: idsAnuncios } }, { $set: { anuncio: null } });
}

function autenticacaoOpcional(req, res, next) {
  const [, token] = (req.headers.authorization || '').split(' ');
  if (token) {
    try {
      req.usuarioId = jwt.verify(token, process.env.JWT_SECRET).id;
    } catch (_) {
      // Perfis públicos não exigem uma sessão válida.
    }
  }
  next();
}

// --- Rotas LendLoop ---

app.put('/api/anuncios/:id', autenticacao, async (req, res) => {
  try {
    const anuncioExistente = await Anuncio.findById(req.params.id);
    if (!anuncioExistente) {
      return res.status(404).json({ erro: 'Anúncio não encontrado' });
    }

    if (anuncioExistente.locador.toString() !== req.usuarioId) {
      return res.status(403).json({ erro: 'Você não tem permissão para editar este anúncio.' });
    }

    const {
      titulo, descricao, categoria, subcategorias, especificacoes,
      fotos, endereco, disponivel, status, precos
    } = req.body;
    if (status !== undefined && !['rascunho', 'publicado'].includes(status)) {
      return res.status(400).json({ erro: 'Status de anúncio inválido.' });
    }

    if (fotos !== undefined && (!Array.isArray(fotos) || fotos.length > 6
      || fotos.some((foto) => typeof foto !== 'string' || !/^https?:\/\//i.test(foto.trim())))) {
      return res.status(400).json({ erro: 'Envie até 6 fotos com URLs válidas.' });
    }

    const statusFinal = status ?? anuncioExistente.status;
    const fotosFinais = fotos ?? anuncioExistente.fotos;
    if (statusFinal === 'publicado'
      && new Set((fotosFinais || []).filter((foto) => typeof foto === 'string' && foto.trim()).map((foto) => foto.trim())).size < 3) {
      return res.status(400).json({ erro: 'Adicione pelo menos 3 fotos do item para publicar o anúncio.' });
    }

    const tituloFinal = titulo ?? anuncioExistente.titulo;
    const descricaoFinal = descricao ?? anuncioExistente.descricao;
    const categoriaFinal = categoria ?? anuncioExistente.categoria;
    const enderecoFinal = endereco ?? anuncioExistente.endereco;
    if (typeof tituloFinal !== 'string' || tituloFinal.trim().length < 3
      || typeof descricaoFinal !== 'string' || descricaoFinal.trim().length < 20
      || !categoriaFinal || !enderecoFinal) {
      return res.status(400).json({ erro: 'Título, descrição, categoria e endereço válidos são obrigatórios.' });
    }

    const camposAtualizados = {};
    if (titulo !== undefined) camposAtualizados.titulo = titulo;
    if (descricao !== undefined) camposAtualizados.descricao = descricao;
    if (categoria !== undefined) camposAtualizados.categoria = categoria;
    if (subcategorias !== undefined) camposAtualizados.subcategorias = subcategorias;
    if (especificacoes !== undefined) camposAtualizados.especificacoes = especificacoes;
    if (fotos !== undefined) camposAtualizados.fotos = fotos;
    if (endereco !== undefined) camposAtualizados.endereco = endereco;
    if (disponivel !== undefined) camposAtualizados.disponivel = disponivel;
    if (status !== undefined) camposAtualizados.status = status;
    if (precos !== undefined) {
      const precoPorDia = Number(precos.precoPorDia);
      const caucao = Number(precos.caucao || 0);
      if (!Number.isFinite(precoPorDia) || precoPorDia < 0 || !Number.isFinite(caucao) || caucao < 0) {
        return res.status(400).json({ erro: 'Os preços do anúncio são inválidos.' });
      }
      camposAtualizados.precos = {
        ...anuncioExistente.precos.toObject(),
        precoPorDia,
        caucao,
        exigirCaucao: Boolean(precos.exigirCaucao),
        horarioRetirada: precos.horarioRetirada || anuncioExistente.precos.horarioRetirada,
        horarioDevolucao: precos.horarioDevolucao || anuncioExistente.precos.horarioDevolucao
      };
    }

    const anuncioAtualizado = await Anuncio.findByIdAndUpdate(
      req.params.id,
      camposAtualizados,
      { new: true, runValidators: true }
    );

    res.status(200).json({ mensagem: 'Anúncio atualizado com sucesso!', anuncio: anuncioAtualizado });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao atualizar anúncio', detalhes: erro.message });
  }
});

// Cadastro
app.post('/api/usuarios', async (req, res) => {
  try {
    const { nome, senha, telefone, cep, localizacao, objetivo } = req.body;
    const email = String(req.body.email || '').trim().toLowerCase();
    const erroValidacao = validarCadastro({ nome, email, senha, cep, localizacao, objetivo });
    if (erroValidacao) return res.status(400).json({ erro: erroValidacao });

    const senhaCriptografada = await bcrypt.hash(senha, 10);
    const novoUsuario = new Usuario({
      nome: nome.trim(), email: email.trim().toLowerCase(), senha: senhaCriptografada,
      telefone: String(telefone || '').trim().slice(0, 30),
      cep: String(cep).replace(/\D/g, ''),
      localizacao: localizacao.trim().slice(0, 120),
      objetivo
    });

    await novoUsuario.save();

    res.status(201).json({
      mensagem: 'Usuário criado com sucesso no LendLoop!',
      token: criarTokenDeSessao(novoUsuario._id, novoUsuario.versaoSessao),
      usuario: {
        id: novoUsuario._id,
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        localizacao: novoUsuario.localizacao,
        objetivo: novoUsuario.objetivo,
        papel: novoUsuario.papel,
        verificacao: novoUsuario.verificacao,
        createdAt: novoUsuario.createdAt
      }
    });
  } catch (erro) {
    if (erro.code === 11000) {
      return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });
    }
    if (erro.name === 'ValidationError') {
      return res.status(400).json({ erro: 'Os dados informados não são válidos.' });
    }
    console.error('Erro ao criar usuário:', erro);
    res.status(500).json({ erro: 'Não foi possível criar a conta. Tente novamente.' });
  }
});

// Listagem
app.get('/api/usuarios', autenticacao, async (req, res) => {
  try {
    const usuarios = await Usuario.find({ ativo: true }).select('nome avatar bio createdAt verificacao.status');
    res.status(200).json(usuarios);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar usuários' });
  }
});

// Buscar um usuário específico (usado em MeuPerfil)
app.get('/api/usuarios/:id', autenticacaoOpcional, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select('-senha');
    if (!usuario || (usuario.ativo === false && req.usuarioId !== req.params.id)) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }
    if (req.usuarioId === req.params.id && usuario.ativo !== false) {
      return res.status(200).json(usuario);
    }
    res.status(200).json(usuarioPublico(usuario));
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

    // Não deixa excluir a conta com aluguel em andamento (o outro lado ficaria sem resposta)
    const aluguelAberto = await Aluguel.exists({
      $or: [{ locador: usuario._id }, { locatario: usuario._id }],
      status: { $in: STATUS_ALUGUEL_ABERTO }
    });
    if (aluguelAberto) {
      return res.status(409).json({ erro: 'Sua conta não pode ser encerrada enquanto houver solicitações ou aluguéis em aberto. Conclua ou cancele todos eles e tente novamente.' });
    }

    // Apaga de fato os anúncios do usuário (só afetam o próprio dono) e o que dependia deles
    const anunciosDoUsuario = await Anuncio.find({ locador: usuario._id }).select('_id');
    await Anuncio.deleteMany({ locador: usuario._id });
    await removerDependenciasDeAnuncios(anunciosDoUsuario.map((a) => a._id));

    // Mantém o vínculo técnico dos históricos concluídos, mas elimina os dados
    // pessoais e documentos que não precisam continuar armazenados.
    await removerArquivos(caminhosDocumentos(usuario.verificacao, DIRETORIO_DOCUMENTOS));
    usuario.nome = 'Usuário removido';
    usuario.email = `removido_${usuario._id}@lendloop.com`;
    usuario.senha = await bcrypt.hash(Math.random().toString(36), 10);
    usuario.telefone = '';
    usuario.avatar = '';
    usuario.bio = '';
    usuario.cep = '';
    usuario.localizacao = '';
    usuario.cpf = '';
    usuario.tokenRecuperacaoSenha = null;
    usuario.tokenRecuperacaoExpira = null;
    usuario.verificacao = {
      status: 'nao_enviado',
      documentoFrente: '',
      documentoVerso: '',
      selfie: '',
      enviadoEm: null,
      motivoRejeicao: '',
      revisadoEm: null,
      revisadoPor: null
    };
    usuario.ativo = false;

    await usuario.save();

    res.status(200).json({ mensagem: 'Conta excluída com sucesso.' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao excluir conta', detalhes: erro.message });
  }
});

// Limite simples por IP + e-mail. Impede força bruta sem revelar se a conta existe.
const tentativasLogin = new Map();
const JANELA_LOGIN_MS = 15 * 60 * 1000;
const MAX_TENTATIVAS_LOGIN = 5;

function chaveTentativaLogin(req, email) {
  return `${req.ip || req.socket.remoteAddress || 'desconhecido'}:${email}`;
}

function tentativasLoginAtivas(chave) {
  const registro = tentativasLogin.get(chave);
  if (!registro || Date.now() - registro.inicio >= JANELA_LOGIN_MS) {
    tentativasLogin.delete(chave);
    return 0;
  }
  return registro.total;
}

function registrarFalhaLogin(chave) {
  const registro = tentativasLogin.get(chave);
  if (!registro || Date.now() - registro.inicio >= JANELA_LOGIN_MS) {
    tentativasLogin.set(chave, { total: 1, inicio: Date.now() });
    return;
  }
  registro.total += 1;
}

// Login
app.post('/api/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const { senha } = req.body;
    if (!emailValido(email) || typeof senha !== 'string' || !senha) {
      return res.status(400).json({ erro: 'Informe um e-mail válido e sua senha.' });
    }

    const chaveTentativa = chaveTentativaLogin(req, email);
    if (tentativasLoginAtivas(chaveTentativa) >= MAX_TENTATIVAS_LOGIN) {
      return res.status(429).json({ erro: 'Muitas tentativas seguidas. Aguarde 15 minutos e tente novamente.' });
    }
    const usuario = await Usuario.findOne({ email }).select('+versaoSessao');

    // Mesma resposta para e-mail inexistente e senha errada: evita enumerar contas.
    // O bcrypt.compare roda mesmo sem usuário para o tempo de resposta não denunciar.
    const hashParaComparar = usuario?.senha || '$2b$10$3PinCMm4k4BwJFApBS2eG.OlVdaokntkj333FhqgcG0H72O71HHQ6';
    const senhaCorreta = await bcrypt.compare(senha, hashParaComparar);

    if (!usuario || !senhaCorreta) {
      registrarFalhaLogin(chaveTentativa);
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    }

    if (usuario.ativo === false) {
      return res.status(403).json({ erro: 'Esta conta está desativada.' });
    }

    const token = criarTokenDeSessao(usuario._id, usuario.versaoSessao);
    tentativasLogin.delete(chaveTentativa);

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
        papel: usuario.papel, // <--- AQUI ESTAVA 'role', MUDAMOS PARA 'papel'
        verificacao: usuario.verificacao,
        createdAt: usuario.createdAt,
      }
    });
  } catch (erro) {
    console.error("Erro no login:", erro);
    res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
});

// --- Recuperação de Senha ---

const solicitacoesRecuperacao = new Map();
const JANELA_RECUPERACAO_MS = 15 * 60 * 1000;
const MAX_SOLICITACOES_RECUPERACAO = 3;

function registrarSolicitacaoRecuperacao(chave) {
  const agora = Date.now();
  const registro = solicitacoesRecuperacao.get(chave);
  if (!registro || agora - registro.inicio >= JANELA_RECUPERACAO_MS) {
    solicitacoesRecuperacao.set(chave, { total: 1, inicio: agora });
    return 1;
  }
  registro.total += 1;
  return registro.total;
}

// Solicitar recuperação (envia e-mail com o link)
app.post('/api/esqueceu-senha', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!emailValido(email)) return res.status(400).json({ erro: 'Informe um endereço de e-mail válido.' });

    const chave = `${req.ip || req.socket.remoteAddress || 'desconhecido'}:${email}`;
    if (registrarSolicitacaoRecuperacao(chave) > MAX_SOLICITACOES_RECUPERACAO) {
      return res.status(429).json({ erro: 'Muitas solicitações seguidas. Aguarde 15 minutos antes de tentar novamente.' });
    }

    const usuario = await Usuario.findOne({ email });

    // Não revela se o e-mail existe ou não, por segurança
    if (!usuario || usuario.ativo === false) {
      return res.status(200).json({
        mensagem: 'Se este e-mail estiver cadastrado, você receberá um link com as instruções de recuperação em breve.'
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    usuario.tokenRecuperacaoSenha = hashTokenRecuperacao(token);
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

// Permite que a interface informe um link expirado antes de pedir a nova senha.
app.get('/api/redefinir-senha/validar', async (req, res) => {
  try {
    const token = String(req.query.token || '');
    if (!tokenRecuperacaoTemFormatoValido(token)) return res.status(400).json({ valido: false });
    const tokenHash = hashTokenRecuperacao(token);
    const existe = await Usuario.exists({ tokenRecuperacaoSenha: tokenHash, tokenRecuperacaoExpira: { $gt: new Date() }, ativo: { $ne: false } });
    return res.status(existe ? 200 : 400).json({ valido: Boolean(existe) });
  } catch (erro) {
    console.error('Erro ao validar token de recuperação:', erro);
    return res.status(500).json({ erro: 'Não foi possível validar o link.' });
  }
});

// Redefinir senha (recebe token + nova senha)
app.post('/api/redefinir-senha', async (req, res) => {
  try {
    const { token, novaSenha } = req.body;

    if (!token || !novaSenha) {
      return res.status(400).json({ erro: 'Token e nova senha são obrigatórios.' });
    }
    if (!senhaForteOSuficiente(novaSenha)) {
      return res.status(400).json({ erro: 'A nova senha deve ter pelo menos 8 caracteres e combinar letras, números, maiúsculas ou símbolos.' });
    }

    const tokenHash = hashTokenRecuperacao(token);
    const usuario = await Usuario.findOne({
      tokenRecuperacaoSenha: tokenHash,
      tokenRecuperacaoExpira: { $gt: new Date() }
    }).select('+tokenRecuperacaoSenha +tokenRecuperacaoExpira +versaoSessao');

    if (!usuario) {
      return res.status(400).json({ erro: 'Token inválido ou expirado. Solicite a recuperação novamente.' });
    }

    usuario.senha = await bcrypt.hash(novaSenha, 10);
    usuario.tokenRecuperacaoSenha = null;
    usuario.tokenRecuperacaoExpira = null;
    usuario.versaoSessao = Number(usuario.versaoSessao || 0) + 1;
    await usuario.save();

    res.status(200).json({ mensagem: 'Senha redefinida com sucesso!' });
  } catch (erro) {
    console.error('Erro ao redefinir senha:', erro);
    res.status(500).json({ erro: 'Erro ao redefinir senha.' });
  }
});

// --- Upload de Fotos ---
app.post('/api/upload', autenticacao, processarUploadFotos(6), async (req, res) => {
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
    const solicitante = await Usuario.findById(req.usuarioId).select('verificacao');
    if (solicitante?.verificacao?.status !== 'aprovado') {
      return res.status(403).json({
        erro: 'Você precisa ter sua identidade verificada para publicar um anúncio.',
        verificacaoNecessaria: true
      });
    }

    const { titulo, descricao, categoria, subcategorias, especificacoes, fotos, endereco, disponivel, precos, status } = req.body;
    if (fotos !== undefined && (!Array.isArray(fotos) || fotos.length > 6
      || fotos.some((foto) => typeof foto !== 'string' || !/^https?:\/\//i.test(foto.trim())))) {
      return res.status(400).json({ erro: 'Envie até 6 fotos com URLs válidas.' });
    }
    if (status === 'publicado' && (!Array.isArray(fotos) || new Set(fotos.map((foto) => foto.trim())).size < 3)) {
      return res.status(400).json({ erro: 'Adicione pelo menos 3 fotos diferentes do item para publicar o anúncio.' });
    }
    if (typeof titulo !== 'string' || titulo.trim().length < 3 || typeof descricao !== 'string' || descricao.trim().length < 20 || !categoria || !endereco || !precos) {
      return res.status(400).json({ erro: 'Título, descrição, categoria, endereço e preços válidos são obrigatórios.' });
    }
    if (!Number.isFinite(Number(precos.precoPorDia)) || Number(precos.precoPorDia) <= 0 || Number(precos.caucao || 0) < 0) {
      return res.status(400).json({ erro: 'Informe um preço diário válido e uma caução não negativa.' });
    }

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
    const { busca, dataInicio, dataFim, categoria, precoMin, precoMax, cidade, pagina, limite, ordenacao } = req.query;
    const filtro = { status: 'publicado' };

    const inicioFiltro = dataInicio ? normalizarData(dataInicio) : null;
    const fimFiltro = dataFim ? normalizarData(dataFim) : null;
    if ((dataInicio && !inicioFiltro) || (dataFim && !fimFiltro)) {
      return res.status(400).json({ erro: 'Informe datas válidas para a busca.' });
    }
    if (inicioFiltro && fimFiltro && fimFiltro <= inicioFiltro) {
      return res.status(400).json({ erro: 'A data final deve ser posterior à data inicial.' });
    }

    const minimo = precoMin !== undefined && precoMin !== '' ? Number(precoMin) : null;
    const maximo = precoMax !== undefined && precoMax !== '' ? Number(precoMax) : null;
    if ((minimo !== null && (!Number.isFinite(minimo) || minimo < 0))
      || (maximo !== null && (!Number.isFinite(maximo) || maximo < 0))) {
      return res.status(400).json({ erro: 'Informe uma faixa de preço válida.' });
    }
    if (minimo !== null && maximo !== null && minimo > maximo) {
      return res.status(400).json({ erro: 'O preço mínimo não pode ser maior que o preço máximo.' });
    }

    if (busca) {
      Object.assign(filtro, criarFiltroBusca(busca));
    }

    if (cidade?.trim()) {
      const cidadeSegura = cidade.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filtro['endereco.cidade'] = { $regex: cidadeSegura, $options: 'i' };
    }

    if (inicioFiltro || fimFiltro) {
      const condicaoData = {};

      if (inicioFiltro) condicaoData.$gte = inicioFiltro;
      if (fimFiltro) condicaoData.$lte = fimFiltro;
      if (!inicioFiltro || !fimFiltro) {
        filtro.disponivel = { $elemMatch: condicaoData };
      }
    }

    if (categoria) {
      const categorias = categoria.split(',').filter(Boolean);
      if (categorias.length > 0) {
        filtro.categoria = { $in: categorias };
      }
    }

    if (minimo !== null || maximo !== null) {
      filtro['precos.precoPorDia'] = {};
      if (minimo !== null) filtro['precos.precoPorDia'].$gte = minimo;
      if (maximo !== null) filtro['precos.precoPorDia'].$lte = maximo;
    }

    let anuncios = await Anuncio.find(filtro).populate('locador', 'nome avatar verificacao.status ativo');

    // Anúncio cujo dono foi apagado ou desativado não pode aparecer na busca.
    // Sem este filtro o populate devolve locador: null e o anúncio continua listado.
    anuncios = anuncios.filter((anuncio) => anuncio.locador && anuncio.locador.ativo !== false);
    if (busca) {
      anuncios.sort((a, b) => pontuarAnuncio(b, busca) - pontuarAnuncio(a, busca));
    }
    if (inicioFiltro && fimFiltro) {
      const diasSolicitados = diasDoPeriodo(inicioFiltro, fimFiltro);
      anuncios = anuncios.filter((anuncio) => {
        const diasDisponiveis = new Set((anuncio.disponivel || []).map((dia) => normalizarData(dia)?.toISOString().slice(0, 10)));
        return diasSolicitados.every((dia) => diasDisponiveis.has(dia));
      });
    }

    const idsAnuncios = anuncios.map((anuncio) => anuncio._id);
    const resumoAvaliacoes = idsAnuncios.length > 0
      ? await Avaliacao.aggregate([
        { $match: { anuncio: { $in: idsAnuncios } } },
        { $lookup: { from: 'anuncios', localField: 'anuncio', foreignField: '_id', as: 'anuncioRelacionado' } },
        { $unwind: '$anuncioRelacionado' },
        { $match: { $expr: { $eq: ['$avaliado', '$anuncioRelacionado.locador'] } } },
        { $group: { _id: '$anuncio', media: { $avg: '$nota' }, total: { $sum: 1 } } }
      ])
      : [];
    const avaliacoesPorAnuncio = new Map(
      resumoAvaliacoes.map((resumo) => [resumo._id.toString(), resumo])
    );
    anuncios = anuncios.map((anuncio) => {
      const resumo = avaliacoesPorAnuncio.get(anuncio._id.toString());
      return {
        ...anuncio.toObject(),
        avaliacao: resumo ? Number(resumo.media.toFixed(1)) : null,
        totalAvaliacoes: resumo?.total || 0
      };
    });

    if (ordenacao === 'menor-preco') {
      anuncios.sort((a, b) => a.precos.precoPorDia - b.precos.precoPorDia);
    } else if (ordenacao === 'maior-preco') {
      anuncios.sort((a, b) => b.precos.precoPorDia - a.precos.precoPorDia);
    } else if (ordenacao === 'melhor-avaliacao') {
      anuncios.sort((a, b) => (b.avaliacao || 0) - (a.avaliacao || 0));
    }

    if (pagina !== undefined || limite !== undefined) {
      const limitePorPagina = Math.min(24, Math.max(1, Number.parseInt(limite, 10) || 8));
      const totalItens = anuncios.length;
      const totalPaginas = Math.max(1, Math.ceil(totalItens / limitePorPagina));
      const paginaAtual = Math.min(totalPaginas, Math.max(1, Number.parseInt(pagina, 10) || 1));
      const inicio = (paginaAtual - 1) * limitePorPagina;

      return res.status(200).json({
        itens: anuncios.slice(inicio, inicio + limitePorPagina),
        pagina: paginaAtual,
        limite: limitePorPagina,
        totalItens,
        totalPaginas
      });
    }

    res.status(200).json(anuncios);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar anúncios' });
  }
});

// Buscar um anúncio específico (usado em DetalhesProduto)
app.get('/api/anuncios/:id', async (req, res) => {
  try {
    const anuncio = await Anuncio.findById(req.params.id).populate('locador', 'nome bio avatar createdAt verificacao.status ativo');
    if (!anuncio || !anuncio.locador || anuncio.locador.ativo === false) {
      return res.status(404).json({ erro: 'Anúncio não encontrado' });
    }
    res.status(200).json(anuncio);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar anúncio' });
  }
});

// Períodos já reservados de um anúncio, usados pelo calendário de reserva.
// Expõe só as datas, sem nenhum dado de quem reservou.
app.get('/api/anuncios/:id/ocupacao', async (req, res) => {
  try {
    const reservas = await Aluguel.find({
      anuncio: req.params.id,
      status: { $in: ['pendente', 'aceito', 'andamento', 'aguardando_confirmacao'] },
      dataFim: { $gt: new Date() }
    }).select('dataInicio dataFim -_id');

    res.status(200).json(reservas);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar a ocupação do anúncio' });
  }
});

app.get('/api/anuncios/locador/:locadorId', autenticacaoOpcional, async (req, res) => {
  try {
    const ehProprioLocador = req.usuarioId === req.params.locadorId;
    const filtro = {
      locador: req.params.locadorId,
      ...(ehProprioLocador ? {} : { status: 'publicado' })
    };
    const anuncios = await Anuncio.find(filtro).sort({ createdAt: -1 });
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

    const temAluguelAtivo = await Aluguel.exists({
      anuncio: anuncio._id,
      status: { $in: ['pendente', 'aceito', 'andamento', 'aguardando_confirmacao'] }
    });
    if (temAluguelAtivo) {
      return res.status(409).json({ erro: 'Este anúncio tem aluguéis em aberto. Conclua ou cancele antes de excluir.' });
    }

    await Anuncio.findByIdAndDelete(req.params.id);
    await removerDependenciasDeAnuncios([anuncio._id]);

    res.status(200).json({ mensagem: 'Anúncio excluído com sucesso.' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao excluir anúncio', detalhes: erro.message });
  }
});

// --- Aluguel ---

// Criar solicitação de aluguel (botão "Solicitar Aluguel" em DetalhesProduto)
app.post('/api/alugueis', autenticacao, async (req, res) => {
  try {
    const solicitante = await Usuario.findById(req.usuarioId).select('verificacao');
    if (solicitante?.verificacao?.status !== 'aprovado') {
      return res.status(403).json({
        erro: 'Você precisa ter sua identidade verificada para solicitar um aluguel.',
        verificacaoNecessaria: true
      });
    }

    const { anuncio, dataInicio, dataFim, horarioRetirada, horarioDevolucao } = req.body;

    const anuncioEncontrado = await Anuncio.findById(anuncio);

    if (!anuncioEncontrado) {
      return res.status(404).json({ erro: 'Anúncio não encontrado.' });
    }

    if (anuncioEncontrado.locador.toString() === req.usuarioId) {
      return res.status(400).json({ erro: 'Você não pode alugar seu próprio anúncio.' });
    }

    if (anuncioEncontrado.status !== 'publicado') {
      return res.status(400).json({
        erro: 'Este anúncio não está disponível para aluguel.'
      });
    }

    const inicio = normalizarData(dataInicio);
    const fim = normalizarData(dataFim);

    if (!inicio || !fim || fim <= inicio) {
      return res.status(400).json({
        erro: 'Informe um período de aluguel válido.'
      });
    }

    const diasReservados = diasDoPeriodo(inicio, fim);

    const diasDisponiveis = new Set(
      (anuncioEncontrado.disponivel || []).map(
        (dia) => normalizarData(dia)?.toISOString().slice(0, 10)
      )
    );

    if (
      !diasReservados.length ||
      !diasReservados.every((dia) => diasDisponiveis.has(dia))
    ) {
      return res.status(409).json({
        erro: 'O anúncio não está disponível durante todo o período escolhido.'
      });
    }
    const conflito = await Aluguel.exists({
      anuncio: anuncioEncontrado._id,
      status: { $in: ['pendente', 'aceito', 'andamento', 'aguardando_confirmacao'] },
      dataInicio: { $lt: fim },
      dataFim: { $gt: inicio }
    });
    if (conflito) {
      return res.status(409).json({
        erro: 'Já existe uma solicitação ativa para esse período.'
      });
    }

    const precoPorDia = Number(anuncioEncontrado.precos?.precoPorDia);

    if (!Number.isFinite(precoPorDia) || precoPorDia < 0) {
      return res.status(400).json({
        erro: 'O anúncio possui um preço inválido.'
      });
    }

    const subtotal = precoPorDia * diasReservados.length;

    const taxaCalculada = Number(
      (subtotal * 0.03).toFixed(2)
    );

    const caucaoCalculada = anuncioEncontrado.precos?.exigirCaucao
      ? Number(anuncioEncontrado.precos?.caucao || 0)
      : 0;

    const precoTotal = Number(
      (subtotal + taxaCalculada + caucaoCalculada).toFixed(2)
    );

    const novoAluguel = new Aluguel({
      anuncio,
      locatario: req.usuarioId,
      locador: anuncioEncontrado.locador,
      dataInicio: inicio, dataFim: fim,
      horarioRetirada: horarioRetirada || anuncioEncontrado.precos?.horarioRetirada,
      horarioDevolucao: horarioDevolucao || anuncioEncontrado.precos?.horarioDevolucao,
      precoTotal: precoTotal,
      taxaServico: taxaCalculada,
      caucao: caucaoCalculada
    });

    // Reserva cada dia no banco. O índice único (anuncio + dia) garante que duas
    // requisições simultâneas não consigam ocupar o mesmo dia: a segunda falha.
    try {
      await OcupacaoDia.insertMany(
        diasReservados.map((dia) => ({ anuncio: anuncioEncontrado._id, dia, aluguel: novoAluguel._id })),
        { ordered: true }
      );
    } catch (erroOcupacao) {
      // Desfaz o que a própria requisição inseriu (e só isso) antes de responder.
      await OcupacaoDia.deleteMany({ aluguel: novoAluguel._id });
      if (erroOcupacao.code === 11000 || erroOcupacao.writeErrors?.some((e) => e.code === 11000)) {
        return res.status(409).json({ erro: 'Já existe uma solicitação ativa para esse período.' });
      }
      throw erroOcupacao;
    }

    try {
      await novoAluguel.save();
    } catch (erroSalvar) {
      // Não deixa os dias presos se o aluguel não chegou a ser salvo.
      await OcupacaoDia.deleteMany({ aluguel: novoAluguel._id });
      throw erroSalvar;
    }

    await criarNotificacao({
      usuario: anuncioEncontrado.locador,
      tipo: 'solicitacao',
      titulo: 'Nova solicitação de aluguel',
      texto: `Você recebeu uma nova solicitação para "${anuncioEncontrado.titulo}".`,
      linkPainel: '/painelLocador',
      estadoNavegacao: { abrirAba: 'solicitacoes' }
    });

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

// Registra fotos do estado do item. O locador registra a retirada antes de
// aceitar a reserva; o locatário registra a devolução antes de solicitá-la.
app.post('/api/alugueis/:id/vistoria/:momento', autenticacao, processarUploadFotos(8), async (req, res) => {
  try {
    const { momento } = req.params;
    if (!['retirada', 'devolucao'].includes(momento)) {
      return res.status(400).json({ erro: 'Momento de vistoria inválido.' });
    }

    if (!req.files || req.files.length < 3) {
      return res.status(400).json({ erro: 'Envie pelo menos 3 fotos de detalhes do item.' });
    }

    const aluguel = await Aluguel.findById(req.params.id);
    if (!aluguel) return res.status(404).json({ erro: 'Aluguel não encontrado.' });

    const ehRetirada = momento === 'retirada';
    const responsavel = ehRetirada ? aluguel.locador : aluguel.locatario;
    if (String(responsavel) !== req.usuarioId) {
      return res.status(403).json({ erro: 'Você não pode enviar esta vistoria.' });
    }
    if (ehRetirada && aluguel.status !== 'pendente') {
      return res.status(400).json({ erro: 'A vistoria de retirada só pode ser enviada para uma solicitação pendente.' });
    }
    if (!ehRetirada && aluguel.status !== 'andamento') {
      return res.status(400).json({ erro: 'A vistoria de devolução só pode ser enviada durante o aluguel.' });
    }

    aluguel[ehRetirada ? 'vistoriaRetirada' : 'vistoriaDevolucao'] = {
      fotos: req.files.map((arquivo) => arquivo.path),
      enviadaEm: new Date()
    };
    await aluguel.save();

    res.status(200).json({ mensagem: 'Vistoria registrada com sucesso.', aluguel });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao enviar fotos da vistoria', detalhes: erro.message });
  }
});

// Atualizar status de um aluguel (aceitar, recusar, marcar como devolvido, etc.)
app.patch('/api/alugueis/:id/status', autenticacao, async (req, res) => {
  try {
    const { status } = req.body;
    const statusPermitidos = ['pendente', 'aceito', 'recusado', 'andamento', 'aguardando_confirmacao', 'concluido', 'cancelado'];
    if (!statusPermitidos.includes(status)) {
      return res.status(400).json({ erro: 'Status de aluguel inválido.' });
    }

    const aluguel = await Aluguel.findById(req.params.id);

    if (!aluguel) {
      return res.status(404).json({ erro: 'Aluguel não encontrado' });
    }

    if (aluguel.locador.toString() !== req.usuarioId && aluguel.locatario.toString() !== req.usuarioId) {
      return res.status(403).json({ erro: 'Você não tem permissão para alterar este aluguel.' });
    }

    if (status === 'aceito') {
      if (aluguel.locador.toString() !== req.usuarioId || aluguel.status !== 'pendente') {
        return res.status(403).json({ erro: 'Somente o locador pode aceitar uma solicitação pendente.' });
      }
      if ((aluguel.vistoriaRetirada?.fotos || []).length < 3) {
        return res.status(400).json({ erro: 'Registre ao menos 3 fotos da vistoria de retirada antes de aceitar.' });
      }
    }

    if (status === 'aguardando_confirmacao') {
      if (aluguel.locatario.toString() !== req.usuarioId) {
        return res.status(403).json({ erro: 'Somente o locatário pode solicitar a devolução.' });
      }
      if (aluguel.status !== 'andamento') {
        return res.status(400).json({ erro: 'A devolução só pode ser solicitada depois que o aluguel começar.' });
      }
      if ((aluguel.vistoriaDevolucao?.fotos || []).length < 3) {
        return res.status(400).json({ erro: 'Registre ao menos 3 fotos da devolução antes de solicitar confirmação.' });
      }
    }

    // Regra específica: só pode marcar como concluído se já estava aceito
    // e se a data de devolução já passou. Evita chamadas diretas à API
    // "concluindo" um aluguel que ainda nem começou.
    // Só pode concluir se estiver em andamento ou aguardando confirmação.
    if (status === 'concluido' && aluguel.status !== 'andamento' && aluguel.status !== 'aguardando_confirmacao') {
      return res.status(400).json({ erro: 'Só é possível concluir um aluguel que está em andamento ou aguardando confirmação.' });
    }
    if (status === 'concluido' && normalizarData(new Date()) < normalizarData(aluguel.dataFim)) {
      return res.status(400).json({ erro: 'Este aluguel só pode ser concluído na data prevista de devolução.' });
    }
    if (status === 'andamento' && normalizarData(new Date()) < normalizarData(aluguel.dataInicio)) {
      return res.status(400).json({ erro: 'Este aluguel ainda não chegou à data de início.' });
    }

    // Só avança para andamento/concluído com pagamento confirmado.
    // Exceção: aoConfirmarPagamento move aceito -> andamento por updateOne, sem passar por esta rota.
    if (status === 'andamento' || status === 'concluido') {
      const pagamentoConfirmado = await Pagamento.exists({ aluguel: aluguel._id, status: 'confirmado' });
      if (!pagamentoConfirmado) {
        return res.status(400).json({ erro: 'O pagamento deste aluguel ainda não foi confirmado.' });
      }
    }

    const transicoes = {
      pendente: { aceito: 'locador', recusado: 'locador', cancelado: 'locatario' },
      aceito: { andamento: 'locador', cancelado: 'locatario' },
      andamento: { aguardando_confirmacao: 'locatario' },
      aguardando_confirmacao: { concluido: 'locador' }
    };
    const papelNecessario = transicoes[aluguel.status]?.[status];
    if (!papelNecessario) {
      return res.status(400).json({ erro: 'Esta mudança de status não é permitida.' });
    }
    if (String(aluguel[papelNecessario]) !== req.usuarioId) {
      return res.status(403).json({ erro: 'Você não tem permissão para esta mudança de status.' });
    }

    const statusAnterior = aluguel.status;
    let pagamentoDisponivel = null;
    const sessao = await mongoose.startSession();
    try {
      await sessao.withTransaction(async () => {
        const aluguelAtual = await Aluguel.findOne({ _id: aluguel._id, status: statusAnterior }).session(sessao);
        if (!aluguelAtual) {
          throw new ErroHttp(409, 'O aluguel foi alterado por outra operação. Atualize a página e tente novamente.');
        }

        if (['andamento', 'concluido'].includes(status)) {
          const pagamentoConfirmado = await Pagamento.exists({
            aluguel: aluguelAtual._id,
            status: 'confirmado'
          }).session(sessao);
          if (!pagamentoConfirmado) {
            throw new ErroHttp(400, 'O pagamento deste aluguel ainda não foi confirmado.');
          }
        }

        if (status === 'cancelado') {
          const pagamento = await Pagamento.findOne({ aluguel: aluguelAtual._id }).session(sessao);
          if (pagamento?.status === 'confirmado') {
            throw new ErroHttp(400, 'Não é possível cancelar um aluguel com pagamento confirmado.');
          }
          if (pagamento?.status === 'processando') {
            throw new ErroHttp(400, 'O pagamento deste aluguel está em processamento. Aguarde a confirmação.');
          }
          if (pagamento && !['cancelado', 'atrasado'].includes(pagamento.status)) {
            pagamento.status = 'cancelado';
            await pagamento.save({ session: sessao });
          }
        }

        aluguelAtual.status = status;
        await aluguelAtual.save({ session: sessao });

        if (['recusado', 'cancelado', 'concluido'].includes(status)) {
          await OcupacaoDia.deleteMany({ aluguel: aluguelAtual._id }).session(sessao);
        }

        if (status === 'aceito') {
          pagamentoDisponivel = await Pagamento.findOneAndUpdate(
            { aluguel: aluguelAtual._id },
            {
              $setOnInsert: {
                aluguel: aluguelAtual._id,
                locatario: aluguelAtual.locatario,
                valor: aluguelAtual.precoTotal,
                vencimento: aluguelAtual.dataInicio,
                status: 'pendente'
              }
            },
            { upsert: true, new: true, runValidators: true, session: sessao }
          );
        }

        aluguel.status = aluguelAtual.status;
      });
    } finally {
      await sessao.endSession();
    }

    // Notifica quem NÃO fez a alteração (a outra parte da negociação)
    const anuncioDoAluguel = await Anuncio.findById(aluguel.anuncio);
    const rotuloStatus = {
      pendente: 'pendente',
      aceito: 'aceita',
      recusado: 'recusada',
      andamento: 'em andamento',
      concluido: 'concluída',
      cancelado: 'cancelada'
    }[status] || status;

    const quemAlterou = req.usuarioId;
    const outraParte = quemAlterou === String(aluguel.locador) ? aluguel.locatario : aluguel.locador;
    const outraParteEhLocador = String(outraParte) === String(aluguel.locador);
    const notificacaoDePagamento = status === 'aceito' && !outraParteEhLocador && pagamentoDisponivel;
    const valorPagamento = notificacaoDePagamento
      ? Number(pagamentoDisponivel.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : null;

    await criarNotificacao({
      usuario: outraParte,
      tipo: notificacaoDePagamento ? 'pagamento' : 'status_aluguel',
      titulo: notificacaoDePagamento ? 'Pagamento disponível' : `Solicitação ${rotuloStatus}`,
      texto: notificacaoDePagamento
        ? `Sua solicitação para "${anuncioDoAluguel?.titulo || 'o item'}" foi aceita. O pagamento de ${valorPagamento} já está disponível.`
        : `O status da solicitação para "${anuncioDoAluguel?.titulo || 'seu anúncio'}" mudou para: ${rotuloStatus}.`,
      linkPainel: outraParteEhLocador ? '/painelLocador' : '/painellocatario',
      estadoNavegacao: notificacaoDePagamento
        ? { abrirAba: 'pagamentos', abaPagamentos: 'pendentes' }
        : { abrirAba: outraParteEhLocador ? 'solicitacoes' : 'alugueis' }
    });

    res.status(200).json({
      mensagem: 'Status do aluguel atualizado com sucesso!',
      aluguel
    });
  } catch (erro) {
    if (erro.statusHttp) return res.status(erro.statusHttp).json({ erro: erro.message });
    res.status(500).json({ erro: 'Erro ao atualizar status do aluguel', detalhes: erro.message });
  }
});

// Favoritos do locatário. A listagem devolve apenas os ids para manter a
// página de busca leve; os detalhes dos anúncios já estão no resultado.
app.get('/api/favoritos', autenticacao, async (req, res) => {
  try {
    const favoritos = await Favorito.find({ usuario: req.usuarioId }).select('anuncio -_id');
    res.status(200).json({ anuncios: favoritos.map((favorito) => favorito.anuncio.toString()) });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar favoritos.' });
  }
});

app.post('/api/favoritos/:anuncioId', autenticacao, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.anuncioId)) {
      return res.status(400).json({ erro: 'Anúncio inválido.' });
    }
    const anuncio = await Anuncio.findOne({ _id: req.params.anuncioId, status: 'publicado' }).select('_id');
    if (!anuncio) return res.status(404).json({ erro: 'Anúncio não encontrado.' });

    await Favorito.updateOne(
      { usuario: req.usuarioId, anuncio: anuncio._id },
      { $setOnInsert: { usuario: req.usuarioId, anuncio: anuncio._id } },
      { upsert: true }
    );
    res.status(200).json({ favorito: true });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao favoritar anúncio.' });
  }
});

app.delete('/api/favoritos/:anuncioId', autenticacao, async (req, res) => {
  try {
    await Favorito.deleteOne({ usuario: req.usuarioId, anuncio: req.params.anuncioId });
    res.status(200).json({ favorito: false });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao remover favorito.' });
  }
});

// --- Pagamento ---

// Criar pagamento (gerado a partir de um aluguel)
app.post('/api/pagamentos', autenticacao, async (req, res) => {
  try {
    const { aluguel, metodo } = req.body;

    const aluguelEncontrado = await Aluguel.findById(aluguel);

    if (!aluguelEncontrado) {
      return res.status(404).json({ erro: 'Aluguel não encontrado.' });
    }

    if (aluguelEncontrado.locatario.toString() !== req.usuarioId) {
      return res.status(403).json({ erro: 'Você não tem permissão para criar um pagamento para este aluguel.' });
    }

    if (!['aceito', 'andamento'].includes(aluguelEncontrado.status)) {
      return res.status(400).json({ erro: 'O pagamento só pode ser criado para um aluguel aceito.' });
    }

    if (metodo && !['pix', 'cartao', 'boleto'].includes(metodo)) {
      return res.status(400).json({ erro: 'Método de pagamento inválido.' });
    }

    const novoPagamento = await Pagamento.findOneAndUpdate(
      { aluguel: aluguelEncontrado._id },
      {
        $setOnInsert: {
          aluguel: aluguelEncontrado._id,
          locatario: req.usuarioId,
          valor: aluguelEncontrado.precoTotal,
          vencimento: aluguelEncontrado.dataInicio,
          ...(metodo ? { metodo } : {})
        }
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({
      mensagem: 'Pagamento criado com sucesso!',
      pagamento: novoPagamento
    });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao criar pagamento', detalhes: erro.message });
  }
});

const MENSAGENS_RECUSA = {
  invalid_users_involved: 'O pagador não é aceito por esta conta do Mercado Pago. Em testes, use o e-mail de um comprador de teste.',
  no_payment_method_for_provided_bin: 'Não foi possível identificar a bandeira do cartão. Confira o número ou tente outro cartão.',
  cc_rejected_bad_filled_card_number: 'Confira o número do cartão e tente novamente.',
  cc_rejected_bad_filled_date: 'Confira a data de validade do cartão e tente novamente.',
  cc_rejected_bad_filled_security_code: 'Confira o código de segurança do cartão e tente novamente.',
  cc_rejected_bad_filled_other: 'Confira os dados do cartão e tente novamente.',
  cc_rejected_insufficient_amount: 'O cartão não possui limite disponível para este pagamento. Tente outro cartão.',
  cc_rejected_card_disabled: 'Este cartão está desabilitado para a compra. Entre em contato com o banco ou tente outro cartão.',
  cc_rejected_call_for_authorize: 'O banco precisa autorizar esta compra. Entre em contato com o banco e tente novamente.',
  cc_rejected_high_risk: 'O pagamento não foi autorizado por segurança. Tente outro cartão.',
  cc_rejected_max_attempts: 'O limite de tentativas com este cartão foi atingido. Tente outro cartão.',
  cc_rejected_duplicated_payment: 'Um pagamento igual já foi realizado. Confira seus pagamentos antes de tentar novamente.',
};

function mensagemRecusa(statusDetail) {
  return MENSAGENS_RECUSA[statusDetail]
    || 'O pagamento não foi autorizado. Confira os dados ou tente outro cartão.';
}

function mensagemErroMercadoPago(erro) {
  const detalhes = JSON.stringify(erro?.corpo || {}) + ' ' + String(erro?.message || '');
  const codigo = Object.keys(MENSAGENS_RECUSA).find((chave) => detalhes.includes(chave));
  return codigo
    ? MENSAGENS_RECUSA[codigo]
    : 'Não foi possível validar os dados do pagamento. Confira as informações e tente novamente.';
}

async function aoConfirmarPagamento(pagamento) {
  const aluguelId = pagamento.aluguel?._id || pagamento.aluguel;
  const aluguel = await Aluguel.findById(aluguelId).select('anuncio locador dataInicio status');
  if (!aluguel) return;
  if (aluguel.status === 'aceito' && aluguelPodeIniciar(aluguel.dataInicio)) {
    await Aluguel.updateOne({ _id: aluguelId, status: 'aceito' }, { status: 'andamento' });
  }

  const anuncio = await Anuncio.findById(aluguel.anuncio).select('titulo');
  await criarNotificacao({
    usuario: aluguel.locador,
    tipo: 'status_aluguel',
    titulo: 'Pagamento confirmado',
    texto: `O pagamento do aluguel de "${anuncio?.titulo || 'seu anúncio'}" foi confirmado.`,
    linkPainel: '/painelLocador',
    estadoNavegacao: { abrirAba: 'solicitacoes' }
  });
}

async function aoReverterPagamento(pagamento) {
  const aluguelId = pagamento.aluguel?._id || pagamento.aluguel;
  const sessao = await mongoose.startSession();
  let aluguel = null;
  try {
    await sessao.withTransaction(async () => {
      aluguel = null;
      aluguel = await Aluguel.findOne({
        _id: aluguelId,
        status: { $in: ['aceito', 'andamento'] }
      }).session(sessao);
      if (!aluguel) return;
      aluguel.status = 'cancelado';
      await aluguel.save({ session: sessao });
      await OcupacaoDia.deleteMany({ aluguel: aluguel._id }).session(sessao);
    });
  } finally {
    await sessao.endSession();
  }
  if (!aluguel) return;

  const anuncio = await Anuncio.findById(aluguel.anuncio).select('titulo');
  await Promise.all([
    criarNotificacao({
      usuario: aluguel.locatario,
      tipo: 'pagamento',
      titulo: 'Pagamento revertido',
      texto: `O pagamento do aluguel de "${anuncio?.titulo || 'o item'}" foi revertido e o aluguel foi cancelado.`,
      linkPainel: '/painellocatario',
      estadoNavegacao: { abrirAba: 'pagamentos', abaPagamentos: 'confirmados' }
    }),
    criarNotificacao({
      usuario: aluguel.locador,
      tipo: 'status_aluguel',
      titulo: 'Pagamento revertido',
      texto: `O pagamento do aluguel de "${anuncio?.titulo || 'seu anúncio'}" foi revertido e o aluguel foi cancelado.`,
      linkPainel: '/painelLocador',
      estadoNavegacao: { abrirAba: 'solicitacoes' }
    })
  ]);
}

// Aplica ao pagamento o estado de uma Order consultada na API do Mercado Pago.
// É a única fonte do status: o corpo do webhook nunca é usado para isso.
async function aplicarOrderNoPagamento(pagamento, order) {
  if (order.external_reference !== String(pagamento._id) || emCentavos(order.total_amount) !== emCentavos(pagamento.valor)) {
    console.warn('Order do Mercado Pago não corresponde ao pagamento:', order.id, String(pagamento._id));
    return pagamento;
  }

  const novoStatus = statusPagamentoDaOrder(order);

  // Só a Order atual pode mudar o status. A exceção é uma confirmação: se
  // qualquer Order deste pagamento foi paga, o dinheiro foi cobrado.
  if (order.id !== pagamento.mpOrderId && !['confirmado', 'reembolsado', 'contestado'].includes(novoStatus)) return pagamento;

  const statusAnterior = pagamento.status;
  // Uma confirmação só pode voltar atrás quando o provedor informa uma
  // reversão financeira real (reembolso ou chargeback).
  if (statusAnterior === 'confirmado' && !['reembolsado', 'contestado'].includes(novoStatus)) return pagamento;

  const pagamentoMp = order.transactions?.payments?.[0];
  pagamento.mpOrderId = order.id;
  if (pagamentoMp?.id) pagamento.mpPaymentId = String(pagamentoMp.id);
  pagamento.mpStatusDetail = pagamentoMp?.status_detail || order.status_detail || '';
  if (!novoStatus) {
    await pagamento.save();
    return pagamento;
  }
  pagamento.status = novoStatus;
  // Uma recusa definitiva libera uma nova chave de idempotência para a próxima tentativa.
  if (novoStatus === 'falhou' && statusAnterior !== 'falhou') pagamento.tentativas += 1;
  await pagamento.save();

  if (novoStatus === 'confirmado') {
    // O dinheiro já foi cobrado: uma falha aqui não pode mudar o resultado do pagamento.
    await aoConfirmarPagamento(pagamento).catch((erro) => {
      console.error('Pagamento confirmado, mas houve erro ao atualizar o aluguel:', String(pagamento._id), erro.message);
    });
  } else if (['reembolsado', 'contestado'].includes(novoStatus)) {
    await aoReverterPagamento(pagamento);
  }
  return pagamento;
}

async function reconciliarPagamento(pagamento) {
  if (!pagamento.mpOrderId) return pagamento;
  return aplicarOrderNoPagamento(pagamento, await buscarOrder(pagamento.mpOrderId));
}

app.post('/api/pagamentos/:id/checkout', autenticacao, async (req, res) => {
  let pagamentoTravado = null;
  let statusAntesDoCheckout = null;

  try {
    const { token, payment_method_id, installments, payer } = req.body;
    const parcelas = Number(installments);
    if (typeof token !== 'string' || !token || typeof payment_method_id !== 'string' || !payment_method_id
      || !Number.isInteger(parcelas) || parcelas < 1 || parcelas > 24) {
      return res.status(400).json({ erro: 'Dados do cartão inválidos ou incompletos.' });
    }

    let pagamento = await Pagamento.findById(req.params.id).populate('aluguel', 'status');
    if (!pagamento) {
      return res.status(404).json({ erro: 'Pagamento não encontrado.' });
    }
    if (pagamento.locatario.toString() !== req.usuarioId) {
      return res.status(403).json({ erro: 'Você não tem permissão para pagar isto.' });
    }
    if (!['aceito', 'andamento'].includes(pagamento.aluguel?.status)) {
      return res.status(400).json({ erro: 'Este aluguel não está disponível para pagamento.' });
    }
    if (pagamentoVencido(pagamento.vencimento)) {
      await expirarPagamento(pagamento);
      return res.status(400).json({ erro: 'O prazo para pagar este aluguel encerrou.' });
    }

    // Uma tentativa anterior ficou sem resposta final: consulta o Mercado Pago antes de cobrar de novo.
    if (pagamento.status === 'processando' && pagamento.mpOrderId) {
      pagamento = await reconciliarPagamento(pagamento);
    }
    if (pagamento.status === 'confirmado') {
      return res.status(409).json({ erro: 'Este pagamento já foi confirmado.', status: 'confirmado' });
    }
    if (pagamento.status === 'processando') {
      return res.status(409).json({ erro: 'Este pagamento já está sendo processado.', status: 'processando' });
    }

    const locatario = await Usuario.findById(pagamento.locatario).select('email');
    // Em testes, o Mercado Pago só aceita pagadores que sejam usuários de teste.
    const emailPagador = String(process.env.MP_TEST_PAYER_EMAIL || '').trim() || locatario?.email;
    if (!emailPagador) {
      return res.status(400).json({ erro: 'Não foi possível identificar o pagador.' });
    }

    // Trava o pagamento: um segundo envio simultâneo recebe 409 em vez de cobrar de novo.
    statusAntesDoCheckout = pagamento.status;
    pagamentoTravado = await Pagamento.findOneAndUpdate(
      { _id: pagamento._id, status: statusAntesDoCheckout },
      { $set: { status: 'processando', metodo: 'cartao' }, $unset: { mpOrderId: 1, mpPaymentId: 1, mpStatusDetail: 1 } },
      { new: true }
    );
    if (!pagamentoTravado) {
      return res.status(409).json({ erro: 'Este pagamento já está sendo processado.', status: 'processando' });
    }

    const valor = (emCentavos(pagamentoTravado.valor) / 100).toFixed(2);
    const identificacao = payer?.identification?.type && payer?.identification?.number
      ? { type: String(payer.identification.type), number: String(payer.identification.number) }
      : undefined;

    let order;
    try {
      order = await criarOrder({
        type: 'online',
        processing_mode: 'automatic',
        total_amount: valor,
        external_reference: String(pagamentoTravado._id),
        payer: { email: emailPagador, ...(identificacao ? { identification: identificacao } : {}) },
        transactions: {
          payments: [{
            amount: valor,
            payment_method: { id: payment_method_id, type: 'credit_card', token, installments: parcelas },
          }],
        },
      }, `pagamento-${pagamentoTravado._id}-${pagamentoTravado.tentativas}`);
    } catch (erro) {
      // Recusa do pagamento: o Mercado Pago cria a Order com falha e devolve o id dela.
      if (!(erro instanceof ErroMercadoPago) || !erro.corpo?.data?.id) throw erro;
      order = await buscarOrder(erro.corpo.data.id);
    }

    pagamentoTravado.mpOrderId = order.id;
    const pagamentoAtualizado = await aplicarOrderNoPagamento(pagamentoTravado, order);
    pagamentoTravado = null;

    if (pagamentoAtualizado.status === 'falhou') {
      return res.status(402).json({
        erro: mensagemRecusa(pagamentoAtualizado.mpStatusDetail),
        status: 'falhou',
        statusDetail: pagamentoAtualizado.mpStatusDetail
      });
    }

    res.status(200).json({
      status: pagamentoAtualizado.status,
      orderId: pagamentoAtualizado.mpOrderId,
      statusDetail: pagamentoAtualizado.mpStatusDetail
    });
  } catch (erro) {
    console.error('Erro no checkout do Mercado Pago:', erro.status, erro.message, JSON.stringify(erro.corpo || {}));

    // Sem resposta definitiva do Mercado Pago: libera o pagamento com a mesma
    // chave de idempotência, então repetir o envio não duplica a cobrança.
    if (pagamentoTravado) {
      await Pagamento.updateOne({ _id: pagamentoTravado._id, status: 'processando' }, { status: statusAntesDoCheckout })
        .catch((erroReversao) => console.error('Erro ao liberar pagamento:', erroReversao));
    }

    // 401/403 do Mercado Pago são problemas de credencial do servidor, não da
    // sessão do usuário: repassá-los faria o front deslogar o locatário.
    if (erro instanceof ErroMercadoPago && erro.status >= 400 && erro.status < 500 && ![401, 403].includes(erro.status)) {
      return res.status(400).json({ erro: mensagemErroMercadoPago(erro) });
    }
    res.status(502).json({ erro: 'Não foi possível falar com o Mercado Pago agora. Tente novamente em instantes.' });
  }
});

app.post('/api/pagamentos/webhook', async (req, res) => {
  const tipo = req.query.type || req.body?.type;
  const dataId = String(req.query['data.id'] || req.body?.data?.id || '');
  if (tipo !== 'order' || !dataId) {
    return res.status(200).json({ recebido: true });
  }

  const segredo = String(process.env.MP_WEBHOOK_SECRET || '').trim();
  if (!segredo) {
    console.error('MP_WEBHOOK_SECRET não configurado: webhook do Mercado Pago ignorado.');
    return res.status(500).json({ erro: 'Webhook não configurado.' });
  }

  try {
    // O Mercado Pago assina o data.id em minúsculas, e os IDs de Order têm maiúsculas.
    WebhookSignatureValidator.validate({
      xSignature: req.headers['x-signature'],
      xRequestId: req.headers['x-request-id'],
      dataId: dataId.toLowerCase(),
      secret: segredo,
    });
  } catch (erro) {
    console.warn('Webhook do Mercado Pago rejeitado:', erro.reason || erro.message, req.headers['x-request-id']);
    return res.status(401).json({ erro: 'Assinatura do webhook inválida.' });
  }

  try {
    const order = await buscarOrder(dataId);
    const filtro = [{ mpOrderId: order.id }];
    if (/^[a-f0-9]{24}$/i.test(order.external_reference || '')) filtro.push({ _id: order.external_reference });

    const pagamento = await Pagamento.findOne({ $or: filtro });
    if (pagamento) await aplicarOrderNoPagamento(pagamento, order);

    return res.status(200).json({ recebido: true });
  } catch (erro) {
    if (erro instanceof ErroMercadoPago && erro.status === 404) {
      return res.status(200).json({ recebido: true });
    }
    // Responder com erro faz o Mercado Pago reenviar a notificação mais tarde.
    console.error('Erro ao processar webhook do Mercado Pago:', erro.status, erro.message);
    return res.status(500).json({ erro: 'Falha ao processar a notificação.' });
  }
});

// Confere no Mercado Pago os pagamentos que ficaram sem resposta final
// (webhook perdido ou rejeitado) e libera checkouts interrompidos.
async function reconciliarPagamentosPendentes() {
  const doisMinutosAtras = new Date(Date.now() - 2 * 60 * 1000);
  const pagamentos = await Pagamento.find({ status: 'processando', updatedAt: { $lt: doisMinutosAtras } }).limit(20);

  for (const pagamento of pagamentos) {
    try {
      if (pagamento.mpOrderId) {
        await reconciliarPagamento(pagamento);
      } else {
        // Checkout interrompido antes da resposta do Mercado Pago. A chave de
        // idempotência não mudou, então uma nova tentativa não cobra duas vezes.
        pagamento.status = 'pendente';
        await pagamento.save();
      }
    } catch (erro) {
      console.error('Erro ao reconciliar pagamento', String(pagamento._id), erro.message);
    }
  }
}

async function iniciarAlugueisPagos() {
  const pagamentos = await Pagamento.find({ status: 'confirmado' }).select('aluguel');
  if (!pagamentos.length) return;
  await Aluguel.updateMany(
    {
      _id: { $in: pagamentos.map((pagamento) => pagamento.aluguel) },
      status: 'aceito',
      dataInicio: { $lte: normalizarData(new Date()) }
    },
    { status: 'andamento' }
  );
}

async function aplicarReversoesPendentes() {
  const pagamentos = await Pagamento.find({ status: { $in: ['reembolsado', 'contestado'] } }).limit(50);
  for (const pagamento of pagamentos) {
    await aoReverterPagamento(pagamento);
  }
}

async function expirarPagamento(pagamento) {
  const sessao = await mongoose.startSession();
  let aluguelExpirado = null;
  try {
    await sessao.withTransaction(async () => {
      aluguelExpirado = null;
      const pagamentoAtual = await Pagamento.findOne({
        _id: pagamento._id,
        status: { $in: ['pendente', 'falhou'] }
      }).session(sessao);
      if (!pagamentoAtual) return;

      const aluguelAtual = await Aluguel.findOne({
        _id: pagamentoAtual.aluguel,
        status: 'aceito'
      }).session(sessao);
      if (!aluguelAtual) return;

      pagamentoAtual.status = 'atrasado';
      aluguelAtual.status = 'cancelado';
      await pagamentoAtual.save({ session: sessao });
      await aluguelAtual.save({ session: sessao });
      await OcupacaoDia.deleteMany({ aluguel: aluguelAtual._id }).session(sessao);
      aluguelExpirado = aluguelAtual;
    });
  } finally {
    await sessao.endSession();
  }

  if (aluguelExpirado) {
    await criarNotificacao({
      usuario: aluguelExpirado.locatario,
      tipo: 'pagamento',
      titulo: 'Prazo de pagamento encerrado',
      texto: 'O prazo para pagar este aluguel terminou e a reserva foi cancelada.',
      linkPainel: '/painellocatario',
      estadoNavegacao: { abrirAba: 'pagamentos', abaPagamentos: 'pendentes' }
    });
  }
}

async function expirarPagamentosVencidos() {
  const hoje = normalizarData(new Date());
  const pagamentos = await Pagamento.find({
    status: { $in: ['pendente', 'falhou'] },
    vencimento: { $lt: hoje }
  }).limit(50);

  for (const pagamento of pagamentos) {
    await expirarPagamento(pagamento);
  }
}

// Listar pagamentos de um locatário (usado em PainelLocatario)
app.get('/api/pagamentos/locatario/:locatarioId', autenticacao, async (req, res) => {
  try {
    if (req.params.locatarioId !== req.usuarioId) {
      return res.status(403).json({ erro: 'Você não tem permissão para ver estes pagamentos.' });
    }

    await Promise.all([iniciarAlugueisPagos(), expirarPagamentosVencidos()]);
    const pagamentos = await Pagamento.find({ locatario: req.params.locatarioId }).populate({
      path: 'aluguel',
      populate: { path: 'anuncio', select: 'titulo fotos' }
    });

    // Pagamentos sem resposta final são conferidos no Mercado Pago antes de listar.
    await Promise.allSettled(
      pagamentos
        .filter((pagamento) => pagamento.status === 'processando' && pagamento.mpOrderId)
        .map((pagamento) => reconciliarPagamento(pagamento))
    );

    res.status(200).json(pagamentos);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar pagamentos do locatário' });
  }
});

// O status do pagamento é atualizado exclusivamente pelo Mercado Pago/webhook.
app.patch('/api/pagamentos/:id/status', autenticacao, async (req, res) => {
  return res.status(405).json({ erro: 'O status é atualizado pelo Mercado Pago.' });
});

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

    const novaAvaliacao = new Avaliacao({
      aluguel,
      anuncio: aluguelEncontrado.anuncio,
      autor,
      avaliado,
      nota,
      comentario
    });
    await novaAvaliacao.save();

    await criarNotificacao({
      usuario: avaliado,
      tipo: 'avaliacao',
      titulo: 'Nova avaliação recebida',
      texto: `Você recebeu uma avaliação de ${nota} estrela${nota === 1 ? '' : 's'}.`,
      linkPainel: '/meu-perfil',
      estadoNavegacao: {}
    });

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

// Listar avaliações de um anúncio (produto) específico — usado na página do produto
// para não misturar com avaliações de outros anúncios do mesmo locador
app.get('/api/avaliacoes/anuncio/:anuncioId', async (req, res) => {
  try {
    const avaliacoes = await Avaliacao.find({ anuncio: req.params.anuncioId })
      .populate('autor', 'nome avatar')
      .sort({ createdAt: -1 });

    const media = avaliacoes.length ? avaliacoes.reduce((soma, a) => soma + a.nota, 0) / avaliacoes.length : 0;

    res.status(200).json({
      avaliacoes,
      media: Number(media.toFixed(1)),
      total: avaliacoes.length
    });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar avaliações do anúncio' });
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
// Buscar (ou criar, se ainda não existir) a conversa entre dois usuários.
// Usado ao clicar em "Mensagem ao Anfitrião" e ao abrir uma conversa a partir de uma notificação.
app.post('/api/conversas', autenticacao, async (req, res) => {
  try {
    const { usuarioA, usuarioB, anuncio } = req.body;

    if (!usuarioA || !usuarioB) {
      return res.status(400).json({ erro: 'usuarioA e usuarioB são obrigatórios.' });
    }

    if (usuarioA !== req.usuarioId) {
      return res.status(403).json({ erro: 'Você não tem permissão para iniciar esta conversa.' });
    }

    if (usuarioA === usuarioB) {
      return res.status(400).json({ erro: 'Não é possível iniciar uma conversa com você mesmo.' });
    }

    let conversa = await Conversa.findOne({
      participantes: { $all: [usuarioA, usuarioB], $size: 2 }
    })
      .populate('participantes', 'nome avatar')
      .populate('anuncio', 'titulo fotos');

    if (!conversa) {
      conversa = await Conversa.create({
        participantes: [usuarioA, usuarioB],
        anuncio: anuncio || null
      });
      await conversa.populate('participantes', 'nome avatar');
      await conversa.populate('anuncio', 'titulo fotos');
    }

    res.status(200).json(conversa);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar ou criar conversa', detalhes: erro.message });
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

    const destinatarioEhOutroParticipante = conversaExistente.participantes.some(
      (participante) =>
        participante.toString() === destinatario &&
        participante.toString() !== remetente
    );

    if (!destinatarioEhOutroParticipante) {
      return res.status(400).json({
        erro: 'O destinatário deve ser a outra pessoa da conversa.'
      });
    }

    const novaMensagem = new Mensagem({ conversa, remetente, destinatario, texto: texto.trim() });
    await novaMensagem.save();

    conversaExistente.ultimaMensagem = texto.trim();
    conversaExistente.ultimaMensagemEm = novaMensagem.createdAt;
    conversaExistente.ultimaMensagemAutor = remetente;
    await conversaExistente.save();

    const mensagemPopulada = await novaMensagem.populate('remetente', 'nome avatar');

    await criarNotificacao({
      usuario: destinatario,
      tipo: 'mensagem',
      titulo: `Nova mensagem de ${mensagemPopulada.remetente.nome}`,
      texto: texto.trim().slice(0, 80),
      linkPainel: null, // resolvido no front, de acordo com o objetivo do usuário logado
      estadoNavegacao: { abrirConversa: remetente }
    });

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

// --- Notificações ---

// Listar notificações de um usuário (mais recentes primeiro)
app.get('/api/notificacoes/:usuarioId', autenticacao, async (req, res) => {
  try {
    if (req.params.usuarioId !== req.usuarioId) {
      return res.status(403).json({ erro: 'Você não tem permissão para ver estas notificações.' });
    }

    const notificacoes = await Notificacao.find({ usuario: req.params.usuarioId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json(notificacoes);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar notificações' });
  }
});

// Contar notificações não lidas (usado no badge do sino)
app.get('/api/notificacoes/:usuarioId/contagem', autenticacao, async (req, res) => {
  try {
    if (req.params.usuarioId !== req.usuarioId) {
      return res.status(403).json({ erro: 'Você não tem permissão para ver estas notificações.' });
    }

    const total = await Notificacao.countDocuments({ usuario: req.params.usuarioId, lida: false });
    res.status(200).json({ total });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao contar notificações' });
  }
});

// Marcar uma notificação como lida
app.patch('/api/notificacoes/:id/lida', autenticacao, async (req, res) => {
  try {
    const notificacao = await Notificacao.findById(req.params.id);

    if (!notificacao) {
      return res.status(404).json({ erro: 'Notificação não encontrada.' });
    }

    if (notificacao.usuario.toString() !== req.usuarioId) {
      return res.status(403).json({ erro: 'Você não tem permissão para alterar esta notificação.' });
    }

    notificacao.lida = true;
    await notificacao.save();

    res.status(200).json({ mensagem: 'Notificação marcada como lida.', notificacao });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao marcar notificação como lida' });
  }
});

// Marcar todas as notificações de um usuário como lidas
app.patch('/api/notificacoes/:usuarioId/marcar-todas-lidas', autenticacao, async (req, res) => {
  try {
    if (req.params.usuarioId !== req.usuarioId) {
      return res.status(403).json({ erro: 'Você não tem permissão para alterar estas notificações.' });
    }

    await Notificacao.updateMany(
      { usuario: req.params.usuarioId, lida: false },
      { lida: true }
    );

    res.status(200).json({ mensagem: 'Todas as notificações foram marcadas como lidas.' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao marcar notificações como lidas' });
  }
});

// Excluir uma notificação
app.delete('/api/notificacoes/:id', autenticacao, async (req, res) => {
  try {
    const notificacao = await Notificacao.findById(req.params.id);

    if (!notificacao) {
      return res.status(404).json({ erro: 'Notificação não encontrada.' });
    }

    if (notificacao.usuario.toString() !== req.usuarioId) {
      return res.status(403).json({ erro: 'Você não tem permissão para excluir esta notificação.' });
    }

    await notificacao.deleteOne();

    res.status(200).json({ mensagem: 'Notificação excluída com sucesso.' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao excluir notificação' });
  }
});

app.post(
  '/api/usuarios/:id/verificacao',
  autenticacao,
  processarUploadVerificacao,
  async (req, res) => {
    const arquivosNovos = Object.values(req.files || {}).flat();
    try {
      if (req.usuarioId !== req.params.id) {
        await removerArquivos(arquivosNovos.map((arquivo) => arquivo.path));
        return res.status(403).json({ erro: 'Você não tem permissão.' });
      }

      const frente = req.files?.frente?.[0];
      const verso = req.files?.verso?.[0];
      const selfie = req.files?.selfie?.[0];
      const cpf = String(req.body.cpf || '').replace(/\D/g, '');

      if (!frente || !verso || !selfie || !cpfValido(cpf)) {
        await removerArquivos(arquivosNovos.map((arquivo) => arquivo.path));
        return res.status(400).json({ erro: 'Envie a frente, o verso, a selfie e um CPF válido.' });
      }

      const arquivosValidos = await Promise.all(arquivosNovos.map(arquivoImagemValido));
      if (arquivosValidos.some((valido) => !valido)) {
        await removerArquivos(arquivosNovos.map((arquivo) => arquivo.path));
        return res.status(400).json({ erro: 'Um ou mais arquivos não correspondem a uma imagem JPG, PNG ou WebP válida.' });
      }

      const usuarioAnterior = await Usuario.findById(req.params.id).select('verificacao');
      if (!usuarioAnterior) {
        await removerArquivos(arquivosNovos.map((arquivo) => arquivo.path));
        return res.status(404).json({ erro: 'Usuário não encontrado.' });
      }

      const usuario = await Usuario.findByIdAndUpdate(
        req.params.id,
        {
          cpf,
          verificacao: {
            status: 'pendente',
            documentoFrente: frente.filename,
            documentoVerso: verso.filename,
            selfie: selfie.filename,
            enviadoEm: new Date()
          }
        },
        { new: true }
      ).select('-senha');

      await removerArquivos(caminhosDocumentos(usuarioAnterior.verificacao, DIRETORIO_DOCUMENTOS))
        .catch((erro) => console.error('Não foi possível remover documentos KYC antigos:', erro));

      // Cada envio entra na fila de todos os administradores ativos. Assim a
      // central administrativa e o sino conseguem sinalizar a nova análise.
      const administradores = await Usuario.find({ papel: 'admin', ativo: { $ne: false } }).select('_id');
      await Promise.all(administradores.map((administrador) => criarNotificacao({
        usuario: administrador._id,
        tipo: 'verificacao',
        titulo: 'Novo documento para análise',
        texto: `${usuario.nome} enviou documentos de identidade para verificação.`,
        linkPainel: '/paineladmin',
        estadoNavegacao: { secao: 'verificacoes', aba: 'pendente', usuarioId: usuario._id.toString() }
      })));

      res.status(200).json({ mensagem: 'Documentos enviados com sucesso!', verificacao: usuario.verificacao });
    } catch (erro) {
      await removerArquivos(arquivosNovos.map((arquivo) => arquivo.path)).catch(() => {});
      res.status(500).json({ erro: 'Erro ao enviar documentos', detalhes: erro.message });
    }
  }
);

// Usuário consulta o status da própria verificação
app.get('/api/usuarios/:id/verificacao', autenticacao, async (req, res) => {
  try {
    if (req.usuarioId !== req.params.id) {
      return res.status(403).json({ erro: 'Você não tem permissão para ver esta verificação.' });
    }

    const usuario = await Usuario.findById(req.params.id).select('verificacao');
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    res.status(200).json(usuario.verificacao);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar verificação' });
  }
});

// --- Painel administrativo de verificação (somente admin) ---

// Lista enxuta para gestão e auditoria visual de quem possui acesso administrativo.
app.get('/api/admin/usuarios', autenticacao, autenticacaoAdmin, async (req, res) => {
  try {
    const administradores = await Usuario.find({ papel: 'admin' })
      .select('nome email avatar ativo createdAt updatedAt')
      .sort({ nome: 1 });
    res.status(200).json(administradores);
  } catch (erro) {
    console.error('Erro ao listar administradores:', erro);
    res.status(500).json({ erro: 'Erro ao carregar administradores.' });
  }
});

// Busca perfis elegíveis por nome ou e-mail para o seletor de promoção.
app.get('/api/admin/usuarios/busca', autenticacao, autenticacaoAdmin, async (req, res) => {
  try {
    const termo = String(req.query.q || '').trim();
    if (termo.length < 2) return res.status(200).json([]);

    const termoSeguro = termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const correspondencia = new RegExp(termoSeguro, 'i');
    const usuarios = await Usuario.find({
      papel: { $ne: 'admin' },
      ativo: { $ne: false },
      $or: [{ nome: correspondencia }, { email: correspondencia }]
    })
      .select('nome email avatar')
      .sort({ nome: 1 })
      .limit(8);

    res.status(200).json(usuarios);
  } catch (erro) {
    console.error('Erro ao buscar perfis para promoção:', erro);
    res.status(500).json({ erro: 'Erro ao buscar perfis.' });
  }
});

// Promove uma conta ativa a administrador. Apenas outro administrador pode executar esta ação.
app.patch('/api/admin/usuarios/promover', autenticacao, autenticacaoAdmin, async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ erro: 'Informe o e-mail da conta que será promovida.' });
    }

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(404).json({ erro: 'Nenhuma conta foi encontrada com este e-mail.' });
    }
    if (usuario.ativo === false) {
      return res.status(400).json({ erro: 'Não é possível promover uma conta desativada.' });
    }
    if (usuario.papel === 'admin') {
      return res.status(409).json({ erro: 'Esta conta já é administradora.' });
    }

    usuario.papel = 'admin';
    await usuario.save();

    res.status(200).json({
      mensagem: `${usuario.nome} agora possui acesso administrativo.`,
      usuario: { id: usuario._id, nome: usuario.nome, email: usuario.email, papel: usuario.papel }
    });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao promover administrador.' });
  }
});

// Lista usuários por status de verificação (padrão: pendentes)
app.get('/api/admin/verificacoes', autenticacao, autenticacaoAdmin, async (req, res) => {
  try {
    const status = req.query.status || 'pendente';

    const usuarios = await Usuario.find({ 'verificacao.status': status })
      .select('nome email telefone verificacao createdAt')
      .sort({ 'verificacao.enviadoEm': 1 });

    res.status(200).json(usuarios);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar verificações' });
  }
});

app.get('/api/admin/verificacoes/:usuarioId/documento/:campo', autenticacao, autenticacaoAdmin, async (req, res) => {
  try {
    const { usuarioId, campo } = req.params;

    if (!['documentoFrente', 'documentoVerso', 'selfie'].includes(campo)) {
      return res.status(400).json({ erro: 'Campo inválido.' });
    }

    const usuario = await Usuario.findById(usuarioId).select('verificacao');
    const filename = usuario?.verificacao?.[campo];

    if (!filename) {
      return res.status(404).json({ erro: 'Arquivo não encontrado.' });
    }

    const caminhoArquivo = path.join(__dirname, 'uploads/documentos', filename);

    res.sendFile(caminhoArquivo, (erro) => {
      if (erro && !res.headersSent) {
        res.status(404).json({ erro: 'Arquivo não encontrado no servidor.' });
      }
    });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar documento', detalhes: erro.message });
  }
});

// Aprova ou rejeita a verificação de um usuário
app.patch('/api/admin/verificacoes/:usuarioId', autenticacao, autenticacaoAdmin, async (req, res) => {
  try {
    const { acao, motivo } = req.body; // acao: 'aprovar' | 'rejeitar'

    if (!['aprovar', 'rejeitar'].includes(acao)) {
      return res.status(400).json({ erro: 'Ação inválida. Use "aprovar" ou "rejeitar".' });
    }

    const usuario = await Usuario.findById(req.params.usuarioId);
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    if (usuario.verificacao.status !== 'pendente') {
      return res.status(400).json({ erro: 'Esta verificação já foi analisada ou não foi enviada.' });
    }

    usuario.verificacao.status = acao === 'aprovar' ? 'aprovado' : 'rejeitado';
    usuario.verificacao.motivoRejeicao = acao === 'rejeitar' ? (motivo || '') : '';
    usuario.verificacao.revisadoEm = new Date();
    usuario.verificacao.revisadoPor = req.usuarioId;

    await usuario.save();

    await criarNotificacao({
      usuario: usuario._id,
      tipo: 'verificacao',
      titulo: acao === 'aprovar' ? 'Identidade verificada!' : 'Verificação de identidade recusada',
      texto: acao === 'aprovar'
        ? 'Sua identidade foi verificada. Agora você tem o selo de verificado no perfil.'
        : `Sua verificação não foi aprovada. Motivo: ${motivo || 'documentos ilegíveis ou inconsistentes.'}`,
      linkPainel: '/configuracoes',
      estadoNavegacao: {}
    });

    res.status(200).json({
      mensagem: acao === 'aprovar' ? 'Usuário verificado com sucesso.' : 'Verificação rejeitada.',
      verificacao: usuario.verificacao
    });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao atualizar verificação', detalhes: erro.message });
  }
});

// ==========================================
// CONFIGURAÇÃO DO BANCO E SERVIDOR
// ==========================================

const PORT = process.env.PORT || 3000;

if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  throw new Error('MONGO_URI e JWT_SECRET precisam estar configurados no ambiente.');
}

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
  });

  setInterval(() => {
    reconciliarPagamentosPendentes().catch((erro) => console.error('Erro na reconciliação de pagamentos:', erro));
    iniciarAlugueisPagos().catch((erro) => console.error('Erro ao iniciar aluguéis pagos:', erro));
    aplicarReversoesPendentes().catch((erro) => console.error('Erro ao aplicar reversões de pagamento:', erro));
    expirarPagamentosVencidos().catch((erro) => console.error('Erro ao expirar pagamentos:', erro));
  }, 5 * 60 * 1000);
  reconciliarPagamentosPendentes().catch((erro) => console.error('Erro na reconciliação de pagamentos:', erro));
  iniciarAlugueisPagos().catch((erro) => console.error('Erro ao iniciar aluguéis pagos:', erro));
  aplicarReversoesPendentes().catch((erro) => console.error('Erro ao aplicar reversões de pagamento:', erro));
  expirarPagamentosVencidos().catch((erro) => console.error('Erro ao expirar pagamentos:', erro));
});
