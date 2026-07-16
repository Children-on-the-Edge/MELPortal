function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ ok: false, error: 'Bad request' }, 400);
  }

  const { role, password } = body;
  const expected = role === 'admin' ? env.ADMIN_PASSWORD : env.VIEWER_PASSWORD;

  if (!expected) {
    // No password configured for this role -> treat as open.
    return json({ ok: true });
  }

  const ok = typeof password === 'string' && password.length > 0 && password === expected;
  return json({ ok });
}
