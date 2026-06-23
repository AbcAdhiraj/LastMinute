import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Target, CheckCircle2, Flame, Plus, RefreshCw, BarChart, ShieldAlert, Award } from 'lucide-react';
import { Goal, Habit } from '../types';

interface GoalsHabitsPanelProps {
  goals: Goal[];
  habits: Habit[];
  onGoalHabitUpdated: () => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  onShowToast?: (msg: string) => void;
}

export function GoalsHabitsPanel({ goals, habits, onGoalHabitUpdated, isLoading, setIsLoading, onShowToast }: GoalsHabitsPanelProps) {
  const [goalsData, setGoalsData] = useState<Goal[]>(goals);
  const [habitsData, setHabitsData] = useState<Habit[]>(habits);

  // Creator states
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddHabit, setShowAddHabit] = useState(false);

  // Habit Form
  const [habitTitle, setHabitTitle] = useState('');
  const [habitCategory, setHabitCategory] = useState('health');

  // Goal Form
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState(15);
  const [goalUnit, setGoalUnit] = useState('problems');
  const [goalCategory, setGoalCategory] = useState('career');

  useEffect(() => {
    setGoalsData(goals);
    setHabitsData(habits);
  }, [goals, habits]);

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitTitle) return;

    setIsLoading(true);
    onShowToast?.(`Saving routine habit "${habitTitle}"...`);
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: habitTitle, category: habitCategory })
      });
      if (res.ok) {
        setHabitTitle('');
        setShowAddHabit(false);
        onShowToast?.(`Habit "${habitTitle}" is now active in your daily routines list!`);
        onGoalHabitUpdated();
      } else {
        onShowToast?.("Failed to create habit.");
      }
    } catch (err) {
      console.error(err);
      onShowToast?.("Failed to contact habits server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle) return;

    setIsLoading(true);
    onShowToast?.(`Saving milestone goal "${goalTitle}"...`);
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: goalTitle,
          targetValue: goalTarget,
          unit: goalUnit,
          category: goalCategory
        })
      });
      if (res.ok) {
        setGoalTitle('');
        setShowAddGoal(false);
        onShowToast?.(`Milestone goal "${goalTitle}" successfully saved! AI consistency tracking enabled.`);
        onGoalHabitUpdated();
      } else {
        onShowToast?.("Failed to save milestone goal.");
      }
    } catch (err) {
      console.error(err);
      onShowToast?.("Milestone planner encounter connection problem.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleHabit = async (id: string, titleName: string) => {
    onShowToast?.(`Toggling consistency state for routine "${titleName}"...`);
    try {
      const res = await fetch(`/api/habits/${id}/toggle`, { method: 'PUT' });
      if (res.ok) {
        onShowToast?.(`Routine "${titleName}" progress toggled successfully!`);
        onGoalHabitUpdated();
      } else {
        onShowToast?.("Failed to toggle habit routine.");
      }
    } catch (err) {
      console.error(err);
      onShowToast?.("Could not reach habits state controller.");
    }
  };

  const handleUpdateGoalProgress = async (goal: Goal, nextVal: number) => {
    const finalVal = Math.min(goal.targetValue, Math.max(0, nextVal));
    onShowToast?.(`Updating progress of "${goal.title}" to ${finalVal} ${goal.unit}...`);
    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentValue: finalVal })
      });
      if (res.ok) {
        onShowToast?.(`Progress of "${goal.title}" successfully bumped to ${finalVal}/${goal.targetValue}!`);
        onGoalHabitUpdated();
      } else {
        onShowToast?.("Failed to update milestone progress.");
      }
    } catch (err) {
      console.error(err);
      onShowToast?.("Milestone updater experienced an issue.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* Habits tracking card */}
      <div className="bg-gradient-to-br from-[#0c0c0c] to-black border border-neutral-850 rounded-xl p-5 space-y-4 h-fit shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-805/80 pb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-450 fill-orange-500/10 animate-pulse" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Habit Consistency</h2>
          </div>
          <button
            onClick={() => setShowAddHabit(!showAddHabit)}
            className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs font-mono font-bold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            New Habit
          </button>
        </div>

        {/* Create Habit form */}
        {showAddHabit && (
          <form onSubmit={handleCreateHabit} className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg space-y-3 shadow-md">
            <h3 className="text-[10px] font-bold font-mono tracking-wider text-blue-450 uppercase">Create Daily Routine</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <input
                type="text"
                required
                placeholder="E.g., Morning 30m HIIT"
                value={habitTitle}
                onChange={(e) => setHabitTitle(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 px-2.5 py-1.5 rounded text-white focus:outline-none focus:border-blue-500 font-semibold"
              />
              <select
                value={habitCategory}
                onChange={(e) => setHabitCategory(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 px-2 py-1.5 rounded text-neutral-300 focus:outline-none font-semibold"
              >
                <option value="health">Health & Strength</option>
                <option value="study">LeetCode & Study</option>
                <option value="career">Career Progress</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddHabit(false)}
                className="px-2.5 py-1 border border-neutral-750 text-neutral-400 hover:bg-neutral-800 text-[10px] rounded cursor-pointer font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-gradient-to-r from-neutral-200 via-white to-neutral-200 hover:brightness-95 text-black font-extrabold text-[10px] px-3 py-1 rounded cursor-pointer"
              >
                Save Routine
              </button>
            </div>
          </form>
        )}

        {/* Habits list */}
        <div className="space-y-3">
          {habitsData.map((habit) => {
            const today = new Date().toISOString().split('T')[0];
            const isCompletedToday = habit.lastCompleted === today;

            return (
              <div key={habit.id} className="p-3 bg-neutral-950 rounded-lg border border-neutral-855 flex items-center justify-between text-xs hover:bg-neutral-900/40 transition-colors shadow-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleHabit(habit.id, habit.title)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isCompletedToday
                        ? 'bg-emerald-650 border border-emerald-500 text-white'
                        : 'border border-neutral-700 hover:border-blue-400 bg-neutral-900 text-neutral-500'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <div>
                    <p className={`font-bold text-white ${isCompletedToday ? 'line-through text-neutral-500 font-semibold' : ''}`}>
                      {habit.title}
                    </p>
                    <span className="text-[9px] font-mono text-neutral-500 uppercase font-bold">{habit.category}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-neutral-900 px-2.5 py-1 rounded border border-neutral-800 shadow-xs">
                  <Flame className="w-3.5 h-3.5 text-orange-450 animate-pulse" />
                  <span className="font-extrabold text-neutral-300 font-mono text-[10px]">{habit.streak}d Streak</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Goals checking and prediction card */}
      <div className="bg-gradient-to-br from-[#0c0c0c] to-black border border-neutral-850 rounded-xl p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-805/80 pb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-450 fill-blue-550/10" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Milestone Goals</h2>
          </div>
          <button
            onClick={() => setShowAddGoal(!showAddGoal)}
            className="text-blue-405 hover:text-blue-300 flex items-center gap-1 text-xs font-mono font-bold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            New Goal
          </button>
        </div>

        {/* Create Goal form */}
        {showAddGoal && (
          <form onSubmit={handleCreateGoal} className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg space-y-3 shadow-md">
            <h3 className="text-[10px] font-bold font-mono tracking-wider text-blue-450 uppercase">Define Target Milestone</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <input
                type="text"
                required
                placeholder="E.g., Complete 15 applications"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 px-2.5 py-1.5 rounded text-white focus:outline-none focus:border-blue-500 font-semibold"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Target"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(Number(e.target.value))}
                  className="bg-neutral-950 border border-neutral-800 px-2 py-1 text-white focus:outline-none font-mono font-semibold"
                />
                <input
                  type="text"
                  placeholder="Unit: problems"
                  value={goalUnit}
                  onChange={(e) => setGoalUnit(e.target.value)}
                  className="bg-neutral-950 border border-neutral-800 px-2 py-1 text-white focus:outline-none font-semibold"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddGoal(false)}
                className="px-2.5 py-1 border border-neutral-750 text-neutral-400 hover:bg-neutral-800 text-[10px] rounded cursor-pointer font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-gradient-to-r from-neutral-200 via-white to-neutral-200 hover:brightness-95 text-black font-extrabold text-[10px] px-3 py-1 rounded cursor-pointer"
              >
                Save Milestone
              </button>
            </div>
          </form>
        )}

        {/* Goals list */}
        <div className="space-y-4">
          {goalsData.map((goal) => {
            const ratio = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0;
            const pred = goal.completionPrediction;

            return (
              <div key={goal.id} className="p-4 bg-neutral-950 rounded-lg border border-neutral-855 space-y-3 text-xs shadow-md">
                
                <div className="flex items-start justify-between gap-3 select-none">
                  <div>
                    <h3 className="font-bold text-white">{goal.title}</h3>
                    <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-tight">{goal.category}</span>
                  </div>
                  
                  {/* Plus/Minus touch helpers */}
                  <div className="flex items-center gap-1.5 border border-neutral-800 rounded bg-neutral-900 p-0.5 font-mono text-neutral-300">
                    <button
                      onClick={() => handleUpdateGoalProgress(goal, goal.currentValue - 1)}
                      className="px-1.5 py-0.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded text-[10px] cursor-pointer font-extrabold"
                    >
                      -
                    </button>
                    <span className="px-1.5 font-extrabold text-white text-[10px]">{goal.currentValue} / {goal.targetValue}</span>
                    <button
                      onClick={() => handleUpdateGoalProgress(goal, goal.currentValue + 1)}
                      className="px-1.5 py-0.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded text-[10px] cursor-pointer font-extrabold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1 select-none">
                  <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden border border-neutral-800">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-410 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(5, ratio))}%` }}
                    />
                  </div>
                  
                  {/* AI prediction overlay */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] font-mono leading-none pt-1 gap-1.5 font-bold">
                    <span className="text-neutral-500">Progress: {Math.round(ratio)}%</span>
                    <span className="flex items-center gap-1 text-orange-400">
                      <Award className="w-3.5 h-3.5 text-orange-400" />
                      AI Prediction: {pred}% Completion probability
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}
