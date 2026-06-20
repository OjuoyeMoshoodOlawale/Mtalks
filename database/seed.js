/**
 * Muhsinah Academy — Full Database Seed
 * All tables, all new columns (delivery_mode, currency, is_sync)
 * Real Unsplash photo URLs
 *
 * Run:  node database/seed.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../server/.env') });

const mysql  = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const dbCfg = {
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASS     || '',
  database: process.env.DB_NAME     || 'mtalks_db',
  multipleStatements: true,
};

const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

async function seed() {
  console.log('\nMuhsinah Academy — Seeding...\n');
  const c = await mysql.createConnection(dbCfg);

  await c.query('SET FOREIGN_KEY_CHECKS=0');
  const tables = [
    'sync_logs','sync_settings','email_logs','error_logs','bot_knowledge',
    'gallery_images','settings','faqs','testimonials','team_members','contacts',
    'certificates','otp_tokens','lesson_progress','eval_attempts','eval_questions',
    'evaluations','enrollments','lessons','modules','courses',
    'event_registrations','event_packages','events','payments','users',
  ];
  for (const t of tables) await c.query(`TRUNCATE TABLE IF EXISTS \`${t}\``).catch(()=>{});
  await c.query('SET FOREIGN_KEY_CHECKS=1');

  // ── Users ─────────────────────────────────────────────────────────────
  const [aH,sH] = await Promise.all([bcrypt.hash('Admin@1234',12), bcrypt.hash('Student@1234',12)]);
  await c.query(`INSERT INTO users (name,email,password,role,is_verified,is_active) VALUES
    ('Madinah Sanni','admin@muhsinahacademy.com','${aH}','admin',1,1),
    ('Fatima Al-Amin','fatima.alamin@demo.com','${sH}','student',1,1),
    ('Aisha Ibrahim','aisha.ibrahim@demo.com','${sH}','student',1,1),
    ('Khadijah Yusuf','khadijah.yusuf@demo.com','${sH}','student',1,1),
    ('Maryam Bello','maryam.bello@demo.com','${sH}','student',1,1),
    ('Zainab Usman','zainab.usman@demo.com','${sH}','student',1,1)`);
  console.log('  Users (1 admin + 5 students)');

  // ── Courses ───────────────────────────────────────────────────────────
  await c.query(`INSERT INTO courses (title,slug,description,thumbnail,price,is_free,is_published) VALUES
    ('Understanding Your Love Language','understanding-your-love-language',
     'Discover the five love languages and speak your partner''s language fluently — through an Islamic lens.',
     'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&q=80&auto=format',
     0,1,1),
    ('Building a God-Centred Marriage','building-a-god-centred-marriage',
     'Establish taqwa, trust, and purpose at the heart of your marriage with Islamic principles.',
     'https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&q=80&auto=format',
     25000,0,1),
    ('Emotional Intelligence in Marriage','emotional-intelligence-in-marriage',
     'Identify, understand and manage emotions to build deeper intimacy and resolve conflict with compassion.',
     'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800&q=80&auto=format',
     35000,0,1),
    ('Healing After Heartbreak','healing-after-heartbreak',
     'A guided journey for sisters recovering from divorce or a difficult marriage — through Quran and Sunnah.',
     'https://images.unsplash.com/photo-1484627147104-f5197bcd6651?w=800&q=80&auto=format',
     20000,0,1),
    ('Communication Mastery for Couples','communication-mastery-for-couples',
     'Master talking so your spouse listens, and listening so your spouse talks.',
     'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80&auto=format',
     30000,0,1)`);
  console.log('  Courses (5)');

  // ── Modules ───────────────────────────────────────────────────────────
  const [[{id:c1}],[{id:c2}],[{id:c3}],[{id:c4}],[{id:c5}]] = await Promise.all(
    ['understanding-your-love-language','building-a-god-centred-marriage',
     'emotional-intelligence-in-marriage','healing-after-heartbreak','communication-mastery-for-couples']
    .map(sl => c.query('SELECT id FROM courses WHERE slug=?',[sl]))
  );

  await c.query(`INSERT INTO modules (course_id,title,sort_order) VALUES
    (${c1},'Introduction to Love Languages',1),(${c1},'The Five Love Languages',2),(${c1},'Speaking Their Language',3),
    (${c2},'The Islamic Marriage Contract',1),(${c2},'Rights and Responsibilities',2),(${c2},'Building Trust Together',3),
    (${c3},'What Is Emotional Intelligence?',1),(${c3},'Managing Triggers',2),(${c3},'Empathy and Listening',3),
    (${c4},'Accepting Loss',1),(${c4},'Rebuilding Identity',2),(${c4},'Moving Forward with Faith',3),
    (${c5},'Anatomy of a Difficult Conversation',1),(${c5},'Active Listening',2),(${c5},'Expressing Needs',3)`);
  console.log('  Modules (15)');

  // ── Lessons ───────────────────────────────────────────────────────────
  const [mods] = await c.query('SELECT id FROM modules ORDER BY id');
  const YT = ['jNQXAC9IVRw','dQw4w9WgXcQ','SO5_XmzR5NM','9bZkp7q19f0','kJQP7kiw5Fk',
               'JGwWNGJdvx8','CevxZvSJLk8','3tmd-ClpJxA','hT_nvWreIhg','OPf0YbXqDm0',
               'A3KsMOmtSL0','YQHsXMglC9A','uelHwf8o7_U','09R8_2nJtjg','GSjIe9jxkWw'];
  let yi=0;
  const rows=[];
  for(const m of mods){
    for(let i=1;i<=3;i++){
      rows.push(`(${m.id},'Lesson ${i}: Core Principles','Key concepts and practical takeaways for this lesson.',
        '${YT[yi%YT.length]}','youtube',${10+i*5},${i})`);
      yi++;
    }
  }
  await c.query(`INSERT INTO lessons (module_id,title,content,drive_file_id,video_type,duration_min,sort_order) VALUES ${rows.join(',')}`);
  console.log('  Lessons (45)');

  // ── Events ────────────────────────────────────────────────────────────
  await c.query(`INSERT INTO events
    (title,slug,description,banner,type,delivery_mode,venue,meeting_link,whatsapp_link,event_date,deadline,currency,is_published) VALUES
    ('Couples Retreat Weekend — Abuja 2025','couples-retreat-weekend-abuja-2025',
     'A transformative two-day retreat for married Muslim couples. Guided sessions on communication, intimacy, and reconnecting with shared purpose. Limited to 20 couples.',
     'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80&auto=format',
     'offline','physical','Transcorp Hilton, Abuja',NULL,
     'https://chat.whatsapp.com/example-retreat',
     DATE_ADD(NOW(),INTERVAL 45 DAY),DATE_ADD(NOW(),INTERVAL 40 DAY),'NGN',1),

    ('MTalks Live: Navigating In-Law Relationships','mtalks-live-inlaw-relationships',
     'A powerful live coaching session on managing in-law dynamics. Walk away with practical strategies and a clear boundaries framework.',
     'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80&auto=format',
     'online','online_meeting',NULL,'https://zoom.us/j/example',
     'https://chat.whatsapp.com/example-mtalks',
     DATE_ADD(NOW(),INTERVAL 14 DAY),DATE_ADD(NOW(),INTERVAL 12 DAY),'NGN',1),

    ('Pre-Nikah Preparation Workshop','pre-nikah-preparation-workshop',
     'For sisters planning to marry within the next 12 months. A full-day workshop covering expectations, communication, and emotional readiness.',
     'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80&auto=format',
     'offline','physical','Lagos Continental Hotel, Lagos',NULL,
     'https://chat.whatsapp.com/example-prenikah',
     DATE_ADD(NOW(),INTERVAL 60 DAY),DATE_ADD(NOW(),INTERVAL 55 DAY),'NGN',1)`);
  console.log('  Events (3)');

  // ── Event Packages ────────────────────────────────────────────────────
  const [[{id:e1}],[{id:e2}],[{id:e3}]] = await Promise.all(
    ['couples-retreat-weekend-abuja-2025','mtalks-live-inlaw-relationships','pre-nikah-preparation-workshop']
    .map(sl => c.query('SELECT id FROM events WHERE slug=?',[sl]))
  );

  await c.query(`INSERT INTO event_packages (event_id,name,description,price,early_bird_price,early_bird_deadline,capacity,sort_order) VALUES
    (${e1},'Individual Pass','Full 2-day retreat for one person',60000,45000,DATE_ADD(NOW(),INTERVAL 20 DAY),20,1),
    (${e1},'Couple Pass','Full retreat for husband and wife',100000,75000,DATE_ADD(NOW(),INTERVAL 20 DAY),10,2),
    (${e1},'VIP Couple Pass','Couple pass + 1-on-1 session with Coach Madinah',180000,150000,DATE_ADD(NOW(),INTERVAL 15 DAY),5,3),
    (${e2},'Standard Access','Full live session + replay',5000,NULL,NULL,200,1),
    (${e2},'VIP Access','Live session + replay + private Q&A',15000,NULL,NULL,20,2),
    (${e3},'Individual Ticket','Full workshop for one person',15000,10000,DATE_ADD(NOW(),INTERVAL 30 DAY),30,1),
    (${e3},'Bring a Friend','Two tickets at a discounted rate',25000,20000,DATE_ADD(NOW(),INTERVAL 30 DAY),15,2)`);
  console.log('  Event packages (7)');

  // ── Enrollments ───────────────────────────────────────────────────────
  const [uRows] = await c.query("SELECT id FROM users WHERE role='student' ORDER BY id LIMIT 5");
  const [u2,u3,u4,u5,u6] = uRows.map(r=>r.id);
  await c.query(`INSERT INTO enrollments (user_id,course_id) VALUES
    (${u2},${c1}),(${u2},${c4}),(${u3},${c1}),(${u3},${c4}),
    (${u4},${c3}),(${u5},${c1}),(${u5},${c5}),(${u6},${c2})`);
  console.log('  Enrollments (8)');

  // ── Team ──────────────────────────────────────────────────────────────
  await c.query(`INSERT INTO team_members (name,role,photo,bio,sort_order) VALUES
    ('Coach Madinah Sanni','Lead Marriage Coach & Founder',
     '/images/team/coach-madinah.jpg',
     'Coach Madinah is a certified marriage coach with over 8 years of experience helping Muslim couples build marriages rooted in faith, purpose, and love.',1),
    ('Ustadha Rukayat Olatunji','Islamic Studies Advisor',
     'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80&auto=format',
     'Ustadha Rukayat ensures all academy content is grounded in authentic Islamic scholarship and fiqh al-usrah.',2),
    ('Sister Amina Garba','Community Coordinator',
     'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80&auto=format',
     'Amina manages participant welfare and ensures every student feels supported throughout their journey.',3),
    ('Dr. Hauwa Abdullahi','Clinical Psychology Advisor',
     'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80&auto=format',
     'Dr. Hauwa provides clinical oversight ensuring our approach is culturally sensitive and professionally sound.',4)`);
  console.log('  Team (4)');

  // ── Testimonials ──────────────────────────────────────────────────────
  await c.query(`INSERT INTO testimonials (client_name,client_photo,content,rating,source,is_published) VALUES
    ('Sister F.A., Abuja',
     'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80&auto=format',
     'The Couples Retreat changed the trajectory of our marriage. My husband and I left with tools, hope, and a renewed commitment. Barakallahu feekum.',5,'google',1),
    ('Sister K.M., Lagos',
     'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80&auto=format',
     'I enrolled in the Love Language course after 3 years of feeling misunderstood. Within weeks my husband noticed the change. This course is a gift.',5,'whatsapp',1),
    ('Sister Z.U., Kano',
     'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&q=80&auto=format',
     'The Healing course met me exactly where I was after my divorce. Coach Madinah gives you a framework and walks with you through it.',5,'instagram',1),
    ('Sister A.I., Kaduna',
     'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=200&q=80&auto=format',
     'I attended the Pre-Nikah Workshop six months before my nikah. It was the most practical marriage preparation I have ever received.',5,'google',1),
    ('Brother M.B. & Wife, Abuja',
     'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80&auto=format',
     'Our disagreements used to last hours. Now they rarely last 20 minutes after completing Communication Mastery together. JazakAllahu khairan.',5,'facebook',1),
    ('Sister H.A., Port Harcourt',
     'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80&auto=format',
     'MTalks Live sessions are gold. Every single one is packed with practical insight you can apply that same day.',5,'instagram',1)`);
  console.log('  Testimonials (6)');

  // ── FAQs ─────────────────────────────────────────────────────────────
  await c.query(`INSERT INTO faqs (question,answer,category,sort_order,is_published) VALUES
    ('Are the courses Islamically aligned?','Yes. All content is developed through an Islamic lens, drawing from Quran, Sunnah, and classical scholarship.','General',1,1),
    ('Do I need to be married to join?','Most courses are open to both single and married sisters. Pre-Nikah courses are for sisters planning to marry soon.','Eligibility',2,1),
    ('How do I access my course after purchase?','After payment your course appears in your dashboard immediately. Lessons are available 24/7 and never expire.','Courses',3,1),
    ('Can my husband attend the Couples Retreat?','Yes — the Couples Retreat is designed for both spouses. Select a Couple Pass when registering.','Events',4,1),
    ('Is there a money-back guarantee?','Yes. 7-day satisfaction guarantee on digital courses. For events, refunds up to 14 days before the date.','Payments',5,1),
    ('Will sessions be recorded?','MTalks Live sessions include replay access. In-person retreats are not recorded to maintain participant privacy.','Events',6,1),
    ('How do I reset my password?','Click Forgot Password on the login page, enter your email, and use the 6-digit code we send to set a new password.','Account',7,1),
    ('How do I contact support?','Use the Contact page or WhatsApp link. Coach Madinah is available for booked consultations.','General',8,1)`);
  console.log('  FAQs (8)');

  // ── Settings ─────────────────────────────────────────────────────────
  await c.query(`INSERT INTO settings (\`key\`,\`value\`) VALUES
    ('site_name','Muhsinah Academy'),
    ('site_tagline','Where Muslim Marriages Thrive'),
    ('contact_email','info@muhsinahacademy.com'),
    ('contact_phone','+234 800 000 0000'),
    ('whatsapp_number','+2348000000000'),
    ('calendly_url','https://calendly.com/madeenahsanni'),
    ('instagram_url','https://instagram.com/muhsinahacademy'),
    ('facebook_url','https://facebook.com/muhsinahacademy'),
    ('crisp_website_id',''),
    ('paystack_enabled','1')
    ON DUPLICATE KEY UPDATE \`value\`=VALUES(\`value\`)`);
  console.log('  Settings (10)');

  // ── Gallery ───────────────────────────────────────────────────────────
  await c.query(`INSERT INTO gallery_images (url,caption,folder,sort_order,is_published) VALUES
    ('https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&q=80&auto=format','Couples Retreat Abuja 2024','Events',1,1),
    ('https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80&auto=format','MTalks Live Session','Events',2,1),
    ('https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80&auto=format','Pre-Nikah Workshop Lagos','Events',3,1),
    ('https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80&auto=format','Coach Madinah Speaking','Team',4,1),
    ('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80&auto=format','Group Coaching Session','Events',5,1),
    ('https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80&auto=format','Sisters Healing Workshop','Events',6,1),
    ('https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=800&q=80&auto=format','Coaching Moment','Coaching',7,1),
    ('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80&auto=format','MTalks Online Programme','Online',8,1)`);
  console.log('  Gallery (8)');

  // ── Bot knowledge ─────────────────────────────────────────────────────
  await c.query(`INSERT INTO bot_knowledge (question,answer,category) VALUES
    ('What courses do you offer?','We offer 5 courses: Love Language (free), God-Centred Marriage, Emotional Intelligence, Healing After Heartbreak, and Communication Mastery.','Courses'),
    ('How much do courses cost?','Our Love Language course is free. Others range from NGN 20,000 to NGN 35,000.','Pricing'),
    ('How do I contact Coach Madinah?','Book a consultation via our Services page or reach out on WhatsApp from the Contact page.','Contact'),
    ('Is there a refund policy?','Yes — 7-day guarantee on courses. Event refunds available up to 14 days before the date.','Payments'),
    ('When is the next event?','Visit our Events page for all upcoming programmes and to register.','Events'),
    ('Can men attend?','Couples events welcome both spouses. Some programmes are exclusively for sisters.','Eligibility'),
    ('What is MTalks Live?','MTalks Live is our regular live coaching session where Coach Madinah addresses specific marriage topics in real time.','Events'),
    ('How do I reset my password?','Use Forgot Password on the login page. Enter your email and use the 6-digit code we send you.','Account')`);
  console.log('  Bot knowledge (8)');

  // ── Init sync settings ────────────────────────────────────────────────
  await c.query(`INSERT IGNORE INTO sync_settings (id) VALUES (1)`).catch(()=>{});
  console.log('  Sync settings initialised');

  await c.end();
  console.log('\nSeed complete!\n');
  console.log('  Admin:   admin@muhsinahacademy.com / Admin@1234');
  console.log('  Student: fatima.alamin@demo.com / Student@1234\n');
}

seed().catch(e => { console.error('Seed failed:', e.message); process.exit(1); });
