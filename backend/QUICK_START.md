# Google Apps Script Backend - Quick Start (5 Minutes)

## TL;DR - Just the essentials

### 1️⃣ Create Sheet & Script Project
- Go to Google Sheets: https://sheets.google.com
- Click "+ New"
- Name it: `TaskFlow_Records`
- Click **Tools → Script editor**
- This opens your Google Apps Script project

### 2️⃣ Copy Backend Code
Copy these 4 files into your Google Apps Script project:

1. **Code.gs** (replace default code)
2. **SheetDB.gs** (new file - click +)
3. **Utils.gs** (new file)
4. **API.gs** (new file)

All files are in `/backend/` folder

### 3️⃣ Initialize Sheets
- Select function: `initializeSheets`
- Click Run ▶️
- Authorize when asked
- Done! (you should see 4 new sheets created)

### 4️⃣ Deploy as Web App
- Click **Deploy ⚙️ → New deployment**
- Type: **Web app**
- Execute as: Your account
- Who has access: **Anyone**
- Copy the URL (example: `https://script.google.com/macros/d/ABC123.../usercontent`)

### 5️⃣ Update Frontend
**In `backend/data-adapter.js` line 20:**
```javascript
const GAS_BACKEND_URL = 'YOUR_DEPLOYED_URL_HERE';
```

Paste the URL from step 4

**In `index.html`:**
Change:
```html
<script src="data.js"></script>
```
To:
```html
<script src="backend/data-adapter.js"></script>
```

### 6️⃣ Test
- Open your app in browser
- Open Console (F12)
- Try creating a new ticket
- Check Google Sheet → look for new row in `Records` sheet ✅

---

## File Locations

```
your-project/
├── index.html
├── backend/
│   ├── Code.gs ← Copy to Google Apps Script
│   ├── SheetDB.gs ← Copy to Google Apps Script
│   ├── Utils.gs ← Copy to Google Apps Script
│   ├── API.gs ← Copy to Google Apps Script
│   ├── data-adapter.js ← Replace data.js with this
│   ├── SETUP_GUIDE.md ← Full instructions
│   └── MIGRATION.md ← Migration guide
```

---

## If Something Goes Wrong

**Error: "Script not deployed"**
- Go back to step 4, make sure you clicked Deploy

**Error: "Cannot find sheets"**
- Go back to step 3, make sure you ran `initializeSheets()`

**Error: "API returns 404"**
- Check your deployed URL in data-adapter.js is correct
- Test with: `fetch(URL + '?action=health')`

**No data showing**
- Check Google Sheet `Records` sheet exists
- Check browser console for errors

---

## What's in the Backend?

| File | Purpose |
|------|---------|
| Code.gs | Entry point - handles HTTP requests |
| SheetDB.gs | Talks to Google Sheets |
| Utils.gs | Helper functions |
| API.gs | Routes requests to handlers |
| data-adapter.js | Frontend talks to this |

---

## Your Google Sheet Structure

After `initializeSheets()` runs, you'll have:

| Sheet Name | Purpose |
|-----------|---------|
| Records | Stores all service tickets |
| Customers | Stores customer info |
| AppSettings | Stores config (pricing, personnel, rules) |

---

## That's It! 🎉

You now have a fully functional Google Apps Script backend!

For more details, see:
- **Full Setup**: `backend/SETUP_GUIDE.md`
- **Migration Guide**: `backend/MIGRATION.md`

Happy deploying! 🚀
