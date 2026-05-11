export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_BILLING = 'PENDING_BILLING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum ServiceCategory {
  PAYMENT_BILLING = 'PAYMENT & BILLING',
  TECHNICAL_SUPPORT = 'TECHNICAL SUPPORT',
  CONSULTANCY = 'CONSULTANCY',
  MAINTENANCE = 'MAINTENANCE'
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
}

export interface Ticket {
  id: string;
  customerId: string;
  category: ServiceCategory;
  subject: string;
  description: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  estimatedPrice?: number;
}

export interface Invoice {
  id: string;
  ticketId: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'VOID';
  dueDate: string;
  issuedAt: string;
}

export interface IntegrationSettings {
  googleSheetsUrl: string;
  vTigerUrl: string;
  lastSync: string | null;
}
