function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}

function base64Encode(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach(b => (binary += String.fromCharCode(b)));
  return btoa(binary);
}
function base64Decode(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let payload;
  try {
    payload = await request.json();
  } catch (e) {
    return json({ ok: false, error: 'Bad request body' }, 400);
  }

  const { action, password, result } = payload;

  const adminPassword = env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return json({ ok: false, error: 'ADMIN_PASSWORD is not configured on the server.' }, 500);
  }
  if (password !== adminPassword) {
    return json({ ok: false, error: 'Incorrect admin password.' }, 401);
  }

  if (!['add', 'update', 'delete'].includes(action)) {
    return json({ ok: false, error: 'Unknown action.' }, 400);
  }
  if (!result || !result.id) {
    return json({ ok: false, error: 'Result id is required.' }, 400);
  }

  const token = env.GITHUB_TOKEN;
  const repo = env.GITHUB_REPO;
  const branch = env.GITHUB_BRANCH || 'main';
  const filePath = env.RESULTS_DATA_PATH || 'data/results.json';

  if (!token || !repo) {
    return json({ ok: false, error: 'GITHUB_TOKEN or GITHUB_REPO is not configured on the server.' }, 500);
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
      return json({ ok: false, error: `Could not read results.json from GitHub: ${errText}` }, 502);
    }
    const fileData = await getRes.json();
    const currentContent = base64Decode(fileData.content);
    let results = JSON.parse(currentContent);

    if (action === 'add') {
      results.push(result);
    } else if (action === 'update') {
      results = results.map(r => (r.id === result.id ? { ...r, ...result } : r));
    } else if (action === 'delete') {
      results = results.filter(r => r.id !== result.id);
    }

    const newContent = base64Encode(JSON.stringify(results, null, 2));
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
      return json({ ok: false, error: `Could not commit change to GitHub: ${errText}` }, 502);
    }

    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}
