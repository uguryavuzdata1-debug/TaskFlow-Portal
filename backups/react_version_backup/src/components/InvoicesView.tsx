import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { MOCK_TICKETS } from '../constants';
import { TicketStatus } from '../types';
import { Receipt, CheckCircle, Clock, AlertCircle, Edit2, Save, X, FileText } from 'lucide-react';
import { cn } from '../lib/utils';

export default function InvoicesView() {
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'completed'>('pending');
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    invoiceNo: '',
    invoiceDate: '',
    billingNote: '',
    price: 0
  });

  const pendingInvoices = MOCK_TICKETS.filter(t => t.status === TicketStatus.COMPLETED);
  const completedInvoices = MOCK_TICKETS.filter(t => t.status === TicketStatus.PENDING_BILLING);

  const handleStartEdit = (ticket: any) => {
    setEditingInvoiceId(ticket.id);
    setEditForm({
      invoiceNo: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      billingNote: '',
      price: ticket.estimatedPrice || 0
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      id="invoices-view"
    >
      <header>
        <h2 className="text-3xl font-bold tracking-tight text-dashboard-ink">Invoicing Module</h2>
        <p className="text-sm opacity-50 mt-1">Manage pending, held, and completed billing records.</p>
      </header>

      <div className="flex gap-4 p-1 bg-slate-100 rounded-xl w-fit">
        <button 
          onClick={() => setActiveSubTab('pending')}
          className={cn(
            "flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all",
            activeSubTab === 'pending' ? "bg-white text-dashboard-accent shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Clock size={16} />
          Pending ({pendingInvoices.length})
        </button>
        <button 
          onClick={() => setActiveSubTab('completed')}
          className={cn(
            "flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all",
            activeSubTab === 'completed' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <CheckCircle size={16} />
          Invoiced ({completedInvoices.length})
        </button>
      </div>

      <div className="bg-white border border-dashboard-line rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#FBFCFD] border-b border-dashboard-line">
            <tr>
              <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-slate-400">Date/ID</th>
              <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-slate-400">Company</th>
              <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-slate-400">Service Info</th>
              <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-slate-400">Amount</th>
              <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dashboard-line">
            {(activeSubTab === 'pending' ? pendingInvoices : completedInvoices).map((ticket) => (
              <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="text-xs font-mono font-bold text-dashboard-accent">{ticket.id}</div>
                  <div className="text-[10px] opacity-40 uppercase mt-1">{new Date(ticket.createdAt).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-bold">Acme Corp</div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase">SW1A 1AA</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs font-medium">{ticket.subject}</div>
                  <div className="text-[10px] opacity-40 uppercase mt-1">{ticket.category}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-dashboard-ink">£{ticket.estimatedPrice?.toFixed(2)}</div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleStartEdit(ticket)}
                      className="p-2 text-slate-400 hover:text-dashboard-accent hover:bg-blue-50 rounded-lg transition-all"
                      title="Edit Billing Info"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button className="bg-dashboard-ink text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors">
                      {activeSubTab === 'pending' ? 'Process' : 'Slip'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(activeSubTab === 'pending' ? pendingInvoices : completedInvoices).length === 0 && (
          <div className="p-12 text-center text-slate-400 italic">
            No invoicing records found for this category.
          </div>
        )}
      </div>

      {/* Invoice Edit Modal */}
      <AnimatePresence>
        {editingInvoiceId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dashboard-ink/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-dashboard-line"
            >
              <div className="p-6 border-b border-dashboard-line bg-[#FBFCFD] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg text-dashboard-accent">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-dashboard-ink">Edit Billing Context</h3>
                    <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest">Entry Ref: {editingInvoiceId}</p>
                  </div>
                </div>
                <button onClick={() => setEditingInvoiceId(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Invoice Number</label>
                    <input 
                      type="text" 
                      placeholder="INV-2024-..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Invoice Date</label>
                    <input 
                      type="date" 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Billing Amount (£)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">£</span>
                    <input 
                      type="number" 
                      step="0.01"
                      className="w-full pl-8 pr-4 py-3 bg-blue-50/50 border border-blue-100 rounded-xl text-lg font-black text-dashboard-ink outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Billing Notes</label>
                  <textarea 
                    rows={3} 
                    placeholder="Internal notes regarding this invoice (e.g. partial payment, disputed check)..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white transition-all outline-none resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setEditingInvoiceId(null)}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-200 transition-all"
                  >
                    Discard Changes
                  </button>
                  <button 
                    onClick={() => setEditingInvoiceId(null)}
                    className="flex-1 py-3 bg-dashboard-accent text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-100 hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={18} /> Update Ledger
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
