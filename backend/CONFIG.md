# Configuration Template for Google Apps Script Backend

This file documents all configuration variables that need to be set.

## Required Configuration

### 1. In `backend/Code.gs` (Line 10)

```javascript
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID';
```

**Where to find:**
- Open your Google Sheet
- Copy from URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`

**Example:**
```javascript
const SHEET_ID = '1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t';
```

---

### 2. In `backend/data-adapter.js` (Line 20)

```javascript
const GAS_BACKEND_URL = 'https://script.google.com/macros/d/YOUR_SCRIPT_ID/usercontent';
```

**Where to find:**
- In Google Apps Script editor
- Click **Deploy → Select deployment (the latest one)**
- Copy the URL from "New Deployment" dialog
- Usually looks like: `https://script.google.com/macros/d/AKfycbw...../usercontent`

**Example:**
```javascript
const GAS_BACKEND_URL = 'https://script.google.com/macros/d/AKfycbw123456789abcdefghijk/usercontent';
```

---

### 3. In `index.html` (Find and update script tag)

**Before:**
```html
<script src="data.js"></script>
```

**After:**
```html
<script src="backend/data-adapter.js"></script>
```

---

## Optional Configuration

### Supabase Keys (can be removed)

In `config.js`, these are no longer used but can be left as-is:

```javascript
const SUPABASE_URL = 'https://ekjhhjrhfkoiklyxjfpu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hz1a48NHx7c8RPV_RYHfZg_YNvnNOdH';
```

**Action**: Keep them commented out or remove entirely. They won't be used.

---

## Settings in Google Apps Script

After running `initializeSheets()`, configure these in the Google Sheet:

### Personnel (in AppSettings sheet)
Column A: `personnel`
Column B: `["UGUR YAVUZ", "AHMET BALTACI", "UGUR ISIKCEVAHIR"]`

### Pricing (in AppSettings sheet)
```json
{
  "S1_SetMenu": 35.00,
  "S1_Base": 125.00,
  "S1_Hourly": 25.00,
  "S2": 125.00,
  "S3": 125.00,
  "S4": 65.00,
  "S6": 0.00
}
```

### Rules (in AppSettings sheet)
```json
{
  "durationMins": 60,
  "surcharge": 25.00
}
```

### Sub-Services (in AppSettings sheet)
```json
{
  "S1": [
    {name:"Food and Drink Menu",price:0},
    {name:"Food Menu Only",price:0},
    ...
  ],
  "S2": [...],
  "S3": [...],
  "S4": [...],
  "S5": [...],
  "S6": [...]
}
```

---

## Verification Checklist

- [ ] Google Sheet created and SHEET_ID copied
- [ ] Google Apps Script deployed and URL copied
- [ ] Code.gs: SHEET_ID updated
- [ ] data-adapter.js: GAS_BACKEND_URL updated
- [ ] index.html: script src changed to data-adapter.js
- [ ] initializeSheets() function executed
- [ ] Health check API working (test with fetch)
- [ ] First test ticket created successfully

---

## How to Find Your URLs

### Finding SHEET_ID

1. Open your Google Sheet
2. URL will be: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
3. Copy the long string between `/d/` and `/edit`

Example URL:
```
https://docs.google.com/spreadsheets/d/1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t/edit#gid=0
                                           └─────────────────────────────────────┘
                                                    This is SHEET_ID
```

### Finding GAS Web App URL

1. In Google Apps Script editor
2. Click **Deploy ⚙️ button**
3. Click **All deployments** (if not showing)
4. Click your "Web app" deployment
5. URL is visible: `https://script.google.com/macros/d/AKfycbw.../usercontent`
6. Copy entire URL

---

## Troubleshooting Configuration

### "Cannot read property sheets from undefined"
- ✅ SHEET_ID in Code.gs is wrong or missing

### "404 Not Found" errors in console
- ✅ GAS_BACKEND_URL in data-adapter.js is wrong or missing

### "Invalid JSON" in AppSettings
- ✅ Configuration values are not properly JSON formatted
- ✅ Use online JSON validator to check

### Settings password not accepting
- ✅ Daily password formula: `ika + (day + month + year) + tf`
- ✅ Today (May 2, 2026): `ika2033tf`
- ✅ Or use master: `ika789`

---

## Environment Variables (Optional)

For advanced users, you can use Google Apps Script Project Properties:

```javascript
function setProjectProperty(key, value) {
  PropertiesService.getScriptProperties().setProperty(key, value);
}

function getProjectProperty(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

// Usage:
const SHEET_ID = getProjectProperty('SHEET_ID') || 'fallback_id';
```

This allows configuration without editing code.

---

## Summary

**3 values to update:**
1. SHEET_ID (in Code.gs)
2. GAS_BACKEND_URL (in data-adapter.js)
3. Script src (in index.html)

That's all! 🎉
