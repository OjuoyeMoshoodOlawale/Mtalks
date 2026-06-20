const db = require("../config/db");
const slugify = require("../utils/slugify");
const {
  ok,
  created,
  notFound,
  badReq,
  serverErr,
  paginate,
} = require("../utils/helpers");
const { generateTicketCode } = require("../services/ticket.service");
const {
  sendEventTicketEmail,
  sendPaymentReceiptEmail,
} = require("../services/email.service");
const logger = require("../utils/logger");

exports.getAll = async (req, res) => {
  const { page, perPage, offset, limit } = paginate(req.query);
  const where = req.user?.role === "admin" ? "" : "WHERE e.is_published = 1";
  try {
    const [events] = await db.query(
      `SELECT e.*,
              GROUP_CONCAT(
                JSON_OBJECT(
                  'id',ep.id,'name',ep.name,'description',ep.description,
                  'price',ep.price,'early_bird_price',ep.early_bird_price,
                  'early_bird_deadline',ep.early_bird_deadline,
                  'capacity',ep.capacity,'perks',ep.perks
                ) ORDER BY ep.id ASC
              ) AS packages_raw
       FROM events e
       LEFT JOIN event_packages ep ON ep.event_id = e.id
       ${where}
       GROUP BY e.id ORDER BY e.event_date ASC LIMIT ? OFFSET ?`,
      [limit, offset],
    );

    const parsed = events.map((ev) => {
      let packages = [];
      if (ev.packages_raw) {
        try {
          packages = JSON.parse("[" + ev.packages_raw + "]");
          /* MySQL JSON_OBJECT returns numbers as strings — cast back */
          packages = packages.map((p) => ({
            ...p,
            price: p.price != null ? Number(p.price) : null,
            early_bird_price:
              p.early_bird_price != null ? Number(p.early_bird_price) : null,
          }));
        } catch (parseErr) {
          console.error(
            "[events.getAll] packages_raw parse error:",
            parseErr.message,
          );
        }
      }
      const out = { ...ev, packages };
      delete out.packages_raw;
      return out;
    });

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM events e ${where}`,
    );
    return ok(res, parsed, { pagination: { page, perPage, total } });
  } catch (err) {
    logger.error("events.getAll", { error: err.message });
    return serverErr(res);
  }
};

const castPackages = (pkgs) =>
  pkgs.map((p) => ({
    ...p,
    price: p.price != null ? Number(p.price) : null,
    early_bird_price:
      p.early_bird_price != null ? Number(p.early_bird_price) : null,
  }));

exports.getById = async (req, res) => {
  try {
    const [[event]] = await db.query("SELECT * FROM events WHERE id = ?", [
      req.params.id,
    ]);
    if (!event) return notFound(res, "Event not found");
    const [packages] = await db.query(
      "SELECT * FROM event_packages WHERE event_id = ? ORDER BY id ASC",
      [event.id],
    );
    event.packages = castPackages(packages);
    return ok(res, event);
  } catch (err) {
    return serverErr(res, err, "Server error");
  }
};

exports.getOne = async (req, res) => {
  try {
    const [[event]] = await db.query("SELECT * FROM events WHERE slug = ?", [
      req.params.slug,
    ]);
    if (!event) return notFound(res, "Event not found");

    const [packages] = await db.query(
      "SELECT * FROM event_packages WHERE event_id = ? ORDER BY id ASC",
      [event.id],
    );
    event.packages = castPackages(packages);

    // Check if user is registered
    if (req.user) {
      const [[reg]] = await db.query(
        "SELECT id, ticket_code FROM event_registrations WHERE user_id = ? AND event_id = ?",
        [req.user.id, event.id],
      );
      event.registered = !!reg;
      event.ticket_code = reg?.ticket_code || null;
    }

    return ok(res, event);
  } catch (err) {
    logger.error("events.getOne", { error: err.message });
    return serverErr(res);
  }
};

exports.create = async (req, res) => {
  const {
    title,
    description,
    banner,
    type,
    delivery_mode,
    venue,
    meeting_link,
    whatsapp_link,
    event_date,
    deadline,
    currency,
    packages,
  } = req.body;
  const mode =
    delivery_mode || (type === "offline" ? "physical" : "online_meeting");
  const derivedType = mode === "physical" ? "offline" : "online"; // backward compat

  /* ── DEBUG: log full incoming body ── */
  console.log("\n[events.create] ▶ body received:");
  console.log("  title:", title);
  console.log("  delivery_mode:", delivery_mode, "→ mode:", mode);
  console.log("  currency:", currency);
  console.log("  packages (raw):", JSON.stringify(packages, null, 2));

  if (!title || !event_date || !deadline)
    return badReq(res, "Title, event date and deadline are required");
  try {
    const slug = slugify(title) + "-" + Date.now().toString(36);
    const [result] = await db.query(
      `INSERT INTO events (title, slug, description, banner, type, delivery_mode, venue, meeting_link, whatsapp_link, event_date, deadline, currency)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        slug,
        description || null,
        banner || null,
        derivedType,
        mode,
        venue || null,
        meeting_link || null,
        whatsapp_link || null,
        event_date,
        deadline,
        currency || "NGN",
      ],
    );
    const eventId = result.insertId;

    console.log(
      "[events.create] packages array?",
      Array.isArray(packages),
      "| length:",
      packages?.length,
    );

    if (Array.isArray(packages) && packages.length) {
      for (const [i, pkg] of packages.entries()) {
        console.log(`[events.create] pkg[${i}]:`, JSON.stringify(pkg));

        const pkgPrice =
          pkg.price !== null && pkg.price !== undefined && pkg.price !== ""
            ? parseFloat(pkg.price)
            : NaN;

        console.log(
          `[events.create] pkg[${i}] pkgPrice:`,
          pkgPrice,
          "| name:",
          pkg.name,
        );

        if (!pkg.name?.trim()) {
          console.warn(`[events.create] ⚠️  Skipping pkg[${i}] — missing name`);
          continue;
        }
        if (isNaN(pkgPrice)) {
          console.warn(
            `[events.create] ⚠️  Skipping pkg[${i}] "${pkg.name}" — price is NaN (raw value: "${pkg.price}")`,
          );
          continue;
        }

        const earlyPrice =
          pkg.early_bird_price !== null &&
          pkg.early_bird_price !== undefined &&
          pkg.early_bird_price !== ""
            ? parseFloat(pkg.early_bird_price)
            : null;

        const values = [
          eventId,
          pkg.name.trim(),
          pkg.description || null,
          pkgPrice,
          earlyPrice !== null && !isNaN(earlyPrice) && earlyPrice > 0
            ? earlyPrice
            : null,
          pkg.early_bird_deadline || null,
          pkg.capacity ? parseInt(pkg.capacity) : 100,
          JSON.stringify(pkg.perks || []),
        ];

        console.log(`[events.create] INSERT pkg[${i}] values:`, values);

        try {
          await db.query(
            `INSERT INTO event_packages (event_id, name, description, price, early_bird_price, early_bird_deadline, capacity, perks)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            values,
          );
          console.log(
            `[events.create] ✅ pkg[${i}] "${pkg.name}" saved — price: ${pkgPrice} ${currency || "NGN"}`,
          );
        } catch (pkgErr) {
          console.error(
            `[events.create] ❌ pkg[${i}] INSERT failed:`,
            pkgErr.message,
          );
          console.error(`[events.create] ❌ values were:`, values);
        }
      }
    }

    return created(res, { id: eventId, slug });
  } catch (err) {
    logger.error("events.create", { error: err.message });
    return serverErr(res);
  }
};

exports.update = async (req, res) => {
  const allowed = [
    "title",
    "description",
    "banner",
    "type",
    "delivery_mode",
    "venue",
    "meeting_link",
    "whatsapp_link",
    "event_date",
    "deadline",
    "currency",
    "is_published",
  ];

  const updates = [];
  const vals = [];

  for (const key of allowed) {
    if (key in req.body) {
      updates.push(`${key} = ?`);
      vals.push(req.body[key]);
    }
  }

  try {
    // Update event details if any event fields were supplied
    if (updates.length) {
      vals.push(req.params.id);

      await db.query(
        `UPDATE events SET ${updates.join(", ")} WHERE id = ?`,
        vals,
      );
    }

    // Update packages if provided
    if (Array.isArray(req.body.packages)) {
      // Remove existing packages
      await db.query("DELETE FROM event_packages WHERE event_id = ?", [
        req.params.id,
      ]);

      // Insert new packages
      for (const [i, pkg] of req.body.packages.entries()) {
        const pkgPrice =
          pkg.price !== null && pkg.price !== undefined && pkg.price !== ""
            ? parseFloat(pkg.price)
            : NaN;

        if (!pkg.name?.trim()) {
          console.warn(`[events.update] Skipping package ${i} - missing name`);
          continue;
        }

        if (isNaN(pkgPrice)) {
          console.warn(
            `[events.update] Skipping package ${i} (${pkg.name}) - invalid price`,
          );
          continue;
        }

        const earlyPrice =
          pkg.early_bird_price !== null &&
          pkg.early_bird_price !== undefined &&
          pkg.early_bird_price !== ""
            ? parseFloat(pkg.early_bird_price)
            : null;

        await db.query(
          `INSERT INTO event_packages
          (
            event_id,
            name,
            description,
            price,
            early_bird_price,
            early_bird_deadline,
            capacity,
            perks
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            req.params.id,
            pkg.name.trim(),
            pkg.description || null,
            pkgPrice,
            earlyPrice !== null && !isNaN(earlyPrice) && earlyPrice > 0
              ? earlyPrice
              : null,
            pkg.early_bird_deadline || null,
            pkg.capacity ? parseInt(pkg.capacity, 10) : 100,
            JSON.stringify(pkg.perks || []),
          ],
        );
      }
    }

    // Prevent empty update requests
    if (!updates.length && !Array.isArray(req.body.packages)) {
      return badReq(res, "No valid fields");
    }

    return ok(res, {
      message: "Event updated successfully",
    });
  } catch (err) {
    logger.error("events.update", {
      error: err.message,
    });

    return serverErr(res);
  }
};

exports.remove = async (req, res) => {
  try {
    await db.query("DELETE FROM events WHERE id = ?", [req.params.id]);
    return ok(res, { message: "Event deleted" });
  } catch (err) {
    return serverErr(res, err, "Server error");
  }
};
