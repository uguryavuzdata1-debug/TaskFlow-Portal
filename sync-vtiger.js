const crypto = require('crypto');
const fs = require('fs');

const VTIGER_URL = 'http://ikacrm.ikaepos.com/vtigercrm/webservice.php';
const VT_USER = 'ugur';
const VT_KEY = 'uzFBLl4e1FXuea2f';

const TURSO_URL = 'https://taskflow-uguryavuz.aws-eu-west-1.turso.io/v2/pipeline';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTA0MTMwMDcsImlkIjoiMDFhMGRjZWUtMDIwMS03ZWU3LTliMTMtODk0N2IzYjhjM2ZjIiwia2lkIjoiUGlXX2U0VkRpd1lqdmRHSTg3cGxydE4tY1RhZWdGbG5UeE5fbUlIT0VGYyIsInJpZCI6IjU2OWJhMWM0LTFmZTQtNDQ5Yi04NzM0LTAxOWQ5ZTYyZTQ3NyJ9.ABiOIIp6m7eAvpVfObbk4sT56NkuH5uWuLwyGsrTJdbyq-f8JchXdW0M_JGr72Wpfxf6QCrbIl-N_YVe7DSZBg';

async function tursoExecute(sql, args = []) {
    const res = await fetch(TURSO_URL, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + TURSO_TOKEN,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            requests: [{
                type: 'execute',
                stmt: { sql, args }
            }]
        })
    });
    if (!res.ok) throw new Error('Turso query failed: ' + res.statusText);
    const data = await res.json();
    return data;
}

async function run() {
    console.log('1. Authenticating to vTiger...');
    let cRes = await fetch(VTIGER_URL + '?operation=getchallenge&username=' + VT_USER);
    let cData = await cRes.json();
    let token = cData.result.token;
    let accessHash = crypto.createHash('md5').update(token + VT_KEY).digest('hex');
    
    let lRes = await fetch(VTIGER_URL, {
        method: 'POST', 
        body: new URLSearchParams({ operation: 'login', username: VT_USER, accessKey: accessHash })
    });
    let lData = await lRes.json();
    let sessionName = lData.result.sessionName;
    console.log('vTiger Login success. Session:', sessionName);

    console.log('2. Fetching all Accounts from vTiger...');
    let offset = 0;
    const limit = 100;
    let allAccounts = [];
    
    while(true) {
        let q = `SELECT account_no, accountname, bill_street, bill_city, bill_code, ownership, email1, phone, description, industry, createdtime, modifiedtime, assigned_user_id FROM Accounts LIMIT ${offset}, ${limit};`;
        let qRes = await fetch(VTIGER_URL + '?operation=query&sessionName=' + sessionName + '&query=' + encodeURIComponent(q));
        let qData = await qRes.json();
        
        if (!qData.success || qData.result.length === 0) break;
        allAccounts.push(...qData.result);
        console.log(`Fetched ${allAccounts.length} accounts so far...`);
        offset += limit;
    }
    
    console.log('Total accounts fetched:', allAccounts.length);
    
    console.log('3. Deduplicating records by Company Name...');
    let uniqueAccounts = [];
    let seen = new Set();
    // We reverse so the latest ones are kept if there are duplicates
    allAccounts.reverse();
    for (let acc of allAccounts) {
        let name = (acc.accountname || '').trim().toLowerCase();
        if (!seen.has(name)) {
            seen.add(name);
            uniqueAccounts.push(acc);
        }
    }
    console.log('Total unique accounts after deduplication:', uniqueAccounts.length);

    console.log('4. Wiping old customers table on Turso...');
    await tursoExecute('DELETE FROM vt_customers;');
    
    console.log('5. Inserting new records to Turso in batches...');
    
    // We will do batched inserts, 50 at a time
    const batchSize = 50;
    for (let i = 0; i < uniqueAccounts.length; i += batchSize) {
        const batch = uniqueAccounts.slice(i, i + batchSize);
        let sql = 'INSERT INTO vt_customers (id, organization_name, organization_number, created_time, modified_time, billing_address, billing_city, billing_postal_code, ownership, primary_email, primary_phone, description, industry) VALUES ';
        let args = [];
        let placeholders = [];
        
        for (let acc of batch) {
            placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            args.push({ type: 'text', value: acc.id || '' });
            args.push({ type: 'text', value: acc.accountname || '' });
            args.push({ type: 'text', value: acc.account_no || '' });
            args.push({ type: 'text', value: acc.createdtime || '' });
            args.push({ type: 'text', value: acc.modifiedtime || '' });
            args.push({ type: 'text', value: acc.bill_street || '' });
            args.push({ type: 'text', value: acc.bill_city || '' });
            args.push({ type: 'text', value: acc.bill_code || '' });
            args.push({ type: 'text', value: acc.ownership || '' });
            args.push({ type: 'text', value: acc.email1 || '' });
            args.push({ type: 'text', value: acc.phone || '' });
            args.push({ type: 'text', value: acc.description || '' });
            args.push({ type: 'text', value: acc.industry || '' });
        }
        
        sql += placeholders.join(', ');
        await tursoExecute(sql, args);
        console.log(`Inserted ${i + batch.length} / ${uniqueAccounts.length}`);
    }
    
    console.log('6. SYNC COMPLETE SUCCESSFULLY!');
}

run().catch(console.error);
