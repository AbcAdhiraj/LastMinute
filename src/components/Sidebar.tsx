import React from 'react';
import { Home, Mail, CheckSquare, Calendar, BarChart2, Target, Mic, Settings, AlertCircle, Sparkles } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadsCount: number;
  risksCount: number;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  userProfile?: {
    name: string;
    email: string;
    avatarUrl: string;
  };
  onLogOut?: () => void;
}

export function Sidebar({ 
  activeTab, 
  setActiveTab, 
  unreadsCount, 
  risksCount, 
  sidebarOpen, 
  setSidebarOpen,
  userProfile,
  onLogOut
}: SidebarProps) {
  const menuItems = [
    { id: 'home', label: 'Home Dashboard', icon: Home, bg: 'bg-[#fff066]' },
    { id: 'inbox', label: 'Gmail Commitments', icon: Mail, badge: unreadsCount > 0 ? unreadsCount : undefined, badgeColor: 'bg-[#ff66b2]', bg: 'bg-[#98e2ff]' },
    { id: 'tasks', label: 'AI Risk Tracker', icon: CheckSquare, badge: risksCount > 0 ? risksCount : undefined, badgeColor: 'bg-[#ff4444]', bg: 'bg-[#ff94e0]' },
    { id: 'goals', label: 'Goals & Habits', icon: Target, bg: 'bg-[#b8f598]' },
    { id: 'analytics', label: 'AI Productivity', icon: BarChart2, bg: 'bg-[#dfbeff]' },
  ];

  const displayName = userProfile?.name || "Raj";
  const displayAvatar = userProfile?.avatarUrl || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256";
  const initialLetter = displayName ? displayName.charAt(0).toUpperCase() : "R";

  return (
    <>
      {/* Background overlay on mobile when sidebar is open */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-[#000000]/40 backdrop-blur-xs z-30 transition-opacity duration-200"
        />
      )}

      <aside className={`fixed inset-y-0 left-0 bg-[#fbf9f4] border-r-4 border-black flex flex-col justify-between h-full select-none text-black z-40 w-64 transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static transition-transform duration-250 ease-in-out`}>
        <div className="flex flex-col">
          {/* App Title block - styled with bold neo-brutalist pop colors */}
          <div className="p-5 border-b-4 border-black flex items-center justify-between bg-[#fff582]">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-black text-[#ffffff] border-2 border-black rounded-sm shadow-sm">
                <Sparkles className="w-5 h-5 text-[#fbee72] fill-[#fbee72]/20" />
              </span>
              <div>
                <h1 className="font-extrabold text-[#000000] text-base tracking-tight uppercase">Cludder</h1>
                <span className="text-[10px] text-black font-extrabold font-mono uppercase bg-[#ffffff] border border-black px-1 rounded">CALY V2</span>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-[#ffffff] px-2 py-0.5 rounded border-2 border-black">
              <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-ping" />
              <span className="text-[9px] text-[#000000] font-black font-mono">LIVE</span>
            </div>
          </div>

          {/* User Workspace label */}
          <div className="px-5 py-4 border-b-2 border-black/80">
            <span className="text-[10px] font-mono tracking-wider font-extrabold text-black/60 uppercase">Workspace</span>
            <div className="mt-1 flex items-center gap-2 bg-[#ffffff] px-3 py-1.5 rounded border-2 border-black text-xs neo-shadow-black-sm">
              <span className="w-5 h-5 bg-[#ff9ee1] border border-black rounded-full flex items-center justify-center text-[10px] font-black text-black font-mono">{initialLetter}</span>
              <span className="font-bold text-black truncate">{displayName.split(' ')[0]}'s Space</span>
            </div>
          </div>

          {/* Navigation list */}
          <nav className="px-3 py-4 space-y-2">
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
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded border-2 border-black text-xs font-extrabold tracking-tight transition-all duration-150 ${
                    isActive
                      ? `${item.bg} text-[#000000] neo-shadow-black scale-102 translate-x-[1px] translate-y-[-1px]`
                      : 'text-black/80 hover:bg-[#ffffff] hover:neo-shadow-black'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#000000] stroke-[2.5px]' : 'text-black/60'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`${item.badgeColor} text-[10px] font-mono font-black text-[#ffffff] px-2 py-0.5 rounded border border-black`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t-4 border-black bg-[#e4f3a2]/40">
          {/* Context banner inside sidebar (Now a supportive, warm Advice box) */}
          <div className="bg-[#ffa852] p-3 rounded border-2 border-black text-[11px] leading-relaxed neo-shadow-black-sm text-[#000000]">
            <div className="flex items-center gap-1.5 font-extrabold mb-1">
              <AlertCircle className="w-3.5 h-3.5 text-black" />
              <span className="uppercase text-[9px] font-mono tracking-wide font-black">Gentle Reminder</span>
            </div>
            <p className="font-bold text-black/90 leading-tight">
              Operating Systems prep needs 6 hours, with 3 hours currently allocated. Take a breath and let's <span className="underline font-black hover:text-white cursor-pointer select-none">Heal</span> to fit this in safely.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
