# Muhsinah Academy — cPanel Deployment Guide
> **Domain:** www.muhsinahacademy.com  
> **Stack:** Vue 3 (static frontend) + Express.js (Node.js API) + MySQL

---

## What You Need From Your Host

Before starting, confirm your cPanel hosting plan includes:
- **Node.js Selector** (Namecheap Stellar Plus, Hostinger Business, A2 Hosting Turbo)
- **MySQL 5.7+** (any shared host has this)
- **SSH access** (makes updates much faster — ask host to enable it)
- At least **1GB RAM** allocated to your Node.js app

---

## FIRST-TIME DEPLOYMENT (do this once)

---

### Step 1 — Build the frontend on your local machine

```bash
cd client

# Create production env file
echo "VITE_API_URL=https://www.muhsinahacademy.com/api" > .env.production.local
echo "VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxx" >> .env.production.local

npm run build
# Creates: client/dist/  ← this is what goes to the server
```

---

### Step 2 — Upload frontend to cPanel

1. Login to cPanel → **File Manager**
2. Open `public_html/` (this is your website root)
3. **Delete** any existing files in `public_html/`
4. Upload **all contents** of `client/dist/` into `public_html/`  
   *(not the dist folder itself — its contents)*
5. Create a file called `.htaccess` in `public_html/` with this content:

```apache
Options -MultiViews
RewriteEngine On

# Serve existing files and folders directly
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

# Forward /api/* to the Node.js app (if hosted on same domain)
# Remove this block if API is on a subdomain
RewriteRule ^api/(.*)$ http://localhost:5000/api/$1 [P,QSA,L]

# Everything else → Vue SPA
RewriteRule ^ index.html [QSA,L]
```

> **Tip:** If your host doesn't support proxy rules (`mod_proxy`), use an API subdomain instead — see Step 4b.

---

### Step 3 — Set up MySQL database

1. cPanel → **MySQL Databases**
2. Create database: `yourusername_mtalks`
3. Create a database user with a strong password
4. Add user to database with **All Privileges**
5. cPanel → **phpMyAdmin** → select your database → **Import tab**
6. Upload `database/schema.sql` → click **Go**

---

### Step 4a — Deploy Node.js server (same domain `/api`)

1. cPanel → **Setup Node.js App** → **Create Application**

| Setting | Value |
|---|---|
| Node.js version | 18.x or 20.x |
| Application mode | Production |
| Application root | `Mtalks/server` |
| Application URL | `muhsinahacademy.com/api` |
| Application startup file | `server.js` |

2. Click **Run NPM Install** (installs `server/node_modules`)
3. Click the **Environment Variables** section and add each one:

```
NODE_ENV                = production
PORT                    = 5000
DB_HOST                 = localhost
DB_PORT                 = 3306
DB_USER                 = yourusername_dbuser
DB_PASS                 = your_db_password
DB_NAME                 = yourusername_mtalks
JWT_SECRET              = (run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_REFRESH_SECRET      = (run same command again for a different value)
GMAIL_USER              = madeenahsanni@gmail.com
GMAIL_APP_PASSWORD      = xxxx xxxx xxxx xxxx
PAYSTACK_SECRET_KEY     = sk_live_xxxxxxxxxxxxxxxx
PAYSTACK_WEBHOOK_SECRET = (from Paystack dashboard → Webhooks)
CLIENT_URL              = https://www.muhsinahacademy.com
```

4. Click **Start App**

---

### Step 4b — Deploy Node.js server (API subdomain — more reliable)

If your host supports subdomains (recommended):

1. cPanel → **Subdomains** → create `api.muhsinahacademy.com`
2. cPanel → **Setup Node.js App** → Application URL: `api.muhsinahacademy.com`
3. Update `client/.env.production.local`:
   ```
   VITE_API_URL=https://api.muhsinahacademy.com/api
   ```
4. Rebuild frontend: `cd client && npm run build`
5. Re-upload `dist/` to `public_html/`

---

### Step 5 — Import demo data (optional)

Via SSH:
```bash
cd ~/Mtalks
node database/seed.js
```

Or manually in phpMyAdmin run the key INSERT statements from `database/seed.js`.

---

### Step 6 — Configure Paystack webhook

