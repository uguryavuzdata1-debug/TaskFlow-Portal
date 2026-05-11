import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { MOCK_TICKETS, MOCK_CUSTOMERS } from '../constants';
import { TicketStatus, Ticket } from '../types';
import { Search, Plus, MoreHorizontal } from 'lucide-react';
import { cn } from '../lib/utils';
import { GasService } from '../services/gasService';

export default function TicketsView() {
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TicketStatus | 'ALL'>('ALL');

  useEffect(() => {
    const fetchTickets = async () => {
      const url = localStorage.getItem('TASKFLOW_GAS_URL');
      if (!url) {
        console.warn("GAS URL not set, using mock data.");
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const data = await GasService.getTickets();
        if (data && Array.isArray(data) && data.length > 0) setTickets(data);
      } catch (err) {
        console.error("Failed to fetch tickets from GAS", err);
        // Fallback to mock is already handled by initial state
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const filteredTickets = filterStatus === 'ALL' 
    ? tickets 
    : tickets.filter(t => t.status === filterStatus);

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.OPEN: return 'bg-blue-500 text-blue-700';
      case TicketStatus.IN_PROGRESS: return 'bg-yellow-500 text-yellow-700';
      case TicketStatus.COMPLETED: return 'bg-emerald-500 text-emerald-700';
      default: return 'bg-slate-500 text-slate-700';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      id="tickets-view"
    >
      <header className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-dashboard-ink">CRM Tickets</h2>
          <p className="text-sm opacity-50 mt-1">Manage service requests and customer interactions.</p>
        </div>
        <button className="flex items-center gap-2 bg-dashboard-accent text-white px-5 py-2.5 text-sm font-bold uppercase tracking-wider hover:bg-blue-700 transition-all rounded-sm shadow-md">
          <Plus size={18} />
          New Entry
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-4 py-6 border-y border-stone-200">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search tickets..." 
            className="w-full pl-11 pr-4 py-3 text-sm bg-white border border-dashboard-line rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-dashboard-accent transition-all font-medium"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          {['ALL', ...Object.values(TicketStatus)].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={cn(
                "px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-widest border border-dashboard-line rounded-lg transition-all whitespace-nowrap",
                filterStatus === status ? "bg-dashboard-ink text-white border-dashboard-ink" : "bg-white hover:bg-slate-50 text-slate-600"
              )}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-dashboard-line rounded-xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-[80px_1fr_120px_120px_120px_40px] border-b border-dashboard-line bg-slate-50/50 p-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">ID</span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Ticket Details</span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Customer</span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Category</span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold text-center">Status</span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold"></span>
        </div>
        <div className="divide-y divide-dashboard-line">
          {filteredTickets.map((ticket) => {
            const customer = MOCK_CUSTOMERS.find(c => c.id === ticket.customerId);
            return (
              <div key={ticket.id} className="grid grid-cols-[80px_1fr_120px_120px_120px_40px] p-5 items-center hover:bg-stone-50 group cursor-pointer transition-colors">
                <span className="text-xs font-mono font-bold text-dashboard-accent">{ticket.id}</span>
                <div className="pr-4 border-l-2 border-transparent group-hover:border-dashboard-accent pl-4 transition-all">
                  <h4 className="text-sm font-bold text-stone-900 group-hover:text-dashboard-accent transition-colors">{ticket.subject}</h4>
                  <p className="text-[10px] opacity-50 truncate mt-1">{ticket.description}</p>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-stone-700">{customer?.name}</span>
                  <span className="text-[10px] font-mono opacity-40 uppercase tracking-tighter">{customer?.company}</span>
                </div>
                <div className="px-2 py-1 bg-stone-100 rounded text-[10px] font-mono font-bold text-stone-600 w-fit">
                  {ticket.category.replace('&', '+')}
                </div>
                <div className="flex justify-center">
                  <span className={cn("status-badge px-3 py-1", getStatusColor(ticket.status))}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
                <button className="p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-stone-200 transition-all opacity-0 group-hover:opacity-100 text-stone-400 hover:text-stone-900">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
