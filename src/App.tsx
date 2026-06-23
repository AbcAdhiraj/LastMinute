import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, ShieldAlert, Calendar, CheckSquare, BarChart2, Mail, 
  Target, Flame, Brain, Activity, Clock, Compass, AlertCircle, 
  RefreshCw, ChevronRight, UserCheck, Play, ArrowUpRight, Mic, Quote,
  Menu
} from 'lucide-react';

import { Sidebar } from './components/Sidebar';
import { InboxPanel } from './components/InboxPanel';
import { TasksPanel } from './components/TasksPanel';
import { CalendarPanel } from './components/CalendarPanel';
import { GoalsHabitsPanel } from './components/GoalsHabitsPanel';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { CopilotPanel } from './components/CopilotPanel';
import { VoicePanel } from './components/VoicePanel';
import { Task, CalendarEvent, GmailCommitment, Goal, Habit, Analytics } from './types/index';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [appInitialized, setAppInitialized] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Loaded database state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [commitments, setCommitments] = useState<GmailCommitment[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  const fetchAppData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch profile core stats
      const profileRes = await fetch('/api/profile');
      const profileData = await profileRes.json();
      setTasks(profileData.tasks || []);
      setGoals(profileData.goals || []);
      setHabits(profileData.habits || []);
      setAnalytics(profileData.analytics || null);

      // 2. Fetch calendar events
      const calRes = await fetch('/api/calendar');
      const calData = await calRes.json();
      setCalendarEvents(calData || []);

      // 3. Fetch gmail commitments
      const emailRes = await fetch('/api/gmail-commitments');
      const emailData = await emailRes.json();
      setCommitments(emailData || []);
    } catch (err) {
      console.error("Error fetching system databases ", err);
    } finally {
      setIsLoading(false);
      setAppInitialized(true);
    }
  };

  useEffect(() => {
    fetchAppData();
  }, []);

  const handleTriggerGlobalHeal = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/self-heal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ explicitReason: "Autonomous recovery trigger from main dashboard overview." })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Schedule auto-healing completed successfully! ${data.healedTasksCount || 1} pending study blocks have been optimally recalculated to safeguard deadline completions.`);
        await fetchAppData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Badges calculations
  const unreadEmails = commitments.filter(c => c.status === 'discovered').length;
  const highRiskCounts = tasks.filter(t => t.status !== 'completed' && t.risk?.status !== 'on_track').length;

  return (
    <div className="flex h-screen bg-[#faf9f6] overflow-hidden text-stone-750 relative font-sans">
      
      {/* Decorative Aura Ambient Glow Effects with supportive, soft light amber and blue tones */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-100/40 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-100/30 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="absolute top-[35%] right-[15%] w-[40%] h-[40%] bg-indigo-50/30 rounded-full blur-[120px] pointer-events-none z-0" />
      
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        unreadsCount={unreadEmails} 
        risksCount={highRiskCounts} 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Body */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto z-10 relative">
        
        {/* Top bar header - fully responsive with touch-friendly wrap controls */}
        <header className="min-h-16 border-b border-stone-200/80 bg-white/70 backdrop-blur-md px-4 sm:px-8 py-2.5 flex flex-wrap gap-3 items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {/* Burger Trigger for mobile drawers */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-605 cursor-pointer mr-1"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5 text-stone-500" />
            </button>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-xs font-semibold text-stone-500 font-mono hidden sm:inline-block">adhirajtiwari01@gmail.com</span>
              <span className="text-stone-300 hidden sm:inline-block">•</span>
              <span className="text-xs text-stone-500 font-semibold font-mono flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-indigo-500 animate-spin-slow" />
                Active Target: IIT Kharagpur Semester Prep
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto lg:ml-0">
            {/* Quick corrective heal button */}
            <button
               onClick={handleTriggerGlobalHeal}
               disabled={isLoading}
               className="bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 shadow-sm shadow-indigo-600/10 transition-all font-mono cursor-pointer"
            >
               <Activity className="w-3.5 h-3.5 text-indigo-100 animate-pulse" />
               <span className="hidden xs:inline">Emergency Self-Heal</span>
               <span className="xs:hidden">Heal</span>
            </button>

            {/* Quick voice command modal launcher */}
            <button
              onClick={() => setActiveTab('voice')}
              className={`p-2 rounded-lg border border-stone-200 hover:bg-stone-105 transition-colors cursor-pointer ${activeTab === 'voice' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'text-stone-500'}`}
              title="Voice Assistant Mode"
            >
              <Mic className="w-4 h-4 text-indigo-500" />
            </button>
          </div>
        </header>

        {/* Dynamic Panel Content container */}
        <div className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {isLoading && !appInitialized ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-xs text-stone-500 font-mono animate-pulse">Establishing secure calendar & commitment indexes...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                {/* 1. HOME DASHBOARD OVERVIEW */}
                {activeTab === 'home' && (
                  <div className="space-y-6">
                    
                    {/* AI Avatar Supportive Explanation Block */}
                    {highRiskCounts > 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.99 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-stone-50 border border-stone-200/80 p-5 rounded-2xl flex flex-col md:flex-row items-start gap-4 text-stone-700 shadow-sm"
                      >
                        {/* Avatar Column */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-amber-400 p-[2px]">
                              <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-indigo-600 animate-pulse" />
                              </div>
                            </div>
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                          </div>
                          <div className="md:hidden">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-600 font-mono">Gemini Chief of Staff</span>
                            <h4 className="text-xs font-extrabold text-stone-850">Your AI Assistant</h4>
                          </div>
                        </div>

                        {/* Speech Bubble / Message Content */}
                        <div className="flex-1 space-y-2">
                          <div className="hidden md:block">
                            <span className="text-[9px] uppercase tracking-wider font-bold text-indigo-600 font-mono">Gemini Chief of Staff</span>
                          </div>
                          
                          <p className="text-xs text-stone-600 leading-relaxed font-medium">
                            Hey there, <span className="font-bold text-stone-850">Adhiraj</span>! Just holding space for you. I ran our commitment audit and noticed <span className="text-indigo-600 font-bold">{highRiskCounts} active plans</span> is looking a bit tight with some dense study sessions or overlapping windows nearby. 
                          </p>
                          <p className="text-xs text-stone-600 leading-relaxed font-semibold">
                            Please take a gentle breath—this is completely solvable. Let’s do some self-healing magic to slide your study blocks forwards automatically and ensure you have plenty of room to rest and prepare comfortably. Whenever you're ready, let's make it easy!
                          </p>

                          <div className="pt-2 flex flex-wrap items-center gap-2">
                            <button
                              onClick={handleTriggerGlobalHeal}
                              className="bg-indigo-600 hover:bg-indigo-700 border border-indigo-650 text-[10px] text-white font-mono font-bold px-4 py-2 rounded-lg transition-all shadow-sm hover:translate-y-[-0.5px] active:translate-y-0 cursor-pointer flex items-center gap-1"
                            >
                              <span>Heal my calendar & commitments</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setActiveTab('inbox')}
                              className="bg-white border border-stone-200 hover:bg-stone-50 text-[10px] text-stone-600 font-mono font-bold px-3 py-2 rounded-lg transition-all cursor-pointer"
                            >
                              Review active commitments
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Bento Grid Panel Sections */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                      
                      {/* Left and mid block columns */}
                      <div className="xl:col-span-2 space-y-6">
                        
                        {/* Focus lists: Urgent commitments risk metrics */}
                        <div className="bg-white border border-stone-200/60 rounded-xl p-5 space-y-4 shadow-sm">
                          <div className="flex items-center justify-between border-b border-stone-200/50 pb-3">
                            <h3 className="text-xs font-bold font-mono text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                              Commitment Risk Trackers ({tasks.length})
                            </h3>
                            <button
                              onClick={() => setActiveTab('tasks')}
                              className="text-[10px] text-stone-400 hover:text-indigo-600 flex items-center gap-0.5 font-mono cursor-pointer font-bold"
                            >
                              Planner View <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="space-y-2.5">
                            {tasks.slice(0, 3).map((task) => {
                              const pct = task.risk?.probability ?? 80;
                              const pColor = pct < 45 
                                ? 'text-rose-700 bg-rose-50 border border-rose-100' 
                                : (pct < 75 
                                    ? 'text-amber-700 bg-amber-50 border border-amber-100' 
                                    : 'text-emerald-700 bg-emerald-50 border border-emerald-150');

                              return (
                                <div key={task.id} className="p-3 bg-stone-50/50 border border-stone-150 rounded-lg flex items-center justify-between text-xs hover:border-indigo-100 hover:bg-stone-50/20 transition-all">
                                  <div className="space-y-1">
                                    <p className="font-bold text-stone-800">{task.title}</p>
                                    <div className="flex items-center gap-3 text-[10px] text-stone-500 font-mono font-medium">
                                      <span>DL: {new Date(task.deadline).toLocaleDateString()}</span>
                                      <span>•</span>
                                      <span>{task.remainingEffort} / {task.estimatedEffort}h remaining</span>
                                    </div>
                                  </div>

                                  <span className={`px-2 py-0.5 font-mono font-bold text-[10px] rounded shrink-0 ${pColor}`}>
                                    {pct}% Prob
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Inline habits summary checklists */}
                        <div className="bg-white border border-stone-200/60 rounded-xl p-5 space-y-4 shadow-sm">
                          <div className="flex items-center justify-between border-b border-stone-200/55 pb-3">
                            <h3 className="text-xs font-bold font-mono text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                              <Flame className="w-4 h-4 text-orange-500 fill-orange-500/10" />
                              Active Routine Consistency Check
                            </h3>
                            <button
                              onClick={() => setActiveTab('goals')}
                              className="text-[10px] text-stone-400 hover:text-indigo-600 flex items-center gap-0.5 font-mono cursor-pointer font-bold"
                            >
                              Habits panel <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            {habits.slice(0, 4).map((h) => (
                              <div key={h.id} className="p-3 bg-stone-50/50 border border-stone-150 rounded-lg flex items-center justify-between hover:border-indigo-100 hover:bg-stone-50/20 transition-all">
                                <span className="font-semibold text-stone-800">{h.title}</span>
                                <span className="font-mono font-bold text-[10px] text-orange-600 bg-orange-50 border border-orange-100 px-2.5 py-0.5 rounded flex items-center gap-1">
                                  <Flame className="w-3 h-3 fill-current" />
                                  {h.streak}d Streak
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Travel-Safe Calendar */}
                        <CalendarPanel 
                          events={calendarEvents} 
                          onEventCreated={fetchAppData} 
                          isLoading={isLoading} 
                          setIsLoading={setIsLoading} 
                        />

                      </div>

                      {/* Right pillar block (AI Copilot chat docked on home view) */}
                      <div className="space-y-6">
                        {/* Pinned direct AI Chat helper */}
                        <CopilotPanel 
                          onSelfHealTriggered={fetchAppData} 
                          isLoading={isLoading} 
                          setIsLoading={setIsLoading} 
                        />
                      </div>

                    </div>

                  </div>
                )}

                {/* 2. GMAIL DISCOVERY INBOX PANEL */}
                {activeTab === 'inbox' && (
                  <InboxPanel 
                    commitments={commitments} 
                    onCommitmentImported={fetchAppData} 
                    isLoading={isLoading} 
                    setIsLoading={setIsLoading} 
                  />
                )}

                {/* 3. AI RISK INGESTION CHECLIST PLANNER PANEL */}
                {activeTab === 'tasks' && (
                  <TasksPanel 
                    tasks={tasks} 
                    onTaskUpdated={fetchAppData} 
                    isLoading={isLoading} 
                    setIsLoading={setIsLoading} 
                  />
                )}



                {/* 5. GOALS & HABITS MILESTONES */}
                {activeTab === 'goals' && (
                  <GoalsHabitsPanel 
                    goals={goals} 
                    habits={habits} 
                    onGoalHabitUpdated={fetchAppData} 
                    isLoading={isLoading} 
                    setIsLoading={setIsLoading} 
                  />
                )}

                {/* 6. AI ANALYTICS GRAPHS AND COACH INSIGHTS */}
                {activeTab === 'analytics' && analytics && (
                  <AnalyticsPanel analytics={analytics} />
                )}

                {/* 7. SECURE VOICE INTERACTIVE MODE */}
                {activeTab === 'voice' && (
                  <VoicePanel 
                    onCommandExecuted={fetchAppData} 
                    isLoading={isLoading} 
                    setIsLoading={setIsLoading} 
                  />
                )}

              </motion.div>
            </AnimatePresence>
          )}
        </div>

      </main>

      {/* Loading Block HUD Overlay during calculation spikes */}
      {isLoading && appInitialized && (
        <div className="fixed bottom-6 right-6 bg-[#000000]/90 border border-indigo-500/20 backdrop-blur-md px-4 py-3 rounded-xl flex items-center gap-3 z-50 text-xs font-mono shadow-2xl">
          <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
          <span className="text-gray-300">Synchronizing AI Schedules...</span>
        </div>
      )}

    </div>
  );
}
