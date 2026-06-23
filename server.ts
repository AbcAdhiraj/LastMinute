import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { readDb, writeDb, updateDb } from './src/server/db';
import { AppDatabase, Task, Goal, Habit, CalendarEvent, ScheduledSession, GmailCommitment, Notification, RiskAssessment, RescheduleLog, Analytics } from './src/types';

// Load environmental variables
dotenv.config();

// Initialize express app
const app = express();
app.use(express.json({ limit: '10mb' }));

const PORT = 3000;

// Lazy initialize Gemini client to prevent crash if key is loaded later or missing
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    aiClient = new GoogleGenAI({
      apiKey: key || 'MOCK_KEY_DEV_FALLBACK',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Check if Gemini key is available for server logs
console.log("Gemini API Key Available:", !!process.env.GEMINI_API_KEY);

// Helper to structure error responses
const handleError = (res: Response, err: unknown, msg: string) => {
  console.error(msg, err);
  res.status(500).json({ error: msg, details: err instanceof Error ? err.message : String(err) });
};

// Helper to calculate relative dates from "now" (2026-06-22)
function getRelativeDate(days: number, hourStr: string = "00:00"): string {
  const baseDate = new Date("2026-06-22T00:00:00-07:00");
  const targetDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
  const [hours, minutes] = hourStr.split(':').map(Number);
  targetDate.setHours(hours);
  targetDate.setMinutes(minutes);
  return targetDate.toISOString();
}

// ==========================================
// 1. ANALYTICS ENGINE HELPER
// ==========================================
function calculateAnalyticsModel(db: any): Analytics {
  const completed = db.tasks.filter((t: Task) => t.status === 'completed').length;
  const missed = db.tasks.filter((t: Task) => t.status === 'missed').length;
  const pending = db.tasks.filter((t: Task) => t.status === 'pending' || t.status === 'in_progress').length;
  const total = completed + missed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Deep work is the sum of completed and scheduled deep work sessions
  const workSessions = db.scheduledSessions || [];
  const completedDeepWorkHours = workSessions
    .filter((s: ScheduledSession) => s.status === 'completed')
    .reduce((sum: number, s: ScheduledSession) => sum + s.duration, 0);

  const scheduledDeepWorkHours = workSessions
    .filter((s: ScheduledSession) => s.status === 'scheduled')
    .reduce((sum: number, s: ScheduledSession) => sum + s.duration, 0);

  const deepWorkHours = completedDeepWorkHours + scheduledDeepWorkHours;

  // Meeting time based on calendarEvents of status meeting
  const meetings = db.calendarEvents.filter((e: CalendarEvent) => e.category === 'meeting');
  const meetingMins = meetings.reduce((sum: number, e: CalendarEvent) => {
    const start = new Date(e.start).getTime();
    const end = new Date(e.end).getTime();
    return sum + (end - start) / (1000 * 60);
  }, 0);

  // Goal average progress calculation
  const goals = db.goals || [];
  const totalGoalProgress = goals.reduce((sum: number, g: Goal) => {
    const prog = g.targetValue > 0 ? (g.currentValue / g.targetValue) * 100 : 0;
    return sum + prog;
  }, 0);
  const goalAvgProgress = goals.length > 0 ? Math.round(totalGoalProgress / goals.length) : 0;

  // Category task distributions
  const categoryBreakdown: { [category: string]: number } = {};
  db.tasks.forEach((t: Task) => {
    categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + 1;
  });

  // Productivity Score Calculation
  // 40% Completion Rate, 30% Habit Consistency, 20% Focus Time, 10% Risk Mitigation
  const weeklyHabits = db.habits || [];
  const completedHabitsCount = weeklyHabits.filter((h: Habit) => h.streak > 0).length;
  const habitConsistency = weeklyHabits.length > 0 ? (completedHabitsCount / weeklyHabits.length) * 100 : 50;

  const onTrackAssessments = db.riskAssessments.filter((r: RiskAssessment) => r.status === 'on_track').length;
  const totalAssessments = db.riskAssessments.length;
  const onTrackRatio = totalAssessments > 0 ? (onTrackAssessments / totalAssessments) * 100 : 70;

  const rawScore = (completionRate * 0.45) + (habitConsistency * 0.25) + (onTrackRatio * 0.3);
  const productivityScore = Math.max(30, Math.min(100, Math.round(rawScore || 78)));

  const hourlyProductivity = [
    { hour: "08:00", score: 40 },
    { hour: "10:00", score: 85 },
    { hour: "12:00", score: 60 },
    { hour: "14:00", score: 70 },
    { hour: "16:00", score: 55 },
    { hour: "18:00", score: 80 },
    { hour: "20:00", score: 95 },
    { hour: "22:00", score: 75 }
  ];

  const weeklyTrends = [
    { week: "Mon", completed: 3, missed: 0, deepWork: 4 },
    { week: "Tue", completed: 2, missed: 1, deepWork: 2 },
    { week: "Wed", completed: 4, missed: 0, deepWork: 6 },
    { week: "Thu", completed: 1, missed: 0, deepWork: 3 },
    { week: "Fri", completed: 5, missed: 1, deepWork: 5 },
    { week: "Sat", completed: 2, missed: 0, deepWork: 2 },
    { week: "Sun", completed: 1, missed: 0, deepWork: 1 }
  ];

  return {
    completedTasks: completed,
    missedTasks: missed,
    completionRate,
    deepWorkHours,
    focusTime: deepWorkHours * 60,
    meetingTime: meetingMins,
    productivityScore,
    goalProgress: goalAvgProgress,
    categoryBreakdown,
    weeklyTrends,
    hourlyProductivity
  };
}

// ==========================================
// 2. BACKEND SOLVER FOR SCHEDULING INTERVALLING
// ==========================================
/**
 * Find empty blocks for scheduling on the calendar.
 * Looking for 1 or 2-hour slots during 09:00 - 21:00 over the next 7 days, excluding overlaps.
 */
function findFreeBlocks(db: AppDatabase, hoursNeeded: number): { start: string; end: string }[] {
  const blocks: { start: string; end: string }[] = [];
  const now = new Date("2026-06-22T11:00:00-07:00"); // Standard mock session current time

  // Build list of existing blocker segments. Combine calendar events with scheduled sessions.
  const blockers: { start: number; end: number }[] = [];
  
  db.calendarEvents.forEach(e => {
    // Add commute time as well
    const startMs = new Date(e.start).getTime() - (e.travelTime || 0) * 60 * 1000;
    const endMs = new Date(e.end).getTime();
    blockers.push({ start: startMs, end: endMs });
  });

  db.scheduledSessions.forEach(s => {
    if (s.status === 'scheduled' || s.status === 'completed') {
      blockers.push({ start: new Date(s.start).getTime(), end: new Date(s.end).getTime() });
    }
  });

  // Scan next 7 days
  let durationLeft = hoursNeeded;
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    if (durationLeft <= 0) break;

    const testDay = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    // Working hours: 09:00 to 20:00
    const startHour = dayOffset === 0 ? Math.max(9, now.getHours() + 1) : 9;
    
    for (let h = startHour; h < 20; h++) {
      if (durationLeft <= 0) break;

      const blockStart = new Date(testDay);
      blockStart.setHours(h, 0, 0, 0);
      const blockEnd = new Date(testDay);
      blockEnd.setHours(h + 2, 0, 0, 0); // try 2-hour slots

      const startMs = blockStart.getTime();
      const endMs = blockEnd.getTime();

      // Check if this slot overlaps with any blockers
      const hasOverlap = blockers.some(b => {
        return (startMs < b.end && endMs > b.start);
      });

      if (!hasOverlap) {
        blocks.push({
          start: blockStart.toISOString(),
          end: blockEnd.toISOString()
        });
        durationLeft -= 2;
        // Add this dynamic block to blockers list as we go
        blockers.push({ start: startMs, end: endMs });
      }
    }
  }

  return blocks;
}

/**
 * Dynamically re-allocates study sessions for all active tasks (pipeline).
 * Sorts them by urgency/importance and re-schedules focus blocks sequentially.
 */
function triggerGlobalRescheduling(): void {
  updateDb((db) => {
    // 1. Clear all of our current study (deep work) blocks that are scheduled (non-completed)
    db.scheduledSessions = db.scheduledSessions.filter(s => s.status !== 'scheduled');
    db.calendarEvents = db.calendarEvents.filter(e => e.category !== 'deep_work');

    // 2. Map weight to importance levels: critical (4) > high (3) > medium (2) > low (1)
    const getImportanceWeight = (imp?: string) => {
      if (imp === 'critical') return 4;
      if (imp === 'high') return 3;
      if (imp === 'medium') return 2;
      return 1;
    };

    // 3. Obtain active, non-completed tasks
    const activeTasks = db.tasks.filter(t => t.status !== 'completed' && t.status !== 'missed');
    
    // 4. Sort tasks by importance descending, and then by deadline ascending
    activeTasks.sort((a, b) => {
      const weightA = getImportanceWeight(a.importance);
      const weightB = getImportanceWeight(b.importance);
      if (weightA !== weightB) {
        return weightB - weightA;
      }
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

    // 5. Successively schedule free study slots for each active task
    activeTasks.forEach(task => {
      const remaining = task.remainingEffort;
      if (remaining <= 0) return;

      // Note: findFreeBlocks evaluates blockers using the live db parameter
      const blocks = findFreeBlocks(db, remaining);
      const sessionsForTask = blocks.map((b, idx) => ({
        id: `sess_dyn_${task.id}_${Date.now()}_${idx}`,
        taskId: task.id,
        taskTitle: task.title,
        start: b.start,
        end: b.end,
        duration: 2,
        status: 'scheduled' as const
      }));

      const eventsForTask = sessionsForTask.map(s => ({
        id: `evt_${s.id}`,
        title: `Study: ${task.title}`,
        start: s.start,
        end: s.end,
        category: 'deep_work' as const,
        taskId: task.id
      }));

      db.scheduledSessions.push(...sessionsForTask);
      db.calendarEvents.push(...eventsForTask);
    });

    // 6. Record a notification trace
    db.notifications.unshift({
      id: "notif_dyn_" + Math.random().toString(36).substr(2, 9),
      title: "Pipeline Recalculated Automatically",
      message: `System dynamically reorganized focus buffers for ${activeTasks.length} active tasks across your week to assure optimal coverage.`,
      type: 'schedule_change',
      timestamp: new Date().toISOString(),
      read: false
    });
  });
}

// ==========================================
// 3. API ENDPOINTS
// ==========================================

// GET Profile and Dashboard Analytics
app.get('/api/profile', (req: Request, res: Response) => {
  try {
    const db = readDb();
    const analytics = calculateAnalyticsModel(db);
    const tasksWithRisk = db.tasks.map(t => {
      const risk = db.riskAssessments.find(r => r.taskId === t.id);
      return {
        ...t,
        risk: risk || {
          taskId: t.id,
          probability: 80,
          status: 'on_track' as const,
          reason: "Estimated workload is low relative to remaining duration.",
          calculatedAt: new Date().toISOString()
        }
      };
    });
    res.json({
      userProfile: db.userProfile,
      analytics,
      recentNotifications: db.notifications.slice(0, 5),
      tasks: tasksWithRisk,
      goals: db.goals,
      habits: db.habits
    });
  } catch (err) {
    handleError(res, err, "Failed to get profile data");
  }
});

// GET all Tasks
app.get('/api/tasks', (req: Request, res: Response) => {
  try {
    const db = readDb();
    const tasksWithRisk = db.tasks.map(t => {
      const risk = db.riskAssessments.find(r => r.taskId === t.id);
      return {
        ...t,
        risk: risk || {
          taskId: t.id,
          probability: 80,
          status: 'on_track' as const,
          reason: "Estimated workload is low relative to remaining duration.",
          calculatedAt: new Date().toISOString()
        }
      };
    });
    res.json(tasksWithRisk);
  } catch (err) {
    handleError(res, err, "Failed to fetch tasks");
  }
});

// POST Create new Task
app.post('/api/tasks', async (req: Request, res: Response) => {
  try {
    const { title, description, deadline, importance, estimatedEffort, category, autoSchedule } = req.body;
    
    if (!title || !deadline || !estimatedEffort) {
      return res.status(400).json({ error: "Missing required fields: title, deadline, and estimatedEffort are mandatory." });
    }

    const newTask: Task = {
      id: "task_" + Math.random().toString(36).substr(2, 9),
      title,
      description: description || "",
      deadline,
      importance: importance || "medium",
      estimatedEffort: Number(estimatedEffort),
      remainingEffort: Number(estimatedEffort),
      category: category || "general",
      status: "pending",
      postponeCount: 0,
      createdAt: new Date().toISOString()
    };

    const newRisk: RiskAssessment = {
      taskId: newTask.id,
      probability: 90,
      status: 'on_track',
      reason: "Task newly created. Awaiting scheduled study buffers to confirm safety.",
      calculatedAt: new Date().toISOString()
    };

    updateDb((db) => {
      db.tasks.unshift(newTask);
      db.riskAssessments.push(newRisk);
    });

    // If auto-schedule is requested, trigger session distribution!
    if (autoSchedule) {
      triggerGlobalRescheduling();
    }

    // Trigger AI Risk re-evaluation in background if key is present
    try {
      if (process.env.GEMINI_API_KEY) {
        await evalSingleTaskRisk(newTask.id);
      }
    } catch (riskErr) {
      console.warn("Background AI Risk assessment failed (non-blocking):", riskErr);
    }

    res.status(201).json({ task: newTask, risk: newRisk, autoScheduled: !!autoSchedule });
  } catch (err) {
    handleError(res, err, "Failed to create task");
  }
});

// PUT Update Task
app.put('/api/tasks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const bodyUpdates = req.body;

    let updatedTask: Task | null = null;

    updateDb((db) => {
      const idx = db.tasks.findIndex(t => t.id === id);
      if (idx !== -1) {
        db.tasks[idx] = { ...db.tasks[idx], ...bodyUpdates };
        updatedTask = db.tasks[idx];

        // Also update taskTitle inside any scheduled sessions
        if (bodyUpdates.title) {
          db.scheduledSessions.forEach(s => {
            if (s.taskId === id) {
              s.taskTitle = bodyUpdates.title;
            }
          });
          db.calendarEvents.forEach(e => {
            if (e.taskId === id && e.category === 'deep_work') {
              e.title = `Study: ${bodyUpdates.title}`;
            }
          });
        }
      }
    });

    if (!updatedTask) {
      return res.status(404).json({ error: "Task not found." });
    }

    // Trigger update parameters in background AI evaluation
    if (process.env.GEMINI_API_KEY) {
      try {
        await evalSingleTaskRisk(id);
      } catch (e) {
        console.warn("API AI Risk assessment failed (non-blocking)", e);
      }
    }

    res.json(updatedTask);
  } catch (err) {
    handleError(res, err, "Failed to update task");
  }
});

// DELETE Task
app.delete('/api/tasks/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let found = false;

    updateDb((db) => {
      const startLen = db.tasks.length;
      db.tasks = db.tasks.filter(t => t.id !== id);
      db.scheduledSessions = db.scheduledSessions.filter(s => s.taskId !== id);
      db.calendarEvents = db.calendarEvents.filter(e => e.taskId !== id);
      db.riskAssessments = db.riskAssessments.filter(r => r.taskId !== id);
      if (db.tasks.length < startLen) found = true;
    });

    if (!found) {
      return res.status(404).json({ error: "Task not found." });
    }
    res.json({ success: true, message: "Task and relative schedule allocations removed." });
  } catch (err) {
    handleError(res, err, "Failed to delete task");
  }
});

