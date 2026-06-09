const db     = require('../config/db');
const { ok, serverErr, paginate } = require('../utils/helpers');

exports.getAll = async (req, res) => {
  const { page, perPage, offset, limit } = paginate(req.query);
  const { route } = req.query;
  const cond = route ? 'WHERE route LIKE ?' : '';
  const vals = route ? [`%${route}%`, limit, offset] : [limit, offset];
  try {
    const [rows] = await db.query(
      `SELECT id, route, message, user_id, created_at FROM error_logs ${cond} ORDER BY created_at DESC LIMIT ? OFFSET ?`, vals);
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM error_logs ${cond}`, route ? [`%${route}%`] : []);
    return ok(res, rows, { pagination: { page, perPage, total } });
  } catch (err) { return serverErr(res); }
};

exports.getOne = async (req, res) => {
  try {
    const [[log]] = await db.query('SELECT * FROM error_logs WHERE id = ?', [req.params.id]);
    return ok(res, log || null);
  } catch (err) { return serverErr(res); }
};

exports.create = async (req, res) => ok(res, {});
exports.update = async (req, res) => ok(res, {});
exports.remove = async (req, res) => {
  try {
    await db.query('DELETE FROM error_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)');
    return ok(res, { message: 'Old logs purged' });
  } catch (err) { return serverErr(res); }
};
