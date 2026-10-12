require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@libsql/client');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Initialize Turso DB connection
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// GET USERS
app.get('/api/users', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE / UPDATE USER
app.post('/api/users', async (req, res) => {
  try {
    const { id, full_name, username, email, role, status, password, password_hash } = req.body;
    const userId = id || ('U-' + Date.now());
    const uname = username || (full_name ? full_name.toLowerCase().replace(/\s+/g, '') : userId);
    await db.execute({
      sql: `INSERT INTO users (id, full_name, username, email, role, status, password, password_hash) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              full_name=excluded.full_name,
              username=excluded.username,
              email=excluded.email,
              role=excluded.role,
              status=excluded.status,
              password=excluded.password,
              password_hash=excluded.password_hash`,
      args: [userId, full_name, uname, email || null, role || 'User', status || 'ACTIVE', password || '1234', password_hash || null]
    });
    res.json({ success: true, id: userId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE USER
app.delete('/api/users/:id', async (req, res) => {
  try {
    await db.execute({
      sql: 'DELETE FROM users WHERE id = ?',
      args: [req.params.id]
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGS
app.get('/api/logs', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT 100');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/logs', async (req, res) => {
  try {
    const { user_id, action, details, timestamp } = req.body;
    await db.execute({
      sql: 'INSERT INTO system_logs (user_id, action, details, timestamp) VALUES (?, ?, ?, ?)',
      args: [user_id, action, details, timestamp]
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CUSTOMERS
app.get('/api/customers', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM customers');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const customers = Array.isArray(req.body) ? req.body : [req.body];
    const queries = customers.map(c => ({
      sql: `INSERT INTO customers (
        id, organization_name, organization_number, industry, created_time, assigned_to, 
        modified_time, billing_address, billing_city, billing_postal_code, ownership, 
        primary_email, primary_phone, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET 
        organization_name=excluded.organization_name,
        organization_number=excluded.organization_number,
        industry=excluded.industry,
        modified_time=excluded.modified_time,
        billing_address=excluded.billing_address,
        billing_city=excluded.billing_city,
        billing_postal_code=excluded.billing_postal_code,
        ownership=excluded.ownership,
        primary_email=excluded.primary_email,
        primary_phone=excluded.primary_phone,
        description=excluded.description,
        assigned_to=excluded.assigned_to`,
      args: [
        c.id, c.organization_name, c.organization_number, c.industry, c.created_time, c.assigned_to,
        c.modified_time, c.billing_address, c.billing_city, c.billing_postal_code, c.ownership,
        c.primary_email, c.primary_phone, c.description
      ]
    }));
    
    // Execute all in a batch
    await db.batch(queries);
    res.json({ success: true, count: customers.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// INVOICES
app.get('/api/invoices', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM invoices');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/invoices', async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];
    const queries = items.map(c => ({
      sql: `INSERT INTO invoices (
        id, invoice_no, subject, account_id, invoicestatus, invoicedate, duedate, 
        hdnGrandTotal, balance, createdtime, modifiedtime, assigned_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET 
        invoice_no=excluded.invoice_no,
        subject=excluded.subject,
        account_id=excluded.account_id,
        invoicestatus=excluded.invoicestatus,
        invoicedate=excluded.invoicedate,
        duedate=excluded.duedate,
        hdnGrandTotal=excluded.hdnGrandTotal,
        balance=excluded.balance,
        modifiedtime=excluded.modifiedtime,
        assigned_user_id=excluded.assigned_user_id`,
      args: [
        c.id, c.invoice_no, c.subject, c.account_id, c.invoicestatus, c.invoicedate, c.duedate,
        c.hdnGrandTotal, c.balance, c.createdtime, c.modifiedtime, c.assigned_user_id
      ]
    }));
    await db.batch(queries);
    res.json({ success: true, count: items.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// APPOINTMENTS (EVENTS)
app.get('/api/appointments', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM appointments');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/appointments', async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];
    const queries = items.map(c => ({
      sql: `INSERT INTO appointments (
        id, subject, eventstatus, date_start, time_start, due_date, time_end,
        parent_id, assigned_user_id, description, createdtime, modifiedtime
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET 
        subject=excluded.subject,
        eventstatus=excluded.eventstatus,
        date_start=excluded.date_start,
        time_start=excluded.time_start,
        due_date=excluded.due_date,
        time_end=excluded.time_end,
        parent_id=excluded.parent_id,
        assigned_user_id=excluded.assigned_user_id,
        description=excluded.description,
        modifiedtime=excluded.modifiedtime`,
      args: [
        c.id, c.subject, c.eventstatus, c.date_start, c.time_start, c.due_date, c.time_end,
        c.parent_id, c.assigned_user_id, c.description, c.createdtime, c.modifiedtime
      ]
    }));
    await db.batch(queries);
    res.json({ success: true, count: items.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// RECORDS / TICKETS
app.get('/api/records', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM records ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/records', async (req, res) => {
  try {
    const r = req.body;
    const id = r.id || ('REC-' + Date.now());
    await db.execute({
      sql: `INSERT INTO records (
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
        updated_at=excluded.updated_at`,
      args: [
        id, r.ticket_id || id, r.customer_id || '', r.customer_name || '', r.phone || '', r.postcode || '', r.address || '',
        r.category || '', r.service_type || '', r.sub_services || '', r.price || 0, r.vat || 0, r.total_price || 0,
        r.payment_method || '', r.status || 'Open', r.assigned_to || '', r.notes || '', r.description || '',
        r.created_at || new Date().toISOString(), new Date().toISOString()
      ]
    });
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/records/:id', async (req, res) => {
  try {
    await db.execute({
      sql: 'DELETE FROM records WHERE id = ?',
      args: [req.params.id]
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// TICKETS
app.get('/api/tickets', async (req, res) => {
  try {
    const { parent_id, customer_id } = req.query;
    const cid = parent_id || customer_id;
    let sql = 'SELECT * FROM tickets ORDER BY createdtime DESC';
    let args = [];
    if (cid) {
      sql = 'SELECT * FROM tickets WHERE parent_id = ? ORDER BY createdtime DESC';
      args = [cid];
    }
    const result = await db.execute({ sql, args });
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tickets', async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];
    const queries = items.map(t => {
      const id = t.id || ('TCK-' + Date.now() + '-' + Math.floor(Math.random()*1000));
      return {
        sql: `INSERT INTO tickets (
          id, ticket_no, ticket_title, ticketstatus, ticketpriorities, ticketseverities,
          parent_id, customer_name, assigned_user_id, createdtime, modifiedtime, solution, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          ticket_no=excluded.ticket_no,
          ticket_title=excluded.ticket_title,
          ticketstatus=excluded.ticketstatus,
          ticketpriorities=excluded.ticketpriorities,
          ticketseverities=excluded.ticketseverities,
          parent_id=excluded.parent_id,
          customer_name=excluded.customer_name,
          assigned_user_id=excluded.assigned_user_id,
          createdtime=excluded.createdtime,
          modifiedtime=excluded.modifiedtime,
          solution=excluded.solution,
          description=excluded.description`,
        args: [
          id, t.ticket_no || id, t.ticket_title || t.title || t.subject || '',
          t.ticketstatus || t.status || 'Open', t.ticketpriorities || t.priority || 'Normal',
          t.ticketseverities || 'Minor', t.parent_id || t.customer_id || '',
          t.customer_name || '', t.assigned_user_id || t.assigned_to || '',
          t.createdtime || t.created_at || new Date().toISOString(),
          t.modifiedtime || t.updated_at || new Date().toISOString(),
          t.solution || '', t.description || ''
        ]
      };
    });
    await db.batch(queries);
    res.json({ success: true, count: items.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tickets/:id', async (req, res) => {
  try {
    await db.execute({ sql: 'DELETE FROM tickets WHERE id = ?', args: [req.params.id] });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// QUOTES
app.get('/api/quotes', async (req, res) => {
  try {
    const { account_id, customer_id } = req.query;
    const cid = account_id || customer_id;
    let sql = 'SELECT * FROM quotes ORDER BY createdtime DESC';
    let args = [];
    if (cid) {
      sql = 'SELECT * FROM quotes WHERE account_id = ? ORDER BY createdtime DESC';
      args = [cid];
    }
    const result = await db.execute({ sql, args });
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/quotes', async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];
    const queries = items.map(q => {
      const id = q.id || ('QUO-' + Date.now() + '-' + Math.floor(Math.random()*1000));
      return {
        sql: `INSERT INTO quotes (
          id, quote_no, subject, quotestage, validtill, hdnGrandTotal,
          account_id, customer_name, assigned_user_id, createdtime, modifiedtime, details
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
          details=excluded.details`,
        args: [
          id, q.quote_no || id, q.subject || '', q.quotestage || q.status || 'Draft',
          q.validtill || q.valid_until || '', q.hdnGrandTotal || q.total_amount || q.amount || 0,
          q.account_id || q.customer_id || '', q.customer_name || '',
          q.assigned_user_id || '', q.createdtime || q.created_at || new Date().toISOString(),
          q.modifiedtime || q.updated_at || new Date().toISOString(),
          typeof q.details === 'object' ? JSON.stringify(q.details) : (q.details || '')
        ]
      };
    });
    await db.batch(queries);
    res.json({ success: true, count: items.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/quotes/:id', async (req, res) => {
  try {
    await db.execute({ sql: 'DELETE FROM quotes WHERE id = ?', args: [req.params.id] });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SERVICES
app.get('/api/services', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM services');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SETTINGS
app.get('/api/settings', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM app_settings');
    const settings = {};
    result.rows.forEach(r => {
      try { settings[r.id] = JSON.parse(r.data); } catch(e) { settings[r.id] = r.data; }
    });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const { id, data } = req.body;
    const strData = typeof data === 'string' ? data : JSON.stringify(data);
    await db.execute({
      sql: 'INSERT INTO app_settings (id, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET data=excluded.data, updated_at=CURRENT_TIMESTAMP',
      args: [id, strData]
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// NEW MODULES (Products, Contacts, Contracts, Comments, Documents)
// ==========================================
const createGenericEndpoints = (moduleName) => {
  app.get(`/api/${moduleName}`, async (req, res) => {
    try {
      const result = await db.execute(`SELECT * FROM ${moduleName}`);
      const data = result.rows.map(r => {
        try { return JSON.parse(r.data); } catch(e) { return {}; }
      });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post(`/api/${moduleName}`, async (req, res) => {
    try {
      const items = Array.isArray(req.body) ? req.body : [req.body];
      const queries = items.map(item => ({
        sql: `INSERT INTO ${moduleName} (id, data, modifiedtime) VALUES (?, ?, ?) 
              ON CONFLICT(id) DO UPDATE SET data=excluded.data, modifiedtime=excluded.modifiedtime`,
        args: [item.id, JSON.stringify(item), item.modifiedtime || '']
      }));
      await db.batch(queries);
      res.json({ success: true, count: items.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};

['products', 'contacts', 'contracts', 'comments', 'documents'].forEach(createGenericEndpoints);

// ==========================================
// SYNC LOGS
// ==========================================
app.get('/api/sync-logs', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM sync_logs ORDER BY timestamp DESC LIMIT 100');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sync-logs', async (req, res) => {
  try {
    const logData = req.body;
    await db.execute({
      sql: 'INSERT INTO sync_logs (log_data, timestamp) VALUES (?, ?)',
      args: [JSON.stringify(logData), logData.timestamp || new Date().toISOString()]
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/sync-logs/clear', async (req, res) => {
  try {
    await db.execute('DELETE FROM sync_logs');
    res.json({ success: true, message: 'Logs cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// SERVE STATIC FILES
const path = require('path');
app.use(express.static(__dirname));

// START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`TaskFlow Turso API Server running on port ${PORT}`);
});

