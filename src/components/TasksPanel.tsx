import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckSquare, Calendar, AlertTriangle, AlertCircle, CheckCircle, RefreshCcw, Plus, Trash2, ShieldAlert, BadgeInfo, Activity } from 'lucide-react';
import { Task, ImportanceLevel } from '../types';

interface TasksPanelProps {
  tasks: any[];
  onTaskUpdated: () => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  healedTaskIds?: string[];
  onTriggerTaskHeal?: (taskId: string) => void;
  onShowToast?: (msg: string) => void;
}

export function TasksPanel({ 
  tasks, 
  onTaskUpdated, 
  isLoading, 
  setIsLoading,
  healedTaskIds = [],
  onTriggerTaskHeal,
  onShowToast
}: TasksPanelProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('2026-06-26T17:00');
  const [importance, setImportance] = useState<ImportanceLevel>('high');
  const [estimatedEffort, setEstimatedEffort] = useState(6);
  const [category, setCategory] = useState('study');
  const [autoSchedule, setAutoSchedule] = useState(true);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setIsLoading(true);
    onShowToast?.(`Saving new task "${title}" and initiating buffer evaluation...`);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          deadline: new Date(deadline).toISOString(),
          importance,
          estimatedEffort,
          category,
          autoSchedule,
        }),
      });

      if (res.ok) {
        setTitle('');
        setDescription('');
        setShowAddForm(false);
        onShowToast?.(`Successfully created "${title}"${autoSchedule ? ' and autoplan of focus slots arranged!' : '!'}`);
        onTaskUpdated();
      } else {
        onShowToast?.("Failed to register commitment.");
      }
    } catch (err) {
      console.error(err);
      onShowToast?.("Error connecting with study planner server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTaskStatus = async (task: Task) => {
    setIsLoading(true);
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const remaining = newStatus === 'completed' ? 0 : task.estimatedEffort;

    onShowToast?.(`Marking task "${task.title}" as ${newStatus === 'completed' ? 'Completed' : 'Active'}...`);
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, remainingEffort: remaining }),
      });
      onShowToast?.(`"${task.title}" is now ${newStatus === 'completed' ? '✅ Completed' : '⚡ Active'}! Progress logged.`);
      onTaskUpdated();
    } catch (err) {
      console.error(err);
      onShowToast?.("Status toggle request timed out.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerHeal = async (taskId: string) => {
    setIsLoading(true);
    onShowToast?.("Dispatched single-commitment self-healing repair...");
    try {
      await fetch('/api/self-heal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, explicitReason: "Manual trigger to recover missed progress blocks." }),
      });
      onShowToast?.("Schedule repaired! Realloted remaining hours to clear slots.");
      onTaskUpdated();
    } catch (err) {
      console.error(err);
      onShowToast?.("Repair workflow experienced unexpected interruptions.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunRiskAnalysis = async (taskId: string) => {
    setIsLoading(true);
    onShowToast?.("Requesting predictive risk metrics from Gemini...");
    try {
      const res = await fetch(`/api/risk-engine/assess/${taskId}`, { method: 'POST' });
      const parsed = await res.json();
      onShowToast?.(`Gemini Analysis complete. Probability of success updated: ${parsed.probability ?? 85}%`);
      onTaskUpdated();
    } catch (err) {
      console.error(err);
      onShowToast?.("Failure requesting risk review.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task? Associated calendar events and study blocks will also be deleted.")) return;
    setIsLoading(true);
    onShowToast?.("Deleting task and removing calendar deep work slots...");
    try {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      onShowToast?.("Commitment and study slots removed successfully.");
      onTaskUpdated();
      if (selectedTaskId === taskId) setSelectedTaskId(null);
    } catch (err) {
      console.error(err);
      onShowToast?.("Deletion halted due to network failure.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoplanCalendar = async (taskId: string) => {
    setIsLoading(true);
    onShowToast?.("Placing study slots on your calendar dynamically...");
    try {
      const res = await fetch('/api/auto-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });
      const parsed = await res.json();
      if (parsed.success) {
        onShowToast?.("Successfully scheduled deep work study blocks!");
      } else {
        onShowToast?.("Autoplan failed: General blockers have crowded local calendar.");
      }
      onTaskUpdated();
    } catch (err) {
      console.error(err);
      onShowToast?.("Could not reach calendar scheduler engine.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-400" />
            AI Commitment Risk Tracker
          </h2>
          <p className="text-xs text-neutral-400 mt-1 font-medium leading-relaxed">
            Track commitments, assess delivery risk probability, and schedule automated revision buffers.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          disabled={isLoading}
          className="bg-neutral-900 hover:bg-neutral-800 text-neutral-200 font-bold text-xs px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md border border-neutral-750 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-blue-400" />
          Add New Commitment
        </button>
      </div>

      {/* Add Task Dropdown Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-950 to-black border border-neutral-800 rounded-xl shadow-2xl"
          >
            <form onSubmit={handleCreateTask} className="p-5 space-y-4">
              <h3 className="text-xs font-bold font-mono tracking-wider text-blue-450 uppercase">New Commitment Parameters</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-500 font-mono">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Complete ML Assignment"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-neutral-950/80 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-500 font-mono">Deadline</label>
                  <input
                    type="datetime-local"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-neutral-950/80 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-semibold font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-500 font-mono">Description</label>
                <textarea
                  placeholder="Summarize exact goals or final deliverables."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-neutral-950/80 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 h-16 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-500 font-mono">Importance</label>
                  <select
                    value={importance}
                    onChange={(e) => setImportance(e.target.value as ImportanceLevel)}
                    className="w-full bg-neutral-950/80 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-500 font-mono">Effort Needed (hours)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={estimatedEffort}
                    onChange={(e) => setEstimatedEffort(Number(e.target.value))}
                    className="w-full bg-neutral-950/80 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-bold font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-500 font-mono">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-neutral-950/80 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="study">Academic / Study</option>
                    <option value="career">Career / Work</option>
                    <option value="health">Health / Habit</option>
                    <option value="finance">Finance / Bill</option>
                    <option value="general">General Task</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="autoSchedule"
                    checked={autoSchedule}
                    onChange={(e) => setAutoSchedule(e.target.checked)}
                    className="w-4 h-4 text-blue-500 bg-neutral-950 border border-neutral-800 rounded focus:ring-blue-500 accent-blue-500 cursor-pointer"
                  />
                  <label htmlFor="autoSchedule" className="text-xs text-neutral-300 font-semibold cursor-pointer select-none">
                    Autoplan Calendar
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-neutral-750 text-neutral-400 hover:text-white rounded-lg text-xs cursor-pointer hover:bg-neutral-900 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-gradient-to-r from-neutral-200 via-white to-neutral-200 hover:brightness-95 text-black font-bold text-xs px-4 py-2 rounded-lg cursor-pointer shadow-md"
                >
                  Create and Schedule
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main commitments grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left lists block */}
        <div className="lg:col-span-2 space-y-3">
          {tasks.length === 0 ? (
            <div className="p-8 text-center bg-neutral-955 rounded-xl border border-neutral-855 text-neutral-500 shadow-md">
              <CheckSquare className="w-8 h-8 text-neutral-650 mx-auto mb-2" />
              <p className="text-xs font-mono font-medium">No active commitments on track.</p>
            </div>
          ) : (
            tasks.map((task) => {
              const isSelected = selectedTaskId === task.id;
              
              // Determine risk mapping colors
              const rprob = task.risk?.probability ?? 80;
              const rstatus = task.risk?.status ?? 'on_track';

              let probColor = 'text-emerald-400';
              let probBg = 'bg-emerald-950/25 border-emerald-950/50';
              let statusLabel = 'On Track';

              if (rstatus === 'likely_to_miss' || rprob < 40) {
                probColor = 'text-red-400';
                probBg = 'bg-red-955/20 border-red-900/40';
                statusLabel = 'Critical warning';
              } else if (rstatus === 'at_risk' || rprob < 75) {
                probColor = 'text-orange-400';
                probBg = 'bg-orange-955/20 border-orange-900/40';
                statusLabel = 'At Risk';
              }

              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`p-4 rounded-xl border transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-900/60 border-blue-500/40 shadow-md shadow-blue-500/5'
                      : 'bg-gradient-to-br from-[#0c0c0c] to-black border-neutral-850/80 hover:border-neutral-800 shadow-md'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTaskStatus(task);
                        }}
                        className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                          task.status === 'completed'
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'border-neutral-700 hover:border-blue-400 bg-neutral-900'
                        }`}
                      >
                        {task.status === 'completed' && <CheckCircle className="w-3 h-3 text-white" />}
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className={`text-xs font-bold leading-none ${task.status === 'completed' ? 'line-through text-neutral-500 font-medium' : 'text-white'}`}>
                            {task.title}
                          </h3>
                          <span className="text-[9px] bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-neutral-400 font-mono font-bold uppercase">
                            {task.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 line-clamp-1 font-medium">{task.description}</p>
                        
                        <div className="flex items-center gap-3 pt-1 text-[10px] text-neutral-500 font-mono font-medium font-bold">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-blue-450 animate-pulse" />
                            DL: {new Date(task.deadline).toLocaleDateString()} at {new Date(task.deadline).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                          <span>•</span>
                          <span>{task.remainingEffort}h remaining of {task.estimatedEffort}h</span>
                        </div>
                      </div>
                    </div>

                    {/* Completion score badge & Heal trigger if <40% */}
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 select-none">
                      {rprob < 40 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onTriggerTaskHeal) {
                              onTriggerTaskHeal(task.id);
                            } else {
                              handleTriggerHeal(task.id);
                            }
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] uppercase font-mono font-bold px-2.5 py-1.5 rounded-lg shadow-md flex items-center gap-1 cursor-pointer transition-all hover:scale-102"
                          title="Click to recalculate schedule"
                        >
                          <Activity className="w-3.5 h-3.5 text-white animate-pulse" />
                          <span>Heal</span>
                        </button>
                      )}
                      
                      <div className={`p-2 py-1.5 rounded-lg border text-left min-w-[110px] sm:min-w-28 ${probBg}`}>
                        <span className="block text-[8px] font-bold font-mono text-neutral-500 uppercase tracking-tight">{statusLabel}</span>
                        <span className={`text-xs font-bold font-mono tracking-tight ${probColor}`}>
                          {rprob}% Probability
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right side inspect details card */}
        <div className="bg-gradient-to-br from-[#0c0c0c] to-black border border-neutral-850 rounded-xl p-5 h-fit text-neutral-300 shadow-2xl">
          {selectedTaskId ? (
            (() => {
              const task = tasks.find(t => t.id === selectedTaskId);
              if (!task) return <p className="text-xs text-neutral-500 text-center py-12">Commitment removed</p>;

              const isPassed = new Date(task.deadline).getTime() < Date.now();
              const pColor = task.risk?.status === 'on_track' ? 'text-emerald-450' : (task.risk?.status === 'at_risk' ? 'text-orange-400' : 'text-red-400');

              return (
                <div className="space-y-5">
                  {/* Card head */}
                  <div className="border-b border-neutral-805/80 pb-4 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-mono font-bold tracking-wider text-blue-450 uppercase">Selected Commitment</span>
                      <h3 className="text-xs font-bold text-white mt-1 uppercase truncate max-w-[170px]">{task.title}</h3>
                    </div>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-neutral-500 hover:text-red-400 p-1.5 rounded hover:bg-neutral-900 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* AI Prediction block */}
                  <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-900 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between border-b border-neutral-850/80 pb-2">
                      <span className="text-[10px] font-bold font-mono text-blue-400 uppercase flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
                        AI Risk Assessment
                      </span>
                      <button
                        onClick={() => handleRunRiskAnalysis(task.id)}
                        className="text-[10px] text-blue-400 hover:text-blue-350 hover:underline flex items-center gap-1 font-mono font-bold cursor-pointer"
                      >
                        <RefreshCcw className="w-3 h-3" />
                        Re-Eval
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-400 font-mediumCode">Completion Confidence:</span>
                      <span className={`text-base font-extrabold font-mono ${pColor}`}>
                        {task.risk?.probability ?? 80}%
                      </span>
                    </div>

                    <div className="text-[11px] leading-relaxed text-neutral-300 bg-neutral-900/70 p-3 rounded-lg border border-neutral-850 font-medium">
                      {task.risk?.reason ?? "Buffers on tracking systems registered cleanly. AI monitors available spaces to preserve delivery timelines."}
                    </div>
                  </div>

                  {/* Action plans */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-[9px] font-mono tracking-wider font-bold text-neutral-500 uppercase">Dynamic Schedule Operations</h4>
                    
                    <button
                      onClick={() => handleAutoplanCalendar(task.id)}
                      className="w-full bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-neutral-200 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                    >
                      <Calendar className="w-4 h-4 text-blue-400" />
                      Autoplan Study Blocks
                    </button>

                    <button
                      onClick={() => {
                        if (onTriggerTaskHeal) {
                          onTriggerTaskHeal(task.id);
                        } else {
                          handleTriggerHeal(task.id);
                        }
                      }}
                      className="w-full bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-neutral-200 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                    >
                      <RefreshCcw className="w-4 h-4 text-orange-400 animate-spin-slow" />
                      Run Schedule Self-Heal
                    </button>
                  </div>

                  {/* Info specifics */}
                  <div className="border-t border-neutral-805/85 pt-4 grid grid-cols-2 gap-4 text-[10px] font-mono text-neutral-500 font-bold">
                    <div>
                      <span className="text-neutral-500 text-[9px] block font-bold uppercase">Importance Gauge</span>
                      <span className="text-white font-extrabold capitalize mt-0.5 block">{task.importance}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 text-[9px] block font-bold uppercase">Postponed count</span>
                      <span className="text-white font-extrabold mt-0.5 block">{task.postponeCount} times</span>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="text-center py-20 text-neutral-500 space-y-2">
              <BadgeInfo className="w-6 h-6 mx-auto text-neutral-600 animate-pulse" />
              <p className="text-xs font-mono font-medium leading-relaxed">Select a commitment to view detailed risk diagnostics and run autoplan schedule healing operations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
