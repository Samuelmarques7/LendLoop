// backend/scripts/limparDadosTeste.js
//
// Limpa os dados de TESTE do banco. Substitui limparUsuarios.js e
// limparAnunciosOrfaos.js, que apagavam usuários sem apagar o que dependia deles.
//
// SEGURANÇA
//  - Por padrão roda em DRY-RUN: só mostra o que seria apagado, não apaga nada.
//  - Para apagar de verdade é preciso passar --executar E digitar o nome do banco.
//  - Nunca apaga usuários com papel 'admin' (a menos que passe --incluir-admins).
//
// USO (dentro de backend/)
//   node scripts/limparDadosTeste.js                       -> dry-run, tudo
//   node scripts/limparDadosTeste.js --somente-orfaos      -> dry-run, só órfãos
//   node scripts/limparDadosTeste.js --executar            -> apaga tudo (pede confirmação)
//   node scripts/limparDadosTeste.js --somente-orfaos --executar
//   node scripts/limparDadosTeste.js --executar --incluir-admins
//   node scripts/limparDadosTeste.js --executar --sem-cloudinary
//
// MODOS
//   (padrão)          apaga TODOS os dados de teste (usuários não-admin + tudo ligado a eles)
//   --somente-orfaos  não apaga usuários; só remove registros cujo dono/anúncio/aluguel
//                     já não existe (conserta anúncios "fantasma" na busca)

require('dotenv').config();
const readline = require('readline');
const mongoose = require('mongoose');

const Usuario = require('../models/Usuario');
const Anuncio = require('../models/Anuncio');
const Aluguel = require('../models/Aluguel');
const Pagamento = require('../models/Pagamento');
const Avaliacao = require('../models/Avaliacao');
const Conversa = require('../models/Conversa');
const Mensagem = require('../models/Mensagem');
const Notificacao = require('../models/Notificacao');
const OcupacaoDia = require('../models/OcupacaoDia');

const args = new Set(process.argv.slice(2));
const EXECUTAR = args.has('--executar');
const SOMENTE_ORFAOS = args.has('--somente-orfaos');
const INCLUIR_ADMINS = args.has('--incluir-admins');
const SEM_CLOUDINARY = args.has('--sem-cloudinary');

const desconhecidos = [...args].filter(
  (a) => !['--executar', '--somente-orfaos', '--incluir-admins', '--sem-cloudinary'].includes(a)
);
if (desconhecidos.length) {
  console.error(`Argumento(s) desconhecido(s): ${desconhecidos.join(', ')}`);
  process.exit(1);
}

function perguntar(texto) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(texto, (r) => { rl.close(); resolve(r.trim()); }));
}

