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
}

export function GoalsHabitsPanel({ goals, habits, onGoalHabitUpdated, isLoading, setIsLoading }: GoalsHabitsPanelProps) {
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
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: habitTitle, category: habitCategory })
      });
      if (res.ok) {
        setHabitTitle('');
        setShowAddHabit(false);
        onGoalHabitUpdated();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle) return;

    setIsLoading(true);
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
        onGoalHabitUpdated();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleHabit = async (id: string) => {
    try {
      const res = await fetch(`/api/habits/${id}/toggle`, { method: 'PUT' });
      if (res.ok) {
        onGoalHabitUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateGoalProgress = async (id: string, currentVal: number, targetVal: number) => {
    const nextVal = Math.min(targetVal, Math.max(0, currentVal));
    try {
      await fetch(`/api/goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentValue: nextVal })
      });
      onGoalHabitUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* Habits tracking card */}
      <div className="bg-white border border-stone-200/85 rounded-xl p-5 space-y-4 h-fit shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-200/60 pb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500 fill-orange-500/10" />
            <h2 className="text-sm font-bold text-stone-850 uppercase tracking-wider">Habit Consistency</h2>
          </div>
          <button
            onClick={() => setShowAddHabit(!showAddHabit)}
            className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-xs font-mono font-bold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New Habit
          </button>
        </div>

        {/* Create Habit form */}
        {showAddHabit && (
          <form onSubmit={handleCreateHabit} className="bg-stone-50 border border-stone-200 p-4 rounded-lg space-y-3 shadow-xs">
            <h3 className="text-[10px] font-bold font-mono tracking-wider text-indigo-700 uppercase">Create Daily Routine</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <input
                type="text"
                required
                placeholder="E.g., Morning 30m HIIT"
                value={habitTitle}
                onChange={(e) => setHabitTitle(e.target.value)}
                className="bg-white border border-stone-205 px-2.5 py-1.5 rounded text-stone-800 focus:outline-none focus:border-indigo-500 font-semibold"
              />
              <select
                value={habitCategory}
                onChange={(e) => setHabitCategory(e.target.value)}
                className="bg-white border border-stone-200 px-2 py-1.5 rounded text-stone-800 focus:outline-none font-semibold"
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
                className="px-2.5 py-1 border border-stone-200 text-stone-500 hover:bg-stone-100 text-[10px] rounded cursor-pointer font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3 py-1 rounded cursor-pointer"
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
              <div key={habit.id} className="p-3 bg-white rounded-lg border border-stone-200/80 flex items-center justify-between text-xs hover:bg-stone-50/50 transition-colors shadow-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleHabit(habit.id)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isCompletedToday
                        ? 'bg-emerald-650 border border-emerald-500 text-white'
                        : 'border border-stone-300 hover:border-indigo-500 bg-white text-stone-400'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <div>
                    <p className={`font-bold text-stone-800 ${isCompletedToday ? 'line-through text-stone-400 font-semibold' : ''}`}>
                      {habit.title}
                    </p>
                    <span className="text-[9px] font-mono text-stone-450 uppercase font-bold">{habit.category}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-stone-50 px-2.5 py-1 rounded border border-stone-200 shadow-xs">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span className="font-extrabold text-stone-700 font-mono text-[10px]">{habit.streak}d Streak</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Goals checking and prediction card */}
      <div className="bg-white border border-stone-200/85 rounded-xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-200/60 pb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600 fill-indigo-500/10" />
            <h2 className="text-sm font-bold text-stone-850 uppercase tracking-wider">Milestone Goals</h2>
          </div>
          <button
            onClick={() => setShowAddGoal(!showAddGoal)}
            className="text-indigo-600 hover:text-indigo-805 flex items-center gap-1 text-xs font-mono font-bold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New Goal
          </button>
        </div>

        {/* Create Goal form */}
        {showAddGoal && (
          <form onSubmit={handleCreateGoal} className="bg-stone-50 border border-stone-200 p-4 rounded-lg space-y-3 shadow-xs">
            <h3 className="text-[10px] font-bold font-mono tracking-wider text-indigo-700 uppercase">Define Target Milestone</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <input
                type="text"
                required
                placeholder="E.g., Complete 15 applications"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                className="bg-white border border-stone-200 px-2.5 py-1.5 rounded text-stone-800 focus:outline-none focus:border-indigo-500 font-semibold"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Target"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(Number(e.target.value))}
                  className="bg-white border border-stone-205 px-2 py-1 text-stone-800 focus:outline-none font-mono font-semibold"
                />
                <input
                  type="text"
                  placeholder="Unit: problems"
                  value={goalUnit}
                  onChange={(e) => setGoalUnit(e.target.value)}
                  className="bg-white border border-stone-205 px-2 py-1 text-stone-800 focus:outline-none font-semibold"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddGoal(false)}
                className="px-2.5 py-1 border border-stone-200 text-stone-500 hover:bg-stone-100 text-[10px] rounded cursor-pointer font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3 py-1 rounded cursor-pointer"
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
              <div key={goal.id} className="p-4 bg-white rounded-lg border border-stone-200/80 space-y-3 text-xs shadow-xs">
                
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-stone-800">{goal.title}</h3>
                    <span className="text-[9px] font-mono font-bold text-stone-400 uppercase tracking-tight">{goal.category}</span>
                  </div>
                  
                  {/* Plus/Minus touch helpers */}
                  <div className="flex items-center gap-1.5 border border-stone-200 rounded bg-stone-50 p-0.5 font-mono">
                    <button
                      onClick={() => handleUpdateGoalProgress(goal.id, goal.currentValue - 1, goal.targetValue)}
                      className="px-1.5 py-0.5 hover:bg-stone-100 text-stone-600 hover:text-stone-900 rounded text-[10px] cursor-pointer font-extrabold"
                    >
                      -
                    </button>
                    <span className="px-1.5 font-extrabold text-stone-850 text-[10px]">{goal.currentValue} / {goal.targetValue}</span>
                    <button
                      onClick={() => handleUpdateGoalProgress(goal.id, goal.currentValue + 1, goal.targetValue)}
                      className="px-1.5 py-0.5 hover:bg-stone-100 text-stone-600 hover:text-stone-900 rounded text-[10px] cursor-pointer font-extrabold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden border border-stone-200/40">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(5, ratio))}%` }}
                    />
                  </div>
                  
                  {/* AI prediction overlay */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] font-mono leading-none pt-1 gap-1.5">
                    <span className="text-stone-450 font-bold">Progress: {Math.round(ratio)}%</span>
                    <span className="flex items-center gap-1 text-emerald-700 font-bold">
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
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
