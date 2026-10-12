export async function onRequest(context) {
  const { request } = context;
  
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      }
    });
  }

  const url = 'https://taskflow-uguryavuz.aws-eu-west-1.turso.io/v2/pipeline';
  
  // Extract authorization header from incoming request
  const authHeader = request.headers.get("Authorization");

  if (request.method === "POST") {
    const body = await request.text();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: body
    });

    const responseData = await response.text();

    return new Response(responseData, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      }
    });
  }

  return new Response("Method not allowed", { status: 405 });
}
