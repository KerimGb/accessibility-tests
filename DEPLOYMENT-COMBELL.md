# Deployment: Combell + Railway

This guide explains how to run the accessibility tester with:
- **Combell** (shared hosting) – PHP frontend (the form)
- **Railway** (free tier) – Node.js backend (runs the actual tests)

---

## Part 1: Deploy Node app to Railway

### 1.1 Create a Railway account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub (recommended for easy deploy)

### 1.2 Create a new project

1. Click **New Project**
2. Choose **Deploy from GitHub repo**
3. Connect your GitHub account and select this repository (or create a repo and push the project)
4. If you don’t use GitHub: choose **Empty Project** and deploy with Railway CLI

### 1.3 Configure the project

Railway will detect Node.js. Add these settings:

1. Open your project → **Variables**
2. Add:
   - `PORT` = `3456` (Railway may set this automatically)

### 1.4 Install Playwright (Chromium)

The app needs Chromium for testing. Add a build script:

1. In **Settings** → **Build Command**, set:
   ```bash
   npm install && npx playwright install chromium
   ```
2. Or add this to `package.json` scripts:
   ```json
   "build": "npx playwright install chromium"
   ```
   and set Railway’s build command to `npm run build` (in addition to `npm install`).

**Note:** Railway’s default environment may not support Playwright. If the deploy fails or tests fail with “Executable doesn’t exist”, consider:
- [Render](https://render.com) (has better support for headless browsers), or
- A small VPS (DigitalOcean, etc.) where you have full control

### 1.5 Deploy and get the URL

1. Click **Deploy**
2. When it’s live, go to **Settings** → **Networking** → **Generate Domain**
3. Copy the URL (e.g. `https://accessibility-tests-production-xxxx.up.railway.app`)

### 1.6 Optional: Restrict CORS

To allow only your Combell domain:

1. **Variables** → add:
   - `ALLOWED_ORIGIN` = `https://yourdomain.com`
2. Restart the service.

---

## Part 2: Deploy PHP frontend to Combell

### 2.1 Upload files via FTP

1. Connect to your Combell hosting via FTP (FileZilla, etc.)
2. Go to the folder where your site lives (e.g. `public_html` or a subfolder like `accessibility`)
3. Upload the contents of the `php/` folder:
   ```
   php/
   ├── config.php
   └── index.php
   ```

### 2.2 Edit `config.php`

1. Open `config.php` in an editor or via Combell’s file manager
2. Replace `https://your-app.railway.app` with your Railway URL:
   ```php
   define('NODE_APP_URL', 'https://accessibility-tests-production-xxxx.up.railway.app');
   ```
3. Save the file

### 2.3 Test

1. Open your Combell URL (e.g. `https://yourdomain.com/accessibility/`)
2. Enter a test URL and click **Run accessibility tests**
3. You should be redirected to the Railway loading page and then to the report

---

## Flow

```
User visits Combell (yourdomain.com/accessibility/)
    ↓
Form submits URLs to Railway API
    ↓
Redirect to Railway loading page
    ↓
Redirect to Railway report page (unique URL)
```

The form lives on Combell; the loading page and report are served by Railway.

---

## Troubleshooting

| Problem | Solution |
|--------|----------|
| "Request failed" or CORS error | Ensure Railway is running and `config.php` has the correct URL. Add your Combell domain to `ALLOWED_ORIGIN` if you set it. |
| "Report file was not created" | Check the `--output-id` fix is in place. Railway logs may show more details. |
| Playwright/Chromium errors on Railway | Railway may not fully support Playwright. Consider Render or a VPS. |
