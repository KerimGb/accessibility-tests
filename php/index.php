<?php
require_once __DIR__ . '/config.php';
$apiUrl = rtrim(NODE_APP_URL, '/');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Accessibility Audit · Us</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Public+Sans:ital,wght@0,300..900;1,400..700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/design-system.css">
  <style>
    /* Layout-only; colors and fonts from /design-system.css */
    .page { max-width: 560px; margin: 0 auto; padding: 48px 24px 64px; }
    .brand { margin-bottom: 40px; }
    .brand-name { font-size: 1.5rem; font-family: "Bricolage Grotesque", ui-serif, Georgia, serif; font-weight: 700; letter-spacing: -0.02em; color: var(--text); }
    .brand-tagline { font-size: 0.9rem; color: var(--text-muted); margin-top: 4px; }
    .card {
      background: var(--surface);
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 2px 24px rgba(0,0,0,.06);
      border: 1px solid var(--border);
    }
    .card-title { font-size: 1.35rem; font-family: "Bricolage Grotesque", ui-serif, Georgia, serif; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 8px; }
    .card-desc { font-size: 0.95rem; color: var(--text-muted); margin: 0 0 28px; }
    label { display: block; font-weight: 600; font-size: 0.9rem; margin-bottom: 8px; color: var(--text); }
    textarea {
      width: 100%; min-height: 128px; padding: 14px 16px;
      border: 1px solid var(--border); border-radius: 10px;
      font-family: inherit; font-size: 0.95rem; resize: vertical;
      background: var(--surface); color: var(--text);
      transition: border-color .2s, box-shadow .2s;
    }
    textarea::placeholder { color: var(--color-placeholder); }
    textarea:focus {
      outline: none; border-color: var(--link);
      box-shadow: 0 0 0 3px var(--color-info-soft);
    }
    .hint { font-size: 0.85rem; color: var(--text-muted); margin-top: 8px; }
    .divider { display: flex; align-items: center; margin: 28px 0; }
    .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }
    .divider span { padding: 0 16px; color: var(--text-muted); font-size: 0.85rem; }
    .file-wrap {
      border: 2px dashed var(--border); border-radius: 12px; padding: 28px; text-align: center;
      transition: border-color .2s, background .2s;
    }
    .file-wrap:hover { border-color: var(--link); background: var(--color-info-soft); }
    input[type="file"] { display: none; }
    .file-btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 12px 20px; background: var(--accent); color: var(--color-primary-label);
      border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem;
      font-family: "Bricolage Grotesque", ui-serif, Georgia, serif;
      transition: background .2s, transform .1s;
    }
    .file-btn:hover { background: var(--accent-hover); }
    .file-btn:active { transform: scale(0.98); }
    .file-btn::after { content: '→'; }
    .file-name { margin-top: 10px; font-size: 0.85rem; color: var(--text-muted); }
    .submit-wrap { margin-top: 28px; }
    .submit {
      display: inline-flex; align-items: center; gap: 10px;
      padding: 14px 28px; background: var(--accent); color: var(--color-primary-label); border: none;
      border-radius: 8px; font-size: 1rem; font-weight: 600;
      font-family: "Bricolage Grotesque", ui-serif, Georgia, serif;
      cursor: pointer; transition: background .2s, transform .1s;
    }
    .submit:hover { background: var(--accent-hover); }
    .submit:active { transform: scale(0.98); }
    .submit:disabled { background: var(--color-button-disabled-bg); color: var(--color-button-disabled-label); cursor: not-allowed; transform: none; }
    .submit::after { content: '→'; }
    .error { margin-top: 16px; padding: 14px 16px; background: var(--error-soft); color: var(--error); border-radius: 10px; font-size: 0.9rem; }
    body { background: #fcfcf8; }
  </style>
</head>
<body>
  <div class="page">
    <header class="brand">
      <div class="brand-name">Us</div>
      <div class="brand-tagline">Accessibility audit · Clear goals, combined strengths</div>
    </header>

    <main class="card">
      <h1 class="card-title">Run an accessibility audit</h1>
      <p class="card-desc">Add URLs or upload a CSV/XML file. Results open in a new page with a unique link.</p>

      <form id="form">
        <label for="urls">URLs (one per line or comma-separated)</label>
        <textarea id="urls" name="urls" placeholder="https://example.com&#10;https://example.com/about&#10;https://example.com/contact"></textarea>
        <p class="hint">Use full URLs including https://</p>

        <div class="divider"><span>or upload a file</span></div>

        <label>CSV or XML file</label>
        <div class="file-wrap">
          <input type="file" id="file" name="file" accept=".csv,.xml,.txt">
          <label for="file" class="file-btn">Choose file</label>
          <p class="file-name" id="file-name">No file selected</p>
        </div>
        <p class="hint">CSV: URLs in any column. XML: &lt;loc&gt; or &lt;url&gt; (e.g. sitemap).</p>

        <div class="submit-wrap">
          <button type="submit" class="submit" id="submit">Run accessibility tests</button>
        </div>
        <div id="error" class="error" style="display:none;"></div>
      </form>
    </main>
  </div>

  <script>
    const NODE_APP_URL = <?= json_encode($apiUrl) ?>;
    const form = document.getElementById('form');
    const fileInput = document.getElementById('file');
    const fileName = document.getElementById('file-name');
    const submitBtn = document.getElementById('submit');
    const errorEl = document.getElementById('error');

    fileInput.addEventListener('change', () => {
      fileName.textContent = fileInput.files[0]?.name || 'No file selected';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.style.display = 'none';
      submitBtn.disabled = true;

      const fd = new FormData();
      fd.append('urls', document.getElementById('urls').value);
      if (fileInput.files[0]) fd.append('file', fileInput.files[0]);

      try {
        const res = await fetch(NODE_APP_URL + '/api/run', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Request failed');
        }
        const q = new URLSearchParams();
        if (data.domain) q.set('domain', data.domain);
        if (data.runId) q.set('runId', data.runId);
        if (data.urls) q.set('urls', data.urls);
        window.location.href = NODE_APP_URL + '/loading?' + q.toString();
      } catch (err) {
        errorEl.textContent = err.message + ' (Check that the API server is running and config.php has the correct URL.)';
        errorEl.style.display = 'block';
        submitBtn.disabled = false;
      }
    });
  </script>
</body>
</html>
