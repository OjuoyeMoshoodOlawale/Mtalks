const db      = require('../config/db');
const slugify = require('../utils/slugify');
const { ok, created, notFound, badReq, serverErr, paginate } = require('../utils/helpers');
const { generateTicketCode } = require('../services/ticket.service');
const { sendEventTicketEmail, sendPaymentReceiptEmail } = require('../services/email.service');
const logger  = require('../utils/logger');

exports.getAll = async (req, res) => {
  const { page, perPage, offset, limit } = paginate(req.query);
  const where = req.user?.role === 'admin' ? '' : 'WHERE e.is_published = 1';
  try {
    const [events] = await db.query(
      `SELECT e.*, GROUP_CONCAT(
         JSON_OBJECT('id',ep.id,'name',ep.name,'price',ep.price,
           'early_bird_price',ep.early_bird_price,'early_bird_deadline',ep.early_bird_deadline,
           'capacity',ep.capacity)
       ) AS packages_raw
       FROM events e
       LEFT JOIN event_packages ep ON ep.event_id = e.id
       ${where}
       GROUP BY e.id ORDER BY e.event_date ASC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const parsed = events.map(ev => {
      const out = {
        ...ev,
        packages: ev.packages_raw ? JSON.parse(`[${ev.packages_raw}]`) : []
      };
      delete out.packages_raw;
      return out;
    });

    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM events e ${where}`);
    return ok(res, parsed, { pagination: { page, perPage, total } });
  } catch (err) {
    logger.error('events.getAll', { error: err.message });
    return serverErr(res);
  }
};

exports.getById = async (req, res) => {
  try {
    const [[event]] = await db.query('SELECT * FROM events WHERE id = ?', [req.params.id]);
    if (!event) return notFound(res, 'Event not found');
    const [packages] = await db.query('SELECT * FROM event_packages WHERE event_id = ?', [event.id]);
    event.packages = packages;
    return ok(res, event);
  } catch (err) { return serverErr(res); }
};

exports.getOne = async (req, res) => {
  try {
    const [[event]] = await db.query('SELECT * FROM events WHERE slug = ?', [req.params.slug]);
    if (!event) return notFound(res, 'Event not found');

    const [packages] = await db.query('SELECT * FROM event_packages WHERE event_id = ?', [event.id]);
    event.packages = packages;

    // Check if user is registered
    if (req.user) {
      const [[reg]] = await db.query(
        'SELECT id, ticket_code FROM event_registrations WHERE user_id = ? AND event_id = ?',
        [req.user.id, event.id]
      );
      event.registered  = !!reg;
      event.ticket_code = reg?.ticket_code || null;
    }

    return ok(res, event);
  } catch (err) {
    logger.error('events.getOne', { error: err.message });
    return serverErr(res);
  }
};

exports.create = async (req, res) => {
  const { title, description, banner, type, venue, meeting_link, whatsapp_link, event_date, deadline, packages } = req.body;
  if (!title || !event_date || !deadline) return badReq(res, 'Title, event date and deadline are required');
  try {
    const slug = slugify(title) + '-' + Date.now().toString(36);
    const [result] = await db.query(
      `INSERT INTO events (title, slug, description, banner, type, venue, meeting_link, whatsapp_link, event_date, deadline)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, slug, description || null, banner || null, type || 'online',
       venue || null, meeting_link || null, whatsapp_link || null, event_date, deadline]
    );
    const eventId = result.insertId;

    if (Array.isArray(packages)) {
      for (const pkg of packages) {
        await db.query(
          `INSERT INTO event_packages (event_id, name, description, price, early_bird_price, early_bird_deadline, capacity, perks)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [eventId, pkg.name, pkg.description || null, pkg.price, pkg.early_bird_price || null,
           pkg.early_bird_deadline || null, pkg.capacity || 100, JSON.stringify(pkg.perks || [])]
        );
      }
    }

    return created(res, { id: eventId, slug });
  } catch (err) {
    logger.error('events.create', { error: err.message });
    return serverErr(res);
  }
};

exports.update = async (req, res) => {
  const allowed = ['title','description','banner','type','venue','meeting_link','whatsapp_link','event_date','deadline','is_published'];
  const updates = []; const vals = [];
  for (const key of allowed) {
    if (key in req.body) { updates.push(`${key} = ?`); vals.push(req.body[key]); }
  }
  if (!updates.length) return badReq(res, 'No valid fields');
  vals.push(req.params.id);
  try {
    await db.query(`UPDATE events SET ${updates.join(', ')} WHERE id = ?`, vals);
    return ok(res, { message: 'Event updated' });
  } catch (err) {
    logger.error('events.update', { error: err.message });
    return serverErr(res);
  }
};

exports.remove = async (req, res) => {
  try {
    await db.query('DELETE FROM events WHERE id = ?', [req.params.id]);
    return ok(res, { message: 'Event deleted' });
  } catch (err) {
    return serverErr(res);
  }
};
