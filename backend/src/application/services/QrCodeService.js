const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../../infrastructure/config/config');

async function generate(value) {
  const destDir = config.photosBaseDir.replace('photos', 'qrcodes');
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const filename = `qr_${uuidv4()}.png`;
  const fullPath = path.join(destDir, filename);
  await QRCode.toFile(fullPath, value, { width: 200 });
  return path.join('qrcodes', filename);
}

module.exports = { generate };
