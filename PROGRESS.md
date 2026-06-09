# Muhsinah Academy — Development Progress

**Live URL:** https://www.muhsinahacademy.com
**Repository:** https://github.com/OjuoyeMoshoodOlawale/Mtalks
**Developer:** Moshood Olawale Ojuoye
**Last updated:** June 2026

---

## Phase Status

| Phase | Description | Status |
|---|---|---|
| 1 | Foundation — DB, API, Auth JWT, Email, Payments | ✅ Complete |
| 2 | Public website — All pages, Hero 3D | ✅ Complete |
| 3 | LMS — Course builder, Google Drive player | ✅ Complete |
| 4 | Payments — Paystack, webhook, branded emails | ✅ Complete |
| 5 | Events — Packages, QR tickets, WhatsApp gate | ✅ Complete |
| 6 | Admin Dashboard — All management panels | ✅ Complete |
| 7 | Polish — SEO, deploy, Lottie, Crisp bot | ⏳ Pending |

---

## Completed Features

### Backend (Express.js)
- [x] **Free Gmail SMTP** — No paid email service (Nodemailer + Google App Password)
- [x] MySQL2 connection pool (`muhsinah_db`)
- [x] JWT auth — access (15min) + refresh (7d httpOnly cookie)
- [x] Full auth flow: register → OTP → verify → login → refresh → forgot/reset
- [x] Courses API — CRUD, module/lesson tree, enrolment check, progress guard
- [x] Modules API — CRUD + drag-drop reorder
- [x] Lessons API — CRUD, reorder, progress tracking, Drive embed ID guard
- [x] Enrollments API — free + paid, progress, completion stats
- [x] Events API — CRUD, packages, early-bird, deadline enforcement
- [x] Registrations API — QR ticket, WhatsApp gated link
- [x] Payments API — Paystack initialize + HMAC webhook → auto-enrol/register
- [x] Team / Testimonials / FAQs / Settings / Analytics / Error Logs APIs (all CRUD)
- [x] Users API — list, role change, enable/disable
- [x] Analytics — revenue, enrollments, events, chart data
- [x] Error logs persisted to DB — viewable in admin
- [x] Security: Helmet, CORS, rate-limit, xss-clean, hpp, parameterised SQL queries

### Frontend (Vue 3)
**Public Pages**
- [x] HomeView — 3D Three.js hero, stats, about, why-us, services, testimonials, FAQ, CTA
- [x] AboutView — Founder story, mission, vision, core values
- [x] ServicesView — Full 4-service layout with benefits
- [x] CoursesView — Grid, search, free/paid filter
- [x] CourseDetailView — Curriculum accordion, Paystack enrolment
- [x] EventsView — Event cards with early-bird badges
- [x] EventDetailView — Package selector, Paystack registration
- [x] TeamView — Dynamic team grid from admin
- [x] TestimonialsView — Star ratings, dynamic from admin
- [x] ConsultationView — Free Calendly embed (URL from admin Settings)
- [x] ContactView — Form (Gmail SMTP) + WhatsApp/email info
- [x] LegalView — Privacy Policy + Terms of Service (NDPR compliant)
- [x] NotFoundView — 404 page

**Auth Pages**
- [x] LoginView — Split layout, JWT
- [x] RegisterView — With perks sidebar
- [x] VerifyEmailView — 6-digit OTP input
- [x] ForgotPasswordView — 3-step reset flow

**Student Area**
- [x] StudentDashboard — Enrolled courses + progress bars + event tickets
- [x] CoursePlayerView — Google Drive iframe, lesson checklist, progress, completion card
- [x] MyEventsView — stub (complete Phase 7)
- [x] MyCoursesView — stub (complete Phase 7)
- [x] ProfileView — stub (complete Phase 7)

**Admin Panel**
- [x] AdminDashboard — KPI cards, Bar + Doughnut charts, recent payments table
- [x] AdminSidebar — Collapsible, mobile overlay
- [x] CoursesManagement — Table, create/edit modal, publish toggle, delete
- [x] CourseEditorView — Module/lesson builder, Google Drive video preview
- [x] EventsManagement — Table, full event + package editor
- [x] PaymentsView — Filtered table, CSV export
- [x] UsersManagement — Search, role promote/demote, enable/disable
- [x] TeamManagement — Photo + social links CRUD
- [x] TestimonialsManagement — CRUD + publish toggle
- [x] FaqManagement — CRUD + category + publish
- [x] SettingsView — Gmail setup guide + Calendly URL + social links
- [x] ErrorLogsView — Stack trace viewer + purge old logs

### Free Services Used (zero cost to coach)
| Service | Use | Plan |
|---|---|---|
| Gmail SMTP | Email notifications | Free (500/day) |
| Google Drive | Video storage & delivery | Free (15 GB) |
| Paystack | Course/event payments | Free (% per txn) |
| Calendly | Consultation booking | Free tier |
| Crisp | Chat/bot widget | Free tier |
| Three.js + GSAP | 3D hero + animations | Open source |
| Lucide Icons | Icon library | Open source |
| Chart.js | Admin analytics | Open source |

---

## Remaining (Phase 7 — Polish)

- [ ] MyCoursesView full implementation
- [ ] MyEventsView full implementation
- [ ] ProfileView full implementation (avatar upload)
- [ ] Lottie animated icons (loading, success, empty state)
- [ ] Crisp chatbot integration (add website ID to Settings)
- [ ] SEO meta tags (vue-meta per page)
- [ ] Sitemap.xml generation
- [ ] robots.txt
- [ ] Performance: lazy-load images, Vite code splitting
- [ ] Deploy: Vercel (client) + Render/VPS (server)
- [ ] Crisp chatbot widget installed

---

## Local Development Setup

```bash
# Clone
git clone https://github.com/OjuoyeMoshoodOlawale/Mtalks.git && cd Mtalks

# Database (create DB then run schema)
mysql -u root -p -e "CREATE DATABASE muhsinah_db CHARACTER SET utf8mb4;"
mysql -u root -p muhsinah_db < database/schema.sql

# Backend
cd server && cp ../.env.example .env
# Edit .env — fill GMAIL_USER, GMAIL_APP_PASSWORD, DB_PASS, PAYSTACK keys
npm install && npm run dev   # runs on :5000

# Frontend
cd ../client && npm install && npm run dev   # runs on :5173
```

## Gmail App Password Setup (FREE email)

1. Go to Gmail → Manage Google Account → Security
2. Enable **2-Step Verification**
3. Go to Security → **App Passwords** → Generate
4. Copy the 16-character code into `.env`:
   ```
   GMAIL_USER=madeenahsanni@gmail.com
   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
   ```
