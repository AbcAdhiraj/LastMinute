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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-black">
        
        <div className="bg-white p-4 rounded-xl border-2 border-black space-y-1 neo-shadow-black-sm">
          <div className="flex items-center justify-between font-black">
            <span className="text-[10px] uppercase font-black font-mono tracking-tight text-black/60">Productivity score</span>
            <Zap className="w-4 h-4 text-black stroke-[2.5px] animate-pulse" />
          </div>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-xl font-black font-mono tracking-tight text-black">{analytics.productivityScore}</span>
            <span className="text-[10px] text-black/60 font-mono font-black">/ 100</span>
          </div>
          <span className="text-[9px] text-black/60 font-mono block font-bold">Behavioral efficiency rating</span>
        </div>

        <div className="bg-white p-4 rounded-xl border-2 border-black space-y-1 neo-shadow-black-sm">
          <div className="flex items-center justify-between font-black">
            <span className="text-[10px] uppercase font-black font-mono tracking-tight text-black/60">Completions</span>
            <TrendingUp className="w-4 h-4 text-black stroke-[2.5px]" />
          </div>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-xl font-black font-mono tracking-tight text-black">{analytics.completionRate}%</span>
            <span className="text-[10px] text-black/60 font-mono font-black">Rate</span>
          </div>
          <span className="text-[9px] text-black/60 font-mono block font-bold">{analytics.completedTasks} completed • {analytics.missedTasks} missed</span>
        </div>

        <div className="bg-white p-4 rounded-xl border-2 border-black space-y-1 neo-shadow-black-sm">
          <div className="flex items-center justify-between font-black">
            <span className="text-[10px] uppercase font-black font-mono tracking-tight text-black/60">Deep Focus Hours</span>
            <Focus className="w-4 h-4 text-black stroke-[2.5px] animate-pulse" />
          </div>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-xl font-black font-mono tracking-tight text-black">{analytics.deepWorkHours}h</span>
            <span className="text-[10px] text-black/60 font-mono font-black">Slotted</span>
          </div>
          <span className="text-[9px] text-black/60 font-mono block font-bold">Study & deep workload blocks</span>
        </div>

        <div className="bg-white p-4 rounded-xl border-2 border-black space-y-1 neo-shadow-black-sm">
          <div className="flex items-center justify-between font-black">
            <span className="text-[10px] uppercase font-black font-mono tracking-tight text-black/60">Meetings block</span>
            <Hourglass className="w-4 h-4 text-black stroke-[2.5px] animate-pulse" />
          </div>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-xl font-black font-mono tracking-tight text-black">{Math.round(analytics.meetingTime / 60)}h</span>
            <span className="text-[10px] text-black/60 font-mono font-black">Duration</span>
          </div>
          <span className="text-[9px] text-black/60 font-mono block font-bold">{Math.round(analytics.meetingTime)} total synced minutes</span>
        </div>

      </div>

      {/* Charts panel - Trend over week & Category allocations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-black">
        
        {/* Weekly performance area graph */}
        <div className="lg:col-span-2 bg-white border-4 border-black p-5 rounded-xl space-y-3 neo-shadow-black">
          <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-2">
            <h3 className="text-xs font-black font-mono text-black uppercase tracking-wide">Weekly Focus & Completion Trends</h3>
            <span className="text-[10px] text-black/60 font-mono font-black">Past 7 Operational Days</span>
          </div>

          <div className="w-full h-64 text-[10px] font-mono leading-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.weeklyTrends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                <XAxis dataKey="week" stroke="#000" tickLine={false} />
                <YAxis stroke="#000" tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#000000', borderWidth: '2px', color: '#000000', borderRadius: '4px', fontSize: '10px', fontFamily: 'monospace', fontWeight: 'bold' }} />
                <Legend />
                <Area type="monotone" name="Deep Focus (h)" dataKey="deepWork" stroke="#000000" fill="#98e2ff" fillOpacity={0.8} strokeWidth={2.5} />
                <Area type="monotone" name="Tasks Completed" dataKey="completed" stroke="#000000" fill="#b8f598" fillOpacity={0.8} strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category distribution bar graph */}
        <div className="bg-white border-4 border-black p-5 rounded-xl space-y-3 neo-shadow-black">
          <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-2">
            <h3 className="text-xs font-black font-mono text-black uppercase tracking-wide">Workload Category Count</h3>
            <span className="text-[10px] text-black/60 font-mono font-black">Active slots</span>
          </div>

          <div className="w-full h-64 text-[10px] font-mono">
            {categoryData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-black/50 font-mono text-xs font-black">No entries parsed</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                  <XAxis dataKey="name" stroke="#000" tickLine={false} />
                  <YAxis stroke="#000" tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#000000', borderWidth: '2px', color: '#000000', borderRadius: '4px', fontSize: '10px', fontFamily: 'monospace', fontWeight: 'bold' }} />
                  <Bar dataKey="value" name="Commitment Volume" fill="#dfbeff" stroke="#000000" strokeWidth={2} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Task Completion Probability Trend & AI coach insights card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-black">
        
        {/* Weekly Task Completion Probability trend line chart */}
        <div className="lg:col-span-2 bg-white border-4 border-black p-5 rounded-xl space-y-3 neo-shadow-black">
          <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-2">
            <h3 className="text-xs font-black font-mono text-black uppercase tracking-wide flex items-center gap-1.5">
              <TrendingUp className="w-4.5 h-4.5 text-black stroke-[2.5px]" />
              Task Completion Probability Trend
            </h3>
            <span className="text-[10px] text-black/60 font-mono font-black">Past 7 Days Momentum</span>
          </div>

          <div className="w-full h-64 text-[10px] font-mono leading-none">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.weeklyTrends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                <XAxis dataKey="week" stroke="#000" tickLine={false} />
                <YAxis stroke="#000" tickLine={false} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#000000', borderWidth: '2px', color: '#000000', borderRadius: '4px', fontSize: '10px', fontFamily: 'monospace', fontWeight: 'bold' }} />
                <Legend />
                <Line 
                  type="monotone" 
                  name="Completion Probability (%)" 
                  dataKey="probability" 
                  stroke="#000000" 
                  strokeWidth={3} 
                  activeDot={{ r: 8 }} 
                  dot={{ strokeWidth: 2, r: 4, stroke: "#000000", fill: "#ffa852" }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI coach insights card */}
        <div className="bg-white border-4 border-black p-5 rounded-xl space-y-4 neo-shadow-black flex flex-col justify-between text-black">
          <div>
            <div className="flex items-center gap-2 border-b-2 border-black pb-3 mb-3">
              <Star className="w-4.5 h-4.5 text-black stroke-[2.5px] animate-pulse" />
              <h3 className="text-xs font-black font-mono text-black uppercase tracking-wide">Gemini Cognitive Insights</h3>
            </div>

            <div className="space-y-3 text-xs">
              
              <div className="p-3 bg-[#98e2ff]/20 border-2 border-black rounded-lg space-y-1.5 leading-relaxed shadow-xs">
                <div className="flex items-center gap-2 font-black text-black">
                  <Zap className="w-3.5 h-3.5 text-black stroke-[2.5px] animate-pulse" />
                  <span className="text-[10px] uppercase font-mono tracking-tight">Evening Peak Focus</span>
                </div>
                <p className="text-black text-[11px] font-mono leading-normal font-bold">
                  Your highest consistency occurs between <span className="bg-[#fff582] border border-black px-1 py-0.5 rounded font-black">8:00 PM and 11:00 PM</span>. Suggesting buffer peaks here.
                </p>
              </div>

              <div className="p-3 bg-[#ffa852]/20 border-2 border-black rounded-lg space-y-1.5 leading-relaxed shadow-xs">
                <div className="flex items-center gap-2 font-black text-black">
                  <AlertCircle className="w-3.5 h-3.5 text-black stroke-[2.5px] animate-bounce" />
                  <span className="text-[10px] uppercase font-mono tracking-tight">Ingestion delay Friction</span>
                </div>
                <p className="text-black text-[11px] font-mono leading-normal font-bold">
                  Commitments created less than <span className="bg-[#ff6161] text-black border border-black px-1 py-0.5 rounded font-black">3 days before deadlines</span> fail 68% of the time.
                </p>
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
