require('dotenv').config();
const { createClient } = require('@libsql/client');

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        invoice_no TEXT,
        subject TEXT,
        account_id TEXT,
        invoicestatus TEXT,
        invoicedate TEXT,
        duedate TEXT,
        hdnGrandTotal TEXT,
        balance TEXT,
        createdtime TEXT,
        modifiedtime TEXT,
        assigned_user_id TEXT
      )
    `);
    console.log("Invoices table created/exists.");

    await db.execute(`
      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        subject TEXT,
        eventstatus TEXT,
        date_start TEXT,
        time_start TEXT,
        due_date TEXT,
        time_end TEXT,
        parent_id TEXT,
        assigned_user_id TEXT,
        description TEXT,
        createdtime TEXT,
        modifiedtime TEXT
      )
    `);
    console.log("Appointments table created/exists.");

    await db.execute(`
      CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        ticket_no TEXT,
        ticket_title TEXT,
        ticketstatus TEXT,
        ticketpriorities TEXT,
        ticketseverities TEXT,
        parent_id TEXT,
        customer_name TEXT,
        assigned_user_id TEXT,
        createdtime TEXT,
        modifiedtime TEXT,
        solution TEXT,
        description TEXT
      )
    `);
    console.log("Tickets table created/exists.");

    await db.execute(`
      CREATE TABLE IF NOT EXISTS quotes (
        id TEXT PRIMARY KEY,
        quote_no TEXT,
        subject TEXT,
        quotestage TEXT,
        validtill TEXT,
        hdnGrandTotal REAL,
        account_id TEXT,
        customer_name TEXT,
        assigned_user_id TEXT,
        createdtime TEXT,
        modifiedtime TEXT,
        details TEXT
      )
    `);
    console.log("Quotes table created/exists.");

    // Dynamic Generic Tables
    const modules = ['products', 'contacts', 'contracts', 'comments', 'documents'];
    for (const mod of modules) {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS ${mod} (
          id TEXT PRIMARY KEY,
          data TEXT,
          modifiedtime TEXT
        )
      `);
      console.log(`${mod} table created/exists.`);
    }

    // Sync Logs Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sync_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        log_data TEXT,
        timestamp TEXT
      )
    `);
    console.log("sync_logs table created/exists.");
    
  } catch(e) {
    console.error("Error setting up tables", e);
  }
}
run();
