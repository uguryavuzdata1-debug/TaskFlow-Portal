/**
 * Configuration and Default Data Constants
 */

const SUPABASE_URL = 'https://ekjhhjrhfkoiklyxjfpu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hz1a48NHx7c8RPV_RYHfZg_YNvnNOdH';

const DEFAULT_SUB_SERVICES = {
  S1: [{name:"Food and Drink Menu",price:0},{name:"Food Menu Only",price:0},{name:"Drink Menu Only",price:0},{name:"Dessert Menu",price:0},{name:"Set Menu",price:0},{name:"New Menu",price:0}],
  S2: [{name:"Credit Card Setup",price:0},{name:"Credit Card Replacement",price:0},{name:"Credit Card Cancellation",price:0}],
  S3: [{name:"Sales data has been deleted at the customer's request.",price:0},{name:"Data has been reset due to a database malfunction.",price:0}],
  S4: [{name:"Network Connectivity Issues",price:0},{name:"Wi-Fi Setup / Troubleshooting",price:0},{name:"Modem / Router Configuration",price:0},{name:"Operating System Installation",price:0},{name:"Virus Removal",price:0},{name:"SSD Replacement / Upgrade",price:0},{name:"RAM Upgrade",price:0},{name:"Hardware Repair",price:0},{name:"Printing Problems",price:0},{name:"General Maintenance",price:0}],
  S5: [{name:"Other / Unlisted Issue",price:0}],
  S6: [{name:"New Till Installation",price:0},{name:"Till System Reconfiguration",price:0}]
};

const DEFAULT_PERSONNEL = ["UGUR YAVUZ", "AHMET BALTACI", "UGUR ISIKCEVAHIR"];

const DEFAULT_PRICING_CONFIG = {
  S1_SetMenu: 35.00,
  S1_Base: 125.00,
  S1_Hourly: 25.00,
  S2: 125.00,
  S3: 125.00,
  S4: 65.00,
  S6: 0.00
};

const DEFAULT_RULES = { durationMins: 60, surcharge: 25.00 };
