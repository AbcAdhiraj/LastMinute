import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Target, CheckCircle2, Flame, Plus, RefreshCw, BarChart, ShieldAlert, Award } from 'lucide-react';
import { Goal, Habit } from '../types';
import { apiFetch } from '../utils/api';

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
      const res = await apiFetch('/api/habits', {
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
      const res = await apiFetch('/api/goals', {
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
      const res = await apiFetch(`/api/habits/${id}/toggle`, { method: 'PUT' });
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
      const res = await apiFetch(`/api/goals/${goal.id}`, {
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
      <div className="bg-white border-4 border-black rounded-xl p-5 space-y-4 h-fit neo-shadow-black text-black">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-black stroke-[2.5px] animate-pulse" />
            <h2 className="text-sm font-black text-black uppercase tracking-wide">Habit Consistency</h2>
          </div>
          <button
            onClick={() => setShowAddHabit(!showAddHabit)}
            className="bg-[#dfbeff] hover:bg-[#c99eff] text-black border-2 border-black font-black px-2.5 py-1 rounded flex items-center gap-1 text-xs font-mono cursor-pointer shadow-xs active:translate-y-0.5"
          >
            <Plus className="w-3.5 h-3.5 text-black stroke-[2.5px]" />
            New Habit
          </button>
        </div>

        {/* Create Habit form */}
        {showAddHabit && (
          <form onSubmit={handleCreateHabit} className="bg-white border-2 border-black p-4 rounded-lg space-y-3 neo-shadow-black-sm text-black">
            <h3 className="text-[10px] font-black font-mono tracking-wide text-black bg-[#fff582] px-2 py-0.5 border-2 border-black inline-block uppercase">Create Daily Routine</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <input
                type="text"
                required
                placeholder="E.g., Morning 30m HIIT"
                value={habitTitle}
                onChange={(e) => setHabitTitle(e.target.value)}
                className="bg-white border-2 border-black px-2.5 py-1.5 rounded text-black focus:outline-none font-bold"
              />
              <select
                value={habitCategory}
                onChange={(e) => setHabitCategory(e.target.value)}
                className="bg-white border-2 border-black px-2 py-1.5 rounded text-black focus:outline-none font-bold"
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
                className="px-2.5 py-1 border-2 border-black text-black hover:bg-neutral-50 text-[10px] rounded cursor-pointer font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#b8f598] hover:bg-[#a0e080] text-black border-2 border-black font-black text-[10px] px-3 py-1 rounded cursor-pointer active:translate-y-0.5 shadow-xs"
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
              <div key={habit.id} className="p-3 bg-white rounded-lg border-2 border-black flex items-center justify-between text-xs hover:bg-neutral-50 transition-colors neo-shadow-black-sm text-black">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleHabit(habit.id, habit.title)}
                    className={`w-7 h-7 rounded-full border-2 border-black flex items-center justify-center transition-all cursor-pointer ${
                      isCompletedToday
                        ? 'bg-black text-white'
                        : 'bg-white hover:bg-neutral-100 text-black'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <div>
                    <p className={`font-black text-black ${isCompletedToday ? 'line-through text-black/50 font-bold' : ''}`}>
                      {habit.title}
                    </p>
                    <span className="text-[9px] font-mono text-black/50 uppercase font-bold">{habit.category}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-[#ffa852] text-black px-2.5 py-1 rounded border-2 border-black shadow-xs font-black">
                  <Flame className="w-3.5 h-3.5 text-black animate-pulse" />
                  <span className="font-black font-mono text-[10px]">{habit.streak}d Streak</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Goals checking and prediction card */}
      <div className="bg-white border-4 border-black rounded-xl p-5 space-y-4 neo-shadow-black text-black">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-black stroke-[2.5px]" />
            <h2 className="text-sm font-black text-black uppercase tracking-wide">Milestone Goals</h2>
          </div>
          <button
            onClick={() => setShowAddGoal(!showAddGoal)}
            className="bg-[#dfbeff] hover:bg-[#c99eff] text-black border-2 border-black font-black px-2.5 py-1 rounded flex items-center gap-1 text-xs font-mono cursor-pointer shadow-xs active:translate-y-0.5"
          >
            <Plus className="w-3.5 h-3.5 text-black stroke-[2.5px]" />
            New Goal
          </button>
        </div>

        {/* Create Goal form */}
        {showAddGoal && (
          <form onSubmit={handleCreateGoal} className="bg-white border-2 border-black p-4 rounded-lg space-y-3 neo-shadow-black-sm text-black">
            <h3 className="text-[10px] font-black font-mono tracking-wide text-black bg-[#fff582] px-2 py-0.5 border-2 border-black inline-block uppercase">Define Target Milestone</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <input
                type="text"
                required
                placeholder="E.g., Complete 15 applications"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                className="bg-white border-2 border-black px-2.5 py-1.5 rounded text-black focus:outline-none font-bold"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Target"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(Number(e.target.value))}
                  className="bg-white border-2 border-black px-2 py-1 text-black focus:outline-none font-mono font-bold"
                />
                <input
                  type="text"
                  placeholder="Unit: problems"
                  value={goalUnit}
                  onChange={(e) => setGoalUnit(e.target.value)}
                  className="bg-white border-2 border-black px-2 py-1 text-black focus:outline-none font-bold"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddGoal(false)}
                className="px-2.5 py-1 border-2 border-black text-black hover:bg-neutral-50 text-[10px] rounded cursor-pointer font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#b8f598] hover:bg-[#a0e080] text-black border-2 border-black font-black text-[10px] px-3 py-1 rounded cursor-pointer active:translate-y-0.5 shadow-xs"
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
              <div key={goal.id} className="p-4 bg-white rounded-lg border-2 border-black space-y-3 text-xs neo-shadow-black-sm text-black">
                
                <div className="flex items-start justify-between gap-3 select-none">
                  <div>
                    <h3 className="font-black text-black">{goal.title}</h3>
                    <span className="text-[9px] font-mono font-black text-black/50 uppercase tracking-tight">{goal.category}</span>
                  </div>
                  
                  {/* Plus/Minus touch helpers */}
                  <div className="flex items-center gap-1.5 border-2 border-black rounded bg-white p-0.5 font-mono text-black">
                    <button
                      onClick={() => handleUpdateGoalProgress(goal, goal.currentValue - 1)}
                      className="px-1.5 py-0.5 hover:bg-neutral-100 text-black rounded text-[10px] cursor-pointer font-black"
                    >
                      -
                    </button>
                    <span className="px-1.5 font-black text-black text-[10px]">{goal.currentValue} / {goal.targetValue}</span>
                    <button
                      onClick={() => handleUpdateGoalProgress(goal, goal.currentValue + 1)}
                      className="px-1.5 py-0.5 hover:bg-neutral-100 text-black rounded text-[10px] cursor-pointer font-black"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1 select-none">
                  <div className="w-full bg-neutral-50 rounded-full h-3 overflow-hidden border-2 border-black">
                    <div
                      className="bg-[#b8f598] h-full rounded-full border-r-2 border-black transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(5, ratio))}%` }}
                    />
                  </div>
                  
                  {/* AI prediction overlay */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] font-mono leading-none pt-1 gap-1.5 font-black">
                    <span className="text-black/60">Progress: {Math.round(ratio)}%</span>
                    <span className="flex items-center gap-1 text-black bg-[#ffe555] px-2 py-0.5 border-2 border-black rounded">
                      <Award className="w-3.5 h-3.5 text-black" />
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
