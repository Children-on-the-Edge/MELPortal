exports.handler = async function (event) {
  const headers = { 'Content-Type': 'application/json' };

  if (event.httpMethod === 'POST') {
    try {
      const { role, password } = JSON.parse(event.body || '{}');
      const expected = role === 'admin' ? process.env.ADMIN_PASSWORD : process.env.VIEWER_PASSWORD;

      if (!expected) {
        // No password configured for this role -> treat as open.
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
      }

      const ok = typeof password === 'string' && password.length > 0 && password === expected;
      return { statusCode: 200, headers, body: JSON.stringify({ ok }) };
    } catch (e) {
      return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Bad request' }) };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ ok: false, error: 'Method not allowed' }) };
};