// GOALS, HABITS Controllers
app.get('/api/goals', (req: Request, res: Response) => {
  try { res.json(readDb().goals); } catch (e) { handleError(res, e, "Fail goals fetch"); }
});

app.post('/api/goals', (req: Request, res: Response) => {
  try {
    const { title, category, targetValue, currentValue, unit, deadline } = req.body;
    const newGoal: Goal = {
      id: "goal_" + Math.random().toString(36).substr(2, 9),
      title,
      category: category || "general",
      targetValue: Number(targetValue) || 10,
      currentValue: Number(currentValue) || 0,
      unit: unit || "units",
      deadline: deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      completionPrediction: 50,
      progressHistory: [{ date: new Date().toISOString().split('T')[0], value: Number(currentValue) || 0 }]
    };
    updateDb(db => { db.goals.push(newGoal); });
    res.status(201).json(newGoal);
  } catch (e) { handleError(res, e, "Fail goal create"); }
});

app.put('/api/goals/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    let updated: Goal | null = null;
    updateDb(db => {
      const idx = db.goals.findIndex(g => g.id === id);
      if (idx !== -1) {
        db.goals[idx] = { ...db.goals[idx], ...updates };
        // If currentValue changed, push to history
        if (updates.currentValue !== undefined) {
          const dateStr = new Date().toISOString().split('T')[0];
          const histIdx = db.goals[idx].progressHistory.findIndex(h => h.date === dateStr);
          if (histIdx !== -1) {
            db.goals[idx].progressHistory[histIdx].value = Number(updates.currentValue);
          } else {
            db.goals[idx].progressHistory.push({ date: dateStr, value: Number(updates.currentValue) });
          }
        }
        // Predict prediction based on ratio
        const ratio = db.goals[idx].targetValue > 0 ? (db.goals[idx].currentValue / db.goals[idx].targetValue) : 0;
        db.goals[idx].completionPrediction = Math.min(100, Math.round(ratio * 100 + 15));
        updated = db.goals[idx];
      }
    });
    if (!updated) return res.status(404).json({ error: "Goal not found" });
    res.json(updated);
  } catch (e) { handleError(res, e, "Fail goal update"); }
});

