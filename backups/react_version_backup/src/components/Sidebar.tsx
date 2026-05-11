import { NAV_ITEMS } from '../constants';
import { cn } from '../lib/utils';
import { Zap, Settings } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="w-64 h-screen border-r border-dashboard-line flex flex-col bg-[#F8F9FA] sticky top-0" id="sidebar">
      <div className="p-8 border-b border-dashboard-line flex items-center gap-4 bg-white">
        <div className="w-10 h-10 bg-dashboard-accent flex items-center justify-center rounded-md shadow-lg shadow-blue-100">
          <Zap className="text-white w-6 h-6 fill-current" />
        </div>
        <div>
          <h1 className="font-bold text-xl tracking-tighter leading-none text-dashboard-ink">TaskFlow</h1>
          <p className="text-[10px] font-mono opacity-40 uppercase tracking-widest mt-1.5">Portal v2.1</p>
        </div>
      </div>
      
      <nav className="flex-1 py-4 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "sidebar-link w-full text-left",
              activeTab === item.id && "sidebar-link-active"
            )}
            id={`nav-${item.id}`}
          >
            <item.icon size={18} className={activeTab === item.id ? "text-dashboard-accent" : "text-stone-400"} />
            {item.label}
          </button>
        ))}
      </nav>
      
      <div className="p-4 border-t border-dashboard-line bg-white">
        <button
          onClick={() => onTabChange('settings')}
          className={cn(
            "flex items-center gap-3 px-6 py-3 w-full text-sm font-bold transition-all rounded-lg",
            activeTab === 'settings' 
              ? "bg-blue-50 text-dashboard-accent" 
              : "text-stone-400 hover:bg-stone-50 hover:text-stone-600"
          )}
          id="nav-settings-footer"
        >
          <Settings size={18} />
          Settings
        </button>
      </div>
    </aside>
  );
}
