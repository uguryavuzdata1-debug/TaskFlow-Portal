// --- STATIC SECTOR DICTIONARY ---
const LOCAL_SECTORS = [];

// --- STATIC SYSTEM TYPES DICTIONARY ---
const LOCAL_SYS_TYPES = [];

// --- STATIC PAYMENT METHODS DICTIONARY ---
const LOCAL_PAY_METHODS = [];

// --- STATIC SERVICES DICTIONARY ---
const LOCAL_SERVICES = [];

// --- STATIC SUB-SERVICES DICTIONARY ---
const LOCAL_SUB_SERVICES = {};

// --- Turso Configuration ---
// Database: https://app.turso.tech/uguryavuz/databases/taskflow/data
let appState = {
    tickets: [],
    customers: [],
    settings: {
        personnel: [],
        users_auth: {}, 
        sub_services: {}, 
        pricing: {}, 
        operating_systems: [], 
        cc_local_settings: [], 
        card_companies: [], 
        till_cpu: [], 
        till_models: [], 
        sheet_url: ''
    },
    activeTab: 'dashboard',
    currentInvoiceTab: 'all',
    currentDataTab: 'all',
    currentCustomerFilter: 'all',
    currentUser: '',
    currentUserRole: 'User', 
    editingRecordId: null,
    alertCallback: null
};

// Make appState globally available
window.appState = appState;


