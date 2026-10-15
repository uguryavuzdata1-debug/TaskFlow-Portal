# Database Table Naming Conventions: CRM vs TaskFlow

## 1. CRM-Synced Tables (Must have `vt_` prefix)
All tables that represent entities mirrored from or synced with the external vTiger CRM MUST be prefixed with `vt_`:
- `vt_tickets` (CRM Service & Support Tickets)
- `vt_customers` (CRM Organizations / Accounts)
- `vt_quotes` (CRM Quotes)
- `vt_products` (CRM Products & Inventory)
- `vt_contracts` (CRM Service Contracts)
- `vt_documents` (CRM Attached Files / Docs)
- `vt_comments` (CRM Ticket ModComments)
- `vt_service_types` (CRM Service Type Classifications)
- `vt_service_departments` (CRM Department Classifications)
- `vt_contacts` (CRM Person Contacts)
- `vt_users` (CRM Technicians / Assigned Personnel)

## 2. TaskFlow Native Tables (MUST NOT have `vt_` prefix)
All tables created by or belonging natively to the TaskFlow portal MUST NOT have the `vt_` prefix:
- `appointments` (TaskFlow Appointment Booking & Scheduling)
- `taskflow_users` (TaskFlow Internal Portal Users & Roles)
- `records` (TaskFlow Local Work Records)
- `invoices` (TaskFlow Local Invoices)
- `services` (TaskFlow Local Service Catalog)
- `app_settings` (Portal Configuration)
- `sync_logs` (Sync History Logs)
- `system_logs` (Security & Audit Logs)

## 3. Strict Rule
NEVER name a TaskFlow-originating table with `vt_` (e.g. NEVER use `vt_appointments` — always use `appointments`).
