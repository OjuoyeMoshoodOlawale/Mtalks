# Muhsinah Academy — Life & Marriage Coaching Platform

**Website:** [www.muhsinahacademy.com](https://www.muhsinahacademy.com)
**Coach:** Madinah Sanni · Abuja, Nigeria
**Stack:** Vue 3 · Express.js · MySQL · Paystack · Gmail SMTP · Three.js · GSAP

> *Helping Muslim Sisters and Couples Build Stronger, Healthier, and Lasting Relationships.*

---

## Features

- **3D landing page** — Three.js particle hero, GSAP scroll animations
- **Online course platform** — Coursera-style (Course → Module → Lesson → Quiz), Google Drive video
- **Event management** — Early bird pricing, packages, QR ticket email, WhatsApp group gate
- **Paystack payments** — Course enrolment + event registration (HMAC webhook verified)
- **Free Gmail email** — Branded HTML emails (OTP, welcome, tickets, receipts) via Nodemailer
- **Calendly consultation** — Free embed, URL managed from admin
- **Admin dashboard** — Analytics charts, payments, course builder, event editor, error logs
- **Zero paid services** — Gmail SMTP, Google Drive, Calendly free, Crisp free

---

## Quick Start

```bash
git clone https://github.com/OjuoyeMoshoodOlawale/Mtalks.git && cd Mtalks
mysql -u root -p -e "CREATE DATABASE muhsinah_db CHARACTER SET utf8mb4;"
mysql -u root -p muhsinah_db < database/schema.sql
cd server && cp ../.env.example .env && npm install && npm run dev
cd ../client && npm install && npm run dev
```

See **[PROGRESS.md](./PROGRESS.md)** for full feature list and phase status.
See **[BLUEPRINT.md](./BLUEPRINT.md)** for engineering specification.

---

*Developer: Moshood Olawale Ojuoye · Lagos, Nigeria*
