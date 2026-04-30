const http = require('http');
const crypto = require('crypto');

// Configuration
const VTIGER_URL = 'http://192.168.1.129/vtigercrm/webservice.php';
const USERNAME = 'ugur';
const ACCESS_KEY = 'uzFBLl4e1FXuea2f';
const PORT = 3005;

async function fetchFromVTiger() {
  try {
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

    // 3. Query Accounts (with Pagination for ALL Customers)
    let allAccounts = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    console.log('[SYNC] Starting pagination fetch for Accounts...');
    while (hasMore) {
      const query = encodeURIComponent(`select * from Accounts limit ${offset}, ${limit};`);
      const qRes = await fetch(`${VTIGER_URL}?operation=query&sessionName=${sessionName}&query=${query}`);
      const qJson = await qRes.json();
      
      if (!qJson.success) throw new Error('Query Failed: ' + JSON.stringify(qJson));
      
      const chunk = qJson.result;
      allAccounts = allAccounts.concat(chunk);
      
      console.log(`[SYNC] Fetched chunk: offset ${offset}, received ${chunk.length} records.`);
      
      if (chunk.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }

    // 4. Query ServiceContracts to get status
    console.log('[SYNC] Fetching Service Contracts for status mapping...');
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

    // Map contracts to Account ID
    const contractMap = {};
    allContracts.forEach(sc => {
      if (sc.sc_related_to) {
        contractMap[sc.sc_related_to] = sc.sc_status;
      }
    });
    
    // Map to a cleaner structure
    const customers = allAccounts.map(acc => {
      // vTiger ID format is "ModuleIDxRecordID" e.g. "11x39"
      const vtigerId = acc.id; 
      return {
        companyId: acc.account_no,
        companyName: acc.accountname,
        postcode: acc.bill_code || acc.ship_code || '',
        phone: acc.phone || '',
        status: contractMap[vtigerId] || 'No Contract',
        registerDate: acc.createdtime || '',
        lastUpdate: acc.modifiedtime || '',
        lastNote: acc.description || ''
      };
    });

    return customers;
  } catch (err) {
    console.error("VTiger Fetch Error:", err);
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/customers' && req.method === 'GET') {
    console.log('[SYNC] Fetching customers from vTiger...');
    const data = await fetchFromVTiger();
    
    if (data) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, count: data.length, data: data }));
      console.log(`[SYNC] Sent ${data.length} customers successfully.`);
    } else {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Failed to fetch from vTiger CRM' }));
    }
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`vTiger Bridge Server running at port ${PORT}`);
  console.log(`Keep this window open to sync customers.`);
  console.log(`=========================================`);
});
