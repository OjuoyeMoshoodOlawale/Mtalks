/**
 * Muhsinah Academy — Seed Script
 * Run from project root: node database/seed.js
 */
const path = require('path');
const SERVER = path.join(__dirname, '..', 'server');
process.env.NODE_PATH = path.join(SERVER, 'node_modules');
require('module').Module._initPaths();
require('dotenv').config({ path: path.join(SERVER, '.env') });

const bcrypt = require('bcryptjs');
const mysql  = require('mysql2/promise');

async function seed() {
  const c = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASS     || '',
    database: process.env.DB_NAME     || 'mtalks_db',
    multipleStatements: true,
  });
  console.log('\nConnected.\n');

  /* CLEAR */
  await c.query(`SET FOREIGN_KEY_CHECKS=0;
    TRUNCATE lesson_progress; TRUNCATE eval_attempts; TRUNCATE eval_questions;
    TRUNCATE evaluations;     TRUNCATE enrollments;   TRUNCATE event_registrations;
    TRUNCATE payments;        TRUNCATE lessons;        TRUNCATE modules;
    TRUNCATE courses;         TRUNCATE event_packages; TRUNCATE events;
    TRUNCATE team_members;    TRUNCATE testimonials;   TRUNCATE faqs;
    TRUNCATE otp_tokens;      TRUNCATE users;          TRUNCATE contacts;
    TRUNCATE certificates;    TRUNCATE bot_knowledge;  TRUNCATE gallery_images;
    TRUNCATE settings;        TRUNCATE error_logs;
    SET FOREIGN_KEY_CHECKS=1;`);

  const hash = async (p) => bcrypt.hash(p, 10);
  const [adm, stu] = await Promise.all([hash('Admin@1234'), hash('Student@1234')]);

  /* 1. USERS */
  await c.query(`INSERT INTO users (name,email,password,role,is_verified,is_active) VALUES
    ('Madinah Sanni',        'admin@muhsinahacademy.com', '${adm}', 'admin',   1,1),
    ('Fatima Abdullahi',     'fatima.abdullahi@demo.com', '${stu}', 'student', 1,1),
    ('Aisha Ibrahim',        'aisha.ibrahim@demo.com',    '${stu}', 'student', 1,1),
    ('Zainab Umar',          'zainab.umar@demo.com',      '${stu}', 'student', 1,1),
    ('Maryam Bello',         'maryam.bello@demo.com',     '${stu}', 'student', 1,1),
    ('Khadijah Okonkwo',     'khadijah.okonkwo@demo.com', '${stu}', 'student', 1,1),
    ('Aminat Lawal',         'aminat.lawal@demo.com',     '${stu}', 'student', 1,1);`);
  console.log('Users (7)');

  /* 2. COURSES */
  await c.query(`INSERT INTO courses
    (title,slug,description,thumbnail,price,is_free,is_published) VALUES
    ('Understanding Your Love Language',
     'understanding-your-love-language',
     'Discover the 5 love languages and transform how you give and receive love. You will finally understand why your spouse does what they do — and why your own needs have gone unmet. This free course is the starting point for every healthy relationship.',
     'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800',0,1,1),
    ('Marriage Foundation Masterclass',
     'marriage-foundation-masterclass',
     'Build an unshakeable marriage from the ground up. Covers compatibility, communication, conflict resolution, financial partnership, and creating a shared vision as a couple rooted in your deen. The most comprehensive Muslim marriage course in Nigeria.',
     'https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?w=800',25000,0,1),
    ('Emotional Intelligence for Couples',
     'emotional-intelligence-for-couples',
     'Emotional intelligence is the hidden key to lasting love. Learn to identify, regulate and channel your emotions — so you respond thoughtfully instead of reacting, and your home becomes a place of genuine peace.',
     'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=800',15000,0,1),
    ('Healing After Heartbreak',
     'healing-after-heartbreak',
     'A free, guided journey through grief, rejection and emotional recovery. Whether from a broken engagement, divorce or a painful relationship — this course helps you heal completely and rebuild before stepping into your next season.',
     'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800',0,1,1),
    ('Communication in Marriage',
     'communication-in-marriage',
     'Master difficult conversations, active listening, and expressing needs without conflict. Poor communication quietly destroys marriages; great communication quietly saves them. This course gives you the tools.',
     'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800',20000,0,1);`);
  console.log('Courses (5)');

  /* 3. MODULES */
  await c.query(`INSERT INTO modules (course_id,title,sort_order) VALUES
    (1,'Foundations of Love in Islam',1),(1,'What Your Spouse Truly Needs',2),
    (2,'Before You Say I Do',1),(2,'Building Your Marriage on Solid Ground',2),(2,'Marriage in a Changing World',3),
    (3,'Inner Peace and Self-Regulation',1),(3,'Guarding and Growing Your Heart',2),
    (4,'Understanding the Broken Heart',1),(4,'The Journey Back to Wholeness',2),
    (5,'What Great Communication Looks Like',1),(5,'Resolving Conflict the Right Way',2);`);
  console.log('Modules (11)');

  /* 4. LESSONS  — Nafisa's Pearlz playlist + Mufti Menk + Yasmin Mogahed + Nouman Ali Khan */
  await c.query(`INSERT INTO lessons
    (module_id,title,drive_file_id,video_type,duration_min,sort_order) VALUES
    (1,'Channel Introduction — Who Is This Course For?',      'SO5_XmzR5NM','youtube',8,1),
    (1,'Best Advice Before Marriage In Islam',                'zgr-2o5nLMA','youtube',18,2),
    (2,'What Your Husband Truly Needs',                       'bIeQBPh4NP0','youtube',15,1),
    (2,'What Your Wife Truly Needs',                          'sdqZMxscyE8','youtube',18,2),
    (3,'Who To Marry — Understanding the Quran',              'rdemznPM1S0','youtube',22,1),
    (3,'Selecting a Good Spouse — Mufti Menk',                '83mufaag6PU','youtube',30,2),
    (4,'Marriage and Relationships Part 1 — Mufti Menk',     'JEi4FwFvFUg','youtube',55,1),
    (4,'Marriage and Relationships Part 2 — Mufti Menk',     'q9D5kxnYuQo','youtube',50,2),
    (5,'Marriage in a Changing World — Mufti Menk',           's920tt771bY','youtube',40,1),
    (6,'Break FREE From Toxic Relationships',                  '9tBE1HLVyDw','youtube',18,1),
    (6,'Red Flags That Look Like Green Flags',                'ZC-u7e9XugE','youtube',28,2),
    (7,'Leaving a Toxic Relationship',                        'SxbHHFy0Hf0','youtube',16,1),
    (7,'Breaking the Anxious Attachment Cycle',               'I8XQCATpsh8','youtube',20,2),
    (8,'You Will Find Love Again — Healing After Heartbreak', 'LvU4ahsh2TQ','youtube',22,1),
    (8,'How Do You Deal With Heartbreak? — Yasmin Mogahed',  'Eo4M7DKCM10','youtube',12,2),
    (9,'How To Transform a Broken Heart — Yasmin Mogahed',   'fjx96n-PaAk','youtube',50,1),
    (9,'Healing a Broken Heart — Yasmin Mogahed',            'G_Y8kZa53WI','youtube',25,2),
    (10,'This Is What Marriage Should Be — Nouman Ali Khan', 'XhZY7rzKWhM','youtube',20,1),
    (10,'Challenging Your Spouse with Islam',                  'o2jojfX8AHI','youtube',16,2),
    (11,'Issues in Marriage — Mufti Menk',                   'Lyk_ggupqfk','youtube',35,1),
    (11,'How To Save Your Marriage — Mufti Menk',            'H3pEWpqUhFM','youtube',30,2);`);
  console.log('Lessons (21 — Nafisa Pearlz / Mufti Menk / Yasmin Mogahed / NAK)');

  /* 5. EVENTS */
  await c.query(`INSERT INTO events
    (title,slug,description,banner,type,delivery_mode,venue,whatsapp_link,event_date,deadline,currency,is_published) VALUES
    ('Muhsinah Marriage Summit 2025','muhsinah-marriage-summit-2025',
     'Nigeria''s premier Muslim marriage enrichment summit. Join Coach Madinah Sanni and leading relationship experts for a transformative 2-day experience in Abuja. Connect with hundreds of like-minded couples and singles, gain practical tools grounded in Islamic wisdom, and leave with a renewed vision for your marriage and family life. This is the most impactful marriage event in Nigeria this year.',
     'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200',
     'offline','Transcorp Hilton Abuja, Plot 1096 Aguiyi Ironsi Street, Maitama',
     'https://chat.whatsapp.com/invite/summit2025',
     DATE_ADD(NOW(),INTERVAL 50 DAY),DATE_ADD(NOW(),INTERVAL 47 DAY),1),
    ('Couples Retreat Weekend — Abuja 2025','couples-retreat-weekend-abuja-2025',
     'An intimate 3-day retreat for couples who are ready to reconnect, reset and reignite. Limited to 20 couples only. Guided coaching sessions, couple exercises, evening reflections, and a stunning lakeside setting. No phones, no distractions — just you, your spouse, and the space to truly invest in each other.',
     'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200',
     'offline','Sheraton Abuja Hotel, Ladi Kwali Way, Maitama, Abuja',
     'https://chat.whatsapp.com/invite/retreat2025',
     DATE_ADD(NOW(),INTERVAL 80 DAY),DATE_ADD(NOW(),INTERVAL 77 DAY),1);`);
  console.log('Events (2)');

  /* 6. PACKAGES */
  await c.query(`INSERT INTO event_packages
    (event_id,name,description,price,early_bird_price,early_bird_deadline,capacity) VALUES
    (1,'Individual Pass',
     'Full 2-day access, participant workbook, lunch and refreshments, certificate of attendance',
     15000,10000,DATE_ADD(NOW(),INTERVAL 25 DAY),200),
    (1,'Couple Pass',
     'Two seats, couple workbooks, refreshments for two, couples certificate',
     25000,18000,DATE_ADD(NOW(),INTERVAL 25 DAY),100),
    (1,'VIP Couple Pass',
     'Front-row seats, private dinner with Coach Madinah, premium gift pack, framed certificate, post-event 1hr consultation session',
     60000,45000,DATE_ADD(NOW(),INTERVAL 15 DAY),15),
    (2,'Standard Room',
     '3 nights shared accommodation, all meals included, all retreat sessions, workbook and materials',
     80000,65000,DATE_ADD(NOW(),INTERVAL 35 DAY),10),
    (2,'Deluxe Suite',
     '3 nights private suite, all meals, all sessions, couples spa treatment, premium welcome gift box',
     150000,120000,DATE_ADD(NOW(),INTERVAL 30 DAY),10);`);
  console.log('Packages (5)');

  /* 7. TEAM */
  await c.query(`INSERT INTO team_members
    (name,role,bio,photo,sort_order,is_active) VALUES
    ('Coach Madinah Sanni','Founder and Lead Coach',
     'Coach Madinah Sanni is a certified life and marriage coach with over 10 years of experience transforming relationships across Nigeria. She founded Muhsinah Academy to make expert, faith-centred relationship coaching accessible to every Muslim woman and couple regardless of where they are on their journey.',
     '/images/team/coach-madinah.jpg',1,1),
    ('Ustadh Khalid Bello','Marriage Counsellor',
     'Ustadh Khalid combines deep Islamic scholarship with modern counselling frameworks. He has facilitated over 200 pre-marital and marital sessions and is a trusted voice on family values in the Nigerian Muslim community.',
     'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',2,1),
    ('Habibah Lawal','Programme Coordinator',
     'Habibah oversees all academy programmes, student support and event logistics. She ensures every student experience — from enrolment to certificate — is smooth, well-supported, and genuinely impactful.',
     'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400',3,1);`);
  console.log('Team (3)');

  /* 8. TESTIMONIALS */
  await c.query(`INSERT INTO testimonials
    (client_name,client_photo,content,rating,source,is_published) VALUES
    ('Fatima and Yusuf Adeyemi',
     'https://images.unsplash.com/photo-1590086782957-93c06ef21604?w=200',
     'We came to the Marriage Foundation Masterclass on the verge of separation after 7 years together. The course gave us a shared language and tools we actually use every single day. Coach Madinah has an extraordinary ability to make complex emotional dynamics simple and actionable. Our home is genuinely a different place now. Alhamdulillah.',
     5,'course',1),
    ('Aminat Okafor',
     'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200',
     'I attended the Marriage Summit as a single professional woman simply out of curiosity. I left with more clarity about what I want in a partner — and what I need to work on in myself — than I had found in five years of searching. The summit is worth every naira and I have already booked my spot for next year.',
     5,'event',1),
    ('Ibrahim Suleiman',
     'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
     'My wife and I were repeating the same arguments every month without resolution. After the Communication in Marriage course, we have a process that actually works. We resolve things now. This course has been worth more than years of trying to figure it out alone.',
     5,'course',1),
    ('Khadijah Hassan Bello',
     'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200',
     'The Healing After Heartbreak course found me at my lowest point after a broken engagement. I was completely shattered. This free course gave me a real framework for healing. I feel like myself again — actually better than before. I cannot believe something this powerful is offered completely free.',
     5,'course',1),
    ('Dr Rasheed and Ronke Afolabi',
     'https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?w=200',
     'The Couples Retreat was the single best investment we have made in our 11-year marriage. Three days away from our phones, our children, and the noise of daily life — just focused entirely on each other. The sessions were powerful and the space Coach Madinah created felt completely safe.',
     5,'event',1),
    ('Falmata Garba',
     'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200',
     'Before this course I would shut down completely whenever my husband and I had any disagreement. Emotional Intelligence for Couples taught me to name what I am feeling and to respond instead of react. My husband commented on the change before I even told him what I had been learning.',
     5,'course',1),
    ('Adebayo and Sadia Nwosu',
     'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200',
     'I was the sceptical husband my wife brought along to the Love Language course. Now I understand completely why certain things matter so much to her and why things I neglected were quietly hurting her. We have transformed how we show up for each other. My advice to every husband — take this course.',
     5,'course',1),
    ('Safiya Mohammed Dantata',
     'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200',
     'My private consultation with Coach Madinah gave me more clarity in 60 minutes than I had found in years of journalling and confused prayer. She listens without any judgement and gives guidance that is both practical and deeply rooted in our faith. Booking that session was the best decision I made this year.',
     5,'manual',1);`);
  console.log('Testimonials (8)');

  /* 9. FAQS */
  await c.query(`INSERT INTO faqs (question,answer,category,sort_order,is_published) VALUES
    ('Are the courses suitable for singles or only married couples?',
     'Our courses are designed for everyone — singles preparing for marriage, engaged couples, newlyweds, and long-married couples. Each course page specifies who it is best suited for so you can choose what fits your current season.',
     'Courses',1,1),
    ('How do I access my course after paying?',
     'Once payment is confirmed, your course appears in your Student Dashboard under My Courses. You also receive a confirmation email. Log in and start immediately — no waiting.',
     'Courses',2,1),
    ('Are the courses self-paced?',
     'Yes, completely. All courses are 100% self-paced with no deadlines. You can pause, resume, and revisit any lesson as many times as you like. Your progress is saved automatically.',
     'Courses',3,1),
    ('Do I need an account to register for an event?',
     'No. You can register and pay for any event without creating an account. Just enter your name and email address at checkout and your QR-coded ticket is sent straight to your inbox.',
     'Events',4,1),
    ('What payment methods are accepted?',
     'We accept all Nigerian debit and credit cards and bank transfers through Paystack — Nigeria''s most trusted payment gateway. All transactions are fully encrypted.',
     'Payments',5,1),
    ('Can I get a refund if I am not satisfied?',
     'Yes. We offer a 7-day satisfaction guarantee on all paid courses. Contact madeenahsanni@gmail.com within 7 days of purchase for a full refund — no questions asked.',
     'Payments',6,1),
    ('How does a private consultation work?',
     'Book directly from the Consultation page using the Calendly link. You receive a secure video call link by email. Sessions are 60 minutes, completely confidential, and available for individuals and couples.',
     'Consultation',7,1),
    ('How do I receive my event ticket?',
     'Your QR-coded ticket is emailed immediately after payment is confirmed. Show it at the event entrance for check-in. Check your spam folder if it does not arrive within 5 minutes.',
     'Events',8,1),
    ('Can I transfer my event ticket to someone else?',
     'Yes. Tickets are non-refundable but fully transferable. Contact us at least 48 hours before the event to transfer your ticket at no charge.',
     'Events',9,1),
    ('Is my personal information kept private?',
     'Absolutely. We comply fully with Nigeria''s NDPR data protection regulations. Your information is never sold or shared with any third party.',
     'General',10,1);`);
  console.log('FAQs (10)');

  /* 10. SETTINGS */
  await c.query(`INSERT INTO settings (\`key\`,\`value\`) VALUES
    ('site_name',       'Muhsinah Academy'),
    ('site_tagline',    'Helping Muslim Sisters and Couples Build Stronger, Healthier Relationships'),
    ('site_email',      'madeenahsanni@gmail.com'),
    ('whatsapp_number', '2348039632700'),
    ('calendly_url',    'https://calendly.com/madeenahsanni'),
    ('instagram_url',   'https://instagram.com/muhsinahacademy'),
    ('facebook_url',    'https://facebook.com/muhsinahacademy'),
    ('twitter_url',     'https://twitter.com/muhsinahacademy'),
    ('crisp_website_id',''),
    ('site_address',    'Maitama, Abuja, FCT, Nigeria')
    ON DUPLICATE KEY UPDATE \`value\`=VALUES(\`value\`);`);
  console.log('Settings');

  /* 11. ENROLLMENTS */
  await c.query(`INSERT IGNORE INTO enrollments (user_id,course_id,enrolled_at) VALUES
    (2,1,DATE_SUB(NOW(),INTERVAL 20 DAY)),(2,4,DATE_SUB(NOW(),INTERVAL 18 DAY)),
    (2,2,DATE_SUB(NOW(),INTERVAL 5  DAY)),(3,1,DATE_SUB(NOW(),INTERVAL 30 DAY)),
    (3,4,DATE_SUB(NOW(),INTERVAL 25 DAY)),(4,4,DATE_SUB(NOW(),INTERVAL 12 DAY)),
    (4,3,DATE_SUB(NOW(),INTERVAL 8  DAY)),(5,1,DATE_SUB(NOW(),INTERVAL 45 DAY)),
    (5,5,DATE_SUB(NOW(),INTERVAL 15 DAY)),(6,2,DATE_SUB(NOW(),INTERVAL 10 DAY)),
    (7,1,DATE_SUB(NOW(),INTERVAL 3  DAY));`);
  console.log('Enrollments (11)');

  /* 12. PAYMENTS — including guest payments */
  const ref = () => 'DEMO' + Date.now() + Math.random().toString(36).slice(2,6).toUpperCase();
  await c.query(`INSERT INTO payments
    (user_id,guest_name,guest_email,type,item_id,amount,reference,status,paid_at) VALUES
    (2,NULL,NULL,'course',2,25000,'${ref()}','success',DATE_SUB(NOW(),INTERVAL 5  DAY)),
    (4,NULL,NULL,'course',3,15000,'${ref()}','success',DATE_SUB(NOW(),INTERVAL 8  DAY)),
    (5,NULL,NULL,'course',5,20000,'${ref()}','success',DATE_SUB(NOW(),INTERVAL 15 DAY)),
    (6,NULL,NULL,'course',2,18000,'${ref()}','success',DATE_SUB(NOW(),INTERVAL 10 DAY)),
    (NULL,'Amira Hassan',     'amira.hassan@gmail.com',  'event',1,10000,'${ref()}','success',DATE_SUB(NOW(),INTERVAL 7 DAY)),
    (3,   NULL,               NULL,                       'event',1,25000,'${ref()}','success',DATE_SUB(NOW(),INTERVAL 12 DAY)),
    (NULL,'Dr Bilal Usman',   'bilal.usman@yahoo.com',   'event',1,45000,'${ref()}','success',DATE_SUB(NOW(),INTERVAL 3 DAY));`);
  console.log('Payments (7 — 2 guest, 5 registered)');

  /* 13. EVENT REGISTRATIONS */
  await c.query(`INSERT INTO event_registrations
    (user_id,guest_name,guest_email,event_id,package_id,ticket_code,registered_at) VALUES
    (NULL,'Amira Hassan',   'amira.hassan@gmail.com', 1,1,'TKT-GUEST-00A',DATE_SUB(NOW(),INTERVAL 7 DAY)),
    (3,   NULL,              NULL,                      1,2,'TKT-REGST-00B',DATE_SUB(NOW(),INTERVAL 12 DAY)),
    (NULL,'Dr Bilal Usman', 'bilal.usman@yahoo.com',  1,3,'TKT-GUEST-00C',DATE_SUB(NOW(),INTERVAL 3 DAY));`);
  console.log('Event registrations (3 — 2 guest, 1 account)');

  /* 14. LESSON PROGRESS */
  await c.query(`INSERT IGNORE INTO lesson_progress (user_id,lesson_id,completed_at) VALUES
    (2,1,DATE_SUB(NOW(),INTERVAL 19 DAY)),(2,2,DATE_SUB(NOW(),INTERVAL 18 DAY)),
    (2,3,DATE_SUB(NOW(),INTERVAL 17 DAY)),(2,4,DATE_SUB(NOW(),INTERVAL 16 DAY)),
    (3,1,DATE_SUB(NOW(),INTERVAL 29 DAY)),(3,2,DATE_SUB(NOW(),INTERVAL 28 DAY)),
    (3,3,DATE_SUB(NOW(),INTERVAL 27 DAY)),
    (5,1,DATE_SUB(NOW(),INTERVAL 44 DAY)),(5,2,DATE_SUB(NOW(),INTERVAL 43 DAY)),
    (5,3,DATE_SUB(NOW(),INTERVAL 42 DAY)),(5,4,DATE_SUB(NOW(),INTERVAL 41 DAY));`);
  console.log('Lesson progress (11 entries)');

  /* 15. CONTACTS — realistic Nigerian messages */
  await c.query(`INSERT INTO contacts (name,email,subject,message,is_read,created_at) VALUES
    ('Amina Yusuf Dankwai','amina.yusuf@gmail.com',
     'Question about the Marriage Foundation course',
     'Assalamu alaikum Coach Madinah. I would like to know if the Marriage Foundation Masterclass is suitable for someone who got married 6 months ago. We are still adjusting and I want to make sure we build the right habits from the beginning. JazakAllahu khayran.',
     0,DATE_SUB(NOW(),INTERVAL 1 DAY)),
    ('Alhaji Ibrahim Tambari','ibrahim.tambari@hotmail.com',
     'Interested in bringing the summit to Kano',
     'Salam alaikum. The Muhsinah Marriage Summit looks incredible. Are there plans to bring it to Kano or other northern cities? We have a large community here that would benefit greatly and I would like to explore the possibility of sponsoring or co-hosting a similar event.',
     0,DATE_SUB(NOW(),INTERVAL 3 DAY)),
    ('Dr Ronke Adeleke','ronke.adeleke@ui.edu.ng',
     'Research collaboration enquiry',
     'Good day Coach Madinah. I am a Family Studies researcher at the University of Ibadan working on a study of digital relationship education in Nigeria. Muhsinah Academy is one of the platforms I would like to feature. Would you be open to a short interview?',
     0,DATE_SUB(NOW(),INTERVAL 5 DAY)),
    ('Fatima Al-Hassan','fatima.alhassan@ngo.org',
     'Bulk course access for our women''s NGO',
     'Assalamu alaikum. I run a women''s empowerment NGO in Kaduna and regularly work with young married women. We would love to purchase access to your courses for a cohort of 30 women. Do you offer group or NGO pricing? This would make a tremendous difference.',
     1,DATE_SUB(NOW(),INTERVAL 8 DAY)),
    ('Usman Musa Garba','usman.garba@outlook.com',
     'Technical issue — cannot access course lessons',
     'Hello. I purchased the Communication in Marriage course 3 days ago but when I log in I can only see the module titles and not the video lessons. Please help. I am very eager to start.',
     1,DATE_SUB(NOW(),INTERVAL 10 DAY));`);
  console.log('Contacts (5)');

  /* 16. BOT KNOWLEDGE */
  await c.query(`INSERT INTO bot_knowledge (topic,keywords,answer) VALUES
    ('Greeting','hello,hi,salam,assalamu,hey,good morning,good afternoon,good evening',
     'Wa alaikum salam! I am Muzzamil, the Muhsinah Academy assistant. I can help with information about our courses, events, consultations, payments, and certificates. How can I help you today?'),
    ('Courses','course,courses,learn,lesson,class,study,enrol,enroll,masterclass,module',
     'We offer self-paced online courses on marriage, relationships, and personal development — some free, some paid. Once enrolled you have lifetime access. Browse all courses on the Courses page.'),
    ('Events','event,events,summit,retreat,workshop,ticket,seminar,register,attend',
     'We host live events including the Muhsinah Marriage Summit and Couples Retreats. You can register and pay without creating an account — just enter your name and email and your ticket is sent straight to you.'),
    ('Consultation','consult,consultation,session,booking,book,appointment,coach,private,one on one',
     'Book a private confidential session with Coach Madinah from the Consultation page. Sessions are 60 minutes via video call and available for individuals and couples.'),
    ('Payment','pay,payment,paystack,card,transfer,price,cost,fee,naira,refund',
     'We accept all Nigerian debit cards and bank transfers through Paystack. Paid courses have a 7-day satisfaction guarantee. You do not need an account to pay for events.'),
    ('Certificates','certificate,cert,completion,award,diploma',
     'Complete 100% of a course and you can claim a verified digital certificate with a unique code. Employers can verify it at the certificate verification page.'),
    ('Contact','contact,email,phone,whatsapp,reach,support,help',
     'Reach the team via the Contact page or WhatsApp. For private matters email madeenahsanni@gmail.com and the team will respond within 24 hours insha Allah.'),
    ('About','about,who,madinah,sanni,founder,academy,muhsinah',
     'Muhsinah Academy was founded by Coach Madinah Sanni, a certified life and marriage coach with over 10 years of experience. Her mission is to help Muslim women and couples build stronger, healthier relationships through Islamic wisdom and modern coaching.');`);
  console.log('Bot knowledge (8)');

  await c.end();
  console.log(`
============================================
  SEED COMPLETE

  ADMIN
  Email    : admin@muhsinahacademy.com
  Password : Admin@1234

  DEMO STUDENTS (all use Student@1234)
  fatima.abdullahi@demo.com
  aisha.ibrahim@demo.com
  zainab.umar@demo.com

  PLATFORM OVERVIEW
  5 courses | 11 modules | 21 lessons
  2 events  | 5 packages | 11 enrollments
  3 event registrations (2 guests, no account)
  5 realistic contact enquiries
  8 client testimonials
============================================
`);
}

seed().catch(err => { console.error('Seed failed:', err.message); process.exit(1); });
