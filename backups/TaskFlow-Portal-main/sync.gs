function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // CUSTOMERS SYNC (Müşteri Senkronizasyonu)
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

    // NORMAL İŞLEM KAYITLARI
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
    masterSheet.appendRow(fullRowData);
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
      // MENU UPDATE & DATA RESET: Slim 18 columns
      targetHeaders = fullHeaders.slice(0, 18);
      targetRowData = fullRowData.slice(0, 18);
    } else if (data.mainServiceCode === "S2") {
      // CREDIT CARD: Standard 18 columns + Credit Card specific fields (Indices 29-32)
      targetHeaders = fullHeaders.slice(0, 18).concat(fullHeaders.slice(29, 33));
      targetRowData = fullRowData.slice(0, 18).concat(fullRowData.slice(29, 33));
    } else {
      // OTHERS (TILL SETUP, etc.): Full 33 columns
      targetHeaders = fullHeaders;
      targetRowData = fullRowData;
    }

    if (catSheet.getLastRow() === 0) {
      catSheet.appendRow(targetHeaders);
      var catHeaderRange = catSheet.getRange(1, 1, 1, targetHeaders.length);
      catHeaderRange.setFontWeight("bold").setBackground("#e6f1fb");
      protectHeaders(catSheet);
    }
    catSheet.appendRow(targetRowData);
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
      invSheet.appendRow(invRowData);
      if (!invSheet.getFilter()) invSheet.getDataRange().createFilter();
      applyStatusFormatting(invSheet, 3);
    }
    
    return ContentService.createTextOutput(JSON.stringify({"status": "success", "sheet": categoryName}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Function to protect header row
function protectHeaders(sheet) {
  var range = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  var protection = range.protect().setDescription('Header Protection');
}

// Function to apply conditional formatting based on Status
function applyStatusFormatting(sheet, colIndex) {
  var range = sheet.getRange(2, colIndex, sheet.getLastRow() - 1, 1);
  var rules = sheet.getConditionalFormatRules();
  
  // Clear existing to avoid duplicates (simplified approach)
  if (rules.length > 50) sheet.clearConditionalFormatRules(); 

  var completedRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo("COMPLETED")
    .setBackground("#dcfce7") // Light Green
    .setFontColor("#166534")
    .setRanges([range])
    .build();

  var pendingRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo("PENDING")
    .setBackground("#fee2e2") // Light Red
    .setFontColor("#991b1b")
    .setRanges([range])
    .build();

  var holdRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo("HOLD")
    .setBackground("#ffedd5") // Light Orange
    .setFontColor("#9a3412")
    .setRanges([range])
    .build();

  sheet.setConditionalFormatRules([completedRule, pendingRule, holdRule]);
}
