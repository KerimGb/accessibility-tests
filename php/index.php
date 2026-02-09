<?php
require_once __DIR__ . '/config.php';
$apiUrl = rtrim(NODE_APP_URL, '/');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Accessibility Audit</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; padding: 24px; background: #f5f5f5; color: #212121; }
    .container { max-width: 640px; margin: 0 auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,.08); overflow: hidden; }
    header { background: #1a237e; color: #fff; padding: 24px; }
    header h1 { margin: 0 0 8px; font-size: 1.5rem; }
    header p { margin: 0; opacity: .9; font-size: .9rem; }
    main { padding: 24px; }
    label { display: block; font-weight: 600; margin-bottom: 6px; }
    textarea { width: 100%; min-height: 120px; padding: 12px; border: 1px solid #ccc; border-radius: 6px; font-family: inherit; font-size: 14px; resize: vertical; }
    textarea:focus { outline: none; border-color: #1a237e; }
    .hint { font-size: 0.85rem; color: #666; margin-top: 4px; }
    .divider { display: flex; align-items: center; margin: 24px 0; }
    .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: #ddd; }
    .divider span { padding: 0 16px; color: #666; font-size: 0.9rem; }
    .file-wrap { border: 2px dashed #ccc; border-radius: 6px; padding: 24px; text-align: center; }
    .file-wrap:hover { border-color: #1a237e; background: #f8f9ff; }
    input[type="file"] { display: none; }
    .file-btn { display: inline-block; padding: 10px 20px; background: #1a237e; color: #fff; border-radius: 6px; cursor: pointer; font-weight: 600; }
    .file-btn:hover { background: #0d1554; }
    .file-name { margin-top: 8px; font-size: 0.9rem; color: #666; }
    .submit { margin-top: 24px; padding: 14px 28px; background: #2e7d32; color: #fff; border: none; border-radius: 6px; font-size: 1rem; font-weight: 600; cursor: pointer; }
    .submit:hover { background: #1b5e20; }
    .submit:disabled { background: #9e9e9e; cursor: not-allowed; }
    .error { margin-top: 12px; padding: 12px; background: #ffebee; color: #c62828; border-radius: 6px; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Accessibility Audit</h1>
      <p>Add URLs or upload a CSV/XML file to run tests. Results will open in a new page.</p>
    </header>
    <main>
      <form id="form">
        <label for="urls">URLs (one per line or comma-separated)</label>
        <textarea id="urls" name="urls" placeholder="https://example.com&#10;https://example.com/about&#10;https://example.com/contact"></textarea>
        <p class="hint">Enter full URLs including https://</p>

        <div class="divider"><span>or upload a file</span></div>

        <label>CSV or XML file</label>
        <div class="file-wrap">
          <input type="file" id="file" name="file" accept=".csv,.xml,.txt">
          <label for="file" class="file-btn">Choose file</label>
          <p class="file-name" id="file-name">No file selected</p>
        </div>
        <p class="hint">CSV: URLs in any column. XML: &lt;loc&gt; or &lt;url&gt; elements (e.g. sitemap).</p>

        <button type="submit" class="submit" id="submit">Run accessibility tests</button>
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
        const q = new URLSearchParams({ id: data.id });
        if (data.urls) q.set('urls', data.urls);
        window.location.href = NODE_APP_URL + '/loading.html?' + q.toString();
      } catch (err) {
        errorEl.textContent = err.message + ' (Check that the API server is running and config.php has the correct URL.)';
        errorEl.style.display = 'block';
        submitBtn.disabled = false;
      }
    });
  </script>
</body>
</html>
