import React from 'react';
import { Home, Mail, CheckSquare, Calendar, BarChart2, Target, Mic, Settings, AlertCircle, Sparkles } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadsCount: number;
  risksCount: number;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function Sidebar({ activeTab, setActiveTab, unreadsCount, risksCount, sidebarOpen, setSidebarOpen }: SidebarProps) {
  const menuItems = [
    { id: 'home', label: 'Home Dashboard', icon: Home },
    { id: 'inbox', label: 'Gmail Commitments', icon: Mail, badge: unreadsCount > 0 ? unreadsCount : undefined, badgeColor: 'bg-indigo-600' },
    { id: 'tasks', label: 'AI Risk Tracker', icon: CheckSquare, badge: risksCount > 0 ? risksCount : undefined, badgeColor: 'bg-rose-500' },
    { id: 'goals', label: 'Goals & Habits', icon: Target },
    { id: 'analytics', label: 'AI Productivity', icon: BarChart2 },
  ];

  return (
    <>
      {/* Background overlay on mobile when sidebar is open */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-stone-900/30 backdrop-blur-sm z-30 transition-opacity duration-300"
        />
      )}

      <aside className={`fixed inset-y-0 left-0 bg-stone-50/95 border-r border-stone-200/80 flex flex-col justify-between h-full select-none text-stone-600 z-40 w-64 transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static transition-transform duration-300 ease-in-out`}>
        <div className="flex flex-col">
          {/* App Title block */}
          <div className="p-6 border-b border-stone-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-50 border border-indigo-100 rounded-md text-indigo-600 shadow-sm">
                <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
              </span>
              <div>
                <h1 className="font-bold text-stone-850 text-sm tracking-wide uppercase">Life Saver</h1>
                <span className="text-[10px] text-stone-400 font-semibold font-mono uppercase">Goofy</span>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              <span className="text-[9px] text-emerald-600 font-bold font-mono">LIVE</span>
            </div>
          </div>

          {/* User Workspace label */}
          <div className="px-6 py-4">
            <span className="text-[10px] font-mono tracking-wider font-bold text-stone-400 uppercase">Workspace</span>
            <div className="mt-1 flex items-center gap-2 bg-stone-200/40 px-3 py-1.5 rounded-md border border-stone-200/50 text-xs">
              <span className="w-4 h-4 bg-indigo-100 border border-indigo-200/50 rounded-full flex items-center justify-center text-[10px] font-bold text-indigo-700">A</span>
              <span className="font-semibold text-stone-700">Adhiraj's Space</span>
            </div>
          </div>

          {/* Navigation list */}
          <nav className="px-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false); // Auto close on mobile click
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-150 group ${
                    isActive
                      ? 'bg-indigo-500/10 text-indigo-750 border border-indigo-500/15 shadow-sm font-bold'
                      : 'text-stone-500 hover:bg-stone-200/40 hover:text-stone-800 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 transition-transform group-hover:scale-105 ${isActive ? 'text-indigo-600' : 'text-stone-400 group-hover:text-stone-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`${item.badgeColor} text-[10px] font-mono font-bold text-white px-1.5 py-0.5 rounded-full inline-block min-w-4 text-center border border-white/10`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-stone-200/80 space-y-3">
          {/* Context banner inside sidebar (Now a supportive, warm advice box) */}
          <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100/80 text-[11px] leading-relaxed">
            <div className="flex items-center gap-1.5 text-amber-705 font-bold mb-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-amber-800">Gentle Reminder</span>
            </div>
            <p className="text-stone-500 font-medium leading-relaxed">
              Operating Systems prep needs 6 hours, with 3 hours currently allocated. Take a breath and let's <span className="text-indigo-600 font-bold hover:underline cursor-pointer">Heal</span> to fit this in safely.
            </p>
          </div>

          {/* Footer profile info in clean colors */}
          <div className="flex items-center gap-2 px-2">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256"
              alt="User profile mini"
              className="w-7 h-7 rounded-full object-cover border border-stone-200"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-stone-700 truncate">Adhiraj Tiwari</p>
              <p className="text-[9px] font-mono text-stone-400 truncate">adhirajtiwari01@gmail.com</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
