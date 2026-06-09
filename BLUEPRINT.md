# MTalks — Life & Marriage Coaching Platform
## Engineering Blueprint · Version 1.0

**Client:** Coach Madinah Sanni — MTalks Life and Marriage Coaching, Abuja, Nigeria
**Website:** [www.muhsinahacademy.com](https://www.muhsinahacademy.com)
**Tagline:** *Helping Muslim Sisters and Couples Build Stronger, Healthier, and Lasting Relationships.*
**Repository:** `OjuoyeMoshoodOlawale/Mtalks`
**Tech Stack:** Vue 3 + Vite · Express.js · MySQL · Paystack · JWT · Three.js · GSAP · Nodemailer

---

## 1. Problem Statement

Coach Madinah serves a large and growing client base with real relationship and marriage challenges. She currently faces:

| Problem | Impact |
|---|---|
| WhatsApp messages flooding her personal number | Burnout, slow response, no message tracking |
| Phone number visible to the public | Privacy and safety risk |
| No structured way to sell & deliver coaching courses | Lost revenue, manual onboarding |
| No event registration system | Clients miss deadlines, manual confirmations |
| Repeating the same answers to hundreds of clients | Wastes her time, inconsistent responses |
| No team collaboration workflow | Bottleneck at every interaction |
| No performance visibility | Cannot measure revenue, growth, or retention |

**Our solution** replaces all of this with a single, self-managed platform she can run herself — with no developer needed for day-to-day operations.

---

## 2. Brand Identity

### Colours
```css
:root {
  --ma-green:       #76C442;  /* Primary — buttons, highlights, icons          */
  --ma-green-deep:  #1D6B1D;  /* Headings, links, active states                */
  --ma-green-dark:  #0D3B15;  /* Navbar, footer, dark section backgrounds      */
  --ma-green-mid:   #4A9E2C;  /* Hover states, borders, dividers               */
  --ma-green-tint:  #EBF7DC;  /* Light section backgrounds, card fills         */
  --ma-gold:        #F0C130;  /* Accent — badges, star ratings, price tags     */
  --ma-gold-tint:   #FDF4D0;  /* Gold badge backgrounds, testimonial cards     */
  --ma-white:       #FFFFFF;  /* Page backgrounds, card surfaces               */
  --ma-off-white:   #F5F7F2;  /* Alternate section backgrounds                 */
  --ma-text:        #1A2B1A;  /* All body copy                                 */
}
```

### Typography
- **Headings:** Playfair Display (Google Font) — elegant, premium, Islamic-brand feel
- **Body / UI:** DM Sans (Google Font) — clean, readable, professional
- **Monospace / code:** JetBrains Mono (error logs, admin only)

### Animation Library
- **Three.js** — WebGL 3D hero animation (geometric particle ring in brand green)
- **GSAP + ScrollTrigger** — section entrance animations, timeline reveals
- **Lucide Icons** — standard icon library (no emoji, no AI stickers)
- **CSS transitions** — micro-interactions (hover, focus, loading spinners)

---

## 3. Full Feature Specification

### 3.1 Public Website

#### Hero Section (3D)
- Full-viewport Three.js scene: rotating geometric mesh (toroidal/ring shape) in `--ma-green` particle field
- GSAP-driven headline typewriter entrance
- Two CTAs: **Book a Consultation** → Calendly | **Explore Courses** → /courses
- Subtle watercolor-style green gradient overlay (CSS only, not WebGL) matching the brand flyer

#### Navigation
- Sticky transparent-to-solid on scroll
- Desktop: Logo · Home · About · Services · Courses · Events · Blog · Contact
- Mobile: hamburger drawer with the same links
- CTA button: "Book Now" in `--ma-green`
- No phone number in the nav — contact goes through the form only

#### About the Founder
- Professional photo (Unsplash placeholder, replaceable)
- 15+ years bio — Coach Madinah Sanni
- Animated counter: 15+ years · 500+ clients · 4 service areas

#### Why Choose Us (4-column grid)
- Animated icon cards on scroll entrance (GSAP)
- 15+ Years Experience · Hundreds of Clients · Practical Solutions · Trusted Guidance

#### Services Preview
- Card grid: Marriage Coaching · Relationship Coaching · Premarital Counselling · Family Coaching
- Each card links to /services with an anchor

#### Testimonials
- Auto-scrolling testimonial slider (no external JS dependency — pure CSS/GSAP)
- Stars, quote, client name — all admin-controlled via dashboard

#### FAQ + Chatbot
- Accordion FAQ (admin-managed questions and answers from dashboard)
- Crisp chatbot (free tier) embedded as a floating widget
- Crisp selected because it has a free plan, WhatsApp-like feel, no credit card required

#### Events Preview
- Upcoming 2 events shown dynamically from database
- Early bird badge if deadline has not passed
- "View All Events" CTA

#### Calendly Embed
- Inline iframe embed for `/consultation`
- Admin can update the Calendly URL from Settings in dashboard
- No raw phone number visible anywhere on the site

#### Contact Page
- Form: name · email · subject · message · submit
- On submit: server-side email to admin (Nodemailer) + toast confirmation
- WhatsApp contact via link (not number display): `https://wa.me/2348039632700`
- All social media links from admin settings

#### Team Page
- Dynamic team cards from database (admin adds/removes team members)
- Each card: photo · name · role · short bio · social media icons (LinkedIn, Instagram, Twitter/X)

#### Legal Pages (auto-generated, stored as Markdown in DB)
- `/privacy-policy` — data protection, NDPR-compliant
- `/terms-of-service`
- `/cookie-policy`

---

### 3.2 Authentication System

#### Roles
| Role | Access |
|---|---|
| `admin` | Full dashboard + all management features |
| `student` | Student portal — enrolled courses, event tickets, profile |
| `guest` | Public pages only |

#### Flow
1. **Register** → email + password → email verification OTP sent → verify → account active
2. **Login** → email + password → access token (15min) + refresh token (7d, httpOnly cookie)
3. **Forgot password** → OTP to email → reset form → new password
4. **Google OAuth** (Phase 2 enhancement) — optional

#### Security
- `bcrypt` (12 rounds) for password hashing
- JWT access token signed with `RS256` (private key in env)
- Refresh token stored in `httpOnly` `Secure` cookie — not localStorage
- Rate limiting on all auth endpoints (5 req/min)
- Account lockout after 5 failed login attempts (30 min cooldown)

---

### 3.3 Course Platform (LMS)

#### Course Hierarchy
```
Course
  └── Module 1
        ├── Lesson 1 (video + text notes)
        ├── Lesson 2 (video + text notes)
        └── Evaluation (optional MCQ quiz with pass score)
  └── Module 2
        └── ...
```

#### Course Features
- **Free or paid** — admin sets price (₦0 = free, any amount = Paystack payment required)
- **Draft / Published** states — unpublished courses are invisible to students
- **Thumbnail** — uploaded image or Unsplash URL
- **Google Drive video** — admin pastes Drive file ID → lesson renders the embedded player
- **Text notes** — rich text editor (Quill.js) per lesson for supplementary content
- **Lesson progress** — student checks off completed lessons; progress bar shown per module
- **Evaluation/Quiz** — multiple choice questions, pass score (e.g. 70%), unlimited retries
- **Completion certificate** — auto-generated PDF on 100% course completion (Phase 2)

#### Enrolment Flow
1. Student clicks "Enrol Now" on course page
2. If free → direct enrolment + redirect to course player
3. If paid → Paystack inline popup → on `success` callback → backend webhook verifies → enrolment created
4. Email sent: "You are now enrolled in [Course Name]" with access link

---

### 3.4 Events & Live Coaching

#### Event Types
| Type | Details |
|---|---|
| `online` | Zoom/Google Meet link sent in email ticket |
| `offline` | Venue address on ticket (e.g. Meethaq Hotels, Jabi, Abuja) |

#### Event Structure
```
Event
  ├── Title, description, banner image
  ├── Type: online | offline
  ├── Date, time, registration deadline
  ├── Venue (offline) or Meeting link (online)
  ├── WhatsApp group link (sent ONLY after payment verified)
  └── Packages
        ├── Package A (Early Bird) — price, deadline, capacity
        ├── Package B (Standard) — price, capacity
        └── Package C (VIP) — price, capacity, extra perks
```

#### Registration Flow
1. Visitor selects event → chooses package
2. Paystack payment popup → on success → backend verifies webhook
3. Unique ticket generated (UUID-based QR code)
4. Email dispatched:
   - HTML email ticket with QR code
   - Event details (date, time, venue or Zoom link)
   - WhatsApp group link (gated — only in email, not on website)
5. Ticket viewable in student portal under "My Events"

#### Early Bird Logic
- System checks current timestamp against `early_bird_deadline`
- If before deadline and capacity not exhausted → early bird price shown with countdown timer
- If deadline passed → standard price shown, early bird badge hidden

---

### 3.5 Admin Dashboard

#### Overview Analytics
- Total revenue (this month / all time) — bar chart (Chart.js)
- Enrolments trend — line chart
- Event registrations vs capacity — donut chart
- New users this week — metric card
- Course completion rate — metric card

#### Course Management
- Create, edit, delete courses (with confirmation modal)
- Drag-and-drop module/lesson reorder (Vue Draggable)
- Paste Google Drive video link → system extracts embed ID
- Rich text editor for lesson notes (Quill.js)
- Quiz builder: add/edit/delete questions, set pass score

#### Event Management
- Create event with all fields (type, date, packages, banner)
- Edit WhatsApp group link at any time (change link after participants join)
- View registration list with payment status
- Export attendees as CSV

#### Payment Reports
- Table: user · item · amount · reference · date · status
- Filter by date range, type (course/event), status
- Export to CSV
- Paystack reference link to verify

#### User Management
- List all users with role, enrolments, registration date
- Promote to admin / demote to student
- Disable account (soft delete)
- View individual user purchase history

#### Team Management
- Add/edit/remove team members
- Upload photo (or paste URL)
- Set name, role, bio, social links (LinkedIn, Instagram, Twitter, Facebook)
- Drag to reorder display on public team page

#### Testimonials Management
- Add/edit/approve/hide testimonials
- Set name, photo, rating (1–5 stars), testimonial text, source (Google / manual)

#### FAQ Management
- Add/edit/delete FAQ items
- Group by category (General / Courses / Events / Payments)
- Toggle published/hidden

#### Settings Panel
- Site name, tagline, logo upload
- Calendly URL update
- Social media links
- SMTP email settings
- Paystack public/secret key update
- WhatsApp contact number (used for `wa.me` link only — never displayed raw)
- Legal pages editor (Markdown)

#### Error Log Viewer
- Timestamp · Route · Error message · Stack trace
- Filter by date or route
- Auto-cleared logs older than 30 days

---

## 4. Database Schema

```sql
-- Users
CREATE TABLE users (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  email       VARCHAR(180) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  role        ENUM('admin','student') DEFAULT 'student',
  is_verified TINYINT(1) DEFAULT 0,
  is_active   TINYINT(1) DEFAULT 1,
  avatar      VARCHAR(300),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- OTP / verification tokens
CREATE TABLE otp_tokens (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  token       VARCHAR(10) NOT NULL,
  type        ENUM('verify_email','reset_password') NOT NULL,
  expires_at  DATETIME NOT NULL,
  used        TINYINT(1) DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Courses
CREATE TABLE courses (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(200) NOT NULL,
  slug         VARCHAR(220) NOT NULL UNIQUE,
  description  TEXT,
  thumbnail    VARCHAR(300),
  price        DECIMAL(10,2) DEFAULT 0.00,
  is_free      TINYINT(1) DEFAULT 0,
  is_published TINYINT(1) DEFAULT 0,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Modules
CREATE TABLE modules (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id   INT UNSIGNED NOT NULL,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  sort_order  SMALLINT DEFAULT 0,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Lessons
CREATE TABLE lessons (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  module_id    INT UNSIGNED NOT NULL,
  title        VARCHAR(200) NOT NULL,
  drive_file_id VARCHAR(100),
  content      LONGTEXT,
  duration_min SMALLINT DEFAULT 0,
  sort_order   SMALLINT DEFAULT 0,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- Evaluations (quiz per module)
CREATE TABLE evaluations (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  module_id   INT UNSIGNED NOT NULL,
  title       VARCHAR(200) NOT NULL,
  pass_score  TINYINT DEFAULT 70,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- Quiz questions
CREATE TABLE eval_questions (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  evaluation_id  INT UNSIGNED NOT NULL,
  question       TEXT NOT NULL,
  options        JSON NOT NULL,
  correct_index  TINYINT NOT NULL,
  FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE
);

-- Enrollments
CREATE TABLE enrollments (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  course_id   INT UNSIGNED NOT NULL,
  payment_id  INT UNSIGNED,
  enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_enroll (user_id, course_id),
  FOREIGN KEY (user_id)   REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id)  ON DELETE CASCADE
);

-- Lesson progress
CREATE TABLE lesson_progress (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED NOT NULL,
  lesson_id    INT UNSIGNED NOT NULL,
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_progress (user_id, lesson_id),
  FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

-- Evaluation attempts
CREATE TABLE eval_attempts (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED NOT NULL,
  evaluation_id INT UNSIGNED NOT NULL,
  score         TINYINT NOT NULL,
  passed        TINYINT(1) NOT NULL,
  attempted_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)       REFERENCES users(id)       ON DELETE CASCADE,
  FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE
);

-- Events
CREATE TABLE events (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title            VARCHAR(200) NOT NULL,
  slug             VARCHAR(220) NOT NULL UNIQUE,
  description      TEXT,
  banner           VARCHAR(300),
  type             ENUM('online','offline') DEFAULT 'online',
  venue            VARCHAR(300),
  meeting_link     VARCHAR(500),
  whatsapp_link    VARCHAR(500),
  event_date       DATETIME NOT NULL,
  deadline         DATETIME NOT NULL,
  is_published     TINYINT(1) DEFAULT 0,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Event packages (early bird, standard, VIP)
CREATE TABLE event_packages (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id            INT UNSIGNED NOT NULL,
  name                VARCHAR(100) NOT NULL,
  description         TEXT,
  price               DECIMAL(10,2) NOT NULL,
  early_bird_price    DECIMAL(10,2),
  early_bird_deadline DATETIME,
  capacity            SMALLINT DEFAULT 100,
  perks               JSON,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Event registrations
CREATE TABLE event_registrations (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED NOT NULL,
  event_id     INT UNSIGNED NOT NULL,
  package_id   INT UNSIGNED NOT NULL,
  payment_id   INT UNSIGNED,
  ticket_code  VARCHAR(64) NOT NULL UNIQUE,
  attended_at  DATETIME,
  registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)           ON DELETE CASCADE,
  FOREIGN KEY (event_id)   REFERENCES events(id)          ON DELETE CASCADE,
  FOREIGN KEY (package_id) REFERENCES event_packages(id)  ON DELETE CASCADE
);

-- Payments (all transactions in one table)
CREATE TABLE payments (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  type       ENUM('course','event') NOT NULL,
  item_id    INT UNSIGNED NOT NULL,
  amount     DECIMAL(10,2) NOT NULL,
  reference  VARCHAR(100) NOT NULL UNIQUE,
  status     ENUM('pending','success','failed','refunded') DEFAULT 'pending',
  metadata   JSON,
  paid_at    DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Team members
CREATE TABLE team_members (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(120) NOT NULL,
  role         VARCHAR(100),
  bio          TEXT,
  photo        VARCHAR(300),
  social_links JSON,
  sort_order   SMALLINT DEFAULT 0,
  is_active    TINYINT(1) DEFAULT 1
);

-- Testimonials
CREATE TABLE testimonials (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  client_name  VARCHAR(120) NOT NULL,
  client_photo VARCHAR(300),
  content      TEXT NOT NULL,
  rating       TINYINT DEFAULT 5,
  source       VARCHAR(50) DEFAULT 'manual',
  is_published TINYINT(1) DEFAULT 0,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- FAQ
CREATE TABLE faqs (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  category    VARCHAR(80) DEFAULT 'General',
  sort_order  SMALLINT DEFAULT 0,
  is_published TINYINT(1) DEFAULT 1
);

-- Site settings (key-value store)
CREATE TABLE settings (
  `key`       VARCHAR(80) PRIMARY KEY,
  `value`     TEXT,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Error logs
CREATE TABLE error_logs (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  route      VARCHAR(200),
  message    TEXT,
  stack      LONGTEXT,
  user_id    INT UNSIGNED,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created (created_at)
);
```

---

## 5. Project Structure

```
Mtalks/
├── client/                          # Vue 3 + Vite frontend
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── assets/
│   │   │   ├── fonts/
│   │   │   └── styles/
│   │   │       ├── main.css         # CSS variables + reset
│   │   │       └── animations.css   # GSAP helper classes
│   │   ├── components/
│   │   │   ├── common/              # Fully reusable across all views
│   │   │   │   ├── BaseModal.vue    # Confirmation & info modals
│   │   │   │   ├── BaseToast.vue    # Toast notification system
│   │   │   │   ├── BaseButton.vue   # All button variants
│   │   │   │   ├── BaseLoader.vue   # Page + component spinners
│   │   │   │   ├── BaseInput.vue    # Styled form inputs
│   │   │   │   ├── BaseSelect.vue
│   │   │   │   ├── BaseTextarea.vue
│   │   │   │   ├── BasePagination.vue
│   │   │   │   ├── BaseEmptyState.vue
│   │   │   │   └── BaseAvatar.vue
│   │   │   ├── layout/
│   │   │   │   ├── PublicHeader.vue
│   │   │   │   ├── PublicFooter.vue
│   │   │   │   ├── AdminSidebar.vue
│   │   │   │   ├── AdminHeader.vue
│   │   │   │   └── StudentLayout.vue
│   │   │   ├── public/
│   │   │   │   ├── HeroCanvas.vue   # Three.js 3D scene
│   │   │   │   ├── CourseCard.vue
│   │   │   │   ├── EventCard.vue
│   │   │   │   ├── TestimonialSlider.vue
│   │   │   │   ├── FaqAccordion.vue
│   │   │   │   ├── StatCounter.vue
│   │   │   │   ├── TeamCard.vue
│   │   │   │   └── ServiceCard.vue
│   │   │   ├── lms/
│   │   │   │   ├── CoursePlayer.vue
│   │   │   │   ├── LessonList.vue
│   │   │   │   ├── ProgressBar.vue
│   │   │   │   ├── QuizWidget.vue
│   │   │   │   └── DriveEmbed.vue
│   │   │   └── admin/
│   │   │       ├── CourseBuilder.vue
│   │   │       ├── ModuleEditor.vue
│   │   │       ├── LessonEditor.vue
│   │   │       ├── QuizBuilder.vue
│   │   │       ├── EventBuilder.vue
│   │   │       ├── PackageEditor.vue
│   │   │       ├── AnalyticsChart.vue
│   │   │       ├── PaymentTable.vue
│   │   │       └── ErrorLogViewer.vue
│   │   ├── views/
│   │   │   ├── public/
│   │   │   │   ├── HomeView.vue
│   │   │   │   ├── AboutView.vue
│   │   │   │   ├── ServicesView.vue
│   │   │   │   ├── CoursesView.vue
│   │   │   │   ├── CourseDetailView.vue
│   │   │   │   ├── EventsView.vue
│   │   │   │   ├── EventDetailView.vue
│   │   │   │   ├── TeamView.vue
│   │   │   │   ├── TestimonialsView.vue
│   │   │   │   ├── ConsultationView.vue
│   │   │   │   ├── ContactView.vue
│   │   │   │   ├── PrivacyPolicyView.vue
│   │   │   │   └── TermsView.vue
│   │   │   ├── auth/
│   │   │   │   ├── LoginView.vue
│   │   │   │   ├── RegisterView.vue
│   │   │   │   ├── VerifyEmailView.vue
│   │   │   │   └── ForgotPasswordView.vue
│   │   │   ├── student/
│   │   │   │   ├── StudentDashboard.vue
│   │   │   │   ├── MyCoursesView.vue
│   │   │   │   ├── CoursePlayerView.vue
│   │   │   │   ├── MyEventsView.vue
│   │   │   │   └── ProfileView.vue
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.vue
│   │   │       ├── CoursesManagement.vue
│   │   │       ├── CourseEditorView.vue
│   │   │       ├── EventsManagement.vue
│   │   │       ├── EventEditorView.vue
│   │   │       ├── UsersManagement.vue
│   │   │       ├── PaymentsView.vue
│   │   │       ├── AnalyticsView.vue
│   │   │       ├── TeamManagement.vue
│   │   │       ├── TestimonialsManagement.vue
│   │   │       ├── FaqManagement.vue
│   │   │       ├── SettingsView.vue
│   │   │       └── ErrorLogsView.vue
│   │   ├── router/
│   │   │   └── index.js             # All routes + meta guards
│   │   ├── stores/
│   │   │   ├── auth.js              # Pinia — user, token, role
│   │   │   ├── ui.js                # Toast queue, modal state, loading
│   │   │   ├── courses.js
│   │   │   └── events.js
│   │   ├── composables/
│   │   │   ├── useToast.js
│   │   │   ├── useModal.js
│   │   │   ├── usePaystack.js       # Paystack inline popup
│   │   │   ├── useThreeHero.js      # Three.js scene setup
│   │   │   └── useGsap.js           # GSAP scroll animations
│   │   ├── services/
│   │   │   └── api.js               # Axios instance + interceptors
│   │   └── App.vue
│   ├── index.html
│   ├── vite.config.js
│   └── .env.example
│
├── server/                          # Express.js backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                # MySQL2 pool
│   │   │   ├── jwt.js               # Sign / verify helpers
│   │   │   └── mailer.js            # Nodemailer transport
│   │   ├── middleware/
│   │   │   ├── auth.js              # verifyToken, requireAdmin
│   │   │   ├── validate.js          # express-validator helpers
│   │   │   ├── errorHandler.js      # Global error handler + DB log
│   │   │   ├── rateLimiter.js       # express-rate-limit configs
│   │   │   └── sanitize.js          # xss-clean + hpp
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── courses.routes.js
│   │   │   ├── modules.routes.js
│   │   │   ├── lessons.routes.js
│   │   │   ├── enrollments.routes.js
│   │   │   ├── events.routes.js
│   │   │   ├── registrations.routes.js
│   │   │   ├── payments.routes.js   # Paystack webhook endpoint
│   │   │   ├── users.routes.js
│   │   │   ├── team.routes.js
│   │   │   ├── testimonials.routes.js
│   │   │   ├── faqs.routes.js
│   │   │   ├── settings.routes.js
│   │   │   ├── analytics.routes.js
│   │   │   └── logs.routes.js
│   │   ├── controllers/             # One controller per domain
│   │   ├── services/
│   │   │   ├── paystack.service.js  # Verify transaction, initialize
│   │   │   ├── email.service.js     # Ticket, receipt, OTP emails
│   │   │   ├── ticket.service.js    # QR code generation (qrcode npm)
│   │   │   └── drive.service.js     # Validate Drive embed ID
│   │   └── utils/
│   │       ├── logger.js            # Winston logger → DB + file
│   │       ├── slugify.js
│   │       └── helpers.js
│   ├── app.js                       # Express app setup
│   └── server.js                    # Entry point
│
├── database/
│   ├── schema.sql                   # Full CREATE TABLE statements
│   └── seed.sql                     # Sample data for development
│
├── docs/
│   ├── api-reference.md             # All endpoints documented
│   ├── deployment.md                # Hosting guide (VPS / cPanel)
│   └── admin-guide.md               # How Coach Madinah manages her platform
│
├── .gitignore
├── .env.example
├── README.md
└── BLUEPRINT.md                     # This file
```

---

## 6. API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Register new account |
| POST | `/api/auth/login` | None | Login, returns tokens |
| POST | `/api/auth/logout` | Token | Clear refresh cookie |
| POST | `/api/auth/refresh` | Cookie | Rotate access token |
| POST | `/api/auth/verify-email` | None | OTP verification |
| POST | `/api/auth/forgot-password` | None | Send OTP |
| POST | `/api/auth/reset-password` | None | Set new password |

### Courses
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/courses` | None | Published courses list |
| GET | `/api/courses/:slug` | None | Single course public view |
| POST | `/api/courses` | Admin | Create course |
| PUT | `/api/courses/:id` | Admin | Update course |
| DELETE | `/api/courses/:id` | Admin | Delete course |
| POST | `/api/courses/:id/modules` | Admin | Add module |
| PUT | `/api/modules/:id/reorder` | Admin | Drag-drop reorder |
| POST | `/api/modules/:id/lessons` | Admin | Add lesson |
| POST | `/api/enrollments` | Student | Enrol in course |
| GET | `/api/enrollments/my` | Student | My enrolled courses |
| POST | `/api/lessons/:id/complete` | Student | Mark lesson done |

### Events
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/events` | None | Published events |
| GET | `/api/events/:slug` | None | Single event |
| POST | `/api/events` | Admin | Create event |
| PUT | `/api/events/:id` | Admin | Update event |
| DELETE | `/api/events/:id` | Admin | Delete event |
| POST | `/api/events/:id/packages` | Admin | Add package |
| POST | `/api/registrations` | Student | Register for event |
| GET | `/api/registrations/my` | Student | My event tickets |

### Payments
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/payments/initialize` | Student | Init Paystack transaction |
| POST | `/api/payments/webhook` | None (HMAC) | Paystack webhook |
| GET | `/api/payments` | Admin | All payment history |
| GET | `/api/payments/my` | Student | My payment history |

### Admin
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/analytics/overview` | Admin | Dashboard stats |
| GET | `/api/analytics/revenue` | Admin | Revenue chart data |
| GET | `/api/users` | Admin | All users |
| PUT | `/api/users/:id/role` | Admin | Change user role |
| GET | `/api/logs` | Admin | Error logs |
| DELETE | `/api/logs/purge` | Admin | Clear old logs |
| GET | `/api/settings` | Admin | All settings |
| PUT | `/api/settings` | Admin | Bulk update settings |

---

## 7. Security Checklist

- [x] All SQL via parameterized queries (mysql2 `?` placeholders) — no string concatenation
- [x] JWT RS256 — private key never in frontend
- [x] Refresh token in httpOnly Secure cookie
- [x] Helmet.js — HTTP security headers
- [x] express-rate-limit — per-IP on auth + payment routes
- [x] xss-clean + hpp — request sanitization
- [x] CORS whitelist — only `muhsinahacademy.com` + localhost
- [x] Paystack webhook HMAC-SHA512 signature verification
- [x] File upload size limits (if image upload added)
- [x] .env never committed — .gitignore enforced
- [x] Error messages never expose stack trace to client (only logged to DB)
- [x] All admin routes double-guarded: `verifyToken` + `requireAdmin`
- [x] NDPR-compliant privacy policy (data protection, Nigerian law)

---

## 8. Third-Party Services

| Service | Purpose | Cost |
|---|---|---|
| Paystack | Course & event payments | Free (% per transaction) |
| Google Drive | Video storage & delivery | Free (15 GB) |
| Nodemailer + SMTP | Transactional emails | Free (Gmail SMTP or Brevo) |
| Crisp | Chatbot & live chat widget | Free tier (unlimited chats) |
| Calendly | Consultation booking | Free tier |
| Three.js | 3D hero animation | Open source |
| GSAP | Scroll animations | Free for non-commercial |
| Quill.js | Rich text editor (lesson notes) | Open source |
| Chart.js | Admin analytics charts | Open source |
| Lucide | Icon library | Open source |
| qrcode (npm) | Event QR ticket generation | Open source |

---

## 9. SEO Strategy

- Server-side meta tags via `vue-meta` (title, description, og:image per page)
- Sitemap auto-generated at `/sitemap.xml`
- Robots.txt — allow all except `/admin/*` and `/api/*`
- Structured data (JSON-LD): `Organization`, `Course`, `Event`, `FAQPage`
- Page load < 3s (lazy load images, code splitting via Vite)
- Alt text on all images
- Semantic HTML throughout (no divs masquerading as headings)

---

## 10. Development Rules & Standards

### Code Quality
- All components < 300 lines — split if larger
- Reusable components first: check `src/components/common/` before writing new UI
- No `js alert()`, `confirm()`, or `prompt()` — use `BaseModal.vue` and `BaseToast.vue`
- No inline styles — all CSS via classes or CSS variables
- All async operations show `BaseLoader.vue` — no unguarded loading states
- Toast on every user action success/fail (3s auto-dismiss)
- Confirmation modal before any destructive action (delete, deactivate)

### Backend Standards
- Every route: validate inputs → sanitize → query → respond
- All DB queries: parameterized arrays only — `db.query('SELECT * FROM users WHERE id = ?', [id])`
- HTTP status codes: 200 OK · 201 Created · 400 Bad Request · 401 Unauth · 403 Forbidden · 404 Not Found · 500 Server Error
- All 500 errors logged to `error_logs` table with route + stack + user_id
- Consistent response shape: `{ success: true, data: {...} }` or `{ success: false, message: '...' }`

### Git Workflow
- Branch per phase: `phase-1-foundation`, `phase-2-public-site`, etc.
- Commit after every meaningful unit of work
- Commit message format: `feat: add course builder` · `fix: correct paystack webhook` · `chore: update env example`
- Push to GitHub on every session end

### Incremental Development
- Each phase is independently deployable
- Database migrations are additive (no destructive ALTER TABLE mid-phase)
- Feature flags via settings table for in-progress features

---

## 11. Deployment Plan

| Layer | Platform | Notes |
|---|---|---|
| Frontend | Vercel or Netlify | Auto-deploy from `main` branch |
| Backend | VPS (DigitalOcean / Render) | PM2 process manager |
| Database | PlanetScale or shared MySQL host | With connection pooling |
| Domain | `muhsinahacademy.com` | SSL via Let's Encrypt |
| Email | Brevo (Sendinblue) SMTP | Free 300 emails/day |
| Media | Google Drive (videos) + Cloudinary (images) | Phase 2 |

---

*Blueprint authored by Moshood Olawale Ojuoye for MTalks Life & Marriage Coaching.*
*Last updated: June 2026.*
