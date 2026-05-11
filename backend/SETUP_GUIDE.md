# Google Apps Script Backend Setup Guide

## Overview
This guide explains how to set up the Google Apps Script backend for TaskFlow Portal, replacing Supabase with Google Sheets as the database.

## Architecture

```
Frontend (GitHub Pages)
├── index.html, style.css, ui.js, auth.js, app.js
└── data-adapter.js ← Uses GAS API instead of Supabase

              ↓↓↓ HTTP Requests ↓↓↓

Google Apps Script Web App
├── Code.gs ← Main entry point (doGet, doPost)
├── SheetDB.gs ← Database layer
├── Utils.gs ← Helper functions
└── API.gs ← API handlers

              ↓↓↓ Reads/Writes ↓↓↓

Google Sheet (TaskFlow_Records)
├── Sheet: Records
├── Sheet: Customers
├── Sheet: AppSettings
└── Sheet: Personnel (optional)
```

---

## Step 1: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click "+ New" → "Blank spreadsheet"
3. Name it: **TaskFlow_Records**
4. Copy the Sheet ID from URL: `spreadsheets/d/{SHEET_ID}/edit`
5. Keep it open

---

## Step 2: Create Google Apps Script Project

1. In your Google Sheet, click **Tools** → **Script editor**
2. This opens Google Apps Script IDE for this sheet
3. Replace any default code with the backend files:

### Copy each file content:

**File 1: Code.gs**
- Delete existing code
- Copy [Code.gs](Code.gs) content
- Paste it

**File 2: SheetDB.gs**
- Click **+ New file** → Select **More (⋯)**, **New → GAS file**
- Name it: `SheetDB`
- Copy [SheetDB.gs](SheetDB.gs) content
- Paste it

**File 3: Utils.gs**
- Click **+ New file**
- Name it: `Utils`
- Copy [Utils.gs](Utils.gs) content
- Paste it

**File 4: API.gs**
- Click **+ New file**
- Name it: `API`
- Copy [API.gs](API.gs) content
- Paste it

---

## Step 3: Initialize Sheets

1. In the Google Apps Script editor
2. Select function: **initializeSheets** (from Code.gs)
3. Click **Run** (▶️)
4. **Authorize** the script when asked
5. Check the Execution log - should say "Sheets initialized successfully!"

**Result**: You should now see 4 new sheets in your Google Sheet:
- `Records`
- `Customers`
- `AppSettings`
- (remove any unused default sheets)

---

## Step 4: Deploy as Web App

1. In Google Apps Script editor, click **Deploy** ⚙️
2. Select **New deployment**
3. Choose type: **Web app**
4. Config:
   - **Execute as**: Your Google Account
   - **Who has access**: "Anyone"
5. Click **Deploy**
6. Copy the new URL: `https://script.google.com/macros/d/{SCRIPT_ID}/usercontent`
7. This is your `GAS_BACKEND_URL`

---

## Step 5: Update Frontend Configuration

### In `backend/data-adapter.js`:
Find this line (around line 20):
```javascript
const GAS_BACKEND_URL = 'https://script.google.com/macros/d/YOUR_SCRIPT_ID/usercontent';
```

Replace with your deployed URL from Step 4

### In `backend/Code.gs`:
Find this line (around line 10):
```javascript
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID';
```

Replace `YOUR_GOOGLE_SHEET_ID` with your sheet ID from Step 1

---

## Step 6: Update Frontend to Use Google Apps Script

### Replace `data.js` with `data-adapter.js`:

**Option A: Direct replacement**
1. Rename `data.js` to `data.js.backup`
2. Rename `backend/data-adapter.js` to `data.js` in your frontend folder

**Option B: Keep both (recommended)**
1. Comment out the `<script src="data.js">` in `index.html`
2. Add: `<script src="backend/data-adapter.js"></script>`

---

## Step 7: Test the Integration

### Test Health Check:
Open browser console and run:
```javascript
fetch('YOUR_GAS_BACKEND_URL?action=health')
  .then(r => r.json())
  .then(d => console.log(d))
```

