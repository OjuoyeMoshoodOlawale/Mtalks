const db = require('../config/db');
const { ok, badReq, serverErr } = require('../utils/helpers');

/* Drive image direct-display URL (no API key needed) */
const driveImg = (id, w = 1000) => `https://lh3.googleusercontent.com/d/${id}=w${w}`;

/* GET /api/gallery — public (published only) or admin (all) */
exports.getAll = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const [rows] = await db.query(
      `SELECT * FROM gallery_images ${isAdmin ? '' : 'WHERE is_published = 1'}
       ORDER BY sort_order ASC, created_at DESC`);
    const data = rows.map(r => ({
      ...r,
      url:   driveImg(r.drive_file_id, 1200),
      thumb: driveImg(r.drive_file_id, 480),
    }));
    return ok(res, data);
  } catch (err) { return serverErr(res, err, 'Server error'); }
};

/* POST /api/gallery — admin. Accepts single ID or comma/newline separated bulk paste */
exports.create = async (req, res) => {
  let { title, drive_file_id, category } = req.body;
  if (!drive_file_id) return badReq(res, 'drive_file_id is required');

  // Bulk: split on commas/newlines, extract IDs from full URLs too
  const ids = String(drive_file_id)
    .split(/[\n,]+/)
    .map(s => {
      const m = s.match(/\/d\/([a-zA-Z0-9_-]{20,})/) || s.match(/[?&]id=([a-zA-Z0-9_-]{20,})/);
      return (m ? m[1] : s.trim()).replace(/[^a-zA-Z0-9_-]/g, '');
    })
    .filter(s => s.length >= 20);

  if (!ids.length) return badReq(res, 'No valid Drive file IDs found');

  try {
    for (const id of ids) {
      await db.query(
        'INSERT INTO gallery_images (title, drive_file_id, category) VALUES (?, ?, ?)',
        [ids.length === 1 ? (title || null) : (title || null), id, category || 'General']);
    }
    return ok(res, { message: `${ids.length} image${ids.length > 1 ? 's' : ''} added` });
  } catch (err) { return serverErr(res, err, 'Server error'); }
};

/* PUT /api/gallery/:id — admin */
exports.update = async (req, res) => {
  const { title, category, sort_order, is_published } = req.body;
  try {
    await db.query(
      'UPDATE gallery_images SET title = ?, category = ?, sort_order = ?, is_published = ? WHERE id = ?',
      [title || null, category || 'General', sort_order || 0, is_published ? 1 : 0, req.params.id]);
    return ok(res, { message: 'Image updated' });
  } catch (err) { return serverErr(res, err, 'Server error'); }
};

/* DELETE /api/gallery/:id — admin */
exports.remove = async (req, res) => {
  try {
    await db.query('DELETE FROM gallery_images WHERE id = ?', [req.params.id]);
    return ok(res, { message: 'Image removed' });
  } catch (err) { return serverErr(res, err, 'Server error'); }
};
