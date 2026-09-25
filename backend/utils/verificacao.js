const fs = require('fs/promises');
const path = require('path');

const TIPOS_IMAGEM_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp']);

function cpfValido(valor) {
  const cpf = String(valor || '').replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const calcularDigito = (quantidade) => {
    let soma = 0;
    for (let indice = 0; indice < quantidade; indice += 1) {
      soma += Number(cpf[indice]) * (quantidade + 1 - indice);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return calcularDigito(9) === Number(cpf[9]) && calcularDigito(10) === Number(cpf[10]);
}

function assinaturaImagemValida(buffer, mimetype) {
  if (!TIPOS_IMAGEM_PERMITIDOS.has(mimetype) || !buffer || buffer.length < 12) return false;

  if (mimetype === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimetype === 'image/png') {
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  return buffer.subarray(0, 4).toString('ascii') === 'RIFF'
    && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
}

async function arquivoImagemValido(arquivo) {
  if (!arquivo?.path || !TIPOS_IMAGEM_PERMITIDOS.has(arquivo.mimetype)) return false;
  const handle = await fs.open(arquivo.path, 'r');
  try {
    const buffer = Buffer.alloc(12);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    return assinaturaImagemValida(buffer.subarray(0, bytesRead), arquivo.mimetype);
  } finally {
    await handle.close();
  }
}

async function removerArquivos(caminhos) {
  await Promise.all((caminhos || []).filter(Boolean).map(async (caminho) => {
    try {
      await fs.unlink(caminho);
    } catch (erro) {
      if (erro.code !== 'ENOENT') throw erro;
    }
  }));
}

function caminhosDocumentos(verificacao, diretorio) {
  return ['documentoFrente', 'documentoVerso', 'selfie']
    .map((campo) => verificacao?.[campo])
    .filter(Boolean)
    .map((nome) => path.join(diretorio, path.basename(nome)));
}

module.exports = {
  TIPOS_IMAGEM_PERMITIDOS,
  arquivoImagemValido,
  assinaturaImagemValida,
  caminhosDocumentos,
  cpfValido,
  removerArquivos,
};
