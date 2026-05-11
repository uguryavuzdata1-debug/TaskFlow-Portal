/**
 * Utility Functions - String, Date, ID helpers
 */

class Utils {
  static generateId() {
    /**
     * Generate unique ID in format like Supabase: alphanumeric string
     */
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
    let result = '';
    for (let i = 0; i < 20; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static getCurrentTimestamp() {
    /**
     * Get ISO format timestamp
     */
    return new Date().toISOString();
  }

  static getCurrentDate() {
    /**
     * Get YYYY-MM-DD format
     */
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  static getSettingsPassword() {
    /**
     * Generate daily security password like in frontend
     * Formula: ika + (day + month + year) + tf
     */
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const sum = day + month + year;
    return `ika${sum}tf`;
  }

  static validatePassword(inputPassword) {
    /**
     * Validate password: both daily password and master override
     */
    const dailyPassword = Utils.getSettingsPassword();
    return inputPassword === dailyPassword || inputPassword === 'ika789';
  }

  static mapToAppFormat(dbRecord) {
    /**
     * Map database record to frontend application format
     */
    const mainServiceCodeMap = {
      "MENU UPDATE": "S1",
      "CREDIT CARD": "S2",
      "DATA RESET": "S3",
      "SERVICE": "S4",
      "OTHER": "S5",
      "TILL SETUP": "S6"
    };

    return {
      id: dbRecord.ID || '',
      dbId: dbRecord.ID || '',
      timestamp: dbRecord.TIMESTAMP,
      user: dbRecord.USER || '',
      crmTicket: dbRecord.CRM_TICKET || '',
      serviceDate: dbRecord.SERVICE_DATE || '',
      company: dbRecord.COMPANY || '',
      postcode: dbRecord.POSTCODE || '',
      mainService: dbRecord.MAIN_SERVICE || '',
      subService: dbRecord.SUB_SERVICE || '',
      duration: dbRecord.DURATION || 0,
      price: dbRecord.PRICE || 0,
      paymentStatus: dbRecord.PAYMENT_STATUS || '',
      description: dbRecord.DESCRIPTION || '',
      status: dbRecord.STATUS || 'Logged',
      invoiced: dbRecord.INVOICED || false,
      onHold: dbRecord.ON_HOLD || false,
      mainServiceCode: mainServiceCodeMap[dbRecord.MAIN_SERVICE] || "S5"
    };
  }

  static createDBRecord(appRecord) {
    /**
     * Convert frontend record to database format
     */
    const serviceCodeMap = {
      S1: "MENU UPDATE",
      S2: "CREDIT CARD",
      S3: "DATA RESET",
      S4: "SERVICE",
      S5: "OTHER",
      S6: "TILL SETUP"
    };

    return {
      ID: appRecord.id || Utils.generateId(),
      TIMESTAMP: appRecord.timestamp || Utils.getCurrentTimestamp(),
      USER: appRecord.user || '',
      CRM_TICKET: appRecord.crmTicket || '',
      SERVICE_DATE: appRecord.serviceDate || Utils.getCurrentDate(),
      COMPANY: appRecord.company || '',
      POSTCODE: appRecord.postcode || '',
      MAIN_SERVICE: serviceCodeMap[appRecord.mainServiceCode] || appRecord.mainService || '',
      SUB_SERVICE: appRecord.subService || '',
      DURATION: appRecord.duration || 0,
      PRICE: appRecord.price || 0,
      PAYMENT_STATUS: appRecord.paymentStatus || '',
      DESCRIPTION: appRecord.description || '',
      STATUS: appRecord.status || 'Logged',
      INVOICED: appRecord.invoiced || false,
      ON_HOLD: appRecord.onHold || false
    };
  }
}
