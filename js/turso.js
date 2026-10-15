// ============================================================
// TURSO DATABASE CLIENT FOR TASKFLOW (SECURE PROXY ADAPTER)
// All database queries are routed via local Express API (/api/query).
// Client contains ZERO credentials, tokens or database keys.
// ============================================================

const TURSO_CONFIG = {
    apiUrl: '/api/query',
    localApiUrl: '/api'
};

// Helper: Get JWT token from local or session storage
function getAuthToken() {
    return localStorage.getItem('taskflow_token') || sessionStorage.getItem('taskflow_token') || '';
}

// Secure SQL Execution on Server API Proxy
async function tursoExecute(sql, args = []) {
    const token = getAuthToken();
    try {
        const response = await fetch(TURSO_CONFIG.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? ('Bearer ' + token) : ''
            },
            body: JSON.stringify({
                sql: sql,
                args: args
            })
        });

        if (response.ok) {
            const data = await response.json();
            return data.rows || [];
        }

        if (response.status === 401) {
            console.warn('[Turso] Oturum doğrulanamadı (401). Giriş ekranına yönlendiriliyor...');
        }

        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Sorgu hatası (HTTP ${response.status})`);
    } catch (err) {
        console.error('[Turso Query Error]', err.message, { sql, args });
        throw err;
    }
}

// High-level Turso operations
const turso = {
    execute: tursoExecute,

    // 1. TaskFlow Portal Users (taskflow_users)
    async getUsers() {
        try {
            return await tursoExecute('SELECT id, full_name, username, email, role, status, vt_user_id, avatar_url, created_at FROM taskflow_users ORDER BY full_name ASC');
        } catch (e) {
            return await tursoExecute('SELECT id, full_name, username, email, role, status, NULL as vt_user_id, avatar_url, created_at FROM users ORDER BY full_name ASC');
        }
    },

    async addUser(user) {
        const id = user.id || ('U-' + Date.now());
        const username = user.username || (user.full_name ? user.full_name.toLowerCase().replace(/\s+/g, '') : id);
        
        // 1. Insert into taskflow_users
        try {
            const sqlTf = `INSERT INTO taskflow_users (id, full_name, username, email, role, status, password_hash, vt_user_id) 
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                           ON CONFLICT(id) DO UPDATE SET
                             full_name=excluded.full_name,
                             username=excluded.username,
                             email=excluded.email,
                             role=excluded.role,
                             status=excluded.status,
                             vt_user_id=COALESCE(excluded.vt_user_id, taskflow_users.vt_user_id),
                             password_hash=COALESCE(excluded.password_hash, taskflow_users.password_hash)`;
            await tursoExecute(sqlTf, [
                id,
                user.full_name || '',
                username,
                user.email || null,
                user.role || 'User',
                user.status || 'ACTIVE',
                user.password_hash || null,
                user.vt_user_id || null
            ]);
        } catch (e) {
            console.warn('[turso.addUser] taskflow_users write failed, writing to users:', e);
        }

        // 2. Mirror into users table for backwards compatibility
        try {
            const sqlLegacy = `INSERT INTO users (id, full_name, username, email, role, status, password, password_hash) 
                               VALUES (?, ?, ?, ?, ?, ?, NULL, ?)
                               ON CONFLICT(id) DO UPDATE SET
                                 full_name=excluded.full_name,
                                 username=excluded.username,
                                 email=excluded.email,
                                 role=excluded.role,
                                 status=excluded.status,
                                 password=NULL,
                                 password_hash=COALESCE(excluded.password_hash, users.password_hash)`;
            await tursoExecute(sqlLegacy, [
                id,
                user.full_name || '',
                username,
                user.email || null,
                user.role || 'User',
                user.status || 'ACTIVE',
                user.password_hash || null
            ]);
        } catch (e) { /* ignore */ }

        return { id, username, ...user };
    },

    async removeUser(id) {
        try { await tursoExecute('DELETE FROM taskflow_users WHERE id = ?', [id]); } catch(e) {}
        return await tursoExecute('DELETE FROM users WHERE id = ?', [id]);
    },

    async updateUserRole(id, role) {
        try { await tursoExecute('UPDATE taskflow_users SET role = ? WHERE id = ?', [role, id]); } catch(e) {}
        return await tursoExecute('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    },

    async updateUser(id, fields = {}) {
        const keys = Object.keys(fields);
        if (keys.length === 0) return;
        const setClauses = keys.map(k => `${k} = ?`).join(', ');
        const vals = keys.map(k => fields[k]);
        vals.push(id);
        try { await tursoExecute(`UPDATE taskflow_users SET ${setClauses} WHERE id = ?`, vals); } catch(e) {}
        return await tursoExecute(`UPDATE users SET ${setClauses} WHERE id = ?`, vals);
    },

    // 2. CRM Technicians & Assigned Users (vt_users)
    async getVtUsers() {
        return await tursoExecute('SELECT id, user_name, first_name, last_name, full_name, email, role_name, status FROM vt_users ORDER BY full_name ASC');
    },

    async resolveVtUserName(userId) {
        if (!userId) return '-';
        if (typeof window !== 'undefined' && window._vtUsersCache && window._vtUsersCache[userId]) {
            return window._vtUsersCache[userId];
        }
        try {
            const res = await tursoExecute('SELECT full_name FROM vt_users WHERE id = ? LIMIT 1', [userId]);
            if (res && res.length > 0 && res[0].full_name) {
                if (!window._vtUsersCache) window._vtUsersCache = {};
                window._vtUsersCache[userId] = res[0].full_name;
                return res[0].full_name;
            }
        } catch(e) {}
        return userId;
    },

    // Customers
    async getCustomers(limit = 1000) {
        const sql = limit ? `SELECT * FROM vt_customers LIMIT ${parseInt(limit)}` : 'SELECT * FROM vt_customers';
        return await tursoExecute(sql);
    },

    // Records / Tickets
    async getRecords() {
        return await tursoExecute('SELECT * FROM records ORDER BY created_at DESC');
    },

    async addRecord(r) {
        const id = r.id || ('REC-' + Date.now());
        const sql = `INSERT INTO records (
            id, ticket_id, customer_id, customer_name, phone, postcode, address,
            category, service_type, sub_services, price, vat, total_price,
            payment_method, status, assigned_to, notes, description, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            customer_name=excluded.customer_name,
            phone=excluded.phone,
            postcode=excluded.postcode,
            address=excluded.address,
            category=excluded.category,
            service_type=excluded.service_type,
            sub_services=excluded.sub_services,
            price=excluded.price,
            vat=excluded.vat,
            total_price=excluded.total_price,
            payment_method=excluded.payment_method,
            status=excluded.status,
            assigned_to=excluded.assigned_to,
            notes=excluded.notes,
            description=excluded.description,
            updated_at=excluded.updated_at`;
        
        await tursoExecute(sql, [
            id, r.ticket_id || id, r.customer_id || '', r.customer_name || '', r.phone || '', r.postcode || '', r.address || '',
            r.category || '', r.service_type || '', r.sub_services || '', r.price || 0, r.vat || 0, r.total_price || 0,
            r.payment_method || '', r.status || 'Open', r.assigned_to || '', r.notes || '', r.description || '',
            r.created_at || new Date().toISOString(), new Date().toISOString()
        ]);
        return { id, ...r };
    },

    async deleteRecord(id) {
        return await tursoExecute('DELETE FROM records WHERE id = ?', [id]);
    },

    // Invoices
    async getInvoices() {
        return await tursoExecute('SELECT * FROM invoices ORDER BY invoicedate DESC');
    },

    // Appointments
    async getAppointments() {
        return await tursoExecute('SELECT * FROM appointments ORDER BY date_start DESC');
    },

    // Tickets
    async getTickets(parentId = null) {
        if (parentId) {
            return await tursoExecute('SELECT * FROM vt_tickets WHERE parent_id = ? ORDER BY createdtime DESC', [parentId]);
        }
        return await tursoExecute('SELECT * FROM vt_tickets ORDER BY createdtime DESC');
    },

    async addTicket(t) {
        const id = t.id || ('TCK-' + Date.now());
        const sql = `INSERT INTO vt_tickets (
            id, ticket_no, ticket_title, ticketstatus, ticketpriorities, ticketseverities,
            parent_id, customer_name, company, assigned_user_id, createdtime, modifiedtime, solution, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            ticket_no=excluded.ticket_no,
            ticket_title=excluded.ticket_title,
            ticketstatus=excluded.ticketstatus,
            ticketpriorities=excluded.ticketpriorities,
            ticketseverities=excluded.ticketseverities,
            parent_id=excluded.parent_id,
            company=excluded.company,
            customer_name=excluded.customer_name,
            assigned_user_id=excluded.assigned_user_id,
            createdtime=excluded.createdtime,
            modifiedtime=excluded.modifiedtime,
            solution=excluded.solution,
            description=excluded.description`;
        await tursoExecute(sql, [
            id, t.ticket_no || id, t.ticket_title || t.title || t.subject || '',
            t.ticketstatus || t.status || 'Open', t.ticketpriorities || t.priority || 'Normal',
            t.ticketseverities || 'Minor', t.parent_id || t.customer_id || '',
            t.customer_name || '', t.company || '', t.assigned_user_id || t.assigned_to || '',
            t.createdtime || t.created_at || new Date().toISOString(),
            t.modifiedtime || t.updated_at || new Date().toISOString(),
            t.solution || '', t.description || ''
        ]);
        return { id, ...t };
    },

    async deleteTicket(id) {
        return await tursoExecute('DELETE FROM vt_tickets WHERE id = ?', [id]);
    },

    // Quotes
    async getQuotes(accountId = null) {
        if (accountId) {
            return await tursoExecute('SELECT * FROM vt_quotes WHERE account_id = ? ORDER BY createdtime DESC', [accountId]);
        }
        return await tursoExecute('SELECT * FROM vt_quotes ORDER BY createdtime DESC');
    },

    async addQuote(q) {
        const id = q.id || ('QUO-' + Date.now());
        const sql = `INSERT INTO vt_quotes (
            id, quote_no, subject, quotestage, validtill, hdnGrandTotal,
            account_id, customer_name, company, assigned_user_id, createdtime, modifiedtime, details
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            quote_no=excluded.quote_no,
            subject=excluded.subject,
            quotestage=excluded.quotestage,
            validtill=excluded.validtill,
            hdnGrandTotal=excluded.hdnGrandTotal,
            account_id=excluded.account_id,
            customer_name=excluded.customer_name,
            assigned_user_id=excluded.assigned_user_id,
            createdtime=excluded.createdtime,
            modifiedtime=excluded.modifiedtime,
            details=excluded.details`;
        await tursoExecute(sql, [
            id, q.quote_no || id, q.subject || '', q.quotestage || q.status || 'Draft',
            q.validtill || q.valid_until || '', q.hdnGrandTotal || q.total_amount || q.amount || 0,
            q.account_id || q.customer_id || '', q.customer_name || '',
            q.assigned_user_id || '', q.createdtime || q.created_at || new Date().toISOString(),
            q.modifiedtime || q.updated_at || new Date().toISOString(),
            typeof q.details === 'object' ? JSON.stringify(q.details) : (q.details || '')
        ]);
        return { id, ...q };
    },

    async deleteQuote(id) {
        return await tursoExecute('DELETE FROM vt_quotes WHERE id = ?', [id]);
    },

    // System Logs
    async getLogs(limit = 100) {
        return await tursoExecute(`SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT ${parseInt(limit)}`);
    },

    async addLog(userId, action, details) {
        const sql = 'INSERT INTO system_logs (user_id, action, details, timestamp) VALUES (?, ?, ?, ?)';
        return await tursoExecute(sql, [userId, action, details, new Date().toISOString()]);
    },

    // Services
    async getServices() {
        return await tursoExecute('SELECT * FROM services');
    }
};

window.turso = turso;
window.tursoClient = turso;
window.tursoExecute = tursoExecute;

// ============================================================
// TURSO TO SUPABASE COMPATIBILITY ADAPTER
// Guarantees zero breakage for legacy sbClient.from(...) calls
// ============================================================
function createTursoSbAdapter() {
    return {
        from: function(tableName) {
            const table = tableName.toLowerCase();
            let queryType = 'select';
            let selectCols = '*';
            let filterConditions = [];
            let orderCol = null;
            let orderAsc = true;
            let limitCount = null;
            let offsetCount = null;
            let insertData = null;
            let updateData = null;
            let isSingle = false;

            const chain = {
                select: function(cols = '*') {
                    queryType = 'select';
                    selectCols = cols;
                    return chain;
                },
                insert: function(records) {
                    queryType = 'insert';
                    insertData = Array.isArray(records) ? records : [records];
                    return chain;
                },
                upsert: function(records) {
                    queryType = 'upsert';
                    insertData = Array.isArray(records) ? records : [records];
                    return chain;
                },
                update: function(data) {
                    queryType = 'update';
                    updateData = data;
                    return chain;
                },
                delete: function() {
                    queryType = 'delete';
                    return chain;
                },
                eq: function(col, val) {
                    filterConditions.push({ col, val, op: '=' });
                    return chain;
                },
                neq: function(col, val) {
                    filterConditions.push({ col, val, op: '!=' });
                    return chain;
                },
                gte: function(col, val) {
                    filterConditions.push({ col, val, op: '>=' });
                    return chain;
                },
                lte: function(col, val) {
                    filterConditions.push({ col, val, op: '<=' });
                    return chain;
                },
                like: function(col, pattern) {
                    filterConditions.push({ col, val: pattern, op: 'LIKE' });
                    return chain;
                },
                ilike: function(col, pattern) {
                    filterConditions.push({ col, val: pattern, op: 'LIKE' });
                    return chain;
                },
                limit: function(n) {
                    limitCount = n;
                    return chain;
                },
                range: function(from, to) {
                    offsetCount = from;
                    limitCount = to - from + 1;
                    return chain;
                },
                order: function(col, opts = {}) {
                    orderCol = col;
                    orderAsc = opts.ascending !== false;
                    return chain;
                },
                single: function() {
                    isSingle = true;
                    limitCount = 1;
                    return chain;
                },
                maybeSingle: function() {
                    isSingle = true;
                    limitCount = 1;
                    return chain;
                },
                then: async function(onFulfilled, onRejected) {
                    try {
                        let resultData = [];
                        let sql = '';
                        let args = [];

                        // Resolve actual Turso database table
                        let actualTable = table;
                        if (table === 'organizations' || table === 'vtigercrm_organizations' || table === 'customers') {
                            actualTable = 'vt_customers';
                        } else if (table === 'vt_tickets' || table === 'tickets') {
                            actualTable = 'vt_tickets';
                        } else if (table === 'vt_quotes' || table === 'quotes') {
                            actualTable = 'vt_quotes';
                        } else if (table === 'records') {
                            actualTable = 'records';
                        }

                        // 1. SELECT
                        if (queryType === 'select') {
                            if (actualTable === 'permissions') {
                                resultData = [
                                    { id: 'role-1', role_name: 'Admin', access_level: 100 },
                                    { id: 'role-2', role_name: 'User', access_level: 10 },
                                    { id: 'role-3', role_name: 'Accounting', access_level: 30 }
                                ];
                                if (filterConditions.length > 0) {
                                    filterConditions.forEach(f => {
                                        resultData = resultData.filter(item => String(item[f.col]) === String(f.val));
                                    });
                                }
                                if (isSingle) resultData = resultData.length > 0 ? resultData[0] : null;
                                const resp = { data: resultData, error: null };
                                return onFulfilled ? onFulfilled(resp) : resp;
                            }

                            sql = `SELECT * FROM ${actualTable}`;
                            if (filterConditions.length > 0) {
                                const whereClauses = filterConditions.map(f => {
                                    args.push(f.val);
                                    return `${f.col} ${f.op} ?`;
                                });
                                sql += ` WHERE ` + whereClauses.join(' AND ');
                            }
                            if (orderCol) {
                                sql += ` ORDER BY ${orderCol} ${orderAsc ? 'ASC' : 'DESC'}`;
                            }
                            if (limitCount !== null) {
                                sql += ` LIMIT ${limitCount}`;
                                if (offsetCount !== null) {
                                    sql += ` OFFSET ${offsetCount}`;
                                }
                            }

                            resultData = await tursoExecute(sql, args);
                            if (isSingle) {
                                resultData = resultData.length > 0 ? resultData[0] : null;
                            }
                        }

                        // 2. INSERT / UPSERT
                        else if (queryType === 'insert' || queryType === 'upsert') {
                            if (actualTable === 'users' && insertData) {
                                for (const u of insertData) {
                                    await turso.addUser(u);
                                }
                                resultData = insertData;
                            } else if (actualTable === 'records' && insertData) {
                                for (const r of insertData) {
                                    await turso.addRecord(r);
                                }
                                resultData = insertData;
                            } else if ((actualTable === 'vt_tickets' || actualTable === 'tickets') && insertData) {
                                for (const t of insertData) {
                                    await turso.addTicket(t);
                                }
                                resultData = insertData;
                            } else if ((actualTable === 'vt_quotes' || actualTable === 'quotes') && insertData) {
                                for (const q of insertData) {
                                    await turso.addQuote(q);
                                }
                                resultData = insertData;
                            } else if (actualTable === 'system_logs' && insertData) {
                                for (const l of insertData) {
                                    await turso.addLog(l.user_id || 'System', l.action || '', l.details || '');
                                }
                                resultData = insertData;
                            } else if (actualTable === 'app_settings' && insertData) {
                                for (const s of insertData) {
                                    await tursoExecute('INSERT INTO app_settings (id, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET data=excluded.data, updated_at=CURRENT_TIMESTAMP', [s.id, typeof s.data === 'string' ? s.data : JSON.stringify(s.data)]);
                                }
                                resultData = insertData;
                            } else if (actualTable === 'permissions') {
                                resultData = insertData.map((d, i) => ({ id: 'role-' + (i + 1), ...d }));
                            } else if (insertData) {
                                for (const item of insertData) {
                                    const keys = Object.keys(item);
                                    const placeholders = keys.map(() => '?').join(', ');
                                    const vals = keys.map(k => item[k]);
                                    await tursoExecute(`INSERT OR REPLACE INTO ${actualTable} (${keys.join(', ')}) VALUES (${placeholders})`, vals);
                                }
                                resultData = insertData;
                            }
                        }

                        // 3. UPDATE
                        else if (queryType === 'update') {
                            if (updateData) {
                                const setKeys = Object.keys(updateData);
                                const setParts = setKeys.map(k => {
                                    args.push(updateData[k]);
                                    return `${k} = ?`;
                                });
                                sql = `UPDATE ${actualTable} SET ${setParts.join(', ')}`;
                                if (filterConditions.length > 0) {
                                    const whereClauses = filterConditions.map(f => {
                                        args.push(f.val);
                                        return `${f.col} ${f.op} ?`;
                                    });
                                    sql += ` WHERE ` + whereClauses.join(' AND ');
                                }
                                await tursoExecute(sql, args);
                                resultData = [updateData];
                            }
                        }

                        // 4. DELETE
                        else if (queryType === 'delete') {
                            sql = `DELETE FROM ${actualTable}`;
                            if (filterConditions.length > 0) {
                                const whereClauses = filterConditions.map(f => {
                                    args.push(f.val);
                                    return `${f.col} ${f.op} ?`;
                                });
                                sql += ` WHERE ` + whereClauses.join(' AND ');
                            }
                            await tursoExecute(sql, args);
                            resultData = [];
                        }

                        const response = { data: resultData, error: null };
                        return onFulfilled ? onFulfilled(response) : response;
                    } catch (err) {
                        console.warn('[Turso Adapter Error]', err);
                        const errResponse = { data: isSingle ? null : [], error: err };
                        return onFulfilled ? onFulfilled(errResponse) : errResponse;
                    }
                }
            };

            return chain;
        }
    };
}

// Set up global Turso and sbClient adapter
window.sbClient = createTursoSbAdapter();
console.log('TaskFlow: Secure Turso Adapter Active (Direct Token Removed, Proxied via /api/query)');
