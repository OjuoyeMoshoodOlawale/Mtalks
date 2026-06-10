const db     = require('../config/db');
const { ok, serverErr } = require('../utils/helpers');

exports.getAll = async (req, res) => {
  try {
    // Overview cards
    const [[{ total_revenue }]]  = await db.query("SELECT COALESCE(SUM(amount),0) AS total_revenue FROM payments WHERE status='success'");
    const [[{ month_revenue }]]  = await db.query("SELECT COALESCE(SUM(amount),0) AS month_revenue FROM payments WHERE status='success' AND MONTH(paid_at)=MONTH(NOW()) AND YEAR(paid_at)=YEAR(NOW())");
    const [[{ total_students }]] = await db.query("SELECT COUNT(*) AS total_students FROM users WHERE role='student'");
    const [[{ total_enrollments }]] = await db.query('SELECT COUNT(*) AS total_enrollments FROM enrollments');
    const [[{ total_events }]]   = await db.query('SELECT COUNT(*) AS total_events FROM event_registrations');
    const [[{ new_users }]]      = await db.query("SELECT COUNT(*) AS new_users FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)");

    // Revenue by month (last 6 months)
    const [revenueByMonth] = await db.query(
      `SELECT DATE_FORMAT(paid_at,'%b %Y') AS month, SUM(amount) AS revenue
       FROM payments WHERE status='success' AND paid_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(paid_at,'%Y-%m') ORDER BY MIN(paid_at) ASC`);

    // Top courses by enrollment
    const [topCourses] = await db.query(
      `SELECT c.title, COUNT(e.id) AS enrollments
       FROM courses c LEFT JOIN enrollments e ON e.course_id = c.id
       GROUP BY c.id ORDER BY enrollments DESC LIMIT 5`);

    // Recent 10 payments
    const [recentPayments] = await db.query(
      `SELECT p.*, COALESCE(u.name, p.guest_name) AS user_name FROM payments p
       LEFT JOIN users u ON u.id = p.user_id
       WHERE p.status='success' ORDER BY p.paid_at DESC LIMIT 10`);

    // Events by registrations
    const [eventStats] = await db.query(
      `SELECT ev.title, COUNT(er.id) AS registrations
       FROM events ev LEFT JOIN event_registrations er ON er.event_id = ev.id
       GROUP BY ev.id ORDER BY registrations DESC LIMIT 5`);

    return ok(res, {
      overview: {
        total_revenue: Number(total_revenue),
        month_revenue: Number(month_revenue),
        total_students,
        total_enrollments,
        total_events,
        new_users
      },
      revenueByMonth,
      topCourses,
      recentPayments,
      eventStats
    });
  } catch (err) {
    console.error(err);
    return serverErr(res);
  }
};

exports.getRevenue = exports.getAll;
exports.create = async (req, res) => ok(res, {});
exports.update = async (req, res) => ok(res, {});
exports.remove = async (req, res) => ok(res, {});
