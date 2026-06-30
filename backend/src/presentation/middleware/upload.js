const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../../infrastructure/config/config');
const fs = require('fs');

function makeStorage(destDir) {
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  return multer.diskStorage({
    destination: destDir,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${uuidv4()}${ext}`);
    },
  });
}

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

function fileFilter(req, file, cb) {
  cb(null, ALLOWED_MIMES.includes(file.mimetype));
}

const photoUpload = multer({
  storage: makeStorage(config.photosBaseDir),
  fileFilter,
  limits: { fileSize: config.uploadMaxSizeBytes },
});

const signatureUpload = multer({
  storage: makeStorage(config.signaturesBaseDir),
  fileFilter,
  limits: { fileSize: config.uploadMaxSizeBytes },
});

module.exports = { photoUpload, signatureUpload };
