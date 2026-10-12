async function run() {
    const TURSO_URL = 'https://taskflow-uguryavuz.aws-eu-west-1.turso.io/v2/pipeline';
    const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTA0MTMwMDcsImlkIjoiMDFhMGRjZWUtMDIwMS03ZWU3LTliMTMtODk0N2IzYjhjM2ZjIiwia2lkIjoiUGlXX2U0VkRpd1lqdmRHSTg3cGxydE4tY1RhZWdGbG5UeE5fbUlIT0VGYyIsInJpZCI6IjU2OWJhMWM0LTFmZTQtNDQ5Yi04NzM0LTAxOWQ5ZTYyZTQ3NyJ9.ABiOIIp6m7eAvpVfObbk4sT56NkuH5uWuLwyGsrTJdbyq-f8JchXdW0M_JGr72Wpfxf6QCrbIl-N_YVe7DSZBg';

    const reqs = [];
    
    // 1. Remove the vt_ prefix we added earlier
    reqs.push({ type: 'execute', stmt: { sql: "UPDATE customers SET organization_number = REPLACE(organization_number, 'vt_', '') WHERE organization_number LIKE 'vt_%'" } });
    reqs.push({ type: 'execute', stmt: { sql: "UPDATE customers SET id = REPLACE(id, 'vt_', '') WHERE id LIKE 'vt_%'" } });
    
    // 2. Rename tables
    const tablesToRename = ['customers', 'products', 'contacts', 'contracts', 'comments', 'documents'];
    for (let t of tablesToRename) {
        reqs.push({ type: 'execute', stmt: { sql: 'ALTER TABLE ' + t + ' RENAME TO vt_' + t } });
    }

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
