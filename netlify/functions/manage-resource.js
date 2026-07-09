exports.handler = async function (event) {
  const headers = { 'Content-Type': 'application/json' };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ ok: false, error: 'Method not allowed' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Bad request body' }) };
  }

  const { action, password, resource } = payload;

  // --- Auth check (always re-checked server-side, never trust the front end) ---
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'ADMIN_PASSWORD is not configured on the server.' }) };
  }
  if (password !== adminPassword) {
    return { statusCode: 401, headers, body: JSON.stringify({ ok: false, error: 'Incorrect admin password.' }) };
  }

  if (!['add', 'update', 'delete'].includes(action)) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Unknown action.' }) };
  }
  if (!resource || !resource.id) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Resource id is required.' }) };
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;       // e.g. "your-org/me-portal"
  const branch = process.env.GITHUB_BRANCH || 'main';
  const filePath = process.env.DATA_PATH || 'data/resources.json';

  if (!token || !repo) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'GITHUB_TOKEN or GITHUB_REPO is not configured on the server.' }) };
  }

  const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;
  const ghHeaders = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'me-portal-admin-function',
  };

  try {
    // 1. Fetch current file (need its sha to update it)
    const getRes = await fetch(`${apiUrl}?ref=${branch}`, { headers: ghHeaders });
    if (!getRes.ok) {
      const errText = await getRes.text();
      return { statusCode: 502, headers, body: JSON.stringify({ ok: false, error: `Could not read resources.json from GitHub: ${errText}` }) };
    }
    const fileData = await getRes.json();
    const currentContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
    let resources = JSON.parse(currentContent);

    // 2. Apply the change
    if (action === 'add') {
      resources.push(resource);
    } else if (action === 'update') {
      resources = resources.map(r => (r.id === resource.id ? { ...r, ...resource } : r));
    } else if (action === 'delete') {
      resources = resources.filter(r => r.id !== resource.id);
    }

    // 3. Commit the updated file back to GitHub
    const newContent = Buffer.from(JSON.stringify(resources, null, 2)).toString('base64');
    const commitMessages = {
      add: `Add resource: ${resource.title || resource.id}`,
      update: `Update resource: ${resource.title || resource.id}`,
      delete: `Delete resource: ${resource.id}`,
    };

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: { ...ghHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: commitMessages[action],
        content: newContent,
        sha: fileData.sha,
        branch,
      }),
    });

    if (!putRes.ok) {
      const errText = await putRes.text();
      return { statusCode: 502, headers, body: JSON.stringify({ ok: false, error: `Could not commit change to GitHub: ${errText}` }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: e.message }) };
  }
};
