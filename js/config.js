// --- STATIC SECTOR DICTIONARY ---
// To add new business sectors or modify existing ones, edit this array directly:
const LOCAL_SECTORS = ["HOSPITALITY", "RETAIL", "QUICK SERVICE"];

// --- STATIC SYSTEM TYPES DICTIONARY ---
// To add new system types or modify existing ones, edit this array directly:
const LOCAL_SYS_TYPES = ["IKA NEW TILL SYSTEM", "USED OWN SYSTEM", "IKA 2.HAND TILL SYSTEM", "OTHER"];

// --- STATIC PAYMENT METHODS DICTIONARY ---
// To add new payment methods or modify existing ones, edit this array directly:
const LOCAL_PAY_METHODS = ["Cash", "Card", "Bank Transfer", "PayPal"];

// --- STATIC SERVICES DICTIONARY ---
// To add new main service categories or modify existing ones, edit this array directly:
const LOCAL_SERVICES = [
    { name: 'S1', full_name: 'MENU UPDATE' },
    { name: 'S2', full_name: 'CREDIT CARD' },
    { name: 'S3', full_name: 'DATA RESET' },
    { name: 'S4', full_name: 'SERVICE' },
    { name: 'S5', full_name: 'OTHER' },
    { name: 'S6', full_name: 'TILL SETUP' }
];

// --- STATIC SUB-SERVICES DICTIONARY ---
// To add new sub-service options or modify existing ones, edit this object directly:
const LOCAL_SUB_SERVICES = {
    'S1': [
        'Food and Drink Menu',
        'Food Menu Only',
        'Drink Menu Only',
        'Dessert Menu',
        'Set Menu',
        'New Menu'
    ],
    'S2': [
        'Credit Card Setup',
        'Credit Card Replacement',
        'Credit Card Cancellation'
    ],
    'S3': [
        'Sales data has been deleted at the customer’s request',
        'Data has been reset due to a database malfunction'
    ],
    'S4': [
        'Network Connectivity Issues',
        'Wi-Fi Setup / Troubleshooting',
        'Modem / Router Configuration',
        'Operating System Installation',
        'Virus Removal / Performance Issues',
        'SSD Replacement / Upgrade',
        'RAM Upgrade',
        'Part Replacement (Screen, Keyboard, Battery, etc.)',
        'Printing Problems',
        'Printer Installation',
        'General Maintenance',
        'Various'
    ],
    'S5': [
        'Other / Unlisted Issue'
    ],
    'S6': [
        'Full Setup',
        'Hardware Only',
        'Software Only'
    ]
};

// --- Supabase Configuration ---
const SB_URL = 'https://ekjhhjrhfkoiklyxjfpu.supabase.co';
const SB_KEY = 'sb_publishable_hz1a48NHx7c8RPV_RYHfZg_YNvnNOdH';
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

let sbClient;
try {
    if (typeof supabase === 'undefined') {
        throw new Error("Supabase library not loaded. Check your internet or CDN link.");
    }
    sbClient = supabase.createClient(SB_URL, SB_KEY);
    console.log("[INIT] Supabase connection established.");
} catch (e) {
    console.error("Supabase could not be initialized. Using offline mode.", e);
    showToast("Supabase bağlantısı kurulamadı! Çevrimdışı modda çalışılıyor.", "error");
    // Robust Mock sbClient to prevent chain-call crashes
    const mockResponse = { data: [], error: null };
    const mockQuery = {
        from: function() { return this; },
        select: function() { return this; },
        update: function() { return this; },
        upsert: function() { return this; },
        order: function() { return this; },
        eq: function() { return this; },
        single: function() { return this; },
        then: function(onFullfilled) { 
            return Promise.resolve(mockResponse).then(onFullfilled); 
        }
    };
    sbClient = mockQuery;
}

