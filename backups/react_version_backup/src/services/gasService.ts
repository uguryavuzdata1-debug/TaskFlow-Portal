import { Ticket, TicketStatus, Customer, ServiceCategory } from '../types';

/**
 * Service to communicate with Google Apps Script Backend
 */
export class GasService {
  private static getUrl(): string | null {
    return localStorage.getItem('TASKFLOW_GAS_URL') || null;
  }

  private static async apiCall(action: string, payload: any = {}) {
    const url = this.getUrl();
    if (!url) throw new Error('GAS Backend URL not configured in settings.');

    try {
      const response = await fetch(url, {
        method: 'POST',
        mode: 'no-cors', // Apps Script requires no-cors sometimes, but results are limited
        body: JSON.stringify({ action, payload }),
      });

      // Note: GAS Web Apps can be tricky with CORS. 
      // If deployed as "Anyone", POST usually works but doesn't return headers easily in no-cors
      // For this implementation, we assume the user has configuredcors or we use a proxy if needed.
      // In a standard setup, a JSON response is returned if successful.
      
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    } catch (error) {
      console.error(`GAS API Error (${action}):`, error);
      throw error;
    }
  }

  // Records (Tickets)
  static async getTickets(): Promise<Ticket[]> {
    return this.apiCall('recordsRead');
  }

  static async createTicket(ticket: Partial<Ticket>): Promise<Ticket> {
    return this.apiCall('recordsAdd', { record: ticket });
  }

  static async updateTicket(id: string, updates: Partial<Ticket>): Promise<boolean> {
    return this.apiCall('recordsUpdate', { id, updates });
  }

  // Customers
  static async getCustomers(): Promise<Customer[]> {
    return this.apiCall('customersRead');
  }

  // Settings
  static saveUrl(url: string) {
    localStorage.setItem('TASKFLOW_GAS_URL', url);
  }
}
