import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckSquare, Calendar, AlertTriangle, AlertCircle, CheckCircle, RefreshCcw, Plus, Trash2, ShieldAlert, BadgeInfo } from 'lucide-react';
import { Task, ImportanceLevel } from '../types';

interface TasksPanelProps {
  tasks: any[];
  onTaskUpdated: () => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
}

export function TasksPanel({ tasks, onTaskUpdated, isLoading, setIsLoading }: TasksPanelProps) {
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
        onTaskUpdated();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTaskStatus = async (task: Task) => {
    setIsLoading(true);
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const remaining = newStatus === 'completed' ? 0 : task.estimatedEffort;

    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, remainingEffort: remaining }),
      });
      onTaskUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerHeal = async (taskId: string) => {
    setIsLoading(true);
    try {
      await fetch('/api/self-heal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, explicitReason: "Manual trigger to recover missed progress blocks." }),
      });
      onTaskUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunRiskAnalysis = async (taskId: string) => {
    setIsLoading(true);
    try {
      await fetch(`/api/risk-engine/assess/${taskId}`, { method: 'POST' });
      onTaskUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task? Associated calendar events and study blocks will also be deleted.")) return;
    setIsLoading(true);
    try {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      onTaskUpdated();
      if (selectedTaskId === taskId) setSelectedTaskId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoplanCalendar = async (taskId: string) => {
    setIsLoading(true);
    try {
      await fetch('/api/auto-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });
      onTaskUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-stone-850 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-600" />
            AI Commitment Risk Tracker
          </h2>
          <p className="text-xs text-stone-500 mt-1 font-medium">
            Track commitments, analyze delivery risk probability, and schedule automated revision buffers.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          disabled={isLoading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm border border-indigo-650 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-indigo-100" />
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
            className="overflow-hidden bg-white border border-stone-250/80 rounded-xl shadow-md"
          >
            <form onSubmit={handleCreateTask} className="p-5 space-y-4">
              <h3 className="text-xs font-bold font-mono tracking-wider text-indigo-700 uppercase">New Commitment Parameters</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-stone-400 font-mono">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Complete ML Assignment"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-stone-400 font-mono">Deadline</label>
                  <input
                    type="datetime-local"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-indigo-500 font-semibold font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-stone-400 font-mono">Description</label>
                <textarea
                  placeholder="Summarize exact goals or final deliverables."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-indigo-500 h-16 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-stone-400 font-mono">Importance</label>
                  <select
                    value={importance}
                    onChange={(e) => setImportance(e.target.value as ImportanceLevel)}
                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-850 focus:outline-none focus:border-indigo-500 font-semibold"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-stone-400 font-mono">Effort Needed (hours)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={estimatedEffort}
                    onChange={(e) => setEstimatedEffort(Number(e.target.value))}
                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-indigo-500 font-bold font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-stone-400 font-mono">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-850 focus:outline-none focus:border-indigo-500 font-semibold"
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
                    className="w-4 h-4 text-indigo-600 bg-white border border-stone-300 rounded focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                  />
                  <label htmlFor="autoSchedule" className="text-xs text-stone-600 font-semibold cursor-pointer">
                    Autoplan Calendar
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-500 hover:text-stone-800 rounded-lg text-xs cursor-pointer hover:bg-stone-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer border border-indigo-650 shadow-sm"
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
            <div className="p-8 text-center bg-white rounded-xl border border-stone-200/80 text-stone-400 shadow-sm">
              <CheckSquare className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="text-xs font-mono font-medium">No active commitments on track.</p>
            </div>
          ) : (
            tasks.map((task) => {
              const isSelected = selectedTaskId === task.id;
              
              // Determine risk mapping colors
              const rprob = task.risk?.probability ?? 80;
              const rstatus = task.risk?.status ?? 'on_track';

              let probColor = 'text-emerald-700';
              let probBg = 'bg-emerald-50 border-emerald-150';
              let statusLabel = 'On Track';

              if (rstatus === 'likely_to_miss' || rprob < 40) {
                probColor = 'text-rose-750';
                probBg = 'bg-rose-50 border-rose-150';
                statusLabel = 'Critical warning';
              } else if (rstatus === 'at_risk' || rprob < 75) {
                probColor = 'text-amber-750';
                probBg = 'bg-amber-50 border-amber-150';
                statusLabel = 'At Risk';
              }

              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`p-4 rounded-xl border transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/50 border-indigo-300 shadow-sm shadow-indigo-100/30'
                      : 'bg-white border-stone-200/80 hover:border-stone-300'
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
                            : 'border-stone-300 hover:border-indigo-400 bg-white'
                        }`}
                      >
                        {task.status === 'completed' && <CheckCircle className="w-3 h-3 text-white" />}
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className={`text-xs font-bold leading-none ${task.status === 'completed' ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                            {task.title}
                          </h3>
                          <span className="text-[9px] bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded text-stone-500 font-mono font-bold uppercase">
                            {task.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 line-clamp-1 font-medium">{task.description}</p>
                        
                        <div className="flex items-center gap-3 pt-1 text-[10px] text-stone-400 font-mono font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-indigo-500" />
                            DL: {new Date(task.deadline).toLocaleDateString()} at {new Date(task.deadline).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                          <span>•</span>
                          <span>{task.remainingEffort}h remaining of {task.estimatedEffort}h</span>
                        </div>
                      </div>
                    </div>

                    {/* Completion score badge */}
                    <div className={`p-2 py-1.5 rounded-lg border text-left min-w-[120px] sm:min-w-28 ${probBg} self-start sm:self-auto`}>
                      <span className="block text-[8px] font-bold font-mono text-stone-400 uppercase tracking-tight">{statusLabel}</span>
                      <span className={`text-xs font-bold font-mono tracking-tight ${probColor}`}>
                        {rprob}% Probability
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right side inspect details card */}
        <div className="bg-white border border-stone-200/80 rounded-xl p-5 h-fit text-stone-605 shadow-sm">
          {selectedTaskId ? (
            (() => {
              const task = tasks.find(t => t.id === selectedTaskId);
              if (!task) return <p className="text-xs text-stone-400 text-center py-12">Commitment removed</p>;

              const isPassed = new Date(task.deadline).getTime() < Date.now();
              const pColor = task.risk?.status === 'on_track' ? 'text-emerald-600' : (task.risk?.status === 'at_risk' ? 'text-amber-600' : 'text-rose-600');

              return (
                <div className="space-y-5">
                  {/* Card head */}
                  <div className="border-b border-stone-200/60 pb-4 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-mono font-bold tracking-wider text-indigo-705 uppercase">Selected Commitment</span>
                      <h3 className="text-xs font-bold text-stone-850 mt-1 uppercase truncate max-w-[170px]">{task.title}</h3>
                    </div>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-stone-400 hover:text-rose-600 p-1.5 rounded hover:bg-stone-50 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* AI Prediction block */}
                  <div className="bg-stone-50/50 p-4 rounded-xl border border-stone-200/80 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-stone-200/40 pb-2">
                      <span className="text-[10px] font-bold font-mono text-indigo-700 uppercase flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-indigo-500" />
                        AI Risk Assessment
                      </span>
                      <button
                        onClick={() => handleRunRiskAnalysis(task.id)}
                        className="text-[10px] text-indigo-650 hover:text-indigo-800 hover:underline flex items-center gap-1 font-mono font-bold cursor-pointer"
                      >
                        <RefreshCcw className="w-3 h-3" />
                        Re-Eval
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-stone-500 font-medium">Completion Confidence:</span>
                      <span className={`text-base font-extrabold font-mono ${pColor}`}>
                        {task.risk?.probability ?? 80}%
                      </span>
                    </div>

                    <div className="text-[11px] leading-relaxed text-stone-600 bg-white p-3 rounded-lg border border-stone-150 font-medium">
                      {task.risk?.reason ?? "Buffers on tracking systems registered cleanly. AI monitors available spaces to preserve delivery timelines."}
                    </div>
                  </div>

                  {/* Action plans */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-[9px] font-mono tracking-wider font-bold text-stone-400 uppercase">Dynamic Schedule Operations</h4>
                    
                    <button
                      onClick={() => handleAutoplanCalendar(task.id)}
                      className="w-full bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                    >
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      Autoplan Study Blocks
                    </button>

                    <button
                      onClick={() => handleTriggerHeal(task.id)}
                      className="w-full bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                    >
                      <RefreshCcw className="w-4 h-4 text-emerald-500 animate-spin-slow" />
                      Run Schedule Self-Heal
                    </button>
                  </div>

                  {/* Info specifics */}
                  <div className="border-t border-stone-200/60 pt-4 grid grid-cols-2 gap-4 text-[10px] font-mono text-stone-500 font-bold">
                    <div>
                      <span className="text-stone-400 text-[9px] block font-bold uppercase">Importance Gauge</span>
                      <span className="text-stone-850 font-extrabold capitalize mt-0.5 block">{task.importance}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[9px] block font-bold uppercase">Postponed count</span>
                      <span className="text-stone-850 font-extrabold mt-0.5 block">{task.postponeCount} times</span>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="text-center py-20 text-stone-400 space-y-2">
              <BadgeInfo className="w-6 h-6 mx-auto text-stone-300 animate-pulse" />
              <p className="text-xs font-mono font-medium">Select a commitment to view detailed risk diagnostics and run autoplan schedule healing operations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
