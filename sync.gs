var SUPABASE_URL = 'https://ekjhhjrhfkoiklyxjfpu.supabase.co';
var SUPABASE_KEY = 'sb_publishable_hz1a48NHx7c8RPV_RYHfZg_YNvnNOdH';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // CUSTOMERS SYNC
    if (data.action === "sync_customers") {
      var cSheet = ss.getSheetByName("CUSTOMERS");
      if (!cSheet) {
        cSheet = ss.insertSheet("CUSTOMERS");
      }
      
      var cHeaders = ["TIMESTAMP", "ID", "CUSTOMER ID", "COMPANY", "POSTCODE", "SERVICE STATUS", "REGISTER DATE", "LAST UPDATE", "LAST NOTE"];
      cSheet.getRange(1, 1, 1, cHeaders.length).setValues([cHeaders]);
      cSheet.getRange(1, 1, 1, cHeaders.length).setFontWeight("bold").setBackground("#164e63").setFontColor("white");
      cSheet.setFrozenRows(1);
      
      var lastRow = cSheet.getLastRow();
      if (lastRow > 1) {
        cSheet.getRange(2, 1, lastRow - 1, cHeaders.length).clearContent();
      }
      
      if (data.customers && data.customers.length > 0) {
        var rows = data.customers.map(function(c, i) {
          return [
            c.timestamp || new Date().toISOString(),
            (i + 1).toString(), // ID
            c.companyId,
            c.companyName || c.company || "",
            c.postcode || "",
            c.status || "Active",
            c.registerDate || "Unknown",
            c.lastUpdate || "",
            c.lastNote || ""
          ];
        });
        cSheet.getRange(2, 1, rows.length, cHeaders.length).setValues(rows);
      }
      return ContentService.createTextOutput(JSON.stringify({"status": "success", "message": "Customers Synced"})).setMimeType(ContentService.MimeType.JSON);
    }

    // NORMAL TRANSACTION RECORDS
    var fullRowData = [
      data.timestamp, data.dbId, data.crmTicket, data.company, data.postcode, data.user, 
      data.mainService, data.subService, data.startTime, data.endTime, data.duration, 
      data.price, data.paymentStatus, data.description, 
      data.invoiceNo, data.invoiceDate, data.invoiceNote,
      (data.invoiced ? "COMPLETED" : (data.onHold ? "HOLD" : "PENDING")),
      data.quoteNo || "", data.systemType || "", data.tillModel || "", data.cpu || "", 
      data.osVersion || "", data.appVersion || "", data.sector || "", data.serviceOption || "", 
      data.tillProg || "", data.imgProg || "", data.menuProg || "",
      data.ikaApp || "", data.localSettings || "", data.cardSetupNo || "", data.cardCompany || ""
    ];
    
    var fullHeaders = [
      "TIMESTAMP", "ID", "CRM TICKET", "COMPANY", "POSTCODE", "USER", "MAIN SERVICE", "SUB SERVICE", 
      "START TIME", "END TIME", "DURATION", "PRICE", "PAYMENT STATUS", "DESCRIPTION", 
      "INV NO", "INV DATE", "INV NOTE", "STATUS",
      "QUOTE NO", "SYSTEM TYPE", "TILL MODEL", "CPU", "OS VERSION", "APP VER", "SEKTOR", "SERV OPT", "TILL PROG", "IMG PROG", "MENU PROG",
      "IKA APP", "LOCAL SET", "CARD SETUP NO", "CARD CO"
    ];

    // 1. MASTER SHEET (Log everything - all fields)
    var masterSheet = ss.getSheetByName("ALL RECORDS") || ss.insertSheet("ALL RECORDS");
    if (masterSheet.getLastRow() === 0) {
      masterSheet.appendRow(fullHeaders);
      var headerRange = masterSheet.getRange(1, 1, 1, fullHeaders.length);
      headerRange.setFontWeight("bold").setBackground("#f3f3f3");
      protectHeaders(masterSheet);
    }
    updateOrAppendRow(masterSheet, fullRowData, 2, data.dbId);
    if (!masterSheet.getFilter()) masterSheet.getDataRange().createFilter();
    applyStatusFormatting(masterSheet, 18);
    
    // 2. CATEGORY SPECIFIC SHEET
    var serviceMap = {
      "S1": "MENU UPDATE", "S2": "CREDIT CARD", "S3": "DATA RESET", 
      "S4": "SERVICE", "S5": "OTHER SYSTEM", "S6": "TILL SETUP"
    };
    
    var categoryName = serviceMap[data.mainServiceCode] || data.mainService.substring(0, 30);
    var catSheet = ss.getSheetByName(categoryName) || ss.insertSheet(categoryName);
    
    var targetHeaders, targetRowData;
    
    if (data.mainServiceCode === "S1" || data.mainServiceCode === "S3") {
      targetHeaders = fullHeaders.slice(0, 18);
      targetRowData = fullRowData.slice(0, 18);
    } else if (data.mainServiceCode === "S2") {
      targetHeaders = fullHeaders.slice(0, 18).concat(fullHeaders.slice(29, 33));
      targetRowData = fullRowData.slice(0, 18).concat(fullRowData.slice(29, 33));
    } else {
      targetHeaders = fullHeaders;
      targetRowData = fullRowData;
    }

    if (catSheet.getLastRow() === 0) {
      catSheet.appendRow(targetHeaders);
      var catHeaderRange = catSheet.getRange(1, 1, 1, targetHeaders.length);
      catHeaderRange.setFontWeight("bold").setBackground("#e6f1fb");
      protectHeaders(catSheet);
    }
    updateOrAppendRow(catSheet, targetRowData, 2, data.dbId);
    if (!catSheet.getFilter()) catSheet.getDataRange().createFilter();
    applyStatusFormatting(catSheet, 18); 
    
    // 3. DEDICATED INVOICE SHEET (Completed records only)
    if (data.invoiced) {
      var invSheet = ss.getSheetByName("INVOICE") || ss.insertSheet("INVOICE");
      if (invSheet.getLastRow() === 0) {
        invSheet.appendRow(["INV NO", "INV DATE", "STATUS", "MAIN SERVICE", "SUB SERVICE", "COMPANY", "POSTCODE", "REAL PRICE", "TICKET ID", "ID", "NOTE"]);
        invSheet.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#dcfce7");
        protectHeaders(invSheet);
      }
      var invRowData = [
        data.invoiceNo, data.invoiceDate, "COMPLETED", data.mainService, data.subService,
        data.company, data.postcode, data.price, data.crmTicket, data.dbId, data.invoiceNote
      ];
      updateOrAppendRow(invSheet, invRowData, 10, data.dbId);
      if (!invSheet.getFilter()) invSheet.getDataRange().createFilter();
      applyStatusFormatting(invSheet, 3);
    } else {
      // If a record was previously invoiced and is now reverted, we should try to remove it from INVOICE sheet
      removeRowByDbId(ss.getSheetByName("INVOICE"), 10, data.dbId);
    }
    
    return ContentService.createTextOutput(JSON.stringify({"status": "success", "sheet": categoryName}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function updateOrAppendRow(sheet, rowData, dbIdColumnIndex, dbIdValue) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    sheet.appendRow(rowData);
    return;
  }
  
  var dbIdRange = sheet.getRange(2, dbIdColumnIndex, lastRow - 1, 1);
  var dbIds = dbIdRange.getValues();
  
  for (var i = 0; i < dbIds.length; i++) {
    if (String(dbIds[i][0]) === String(dbIdValue)) {
      var rowIndex = i + 2;
      sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
      return;
    }
  }
  
  sheet.appendRow(rowData);
}

