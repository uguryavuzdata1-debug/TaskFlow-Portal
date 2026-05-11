/**
 * SheetDB - Google Sheets Database Wrapper
 * Handles all read/write operations to Google Sheets
 */

class SheetDB {
  constructor(spreadsheetId) {
    this.spreadsheetId = spreadsheetId;
    this.ss = SpreadsheetApp.openById(spreadsheetId);
  }

  // ===== RECORDS =====
  
  getRecords(filters = {}) {
    /**
     * Read records from sheet
     * filters: { status: 'Completed', serviceDate: '2026-01-01', ... }
     */
    const sheet = this.ss.getSheetByName('Records');
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const records = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0]) continue; // Skip empty rows
      
      const record = {};
      headers.forEach((h, idx) => record[h] = row[idx]);
      
      // Apply filters
      let passes = true;
      Object.keys(filters).forEach(key => {
        if (record[key] !== filters[key]) passes = false;
      });
      
      if (passes) records.push(record);
    }
    
    return records;
  }

  addRecord(record) {
    /**
     * Add new record
     * record: { ID, TIMESTAMP, USER, COMPANY, ... }
     */
    const sheet = this.ss.getSheetByName('Records');
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    const row = headers.map(h => record[h] || '');
    sheet.appendRow(row);
    
    return { success: true, id: record.ID };
  }

  updateRecord(id, updates) {
    /**
     * Update record by ID
     */
    const sheet = this.ss.getSheetByName('Records');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        // Found the record
        const newRow = data[i].slice();
        headers.forEach((h, idx) => {
          if (updates[h] !== undefined) newRow[idx] = updates[h];
        });
        sheet.getRange(i + 1, 1, 1, newRow.length).setValues([newRow]);
        return { success: true, updated: true };
      }
    }
    
    return { success: false, error: 'Record not found' };
  }

  deleteRecord(id) {
    const sheet = this.ss.getSheetByName('Records');
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        sheet.deleteRow(i + 1);
        return { success: true };
      }
    }
    
    return { success: false, error: 'Record not found' };
  }

  // ===== CUSTOMERS =====
  
  getCustomers() {
    const sheet = this.ss.getSheetByName('Customers');
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const customers = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0]) continue;
      
      const customer = {};
      headers.forEach((h, idx) => customer[h] = row[idx]);
      customers.push(customer);
    }
    
    return customers;
  }

  addCustomer(customer) {
    const sheet = this.ss.getSheetByName('Customers');
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const row = headers.map(h => customer[h] || '');
    sheet.appendRow(row);
    return { success: true, id: customer.ID };
  }

  updateCustomer(id, updates) {
    const sheet = this.ss.getSheetByName('Customers');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        const newRow = data[i].slice();
        headers.forEach((h, idx) => {
          if (updates[h] !== undefined) newRow[idx] = updates[h];
        });
        sheet.getRange(i + 1, 1, 1, newRow.length).setValues([newRow]);
        return { success: true };
      }
    }
    
    return { success: false, error: 'Customer not found' };
  }

  // ===== SETTINGS =====
  
  getSetting(key) {
    const sheet = this.ss.getSheetByName('AppSettings');
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        try {
          return JSON.parse(data[i][1]);
        } catch (e) {
          return data[i][1];
        }
      }
    }
    
    return null;
  }

  getAllSettings() {
    const sheet = this.ss.getSheetByName('AppSettings');
    const data = sheet.getDataRange().getValues();
    const settings = [];
    
    for (let i = 1; i < data.length; i++) {
      const key = data[i][0];
      let value = data[i][1];
      
      try {
        value = JSON.parse(value);
      } catch (e) {
        // Keep as string if not JSON
      }
      
      settings.push({ id: key, data: value });
    }
    
    return settings;
  }

  updateSetting(key, value) {
    const sheet = this.ss.getSheetByName('AppSettings');
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(typeof value === 'string' ? value : JSON.stringify(value));
        return { success: true };
      }
    }
    
    // Add new setting if not found
    sheet.appendRow([key, typeof value === 'string' ? value : JSON.stringify(value)]);
    return { success: true, created: true };
  }
}
