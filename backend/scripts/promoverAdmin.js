require('dotenv').config();
const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');

async function promover() {
  const emailAlvo = process.argv[2];

  if (!emailAlvo) {
    console.log('Uso: node promoverAdmin.js <email-do-usuario>');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    const usuario = await Usuario.findOneAndUpdate(
      { email: emailAlvo },
      { papel: 'admin' },
      { new: true }
    );

    if (usuario) {
      console.log(`✅ Sucesso: O usuário ${usuario.nome} (${usuario.email}) agora é um Administrador.`);
    } else {
      console.log(`❌ Erro: Usuário com e-mail ${emailAlvo} não encontrado.`);
    }
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    mongoose.disconnect();
  }
}

promover();