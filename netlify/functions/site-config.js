exports.handler = async function () {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      viewerGateEnabled: Boolean(process.env.VIEWER_PASSWORD),
    }),
  };
};
