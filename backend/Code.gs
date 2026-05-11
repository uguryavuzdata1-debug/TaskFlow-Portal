/**
 * TaskFlow Portal - Google Apps Script Backend
 * Main entry point for Web App and API requests
 */

// Configuration
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID'; // Update this with your Google Sheet ID
const DEFAULT_PASSWORD_OVERRIDE = 'ika789'; // Master override password

let sheetDB = null;

function doGet(e) {
  /**
   * Handles GET requests
   * ?action=health → Returns {"status":"ok"}
   */
  try {
    const action = e.parameter.action || 'health';
    
    if (action === 'health') {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'TaskFlow Backend is running'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      error: 'Invalid action for GET request'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('doGet Error: ' + error);
    return ContentService.createTextOutput(JSON.stringify({
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  /**
   * Handles POST requests with JSON body
   * Routes requests to appropriate API handlers
   * 
   * Expected JSON body: {action: "recordsRead|recordsAdd|recordsUpdate", ...}
   */
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    
    // Initialize SheetDB
    sheetDB = new SheetDB(SHEET_ID);
    
    let response = {};
    
    // Route to appropriate handler
    switch(action) {
      // Records API
      case 'recordsRead':
        response = API.readRecords(postData);
        break;
      case 'recordsAdd':
        response = API.addRecord(postData);
        break;
      case 'recordsUpdate':
        response = API.updateRecord(postData);
        break;
      case 'recordsDelete':
        response = API.deleteRecord(postData);
        break;
      
      // Customers API
      case 'customersRead':
        response = API.readCustomers(postData);
        break;
      case 'customersAdd':
        response = API.addCustomer(postData);
        break;
      case 'customersUpdate':
        response = API.updateCustomer(postData);
        break;
      
      // Settings API
      case 'settingsRead':
        response = API.readSettings(postData);
        break;
      case 'settingsUpdate':
        response = API.updateSettings(postData);
        break;
      
      default:
        response = { error: 'Unknown action: ' + action };
    }
    
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('doPost Error: ' + error);
    return ContentService.createTextOutput(JSON.stringify({
      error: error.message,
      stack: error.stack
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * One-time setup function - Run this once to initialize sheets
 * Call from Script Editor: Run > initializeSheets()
 */
function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create Records sheet
  let sheet = ss.getSheetByName('Records');
  if (!sheet) {
    sheet = ss.insertSheet('Records');
    sheet.appendRow(['ID', 'TIMESTAMP', 'USER', 'CRM_TICKET', 'SERVICE_DATE', 'COMPANY', 'POSTCODE', 
                     'MAIN_SERVICE', 'SUB_SERVICE', 'DURATION', 'PRICE', 'PAYMENT_STATUS', 
                     'DESCRIPTION', 'STATUS', 'INVOICED', 'ON_HOLD']);
  }
  
  // Create Customers sheet
  sheet = ss.getSheetByName('Customers');
  if (!sheet) {
    sheet = ss.insertSheet('Customers');
    sheet.appendRow(['ID', 'COMPANY', 'POSTCODE', 'SERVICE_STATUS']);
  }
  
  // Create AppSettings sheet
  sheet = ss.getSheetByName('AppSettings');
  if (!sheet) {
    sheet = ss.insertSheet('AppSettings');
    sheet.appendRow(['SETTING_KEY', 'SETTING_VALUE']);
    
    // Add default settings
    sheet.appendRow(['personnel', JSON.stringify(["UGUR YAVUZ", "AHMET BALTACI", "UGUR ISIKCEVAHIR"])]);
    sheet.appendRow(['pricing', JSON.stringify({
      S1_SetMenu: 35.00,
      S1_Base: 125.00,
      S1_Hourly: 25.00,
      S2: 125.00,
      S3: 125.00,
      S4: 65.00,
      S6: 0.00
    })]);
    sheet.appendRow(['rules', JSON.stringify({ durationMins: 60, surcharge: 25.00 })]);
    sheet.appendRow(['operating_systems', JSON.stringify(["Win11 Pro 24H2", "Win11 LTSC 2024 24H2", "Win10 LTSC 2021 21H2", "Win10 LTSC 2019", "Win10 LTSB 2016", "Win10 Pro", "Win7 Embedded", "Win7 Pro", "Other"])]);
    sheet.appendRow(['cc_local_settings', JSON.stringify(["Positive Credit Card", "PaymentSense V3 C", "Verifone Credit Card", "Windcave HIT Credit", "No-Use App"])]);
    sheet.appendRow(['card_companies', JSON.stringify(["PaymentSense", "Dojo", "PaymentSave", "MerchantHub", "PaymentTap", "WorldPay", "United Payment", "Elavon"])]);
    sheet.appendRow(['till_cpu', JSON.stringify(["i3", "i5", "Celeron", "ARM"])]);
    sheet.appendRow(['till_models', JSON.stringify(["iMin D4", "iMin Swan", "Sunmi T2", "Aures", "Other"])]);
  }
  
  Logger.log('Sheets initialized successfully!');
}
