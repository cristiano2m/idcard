const { getDashboardStats } = require('../../application/use-cases/dashboard/GetDashboardStats');

async function stats(req, res, next) {
  try {
    const data = await getDashboardStats();
    res.json(data);
  } catch (err) { next(err); }
}

module.exports = { stats };
