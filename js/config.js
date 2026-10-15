// --- STATIC SECTOR DICTIONARY ---
const LOCAL_SECTORS = ["HOSPITALITY", "RETAIL", "QUICK SERVICE", "OTHER"];

// --- STATIC SYSTEM TYPES DICTIONARY ---
const LOCAL_SYS_TYPES = ["IKA NEW TILL SYSTEM", "USED OWN SYSTEM", "IKA 2.HAND TILL SYSTEM", "OTHER"];

// --- STATIC PAYMENT METHODS DICTIONARY ---
const LOCAL_PAY_METHODS = ["Cash", "Card", "Bank Transfer", "PayPal"];

// --- STATIC SERVICES DICTIONARY ---
const LOCAL_SERVICES = [];

// --- STATIC SUB-SERVICES DICTIONARY ---
const LOCAL_SUB_SERVICES = {
    'S1': [
        "Food & Drink Menu",
        "Food Menu Only",
        "Bar Menu Only",
        "Dessert & Coffee Menu",
        "Set Menu / Special Offers",
        "New Menu Creation"
    ],
    'S2': [
        "New Card Terminal Setup",
        "Terminal Replacement / Swap",
        "Terminal Cancellation / Return"
    ],
    'S3': [
        "Daily Z-Report & Sales Reset",
        "Change of Ownership",
        "Database Crash Recovery Reset"
    ],
    'S4': [
        "Receipt / Kitchen Printer Repair",
        "Touchscreen / Till Display Issue",
        "Network & Wi-Fi Troubleshooting",
        "Cash Drawer Repair",
        "Barcode Scanner Setup / Fault",
        "General Hardware Maintenance",
        "HandHeld Troubleshooting"
    ],
    'S5': [
        "Unlisted Technical Request",
        "On-Site Consultation",
        "Training & Customer Support"
    ],
    'S6': [
        "Full Till System Setup",
        "Clean OS Installation",
        "Disk Image Cloning",
        "OS Upgrade (Windows 10 -> 11 / LTSC)",
        "SSD / Storage Migration",
        "Table Plan & Screen Layout Design",
        "Peripherals / Printers Configuration",
        "Software Only Configuration",
        "Cas CN1",
        "Barcode Label Scale",
        "Other"
    ],
    'S8': [
        "HandHeld Restaurant",
        "HandHeld Retail",
        "Kiosk",
        "Online",
        "Tablet"
    ],
    'S9': [
        "Cas CN1",
        "Barcode Label Scale",
        "Other"
    ]
};

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


