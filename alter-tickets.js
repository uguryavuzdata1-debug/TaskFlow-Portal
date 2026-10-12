async function run() {
    const TURSO_URL = 'https://taskflow-uguryavuz.aws-eu-west-1.turso.io/v2/pipeline';
    const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTA0MTMwMDcsImlkIjoiMDFhMGRjZWUtMDIwMS03ZWU3LTliMTMtODk0N2IzYjhjM2ZjIiwia2lkIjoiUGlXX2U0VkRpd1lqdmRHSTg3cGxydE4tY1RhZWdGbG5UeE5fbUlIT0VGYyIsInJpZCI6IjU2OWJhMWM0LTFmZTQtNDQ5Yi04NzM0LTAxOWQ5ZTYyZTQ3NyJ9.ABiOIIp6m7eAvpVfObbk4sT56NkuH5uWuLwyGsrTJdbyq-f8JchXdW0M_JGr72Wpfxf6QCrbIl-N_YVe7DSZBg';

    const reqs = [
        { type: 'execute', stmt: { sql: 'ALTER TABLE vt_tickets ADD COLUMN company TEXT;' } }
    ];

    const res = await fetch(TURSO_URL, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + TURSO_TOKEN,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests: reqs })
    });
    
    console.log(await res.text());
}
run();
