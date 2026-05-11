import { useState } from 'react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import TicketsView from './components/TicketsView';
import SettingsView from './components/SettingsView';
import InvoicesView from './components/InvoicesView';
import CustomersView from './components/CustomersView';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, Search, User } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'tickets':
        return <TicketsView />;
      case 'invoicing':
        return <InvoicesView />;
      case 'customers':
        return <CustomersView />;
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 italic font-serif text-2xl">?</div>
            <h3 className="font-serif italic text-2xl">Under Construction</h3>
            <p className="text-sm opacity-60 mt-2">This module is currently being synchronized with the core engine.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-dashboard-bg" id="app-root">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-dashboard-line flex items-center justify-between px-8 bg-white/50 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-4 text-[10px] font-mono tracking-widest uppercase opacity-40">
            <span>Server: EU-NORTH-1</span>
            <span>•</span>
            <span>Latency: 42ms</span>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="relative p-2 hover:bg-gray-100 text-stone-400 hover:text-dashboard-accent transition-all rounded-sm group">
              <Search size={18} />
              <span className="sr-only">Search</span>
            </button>
            <button className="relative p-2 hover:bg-gray-100 text-stone-400 hover:text-dashboard-accent transition-all rounded-sm group">
              <Bell size={18} />
              <div className="absolute top-2 right-2 w-2 h-2 bg-dashboard-accent rounded-full border-2 border-white" />
              <span className="sr-only">Notifications</span>
            </button>
            <div className="h-8 w-px bg-dashboard-line mx-2" />
            <div className="flex items-center gap-4 cursor-pointer group px-2 py-1 rounded-sm hover:bg-stone-50 transition-colors">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold leading-none text-stone-900">Ugur Yavuz</p>
                <p className="text-[10px] font-mono opacity-40 uppercase mt-1.5 tracking-tighter">System Admin</p>
              </div>
              <div className="w-10 h-10 bg-dashboard-ink rounded-sm flex items-center justify-center text-white shadow-lg shadow-stone-200 group-hover:scale-105 transition-transform">
                <User size={18} />
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
        
        <footer className="p-8 border-t border-dashboard-line text-[10px] font-mono uppercase tracking-[0.3em] opacity-30 flex justify-between bg-white/50">
          <span>&copy; 2024 TaskFlow Systems Inc.</span>
          <span>Security Level: Tier-3 Encrypted</span>
        </footer>
      </main>
    </div>
  );
}
