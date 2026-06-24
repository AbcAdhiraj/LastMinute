import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckSquare, Calendar, AlertTriangle, AlertCircle, CheckCircle, RefreshCcw, Plus, Trash2, ShieldAlert, BadgeInfo, Activity } from 'lucide-react';
import { Task, ImportanceLevel } from '../types';
import { apiFetch } from '../utils/api';

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
      const res = await apiFetch('/api/tasks', {
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
      await apiFetch(`/api/tasks/${task.id}`, {
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
      await apiFetch('/api/self-heal', {
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
      const res = await apiFetch(`/api/risk-engine/assess/${taskId}`, { method: 'POST' });
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
      await apiFetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
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
      const res = await apiFetch('/api/auto-schedule', {
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
          <h2 className="text-lg font-black text-black tracking-tight flex items-center gap-2 uppercase">
            <CheckSquare className="w-5 h-5 text-black" />
            AI Commitment Risk Tracker
          </h2>
          <p className="text-xs text-black/70 mt-1 font-bold leading-relaxed">
            Track commitments, assess delivery risk probability, and schedule automated revision buffers.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          disabled={isLoading}
          className="bg-[#98e2ff] hover:bg-[#85d3f0] text-black font-black text-xs px-4 py-2.5 rounded border-2 border-black flex items-center justify-center gap-2 transition-all cursor-pointer neo-shadow-black-sm active:translate-y-0.5 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-black stroke-[2.5px]" />
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
            className="overflow-hidden bg-[#ffffff] border-4 border-black rounded-xl neo-shadow-black"
          >
            <form onSubmit={handleCreateTask} className="p-5 space-y-4">
              <h3 className="text-xs font-black font-mono tracking-wide text-black bg-[#fff582] px-2 py-1 rounded border-2 border-black inline-block uppercase">New Commitment Parameters</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-black font-mono">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Complete ML Assignment"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-white border-2 border-black rounded px-3 py-2 text-xs text-black focus:outline-none font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-black font-mono">Deadline</label>
                  <input
                    type="datetime-local"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-white border-2 border-black rounded px-3 py-2 text-xs text-black focus:outline-none font-bold font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-black font-mono">Description</label>
                <textarea
                  placeholder="Summarize exact goals or final deliverables."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border-2 border-black rounded px-3 py-2 text-xs text-black focus:outline-none h-16 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-black font-mono">Importance</label>
                  <select
                    value={importance}
                    onChange={(e) => setImportance(e.target.value as ImportanceLevel)}
                    className="w-full bg-white border-2 border-black rounded px-3 py-2 text-xs text-black focus:outline-none font-bold"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-black font-mono">Effort Needed (hours)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={estimatedEffort}
                    onChange={(e) => setEstimatedEffort(Number(e.target.value))}
                    className="w-full bg-white border-2 border-black rounded px-3 py-2 text-xs text-black focus:outline-none font-bold font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-black font-mono">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white border-2 border-black rounded px-3 py-2 text-xs text-black focus:outline-none font-bold"
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
                    className="w-4 h-4 text-black bg-white border-2 border-black rounded focus:ring-0 accent-black cursor-pointer"
                  />
                  <label htmlFor="autoSchedule" className="text-xs text-black font-extrabold cursor-pointer select-none">
                    Autoplan Calendar
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border-2 border-black text-black hover:bg-neutral-50 rounded text-xs cursor-pointer font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#b8f598] hover:bg-[#a0e080] text-black font-black text-xs px-4 py-2 rounded border-2 border-black cursor-pointer neo-shadow-black-sm active:translate-y-0.5"
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
            <div className="p-8 text-center bg-white rounded-xl border-4 border-black text-black neo-shadow-black">
              <CheckSquare className="w-8 h-8 text-black mx-auto mb-2" />
              <p className="text-xs font-mono font-bold">No active commitments on track.</p>
            </div>
          ) : (
            tasks.map((task) => {
              const isSelected = selectedTaskId === task.id;
              
              // Determine risk mapping colors
              const rprob = task.risk?.probability ?? 80;
              const rstatus = task.risk?.status ?? 'on_track';

              let probColor = 'text-black';
              let probBg = 'bg-[#b8f598] border-2 border-black';
              let statusLabel = 'On Track';

              if (rstatus === 'likely_to_miss' || rprob < 40) {
                probColor = 'text-black';
                probBg = 'bg-[#ff6161] border-2 border-black';
                statusLabel = 'Critical warning';
              } else if (rstatus === 'at_risk' || rprob < 75) {
                probColor = 'text-black';
                probBg = 'bg-[#ffa852] border-2 border-black';
                statusLabel = 'At Risk';
              }

              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`p-4 rounded-xl border-2 border-black transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-[#fffdd1] border-4 border-black neo-shadow-black'
                      : 'bg-white border-2 border-black hover:bg-neutral-50 neo-shadow-black-sm'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTaskStatus(task);
                        }}
                        className={`mt-0.5 w-5 h-5 rounded border-2 border-black flex items-center justify-center transition-colors cursor-pointer ${
                          task.status === 'completed'
                            ? 'bg-black text-white'
                            : 'bg-white hover:bg-neutral-50'
                        }`}
                      >
                        {task.status === 'completed' && <CheckCircle className="w-3.5 h-3.5 text-[#fff582] fill-[#fff582]/20" />}
                      </button>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className={`text-xs font-black leading-none ${task.status === 'completed' ? 'line-through text-black/50 font-bold' : 'text-black'}`}>
                            {task.title}
                          </h3>
                          <span className="text-[9px] bg-white border border-black px-1.5 py-0.5 rounded text-black font-mono font-black uppercase shadow-sm">
                            {task.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-black/70 line-clamp-1 font-bold">{task.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] text-black/60 font-mono font-bold">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-black animate-pulse" />
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
                          className="bg-[#ffa852] hover:bg-[#ff9a36] text-black text-[10px] uppercase font-mono font-black px-2.5 py-1.5 border-2 border-black rounded shadow-sm flex items-center gap-1 cursor-pointer transition-all active:translate-y-0.5"
                          title="Click to recalculate schedule"
                        >
                          <Activity className="w-3.5 h-3.5 text-black animate-pulse" />
                          <span>Heal</span>
                        </button>
                      )}
                      
                      <div className={`p-2 py-1.5 rounded border-2 border-black text-left min-w-[110px] sm:min-w-28 ${probBg} neo-shadow-black-sm`}>
                        <span className="block text-[8px] font-black font-mono text-black/70 uppercase tracking-tight">{statusLabel}</span>
                        <span className={`text-xs font-black font-mono tracking-tight ${probColor}`}>
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
        <div className="bg-[#ffffff] border-4 border-black rounded-xl p-5 h-fit text-black neo-shadow-black">
          {selectedTaskId ? (
            (() => {
              const task = tasks.find(t => t.id === selectedTaskId);
              if (!task) return <p className="text-xs text-black/50 text-center py-12 font-bold font-mono">Commitment removed</p>;

              const isPassed = new Date(task.deadline).getTime() < Date.now();
              const pColor = task.risk?.status === 'on_track' ? 'text-black font-black' : (task.risk?.status === 'at_risk' ? 'text-black font-black' : 'text-black font-black');
              const pBg = task.risk?.status === 'on_track' ? 'bg-[#b8f598]' : (task.risk?.status === 'at_risk' ? 'bg-[#ffa852]' : 'bg-[#ff6161]');

              return (
                <div className="space-y-5">
                  {/* Card head */}
                  <div className="border-b-2 border-black pb-4 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-mono font-extrabold tracking-wider text-black/60 uppercase">Selected Commitment</span>
                      <h3 className="text-xs font-black text-black mt-1 uppercase truncate max-w-[170px]">{task.title}</h3>
                    </div>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-black/60 hover:text-black p-1.5 rounded border border-black/20 hover:border-black hover:bg-[#ff6161] transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* AI Prediction block */}
                  <div className="bg-[#e4f3a2]/30 p-4 rounded-xl border-2 border-black space-y-3 neo-shadow-black-sm">
                    <div className="flex items-center justify-between border-b-2 border-black/80 pb-2">
                      <span className="text-[10px] font-black font-mono text-black uppercase flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-black" />
                        AI Risk Assessment
                      </span>
                      <button
                        onClick={() => handleRunRiskAnalysis(task.id)}
                        className="text-[10px] text-black hover:underline flex items-center gap-1 font-mono font-black cursor-pointer bg-white px-2 py-0.5 border border-black rounded"
                      >
                        <RefreshCcw className="w-3 h-3" />
                        Re-Eval
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-black/80 font-bold">Completion Confidence:</span>
                      <span className={`text-base font-black font-mono px-2 py-0.5 border-2 border-black rounded shadow-xs ${pBg} ${pColor}`}>
                        {task.risk?.probability ?? 80}%
                      </span>
                    </div>

                    <div className="text-[11px] leading-relaxed text-black bg-white p-3 rounded-lg border-2 border-black font-bold">
                      {task.risk?.reason ?? "Buffers on tracking systems registered cleanly. AI monitors available spaces to preserve delivery timelines."}
                    </div>
                  </div>

                  {/* Action plans */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-[9px] font-mono tracking-wider font-black text-black/60 uppercase">Dynamic Schedule Operations</h4>
                    
                    <button
                      onClick={() => handleAutoplanCalendar(task.id)}
                      className="w-full bg-[#98e2ff] hover:bg-[#85d3f0] border-2 border-black text-black py-2.5 rounded text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer neo-shadow-black-sm active:translate-y-0.5"
                    >
                      <Calendar className="w-4 h-4 text-black" />
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
                      className="w-full bg-[#ffa852] hover:bg-[#ff9a36] border-2 border-black text-black py-2.5 rounded text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer neo-shadow-black-sm active:translate-y-0.5"
                    >
                      <RefreshCcw className="w-4 h-4 text-black" />
                      Run Schedule Self-Heal
                    </button>
                  </div>

                  {/* Info specifics */}
                  <div className="border-t-2 border-black pt-4 grid grid-cols-2 gap-4 text-[10px] font-mono text-black/70 font-black">
                    <div>
                      <span className="text-black/60 text-[9px] block font-black uppercase">Importance Gauge</span>
                      <span className="text-black font-black capitalize mt-0.5 block">{task.importance}</span>
                    </div>
                    <div>
                      <span className="text-black/60 text-[9px] block font-black uppercase">Postponed count</span>
                      <span className="text-black font-black mt-0.5 block">{task.postponeCount} times</span>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="text-center py-20 text-black/50 space-y-2 font-mono">
              <BadgeInfo className="w-6 h-6 mx-auto text-black animate-pulse" />
              <p className="text-xs font-bold leading-relaxed">Select a commitment to view detailed risk diagnostics and run autoplan schedule healing operations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
