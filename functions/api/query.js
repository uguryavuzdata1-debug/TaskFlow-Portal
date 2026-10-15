// ============================================================
// CLOUDFLARE PAGES FUNCTION: /api/query
// Proxies SQL queries to Turso database on Cloudflare edge
// ============================================================

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { sql, args = [] } = body;
    
    if (!sql || typeof sql !== 'string') {
      return new Response(JSON.stringify({ error: 'SQL query string required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const token = (env && env.TURSO_AUTH_TOKEN) || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTA0MTMwMDcsImlkIjoiMDFhMGRjZWUtMDIwMS03ZWU3LTliMTMtODk0N2IzYjhjM2ZjIiwia2lkIjoiUGlXX2U0VkRpd1lqdmRHSTg3cGxydE4tY1RhZWdGbG5UeE5fbUlIT0VGYyIsInJpZCI6IjU2OWJhMWM0LTFmZTQtNDQ5Yi04NzM0LTAxOWQ5ZTYyZTQ3NyJ9.ABiOIIp6m7eAvpVfObbk4sT56NkuH5uWuLwyGsrTJdbyq-f8JchXdW0M_JGr72Wpfxf6QCrbIl-N_YVe7DSZBg';
    const pipelineUrl = 'https://taskflow-uguryavuz.aws-eu-west-1.turso.io/v2/pipeline';

    const formattedArgs = args.map(a => {
      if (a === null || a === undefined) return { type: 'null' };
      if (typeof a === 'number') {
        return { type: Number.isInteger(a) ? 'integer' : 'float', value: String(a) };
      }
      return { type: 'text', value: String(a) };
    });

    const tursoRes = await fetch(pipelineUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            type: 'execute',
            stmt: {
              sql: sql,
              args: formattedArgs
            }
          }
        ]
      })
    });

    const data = await tursoRes.json();
    if (!data || !data.results || !data.results[0]) {
      return new Response(JSON.stringify({ rows: [], success: true }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const resItem = data.results[0];
    if (resItem.type === 'error') {
      return new Response(JSON.stringify({ error: resItem.error?.message || 'Turso query error' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const result = resItem.response?.result;
    if (!result || !result.cols || !result.rows) {
      return new Response(JSON.stringify({ rows: [], success: true }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const cols = result.cols.map(c => c.name);
    const rows = result.rows.map(row => {
      const item = {};
      cols.forEach((col, idx) => {
        const cell = row[idx];
        item[col] = cell && cell.value !== undefined ? cell.value : null;
      });
      return item;
    });

    return new Response(JSON.stringify({ rows, success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