app.get('/api/habits', (req: Request, res: Response) => {
  try { res.json(readDb().habits); } catch (e) { handleError(res, e, "Fail habits fetch"); }
});

app.post('/api/habits', (req: Request, res: Response) => {
  try {
    const { title, frequency, category } = req.body;
    const newHabit: Habit = {
      id: "habit_" + Math.random().toString(36).substr(2, 9),
      title,
      frequency: frequency || "daily",
      streak: 0,
      category: category || "general",
      history: []
    };
    updateDb(db => { db.habits.push(newHabit); });
    res.status(201).json(newHabit);
  } catch (e) { handleError(res, e, "Fail habit create"); }
});

app.put('/api/habits/:id/toggle', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const dateStr = new Date().toISOString().split('T')[0];
    let updated: Habit | null = null;

    updateDb(db => {
      const idx = db.habits.findIndex(h => h.id === id);
      if (idx !== -1) {
        const habit = db.habits[idx];
        const histIdx = habit.history.findIndex(h => h.date === dateStr);
        
        if (histIdx !== -1) {
          // Toggle off
          const wasCompleted = habit.history[histIdx].completed;
          if (wasCompleted) {
            habit.history[histIdx].completed = false;
            habit.streak = Math.max(0, habit.streak - 1);
            habit.lastCompleted = habit.history[histIdx - 1]?.completed ? habit.history[histIdx - 1].date : undefined;
          } else {
            habit.history[histIdx].completed = true;
            habit.streak += 1;
            habit.lastCompleted = dateStr;
          }
        } else {
          // Toggle on
          habit.history.push({ date: dateStr, completed: true });
          habit.streak += 1;
          habit.lastCompleted = dateStr;
        }
        updated = habit;
      }
    });

    if (!updated) return res.status(404).json({ error: "Habit not found" });
    res.json(updated);
  } catch (e) { handleError(res, e, "Fail habit toggle"); }
});

