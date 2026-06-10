/**
 * Muhsinah Academy — Demo Seed Script
 * Parent company: MTalks
 *
 * Usage (from project root):
 *   node database/seed.js
 *
 * Reads env from: server/.env
 */

// ── Resolve server/node_modules so this runs from project root ──
const path = require('path');
const SERVER = path.join(__dirname, '..', 'server');
process.env.NODE_PATH = path.join(SERVER, 'node_modules');
require('module').Module._initPaths();
// ────────────────────────────────────────────────────────────────

require('dotenv').config({ path: path.join(SERVER, '.env') });
const bcrypt = require('bcryptjs');
const mysql  = require('mysql2/promise');

const DB = {
  host:               process.env.DB_HOST || 'localhost',
  port:               parseInt(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER || 'root',
  password:           process.env.DB_PASS || '',
  database:           process.env.DB_NAME || 'mtalks_db',
  multipleStatements: true,
};

/* ═══════════════════════════════════════════════════════════════ */
async function seed() {
  const c = await mysql.createConnection(DB);
  console.log(`\n✅  Connected → ${DB.database}\n`);

  /* ── 1. CLEAR (safe FK order) ─────────────────────────────── */
  await c.query(`
    SET FOREIGN_KEY_CHECKS = 0;
    TRUNCATE lesson_progress;
    TRUNCATE eval_attempts;
    TRUNCATE eval_questions;
    TRUNCATE evaluations;
    TRUNCATE enrollments;
    TRUNCATE event_registrations;
    TRUNCATE payments;
    TRUNCATE lessons;
    TRUNCATE modules;
    TRUNCATE courses;
    TRUNCATE event_packages;
    TRUNCATE events;
    TRUNCATE team_members;
    TRUNCATE testimonials;
    TRUNCATE faqs;
    TRUNCATE otp_tokens;
    TRUNCATE users;
    CREATE TABLE IF NOT EXISTS contacts (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL, email VARCHAR(150) NOT NULL, subject VARCHAR(200) NOT NULL, message TEXT NOT NULL, is_read TINYINT(1) DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS certificates (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id INT UNSIGNED NOT NULL, course_id INT UNSIGNED NOT NULL, cert_code VARCHAR(20) NOT NULL UNIQUE, issued_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY unique_cert (user_id, course_id));
    CREATE TABLE IF NOT EXISTS gallery_images (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, title VARCHAR(200), drive_file_id VARCHAR(100) NOT NULL, category VARCHAR(100) DEFAULT 'General', sort_order INT DEFAULT 0, is_published TINYINT(1) DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    TRUNCATE gallery_images;
    CREATE TABLE IF NOT EXISTS bot_knowledge (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, topic VARCHAR(150) NOT NULL, keywords VARCHAR(500) NOT NULL, answer TEXT NOT NULL, is_active TINYINT(1) DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    TRUNCATE contacts;
    TRUNCATE certificates;
    TRUNCATE bot_knowledge;
    SET FOREIGN_KEY_CHECKS = 1;
  `);
  console.log('🗑️   Tables cleared');

  /* ── 2. USERS ─────────────────────────────────────────────── */
  const [adminHash, studentHash] = await Promise.all([
    bcrypt.hash('Admin@1234',   10),
    bcrypt.hash('Student@1234', 10),
  ]);

  await c.query(
    `INSERT INTO users (name, email, password, role, is_verified, is_active) VALUES
     ('Madinah Sanni',     'admin@muhsinahacademy.com',  ?, 'admin',   1, 1),
     ('Aisha Ibrahim',     'aisha.ibrahim@demo.com',     ?, 'student', 1, 1),
     ('Fatimah Abdullahi', 'fatimah.abdullahi@demo.com', ?, 'student', 1, 1),
     ('Zainab Usman',      'zainab.usman@demo.com',      ?, 'student', 1, 1)`,
    [adminHash, studentHash, studentHash, studentHash]
  );
  console.log('👤  Users seeded (4)');

  /* ── 3. COURSES ───────────────────────────────────────────── */
  await c.query(`
    INSERT INTO courses (title, slug, description, thumbnail, price, is_free, is_published) VALUES
    (
      'Understanding Your Love Language',
      'understanding-your-love-language',
      'Discover the 5 love languages and how they shape every relationship. This course helps you communicate love more effectively to your spouse, family, and friends — and finally feel truly understood.',
      'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800',
      0.00, 1, 1
    ),
    (
      'Marriage Foundation Masterclass',
      'marriage-foundation-masterclass',
      'Build an unshakeable marriage from the ground up. Covers compatibility, communication patterns, conflict resolution, financial partnership, and building a shared vision as a couple.',
      'https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?w=800',
      25000.00, 0, 1
    ),
    (
      'Emotional Intelligence for Couples',
      'emotional-intelligence-for-couples',
      'Learn to identify, understand and regulate emotions within your relationship. Emotional intelligence is the hidden key to lasting love, deep connection, and a peaceful home.',
      'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=800',
      15000.00, 0, 1
    ),
    (
      'Healing After Heartbreak',
      'healing-after-heartbreak',
      'A guided journey through grief, rejection and emotional recovery. This free course helps you heal completely and rebuild your confidence before stepping into your next chapter.',
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800',
      0.00, 1, 1
    ),
    (
      'Communication in Marriage',
      'communication-in-marriage',
      'Master the art of difficult conversations, active listening, and expressing needs without conflict. Communication is the lifeblood of every successful marriage.',
      'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800',
      20000.00, 0, 1
    );
  `);
  console.log('📚  Courses seeded (5)');

  /* ── 4. MODULES ───────────────────────────────────────────── */
  await c.query(`
    INSERT INTO modules (course_id, title, sort_order) VALUES
    -- Course 1: Understanding Your Love Language (free)
    (1, 'Foundations of Love in Islam',            1),
    (1, 'What Your Spouse Truly Needs',            2),
    -- Course 2: Marriage Foundation Masterclass (paid)
    (2, 'Before You Say I Do',                     1),
    (2, 'Building Your Marriage on Solid Ground',  2),
    (2, 'Marriage in a Changing World',            3),
    -- Course 3: Emotional Intelligence for Couples (paid)
    (3, 'Inner Peace and Self-Regulation',         1),
    (3, 'Guarding and Growing Your Heart',         2),
    -- Course 4: Healing After Heartbreak (free)
    (4, 'Understanding the Broken Heart',          1),
    (4, 'The Journey Back to Wholeness',           2),
    -- Course 5: Communication in Marriage (paid)
    (5, 'What Marriage Should Feel Like',          1),
    (5, 'Resolving Conflict the Right Way',        2);
  `);
  console.log('📦  Modules seeded (11)');

  /* ── 5. LESSONS ───────────────────────────────────────────── */
  // All real, public YouTube lectures (video_type = 'youtube')
  await c.query(`
    INSERT INTO lessons (module_id, title, drive_file_id, video_type, duration_min, sort_order) VALUES
    -- M1: Foundations of Love in Islam
    (1,  'Love, Peace & Partnership — Mufti Menk',                       '6iTrnGhuhm4', 'youtube', 45, 1),
    (1,  'This Is What Marriage Should Be — Nouman Ali Khan',            'XhZY7rzKWhM', 'youtube', 20, 2),
    -- M2: What Your Spouse Truly Needs
    (2,  '5 Things Your Wife Needs From You — Nouman Ali Khan',          'sdqZMxscyE8', 'youtube', 18, 1),
    (2,  'The Most Important Thing Your Husband Needs — Nouman Ali Khan','bIeQBPh4NP0', 'youtube', 15, 2),
    -- M3: Before You Say I Do
    (3,  'Selecting a Good Spouse — Mufti Menk',                         '83mufaag6PU', 'youtube', 30, 1),
    (3,  'What To Do Before Getting Married — Nouman Ali Khan',          'CMBloGa9WN8', 'youtube', 22, 2),
    (3,  'Open the Doors to Marriage — Nouman Ali Khan',                 'FXP39jFRfGY', 'youtube', 28, 3),
    -- M4: Building Your Marriage on Solid Ground
    (4,  'Marriage & Relationships, Part 1 — Mufti Menk',                'JEi4FwFvFUg', 'youtube', 55, 1),
    (4,  'Marriage & Relationships, Part 2 — Mufti Menk',                'q9D5kxnYuQo', 'youtube', 50, 2),
    -- M5: Marriage in a Changing World
    (5,  'Marriage in a Changing World — Mufti Menk',                    's920tt771bY', 'youtube', 40, 1),
    -- M6: Inner Peace and Self-Regulation
    (6,  'Attaining Inner Peace During Hardships — Yasmin Mogahed',      'lthemAddZeI', 'youtube', 48, 1),
    (6,  'Don''t Feel Guilty — Yasmin Mogahed',                          'RNkRLiPV0Vg', 'youtube', 42, 2),
    -- M7: Guarding and Growing Your Heart
    (7,  'Nourishing & Protecting Your Heart — Yasmin Mogahed',          'P0s1PKcVbuo', 'youtube', 45, 1),
    (7,  'Your Journey Towards Healing & Happiness — Yasmin Mogahed',    'fbe4JJkchac', 'youtube', 35, 2),
    -- M8: Understanding the Broken Heart
    (8,  'Healing a Broken Heart — Yasmin Mogahed',                      'CX27CMfw0cI', 'youtube', 40, 1),
    (8,  'How Do You Deal With Heartbreak? — Yasmin Mogahed',            'Eo4M7DKCM10', 'youtube', 12, 2),
    -- M9: The Journey Back to Wholeness
    (9,  'How To Transform a Broken Heart — Yasmin Mogahed',             'fjx96n-PaAk', 'youtube', 50, 1),
    (9,  'Healing a Broken Heart (Reflections) — Yasmin Mogahed',        'G_Y8kZa53WI', 'youtube', 25, 2),
    -- M10: What Marriage Should Feel Like
    (10, 'Challenging Your Spouse with Islam — Nouman Ali Khan',         'o2jojfX8AHI', 'youtube', 16, 1),
    -- M11: Resolving Conflict the Right Way
    (11, 'Issues in Marriage — Mufti Menk',                              'Lyk_ggupqfk', 'youtube', 35, 1),
    (11, 'How To Save Your Marriage — Mufti Menk',                       'H3pEWpqUhFM', 'youtube', 30, 2);
  `);
  console.log('🎬  Lessons seeded (21 — all real YouTube lectures)');

  /* ── 6. EVENTS ────────────────────────────────────────────── */
  await c.query(`
    INSERT INTO events
      (title, slug, description, banner, type, venue,
       whatsapp_link, event_date, deadline, is_published)
    VALUES
    (
      'Muhsinah Marriage Summit 2025',
      'muhsinah-marriage-summit-2025',
      'Nigeria''s premier marriage enrichment summit. Join Coach Madinah Sanni and top relationship experts for a transformative 2-day experience. Connect with like-minded couples, gain actionable tools, and leave with a renewed vision for your marriage and family.',
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200',
      'offline',
      'Transcorp Hilton Abuja — Plot 1096 Aguiyi Ironsi Street, Maitama, Abuja',
      'https://chat.whatsapp.com/SUMMIT_GROUP_LINK_HERE',
      DATE_ADD(NOW(), INTERVAL 50 DAY),
      DATE_ADD(NOW(), INTERVAL 47 DAY),
      1
    ),
    (
      'Couple''s Retreat Weekend — Abuja 2025',
      'couples-retreat-weekend-abuja-2025',
      'An intimate 3-day retreat for couples ready to reconnect, reset and reignite. Limited to 20 couples only. Guided sessions, couples exercises, evening dhikr, and a breathtaking lakeside setting.',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200',
      'offline',
      'Sheraton Abuja Hotel — Ladi Kwali Way, Maitama, Abuja',
      'https://chat.whatsapp.com/RETREAT_GROUP_LINK_HERE',
      DATE_ADD(NOW(), INTERVAL 80 DAY),
      DATE_ADD(NOW(), INTERVAL 77 DAY),
      1
    );
  `);
  console.log('🎪  Events seeded (2)');

  /* ── 7. EVENT PACKAGES ────────────────────────────────────── */
  await c.query(`
    INSERT INTO event_packages
      (event_id, name, description, price, early_bird_price,
       early_bird_deadline, capacity, perks)
    VALUES
    (
      1, 'Individual Pass',
      'Full access to all 2-day sessions, workbook, and refreshments',
      15000.00, 10000.00,
      DATE_ADD(NOW(), INTERVAL 25 DAY), 200,
      '["Full 2-day access","Participant workbook","Refreshments","Certificate of attendance"]'
    ),
    (
      1, 'Couple Pass',
      'Two seats — all sessions, couple workbooks, and refreshments for two',
      25000.00, 18000.00,
      DATE_ADD(NOW(), INTERVAL 25 DAY), 100,
      '["2 seats full access","Couples workbooks","Refreshments x2","Couples certificate"]'
    ),
    (
      1, 'VIP Couple Pass',
      'Front-row seats, private dinner with Coach Madinah, premium gift pack, framed certificate',
      60000.00, 45000.00,
      DATE_ADD(NOW(), INTERVAL 15 DAY), 15,
      '["Front-row reserved seats","Private dinner with Coach Madinah","Premium gift pack","Framed certificate","Post-event 1hr consultation"]'
    ),
    (
      2, 'Standard Room',
      'Shared room accommodation, all meals, and all retreat sessions',
      80000.00, 65000.00,
      DATE_ADD(NOW(), INTERVAL 35 DAY), 10,
      '["3 nights shared room","All meals included","All retreat sessions","Retreat workbook"]'
    ),
    (
      2, 'Deluxe Suite',
      'Private suite, all meals, all sessions, and couples spa session included',
      150000.00, 120000.00,
      DATE_ADD(NOW(), INTERVAL 30 DAY), 10,
      '["3 nights private suite","All meals included","All retreat sessions","Couples spa session","Premium gift box"]'
    );
  `);
  console.log('🎟️   Event packages seeded (5)');

  /* ── 8. TEAM MEMBERS ──────────────────────────────────────── */
  await c.query(`
    INSERT INTO team_members (name, role, bio, photo, social_links, sort_order, is_active)
    VALUES
    (
      'Coach Madinah Sanni',
      'Founder & Lead Coach',
      'Coach Madinah Sanni is a certified life and marriage coach with over 10 years of experience transforming relationships across Nigeria and beyond. A passionate advocate for healthy Muslim marriages, she founded Muhsinah Academy to make expert, faith-centred coaching accessible to every couple.',
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400',
      '{"instagram":"https://instagram.com/muhsinahacademy","twitter":"https://twitter.com/muhsinahacademy"}',
      1, 1
    ),
    (
      'Ustadh Khalid Bello',
      'Marriage Counsellor & Facilitator',
      'Ustadh Khalid brings deep Islamic scholarship and modern counselling techniques together. A sought-after speaker on family values and marital rights in Islam, he has facilitated over 200 pre-marital counselling sessions.',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      '{"linkedin":"https://linkedin.com"}',
      2, 1
    ),
    (
      'Habibah Lawal',
      'Programme Coordinator',
      'Habibah manages all academy programmes, student support, and event logistics. She ensures every student journey — from enrolment to completion — is smooth, well-supported, and impactful.',
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400',
      '{"instagram":"https://instagram.com"}',
      3, 1
    );
  `);
  console.log('👥  Team seeded (3)');

  /* ── 9. TESTIMONIALS ──────────────────────────────────────── */
  await c.query(`
    INSERT INTO testimonials (client_name, client_photo, content, rating, source, is_published)
    VALUES
    (
      'Maryam & Yusuf Adeyemi',
      'https://images.unsplash.com/photo-1590086782957-93c06ef21604?w=200',
      'We almost gave up on our 6-year marriage. After taking the Marriage Foundation Masterclass together, we have tools we actually use every single day. Coach Madinah has a rare gift for making complex emotional dynamics simple and actionable. Our home is genuinely different now.',
      5, 'course', 1
    ),
    (
      'Aminat Okafor',
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200',
      'I came to the summit as a single lady, simply curious. I left with more clarity about what I want in a partner — and what I need to work on in myself — than I had found in years. The summit is worth every naira and then some.',
      5, 'event', 1
    ),
    (
      'Ibrahim Suleiman',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      'My wife and I used to cycle through the same arguments every month. After the Communication in Marriage course, we have a shared language for our conflicts. We understand each other now and can actually resolve things. Life-changing.',
      5, 'course', 1
    ),
    (
      'Khadijah Bello',
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200',
      'I was broken after a painful broken engagement. The Healing After Heartbreak course gave me the framework to heal properly. It is so detailed and compassionate. I feel whole again — and genuinely ready to love again. I cannot believe this is free.',
      5, 'course', 1
    ),
    (
      'Dr. Saheed & Ronke Afolabi',
      'https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?w=200',
      'The retreat was the best investment we have made in our 9-year marriage. Three days away from the noise of life, focused entirely on us. Coach Madinah and her team created the safest, most powerful space I have ever been in as a couple.',
      5, 'event', 1
    ),
    (
      'Falmata Garba',
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200',
      'I used to shut down completely whenever we had any disagreement. The Emotional Intelligence course taught me to name my emotions and respond thoughtfully instead of reacting. The atmosphere in our home has genuinely changed. My husband noticed before I even told him.',
      5, 'course', 1
    ),
    (
      'Adebayo Nwosu',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200',
      'As a man, I was sceptical, but my wife encouraged me to try the free Love Language course with her. Now I understand exactly why certain things I do mean so much to her. Game changer. Will buy a paid course next.',
      5, 'course', 1
    ),
    (
      'Safiya Mohammed',
      'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200',
      'The one-on-one consultation with Coach Madinah gave me more clarity than I had found in years. She listens without judgement and gives practical, faith-centred guidance that actually sticks. Booking that first session changed the direction of my life.',
      5, 'manual', 1
    );
  `);
  console.log('⭐  Testimonials seeded (8)');

  /* ── 10. FAQs ─────────────────────────────────────────────── */
  await c.query(`
    INSERT INTO faqs (question, answer, category, sort_order, is_published) VALUES
    (
      'Are the courses for singles or only married couples?',
      'Our courses are designed for everyone — singles preparing for marriage, engaged couples, newlyweds, and long-married couples. Each course page specifies who it is best suited for so you can choose what is right for your season.',
      'Courses', 1, 1
    ),
    (
      'How do I access my course after payment?',
      'Once your payment is confirmed, your course will appear automatically in your Student Dashboard under "My Courses". You will also receive a confirmation email. Log in and start learning right away — no waiting.',
      'Courses', 2, 1
    ),
    (
      'Are the courses self-paced?',
      'Yes, completely. All courses are 100% self-paced with no deadlines. You can pause, resume, and revisit any lesson as many times as you need.',
      'Courses', 3, 1
    ),
    (
      'What payment methods are accepted?',
      'We accept all Nigerian debit and credit cards, and bank transfers, through Paystack — Nigeria''s most trusted payment gateway. All transactions are fully secure and encrypted.',
      'Payments', 4, 1
    ),
    (
      'Can I get a refund if I am not satisfied?',
      'Yes. We offer a 7-day satisfaction guarantee on all paid courses. If you are not satisfied within 7 days of purchase, contact us at madeenahsanni@gmail.com for a full refund — no questions asked.',
      'Payments', 5, 1
    ),
    (
      'How does a consultation session work?',
      'Consultations are booked via our Calendly scheduling link on the Consultation page. After booking, you will receive a secure video call link by email. Sessions are 60 minutes and completely confidential.',
      'Consultation', 6, 1
    ),
    (
      'Do you offer couples coaching or only individual sessions?',
      'Both. Many courses are designed for couples to take together. We also offer joint consultation sessions — simply indicate when booking that you are coming as a couple.',
      'Consultation', 7, 1
    ),
    (
      'Is my personal information kept private?',
      'Absolutely. We comply fully with Nigeria''s NDPR data protection regulations. Your information is never sold or shared with any third party. See our full Privacy Policy for complete details.',
      'General', 8, 1
    ),
    (
      'What happens if I cannot attend an event I paid for?',
      'Event tickets are non-refundable but fully transferable. Contact us at least 48 hours before the event to transfer your ticket to another person at no extra charge.',
      'Events', 9, 1
    ),
    (
      'How do I receive my event ticket after payment?',
      'Your QR-coded ticket is sent to your email address immediately after payment is confirmed. Please check your spam or promotions folder if you do not see it within 5 minutes.',
      'Events', 10, 1
    );
  `);
  console.log('❓  FAQs seeded (10)');

  /* ── 11. SETTINGS (upsert — schema already has defaults) ──── */
  await c.query(`
    INSERT INTO settings (\`key\`, \`value\`) VALUES
      ('site_name',       'Muhsinah Academy'),
      ('site_tagline',    'Helping Muslim Sisters and Couples Build Stronger, Healthier, and Lasting Relationships.'),
      ('site_email',      'madeenahsanni@gmail.com'),
      ('whatsapp_number', '2348039632700'),
      ('calendly_url',    'https://calendly.com/madeenahsanni'),
      ('instagram_url',   'https://instagram.com/muhsinahacademy'),
      ('facebook_url',    'https://facebook.com/muhsinahacademy'),
      ('twitter_url',     'https://twitter.com/muhsinahacademy'),
      ('youtube_url',     'https://youtube.com/@muhsinahacademy'),
      ('tiktok_url',      'https://tiktok.com/@muhsinahacademy'),
      ('crisp_website_id',''),
      ('site_address',    'Abuja, Nigeria')
    ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`);
  `);
  console.log('⚙️   Settings seeded');

  /* ── 12. DEMO ENROLLMENTS (free courses auto-enrolled) ─────── */
  await c.query(`
    INSERT IGNORE INTO enrollments (user_id, course_id, enrolled_at) VALUES
    (2, 1, DATE_SUB(NOW(), INTERVAL 10 DAY)),
    (2, 4, DATE_SUB(NOW(), INTERVAL 8  DAY)),
    (3, 1, DATE_SUB(NOW(), INTERVAL 14 DAY)),
    (3, 4, DATE_SUB(NOW(), INTERVAL 6  DAY)),
    (4, 4, DATE_SUB(NOW(), INTERVAL 5  DAY));
  `);
  console.log('📝  Enrollments seeded (5 free)');

  /* ── 13. DEMO PAYMENTS (paid course + event) ──────────────── */
  const now = Date.now();
  await c.query(`
    INSERT INTO payments (user_id, type, item_id, amount, reference, status, paid_at) VALUES
    (3, 'course', 2, 25000.00, 'DEMO_SEED_PAY_001_${now}', 'success', DATE_SUB(NOW(), INTERVAL 3 DAY)),
    (2, 'event',  1, 10000.00, 'DEMO_SEED_PAY_002_${now}', 'success', DATE_SUB(NOW(), INTERVAL 7 DAY)),
    (4, 'course', 3, 15000.00, 'DEMO_SEED_PAY_003_${now}', 'success', DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (3, 'event',  1, 18000.00, 'DEMO_SEED_PAY_004_${now}', 'success', DATE_SUB(NOW(), INTERVAL 12 DAY));
  `);
  // Also enrol paid-course students
  await c.query(`
    INSERT IGNORE INTO enrollments (user_id, course_id, enrolled_at) VALUES
    (3, 2, DATE_SUB(NOW(), INTERVAL 3 DAY)),
    (4, 3, DATE_SUB(NOW(), INTERVAL 1 DAY));
  `);
  console.log('💳  Payments seeded (4)');

  /* ── 13b. DEMO EVENT REGISTRATIONS (tickets) ─────────────── */
  await c.query(`
    INSERT INTO event_registrations (user_id, event_id, package_id, ticket_code, registered_at) VALUES
    (2, 1, 1, 'DEMOTICKETAISHA1', DATE_SUB(NOW(), INTERVAL 7 DAY)),
    (3, 1, 2, 'DEMOTICKETFATIM1', DATE_SUB(NOW(), INTERVAL 12 DAY));
  `);
  console.log('🎫  Event registrations seeded (2)');

  /* ── 14. DEMO LESSON PROGRESS ─────────────────────────────── */
  // Aisha has finished 3 lessons of course 1
  await c.query(`
    INSERT IGNORE INTO lesson_progress (user_id, lesson_id, completed_at) VALUES
    (2, 1, DATE_SUB(NOW(), INTERVAL 9 DAY)),
    (2, 2, DATE_SUB(NOW(), INTERVAL 8 DAY)),
    (2, 3, DATE_SUB(NOW(), INTERVAL 7 DAY));
  `);
  console.log('📊  Lesson progress seeded');

  /* ── 15. MUZZAMIL BOT KNOWLEDGE ───────────────────────────── */
  await c.query(`
    INSERT INTO bot_knowledge (topic, keywords, answer) VALUES
    ('Greeting', 'hello,hi,salam,assalamu,hey,good morning,good afternoon,good evening',
     'Wa alaikum salam! 🌿 I''m Muzzamil, your Muhsinah Academy assistant. I can help you with courses, events, consultations, payments, and more. What would you like to know?'),
    ('Courses', 'course,courses,learn,lesson,class,study,enrol,enroll',
     'We offer self-paced online courses on marriage, relationships, and personal growth — some free, some paid. Browse them at the Courses page. Once enrolled, you get lifetime access!'),
    ('Events', 'event,events,summit,retreat,workshop,ticket,seminar',
     'We host live events like the Muhsinah Marriage Summit and Couples'' Retreats. Check the Events page for dates, packages, and early-bird prices. Your QR ticket is emailed instantly after payment.'),
    ('Consultation', 'consult,consultation,session,booking,book,appointment,coach,one on one,private',
     'You can book a private, confidential session with Coach Madinah Sanni from the Consultation page. Sessions are 60 minutes via video call — individual and couples options available.'),
    ('Payment', 'pay,payment,paystack,card,transfer,price,cost,fee,naira,refund',
     'We accept all Nigerian cards and bank transfers via Paystack — fully secure. Paid courses come with a 7-day satisfaction guarantee. Event tickets are transferable up to 48 hours before the event.'),
    ('Certificates', 'certificate,cert,completion,award',
     'Complete 100% of a course''s lessons and you can claim a verified certificate! Each one has a unique code anyone can verify on our website.'),
    ('Contact', 'contact,email,phone,whatsapp,reach,support,help,talk to human,human',
     'You can reach our team via the Contact page or WhatsApp. For private matters, email us and we''ll respond within 24 hours insha''Allah.'),
    ('About', 'about,who,madinah,sanni,founder,academy,muhsinah',
     'Muhsinah Academy was founded by Coach Madinah Sanni, a certified life and marriage coach with over 10 years of experience. Learn more on our About page!');
  `);
  console.log('🤖  Muzzamil knowledge seeded (8)');

  await c.end();

  /* ── SUMMARY ──────────────────────────────────────────────── */
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🎉  Muhsinah Academy seed complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ADMIN LOGIN
  ───────────
  Email    →  admin@muhsinahacademy.com
  Password →  Admin@1234
  Role     →  admin

  DEMO STUDENTS
  ─────────────
  aisha.ibrahim@demo.com     /  Student@1234
  fatimah.abdullahi@demo.com /  Student@1234
  zainab.usman@demo.com      /  Student@1234

  SEEDED DATA
  ───────────
  5  courses  (2 free, 3 paid)
  11 modules
  21 lessons (real public YouTube lectures)
  2  events   (with 5 packages)
  3  team members
  8  testimonials
  10 FAQs
  7  demo enrollments
  4  demo payments

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}

seed().catch(err => {
  console.error('\n❌  Seed failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
