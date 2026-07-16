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

  const { action, password, result } = payload;

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
  if (!result || !result.id) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Result id is required.' }) };
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';
  const filePath = process.env.RESULTS_DATA_PATH || 'data/results.json';

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
    const getRes = await fetch(`${apiUrl}?ref=${branch}`, { headers: ghHeaders });
    if (!getRes.ok) {
      const errText = await getRes.text();
      return { statusCode: 502, headers, body: JSON.stringify({ ok: false, error: `Could not read results.json from GitHub: ${errText}` }) };
    }
    const fileData = await getRes.json();
    const currentContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
    let results = JSON.parse(currentContent);

    if (action === 'add') {
      results.push(result);
    } else if (action === 'update') {
      results = results.map(r => (r.id === result.id ? { ...r, ...result } : r));
    } else if (action === 'delete') {
      results = results.filter(r => r.id !== result.id);
    }

    const newContent = Buffer.from(JSON.stringify(results, null, 2)).toString('base64');
    const commitMessages = {
      add: `Add result: ${result.title || result.id}`,
      update: `Update result: ${result.title || result.id}`,
      delete: `Delete result: ${result.id}`,
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
