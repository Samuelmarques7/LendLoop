const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const {
  assinaturaImagemValida,
  caminhosDocumentos,
  cpfValido,
  removerArquivos,
} = require('../utils/verificacao');

test('valida os dígitos verificadores do CPF', () => {
  assert.equal(cpfValido('529.982.247-25'), true);
  assert.equal(cpfValido('529.982.247-24'), false);
  assert.equal(cpfValido('111.111.111-11'), false);
  assert.equal(cpfValido('123'), false);
});

test('confere a assinatura real da imagem e não apenas o MIME type', () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const falso = Buffer.from('isto nao e uma imagem');

  assert.equal(assinaturaImagemValida(png, 'image/png'), true);
  assert.equal(assinaturaImagemValida(falso, 'image/png'), false);
  assert.equal(assinaturaImagemValida(png, 'text/plain'), false);
});

test('remove uploads temporários e ignora arquivos que já não existem', async () => {
  const diretorio = await fs.mkdtemp(path.join(os.tmpdir(), 'lendloop-kyc-'));
  const arquivo = path.join(diretorio, 'documento.png');
  await fs.writeFile(arquivo, 'temporario');

  await removerArquivos([arquivo, path.join(diretorio, 'inexistente.png')]);
  await assert.rejects(fs.access(arquivo));
  await fs.rm(diretorio, { recursive: true, force: true });
});

test('monta caminhos seguros usando somente o nome do arquivo', () => {
  const caminhos = caminhosDocumentos({ documentoFrente: '../segredo.png', selfie: 'selfie.jpg' }, '/uploads');
  assert.deepEqual(caminhos, [path.join('/uploads', 'segredo.png'), path.join('/uploads', 'selfie.jpg')]);
});
