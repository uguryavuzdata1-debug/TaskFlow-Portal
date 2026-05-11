import { motion } from 'motion/react';
import { useState, useMemo, useEffect, FormEvent } from 'react';
import { Zap, Plus, Clock, Target, CreditCard, RefreshCcw, Settings, PenTool, Database, Briefcase } from 'lucide-react';
import { cn } from '../lib/utils';
import { dataService, Ticket } from '../services/dataService';

const STAFF = ["UGUR YAVUZ", "AHMET BALTACI", "UGUR ISIKCEVAHIR"];

const CATEGORIES = [
  { id: 'S1', label: 'MENU UPDATE', icon: PenTool, color: 'text-blue-600', bg: 'bg-blue-50', desc: 'Price or logo updates' },
  { id: 'S2', label: 'CREDIT CARD', icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'Terminal setup' },
  { id: 'S3', label: 'DATA RESET', icon: RefreshCcw, color: 'text-rose-600', bg: 'bg-rose-50', desc: 'Sales data cleanup' },
  { id: 'S4', label: 'SERVICE', icon: Settings, color: 'text-amber-600', bg: 'bg-amber-50', desc: 'General maintenance' },
  { id: 'S5', label: 'OTHER', icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50', desc: 'Custom requests' },
  { id: 'S6', label: 'TILL SETUP', icon: Database, color: 'text-slate-600', bg: 'bg-slate-50', desc: 'System installation' },
];

export default function DashboardView() {
  const [view, setView] = useState<'home' | 'category' | 'form'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ pending: 0, revenue: 0, queue: 0 });
  const [staffList, setStaffList] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    staff: '',
    crmTicket: '',
    company: '',
    postcode: '',
    startTime: '',
    endTime: '',
    paymentMode: 'Chargeable',
    price: '',
    description: ''
  });

  useEffect(() => {
    async function fetchData() {
      try {
        // 1. Fetch Stats
        const tickets = await dataService.getTickets();
        const pending = tickets.filter(t => t.payment_mode !== 'FREE').length;
        const revenue = tickets.reduce((acc, t) => acc + (t.final_price || 0), 0);
        setStats({ pending, revenue, queue: tickets.length });

        // 2. Fetch Personnel
        const personnel = await dataService.getSettings('personnel');
        const finalPersonnel = (personnel && Array.isArray(personnel) && personnel.length > 0) 
          ? personnel 
          : ["UGUR YAVUZ", "AHMET BALTACI", "UGUR ISIKCEVAHIR"];
          
        setStaffList(finalPersonnel);
        setFormData(prev => ({ ...prev, staff: finalPersonnel[0] }));
      } catch (e) {
        console.error('Failed to fetch data', e);
        setStaffList(["UGUR YAVUZ", "AHMET BALTACI", "UGUR ISIKCEVAHIR"]);
        setFormData(prev => ({ ...prev, staff: "UGUR YAVUZ" }));
      }
    }
    fetchData();
  }, []);

  const duration = useMemo(() => {
    if (!formData.startTime || !formData.endTime) return 0;
    const [h1, m1] = formData.startTime.split(':').map(Number);
    const [h2, m2] = formData.endTime.split(':').map(Number);
    const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
    return mins > 0 ? mins : 0;
  }, [formData.startTime, formData.endTime]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ticket: Ticket = {
        staff: formData.staff,
        crm_ticket: formData.crmTicket,
        company_id: 'CID-' + Math.floor(Math.random() * 9000 + 1000),
        company_name: formData.company,
        postcode: formData.postcode,
        service_category: selectedCategory || 'OTHER',
        sub_service: 'Food and Drink Menu', // Placeholder
        start_time: formData.startTime,
        end_time: formData.endTime,
        duration: duration,
        description: formData.description,
        payment_mode: formData.paymentMode,
        estimated_price: 125,
        final_price: parseFloat(formData.price) || 0,
        service_number: 'SRV-' + Math.floor(Math.random() * 9000 + 1000),
        service_date: new Date().toISOString().split('T')[0]
      };

      await dataService.createTicket(ticket);
      alert('Record synchronized successfully!');
      setView('home');
    } catch (err) {
      alert('Failed to save record. Check console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
      id="dashboard-view"
    >
      {view === 'home' && (
        <div className="bg-[#1a202c] rounded-2xl p-12 text-white text-center shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-5xl font-black tracking-tighter mb-4">TaskFlow Portal</h1>
            <p className="text-lg text-slate-400 max-w-xl mx-auto mb-10">Industrial grade service management and technical ticketing dashboard.</p>
            <button 
              onClick={() => setView('category')}
              className="bg-dashboard-accent text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-blue-700 transition-all shadow-xl flex items-center gap-3 mx-auto"
            >
              <Plus size={24} />
              CREATE NEW ENTRY
            </button>
          </div>
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Zap size={200} className="fill-current" />
          </div>
        </div>
      )}

      {view === 'category' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-dashboard-ink flex items-center gap-3">
              <div className="w-2 h-8 bg-dashboard-accent rounded-full" />
              Select Service Category
            </h2>
            <button onClick={() => setView('home')} className="text-sm font-bold text-slate-400 hover:text-dashboard-ink decoration-dotted underline underline-offset-4">Back to Dashboard</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CATEGORIES.map((cat) => (
              <button 
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setView('form');
                }}
                className="bg-white border-2 border-transparent hover:border-dashboard-accent p-8 rounded-xl text-left transition-all shadow-sm group hover:shadow-md"
              >
                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-6", cat.bg)}>
                  <cat.icon className={cn("w-6 h-6", cat.color)} />
                </div>
                <h3 className="font-bold text-dashboard-ink group-hover:text-dashboard-accent transition-colors">{cat.label}</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{cat.desc}</p>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {view === 'form' && (
        <motion.div initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-dashboard-line rounded-xl shadow-2xl overflow-hidden max-w-5xl mx-auto">
          <div className="p-8 pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-3xl">📋</div>
              <h2 className="text-2xl font-bold tracking-tight text-dashboard-ink">Create New Ticket</h2>
            </div>
            <button onClick={() => setView('category')} className="px-4 py-1.5 bg-stone-100 text-stone-500 text-xs font-bold rounded hover:bg-stone-200 transition-colors">
              Cancel & Go Back
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Row 1: Admin Info */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="text-[10px] font-bold text-stone-500 mb-1.5 block">Staff (Created By)</label>
                <select 
                  value={formData.staff}
                  onChange={(e) => setFormData({...formData, staff: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded text-sm focus:ring-1 focus:ring-dashboard-accent outline-none"
                >
                  {staffList.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-stone-500 mb-1.5 block">Database ID</label>
                <input type="text" readOnly value="REC-1010" className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-sm text-stone-400 outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-stone-500 mb-1.5 block">CRM Ticket No</label>
                <input 
                  type="text" 
                  placeholder="Paste CRM Ticket..." 
                  value={formData.crmTicket}
                  onChange={(e) => setFormData({...formData, crmTicket: e.target.value})}
                  className="w-full px-3 py-2 border border-stone-200 rounded text-sm outline-none focus:border-stone-400" 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-stone-500 mb-1.5 block">Timestamp</label>
                <input type="text" readOnly value={new Date().toLocaleString()} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-sm text-stone-400 outline-none" />
              </div>
            </div>

            {/* Row 2: Company Info */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold text-stone-500 mb-1.5 block">Company ID</label>
                <input type="text" readOnly value="CID-XXXX" className="w-full px-3 py-2 border border-stone-200 bg-stone-50 text-stone-400 rounded text-sm outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-stone-500 mb-1.5 block">Company Name</label>
                <input 
                  type="text" 
                  placeholder="Search customer..." 
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  className="w-full px-3 py-2 border border-stone-200 rounded text-sm outline-none" 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-stone-500 mb-1.5 block">Postcode</label>
                <input 
                  type="text" 
                  placeholder="e.g. SW1A 1AA" 
                  value={formData.postcode}
                  onChange={(e) => setFormData({...formData, postcode: e.target.value})}
                  className="w-full px-3 py-2 border border-stone-200 rounded text-sm outline-none" 
                />
              </div>
            </div>

            {/* Row 3: Service Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-stone-500 mb-1.5 block">Service Category</label>
                <select 
                  value={selectedCategory || ''} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded text-sm outline-none bg-white"
                >
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-stone-500 mb-1.5 block">Sub Service</label>
                <select className="w-full px-3 py-2 border border-stone-200 rounded text-sm outline-none bg-white">
                  <option>Food and Drink Menu</option>
                  <option>Table Layout Update</option>
                  <option>Logo Branding</option>
                </select>
              </div>
            </div>

            {/* Row 4: Timing */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold text-stone-500 mb-1.5 block">Start Time</label>
                <input type="time" value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} className="w-full px-3 py-2 border border-stone-200 rounded text-sm outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-stone-500 mb-1.5 block">End Time</label>
                <input type="time" value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})} className="w-full px-3 py-2 border border-stone-200 rounded text-sm outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-stone-500 mb-1.5 block">Duration (min)</label>
                <input type="text" readOnly value={duration} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-sm text-stone-400 outline-none" />
              </div>
            </div>

            {/* Row 5: Description */}
            <div>
              <label className="text-[10px] font-bold text-stone-500 mb-1.5 block">Service Description / Update Info <span className="text-red-500">*</span></label>
              <textarea 
                rows={4} 
                placeholder={`Provide detailed notes or Update Info for this ${selectedCategory} task...`}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-stone-200 rounded text-sm outline-none focus:border-stone-400 resize-none"
              ></textarea>
            </div>

            {/* Payment Section */}
            <div className="space-y-4 pt-4">
              <h3 className="text-xs font-black text-stone-500 uppercase tracking-widest">PAYMENT & BILLING</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-stone-500 mb-1.5 block">Service Mode</label>
                  <select 
                    className="w-full px-3 py-2 border border-stone-200 rounded text-sm outline-none bg-white"
                    value={formData.paymentMode}
                    onChange={(e) => setFormData({...formData, paymentMode: e.target.value})}
                  >
                    <option value="Chargeable">Chargeable</option>
                    <option value="Service Contract">Service Contract</option>
                    <option value="FREE">FREE</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-500 mb-1.5 block">Estimated Price</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 text-sm text-stone-500 bg-stone-50 border border-r-0 border-stone-200 rounded-l">£</span>
                    <input type="text" readOnly value="125.00" className="w-full px-3 py-2 border border-stone-200 bg-stone-50 text-stone-400 rounded-r text-sm outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-500 mb-1.5 block">Final Price (£)</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 text-sm text-stone-500 bg-stone-50 border border-r-0 border-stone-200 rounded-l">£</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="w-full px-3 py-2 border border-stone-200 rounded-r text-sm outline-none" 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-stone-500 mb-1.5 block">SERVICE NUMBER</label>
                  <input type="text" readOnly value="SRV-1010" className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-sm text-stone-400 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-500 mb-1.5 block">SERVICE DATE</label>
                  <input type="text" readOnly value={new Date().toLocaleDateString()} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-sm text-stone-400 outline-none" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <button type="button" onClick={() => setFormData({ staff: STAFF[0], crmTicket: '', company: '', postcode: '', startTime: '', endTime: '', paymentMode: 'Chargeable', price: '', description: '' })} className="px-6 py-2 border border-stone-200 text-stone-600 text-sm font-bold rounded hover:bg-stone-50 transition-colors">Clear Form</button>
              <button 
                type="submit" 
                disabled={loading}
                className="px-8 py-2 bg-dashboard-ink text-white text-sm font-bold rounded shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Process Transaction'}
              </button>
            </div>
          </form>

        </motion.div>
      )}

      {view === 'home' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl border border-dashboard-line shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="text-dashboard-accent" />
              <h3 className="font-bold text-sm uppercase tracking-wider">Pending Tasks</h3>
            </div>
            <p className="text-4xl font-black text-dashboard-ink">{stats.queue}</p>
            <div className="h-1 w-full bg-slate-100 mt-4 rounded-full overflow-hidden">
              <div className="h-full bg-dashboard-accent w-1/2" />
            </div>
          </div>
          
          <div className="bg-white p-8 rounded-xl border border-dashboard-line shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Target className="text-emerald-500" />
              <h3 className="font-bold text-sm uppercase tracking-wider">Estimated Revenue</h3>
            </div>
            <p className="text-4xl font-black text-dashboard-ink">£{stats.revenue.toLocaleString()}</p>
            <p className="text-[10px] text-emerald-600 font-bold uppercase mt-2">Total invoiced value</p>
          </div>

          <div className="bg-white p-8 rounded-xl border border-dashboard-line shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="text-rose-500" />
              <h3 className="font-bold text-sm uppercase tracking-wider">Billing Queue</h3>
            </div>
            <p className="text-4xl font-black text-dashboard-ink">{stats.pending}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Unprocessed items</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