// GET all Calendar Events (including study block markers)
app.get('/api/calendar', (req: Request, res: Response) => {
  try {
    const db = readDb();
    
    // Auto-expand Travel commute blocks for any meeting event that has a travelTime configuration
    const events: CalendarEvent[] = [];
    db.calendarEvents.forEach(e => {
      events.push(e);
      if (e.travelTime && e.travelTime > 0 && e.commuteBlocked) {
        // Pre-pend a commute stub calendar block!
        const eventStart = new Date(e.start);
        const commuteStart = new Date(eventStart.getTime() - e.travelTime * 60 * 1000);
        events.push({
          id: `commute_${e.id}`,
          title: `🚗 Commute Block (${e.travelTime}m)`,
          start: commuteStart.toISOString(),
          end: e.start,
          category: 'commute',
          isCommuteStub: true
        });
      }
    });

    res.json(events);
  } catch (err) {
    handleError(res, err, "Failed to load calendar events");
  }
});

// POST Manual Calendar Event
app.post('/api/calendar', (req: Request, res: Response) => {
  try {
    const { title, start, end, category, travelTime, commuteBlocked } = req.body;
    if (!title || !start || !end) {
      return res.status(400).json({ error: "Title, start time, and end time are required." });
    }

    const newEvt: CalendarEvent = {
      id: "evt_" + Math.random().toString(36).substr(2, 9),
      title,
      start,
      end,
      category: category || "personal",
      travelTime: travelTime ? Number(travelTime) : undefined,
      commuteBlocked: !!commuteBlocked
    };

    updateDb(db => { db.calendarEvents.push(newEvt); });

    // Automatically trigger pipeline rescheduling around the new event blocker
    triggerGlobalRescheduling();

    res.status(201).json(newEvt);
  } catch (err) {
    handleError(res, err, "Failed to add calendar block");
  }
});

// POST Google Calendar Synced Events
app.post('/api/calendar/sync-google-events', (req: Request, res: Response) => {
  try {
    const { events } = req.body;
    if (!Array.isArray(events)) {
      return res.status(400).json({ error: "An array of Google Calendar events is required." });
    }

    updateDb((db) => {
      // Clear previous synced Google Calendar events to prevent duplicate clusters
      db.calendarEvents = db.calendarEvents.filter(e => !e.id.startsWith("gcal_"));

      events.forEach((evt: any) => {
        const itemStart = evt.start?.dateTime || evt.start?.date || evt.start;
        const itemEnd = evt.end?.dateTime || evt.end?.date || evt.end;
        if (!itemStart || !itemEnd) return;

        db.calendarEvents.push({
          id: `gcal_${evt.id || Math.random().toString(36).substr(2, 9)}`,
          title: evt.summary || evt.title || "Google Calendar Event",
          start: new Date(itemStart).toISOString(),
          end: new Date(itemEnd).toISOString(),
          category: 'meeting'
        });
      });
    });

    // Automatically trigger dynamic rescheduling around new Google calendar blockers
    triggerGlobalRescheduling();

    res.json({ success: true, message: "Google Calendar synced and study sessions re-allocated optimally." });
  } catch (err) {
    handleError(res, err, "Failed logs sync Google calendar");
  }
});

// ==========================================
// 4. FEATURE 1: AI COMMITMENT DISCOVERY
// ==========================================
app.get('/api/gmail-commitments', (req: Request, res: Response) => {
  try {
    res.json(readDb().gmailCommitments);
  } catch (e) {
    handleError(res, e, "Fail fetching Gmail inbox");
  }
});

