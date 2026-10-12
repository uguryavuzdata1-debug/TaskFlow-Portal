# TaskFlow Portal – Modern Management Dashboard

Professional management portal for service tracking, CRM integration, and automated invoicing.

## 🚀 Overview
TaskFlow is a high-performance, build-free administrative dashboard designed for service-oriented businesses. It integrates directly with **Turso Cloud (libSQL)** for cloud data persistence and connects with **Vtiger CRM** for live two-way customer and service synchronization.

## 🛠 Technology Stack
- **Frontend**: Vanilla HTML5, CSS3 (Modern UI Tokens), JavaScript (ES6+)
- **Database**: Turso Cloud (libSQL) – `https://taskflow-uguryavuz.aws-eu-west-1.turso.io`
- **Backend / Bridge**: Express.js Local API Server (`server.js`, port 3000)
- **CRM Sync Engine**: Python 3.12 (`Works_CRM/Source` - `sync_all_turso.py`)
- **Styling**: Custom Design System with Inter Font, CSS Variables, and Glassmorphism effects.
- **Architecture**: Modular SPA logic with `js/turso.js`, `js/customers.js`, `js/api.js`, `app.js`.

## 📁 Key Files & Directories
- `index.html`: Main application structure and UI components.
- `app.js`: Core logic and application state management.
- `js/turso.js`: Native Turso Cloud libSQL client and API query adapter.
- `js/customers.js`: Customer management, search, detail panel, tickets, quotes, and appointments.
- `js/api.js`: Unified data loader connecting to Turso Cloud DB.
- `server.js`: Express.js API bridge for local and external sync services.
- `style.css`: Modern UI design system and component styling.

## 🎨 Branding & Colors
- **Primary Blue:** `#1b4376` (Used for logins, buttons, and accents)
- **Secondary Orange:** `#d87617` (Used for main navigation bar)
- **Logo:** `ika2.PNG`

## 💡 Key Features
- **Dashboard**: Quick category-based ticket creation.
- **Invoicing Module**: Dual-tab (Pending/Invoiced) tracking with full record editing.
- **Customer Directory**: Synchronized 6.300+ client list from Turso DB with AnyDesk Till details.
- **Service Tickets (`tickets`)**: Matched with customer names and verified technicians (`Ugur Yavuz`, `ugur isikcevahir`, `Ahmet Baltaci`, `Ibrahim Ahmet`).
- **Quotations (`quotes`)**: Real-time quote stage, grand total, customer names, and staff assignment.
- **Calendar & Appointments (`appointments`)**: Planned schedule synchronized with CRM events.

## 🛠 Running Locally
1. Start Node API server:
   ```cmd
   node server.js
   ```
2. Start HTTP server:
   ```cmd
   python -m http.server 8000
   ```
3. Open `http://localhost:8000/` in browser.

---
*Created by Antigravity for TaskFlow Portal.*
