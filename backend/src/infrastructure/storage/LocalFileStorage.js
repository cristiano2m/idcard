const path = require('path');
const fs = require('fs');

function save(buffer, destDir, filename) {
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const fullPath = path.join(destDir, filename);
  fs.writeFileSync(fullPath, buffer);
  return fullPath;
}

function remove(absolutePath) {
  try { if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath); } catch {}
}

module.exports = { save, remove };
