function notFoundHandler(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `Ruta ${req.method} ${req.path} no existe` } });
}

module.exports = notFoundHandler;
