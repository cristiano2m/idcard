const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../../infrastructure/config/config');

function getRelativePath(filename) {
  return path.join('photos', filename);
}

function getAbsolutePath(relativePath) {
  return path.join(config.photosBaseDir, '..', relativePath);
}

function saveFromUploadedFile(file) {
  const filename = path.basename(file.path);
  return getRelativePath(filename);
}

async function saveFromBase64(dataUrl) {
  const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) throw new Error('Formato de imagen base64 inválido');
  const [, mime, data] = match;
  const ext = mime.split('/')[1] || 'jpg';
  const filename = `${uuidv4()}.${ext}`;
  const dest = config.photosBaseDir;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  fs.writeFileSync(path.join(dest, filename), Buffer.from(data, 'base64'));
  return getRelativePath(filename);
}

function remove(relativePath) {
  try {
    const full = getAbsolutePath(relativePath);
    if (fs.existsSync(full)) fs.unlinkSync(full);
  } catch {}
}

module.exports = { saveFromUploadedFile, saveFromBase64, getAbsolutePath };
