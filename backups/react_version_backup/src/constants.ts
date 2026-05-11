import { LayoutDashboard, Ticket as TicketIcon, Users, Receipt, Settings, HelpCircle, Package } from 'lucide-react';
import { TicketStatus, ServiceCategory } from './types';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tickets', label: 'CRM Tickets', icon: TicketIcon },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'invoicing', label: 'Invoicing', icon: Receipt },
  { id: 'services', label: 'Services', icon: Package },
];

export const MOCK_CUSTOMERS = [
  { id: 'CID-2041', name: 'John Doe', company: 'Acme Corp', email: 'john@acme.com', phone: '+44 7700 900123', postcode: 'SW1A 1AA', status: 'Active' },
  { id: 'CID-2042', name: 'Jane Smith', company: 'TechFlow Inc', email: 'jane@techflow.io', phone: '+44 7700 900456', postcode: 'M1 1AE', status: 'Active' },
  { id: 'CID-2043', name: 'Ugur Yavuz', company: 'Data Solutions', email: 'ugur@data.com', phone: '+44 7700 900789', postcode: 'EH1 1YZ', status: 'On Hold' },
];

export const MOCK_TICKETS = [
  { 
    id: 'T-1001', 
    customerId: 'c1', 
    category: ServiceCategory.PAYMENT_BILLING, 
    subject: 'Incorrect Invoice #442', 
    description: 'The amount charged is higher than agreed.', 
    status: TicketStatus.OPEN, 
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    estimatedPrice: 150
  },
  { 
    id: 'T-1002', 
    customerId: 'c2', 
    category: ServiceCategory.TECHNICAL_SUPPORT, 
    subject: 'Server Downtime', 
    description: 'API is not responding in the production environment.', 
    status: TicketStatus.IN_PROGRESS, 
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    estimatedPrice: 500
  },
  { 
    id: 'T-1003', 
    customerId: 'c3', 
    category: ServiceCategory.CONSULTANCY, 
    subject: 'Project Kickoff', 
    description: 'Discussion about the new data pipeline.', 
    status: TicketStatus.COMPLETED, 
    createdAt: new Date(Date.now() - 432000000).toISOString(),
    updatedAt: new Date(Date.now() - 345600000).toISOString(),
    estimatedPrice: 1200
  },
];
