# TaskFlow Portal - Google Apps Script Backend

## Overview

This folder contains everything you need to migrate TaskFlow Portal from Supabase to Google Apps Script + Google Sheets.

## What's Inside

### 📋 Documentation
- **QUICK_START.md** - 5-minute setup (start here!)
- **SETUP_GUIDE.md** - Detailed step-by-step instructions
- **MIGRATION.md** - Migration guide from Supabase
- **CONFIG.md** - Configuration reference

### 💾 Google Apps Script Files (copy to Google Apps Script editor)
- **Code.gs** - Main entry point, doGet/doPost handlers
- **SheetDB.gs** - Google Sheets database wrapper
- **Utils.gs** - Utility functions (ID generation, passwords, etc.)
- **API.gs** - API endpoint handlers

### 🎨 Frontend Files
- **data-adapter.js** - Replace your `data.js` with this (connects frontend to GAS backend)

---

## Quick Links

| Need | File |
|------|------|
| Just want to get started? | → Read **QUICK_START.md** first |
| Detailed setup instructions | → **SETUP_GUIDE.md** |
| Migrating from Supabase | → **MIGRATION.md** |
| Configuration help | → **CONFIG.md** |

---

## Architecture

```
┌─────────────────────────┐
│    Frontend (GitHub)    │
│  HTML, CSS, JS, UI      │
│ (unchanged except JS)   │
└────────────┬────────────┘
             │
             │ HTTP POST/GET
             │
┌────────────▼────────────┐
│  Google Apps Script     │
│  Web App Backend        │
│  Code.gs, SheetDB.gs    │
│  Utils.gs, API.gs       │
└────────────┬────────────┘
             │
             │ Apps Script API
             │
┌────────────▼────────────┐
│   Google Sheet          │
│  TaskFlow_Records       │
│                         │
│  - Records sheet        │
│  - Customers sheet      │
│  - AppSettings sheet    │
└─────────────────────────┘
```

---

## File Purposes

### Code.gs
- **Purpose**: Main entry point for Google Apps Script
- **Functions**:
  - `doGet(e)` - Handles GET requests (health check)
  - `doPost(e)` - Handles POST requests (API calls)
  - `initializeSheets()` - One-time setup function
- **Update**: Edit SHEET_ID (line 10)

### SheetDB.gs
- **Purpose**: Database wrapper for Google Sheets
- **Classes**: `SheetDB`
- **Methods**: 
  - `getRecords()` - Read records
  - `addRecord()` - Insert record
  - `updateRecord()` - Update record
  - `deleteRecord()` - Delete record
  - (similar for Customers)
  - `getSetting()`, `updateSetting()` - Settings

### Utils.gs
- **Purpose**: Helper functions
- **Functions**:
  - `generateId()` - Create unique IDs
  - `getCurrentTimestamp()` - Get ISO timestamp
  - `getSettingsPassword()` - Generate daily password
  - `mapToAppFormat()` - Convert DB to app format
  - etc.

### API.gs
- **Purpose**: API endpoint handlers
- **Object**: `API` with methods:
  - `readRecords()` - Handle recordsRead action
  - `addRecord()` - Handle recordsAdd action
  - `updateRecord()` - Handle recordsUpdate action
  - `deleteRecord()` - Handle recordsDelete action
  - (similar for Customers)
  - `readSettings()`, `updateSettings()`

### data-adapter.js
- **Purpose**: Frontend JavaScript that talks to GAS backend
- **Replaces**: Original `data.js` (which used Supabase)
- **Key Function**: `gasAPICall(action, payload)` - Sends HTTP requests to GAS
- **Update**: Set GAS_BACKEND_URL (line 20)

---

## Data Flow

### Creating a New Ticket

1. **Frontend** (index.html form)
   - User fills form and clicks "Create"
   - Calls `createRecord(recordData)`

2. **data-adapter.js**
   - Calls `gasAPICall('recordsAdd', { record: recordData })`

3. **Google Apps Script** (Code.gs)
   - `doPost()` receives request
   - Routes to `API.addRecord()`

4. **API.gs**
   - Converts app format to DB format
   - Calls `sheetDB.addRecord(dbRecord)`

5. **SheetDB.gs**
   - Appends row to Google Sheet "Records"

6. **Google Sheets**
   - New row appears in "Records" sheet ✓