app.post('/api/gmail-commitments/discover', async (req: Request, res: Response) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      // Offline fallback: simulate commitment discovery with rich logs
      const db = readDb();
      const discoveredCount = db.gmailCommitments.filter(c => c.status === 'discovered').length;
      return res.json({
        success: true,
        message: `Inbox Scan complete. Discovered ${discoveredCount} offline matches in commitment register mailboxes.`,
        commitments: db.gmailCommitments
      });
    }

    // AI MODE: Use Gemini 3.5 Flash to automatically discover commitments from mock emails!
    const db = readDb();
    const emailsToAnalyze = db.gmailCommitments.filter(c => c.status === 'discovered');

    if (emailsToAnalyze.length === 0) {
      return res.json({ success: true, message: "No new unread emails to parse in Inbox.", commitments: db.gmailCommitments });
    }

    const ai = getAi();
    const prompt = `You are a high-level inbox extraction assistant for "Last Minute Life Saver".
Analyze the following emails and extract actionable productivity commitments (deadlines, assignments, meetings, invoice bills).
Return a JSON array of parsed commitments with Title, Description, Deadline (ISO string relative to current time 2026-06-22), Importance, EstimatedEffort (in hours), and Category.

Emails to analyze:
${JSON.stringify(emailsToAnalyze.map(e => ({ id: e.id, sender: e.sender, subject: e.subject, snippet: e.snippet })))}

Validate types precisely:
- importance must be: "low", "medium", "high" or "critical"
- estimatedEffort must be a Number (hours required)
- category must be a string (e.g. "study", "career", "health", "finance")

Respond ONLY with a valid JSON array matching the keys described.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              emailId: { type: Type.STRING },
              extractedTask: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  deadline: { type: Type.STRING },
                  importance: { type: Type.STRING },
                  estimatedEffort: { type: Type.NUMBER },
                  category: { type: Type.STRING }
                },
                required: ["title", "description", "deadline", "importance", "estimatedEffort", "category"]
              }
            },
            required: ["emailId", "extractedTask"]
          }
        }
      }
    });

    const parsedResults = JSON.parse(response.text || '[]');
    
    updateDb((currentDb) => {
      parsedResults.forEach((item: any) => {
        const commIdx = currentDb.gmailCommitments.findIndex(c => c.id === item.emailId);
        if (commIdx !== -1) {
          currentDb.gmailCommitments[commIdx].extractedTask = item.extractedTask;
        }
      });
    });

    res.json({
      success: true,
      message: `Parsed inbox analysis. AI discovered ${parsedResults.length} structured commitments.`,
      commitments: readDb().gmailCommitments
    });

  } catch (err) {
    handleError(res, err, "AI Inbox Scan Failed");
  }
});

// Import discovered email commitment as a real Task
app.post('/api/gmail-commitments/import/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let importedTask: Task | null = null;

    updateDb((db) => {
      const idx = db.gmailCommitments.findIndex(g => g.id === id);
      if (idx !== -1) {
        const ext = db.gmailCommitments[idx].extractedTask;
        if (ext) {
          db.gmailCommitments[idx].status = 'imported';
          
          importedTask = {
            id: "task_gmail_" + Math.random().toString(36).substr(2, 9),
            title: ext.title,
            description: ext.description + ` (Discovered from email: ${db.gmailCommitments[idx].subject})`,
            deadline: ext.deadline,
            importance: ext.importance,
            estimatedEffort: ext.estimatedEffort,
            remainingEffort: ext.estimatedEffort,
            category: ext.category,
            status: 'pending',
            postponeCount: 0,
            createdAt: new Date().toISOString()
          };

          db.tasks.unshift(importedTask);

          // Build initial risk assessment
          db.riskAssessments.push({
            taskId: importedTask.id,
            probability: 75,
            status: 'on_track',
            reason: "Commitment imported from Gmail. Plan study work sessions to complete.",
            calculatedAt: new Date().toISOString()
          });

          // Create notification
          db.notifications.unshift({
            id: "notif_import_" + Math.random().toString(36).substr(2, 9),
            title: "Commitment Imported",
            message: `"${importedTask.title}" has been added to your backlog. Current effort estimation: ${importedTask.estimatedEffort}h.`,
            type: 'schedule_change',
            timestamp: new Date().toISOString(),
            read: false
          });
        }
      }
    });

    if (!importedTask) {
      return res.status(404).json({ error: "Discovered commitment not found or lacks parsed data structures." });
    }
    res.json({ success: true, task: importedTask });
  } catch (err) {
    handleError(res, err, "Import commitment failed");
  }
});


// ==========================================
// 5. FEATURE 2: RISK PREDICTION ENGINE
// ==========================================
async function evalSingleTaskRisk(taskId: string): Promise<RiskAssessment> {
  const db = readDb();
  const task = db.tasks.find(t => t.id === taskId);
  if (!task) throw new Error("Task not found");

  const totalEffort = task.estimatedEffort;
  const remaining = task.remainingEffort;
  const deadline = new Date(task.deadline);
  
  // Hours left until deadline
  const hrsLeftToDeadline = (deadline.getTime() - new Date("2026-06-22T11:00:00-07:00").getTime()) / (1000 * 60 * 60);

  // Scheduled session hours
  const scheduledHrs = db.scheduledSessions
    .filter(s => s.taskId === taskId && s.status === 'scheduled')
    .reduce((sum, s) => sum + s.duration, 0);

  // Simple heuristic/fallback calculations
  let probability = 90;
  let status: 'on_track' | 'at_risk' | 'likely_to_miss' = 'on_track';
  let reason = "You have structured study buffers arranged before the target deadline.";

  if (hrsLeftToDeadline <= 0) {
    probability = 0;
    status = 'likely_to_miss';
    reason = "The task deadline has already passed.";
  } else if (remaining > hrsLeftToDeadline) {
    probability = Math.round((hrsLeftToDeadline / remaining) * 20);
    status = 'likely_to_miss';
    reason = `You need ${remaining} hours to finish, but only ${Math.round(hrsLeftToDeadline)} absolute hours exist before the deadline. Instant failure without scheduling repairs!`;
  } else if (scheduledHrs < remaining) {
    probability = Math.round((scheduledHrs / remaining) * 60);
    status = 'at_risk';
    reason = `You have remaining workload of ${remaining}h, but only ${scheduledHrs}h have been blocked on your calendar. Build additional study slots.`;
  } else if (task.postponeCount > 2) {
    probability = 65;
    status = 'at_risk';
    reason = `Sufficient hours are blocked, but you have postponed this task ${task.postponeCount} times, which indicates significant behavioral friction.`;
  }

  // AI-Based reasoning overlay
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = getAi();
      const aiResult = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze completion risk for this commitment:
- Title: "${task.title}"
- Description: "${task.description}"
- Remaining Effort Required: ${remaining} hours
- Absolute Hours Until Deadline: ${Math.round(hrsLeftToDeadline)}h
- Scheduled active sessions blocked: ${scheduledHrs} hours
- Historic postpones: ${task.postponeCount}
- Overall calendar meetings/events: ${db.calendarEvents.length} blockers active.

Evaluate factors like calendar crowding, workload density, and priority. Return a critical Completion Probability (0 to 100), Status ("on_track", "at_risk", or "likely_to_miss"), and a crisp, supportive but honest, accountability-driven Explanation (max 2 sentences) on WHY the risk level exists.

Provide your response strictly in the following JSON schema representation:
{
  "probability": number,
  "status": string,
  "reason": string
}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              probability: { type: Type.INTEGER },
              status: { type: Type.STRING },
              reason: { type: Type.STRING }
            },
            required: ["probability", "status", "reason"]
          }
        }
      });

      const parsed = JSON.parse(aiResult.text || '{}');
      if (parsed.probability !== undefined) {
        probability = parsed.probability;
        status = parsed.status === 'on_track' ? 'on_track' : (parsed.status === 'at_risk' ? 'at_risk' : 'likely_to_miss');
        reason = parsed.reason;
      }
    } catch (err) {
      console.error("AI risk analyzer failed. Proceeding with mathematical model fallback.", err);
    }
  }

  const assessment: RiskAssessment = {
    taskId,
    probability,
    status,
    reason,
    calculatedAt: new Date().toISOString()
  };

  updateDb(db => {
    const idx = db.riskAssessments.findIndex(r => r.taskId === taskId);
    if (idx !== -1) {
      db.riskAssessments[idx] = assessment;
    } else {
      db.riskAssessments.push(assessment);
    }
  });

  return assessment;
}

app.post('/api/risk-engine/assess/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assessment = await evalSingleTaskRisk(id);
    res.json(assessment);
  } catch (err) {
    handleError(res, err, "Failed to run risk assessment calculations");
  }
});


// ==========================================
// 6. FEATURE 3: AI SCHEDULING ENGINE
// ==========================================
app.post('/api/auto-schedule', (req: Request, res: Response) => {
  try {
    const { taskId, sessionsCount } = req.body;
    if (!taskId) return res.status(400).json({ error: "Missing taskId." });

    const db = readDb();
    const task = db.tasks.find(t => t.id === taskId);
    if (!task) return res.status(404).json({ error: "Task code not registered." });

    const remainingEffort = task.remainingEffort;
    
    // Clear old scheduled items for this task to avoid duplicates
    updateDb((currentDb) => {
      currentDb.scheduledSessions = currentDb.scheduledSessions.filter(s => !(s.taskId === taskId && s.status === 'scheduled'));
      currentDb.calendarEvents = currentDb.calendarEvents.filter(e => !(e.taskId === taskId && e.category === 'deep_work'));
    });

    const activeDb = readDb();
    const blocksAvailable = findFreeBlocks(activeDb, remainingEffort);

    if (blocksAvailable.length === 0) {
      return res.status(400).json({ error: "No available free calendar space to map your effort schedule. Please clear general blockers." });
    }

    const newSessions: ScheduledSession[] = blocksAvailable.map((b, idx) => ({
      id: `sess_${taskId}_${Date.now()}_${idx}`,
      taskId: taskId,
      taskTitle: task.title,
      start: b.start,
      end: b.end,
      duration: 2,
      status: 'scheduled'
    }));

    const newCalEvents: CalendarEvent[] = newSessions.map(s => ({
      id: `evt_${s.id}`,
      title: `Study: ${task.title}`,
      start: s.start,
      end: s.end,
      category: 'deep_work',
      taskId: taskId
    }));

    updateDb((db) => {
      db.scheduledSessions.push(...newSessions);
      db.calendarEvents.push(...newCalEvents);
      
      // Update task remaining status
      const idx = db.tasks.findIndex(t => t.id === taskId);
      if (idx !== -1) {
        db.tasks[idx].status = 'in_progress';
      }

      // Record notice notification
      db.notifications.unshift({
        id: "notif_sched_" + Math.random().toString(36).substr(2, 9),
        title: "Schedules Reconstructed",
        message: `Structured study plans mapped for "${task.title}". Allocated ${newSessions.length} focus sessions of 2h automatically.`,
        type: 'schedule_change',
        timestamp: new Date().toISOString(),
        read: false
      });
    });

    res.json({ success: true, sessionsAllocated: newSessions });

  } catch (err) {
    handleError(res, err, "Schedules mapping failed");
  }
});


// ==========================================
// 7. FEATURE 4: SELF-HEALING SCHEDULE
// ==========================================
app.get('/api/self-heal/logs', (req: Request, res: Response) => {
  try {
    res.json(readDb().rescheduleLogs);
  } catch (e) {
    handleError(res, e, "Fail fetching logs");
  }
});

app.post('/api/self-heal', async (req: Request, res: Response) => {
  try {
    const { taskId, explicitReason } = req.body;
    const db = readDb();

    // If a taskId is passed, heal that specific task.
    // Otherwise, scan all tasks and find missed scheduledSessions to trigger a batch self-heal!
    let tasksToHeal: Task[] = [];
    if (taskId) {
      const single = db.tasks.find(t => t.id === taskId);
      if (single) tasksToHeal.push(single);
    } else {
      // Find tasks that have missed sessions
      const missedSessions = db.scheduledSessions.filter(s => s.status === 'missed');
      const uniqueTaskIds = Array.from(new Set(missedSessions.map(s => s.taskId)));
      tasksToHeal = db.tasks.filter(t => uniqueTaskIds.includes(t.id) && t.status !== 'completed');
    }

    if (tasksToHeal.length === 0) {
      // Create a default healing logic on the first pending task to demonstrate the system
      const firstPending = db.tasks.find(t => t.status === 'pending' || t.status === 'in_progress');
      if (firstPending) {
        tasksToHeal.push(firstPending);
      } else {
        return res.json({ success: true, message: "Calendar is fully healthy. No missed allocations detected.", logs: [] });
      }
    }

    const selfHealLogs: RescheduleLog[] = [];

    for (const task of tasksToHeal) {
      const activeDb = readDb();
      // Calculate remaining effort. If sessions were missed, we must preserve or reallocate them
      const missedCount = activeDb.scheduledSessions.filter(s => s.taskId === task.id && s.status === 'missed').length;
      
      // Select the sessions of this task that are still scheduled to slide them forwards, and recreate missed ones
      const pendingSessions = activeDb.scheduledSessions.filter(s => s.taskId === task.id && s.status === 'scheduled');
      const originalRep = [...pendingSessions].map(p => ({ start: p.start, end: p.end }));

      // Remove the old scheduled items
      updateDb((currentDb) => {
        currentDb.scheduledSessions = currentDb.scheduledSessions.filter(s => !(s.taskId === task.id && s.status === 'scheduled'));
        currentDb.calendarEvents = currentDb.calendarEvents.filter(e => !(e.taskId === task.id && e.category === 'deep_work'));
      });

      // Recalculate working blocks needed. We need: pending hours + missed hours to re-schedule
      const totalHoursNeeded = (pendingSessions.length * 2) + (missedCount * 2);

      const refreshDb = readDb();
      const freeSlots = findFreeBlocks(refreshDb, totalHoursNeeded);

      const reallocatedSessions: ScheduledSession[] = freeSlots.map((slot, idx) => ({
        id: `sess_healed_${task.id}_${Date.now()}_${idx}`,
        taskId: task.id,
        taskTitle: task.title,
        start: slot.start,
        end: slot.end,
        duration: 2,
        status: 'scheduled'
      }));

      const reallocatedCalEvents: CalendarEvent[] = reallocatedSessions.map(s => ({
        id: `evt_${s.id}`,
        title: `Study: ${task.title} (Healed)`,
        start: s.start,
        end: s.end,
        category: 'deep_work',
        taskId: task.id
      }));

      // Log the recovery event
      const logId = "log_" + Math.random().toString(36).substr(2, 9);
      const repairReason = explicitReason || `Missed focus buffers detected. Effort requirement: ${totalHoursNeeded}h. Automatic slide correction active.`;
      
      const newLog: RescheduleLog = {
        id: logId,
        timestamp: new Date().toISOString(),
        taskId: task.id,
        taskTitle: task.title,
        reason: repairReason,
        originalSessions: originalRep.length > 0 ? originalRep : [{ start: "Inactive Session", end: "Inactive Session" }],
        newSessions: reallocatedSessions.map(r => ({ start: r.start, end: r.end }))
      };

      selfHealLogs.push(newLog);

      updateDb(db => {
        db.scheduledSessions.push(...reallocatedSessions);
        db.calendarEvents.push(...reallocatedCalEvents);
        db.rescheduleLogs.unshift(newLog);

        // Also push a smart recovery notification
        db.notifications.unshift({
          id: "notif_heal_" + Math.random().toString(36).substr(2, 9),
          title: `Schedule Repaired: ${task.title}`,
          message: `Your AI Chief of Staff repaired your schedule. Reallocated ${reallocatedSessions.length} sessions forwards to fulfill your ${totalHoursNeeded}h target.`,
          type: 'recovery',
          timestamp: new Date().toISOString(),
          read: false,
          actionable: true,
          actionId: task.id,
          actionType: 'view_task'
        });

        // Clear missed badges since we have successfully recovered them
        db.scheduledSessions.forEach(s => {
          if (s.taskId === task.id && s.status === 'missed') {
            s.status = 'completed'; // resolve missed records after corrective healing
          }
        });
      });

      // Recalculate Risk assessment for this task!
      try {
        await evalSingleTaskRisk(task.id);
      } catch (e) {
        console.warn("AI Risk Assessment on heal non-critical failure", e);
      }
    }

    res.json({ success: true, healedTasksCount: tasksToHeal.length, logs: selfHealLogs });

  } catch (err) {
    handleError(res, err, "Self-Healing failed execution");
  }
});


// ==========================================
// 8. FEATURE 6: AI PRODUCTIVITY COPILOT
// ==========================================
app.post('/api/copilot', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Missing message query." });

    const db = readDb();
    let reply = "";

    if (!process.env.GEMINI_API_KEY) {
      // Smart offline custom responses
      const text = prompt.toLowerCase();
      if (text.includes('risk') || text.includes('deadline')) {
        reply = "Looking closely at your task list, **Operating Systems Assignment** is your biggest risk! You have 6 remaining hours but your calendar is crowded before Wednesday. I strongly recommend recovering your missed 2-hour DSA study buffer now.";
      } else if (text.includes('study') || text.includes('schedule') || text.includes('work')) {
        reply = "Right now, you should start on **Machine Learning Assignment** block scheduled for 13:00 today. Completing this session increases your overall Friday completion probability from 83% to 91%!";
      } else if (text.includes('heal') || text.includes('missed') || text.includes('fix')) {
        reply = "I've detected a missed study slot for your Operating Systems assignment! I can trigger our **Schedule Healing Engine** to find free blocks on Tuesday or Wednesday. Would you like me to execute this self-healing correction?";
      } else {
        reply = `Hello Adhiraj! As your AI Chief of Staff, I am monitoring 4 active commitments. We have tracked 1 high-risk warning. You can ask me to self-heal your schedule, analyze upcoming travel delays, review inbox emails for commitments, or plan work intervals. What should we tackle right now?`;
      }
      return res.json({ response: reply });
    }

    // AI MODE: Custom Context Injection Chat with Gemini 3.5 Flash
    const ai = getAi();
    const systemIns = `You are a warm, highly-capable, executive-level AI Chief of Staff named Gemini for "Last Minute Life Saver".