function removeRowByDbId(sheet, dbIdColumnIndex, dbIdValue) {
  if (!sheet) return;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  var dbIdRange = sheet.getRange(2, dbIdColumnIndex, lastRow - 1, 1);
  var dbIds = dbIdRange.getValues();
  for (var i = 0; i < dbIds.length; i++) {
    if (String(dbIds[i][0]) === String(dbIdValue)) {
      sheet.deleteRow(i + 2);
      return;
    }
  }
}

function onEdit(e) {
  if (!e || !e.range) return;
  var sheet = e.range.getSheet();
  var sheetName = sheet.getName();
  
  if (sheetName !== "ALL RECORDS") return;
  
  var row = e.range.getRow();
  var col = e.range.getColumn();
  
  if (row === 1) return;
  
  var dbId = sheet.getRange(row, 2).getValue();
  if (!dbId) return;
  
  var headerName = sheet.getRange(1, col).getValue();
  if (!headerName || headerName === "TIMESTAMP" || headerName === "ID") return;
  
  var newValue = e.value !== undefined ? e.value : e.range.getValue();
  if (newValue === "TRUE") newValue = true;
  if (newValue === "FALSE") newValue = false;
  
  var payload = {};
  payload[headerName] = newValue;
  
  var url = SUPABASE_URL + '/rest/v1/records?id=eq.' + encodeURIComponent(dbId);
  var options = {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    UrlFetchApp.fetch(url, options);
  } catch(err) {
    // Optional: Log errors to a hidden sheet
  }
}

function protectHeaders(sheet) {
  var range = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  var protection = range.protect().setDescription('Header Protection');
}

function applyStatusFormatting(sheet, colIndex) {
  var range = sheet.getRange(2, colIndex, sheet.getLastRow() - 1, 1);
  var rules = sheet.getConditionalFormatRules();
  
  if (rules.length > 50) sheet.clearConditionalFormatRules(); 

  var completedRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo("COMPLETED")
    .setBackground("#dcfce7")
    .setFontColor("#166534")
    .setRanges([range])
    .build();

  var pendingRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo("PENDING")
    .setBackground("#fee2e2")
    .setFontColor("#991b1b")
    .setRanges([range])
    .build();

  var holdRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo("HOLD")
    .setBackground("#ffedd5")
    .setFontColor("#9a3412")
    .setRanges([range])
    .build();

  sheet.setConditionalFormatRules([completedRule, pendingRule, holdRule]);
}