7. **Frontend** (data-adapter.js)
   - Receives success response
   - Updates local `records` array
   - Calls `renderDataTable()`

---

## API Actions

All actions sent via POST with JSON body:

```javascript
{
  "action": "recordsRead",
  "filters": {}
}
```

### Records
- `recordsRead` - Get all records(with filters)
- `recordsAdd` - Create new record
- `recordsUpdate` - Update existing record
- `recordsDelete` - Delete record

### Customers
- `customersRead` - Get all customers
- `customersAdd` - Create customer
- `customersUpdate` - Update customer

### Settings
- `settingsRead` - Get all settings
- `settingsUpdate` - Update setting (password protected)

---

## Setup Checklist

```
PART 1: Create Google Sheet and Google Apps Script
- [ ] Create new Google Sheet
- [ ] Get SHEET_ID from URL
- [ ] Open Google Apps Script from the sheet
- [ ] Copy Code.gs, SheetDB.gs, Utils.gs, API.gs to script editor

PART 2: Initialize Backend
- [ ] Update SHEET_ID in Code.gs
- [ ] Run initializeSheets() function
- [ ] Verify 4 sheets created: Records, Customers, AppSettings, etc.

PART 3: Deploy Backend
- [ ] Deploy as Web App
- [ ] Copy deployed URL

PART 4: Update Frontend
- [ ] Update data-adapter.js with GAS_BACKEND_URL
- [ ] Update index.html to use data-adapter.js instead of data.js
- [ ] Test API with health check

PART 5: Test
- [ ] Create test ticket in UI
- [ ] Verify row appears in Google Sheets "Records"
- [ ] Verify data syncs back to UI
```

---

## Important Notes

### Security
- ⚠️ Deploy with "Anyone" access (required for frontend to call)
- ✅ Settings are password protected via `Utils.validatePassword()`
- ✅ Password is daily code: `ika + sum_of_date_parts + tf`

### Permissions
- Make sure Google Sheet is readable/writable by your account
- Google Apps Script must be deployed from your account

### Quotas
- Google Apps Script has usage quotas (see documentation)
- Google Sheets: max 10 million cells
- Should be fine for small to medium datasets

### Differences from Supabase
- No real-time updates (would need polling)
- Slightly slower API calls
- No complex queries (simpler filtering)
- All data in one Sheet
- No "custom" data types (everything is string/number)

---

## Troubleshooting

### Cannot find SHEET_ID
- Open Google Sheet → URL has `/d/{SHEET_ID}/edit`
- Copy that ID into Code.gs line 10

### initializeSheets() doesn't work
- Click Run without selecting any function first
- Make sure you're in Google Apps Script editor
- Check Executions tab for errors

### API returns 404
- Check GAS_BACKEND_URL in data-adapter.js
- Test with health check: `fetch(URL + '?action=health')`
- Make sure you deployed as "Web app" with "Anyone" access

### No data in app
- Check browser console (F12) for errors
- Check Google Sheet "Records" sheet exists
- Verify data was added to sheet
- Check GAS_BACKEND_URL is correct

### Settings password doesn't work
- Password is `ika + (day + month + year) + tf`
- Today (May 2, 2026): `ika2033tf` (2+5+2026=2033)
- Or use master: `ika789`

---

## Directory Structure

```
backend/
├── Code.gs ........................... Main Google Apps Script file
├── SheetDB.gs ........................ Database wrapper class
├── Utils.gs .......................... Utility functions
├── API.gs ............................ API endpoint handlers
├── data-adapter.js ................... Frontend adapter (use instead of data.js)
│
├── QUICK_START.md .................... 5-minute setup guide (start here)
├── SETUP_GUIDE.md .................... Detailed setup instructions
├── MIGRATION.md ...................... Supabase to GAS migration guide
├── CONFIG.md ......................... Configuration reference
└── README.md ......................... This file
```

---

## Next Steps

1. **Read**: `QUICK_START.md` (5 minutes)
2. **Follow**: `SETUP_GUIDE.md` (step-by-step)
3. **Deploy**: Google Apps Script Web App
4. **Test**: Create new ticket and verify in Google Sheet
5. **Done**: Your backend is running! 🎉

---

## Support

- Google Apps Script docs: https://developers.google.com/apps-script
- Google Sheets API: https://developers.google.com/sheets/api
- GitHub Issue Tracker: (link to your repo)

---

Last Updated: May 2026
Version: 1.0
