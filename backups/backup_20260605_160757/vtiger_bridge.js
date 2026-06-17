require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// Configuration from .env
const VTIGER_URL = process.env.VTIGER_URL || 'http://192.168.1.129/vtigercrm/webservice.php';
const USERNAME = process.env.VTIGER_USER || 'ugur';
const ACCESS_KEY = process.env.VTIGER_ACCESS_KEY || 'uzFBLl4e1FXuea2f';
const PORT = process.env.PORT || 3005;

// Supabase Configuration
const SB_URL = process.env.SUPABASE_URL;
const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase;
if (SB_URL && SB_SERVICE_KEY) {
    supabase = createClient(SB_URL, SB_SERVICE_KEY);
    console.log('[SUPABASE] Client initialized.');
} else {
    console.warn('[SUPABASE] Missing credentials. Sync will not work.');
}

async function fetchFromVTiger() {
    try {
        console.log('[VTIGER] Starting fetch process...');
        // 1. Get Challenge
        const cRes = await fetch(`${VTIGER_URL}?operation=getchallenge&username=${USERNAME}`);
        const cJson = await cRes.json();
        if (!cJson.success) throw new Error('Challenge Failed: ' + JSON.stringify(cJson));
        const token = cJson.result.token;

        // 2. Login
        const hash = crypto.createHash('md5').update(token + ACCESS_KEY).digest('hex');
        const loginForm = new URLSearchParams({
            operation: 'login',
            username: USERNAME,
            accessKey: hash
        });

        const lRes = await fetch(VTIGER_URL, {
            method: 'POST',
            body: loginForm,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const lJson = await lRes.json();
        if (!lJson.success) throw new Error('Login Failed: ' + JSON.stringify(lJson));
        const sessionName = lJson.result.sessionName;

        // 3. Query Accounts
        let allAccounts = [];
        let offset = 0;
        const limit = 100;
        let hasMore = true;

        while (hasMore) {
            const query = encodeURIComponent(`select * from Accounts limit ${offset}, ${limit};`);
            const qRes = await fetch(`${VTIGER_URL}?operation=query&sessionName=${sessionName}&query=${query}`);
            const qJson = await qRes.json();
            if (!qJson.success) throw new Error('Query Failed: ' + JSON.stringify(qJson));

            const chunk = qJson.result;
            allAccounts = allAccounts.concat(chunk);
            console.log(`[VTIGER] Fetched ${chunk.length} accounts (Offset: ${offset})`);

            if (chunk.length < limit) hasMore = false;
            else offset += limit;
        }

        // 4. Query ServiceContracts
        let allContracts = [];
        offset = 0;
        hasMore = true;
        while (hasMore) {
            const query = encodeURIComponent(`select sc_status, sc_related_to from ServiceContracts limit ${offset}, ${limit};`);
            const qRes = await fetch(`${VTIGER_URL}?operation=query&sessionName=${sessionName}&query=${query}`);
            const qJson = await qRes.json();

            if (qJson.success && qJson.result) {
                const chunk = qJson.result;
                allContracts = allContracts.concat(chunk);
                if (chunk.length < limit) hasMore = false;
                else offset += limit;
            } else {
                hasMore = false;
            }
        }

        const contractMap = {};
        allContracts.forEach(sc => {
            if (sc.sc_related_to) contractMap[sc.sc_related_to] = sc.sc_status;
        });

        return allAccounts.map(acc => ({
            id: acc.id,
            company_id: acc.account_no,
            company_name: acc.accountname,
            postcode: acc.bill_code || acc.ship_code || '',
            phone: acc.phone || '',
            status: contractMap[acc.id] || 'No Contract',
            register_date: acc.createdtime || '',
            last_update: acc.modifiedtime || '',
            description: acc.description || ''
        }));
    } catch (err) {
        console.error("[VTIGER] Fetch Error:", err.message);
        return null;
    }
}

async function syncToSupabase() {
    if (!supabase) return { success: false, message: 'Supabase not initialized' };

    const data = await fetchFromVTiger();
    if (!data) return { success: false, message: 'Failed to fetch from Vtiger' };

    console.log(`[SYNC] Upserting ${data.length} records to Supabase...`);
    
    // We use 'id' (Vtiger ID) as the unique constraint for upsert
    const { error } = await supabase
        .from('VtigerCRM_Organizations')
        .upsert(data, { onConflict: 'id' });

    if (error) {
        console.error('[SYNC] Supabase Error:', error);
        return { success: false, error };
    }

    console.log('[SYNC] Completed successfully.');
    return { success: true, count: data.length };
}

// Endpoints
app.get('/customers', async (req, res) => {
    const data = await fetchFromVTiger();
    if (data) res.json({ success: true, count: data.length, data });
    else res.status(500).json({ success: false, message: 'Vtiger fetch failed' });
});

app.get('/sync', async (req, res) => {
    const result = await syncToSupabase();
    if (result.success) res.json(result);
    else res.status(500).json(result);
});

// Periodic Sync (Every 30 minutes)
setInterval(() => {
    console.log('[AUTO-SYNC] Starting periodic synchronization...');
    syncToSupabase();
}, 30 * 60 * 1000);

app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`Vtiger Bridge Server running at port ${PORT}`);
    console.log(`Endpoints: /customers, /sync`);
    console.log(`Auto-sync active (every 30 mins)`);
    console.log(`=========================================`);
});
