require('dotenv').config();
const { createClient } = require('@libsql/client');

async function setupDatabase() {
    const db = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN
    });

    try {
        console.log('1. Creating vt_service_departments table...');
        await db.execute(`
            CREATE TABLE IF NOT EXISTS vt_service_departments (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                description TEXT,
                icon_name TEXT,
                display_order INTEGER
            );
        `);

        console.log('2. Creating vt_service_types table...');
        await db.execute(`
            CREATE TABLE IF NOT EXISTS vt_service_types (
                id TEXT PRIMARY KEY,
                department_id TEXT NOT NULL,
                name TEXT NOT NULL,
                display_order INTEGER,
                FOREIGN KEY (department_id) REFERENCES vt_service_departments(id) ON DELETE CASCADE,
                UNIQUE(department_id, name)
            );
        `);

        console.log('3. Creating vt_appointments table...');
        await db.execute(`
            CREATE TABLE IF NOT EXISTS vt_appointments (
                id TEXT PRIMARY KEY,
                customer_id TEXT,
                customer_name TEXT,
                department_id TEXT,
                department_name TEXT,
                service_type_id TEXT,
                service_type_name TEXT,
                requested_date TEXT,
                time_preference TEXT,
                description TEXT,
                status TEXT DEFAULT 'Pending',
                assigned_to TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('4. Inserting Departments data...');
        const departments = [
            ['dept_menu', 'MENU UPDATE', 'Update menu items, prices, or layouts.', 'file-text', 1],
            ['dept_prog', 'PROGRAMMING', 'Configure or update till databases.', 'code', 2],
            ['dept_img', 'IMAGING', 'Operating system installations and system images.', 'monitor', 3],
            ['dept_card', 'CREDIT CARD', 'Setup or troubleshoot card terminals.', 'credit-card', 4],
            ['dept_reset', 'DATA RESET', 'Database reset or sales data cleanup.', 'refresh-cw', 5],
            ['dept_serv', 'SERVICE', 'General hardware or software maintenance.', 'tool', 6],
            ['dept_other', 'OTHER', 'Unlisted issues or custom requests.', 'star', 7]
        ];

        for (const [id, name, desc, icon, order] of departments) {
            await db.execute({
                sql: `INSERT OR IGNORE INTO vt_service_departments (id, name, description, icon_name, display_order) VALUES (?, ?, ?, ?, ?)`,
                args: [id, name, desc, icon, order]
            });
        }

        console.log('5. Inserting Service Types data...');
        const serviceTypes = [
            // MENU UPDATE
            ['st_menu_1', 'dept_menu', 'Items', 1],
            ['st_menu_2', 'dept_menu', 'Screen Layout', 2],
            ['st_menu_3', 'dept_menu', 'Prices', 3],
            ['st_menu_4', 'dept_menu', 'Printer Setup', 4],
            ['st_menu_5', 'dept_menu', 'Keypad', 5],
            ['st_menu_6', 'dept_menu', 'Caller ID', 6],
            ['st_menu_7', 'dept_menu', 'Other', 7],

            // PROGRAMMING
            ['st_prog_1', 'dept_prog', 'POS Upgrade', 1],
            ['st_prog_2', 'dept_prog', 'Kitchen Screen', 2],
            ['st_prog_3', 'dept_prog', 'Custom Setup', 3],
            ['st_prog_4', 'dept_prog', 'Other', 4],

            // IMAGING
            ['st_img_1', 'dept_img', 'New Till OS', 1],
            ['st_img_2', 'dept_img', 'Backup Image', 2],
            ['st_img_3', 'dept_img', 'Restore System', 3],
            ['st_img_4', 'dept_img', 'Other', 4],

            // CREDIT CARD
            ['st_card_1', 'dept_card', 'Card Terminal Setup', 1],
            ['st_card_2', 'dept_card', 'Payment Integration', 2],
            ['st_card_3', 'dept_card', 'Receipt Printer', 3],
            ['st_card_4', 'dept_card', 'Other', 4],

            // DATA RESET
            ['st_reset_1', 'dept_reset', 'Clear Sales Data', 1],
            ['st_reset_2', 'dept_reset', 'Factory Reset', 2],
            ['st_reset_3', 'dept_reset', 'Delete Products', 3],
            ['st_reset_4', 'dept_reset', 'Other', 4],

            // SERVICE
            ['st_serv_1', 'dept_serv', 'Hardware Fix', 1],
            ['st_serv_2', 'dept_serv', 'Software Update', 2],
            ['st_serv_3', 'dept_serv', 'Network Issue', 3],
            ['st_serv_4', 'dept_serv', 'Other', 4],

            // OTHER
            ['st_oth_1', 'dept_other', 'Custom Request', 1],
            ['st_oth_2', 'dept_other', 'Consultation', 2],
            ['st_oth_3', 'dept_other', 'System Audit', 3]
        ];

        for (const [id, dept_id, name, order] of serviceTypes) {
            await db.execute({
                sql: `INSERT OR IGNORE INTO vt_service_types (id, department_id, name, display_order) VALUES (?, ?, ?, ?)`,
                args: [id, dept_id, name, order]
            });
        }

        console.log('Database setup completed successfully!');
    } catch (e) {
        console.error('Error setting up database:', e);
    }
}

setupDatabase();
