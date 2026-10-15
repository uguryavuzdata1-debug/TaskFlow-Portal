# TaskFlow Portal – Modern Management Dashboard

Professional management portal for service tracking, CRM integration, and automated invoicing.

## 🚀 Overview
TaskFlow is a high-performance, build-free administrative dashboard designed for service-oriented businesses. It integrates directly with **Turso Cloud (libSQL)** for cloud data persistence and connects with **Vtiger CRM** for live two-way customer and service synchronization.

## 🛠 Technology Stack
- **Frontend**: Vanilla HTML5, CSS3 (Modern Design System), JavaScript (ES6+)
- **Database**: Turso Cloud (libSQL) – `https://taskflow-uguryavuz.aws-eu-west-1.turso.io`
- **Backend / API**: Express.js API & Static Server (`server.js`, port 3000)
- **CRM Sync Engine**: Python 3.12 (`Works_CRM/Source` – `sync_all_turso.py`)
- **Reporting**: Automated Telegram Daily Evening Reporter (`telegram_reporter.js`, 17:50 schedule)
- **Styling**: Custom Design System with Plus Jakarta Sans & IBM Plex Sans, Glassmorphism effects.
- **Architecture**: Modular SPA logic with `js/turso.js`, `js/customers.js`, `js/command_palette.js`, `js/api.js`, `app.js`.

## 📁 Key Files & Directories
- `index.html`: Main application structure, responsive navigation, and modal components.
- `app.js`: Core logic and application state management.
- `js/command_palette.js`: Global spotlight search (`Ctrl + K`) for instant customer, phone, AnyDesk lookup.
- `js/turso.js`: Native Turso Cloud libSQL client and API query adapter.
- `js/customers.js`: Customer management, search, detail slide-over panel, tickets, quotes, and appointments.
- `js/api.js`: Unified data loader connecting to Turso Cloud DB with live sync status modal.
- `server.js`: Express.js API server (`/api/health`, `/api/sync/status`, `/api/customers`, etc.) serving frontend & API.
- `style.css`: Modern UI design system and component styling.

## 🎨 Branding & Colors
- **Primary Blue:** `#1b4376` (Logins, primary actions, accents)
- **Secondary Orange:** `#d87617` (Navigation accent)
- **Logo:** `ika2.PNG`

## 💡 Key Features
- **Global Command Palette (`Ctrl + K`)**: Instant search across 6,300+ customers by name, phone, AnyDesk till, or postcode from anywhere in the application.
- **Live CRM Sync Monitor**: Real-time sync health badge in the navbar with detailed breakdown of tickets, customers, and quotes.
- **Dashboard**: Quick category-based ticket creation and live KPI metrics.
- **Invoicing Module**: Dual-tab (Pending/Invoiced) tracking with full record editing.
- **Customer Directory**: Synchronized client list from Turso DB with AnyDesk Till details and slide-over panel.
- **Service Tickets (`tickets`)**: Matched with customer names and verified technicians (`Ugur Yavuz`, `ugur isikcevahir`, `Ahmet Baltaci`, `Ibrahim Ahmet`).
- **Quotations (`quotes`)**: Real-time quote stage, grand total, customer names, and staff assignment.
- **Calendar & Appointments (`appointments`)**: Planned schedule synchronized with CRM events.
- **Automated Telegram Reports**: Daily 17:50 end-of-day summary automatically sent to management chat.

## 🛠 Running Locally
1. Start background services (Node server & Python CRM Sync Daemon):
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\run_services.ps1
   ```
   *Alternatively, run directly:*
   ```cmd
   node server.js
   ```
2. Open **`http://localhost:3000/`** in your browser.

## 📡 Live API Endpoints
- `GET /api/health`: Server uptime, memory, and Turso DB latency check.
- `GET /api/sync/status`: Live sync engine metrics and daily transfer counts.
- `GET /api/customers?q=search_term&limit=50`: High-speed server-side customer search and pagination.
- `GET /api/telegram/status`: Telegram bot configuration & schedule status.

---
*Created and maintained by Antigravity for TaskFlow Portal.*