Expected output:
```json
{
  "status": "ok",
  "timestamp": "2026-05-02T10:30:00.000Z",
  "message": "TaskFlow Backend is running"
}
```

### Test in App:
1. Go to your frontend (GitHub Pages URL)
2. Open **Browser Console** (F12)
3. Try creating a new ticket
4. Check Google Sheet → `Records` sheet for new row

---

## API Endpoints

All endpoints use `POST` with JSON body:

### Records
```javascript
// GET records
{ action: 'recordsRead', filters: {} }

// ADD record
{ action: 'recordsAdd', record: {...} }

// UPDATE record
{ action: 'recordsUpdate', id: '...', updates: {...} }

// DELETE record
{ action: 'recordsDelete', id: '...' }
```

### Customers
```javascript
{ action: 'customersRead' }
{ action: 'customersAdd', customer: {...} }
{ action: 'customersUpdate', id: '...', updates: {...} }
```

### Settings
```javascript
{ action: 'settingsRead' }
{ action: 'settingsUpdate', setting: 'key', value: {...}, password: '...' }
```

---

## Database Schema

### Records Sheet
| Column | Type | Notes |
|--------|------|-------|
| ID | String | Unique identifier |
| TIMESTAMP | DateTime | Creation time |
| USER | String | Employee name |
| CRM_TICKET | String | vTiger ticket ID |
| SERVICE_DATE | Date | YYYY-MM-DD |
| COMPANY | String | Customer company |
| POSTCODE | String | Company postcode |
| MAIN_SERVICE | String | MENU UPDATE, CREDIT CARD, etc. |
| SUB_SERVICE | String | Sub category |
| DURATION | Number | Minutes (for menu updates) |
| PRICE | Number | £ Amount |
| PAYMENT_STATUS | String | Pending, Paid, etc. |
| DESCRIPTION | Text | Details |
| STATUS | String | Logged, Completed, On Hold |
| INVOICED | Boolean | TRUE/FALSE |
| ON_HOLD | Boolean | TRUE/FALSE |

### Customers Sheet
| Column | Type |
|--------|------|
| ID | String |
| COMPANY | String |
| POSTCODE | String |
| SERVICE_STATUS | String |

### AppSettings Sheet
| Column | Type | Notes |
|--------|------|-------|
| SETTING_KEY | String | personnel, pricing, rules, etc. |
| SETTING_VALUE | String | JSON encoded |

---

## Troubleshooting

### "Cannot read property 'getSheetByName'"
- Issue: Sheet ID is incorrect
- Solution: Double-check `SHEET_ID` in Code.gs

### "Invalid sheet name 'Records'"
- Issue: initializeSheets() wasn't run
- Solution: Run `initializeSheets()` function from Script Editor

### 403 Error on API calls
- Issue: Script not deployed correctly
- Solution: Re-deploy with "Execute as: Your Account" and "Anyone" access

### No data showing in app
- Issue: `GAS_BACKEND_URL` is wrong in data-adapter.js
- Solution: Copy exact URL from deploy step, test with health check first

### Settings password not working
- Issue: Daily password algorithm
- Solution: Password formula is `ika + (day+month+year) + tf`
  - For May 2, 2026: `ika2033tf` (2+5+2026=2033)
  - Or use master override: `ika789`

---

## Common Tasks

### Add a New Personnel Member
Edit in Google Sheet → AppSettings sheet → Find "personnel" row → Update JSON array

### Change Pricing
Edit in Google Sheet → AppSettings sheet → Find "pricing" row → Update JSON values

### Export Data to CSV
Google Sheets → File → Download → CSV (select specific sheet)

### Backup Data
Google Sheets → File → Version history (or download as Excel)

---

## Next Steps

- [x] Backend setup complete
- [ ] Test with sample data
- [ ] Configure vTiger integration (optional)
- [ ] Set up Google Sheets permissions (share with team)
- [ ] Deploy frontend to GitHub Pages

---

## Support

For issues:
1. Check browser console (F12) for errors
2. Check Google Apps Script editor → Executions for logs
3. Check Google Sheet data integrity
4. Test API endpoint with curl/Postman
