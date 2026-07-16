export async function onRequestGet(context) {
  const { env } = context;
  return new Response(
    JSON.stringify({ viewerGateEnabled: Boolean(env.VIEWER_PASSWORD) }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}
