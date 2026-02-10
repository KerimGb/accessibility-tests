# Setup Guide: Combell + Render

This guide walks you through the full setup: **Combell** (PHP form) + **Render** (Node.js + Playwright backend).

---

## Overview

| Component | Where | Purpose |
|-----------|-------|---------|
| Form | Combell (your domain) | User enters URLs, submits |
| Backend | Render (free) | Runs tests, generates reports |
| Loading & Report | Render | Shown after form submit |

---

## Part 1: Deploy backend to Render

### Step 1: Push your code to GitHub

1. Create a repository on [github.com](https://github.com/new)
2. Push this project:
   ```bash
   cd accessibility-tests
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

### Step 2: Create a Render account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub (recommended)

### Step 3: Create a Web Service

1. Click **New +** → **Web Service**
2. Connect your GitHub account if needed
3. Select your repository
4. Configure:
   - **Name:** `accessibility-tests` (or any name)
   - **Region:** Choose closest to you
   - **Runtime:** **Docker**
   - **Build Command:** (leave empty – Dockerfile handles it)
   - **Start Command:** (leave empty – Dockerfile handles it)

5. Under **Advanced:**
   - Add Environment Variable: `PORT` = `3456`

6. Click **Create Web Service**

### Step 4: Wait for deploy

- Render will build the Docker image (first build takes 5–10 minutes)
- When done, you’ll see a URL like:  
  `https://accessibility-tests-xxxx.onrender.com`

### Step 5: Copy your Render URL

- Copy the full URL (e.g. `https://accessibility-tests-xxxx.onrender.com`)
- You’ll need it for Combell

---

## Part 2: Deploy frontend to Combell

### Step 1: Connect via FTP

1. Get your FTP credentials from Combell (host, username, password)
2. Use FileZilla or another FTP client
3. Connect and open the folder where your site lives (often `public_html` or `www`)

### Step 2: Create a folder (optional)

- Create a subfolder, e.g. `accessibility` or `a11y`
- Or put files in the root if this is the main site

### Step 3: Upload PHP files

Upload from the `php/` folder in this project:

- `config.php`
- `index.php`

Your Combell structure should look like:

```
public_html/
  accessibility/
    config.php
    index.php
```

### Step 4: Edit `config.php`

1. Open `config.php` (via FTP download, edit, re-upload, or Combell File Manager)
2. Replace `https://your-app.railway.app` with your **Render URL** (no trailing slash):

   ```php
   define('NODE_APP_URL', 'https://accessibility-tests-xxxx.onrender.com');
   ```

3. Save and upload again if needed

---

## Part 3: Test

1. Open: `https://yourdomain.com/accessibility/` (or your path)
2. Enter a test URL (e.g. `https://example.com`)
3. Click **Run accessibility tests**
4. You should be redirected to the Render loading page, then to the report

---

## Optional: Restrict CORS

To allow only your Combell domain:

1. In Render: **Environment** → Add Variable
2. Name: `ALLOWED_ORIGIN`
3. Value: `https://yourdomain.com`
4. Save (Render will redeploy)

---

## Notes

- **Free tier spin-down:** Render free services sleep after ~15 minutes of inactivity. The first request after that may take 30–60 seconds.
- **Report URLs:** Each report has a unique URL like `https://your-render-app.onrender.com/report/abc12345`. Share this with clients.
- **Logs:** In Render, use **Logs** to debug if something fails.
