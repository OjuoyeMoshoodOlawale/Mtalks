# Muhsinah Academy — Deployment Guide (cPanel)
> MTalks · www.muhsinahacademy.com

---

## Prerequisites
- cPanel hosting with **Node.js Selector** (e.g. Namecheap, Hostinger, A2 Hosting)
- MySQL 8+ database created in cPanel
- Domain pointed to your cPanel hosting

---

## Step 1 — Build the Vue Client Locally

```bash
cd client
# Set production API URL
echo "VITE_API_URL=https://www.muhsinahacademy.com/api" > .env.production.local
npm install
npm run build
# Output: client/dist/
```

---

## Step 2 — Upload Frontend to cPanel

1. In cPanel → **File Manager** → navigate to `public_html`
2. Upload all contents of `client/dist/` into `public_html/`
3. Create `.htaccess` in `public_html/` for SPA routing:

```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [QSA,L]
```

---

## Step 3 — Set Up MySQL Database

1. cPanel → **MySQL Databases**
2. Create database: `muhsinah_db`
3. Create user and assign full privileges
4. Import schema: upload `database/schema.sql` via **phpMyAdmin**
5. Run seed (optional): connect via SSH and `node database/seed.js`

---

## Step 4 — Deploy Node.js Server on cPanel

1. cPanel → **Setup Node.js App**
2. Click **Create Application**:
   - Node.js version: `18.x` or `20.x`
   - Application mode: `Production`
   - Application root: `Mtalks/server`
   - Application URL: `muhsinahacademy.com/api`  *(or api.muhsinahacademy.com)*
   - Application startup file: `server.js`
3. Click **Run NPM Install**
4. Set **Environment Variables** (click the ENV panel):

```
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_USER=cpanel_db_user
DB_PASS=your_db_password
DB_NAME=muhsinah_db
JWT_SECRET=generate_a_long_random_string
JWT_REFRESH_SECRET=generate_another_long_random_string
GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_google_app_password
PAYSTACK_SECRET_KEY=sk_live_xxxxx
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret
CLIENT_URL=https://www.muhsinahacademy.com
```

5. Click **Start App**

---

## Step 5 — Verify

- `https://www.muhsinahacademy.com` → Vue app loads ✓
- `https://www.muhsinahacademy.com/api/health` → `{"success":true}` ✓

---

## Updating (after changes)

```bash
# Rebuild client
cd client && npm run build

# Re-upload client/dist/* to public_html via cPanel File Manager
# or use SSH + rsync

# Server updates: push to GitHub, then in cPanel Node.js App → Restart
```
