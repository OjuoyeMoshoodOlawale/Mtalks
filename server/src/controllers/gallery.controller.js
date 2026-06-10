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
    (folder_url.length >= 20 && !folder_url.includes('/') ? [null, folder_url.trim()] : null);

  if (!folderIdMatch) return badReq(res, 'Could not extract a folder ID from the URL you pasted');
  const folderId = folderIdMatch[1];

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey || apiKey.includes('your_google')) {
    return badReq(res, 'GOOGLE_API_KEY is not configured in server/.env — see .env.example for setup instructions');
  }

  try {
    /* List all image files in the folder via Drive API v3 */
    const fetch = require('node-fetch');
    let allFiles = [], pageToken = null;

    do {
      const params = new URLSearchParams({
        q:        `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
        fields:   'nextPageToken, files(id, name, mimeType)',
        pageSize: '100',
        orderBy:  'name',
        key:      apiKey,
        ...(pageToken ? { pageToken } : {})
      });

      const driveRes = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`);
      const driveData = await driveRes.json();

      if (driveData.error) {
        const code = driveData.error.code;
        const msg  = driveData.error.message;
        if (code === 403) return badReq(res, `Drive API access denied: ${msg}. Make sure the folder is shared as "Anyone with the link".`);
        if (code === 400) return badReq(res, `Drive API error: ${msg}. Check your GOOGLE_API_KEY.`);
        return badReq(res, `Drive API error: ${msg}`);
      }

      allFiles = allFiles.concat(driveData.files || []);
      pageToken = driveData.nextPageToken || null;
    } while (pageToken);

    if (!allFiles.length) {
      return badReq(res, 'No images found in that folder. Make sure the folder contains image files and is shared as "Anyone with the link".');
    }

    /* Insert all images into gallery_images */
    let imported = 0;
    for (const [i, file] of allFiles.entries()) {
      const computedTitle = title_prefix
        ? `${title_prefix} ${i + 1}`
        : (file.name.replace(/\.[^.]+$/, '') || null);  // strip extension
      try {
        await db.query(
          'INSERT IGNORE INTO gallery_images (title, drive_file_id, category, sort_order) VALUES (?, ?, ?, ?)',
          [computedTitle, file.id, category || 'General', i]
        );
        imported++;
      } catch { /* skip duplicate IDs */ }
    }

    return ok(res, {
      message:  `${imported} image${imported !== 1 ? 's' : ''} imported from folder`,
      total_in_folder: allFiles.length,
      imported,
    });
  } catch (err) {
    return serverErr(res, err, 'Folder import failed');
  }
};
