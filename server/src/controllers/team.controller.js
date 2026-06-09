const db     = require('../config/db');
const { ok, created, badReq, serverErr } = require('../utils/helpers');

exports.getAll = async (req, res) => {
  const where = req.user?.role === 'admin' ? '' : 'WHERE is_active = 1';
  try {
    const [rows] = await db.query(`SELECT * FROM team_members ${where} ORDER BY sort_order ASC`);
    return ok(res, rows);
  } catch (err) { return serverErr(res); }
};

exports.create = async (req, res) => {
  const { name, role, bio, photo, social_links } = req.body;
  if (!name) return badReq(res, 'Name required');
  try {
    const [result] = await db.query(
      'INSERT INTO team_members (name, role, bio, photo, social_links) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), role || null, bio || null, photo || null, JSON.stringify(social_links || {})]);
    return created(res, { id: result.insertId });
  } catch (err) { return serverErr(res); }
};

exports.update = async (req, res) => {
  const allowed = ['name','role','bio','photo','is_active','sort_order'];
  const updates = []; const vals = [];
  for (const k of allowed) {
    if (k in req.body) { updates.push(`${k} = ?`); vals.push(req.body[k]); }
  }
  if (req.body.social_links) { updates.push('social_links = ?'); vals.push(JSON.stringify(req.body.social_links)); }
  if (!updates.length) return badReq(res, 'Nothing to update');
  vals.push(req.params.id);
  try {
    await db.query(`UPDATE team_members SET ${updates.join(', ')} WHERE id = ?`, vals);
    return ok(res, { message: 'Team member updated' });
  } catch (err) { return serverErr(res); }
};

exports.remove = async (req, res) => {
  try {
    await db.query('DELETE FROM team_members WHERE id = ?', [req.params.id]);
    return ok(res, { message: 'Deleted' });
  } catch (err) { return serverErr(res); }
};
