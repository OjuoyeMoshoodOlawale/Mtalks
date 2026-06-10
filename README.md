# Muhsinah Academy

> Full-stack life & marriage coaching platform for Coach Madinah Sanni — Abuja, Nigeria.
> A product of **MTalks** · Live at [www.muhsinahacademy.com](https://www.muhsinahacademy.com)

## Stack

| Layer | Technology |
|---|---|
| Frontend | Vue 3 + Vite + Pinia + Vue Router |
| Backend | Express.js (Node 18+) |
| Database | MySQL 8 (mysql2 pool) |
| Payments | Paystack (inline popup + HMAC-SHA512 webhook) |
| Email | Gmail SMTP via Nodemailer (free, App Password) |
| Videos | Google Drive **or** YouTube unlisted (protected embed) |
| Images | Google Drive (gallery, direct display) |
| 3D / Motion | Three.js + GSAP |
| Charts | Chart.js + vue-chartjs |
| Icons | Lucide |

## Features

**Public site** — Cinematic landing page (3D particle hero), About, Services, Courses,
Events (early-bird pricing), Gallery (Drive-hosted, lightbox), Team, Testimonials,
Consultation (Calendly embed), Contact (DB + email notification), Legal (NDPR), 404.
FAQs and testimonials on the homepage are **dynamic** — managed from the admin panel.

**Muzzamil 🤖** — Built-in assistant chat bubble on every public page. Keyword-matches
visitor questions against an admin-managed knowledge base, falls back to published FAQs.
No paid AI APIs. Knowledge is managed at **Admin → Muzzamil Bot** (with a live test box).

**LMS** — Self-paced courses → modules → lessons. **Protected video delivery**: raw
video IDs are never sent to the browser in bulk payloads; the player requests
`/api/lessons/:id/video` per lesson, the server verifies enrollment, then returns a
ready-made embed URL (Drive preview or youtube-nocookie). Module quizzes with
server-side grading and attempt history. Lesson progress tracking.

**Certificates 🎓** — Complete 100% of a course → claim a verified certificate
(`MA-XXXX-XXXX`). Printable branded design (Print → Save as PDF). Public verification
at `/certificate/:code`.

**Events & Ticketing** — Multi-package events with per-package early-bird deadlines.
Paystack payment → UUID ticket + QR code emailed instantly. WhatsApp group link only
in the email, never on the site. Admin attendee manager with check-in and CSV export.

**Admin panel** — Dashboard KPIs + charts, course editor (modules/lessons/quizzes,
Drive + YouTube extractor with live preview), events + packages, gallery, users,
payments + CSV, analytics, team, testimonials, FAQs, Muzzamil knowledge, messages
inbox (unread badge), settings, error logs.

**Auth** — JWT access (15 min) + refresh (7 d httpOnly cookie), email OTP verification,
password reset, role-based guards.

## Project structure

```
Mtalks/
├── client/                 # Vue 3 SPA (Vite)
│   ├── public/             # sitemap.xml, robots.txt, _redirects
│   └── src/
│       ├── components/     # base components, layout, MuzzamilBot
│       ├── composables/    # useSeoMeta, …
│       ├── stores/         # Pinia: auth, ui, courses
│       ├── views/          # public/ auth/ student/ admin/
│       └── router/
├── server/                 # Express API
│   └── src/
│       ├── controllers/    # 18 domains
│       ├── routes/
│       ├── services/       # email (Gmail), paystack, ticket/QR
│       ├── middleware/     # auth (JWT), error handler
│       └── config/         # db pool, jwt, mailer
├── database/
│   ├── schema.sql          # full schema (fresh installs)
│   ├── migrate-v2.sql      # incremental migration for existing DBs
│   └── seed.js             # demo data + admin login
└── DEPLOY.md               # cPanel deployment guide
```

## Quick start (local)

```bash
git clone https://github.com/OjuoyeMoshoodOlawale/Mtalks.git && cd Mtalks

# Database
mysql -u root -p -e "CREATE DATABASE mtalks_db CHARACTER SET utf8mb4;"
mysql -u root -p mtalks_db < database/schema.sql

# Server
cd server && cp ../.env.example .env   # fill DB_*, GMAIL_*, PAYSTACK_*
npm install && npm run dev             # API on :5000

# Client (new terminal)
cd client && npm install && npm run dev   # UI on :5173

# Demo data (optional, from project root)
node database/seed.js
```

**Seeded logins**

| Role | Email | Password |
|---|---|---|
| Admin | admin@muhsinahacademy.com | Admin@1234 |
| Student | aisha.ibrahim@demo.com | Student@1234 |

## Video protection model

1. Course/lesson list payloads **never** include video IDs.
2. The player calls `GET /api/lessons/:id/video` with the student's JWT.
3. The server checks enrollment (admins bypass), sanitizes the stored ID, and returns
   the embed URL — `drive.google.com/file/d/{id}/preview` or
   `youtube-nocookie.com/embed/{id}`.
4. The iframe is sandboxed, `referrerpolicy="no-referrer"`, right-click disabled on
   the player area.
5. Upload guidance: Drive files → "Anyone with link / Viewer" + **download disabled**;
   YouTube → **Unlisted** (not Public, not Private).

> No browser-delivered video is 100% theft-proof (screen recording always exists),
> but this prevents link scraping, sharing of raw URLs, and access without enrollment.

## Gallery model

Photos live in the owner's Google Drive. Admin pastes share links (bulk supported)
at **Admin → Gallery**; the site displays them via Drive's image CDN
(`lh3.googleusercontent.com/d/{id}`). Nothing is re-uploaded or duplicated.

## Updating an existing database

```bash
mysql -u root -p mtalks_db < database/migrate-v2.sql
```

## Deployment

See **DEPLOY.md** for the full cPanel guide (Node.js app + static client + .htaccess).

---
© MTalks. All rights reserved.
