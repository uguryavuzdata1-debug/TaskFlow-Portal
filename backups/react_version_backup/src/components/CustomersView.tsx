import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { MOCK_CUSTOMERS } from '../constants';
import { Search, Mail, Phone, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { dataService } from '../services/dataService';

export default function CustomersView() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await dataService.getCustomers();
        // Fallback to mock if empty
        if (data.length === 0) setCustomers(MOCK_CUSTOMERS);
        else setCustomers(data);
      } catch (e) {
        console.error(e);
        setCustomers(MOCK_CUSTOMERS);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = customers.filter(c => 
    c.company?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.postcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      id="customers-view"
    >
      <header className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-dashboard-ink">Customer Directory</h2>
          <p className="text-sm opacity-50 mt-1">Manage client records and historical engagement.</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 bg-dashboard-ink text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all rounded-lg shadow-lg"
        >
          <RefreshCw size={14} className={cn(loading && "animate-spin")} />
          Sync with CRM
        </button>
      </header>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by company name, email or postcode..." 
          className="w-full pl-11 pr-4 py-3 text-sm bg-white border border-dashboard-line rounded-xl shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-dashboard-accent transition-all outline-none"
        />
      </div>

      <div className="bg-white border border-dashboard-line rounded-xl shadow-sm overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 text-slate-400 gap-4">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-sm font-bold uppercase tracking-widest">Accessing Supabase Cluster...</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-[#FBFCFD] border-b border-dashboard-line">
              <tr>
                <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-slate-400">CRM ID</th>
                <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-slate-400">Company Name</th>
                <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-slate-400">Postcode</th>
                <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-slate-400">Phone Number</th>
                <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-slate-400 text-right">Account Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashboard-line">
              {filtered.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="text-sm font-mono font-bold text-dashboard-accent">{customer.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-dashboard-ink">{customer.company || customer.company_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-mono text-slate-500 uppercase tracking-tighter">{customer.postcode}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                      <Phone size={12} className="text-slate-300" />
                      {customer.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter",
                      (customer.status === 'Active' || !customer.status) ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50"
                    )}>
                      {customer.status || 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && filtered.length === 0 && (
          <div className="p-20 text-center text-slate-400 italic">
            No customers found matching your search.
          </div>
        )}
      </div>
    </motion.div>
  );
}
