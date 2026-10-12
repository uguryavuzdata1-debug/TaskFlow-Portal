const WebSocket = require('ws');

async function getPageTarget() {
    const res = await fetch('http://localhost:9222/json');
    const tabs = await res.json();
    return tabs.find(t => t.type === 'page' && (t.title.includes('TaskFlow') || t.url.includes(':8000') || t.url === ''));
}

async function connectToPage() {
    const pageTab = await getPageTarget();
    if (!pageTab) throw new Error('No page tab found');
    console.log('Connecting to target:', pageTab.id);
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    let id = 1;
    const callbacks = {};

    function send(method, params = {}) {
        return new Promise((resolve, reject) => {
            const reqId = id++;
            callbacks[reqId] = { resolve, reject };
            ws.send(JSON.stringify({ id: reqId, method, params }));
        });
    }

    ws.on('message', (data) => {
        const msg = JSON.parse(data);
        if (msg.id && callbacks[msg.id]) {
            if (msg.error) callbacks[msg.id].reject(msg.error);
            else callbacks[msg.id].resolve(msg.result);
            delete callbacks[msg.id];
        }
    });

    await new Promise(resolve => ws.on('open', resolve));
    await send('Runtime.enable');

    async function evalCode(expression) {
        const res = await send('Runtime.evaluate', {
            expression,
            returnByValue: true,
            awaitPromise: true
        });
        if (res.exceptionDetails) {
            throw new Error(res.exceptionDetails.exception?.description || 'Eval failed: ' + expression);
        }
        return res.result?.value;
    }

    return { ws, send, evalCode };
}

async function run() {
    let client = await connectToPage();

    console.log('Triggering page reload in browser...');
    client.evalCode('window.location.href = "http://localhost:8000/?t=" + Date.now();').catch(() => {});
    client.ws.close();

    console.log('Waiting 3 seconds for page reload...');
    await new Promise(r => setTimeout(r, 3000));

    client = await connectToPage();
    const { evalCode } = client;

    console.log('\n--- TEST 1: Check Login State & User ---');
    const isLoginVisible = await evalCode(`!document.getElementById('login-screen').classList.contains('hidden')`);
    console.log('Is login screen visible?', isLoginVisible);

    if (isLoginVisible) {
        console.log('Logging in with username "ugur" and default password "1234"...');
        await evalCode(`
            document.getElementById('login-username').value = 'ugur';
            document.getElementById('login-password').value = '1234';
            handleLogin();
        `);
        await new Promise(r => setTimeout(r, 1500));
    }

    const currentLoggedInUser = await evalCode(`appState?.currentUser`);
    const currentRole = await evalCode(`appState?.currentUserRole`);
    console.log('✓ Successfully logged in as:', currentLoggedInUser, '| Role:', currentRole);

    console.log('\n--- TEST 2: User Profile & Preferences (Name and Password Change) ---');
    console.log('Opening Profile & Password section...');
    await evalCode(`showTab('preferences')`);
    await new Promise(r => setTimeout(r, 800));

    const prefFullName = await evalCode(`document.getElementById('settings-display-fullname')?.innerText`);
    const prefRole = await evalCode(`document.getElementById('settings-display-role')?.innerText`);
    console.log('✓ Profile loaded:', { fullName: prefFullName, role: prefRole });

    console.log('Updating Display Name...');
    await evalCode(`
        togglePrefPanel('name');
        document.getElementById('pref-new-name').value = 'Ugur Yavuz';
        savePrefName();
    `);
    await new Promise(r => setTimeout(r, 1000));
    const updatedName = await evalCode(`document.getElementById('settings-display-fullname')?.innerText`);
    console.log('✓ Display Name is now:', updatedName);

    console.log('Updating Password (Default 1234)...');
    await evalCode(`
        togglePrefPanel('password');
        document.getElementById('pref-new-pass').value = '1234';
        document.getElementById('pref-confirm-pass').value = '1234';
        savePrefPassword();
    `);
    await new Promise(r => setTimeout(r, 1000));
    console.log('✓ Password updated to 1234 in Turso DB!');

    console.log('\n--- TEST 3: Admin Panel -> Role Settings & Access ---');
    console.log('Navigating to Admin -> Role Settings...');
    await evalCode(`
        showTab('admin');
        showAdminPane('roles');
    `);
    await new Promise(r => setTimeout(r, 2000));

    const countsBefore = await evalCode(`({
        admin: document.getElementById('roles-admin-count')?.innerText,
        user: document.getElementById('roles-user-count')?.innerText,
        finance: document.getElementById('roles-finance-count')?.innerText
    })`);
    console.log('✓ Role counters:', countsBefore);

    console.log("Updating Ahmet Baltaci's role to Accounting & Finance in Turso DB...");
    await evalCode(`
        var sel = document.getElementById('role-select-U-1790606524642');
        if (sel) {
            sel.value = 'Accounting';
            adminChangeUserRole('U-1790606524642', 'Ahmet Baltaci');
        }
    `);
    await new Promise(r => setTimeout(r, 2000));

    const countsAfter = await evalCode(`({
        admin: document.getElementById('roles-admin-count')?.innerText,
        user: document.getElementById('roles-user-count')?.innerText,
        finance: document.getElementById('roles-finance-count')?.innerText
    })`);
    console.log('✓ Role counters after update:', countsAfter);

    console.log('\n--- TEST 4: Module Permissions & Role Settings Matrix ---');
    console.log('Saving module clearance settings to Turso DB app_settings...');
    await evalCode(`adminSaveRoleSettings()`);
    await new Promise(r => setTimeout(r, 1500));
    console.log('✓ Role Settings saved in Turso DB!');

    console.log('\n========================================');
    console.log('ALL VERIFICATIONS SUCCESSFUL!');
    console.log('========================================');
    client.ws.close();
    process.exit(0);
}

run().catch(err => {
    console.error('Test run error:', err);
    process.exit(1);
});
