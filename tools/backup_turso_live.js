/**
 * backup_turso_live.js
 * Automatically exports all live Turso tables to timestamped JSON & SQL backup files.
 */
const fs = require('fs');
const path = require('path');

const TURSO_URL = 'https://taskflow-uguryavuz.aws-eu-west-1.turso.io/v2/pipeline';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTA0MTMwMDcsImlkIjoiMDFhMGRjZWUtMDIwMS03ZWU3LTliMTMtODk0N2IzYjhjM2ZjIiwia2lkIjoiUGlXX2U0VkRpd1lqdmRHSTg3cGxydE4tY1RhZWdGbG5UeE5fbUlIT0VGYyIsInJpZCI6IjU2OWJhMWM0LTFmZTQtNDQ5Yi04NzM0LTAxOWQ5ZTYyZTQ3NyJ9.ABiOIIp6m7eAvpVfObbk4sT56NkuH5uWuLwyGsrTJdbyq-f8JchXdW0M_JGr72Wpfxf6QCrbIl-N_YVe7DSZBg';

async function tursoQuery(sql) {
    const res = await fetch(TURSO_URL, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + TURSO_TOKEN,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            requests: [{
                type: 'execute',
                stmt: { sql }
            }]
        })
    });
    if (!res.ok) throw new Error('Turso HTTP error: ' + res.statusText);
    const data = await res.json();
    const result = data.results[0]?.response?.result;
    if (!result) return [];
    const cols = result.cols.map(c => c.name);
    return result.rows.map(row => {
        const obj = {};
        cols.forEach((col, idx) => {
            obj[col] = row[idx] && row[idx].value !== undefined ? row[idx].value : null;
        });
        return obj;
    });
}

async function runBackup() {
    console.log('[Backup] Starting Live Turso Backup...');
    const tablesRes = await tursoQuery("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream_%';");
    const tables = tablesRes.map(t => t.name);
    console.log('[Backup] Tables found:', tables.join(', '));

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, 'backups_turso', `backup_${timestamp}`);
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const summary = {
        timestamp: new Date().toISOString(),
        tables: {}
    };

    for (const table of tables) {
        console.log(`[Backup] Exporting table: ${table}...`);
        const rows = await tursoQuery(`SELECT * FROM ${table};`);
        summary.tables[table] = rows.length;
        fs.writeFileSync(path.join(backupDir, `${table}.json`), JSON.stringify(rows, null, 2), 'utf8');
        console.log(`[Backup] -> ${table}: ${rows.length} rows saved.`);
    }

    fs.writeFileSync(path.join(backupDir, '_summary.json'), JSON.stringify(summary, null, 2), 'utf8');
    console.log(`[Backup] Completed successfully! Saved to: ${backupDir}`);
}

runBackup().catch(err => {
    console.error('[Backup] Failed:', err);
    process.exit(1);
});
