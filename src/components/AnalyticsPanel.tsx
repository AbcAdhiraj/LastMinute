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
        
        <div className="bg-gradient-to-br from-neutral-900 via-neutral-950 to-black p-4 rounded-xl border border-neutral-800/80 space-y-1 shadow-md">
          <div className="flex items-center justify-between text-neutral-400 font-bold">
            <span className="text-[10px] uppercase font-bold font-mono tracking-tight text-neutral-500">Productivity score</span>
            <Zap className="w-4 h-4 text-orange-450 fill-orange-500/10 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-xl font-bold font-mono tracking-tight text-white">{analytics.productivityScore}</span>
            <span className="text-[10px] text-neutral-400 font-mono font-bold">/ 100</span>
          </div>
          <span className="text-[9px] text-neutral-500 font-mono block">Behavioral efficiency rating</span>
        </div>

        <div className="bg-gradient-to-br from-neutral-900 via-neutral-950 to-black p-4 rounded-xl border border-neutral-800/80 space-y-1 shadow-md">
          <div className="flex items-center justify-between text-neutral-400 font-bold">
            <span className="text-[10px] uppercase font-bold font-mono tracking-tight text-neutral-500">Completions</span>
            <TrendingUp className="w-4 h-4 text-emerald-450" />
          </div>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-xl font-bold font-mono tracking-tight text-emerald-400">{analytics.completionRate}%</span>
            <span className="text-[10px] text-neutral-400 font-mono font-semibold">Rate</span>
          </div>
          <span className="text-[9px] text-neutral-500 font-mono block font-medium">{analytics.completedTasks} completed • {analytics.missedTasks} missed</span>
        </div>

        <div className="bg-gradient-to-br from-neutral-900 via-neutral-950 to-black p-4 rounded-xl border border-neutral-800/80 space-y-1 shadow-md">
          <div className="flex items-center justify-between text-neutral-400 font-bold">
            <span className="text-[10px] uppercase font-bold font-mono tracking-tight text-neutral-500">Deep Focus Hours</span>
            <Focus className="w-4 h-4 text-blue-450 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-xl font-bold font-mono tracking-tight text-blue-400">{analytics.deepWorkHours}h</span>
            <span className="text-[10px] text-blue-400 font-mono font-bold">Slotted</span>
          </div>
          <span className="text-[9px] text-neutral-500 font-mono block font-medium">Study & deep workload blocks</span>
        </div>

        <div className="bg-gradient-to-br from-neutral-900 via-neutral-950 to-black p-4 rounded-xl border border-neutral-800/80 space-y-1 shadow-md">
          <div className="flex items-center justify-between text-neutral-400 font-bold">
            <span className="text-[10px] uppercase font-bold font-mono tracking-tight text-neutral-500">Meetings block</span>
            <Hourglass className="w-4 h-4 text-orange-400 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-xl font-bold font-mono tracking-tight text-white">{Math.round(analytics.meetingTime / 60)}h</span>
            <span className="text-[10px] text-neutral-400 font-mono font-semibold">Duration</span>
          </div>
          <span className="text-[9px] text-neutral-500 font-mono block font-medium">{Math.round(analytics.meetingTime)} total synced minutes</span>
        </div>

      </div>

      {/* Charts panel - Trend over week & Category allocations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly performance area graph */}
        <div className="lg:col-span-2 bg-gradient-to-br from-[#0c0c0c] to-black border border-neutral-850 p-5 rounded-xl space-y-3 shadow-2xl">
          <div className="flex items-center justify-between border-b border-neutral-805/80 pb-3 mb-2">
            <h3 className="text-xs font-bold font-mono text-blue-400 uppercase tracking-wide">Weekly Focus & Completion Trends</h3>
            <span className="text-[10px] text-neutral-500 font-mono font-bold">Past 7 Operational Days</span>
          </div>

          <div className="w-full h-64 text-[10px] font-mono leading-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.weeklyTrends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDeepWork" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="week" stroke="rgba(255,255,255,0.3)" tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#090909', backdropFilter: 'blur(8px)', borderColor: '#222222', color: '#f5f5f5', borderRadius: '8px', fontSize: '10px', fontFamily: 'monospace' }} />
                <Legend />
                <Area type="monotone" name="Deep Focus (h)" dataKey="deepWork" stroke="#3b82f6" fillOpacity={1} fill="url(#colorDeepWork)" strokeWidth={2.5} />
                <Area type="monotone" name="Tasks Completed" dataKey="completed" stroke="#10b981" fillOpacity={1} fill="url(#colorCompleted)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category distribution bar graph */}
        <div className="bg-gradient-to-br from-[#0c0c0c] to-black border border-neutral-850 p-5 rounded-xl space-y-3 shadow-2xl">
          <div className="flex items-center justify-between border-b border-neutral-805/80 pb-3 mb-2">
            <h3 className="text-xs font-bold font-mono text-blue-400 uppercase tracking-wide">Workload Category Count</h3>
            <span className="text-[10px] text-neutral-500 font-mono font-bold">Active slots</span>
          </div>

          <div className="w-full h-64 text-[10px] font-mono">
            {categoryData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-neutral-500 font-mono text-xs font-bold">No entries parsed</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.3)" tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#090909', backdropFilter: 'blur(8px)', borderColor: '#222222', color: '#f5f5f5', borderRadius: '8px', fontSize: '10px', fontFamily: 'monospace' }} />
                  <Bar dataKey="value" name="Commitment Volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Task Completion Probability Trend & AI coach insights card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Task Completion Probability trend line chart */}
        <div className="lg:col-span-2 bg-gradient-to-br from-[#0c0c0c] to-black border border-neutral-850 p-5 rounded-xl space-y-3 shadow-2xl">
          <div className="flex items-center justify-between border-b border-neutral-805/80 pb-3 mb-2">
            <h3 className="text-xs font-bold font-mono text-orange-400 uppercase tracking-wide flex items-center gap-1.5">
              <TrendingUp className="w-4.5 h-4.5 text-orange-400 animate-pulse" />
              Task Completion Probability Trend
            </h3>
            <span className="text-[10px] text-neutral-500 font-mono font-bold">Past 7 Days Momentum</span>
          </div>

          <div className="w-full h-64 text-[10px] font-mono leading-none">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.weeklyTrends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="week" stroke="rgba(255,255,255,0.3)" tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" tickLine={false} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                <Tooltip contentStyle={{ backgroundColor: '#090909', backdropFilter: 'blur(8px)', borderColor: '#222222', color: '#f5f5f5', borderRadius: '8px', fontSize: '10px', fontFamily: 'monospace' }} />
                <Legend />
                <Line 
                  type="monotone" 
                  name="Completion Probability (%)" 
                  dataKey="probability" 
                  stroke="#f97316" 
                  strokeWidth={3} 
                  activeDot={{ r: 8 }} 
                  dot={{ strokeWidth: 2, r: 4, stroke: "#ffffff" }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI coach insights card */}
        <div className="bg-gradient-to-br from-neutral-900 to-black border border-neutral-850/80 p-5 rounded-xl space-y-4 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-neutral-805/80 pb-3 mb-3">
              <Star className="w-4.5 h-4.5 text-blue-400 fill-blue-500/10 animate-pulse" />
              <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wide">Gemini Cognitive Insights</h3>
            </div>

            <div className="space-y-3 text-xs">
              
              <div className="p-3 bg-blue-950/15 border border-blue-900/40 rounded-lg space-y-1.5 leading-relaxed shadow-sm">
                <div className="flex items-center gap-2 font-bold text-blue-300">
                  <Zap className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                  <span className="text-[10px] uppercase font-mono tracking-tight">Evening Peak Focus</span>
                </div>
                <p className="text-neutral-300 text-[11px] font-mono leading-normal font-medium">
                  Your highest consistency occurs between <span className="text-blue-400 font-bold">8:00 PM and 11:00 PM</span>. Suggesting buffer peaks here.
                </p>
              </div>

              <div className="p-3 bg-orange-950/15 border border-orange-900/40 rounded-lg space-y-1.5 leading-relaxed shadow-sm">
                <div className="flex items-center gap-2 font-bold text-orange-350">
                  <AlertCircle className="w-3.5 h-3.5 text-orange-400 animate-bounce" />
                  <span className="text-[10px] uppercase font-mono tracking-tight">Ingestion delay Friction</span>
                </div>
                <p className="text-neutral-305 text-[11px] font-mono leading-normal font-medium">
                  Commitments created less than <span className="text-orange-400 font-bold">3 days before deadlines</span> fail 68% of the time.
                </p>
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
