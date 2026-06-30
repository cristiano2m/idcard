const { listHistory } = require('../../application/use-cases/history/ListHistory');

async function list(req, res, next) {
  try {
    const { page = 1, pageSize = 50, userId, fechaDesde, fechaHasta, accion } = req.query;
    const result = await listHistory(
      { userId: userId ? +userId : undefined, fechaDesde, fechaHasta, accion },
      { page: +page, pageSize: +pageSize }
    );
    res.json(result);
  } catch (err) { next(err); }
}

module.exports = { list };
