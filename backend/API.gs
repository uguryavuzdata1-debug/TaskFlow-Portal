/**
 * API Handlers - Endpoint logic for doPost requests
 * All handlers receive postData from doPost() and return JSON response
 */

const API = {
  
  // ===== RECORDS =====
  
  readRecords: function(postData) {
    /**
     * GET records
     * postData: { action, filters: {...} }
     */
    try {
      const records = sheetDB.getRecords(postData.filters || {})
        .map(r => Utils.mapToAppFormat(r));
      
      return {
        data: records,
        error: null
      };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  addRecord: function(postData) {
    /**
     * ADD new record
     * postData: { action, record: {...} }
     */
    try {
      if (!postData.record) {
        throw new Error('Missing record data');
      }
      
      const dbRecord = Utils.createDBRecord(postData.record);
      sheetDB.addRecord(dbRecord);
      
      return {
        data: { 
          id: dbRecord.ID,
          success: true 
        },
        error: null
      };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  updateRecord: function(postData) {
    /**
     * UPDATE existing record
     * postData: { action, id, updates: {...} }
     */
    try {
      if (!postData.id) {
        throw new Error('Missing record ID');
      }
      
      const dbUpdates = {};
      const appUpdates = postData.updates || {};
      
      // Map app field names to DB field names
      if (appUpdates.user !== undefined) dbUpdates.USER = appUpdates.user;
      if (appUpdates.company !== undefined) dbUpdates.COMPANY = appUpdates.company;
      if (appUpdates.status !== undefined) dbUpdates.STATUS = appUpdates.status;
      if (appUpdates.paymentStatus !== undefined) dbUpdates.PAYMENT_STATUS = appUpdates.paymentStatus;
      if (appUpdates.price !== undefined) dbUpdates.PRICE = appUpdates.price;
      if (appUpdates.onHold !== undefined) dbUpdates.ON_HOLD = appUpdates.onHold;
      if (appUpdates.invoiced !== undefined) dbUpdates.INVOICED = appUpdates.invoiced;
      
      const result = sheetDB.updateRecord(postData.id, dbUpdates);
      return result;
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  deleteRecord: function(postData) {
    /**
     * DELETE record by ID
     */
    try {
      if (!postData.id) {
        throw new Error('Missing record ID');
      }
      
      return sheetDB.deleteRecord(postData.id);
    } catch (error) {
      return { error: error.message };
    }
  },

  // ===== CUSTOMERS =====
  
  readCustomers: function(postData) {
    try {
      const customers = sheetDB.getCustomers();
      return { data: customers, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  addCustomer: function(postData) {
    try {
      if (!postData.customer) {
        throw new Error('Missing customer data');
      }
      
      const customer = postData.customer;
      customer.ID = customer.ID || Utils.generateId();
      
      sheetDB.addCustomer(customer);
      return { data: { id: customer.ID, success: true }, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  updateCustomer: function(postData) {
    try {
      if (!postData.id) {
        throw new Error('Missing customer ID');
      }
      
      return sheetDB.updateCustomer(postData.id, postData.updates || {});
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // ===== SETTINGS =====
  
  readSettings: function(postData) {
    /**
     * GET all settings
     */
    try {
      const settings = sheetDB.getAllSettings();
      return {
        data: settings,
        error: null
      };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  updateSettings: function(postData) {
    /**
     * UPDATE settings (with password validation)
     * postData: { action, password, updates: {...}, setting: key, value: value }
     */
    try {
      // Validate password if required
      if (postData.password) {
        if (!Utils.validatePassword(postData.password)) {
          return { 
            data: null, 
            error: 'Invalid security password' 
          };
        }
      }

      // Handle single setting update
      if (postData.setting && postData.value !== undefined) {
        sheetDB.updateSetting(postData.setting, postData.value);
      }
      
      // Handle bulk updates
      if (postData.updates && typeof postData.updates === 'object') {
        Object.keys(postData.updates).forEach(key => {
          sheetDB.updateSetting(key, postData.updates[key]);
        });
      }

      return { 
        data: { success: true }, 
        error: null 
      };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }
};
