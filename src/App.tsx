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
import { Task, CalendarEvent, ScheduledSession, GmailCommitment, Goal, Habit, Analytics } from './types/index';
import { AuthPage } from './components/AuthPage';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { apiFetch } from './utils/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [appInitialized, setAppInitialized] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Auth state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [userProfile, setUserProfile] = useState<{ name: string; email: string; avatarUrl: string } | null>(null);

  // Loaded database state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [scheduledSessions, setScheduledSessions] = useState<ScheduledSession[]>([]);
  const [commitments, setCommitments] = useState<GmailCommitment[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  const [healedTaskIds, setHealedTaskIds] = useState<string[]>([]);
  const [cheekyMessage, setCheekyMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(null);
    setTimeout(() => {
      setToastMessage(message);
    }, 15);
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setAuthLoading(false);
      } else {
        // Try restoring sandbox user session
        const storedSandbox = localStorage.getItem('life-saver-sandbox-user');
        if (storedSandbox) {
          try {
            setCurrentUser(JSON.parse(storedSandbox));
          } catch (e) {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
        setAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogOut = async () => {
    try {
      setIsLoading(true);
      await signOut(auth);
      localStorage.removeItem('life-saver-sandbox-user');
      localStorage.removeItem('life-saver-sandbox-uid');
      setCurrentUser(null);
      setTasks([]);
      setGoals([]);
      setHabits([]);
      setCalendarEvents([]);
      setCommitments([]);
      setAnalytics(null);
      setUserProfile(null);
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerTaskHeal = async (taskId: string) => {
    setIsLoading(true);
    let updatedHealed = healedTaskIds;
    if (!healedTaskIds.includes(taskId)) {
      updatedHealed = [...healedTaskIds, taskId];
      setHealedTaskIds(updatedHealed);
    }
    try {
      showToast("Triggering predictive schedule self-heal workflow...");
      const res = await apiFetch('/api/self-heal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, explicitReason: "Autonomous single-task corrective recovery." })
      });
      const data = await res.json();
      if (data.success) {
        await fetchAppData();
        if (updatedHealed.length > 1) {
          // Display cheeky message instead of standard alert
          setCheekyMessage(`Whoa there, Adhiraj! As the saying goes, 'a stitch in time saves nine' and 'an ounce of prevention is worth a pound of cure'! You are trying to shut the stable door after the horse has bolted. If you had put in the work earlier instead of trying to work miracles at the eleventh hour, you wouldn't be in this pickle! But no use crying over spilled milk—I've healed your schedule for this task, but let's make sure we face the music and don't make this a habit!`);
          showToast("Healed calendar allocations with diagnostic accountability check!");
        } else {
          showToast("Schedule auto-healing completed! Focus blocks reallocated successfully.");
        }
      }
    } catch (err) {
      console.error(err);
      showToast("Self-heal operation encountered an error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAppData = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      // 1. Fetch profile core stats
      const profileRes = await apiFetch('/api/profile');
      const profileData = await profileRes.json();
      setTasks(profileData.tasks || []);
      setGoals(profileData.goals || []);
      setHabits(profileData.habits || []);
      setScheduledSessions(profileData.scheduledSessions || []);
      setAnalytics(profileData.analytics || null);
      setUserProfile(profileData.userProfile || null);

      // 2. Fetch calendar events
      const calRes = await apiFetch('/api/calendar');
      const calData = await calRes.json();
      setCalendarEvents(calData || []);

      // 3. Fetch gmail commitments
      const emailRes = await apiFetch('/api/gmail-commitments');
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
    if (currentUser) {
      fetchAppData();
    }
  }, [currentUser]);

  const handleTriggerGlobalHeal = async () => {
    setIsLoading(true);
    showToast("Initializing Emergency System-Wide Self-Heal operation...");
    try {
      const res = await apiFetch('/api/self-heal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ explicitReason: "Autonomous recovery trigger from main dashboard overview." })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Heal completed! Re-allocated study sessions to safe zones.`);
        await fetchAppData();
      }
    } catch (err) {
      console.error(err);
      showToast("Global self-heal failed to execute");
    } finally {
      setIsLoading(false);
    }
  };

  // Badges calculations
  const unreadEmails = commitments.filter(c => c.status === 'discovered').length;
  const tightTasks = tasks.filter(t => t.status !== 'completed' && t.risk?.status !== 'on_track');
  const highRiskCounts = tightTasks.length;
  const tightTaskNames = tightTasks.map(t => t.title);
  const plansText = tightTaskNames.length > 0 
    ? tightTaskNames.map(name => `"${name}"`).join(', ') 
    : "your active plans";

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f1f4df] flex flex-col items-center justify-center font-mono border-8 border-black text-black">
        <div className="bg-white p-8 rounded border-4 border-black neo-shadow-black text-center space-y-4">
          <RefreshCw className="w-10 h-10 animate-spin mx-auto text-[#ffa852]" />
          <h2 className="font-extrabold text-lg uppercase tracking-tight">Initializing Life Saver</h2>
          <p className="text-xs font-bold text-black/60">Verifying secure database credentials...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AuthPage 
        onAuthComplete={(user, dbData) => {
          setCurrentUser(user);
          if (dbData) {
            setTasks(dbData.tasks || []);
            setGoals(dbData.goals || []);
            setHabits(dbData.habits || []);
            setCalendarEvents(dbData.calendarEvents || []);
            setCommitments(dbData.gmailCommitments || []);
            setUserProfile(dbData.userProfile || null);
          }
          fetchAppData();
        }} 
      />
    );
  }

  return (
    <div className="flex h-screen bg-[#f1f4df] overflow-hidden text-black relative font-sans">
      
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        unreadsCount={unreadEmails} 
        risksCount={highRiskCounts} 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        userProfile={userProfile || undefined}
        onLogOut={handleLogOut}
      />

      {/* Main Body */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto z-10 relative">
        
        {/* Top bar header - Neo-brutalist style */}
        <header className="min-h-16 border-b-4 border-black bg-white px-4 sm:px-8 py-2.5 flex flex-wrap gap-3 items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {/* Burger Trigger for mobile drawers */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded border-2 border-black hover:bg-neutral-100 text-black cursor-pointer mr-1 animate-pulse"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5 text-black" />
            </button>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-xs font-bold text-black/60 font-mono hidden sm:inline-block">{userProfile?.email || currentUser?.email || "adhirajtiwari01@gmail.com"}</span>
              <span className="text-black/30 hidden sm:inline-block">•</span>
              <span className="text-xs text-black font-extrabold font-mono flex items-center gap-1.5 bg-[#dfbeff] px-3 py-1 rounded border-2 border-black neo-shadow-black-sm">
                <Compass className="w-3.5 h-3.5 text-black animate-spin-slow" />
                Active Target: Harvard MBA 
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto lg:ml-0">
            {/* Quick corrective heal button - Neo-brutalist punch */}
            <button
               onClick={handleTriggerGlobalHeal}
               disabled={isLoading}
               className="bg-[#ffa852] hover:bg-[#ff9a36] text-black font-black text-xs py-2 px-4 rounded border-2 border-black flex items-center gap-1.5 shadow-sm hover:translate-x-[1px] hover:translate-y-[1px] neo-shadow-black-sm transition-all font-mono cursor-pointer"
            >
               <Activity className="w-3.5 h-3.5 text-black animate-pulse" />
               <span className="hidden xs:inline">Emergency Self-Heal</span>
               <span className="xs:hidden">Heal</span>
            </button>

            {/* Quick voice command modal launcher */}
            <button
              onClick={() => setActiveTab('voice')}
              className={`p-2 rounded border-2 border-black transition-all duration-150 cursor-pointer ${activeTab === 'voice' ? 'bg-[#ff9ee1] text-black neo-shadow-black-sm translate-x-[1px] translate-y-[1px]' : 'bg-white hover:bg-neutral-50 text-black'}`}
              title="Voice Assistant Mode"
            >
               <Mic className="w-4 h-4 text-black" />
            </button>
          </div>
        </header>

        {/* Dynamic Panel Content container */}
        <div className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {isLoading && !appInitialized ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-xs text-neutral-400 font-mono animate-pulse">Establishing secure calendar & commitment indexes...</p>
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
                        className="bg-[#fffccf] border-4 border-black p-5 rounded-xl flex flex-col md:flex-row items-start gap-4 text-black neo-shadow-black"
                      >
                        {/* Avatar Column */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-[#ff9ee1] p-[2px] border-2 border-black">
                              <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-black animate-pulse" />
                              </div>
                            </div>
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-black rounded-full"></span>
                          </div>
                          <div className="md:hidden">
                            <span className="text-[10px] uppercase tracking-wider font-extrabold text-black font-mono bg-white px-1 border border-black rounded">Goofy</span>
                            <h4 className="text-xs font-black text-black">Your AI Assistant</h4>
                          </div>
                        </div>                         {/* Speech Bubble / Message Content */}
                        <div className="flex-1 space-y-2">
                          <div className="hidden md:block">
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-black font-mono bg-white px-1.5 py-0.5 border-2 border-black rounded shadow-[1.5px_1.5px_0px_0px_#000000]">Goofy AI</span>
                          </div>
                          
                          <p className="text-xs text-black/90 leading-relaxed font-extrabold">
                            Hey Adhiraj! Some of your tasks look very tight. Don't stress, we can easily fix it! Let's heal your schedule to make space.
                          </p>

                          <div className="pt-2 flex flex-wrap items-center gap-2">
                            <button
                              onClick={handleTriggerGlobalHeal}
                              className="bg-[#b8f598] hover:bg-[#a3e480] border-2 border-black text-[10px] text-black font-mono font-black px-4 py-2 rounded transition-all neo-shadow-black-sm cursor-pointer flex items-center gap-1 active:translate-y-0.5"
                            >
                              <span>Heal my calendar & commitments</span>
                              <ChevronRight className="w-3 h-3 stroke-[2.5px]" />
                            </button>
                            <button
                              onClick={() => setActiveTab('inbox')}
                              className="bg-white border-2 border-black hover:bg-neutral-50 text-[10px] text-black font-mono font-black px-3 py-2 rounded transition-all cursor-pointer shadow-xs active:translate-y-0.5"
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
                        <div className="bg-[#ffffff] border-4 border-black rounded-xl p-5 space-y-4 neo-shadow-black">
                          <div className="flex items-center justify-between border-b-2 border-black pb-3">
                            <h3 className="text-xs font-black font-mono text-black uppercase tracking-tight flex items-center gap-1.5">
                              <CheckSquare className="w-4 h-4 text-black" />
                              Commitment Risk Trackers ({tasks.length})
                            </h3>
                            <button
                              onClick={() => setActiveTab('tasks')}
                              className="text-[10px] bg-[#98e2ff] border-2 border-black rounded px-2 py-0.5 text-black flex items-center gap-0.5 font-mono cursor-pointer font-black hover:bg-[#85d3f0] active:translate-y-0.5"
                            >
                              Planner View <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="space-y-2.5">
                            {tasks.slice(0, 3).map((task) => {
                              const pct = task.risk?.probability ?? 80;
                              const pColor = pct < 45 
                                ? 'text-black bg-[#ff6161] border-2 border-black' 
                                : (pct < 75 
                                    ? 'text-black bg-[#ffa852] border-2 border-black' 
                                    : 'text-black bg-[#b8f598] border-2 border-black');

                              return (
                                <div key={task.id} className="p-3 bg-white border-2 border-black rounded-lg flex items-center justify-between text-xs hover:bg-[#fff9e6] transition-all duration-100 neo-shadow-black-sm">
                                  <div className="space-y-1">
                                    <p className="font-extrabold text-[#000000]">{task.title}</p>
                                    <div className="flex items-center gap-3 text-[10px] text-black/60 font-mono font-bold">
                                      <span>DL: <span className="text-black font-extrabold underline">{new Date(task.deadline).toLocaleDateString()}</span></span>
                                      <span>•</span>
                                      <span>{task.remainingEffort} / {task.estimatedEffort}h remaining</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {pct < 40 && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          triggerTaskHeal(task.id);
                                        }}
                                        className="bg-[#ffe555] hover:bg-[#ffd111] text-black text-[10px] uppercase font-mono font-black border-2 border-black px-2.5 py-1 rounded shadow-sm flex items-center gap-1 cursor-pointer transition-all active:translate-y-0.5"
                                        title="Click to heal this task"
                                      >
                                        <Activity className="w-3 h-3 text-black animate-pulse" />
                                        <span>Heal</span>
                                      </button>
                                    )}
                                    <span className={`px-2 py-0.5 font-mono font-black text-[10px] rounded shrink-0 ${pColor}`}>
                                      {pct}% Prob
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>



                        {/* Travel-Safe Calendar */}
                        <CalendarPanel 
                          events={calendarEvents} 
                          scheduledSessions={scheduledSessions}
                          onEventCreated={fetchAppData} 
                          isLoading={isLoading} 
                          setIsLoading={setIsLoading} 
                          onShowToast={showToast}
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
                    onShowToast={showToast}
                  />
                )}

                {/* 3. AI RISK INGESTION CHECLIST PLANNER PANEL */}
                {activeTab === 'tasks' && (
                  <TasksPanel 
                    tasks={tasks} 
                    onTaskUpdated={fetchAppData} 
                    isLoading={isLoading} 
                    setIsLoading={setIsLoading} 
                    healedTaskIds={healedTaskIds}
                    onTriggerTaskHeal={triggerTaskHeal}
                    onShowToast={showToast}
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
                    onShowToast={showToast}
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
        <div className="fixed bottom-6 right-6 bg-[#ffe555] border-2 border-black px-4 py-3 rounded flex items-center gap-3 z-50 text-xs font-mono font-bold text-black shadow-sm">
          <RefreshCw className="w-4 h-4 text-black animate-spin" />
          <span>Synchronizing AI Schedules...</span>
        </div>
      )}

      {/* Cheeky Message Modal */}
      <AnimatePresence>
        {cheekyMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCheekyMessage(null)}
              className="absolute inset-0 bg-black/60"
            />
            
            {/* Card */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-[#dfbeff] border-4 border-black rounded-xl max-w-lg w-full p-6 relative z-10 space-y-4 neo-shadow-black text-black"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-white border-2 border-black flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-black animate-bounce" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-extrabold tracking-wider text-black uppercase bg-white px-1.5 py-0.5 border-2 border-black rounded shadow-[1.5px_1.5px_0px_0px_#000000]">Goofy AI</span>
                  <h3 className="text-sm font-black text-black mt-2">A Mild Reality Check</h3>
                  <div className="mt-3 text-xs text-black font-extrabold leading-relaxed">
                    {cheekyMessage}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setCheekyMessage(null)}
                  className="bg-[#b8f598] hover:bg-[#a0e080] text-black border-2 border-black font-mono font-black text-xs px-4 py-2 rounded shadow-xs cursor-pointer transition-all active:translate-y-0.5"
                >
                  I'm on it! Let's be productive &gt;
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3-Second Action Notification Popup Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92, x: "-50%" }}
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
            exit={{ opacity: 0, y: 30, scale: 0.92, x: "-50%" }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-55 bg-[#b8f598] border-4 border-black px-6 py-3.5 rounded shadow-xl flex items-center gap-3.5 font-mono text-xs text-black max-w-sm sm:max-w-md w-full neo-shadow-black"
          >
            <div className="w-3.5 h-3.5 rounded-full bg-black shrink-0 animate-ping" />
            <div className="flex-1">
              <span className="text-[10px] text-black font-black uppercase tracking-wider block font-mono">Action Executed</span>
              <p className="font-extrabold text-black mt-0.5 leading-snug">{toastMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
