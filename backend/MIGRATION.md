# TaskFlow Portal - Supabase to Google Apps Script Migration

## Summary

This guide explains how to migrate TaskFlow Portal from Supabase backend to Google Apps Script + Google Sheets.

### Why Migrate?
- ✅ No need to manage separate backend/database
- ✅ Everything in one Google Workspace
- ✅ No monthly Supabase costs
- ✅ Easier to maintain and backup
- ✅ Better integration with Google Sheets
- ✅ Simpler permissions/sharing

---

## Architecture Comparison

### Current: Supabase
```
Frontend (GitHub Pages)
    ↓ (JavaScript fetch/client)
Supabase Client
    ↓ (PostgreSQL protocol)
PostgreSQL Database (Supabase cloud)
```

### New: Google Apps Script
```
Frontend (GitHub Pages)
    ↓ (HTTP POST/GET)
Google Apps Script Web App
    ↓ (Apps Script API)
Google Sheet (TaskFlow_Records)
```

---

## Files Changed / Added

### Modified
- `data.js` → Rename to `backend/data-adapter.js`
  - Replace all `supabaseClient.*()` calls with `gasAPICall()` calls
  - Maintain same function names for compatibility

### New
- `backend/Code.gs` - Google Apps Script main file
- `backend/SheetDB.gs` - Database wrapper class
- `backend/Utils.gs` - Utility functions
- `backend/API.gs` - API endpoint handlers
- `backend/SETUP_GUIDE.md` - Step-by-step deployment guide

### Unchanged
- `index.html` - Same UI
- `style.css` - Same styling
- `ui.js` - Same UI functions
- `auth.js` - Same authentication
- `app.js` - Same app logic
- `config.js` - Same configuration

---

## Migration Steps

### Phase 1: Prepare Frontend

1. **Backup current code**
   ```bash
   git commit -am "Backup: current Supabase version"
   ```

2. **Update index.html**
   - Current: `<script src="data.js"></script>`
   - New: `<script src="backend/data-adapter.js"></script>`

3. **Test locally** (should still work with browser errors about GAS_BACKEND_URL)

### Phase 2: Create Backend

See `backend/SETUP_GUIDE.md` for full instructions:

1. Create Google Sheet `TaskFlow_Records`
2. Create Google Apps Script project from the sheet
3. Copy backend files (Code.gs, SheetDB.gs, Utils.gs, API.gs)
4. Run `initializeSheets()` to create tables
5. Deploy as Web App

### Phase 3: Data Migration

**Option A: Manual (if small dataset)**
1. Get data from Supabase (CSV export)
2. Manually paste into Google Sheet `Records` tab
3. Format dates as needed

**Option B: Automated Script**
Create a Google Apps Script function to import from CSV:
```javascript
function importFromCSV(csvData) {
  const sheet = SpreadsheetApp.getActiveSheet().getSheetByName('Records');
  const rows = Utilities.parseCsv(csvData);
  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}
```

### Phase 4: Test Integration

1. **Test API health endpoint**
   ```javascript
   console.log(await fetch(GAS_BACKEND_URL + '?action=health').then(r => r.json()))
   ```

2. **Test create record** (in app)
   - Create new ticket
   - Check Google Sheet `Records` for new row

3. **Test read records**
   - Refresh app
   - Should see all records from sheet

4. **Test update**
   - Change ticket status
   - Should update in sheet

### Phase 5: Deploy

1. Update `config.js` if needed (no Supabase keys required)
2. Push to GitHub
3. Verify GitHub Pages deployment

---

## API Mapping

### Supabase (Old)
```javascript
supabaseClient.from('records').select('*')
supabaseClient.from('records').insert(record)
supabaseClient.from('records').update(updates).eq('id', id)
supabaseClient.from('records').delete().eq('id', id)
```

### Google Apps Script (New)
```javascript
gasAPICall('recordsRead', { filters: {} })
gasAPICall('recordsAdd', { record })
gasAPICall('recordsUpdate', { id, updates })
gasAPICall('recordsDelete', { id })
```

---

## Configuration Files

### config.js
**Before**:
```javascript
const SUPABASE_URL = '...';
const SUPABASE_KEY = '...';
```

**After**:
```javascript
// No changes needed to config.js
// GAS_BACKEND_URL is set in data-adapter.js
```

---

## Performance Considerations

| Aspect | Supabase | Google Apps Script |
|--------|----------|-------------------|
| Speed | ⚡ Very fast | 🔄 Slightly slower |
| Concurrent Users | 💪 Unlimited | ⚠️ Limited (quotas) |
| Data Size | 📦 Unlimited (paid) | ⚠️ 10M cells/sheet |
| Real-time (WebSockets) | ✅ Yes | ❌ No (polling) |
| Cost | 💰 $10+/mo | 🆓 Free |
| Complexity | 🔧 Complex | ✅ Simple |

---

## Rollback Plan

If you need to go back to Supabase:

1. Keep `data.js.backup` safe
2. In `index.html`, change:
   ```html
   <script src="backend/data-adapter.js"></script>
   ```
   back to:
   ```html
   <script src="data.js"></script>
   ```
3. Redeploy

---

## Monitoring & Maintenance

### Check Script Execution
1. Google Apps Script Editor → **Executions** tab
2. See all API calls, errors, and logs

### Backup Data
1. Google Sheet → **File → Version history**
2. Or download as CSV/Excel regularly

### Debug Issues
1. Open Google Sheet → Tools → Script editor
2. Check the **Execution** logs
3. Look for error messages and stack traces

---

## Advanced: Add More Features

### Google Forms Integration
```javascript
// In Google Apps Script, parse form responses
function onFormSubmit(e) {
  const response = e.response;
  const newRecord = { ... };
  API.addRecord({ record: newRecord });
}
```

### Automatic Backups
```javascript
function backupData() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const backup = sheet.duplicate();
  backup.setName('Backup_' + new Date().toISOString());
}
```

### Email Notifications
```javascript
function notifyCompletion(recordId) {
  MailApp.sendEmail('team@example.com', 'Ticket Completed', ...);
}
```

---

## Troubleshooting

### Issue: "Cannot find GAS_BACKEND_URL"
- Check `data-adapter.js` line 20
- Ensure it has the deployed Web App URL

### Issue: "Sheets initialized successfully" but no sheets created
- Check if `initializeSheets()` was actually run
- Check Executions tab for errors
- May need to re-run with proper permissions

### Issue: Slow performance
- Google Apps Script has rate limits
- Consider caching data locally in browser
- Use `localStorage` for frequently accessed data

### Issue: Data not syncing
- Check browser console (F12) for errors
- Check Google Apps Script Executions tab
- Verify Google Sheet structure matches expected schema

---

## Next Steps

1. ✅ Read this migration guide
2. ⏭️ Follow `backend/SETUP_GUIDE.md` to set up backend
3. ⏭️ Test API health endpoint
4. ⏭️ Migrate existing data (optional)
5. ⏭️ Deploy updated frontend
6. ⏭️ Test all features in production

---

## Support Resources

- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [Google Sheets API Reference](https://developers.google.com/sheets/api)
- [Google Apps Script Quotas](https://developers.google.com/apps-script/guides/services/quotas)
