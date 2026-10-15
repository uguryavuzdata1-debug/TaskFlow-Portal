export async function onRequest() {
  return new Response("Deprecated endpoint. Use /api/query on TaskFlow server.", { status: 410 });
}
