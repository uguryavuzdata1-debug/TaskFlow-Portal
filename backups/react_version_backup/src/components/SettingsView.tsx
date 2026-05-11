import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { Save, RefreshCw, Database, ShieldCheck, UserPlus, Trash2, DollarSign, Settings as SettingsIcon } from 'lucide-react';
import { dataService } from '../services/dataService';

export default function SettingsView() {
  const [gasUrl, setGasUrl] = useState(localStorage.getItem('TASKFLOW_GAS_URL') || '');
  const [personnel, setPersonnel] = useState<string[]>([]);
  const [newPerson, setNewPerson] = useState('');
  const [pricing, setPricing] = useState<any>({});
  const [rules, setRules] = useState<any>({ durationMins: 60, surcharge: 25 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const p = await dataService.getSettings('personnel');
        const pr = await dataService.getSettings('pricing');
        const r = await dataService.getSettings('rules');
        
        if (p && Array.isArray(p)) setPersonnel(p);
        else setPersonnel(["UGUR YAVUZ", "AHMET BALTACI", "UGUR ISIKCEVAHIR"]);
        
        if (pr && typeof pr === 'object') setPricing(pr);
        else setPricing({
          S1_SetMenu: 35.00,
          S1_Base: 125.00,
          S1_Hourly: 25.00,
          S2: 125.00,
          S3: 125.00,
          S4: 65.00,
          S6: 0.00
        });

        if (r && typeof r === 'object') setRules(r);
        else setRules({ durationMins: 60, surcharge: 25 });
      } catch (err) {
        console.error("Failed to load settings", err);
        // Set defaults on error
        setPersonnel(["UGUR YAVUZ", "AHMET BALTACI", "UGUR ISIKCEVAHIR"]);
        setPricing({ S1_SetMenu: 35, S1_Base: 125, S1_Hourly: 25, S2: 125, S3: 125, S4: 65, S6: 0 });
        setRules({ durationMins: 60, surcharge: 25 });
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSaveIntegrations = () => {
    localStorage.setItem('TASKFLOW_GAS_URL', gasUrl);
    alert('Integration settings saved locally.');
  };

  const handleSavePersonnel = async () => {
    setSaving(true);
    const success = await dataService.saveSettings('personnel', personnel);
    setSaving(false);
    if (success) alert('Personnel list updated successfully.');
  };

  const handleSavePricing = async () => {
    setSaving(true);
    const success = await dataService.saveSettings('pricing', pricing);
    setSaving(false);
    if (success) alert('Pricing configuration updated.');
  };

  const handleSaveRules = async () => {
    setSaving(true);
    const success = await dataService.saveSettings('rules', rules);
    setSaving(false);
    if (success) alert('System rules updated.');
  };

  const addPerson = () => {
    if (newPerson && !personnel.includes(newPerson)) {
      setPersonnel([...personnel, newPerson.toUpperCase()]);
      setNewPerson('');
    }
  };

  const removePerson = (name: string) => {
    setPersonnel(personnel.filter(p => p !== name));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-4">
        <RefreshCw className="animate-spin" size={32} />
        <p className="text-xs font-bold uppercase tracking-widest">Loading System Settings...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl space-y-8 pb-20"
      id="settings-view"
    >
      <header className="mb-10">
        <h2 className="text-3xl font-bold tracking-tight text-dashboard-ink">System Configuration</h2>
        <p className="text-sm opacity-50 mt-1">Manage external integrations, personnel, pricing, and system rules.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Integrations & Personnel */}
        <div className="space-y-8">
          {/* Integrations */}
          <section className="bg-white border border-dashboard-line p-8 rounded-xl shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg text-dashboard-accent">
                <Database size={20} />
              </div>
              <h3 className="font-bold text-sm uppercase tracking-wider">Integrations</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Google Sheets Web App URL</label>
                <input 
                  type="text" 
                  value={gasUrl}
                  onChange={(e) => setGasUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/..." 
                  className="w-full px-4 py-3 text-sm bg-slate-50 border border-dashboard-line rounded-lg font-mono focus:bg-white focus:ring-2 focus:ring-blue-100 border-transparent focus:border-dashboard-accent transition-all outline-none"
                />
              </div>
              <button 
                onClick={handleSaveIntegrations}
                className="flex items-center justify-center gap-2 w-full py-3 bg-dashboard-ink text-white text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors rounded-lg"
              >
                <Save size={14} /> Save Integration
              </button>
            </div>
          </section>

          {/* Personnel Management */}
          <section className="bg-white border border-dashboard-line p-8 rounded-xl shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <ShieldCheck size={20} />
              </div>
              <h3 className="font-bold text-sm uppercase tracking-wider">Personnel Management</h3>
            </div>

            <div className="flex gap-2">
              <input 
                type="text" 
                value={newPerson}
                onChange={(e) => setNewPerson(e.target.value)}
                placeholder="Enter staff name..." 
                className="flex-1 px-4 py-2 text-sm border border-dashboard-line rounded-lg outline-none focus:border-dashboard-accent"
              />
              <button 
                onClick={addPerson}
                className="p-2 bg-dashboard-accent text-white rounded-lg hover:bg-blue-700 transition-all"
              >
                <UserPlus size={20} />
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {personnel.map((p) => (
                <div key={p} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-all group">
                  <span className="text-xs font-bold text-slate-700">{p}</span>
                  <button 
                    onClick={() => removePerson(p)}
                    className="text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <button 
              onClick={handleSavePersonnel}
              disabled={saving}
              className="w-full py-3 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors rounded-lg disabled:opacity-50"
            >
              {saving ? 'Syncing...' : 'Update Personnel List'}
            </button>
          </section>
        </div>

        {/* Right Column: Pricing & Rules */}
        <div className="space-y-8">
          {/* Pricing Configuration */}
          <section className="bg-white border border-dashboard-line p-8 rounded-xl shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                <DollarSign size={20} />
              </div>
              <h3 className="font-bold text-sm uppercase tracking-wider">Pricing Configuration</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {Object.keys(pricing).map((key) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{key.replace('_', ' ')}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">£</span>
                    <input 
                      type="number" 
                      value={pricing[key]}
                      onChange={(e) => setPricing({...pricing, [key]: parseFloat(e.target.value)})}
                      className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-dashboard-line rounded-lg text-xs font-bold focus:bg-white outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={handleSavePricing}
              disabled={saving}
              className="w-full py-3 bg-amber-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-amber-700 transition-colors rounded-lg disabled:opacity-50"
            >
              Update Pricing
            </button>
          </section>

          {/* System Rules */}
          <section className="bg-white border border-dashboard-line p-8 rounded-xl shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                <SettingsIcon size={20} />
              </div>
              <h3 className="font-bold text-sm uppercase tracking-wider">System Rules</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base Duration (Minutes)</label>
                <input 
                  type="number" 
                  value={rules.durationMins || ''}
                  onChange={(e) => setRules({...rules, durationMins: parseInt(e.target.value)})}
                  className="w-full px-4 py-2.5 text-xs font-bold bg-slate-50 border border-dashboard-line rounded-lg outline-none focus:bg-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hourly Surcharge (£)</label>
                <input 
                  type="number" 
                  value={rules.surcharge || ''}
                  onChange={(e) => setRules({...rules, surcharge: parseFloat(e.target.value)})}
                  className="w-full px-4 py-2.5 text-xs font-bold bg-slate-50 border border-dashboard-line rounded-lg outline-none focus:bg-white"
                />
              </div>
            </div>

            <button 
              onClick={handleSaveRules}
              disabled={saving}
              className="w-full py-3 bg-purple-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-purple-700 transition-colors rounded-lg disabled:opacity-50"
            >
              Save System Rules
            </button>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
