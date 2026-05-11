import { getSupabase } from '../lib/supabase';

export interface Ticket {
  id?: string;
  staff: string;
  crm_ticket: string;
  company_id: string;
  company_name: string;
  postcode: string;
  service_category: string;
  sub_service: string;
  start_time: string;
  end_time: string;
  duration: number;
  description: string;
  payment_mode: string;
  estimated_price: number;
  final_price: number;
  service_number: string;
  service_date: string;
  created_at?: string;
}

export const dataService = {
  async createTicket(ticket: Ticket) {
    // 1. Save to Supabase (if available)
    const supabase = getSupabase();
    let supabaseResult = null;

    if (supabase) {
      const { data, error } = await supabase
        .from('records')
        .insert([ticket])
        .select();

      if (error) {
        console.error('Supabase Error:', error);
      } else {
        supabaseResult = data;
      }
    } else {
      console.warn('Supabase not configured, skipping DB write.');
    }

    // 2. Optional: Sync to Google Sheets if URL is configured
    const gasUrl = localStorage.getItem('TASKFLOW_GAS_URL');
    if (gasUrl) {
      try {
        await fetch(gasUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'recordsAdd',
            record: {
              ID: ticket.service_number,
              TIMESTAMP: new Date().toISOString(),
              USER: ticket.staff,
              CRM_TICKET: ticket.crm_ticket,
              SERVICE_DATE: ticket.service_date,
              COMPANY: ticket.company_name,
              POSTCODE: ticket.postcode,
              MAIN_SERVICE: ticket.service_category,
              SUB_SERVICE: ticket.sub_service,
              DURATION: ticket.duration,
              PRICE: ticket.final_price,
              PAYMENT_STATUS: ticket.payment_mode,
              DESCRIPTION: ticket.description,
              STATUS: 'COMPLETED',
              INVOICED: 'NO',
              ON_HOLD: 'NO'
            }
          })
        });
      } catch (e) {
        console.warn('Google Sheets Sync Failed:', e);
      }
    }

    return supabaseResult;
  },

  async getTickets() {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('records')
      .select('*')
      .order('TIMESTAMP', { ascending: false });

    if (error) {
      console.error('Supabase fetch error:', error);
      return [];
    }
    return data || [];
  },

  async getCustomers() {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('customers')
      .select('*');

    if (error) {
      console.error('Supabase fetch customers error:', error);
      return [];
    }
    return data || [];
  },

  async getSettings(id: string) {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('app_settings')
      .select('data')
      .eq('id', id)
      .limit(1);

    if (error) {
      console.error(`Supabase fetch settings error (${id}):`, error);
      return null;
    }
    return (data && data.length > 0) ? data[0].data : null;
  },

  async saveSettings(id: string, data: any) {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { error } = await supabase
      .from('app_settings')
      .upsert({ id, data, updated_at: new Date().toISOString() });

    if (error) {
      console.error(`Supabase save settings error (${id}):`, error);
      return false;
    }
    return true;
  }
};
