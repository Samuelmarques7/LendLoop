const multer = require('multer');
const path = require('path');
const fs = require('fs');

const dir = path.resolve(__dirname, '../uploads/documentos');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extensoes = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
    cb(null, file.fieldname + '-' + uniqueSuffix + extensoes[file.mimetype]);
  }
});

const fileFilter = (req, file, cb) => {
  if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Envie imagens JPG, PNG ou WebP.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = upload;
module.exports.diretorio = dir;