The user is Adhiraj Tiwari (adhirajtiwari01@gmail.com).
Your objective is to provide actionable, intelligent, and highly contextual feedback based on their current productivity database.
Do not mention files or system directories. Be encouraging but direct, keeping the focus entirely on completing tasks and mitigating delay risks.

Current Database State:
- Tasks: ${JSON.stringify(db.tasks.map(t => ({ title: t.title, deadline: t.deadline, status: t.status, remainingEffort: t.remainingEffort, postpones: t.postponeCount })))}
- Upcoming Calendar events: ${JSON.stringify(db.calendarEvents.map(e => ({ title: e.title, start: e.start, end: e.end, category: e.category })))}
- Pre-computed Risk assessments: ${JSON.stringify(db.riskAssessments)}
- Streaks & Habits: ${JSON.stringify(db.habits.map(h => ({ title: h.title, streak: h.streak, category: h.category })))}
- Recent recovery logs: ${JSON.stringify(db.rescheduleLogs.slice(0, 3))}

Provide exact statistics. For example: "Starting Operating Systems tonight increases your completion probability from 28% to 74% because it matches your preferred evening peak focus period." Or tell them exactly which calendar blocks conflict! Keep your answer crisp and under 150 words.`;

    const chatResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemIns,
        temperature: 0.7
      }
    });

    reply = chatResponse.text || "I was unable to assess your request. Let's look at your risk meters directly!";
    res.json({ response: reply });

  } catch (err) {
    handleError(res, err, "Copilot system failure");
  }
});


// ==========================================
// 9. FEATURE 7: VOICE PRODUCTIVITY ASSISTANT
// ==========================================
const handleVoiceCommand = async (req: Request, res: Response) => {
  try {
    const message = req.body.message || req.body.command;
    const returnAudio = req.body.returnAudio;
    if (!message) return res.status(400).json({ error: "Missing voiced message string." });

    const db = readDb();
    let recognizedText = message;
    let feedback = "";
    let base64Audio = null;

    if (!process.env.GEMINI_API_KEY) {
      // Offline Voice parser fallback logic
      const promptLower = message.toLowerCase();
      if (promptLower.includes('interview') || promptLower.includes('amazon')) {
        feedback = "Voice Command Received: Logged 'Amazon Technical Interview' on your tasks list, scheduled for next Tuesday, with a 12-hour preparation block distributed across available evening slots.";
      } else if (promptLower.includes('calculus') || promptLower.includes('study')) {
        feedback = "Voice Command Received: Mapped calculus biology buffers on your calendar for this week.";
      } else {
        feedback = `Voice Command Received: "${message}". Processed command successfully and scheduled dynamic buffers in your background dashboard.`;
      }
      return res.json({ text: feedback, reply: feedback, feedback: feedback, base64Audio });
    }

    // AI MODE voice command solver
    const ai = getAi();
    const voicePrompt = `You are a voice assistant command parser for "Last Minute Life Saver".
