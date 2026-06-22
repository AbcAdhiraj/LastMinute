import fs from 'fs';
import path from 'path';
import { AppDatabase, Task, Goal, Habit, CalendarEvent, ScheduledSession, GmailCommitment, Notification, RiskAssessment, RescheduleLog, Analytics } from '../types';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Helper to calculate relative dates from "now" (2026-06-22)
function getRelativeDate(days: number, hourStr: string = "00:00"): string {
  const baseDate = new Date("2026-06-22T00:00:00-07:00");
  const targetDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
  const [hours, minutes] = hourStr.split(':').map(Number);
  targetDate.setHours(hours);
  targetDate.setMinutes(minutes);
  return targetDate.toISOString();
}

const defaultDatabase: AppDatabase = {
  userProfile: {
    name: "Adhiraj Tiwari",
    email: "adhirajtiwari01@gmail.com",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256",
    joinedDate: "2026-05-01",
    lastActive: "2026-06-22T10:59:00-07:00"
  },
  tasks: [
    {
      id: "t1",
      title: "Machine Learning Assignment",
      description: "Complete neural network implementation, prepare performance analysis tables, and finalize report.",
      deadline: getRelativeDate(4, "17:00"), // Friday
      importance: "high",
      estimatedEffort: 10,
      remainingEffort: 6,
      category: "study",
      status: "in_progress",
      postponeCount: 0,
      createdAt: getRelativeDate(-2, "09:00")
    },
    {
      id: "t2",
      title: "Operating Systems Assignment",
      description: "Implement simple shell pipe execution and process lifecycle trace logging.",
      deadline: getRelativeDate(2, "23:59"), // Wednesday
      importance: "critical",
      estimatedEffort: 6,
      remainingEffort: 6,
      category: "study",
      status: "pending",
      postponeCount: 3,
      createdAt: getRelativeDate(-3, "10:00")
    },
    {
      id: "t3",
      title: "Amazon Software Engineer Prep",
      description: "Solve key catalog design questions, mock system design, and review past logs.",
      deadline: getRelativeDate(8, "12:00"), // Next Tuesday
      importance: "critical",
      estimatedEffort: 12,
      remainingEffort: 12,
      category: "career",
      status: "pending",
      postponeCount: 0,
      createdAt: getRelativeDate(0, "08:00")
    },
    {
      id: "t4",
      title: "Launch Portfolio Case Studies",
      description: "Review content structure, check SEO headers, publish build to production servers.",
      deadline: getRelativeDate(1, "12:00"), // Tuesday noon
      importance: "medium",
      estimatedEffort: 3,
      remainingEffort: 1.5,
      category: "career",
      status: "in_progress",
      postponeCount: 1,
      createdAt: getRelativeDate(-4, "11:00")
    }
  ],
  goals: [
    {
      id: "g1",
      title: "Solve 100 DSA Problems",
      category: "career",
      targetValue: 100,
      currentValue: 63,
      unit: "problems",
      deadline: getRelativeDate(15, "23:59"),
      completionPrediction: 85,
      progressHistory: [
        { date: "2026-06-15", value: 45 },
        { date: "2026-06-17", value: 50 },
        { date: "2026-06-19", value: 55 },
        { date: "2026-06-21", value: 63 }
      ]
    },
    {
      id: "g2",
      title: "Launch Portfolio Site",
      category: "career",
      targetValue: 100,
      currentValue: 75,
      unit: "% complete",
      deadline: getRelativeDate(2, "23:59"),
      completionPrediction: 95,
      progressHistory: [
        { date: "2026-06-15", value: 20 },
        { date: "2026-06-18", value: 50 },
        { date: "2026-06-21", value: 75 }
      ]
    },
    {
      id: "g3",
      title: "Apply to 15 Internships",
      category: "career",
      targetValue: 15,
      currentValue: 5,
      unit: "applications",
      deadline: getRelativeDate(10, "23:59"),
      completionPrediction: 35,
      progressHistory: [
        { date: "2026-06-15", value: 1 },
        { date: "2026-06-18", value: 3 },
        { date: "2026-06-21", value: 5 }
      ]
    }
  ],
  habits: [
    {
      id: "h1",
      title: "LeetCode Prep",
      frequency: "daily",
      streak: 12,
      lastCompleted: "2026-06-21",
      category: "study",
      history: [
        { date: "2026-06-18", completed: true },
        { date: "2026-06-19", completed: true },
        { date: "2026-06-20", completed: true },
        { date: "2026-06-21", completed: true }
      ]
    },
    {
      id: "h2",
      title: "Work Out / Gym Session",
      frequency: "daily",
      streak: 5,
      lastCompleted: "2026-06-21",
      category: "health",
      history: [
        { date: "2026-06-18", completed: true },
        { date: "2026-06-19", completed: false },
        { date: "2026-06-20", completed: true },
        { date: "2026-06-21", completed: true }
      ]
    },
    {
      id: "h3",
      title: "Morning 5K Run",
      frequency: "daily",
      streak: 0,
      lastCompleted: "2026-06-20",
      category: "health",
      history: [
        { date: "2026-06-18", completed: true },
        { date: "2026-06-19", completed: true },
        { date: "2026-06-20", completed: true },
        { date: "2026-06-21", completed: false }
      ]
    }
  ],
  calendarEvents: [
    {
      id: "e1",
      title: "Daily Standup Meeting",
      start: getRelativeDate(0, "10:00"),
      end: getRelativeDate(0, "10:30"),
      category: "meeting"
    },
    {
      id: "e2",
      title: "Class Project Critique",
      start: getRelativeDate(1, "14:00"),
      end: getRelativeDate(1, "15:00"),
      category: "study"
    },
    {
      id: "e3",
      title: "Weekly Engineering Sync",
      start: getRelativeDate(2, "11:00"),
      end: getRelativeDate(2, "12:00"),
      category: "meeting"
    },
    {
      id: "e4",
      title: "In-Person Client Consultation",
      start: getRelativeDate(1, "16:00"),
      end: getRelativeDate(1, "17:00"),
      category: "meeting",
      travelTime: 40,
      commuteBlocked: true
    },
    {
      id: "e5",
      title: "ML Deep Work Session",
      start: getRelativeDate(0, "13:00"),
      end: getRelativeDate(0, "15:00"),
      category: "deep_work",
      taskId: "t1"
    }
  ],
  scheduledSessions: [
    {
      id: "s1",
      taskId: "t1",
      taskTitle: "Machine Learning Assignment",
      start: getRelativeDate(-1, "15:00"),
      end: getRelativeDate(-1, "17:00"),
      duration: 2,
      status: "completed"
    },
    {
      id: "s2",
      taskId: "t1",
      taskTitle: "Machine Learning Assignment",
      start: getRelativeDate(0, "13:00"),
      end: getRelativeDate(0, "15:00"),
      duration: 2,
      status: "scheduled"
    },
    {
      id: "s3",
      taskId: "t1",
      taskTitle: "Machine Learning Assignment",
      start: getRelativeDate(1, "10:00"),
      end: getRelativeDate(1, "12:00"),
      duration: 2,
      status: "scheduled"
    },
    {
      id: "s4",
      taskId: "t2",
      taskTitle: "Operating Systems Assignment",
      start: getRelativeDate(-1, "18:00"),
      end: getRelativeDate(-1, "20:00"),
      duration: 2,
      status: "missed" // Demonstates a missed session for Self-Healing
    },
    {
      id: "s5",
      taskId: "t4",
      taskTitle: "Launch Portfolio Case Studies",
      start: getRelativeDate(0, "16:00"),
      end: getRelativeDate(0, "17:30"),
      duration: 1.5,
      status: "scheduled"
    }
  ],
  gmailCommitments: [
    {
      id: "gm1",
      sender: "Prof. Henderson (University)",
      subject: "CS-504 Machine Learning Homework Submission Deadline",
      snippet: "Hi class, just a reminder that the final Machine Learning neural net notebook and project analysis report are due on Friday at 5:00 PM. No late submissions will be accepted.",
      date: getRelativeDate(-1, "08:15"),
      status: "imported",
      extractedTask: {
        title: "Machine Learning Assignment",
        description: "Complete neural network implementation and prepare performance analysis tables.",
        deadline: getRelativeDate(4, "17:00"),
        importance: "high",
        estimatedEffort: 10,
        category: "study"
      }
    },
    {
      id: "gm2",
      sender: "Amazon Recruiting",
      subject: "Amazon Technical Interview - Software Engineer Internship",
      snippet: "Dear Adhiraj, and thank you for your application. We are pleased to confirm your next interview round on next Tuesday at 12:00 PM PST. The video call details are attached.",
      date: getRelativeDate(-1, "14:20"),
      status: "discovered",
      extractedTask: {
        title: "Amazon Software Engineer Prep",
        description: "Review database designs and prep for behavioral questions.",
        deadline: getRelativeDate(8, "12:00"),
        importance: "critical",
        estimatedEffort: 12,
        category: "career"
      }
    },
    {
      id: "gm3",
      sender: "Apex Energy Service",
      subject: "E-Bill electricity statement due soon",
      snippet: "Your monthly Apex utility bill for $114.50 is ready for review. Payment is due before June 30th to avoid late penalties. Set up auto-debit today.",
      date: getRelativeDate(-2, "06:00"),
      status: "discovered",
      extractedTask: {
        title: "Pay Apex Utility Bill",
        description: "Electricity invoice payment.",
        deadline: "2026-06-30T17:00:00-07:00",
        importance: "medium",
        estimatedEffort: 0.5,
        category: "finance"
      }
    }
  ],
  notifications: [
    {
      id: "n1",
      title: "Risk Alert: Operating Systems Assignment",
      message: "You postponed this task 3 times, and we registered a missed 2-hour study block. Current completion probability is 28% without immediate intervention.",
      type: "risk",
      timestamp: getRelativeDate(0, "08:30"),
      read: false,
      actionable: true,
      actionId: "t2",
      actionType: "heal_schedule"
    },
    {
      id: "n2",
      title: "Self-Healing Triggered",
      message: "Detected inactive Operating Systems study session at 18:00 yesterday. Schedule automatically updated with tomorrow block.",
      type: "recovery",
      timestamp: getRelativeDate(0, "09:00"),
      read: true,
      actionable: false
    }
  ],
  riskAssessments: [
    {
      taskId: "t1",
      probability: 83,
      status: "on_track",
      reason: "80% of estimated sessions are currently scheduled on your calendar and you finished 2 hours of prep already.",
      calculatedAt: getRelativeDate(0, "10:00")
    },
    {
      taskId: "t2",
      probability: 28,
      status: "likely_to_miss",
      reason: "You have 6 remaining hours but only 4 hours free on your calendar before the Wednesday night deadline. Past postponement history increases penalty risk.",
      calculatedAt: getRelativeDate(0, "10:00")
    },
    {
      taskId: "t3",
      probability: 41,
      status: "at_risk",
      reason: "The complexity is very high (12 hours needed), and while Tuesday next week is far, you have not scheduled any sessions yet.",
      calculatedAt: getRelativeDate(0, "10:00")
    },
    {
      taskId: "t4",
      probability: 95,
      status: "on_track",
      reason: "Only 1.5 hours remaining, and a session is scheduled for today at 4:00 PM.",
      calculatedAt: getRelativeDate(0, "10:00")
    }
  ],
  rescheduleLogs: [
    {
      id: "r1",
      timestamp: getRelativeDate(0, "09:00"),
      taskId: "t2",
      taskTitle: "Operating Systems Assignment",
      reason: "Missed scheduled session on Sunday 18:00–20:00. No manual input provided.",
      originalSessions: [
        { start: getRelativeDate(-1, "18:00"), end: getRelativeDate(-1, "20:00") }
      ],
      newSessions: [
        { start: getRelativeDate(1, "19:00"), end: getRelativeDate(1, "21:00") }
      ]
    }
  ]
};

export function readDb(): AppDatabase {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      writeDb(defaultDatabase);
      return defaultDatabase;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read database, resetting to seed data:", err);
    return defaultDatabase;
  }
}

export function writeDb(data: AppDatabase): void {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error("Failed to write to database:", err);
  }
}

export function updateDb(updater: (data: AppDatabase) => void): AppDatabase {
  const db = readDb();
  updater(db);
  writeDb(db);
  return db;
}