// Extrai o public_id do Cloudinary a partir da URL da imagem.
// Ex.: https://res.cloudinary.com/x/image/upload/v123/lendloop/abc.jpg -> lendloop/abc
function publicIdCloudinary(url) {
  if (typeof url !== 'string' || !url.includes('res.cloudinary.com')) return null;
  const m = url.match(/\/upload\/(?:[^/]+\/)*?(?:v\d+\/)?(lendloop\/[^.?#]+)/);
  return m ? m[1] : null;
}

// Ids que estão em `campo` (de `Modelo`) mas não existem mais em `Alvo`.
async function idsQueNaoExistem(Modelo, campo, Alvo) {
  const usados = await Modelo.distinct(campo);
  if (!usados.length) return [];
  const existentes = new Set((await Alvo.find({ _id: { $in: usados } }).select('_id').lean()).map((d) => String(d._id)));
  return usados.filter((id) => id && !existentes.has(String(id)));
}

async function main() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI não configurado no .env');
  await mongoose.connect(process.env.MONGO_URI);
  const nomeBanco = mongoose.connection.name;

  console.log('='.repeat(64));
  console.log(` Banco:  ${nomeBanco}`);
  console.log(` Modo:   ${SOMENTE_ORFAOS ? 'somente órfãos' : 'limpeza total de dados de teste'}`);
  console.log(` Ação:   ${EXECUTAR ? 'EXECUTAR (vai apagar de verdade)' : 'DRY-RUN (nada será apagado)'}`);
  console.log('='.repeat(64));

  // ---------- 1. Descobrir o que será apagado ----------
  let idsUsuarios = [];
  if (!SOMENTE_ORFAOS) {
    const filtroUsuarios = INCLUIR_ADMINS ? {} : { papel: { $ne: 'admin' } };
    idsUsuarios = (await Usuario.find(filtroUsuarios).select('_id').lean()).map((u) => u._id);
  }

  // Anúncios: os dos usuários apagados + os que já estavam órfãos (dono inexistente).
  const orfaosAnuncioDono = await idsQueNaoExistem(Anuncio, 'locador', Usuario);
  const idsDonosParaApagar = [...idsUsuarios, ...orfaosAnuncioDono];
  const anuncios = idsDonosParaApagar.length
    ? await Anuncio.find({ locador: { $in: idsDonosParaApagar } }).select('_id fotos').lean()
    : [];
  const idsAnuncios = anuncios.map((a) => a._id);

  // Aluguéis ligados a usuários/anúncios apagados, ou já órfãos.
  const orfaosAluguelAnuncio = await idsQueNaoExistem(Aluguel, 'anuncio', Anuncio);
  const filtroAlugueis = {
    $or: [
      { locatario: { $in: idsUsuarios } },
      { locador: { $in: idsUsuarios } },
      { anuncio: { $in: [...idsAnuncios, ...orfaosAluguelAnuncio] } },
    ],
  };
  const alugueis = await Aluguel.find(filtroAlugueis).select('_id vistoriaRetirada vistoriaDevolucao').lean();
  const idsAlugueis = alugueis.map((a) => a._id);

  const todosAnuncios = [...idsAnuncios, ...orfaosAluguelAnuncio];

  const filtros = {
    Pagamento: { $or: [{ aluguel: { $in: idsAlugueis } }, { locatario: { $in: idsUsuarios } }] },
    Avaliacao: {
      $or: [
        { aluguel: { $in: idsAlugueis } },
        { anuncio: { $in: todosAnuncios } },
        { autor: { $in: idsUsuarios } },
        { avaliado: { $in: idsUsuarios } },
      ],
    },
    OcupacaoDia: { $or: [{ anuncio: { $in: todosAnuncios } }, { aluguel: { $in: idsAlugueis } }] },
    Mensagem: { $or: [{ remetente: { $in: idsUsuarios } }, { destinatario: { $in: idsUsuarios } }] },
    Conversa: { participantes: { $in: idsUsuarios } },
    Notificacao: { usuario: { $in: idsUsuarios } },
  };

  // Órfãos de tabelas "filhas" que sobraram de execuções antigas.
  const orfaosOcupacaoAluguel = await idsQueNaoExistem(OcupacaoDia, 'aluguel', Aluguel);
  const orfaosOcupacaoAnuncio = await idsQueNaoExistem(OcupacaoDia, 'anuncio', Anuncio);
  const orfaosPagamento = await idsQueNaoExistem(Pagamento, 'aluguel', Aluguel);
  const orfaosAvaliacao = await idsQueNaoExistem(Avaliacao, 'aluguel', Aluguel);
  const orfaosMensagem = await idsQueNaoExistem(Mensagem, 'conversa', Conversa);
  const idsConversasParaApagar = (await Conversa.find(filtros.Conversa).select('_id').lean()).map((c) => c._id);

  const filtroOcupacaoFinal = {
    $or: [
      filtros.OcupacaoDia,
      { aluguel: { $in: orfaosOcupacaoAluguel } },
      { anuncio: { $in: orfaosOcupacaoAnuncio } },
    ],
  };
  const filtroPagamentoFinal = { $or: [filtros.Pagamento, { aluguel: { $in: orfaosPagamento } }] };
  const filtroAvaliacaoFinal = { $or: [filtros.Avaliacao, { aluguel: { $in: orfaosAvaliacao } }] };
  const filtroMensagemFinal = {
    $or: [filtros.Mensagem, { conversa: { $in: [...idsConversasParaApagar, ...orfaosMensagem] } }],
  };

  // Fotos no Cloudinary que ficariam sem dono.
  const publicIds = new Set();
  for (const a of anuncios) (a.fotos || []).forEach((f) => { const id = publicIdCloudinary(f); if (id) publicIds.add(id); });
  for (const al of alugueis) {
    [...(al.vistoriaRetirada?.fotos || []), ...(al.vistoriaDevolucao?.fotos || [])]
      .forEach((f) => { const id = publicIdCloudinary(f); if (id) publicIds.add(id); });
  }

  // ---------- 2. Contagens (o "plano") ----------
  const plano = [
    ['Usuario', idsUsuarios.length],
    ['Anuncio', idsAnuncios.length],
    ['Aluguel', idsAlugueis.length],
    ['Pagamento', await Pagamento.countDocuments(filtroPagamentoFinal)],
    ['Avaliacao', await Avaliacao.countDocuments(filtroAvaliacaoFinal)],
    ['OcupacaoDia', await OcupacaoDia.countDocuments(filtroOcupacaoFinal)],
    ['Conversa', idsConversasParaApagar.length],
    ['Mensagem', await Mensagem.countDocuments(filtroMensagemFinal)],
    ['Notificacao', await Notificacao.countDocuments(filtros.Notificacao)],
  ];

  console.log('\nO que será apagado:');
  for (const [nome, qtd] of plano) console.log(`  ${nome.padEnd(12)} ${String(qtd).padStart(6)}`);
  console.log(`  ${'Cloudinary'.padEnd(12)} ${String(publicIds.size).padStart(6)} imagem(ns)${SEM_CLOUDINARY ? '  [ignorado: --sem-cloudinary]' : ''}`);

  if (!SOMENTE_ORFAOS && !INCLUIR_ADMINS) {
    const admins = await Usuario.countDocuments({ papel: 'admin' });
    console.log(`\n  ${admins} conta(s) admin serão PRESERVADAS (use --incluir-admins para apagá-las).`);
  }
  console.log('  Arquivos em uploads/documentos (KYC) NÃO são tocados por este script.');

  const totalRegistros = plano.reduce((s, [, q]) => s + q, 0);
  if (totalRegistros === 0 && publicIds.size === 0) {
    console.log('\nNada para limpar. Banco já está limpo.');
    return;
  }

  if (!EXECUTAR) {
    console.log('\n[DRY-RUN] Nada foi apagado. Para apagar de verdade, rode de novo com --executar.');
    return;
  }

  // ---------- 3. Confirmação ----------
  console.log(`\nATENÇÃO: isto é IRREVERSÍVEL e roda no banco "${nomeBanco}".`);
  const resposta = await perguntar(`Digite o nome do banco (${nomeBanco}) para confirmar: `);
  if (resposta !== nomeBanco) {
    console.log('Confirmação incorreta. Nada foi apagado.');
    return;
  }

  // ---------- 4. Apagar (filhos primeiro, usuários por último) ----------
  console.log('\nApagando...');
  const r = {};
  r.OcupacaoDia = await OcupacaoDia.deleteMany(filtroOcupacaoFinal);
  r.Mensagem = await Mensagem.deleteMany(filtroMensagemFinal);
  r.Conversa = await Conversa.deleteMany({ _id: { $in: idsConversasParaApagar } });
  r.Notificacao = await Notificacao.deleteMany(filtros.Notificacao);
  r.Avaliacao = await Avaliacao.deleteMany(filtroAvaliacaoFinal);
  r.Pagamento = await Pagamento.deleteMany(filtroPagamentoFinal);
  r.Aluguel = await Aluguel.deleteMany({ _id: { $in: idsAlugueis } });
  r.Anuncio = await Anuncio.deleteMany({ _id: { $in: idsAnuncios } });
  // Conversas de quem sobrou que apontavam para anúncios apagados.
  await Conversa.updateMany({ anuncio: { $in: todosAnuncios } }, { $set: { anuncio: null } });
  if (!SOMENTE_ORFAOS) r.Usuario = await Usuario.deleteMany({ _id: { $in: idsUsuarios } });

  for (const [nome, res] of Object.entries(r)) {
    console.log(`  ${nome.padEnd(12)} ${String(res.deletedCount).padStart(6)} apagado(s)`);
  }

  // ---------- 5. Cloudinary (falha aqui não desfaz o banco) ----------
  if (!SEM_CLOUDINARY && publicIds.size) {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      console.log('\nCloudinary não configurado: imagens NÃO foram apagadas.');
    } else {
      const cloudinary = require('../config/cloudinary');
      const lista = [...publicIds];
      let ok = 0;
      let falhas = 0;
      for (let i = 0; i < lista.length; i += 100) {
        try {
          const resp = await cloudinary.api.delete_resources(lista.slice(i, i + 100));
          Object.values(resp.deleted || {}).forEach((v) => (v === 'deleted' ? ok++ : null));
        } catch (erro) {
          falhas += lista.slice(i, i + 100).length;
          console.error('  Erro no Cloudinary:', erro.message || erro);
        }
      }
      console.log(`  Cloudinary   ${String(ok).padStart(6)} imagem(ns) apagada(s)${falhas ? `, ${falhas} com erro` : ''}`);
    }
  }

  console.log('\nLimpeza concluída.');
}

main()
  .catch((erro) => {
    console.error('Erro:', erro);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());