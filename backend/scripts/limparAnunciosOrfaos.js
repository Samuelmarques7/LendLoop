// backend/scripts/limparAnunciosOrfaos.js
require('dotenv').config();
const mongoose = require('mongoose');
const Anuncio = require('../models/Anuncio');
const Usuario = require('../models/Usuario');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const anuncios = await Anuncio.find();
  let apagados = 0;

  for (const anuncio of anuncios) {
    const donoExiste = await Usuario.exists({ _id: anuncio.locador });
    if (!donoExiste) {
      await Anuncio.deleteOne({ _id: anuncio._id });
      apagados++;
    }
  }

  console.log(`${apagados} anúncio(s) órfão(s) apagado(s).`);
  await mongoose.disconnect();
}).catch((erro) => {
  console.error('Erro:', erro);
  process.exit(1);
});