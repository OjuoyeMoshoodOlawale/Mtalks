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

/* ─────────────────────────────────────────────────────────────────────────────
 * POST /api/gallery/import-folder
 * Import all images from a shared Google Drive folder in one click.
 * Requires GOOGLE_API_KEY in server/.env and the folder shared as "Anyone with link".
 * ───────────────────────────────────────────────────────────────────────────── */
exports.importFolder = async (req, res) => {
  const { folder_url, category, title_prefix } = req.body;
  if (!folder_url) return badReq(res, 'folder_url is required');

  /* Extract folder ID from any Drive folder URL format */
  const folderIdMatch =
    folder_url.match(/\/folders\/([a-zA-Z0-9_-]{20,})/) ||
    folder_url.match(/id=([a-zA-Z0-9_-]{20,})/) ||
    (/^[a-zA-Z0-9_-]{20,}$/.test(folder_url.trim()) ? [null, folder_url.trim()] : null);

  if (!folderIdMatch) return badReq(res, 'Could not find a folder ID in that URL. Paste the full Drive folder share link.');
  const folderId = folderIdMatch[1];

  try {
    const fetch = require('node-fetch');

    /* Use Drive embed folder view — works for any publicly shared folder without API key.
     * Google serves this lightweight HTML page that lists folder contents. */
    const embedUrl = `https://drive.google.com/drive/folders/${folderId}?usp=sharing`;
    const response = await fetch(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    if (!response.ok) {
      return badReq(res, `Could not access that Drive folder (HTTP ${response.status}). Make sure the folder is shared as "Anyone with the link".`);
    }

    const html = await response.text();

    /* Extract file IDs embedded in the page HTML.
     * Drive embeds file data as JSON-like structures containing "id" fields. */
    const seen  = new Set();
    const files = [];

    /* Pattern 1: "id":"FILEID" in JSON data blobs */
    const p1 = [...html.matchAll(/"id":"([a-zA-Z0-9_-]{25,}(?<!_)(?<!-)(?<!\.))"/g)];
    for (const m of p1) {
      const id = m[1];
      if (!seen.has(id) && id !== folderId) { seen.add(id); files.push({ id, name: '' }); }
    }

    /* Pattern 2: /file/d/FILEID/ in href/src attributes */
    const p2 = [...html.matchAll(/\/file\/d\/([a-zA-Z0-9_-]{20,})\//g)];
    for (const m of p2) {
      const id = m[1];
      if (!seen.has(id) && id !== folderId) { seen.add(id); files.push({ id, name: '' }); }
    }

    /* Pattern 3: data-id="FILEID" attributes */
    const p3 = [...html.matchAll(/data-id="([a-zA-Z0-9_-]{20,})"/g)];
    for (const m of p3) {
      const id = m[1];
      if (!seen.has(id) && id !== folderId) { seen.add(id); files.push({ id, name: '' }); }
    }

    if (!files.length) {
      return badReq(res,
        'No image files found in that folder. ' +
        'Please ensure: (1) The folder is shared as "Anyone with the link", ' +
        '(2) The folder contains image files, (3) You are using the correct folder link.'
      );
    }

    /* Insert all extracted IDs as gallery images */
    let imported = 0;
    for (const [i, file] of files.entries()) {
      const title = title_prefix ? `${title_prefix} ${i + 1}` : null;
      try {
        await db.query(
          'INSERT IGNORE INTO gallery_images (title, drive_file_id, category, sort_order) VALUES (?, ?, ?, ?)',
          [title, file.id, category || 'General', i]
        );
        imported++;
      } catch { /* skip duplicate IDs silently */ }
    }

    return ok(res, {
      message:         `${imported} image${imported !== 1 ? 's' : ''} imported from folder`,
      imported,
      detected:        files.length,
    });
  } catch (err) {
    return serverErr(res, err, 'Folder import failed');
  }
};