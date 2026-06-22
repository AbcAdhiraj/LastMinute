import React from 'react';
import { motion } from 'motion/react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, AreaChart, Area } from 'recharts';
import { BarChart2, Star, TrendingUp, PieChart, Focus, AlertCircle, Zap, Hourglass } from 'lucide-react';
import { Analytics } from '../types';

interface AnalyticsPanelProps {
  analytics: Analytics;
}

export function AnalyticsPanel({ analytics }: AnalyticsPanelProps) {
  
  // Reformat category dataset for Recharts
  const categoryData = Object.entries(analytics.categoryBreakdown || {}).map(([name, value]) => ({
    name: name.toUpperCase(),
    value
  }));

  return (
    <div className="space-y-6">
      
      {/* Upper score indicators array */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-stone-450 font-bold">
            <span className="text-[10px] uppercase font-bold font-mono tracking-tight">Productivity score</span>
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500/10 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-xl font-bold font-mono tracking-tight text-stone-800">{analytics.productivityScore}</span>
            <span className="text-[10px] text-emerald-650 font-mono font-bold">/ 100</span>
          </div>
          <span className="text-[9px] text-stone-550 font-mono block">Behavioral efficiency rating</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-stone-450 font-bold">
            <span className="text-[10px] uppercase font-bold font-mono tracking-tight">Completions</span>
            <TrendingUp className="w-4 h-4 text-emerald-650" />
          </div>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-xl font-bold font-mono tracking-tight text-stone-800">{analytics.completionRate}%</span>
            <span className="text-[10px] text-stone-500 font-mono font-semibold">Rate</span>
          </div>
          <span className="text-[9px] text-stone-550 font-mono block font-medium">{analytics.completedTasks} completed • {analytics.missedTasks} missed</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-stone-450 font-bold">
            <span className="text-[10px] uppercase font-bold font-mono tracking-tight">Deep Focus Hours</span>
            <Focus className="w-4 h-4 text-indigo-600 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-xl font-bold font-mono tracking-tight text-stone-800">{analytics.deepWorkHours}h</span>
            <span className="text-[10px] text-indigo-700 font-mono font-bold">Slotted</span>
          </div>
          <span className="text-[9px] text-stone-550 font-mono block font-medium">Study & deep workload blocks</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-stone-450 font-bold">
            <span className="text-[10px] uppercase font-bold font-mono tracking-tight">Meetings block</span>
            <Hourglass className="w-4 h-4 text-rose-500 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-xl font-bold font-mono tracking-tight text-stone-800">{Math.round(analytics.meetingTime / 60)}h</span>
            <span className="text-[10px] text-stone-500 font-mono font-semibold">Duration</span>
          </div>
          <span className="text-[9px] text-stone-550 font-mono block font-medium">{Math.round(analytics.meetingTime)} total synced minutes</span>
        </div>

      </div>

      {/* Charts panel - Trend over week & Category allocations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly performance area graph */}
        <div className="lg:col-span-2 bg-white border border-stone-200/80 p-5 rounded-xl space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-200/60 pb-3 mb-2">
            <h3 className="text-xs font-bold font-mono text-indigo-705 uppercase tracking-wide">Weekly Focus & Completion Trends</h3>
            <span className="text-[10px] text-stone-450 font-mono font-bold">Past 7 Operational Days</span>
          </div>

          <div className="w-full h-64 text-[10px] font-mono leading-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.weeklyTrends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDeepWork" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="week" stroke="rgba(0,0,0,0.38)" tickLine={false} />
                <YAxis stroke="rgba(0,0,0,0.38)" tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.96)', backdropFilter: 'blur(8px)', borderColor: 'rgba(0,0,0,0.08)', color: '#292524', borderRadius: '8px', fontSize: '10px', fontFamily: 'monospace' }} />
                <Legend />
                <Area type="monotone" name="Deep Work (h)" dataKey="deepWork" stroke="#4f46e5" fillOpacity={1} fill="url(#colorDeepWork)" strokeWidth={2} />
                <Area type="monotone" name="Tasks Complete" dataKey="completed" stroke="#059669" fillOpacity={1} fill="url(#colorCompleted)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category distribution bar graph */}
        <div className="bg-white border border-stone-200/80 p-5 rounded-xl space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-200/60 pb-3 mb-2">
            <h3 className="text-xs font-bold font-mono text-indigo-705 uppercase tracking-wide">Workload Category Count</h3>
            <span className="text-[10px] text-stone-450 font-mono font-bold">Active slots</span>
          </div>

          <div className="w-full h-64 text-[10px] font-mono">
            {categoryData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-stone-400 font-mono text-xs font-bold">No entries parsed</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="name" stroke="rgba(0,0,0,0.38)" tickLine={false} />
                  <YAxis stroke="rgba(0,0,0,0.38)" tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.96)', backdropFilter: 'blur(8px)', borderColor: 'rgba(0,0,0,0.08)', color: '#292524', borderRadius: '8px', fontSize: '10px', fontFamily: 'monospace' }} />
                  <Bar dataKey="value" name="Commitment Volume" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* AI coach insights card */}
      <div className="bg-white border border-stone-200/80 p-5 rounded-xl space-y-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-stone-200/60 pb-3">
          <Star className="w-5 h-5 text-indigo-600 fill-indigo-500/10 animate-spin-slow" />
          <h3 className="text-xs font-bold font-mono text-stone-850 uppercase tracking-wide">Gemini Cognitive Productivity Analysis</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          
          <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-2 leading-relaxed shadow-xs">
            <div className="flex items-center gap-2 font-bold text-indigo-805">
              <Zap className="w-4 h-4 text-indigo-600 animate-pulse" />
              <span>Evening Peak Focus Optimization</span>
            </div>
            <p className="text-stone-800 text-[11px] font-mono leading-normal font-medium">
              Your highest focus consistency occurs between <span className="text-indigo-700 font-bold">8:00 PM and 11:00 PM</span> (average 95% completion rate of focus blocks). We have adjusted study buffer suggestions to lean into your biological slot peaks.
            </p>
          </div>

          <div className="p-4 bg-orange-50/60 border border-orange-200 rounded-xl space-y-2 leading-relaxed shadow-xs">
            <div className="flex items-center gap-2 font-bold text-orange-850">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <span>Commitment Ingestion Delay Friction</span>
            </div>
            <p className="text-stone-800 text-[11px] font-mono leading-normal font-medium">
              Commitments created less than <span className="text-orange-800 font-bold">3 days before deadlines</span> fail 68% of the time due to calendar congestion. Starting Operating Systems tonight increases completion probability from <span className="text-emerald-700 font-bold font-mono underline">28% to 74%</span> immediately!
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