The user muttered this voice instruction: "${message}".

Based on this, tell me what action should be taken. Give a polite, crisp, verbal response (as if speaking) summarizing what you did (under 2 sentences). Include exact timings or actions.
Format the response strictly to JSON:
{
  "feedback": "spoken text response here",
  "recommendedTaskCreation": {
    "title": "title of extracted commitment if any",
    "deadlineDaysFromNow": number,
    "importance": "low|medium|high|critical",
    "estimatedEffort": number,
    "category": "study|career|health|finance|general"
  }
}`;

    const parsedVoiceResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: voicePrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            feedback: { type: Type.STRING },
            recommendedTaskCreation: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                deadlineDaysFromNow: { type: Type.INTEGER },
                importance: { type: Type.STRING },
                estimatedEffort: { type: Type.NUMBER },
                category: { type: Type.STRING }
              }
            }
          },
          required: ["feedback"]
        }
      }
    });

    const parsed = JSON.parse(parsedVoiceResponse.text || '{}');
    feedback = parsed.feedback;

    // Execute background dynamic task insertion if Gemini extracted one!
    if (parsed.recommendedTaskCreation) {
      const { title, deadlineDaysFromNow, importance, estimatedEffort, category } = parsed.recommendedTaskCreation;
      const refDays = deadlineDaysFromNow || 4;
      
      const voiceTask: Task = {
        id: "task_voice_" + Math.random().toString(36).substr(2, 9),
        title,
        description: `Logged via voice assistant. Text matched: "${message}"`,
        deadline: getRelativeDate(refDays, "17:00"),
        importance: importance || "medium",
        estimatedEffort: Number(estimatedEffort) || 4,
        remainingEffort: Number(estimatedEffort) || 4,
        category: category || "general",
        status: "pending",
        postponeCount: 0,
        createdAt: new Date().toISOString()
      };

      updateDb(currentDb => {
        currentDb.tasks.unshift(voiceTask);
        currentDb.riskAssessments.push({
          taskId: voiceTask.id,
          probability: 88,
          status: 'on_track',
          reason: "Created via Voice command. Automatically preparing calendar buffers.",
          calculatedAt: new Date().toISOString()
        });
        currentDb.notifications.unshift({
          id: "notif_voice_" + Math.random().toString(36).substr(2, 9),
          title: "Voice Command Extracted",
          message: `Created Task: "${voiceTask.title}" (${voiceTask.estimatedEffort}h remaining effort).`,
          type: 'schedule_change',
          timestamp: new Date().toISOString(),
          read: false
        });
      });

      // Quick auto schedule for the new task
      const blocks = findFreeBlocks(readDb(), voiceTask.estimatedEffort);
      const voiceSessions: ScheduledSession[] = blocks.map((b, idx) => ({
        id: `sess_voice_${voiceTask.id}_${idx}`,
        taskId: voiceTask.id,
        taskTitle: voiceTask.title,
        start: b.start,
        end: b.end,
        duration: 2,
        status: 'scheduled'
      }));
      const voiceCalEvents: CalendarEvent[] = voiceSessions.map(s => ({
        id: `evt_${s.id}`,
        title: `Study: ${voiceTask.title}`,
        start: s.start,
        end: s.end,
        category: 'deep_work',
        taskId: voiceTask.id
      }));

      updateDb(currentDb => {
        currentDb.scheduledSessions.push(...voiceSessions);
        currentDb.calendarEvents.push(...voiceCalEvents);
      });
    }

    // TTS SPEECH CONVERSION (Feature 7 Voice Assistant: returns audio stream chunk)
    if (returnAudio && process.env.GEMINI_API_KEY) {
      try {
        const audioResponse = await ai.models.generateContent({
          model: "gemini-3.1-flash-tts-preview",
          contents: [{ parts: [{ text: `Say cheerfully: ${feedback}` }] }],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' }, // Warm supportive companion
              },
            },
          },
        });
        const audioData = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (audioData) {
          base64Audio = audioData;
        }
      } catch (audioErr) {
        console.warn("Speech generation failed", audioErr);
      }
    }

    res.json({ text: feedback, reply: feedback, feedback: feedback, base64Audio, audioBase64: base64Audio });

  } catch (err) {
    handleError(res, err, "Voice assistant parsing error");
  }
};

app.post('/api/voice/command', handleVoiceCommand);
app.post('/api/voice-command', handleVoiceCommand);


// ==========================================
// 10. MAPS TRAVEL ENDPOINT
// ==========================================
app.get('/api/maps/travel-time', (req: Request, res: Response) => {
  try {
    const { origin, destination } = req.query;
    // Return Travel simulation matrices
    res.json({
      origin: origin || "Home Workspace",
      destination: destination || "AWS Campus Center",
      travelDistanceMiles: 14.5,
      travelDurationMinutes: 40,
      predictedDelaysSeconds: 340,
      commuteBufferStatus: "optimal",
      recCommuteBlock: "AI automatically reserved 40 mins prior to the meeting start."
    });
  } catch (e) {
    handleError(res, e, "Maps matrix failed");
  }
});


// ==========================================================
// STATIC BUILD ROUTING & VITE MIDDLEWARE CONFIGURATION
// ==========================================================
async function startAppServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting development mode with Vite middleware mode integration.");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting production mode. Serving compiled static directory dist/");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Last Minute Life Saver fullstask server running on http://localhost:${PORT}`);
  });
}

startAppServer().catch(err => {
  console.error("Critical error configuring full-stack server container:", err);
});