1. Login to [dashboard.paystack.com](https://dashboard.paystack.com)
2. **Settings → API Keys & Webhooks**
3. Webhook URL: `https://www.muhsinahacademy.com/api/payments/webhook`
4. Copy the **Webhook Secret** → paste into your server ENV as `PAYSTACK_WEBHOOK_SECRET`
5. Restart the Node.js app in cPanel

---

### Step 7 — Verify everything works

```
https://www.muhsinahacademy.com                → Vue app loads
https://www.muhsinahacademy.com/api/health     → {"success":true,"env":"production"}
https://www.muhsinahacademy.com/admin          → Admin login page
```

Login: `admin@muhsinahacademy.com` / `Admin@1234`  
**Change the admin password immediately** after first login.

---
---

## ONGOING UPDATES (every time you add features)

This is your standard workflow after features are built locally:

---

### Option A — Manual (SSH + File Manager)

```bash
# ── On your LOCAL machine ─────────────────────────────────────

# 1. Pull latest changes
git pull origin main

# 2. Rebuild frontend
cd client && npm run build && cd ..

# 3. Upload client/dist/* to cPanel public_html/ via File Manager
#    (select all → delete old → upload new)

# ── On the SERVER (via SSH) ───────────────────────────────────

# 4. Pull latest server code
cd ~/Mtalks && git pull origin main

# 5. Install any new packages
cd server && npm install

# 6. Run any new DB migrations (if schema changed)
# mysql -u user -p dbname < database/migrate-xxx.sql

# 7. Restart the Node.js app
#    cPanel → Setup Node.js App → click Restart
```

---

### Option B — One-command deploy script (recommended)

Save this as `deploy.sh` in your project root:

```bash
#!/bin/bash
# deploy.sh — run on your local machine, deploys everything

set -e
CPANEL_USER="your_cpanel_username"
CPANEL_HOST="muhsinahacademy.com"
CPANEL_PATH="~/Mtalks"

echo "Building frontend..."
cd client
npm run build
cd ..

echo "Uploading frontend..."
rsync -avz --delete client/dist/ ${CPANEL_USER}@${CPANEL_HOST}:~/public_html/

echo "Pulling latest server code on host..."
ssh ${CPANEL_USER}@${CPANEL_HOST} "
  cd ${CPANEL_PATH}/server &&
  git pull origin main &&
  npm install --omit=dev &&
  echo 'Server updated. Restart the Node.js app in cPanel.'
"

echo ""
echo "Done. Go to cPanel → Setup Node.js App → Restart App."
```

Make it executable and run:
```bash
# Mac/Linux:
chmod +x deploy.sh && ./deploy.sh

# Windows (Git Bash):
bash deploy.sh
```

---

### Option C — GitHub webhook auto-deploy (fully automatic)

Create `server/scripts/deploy-hook.js`:
```js
const { execSync } = require('child_process')
const crypto = require('crypto')
const express = require('express')
const app = express()

app.use(express.json())
app.post('/deploy', (req, res) => {
  const secret = process.env.DEPLOY_SECRET
  const sig    = req.headers['x-hub-signature-256']
  const hash   = 'sha256=' + crypto.createHmac('sha256', secret)
    .update(JSON.stringify(req.body)).digest('hex')
  if (sig !== hash) return res.status(403).end()

  res.json({ ok: true })
  try {
    execSync('cd ~/Mtalks && git pull origin main && cd server && npm install --omit=dev')
    console.log('Deploy success')
  } catch (e) { console.error('Deploy failed:', e.message) }
})
app.listen(9000)
```

Then in GitHub → repo → **Settings → Webhooks → Add webhook**:
- Payload URL: `https://api.muhsinahacademy.com/deploy`
- Secret: set `DEPLOY_SECRET` env var on server
- Event: just `push`

Every `git push` to main automatically updates the server. You still need to rebuild the frontend manually.

---

## Quick Reference Card

| Task | Command / Location |
|---|---|
| Build frontend | `cd client && npm run build` |
| Upload frontend | cPanel File Manager → `public_html/` |
| Start/Restart server | cPanel → Setup Node.js App → Restart |
| View server logs | cPanel → Setup Node.js App → app error log |
| DB schema changes | phpMyAdmin → Import → your .sql file |
| Check server health | `https://yourdomain.com/api/health` |
| Change admin password | Admin panel → Profile → Change Password |
| Switch to live Paystack | Change `sk_test_` → `sk_live_` + `pk_test_` → `pk_live_` in ENV |

---

## Common Issues

**500 errors on the frontend after deploy**  
→ Check `public_html/.htaccess` exists and has the correct rewrite rules

**API returns CORS error in production**  
→ Set `CLIENT_URL=https://www.muhsinahacademy.com` in server ENV (exact domain, no trailing slash)

**Node.js app won't start**  
→ cPanel → Setup Node.js App → app error log → usually a missing ENV variable or DB connection issue

**Emails not sending**  
→ Check `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set. Generate a new App Password if needed (Google Account → Security → App Passwords)

**Payment webhook not firing**  
→ Verify webhook URL in Paystack dashboard is exactly `https://www.muhsinahacademy.com/api/payments/webhook` and `PAYSTACK_WEBHOOK_SECRET` matches

