import fs from 'fs';
import path from 'path';
import { AppDatabase, Task, Goal, Habit, CalendarEvent, ScheduledSession, GmailCommitment, Notification, RiskAssessment, RescheduleLog, Analytics } from '../types';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Helper to calculate relative dates from "now" (2026-06-22)
function getRelativeDate(days: number, hourStr: string = "00:00"): string {
  const baseDate = new Date();
  const targetDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
  const [hours, minutes] = hourStr.split(':').map(Number);
  targetDate.setHours(hours, minutes, 0, 0);
  return targetDate.toISOString();
}

export const defaultDatabase: AppDatabase = {
  userProfile: {
    name: "Raj",
    email: "raj@college.edu",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256",
    joinedDate: "2026-05-01",
    lastActive: "2026-06-22T10:59:00-07:00"
  },
  tasks: [
    {
      id: "t1",
      title: "Data Structures Project",
      description: "Complete graph algorithms implementation and write the final report for CS-301.",
      deadline: getRelativeDate(4, "17:00"), // Friday
      importance: "high",
      estimatedEffort: 8,
      remainingEffort: 5,
      category: "study",
      status: "in_progress",
      postponeCount: 0,
      createdAt: getRelativeDate(-2, "09:00")
    },
    {
      id: "t2",
      title: "Apply to SWE Internships",
      description: "Send out 10 applications for Summer 2027 SWE Internships.",
      deadline: getRelativeDate(2, "23:59"), // Wednesday
      importance: "critical",
      estimatedEffort: 4,
      remainingEffort: 4,
      category: "career",
      status: "pending",
      postponeCount: 1,
      createdAt: getRelativeDate(-3, "10:00")
    },
    {
      id: "t3",
      title: "Date Night",
      description: "Dinner at the new Italian place downtown.",
      deadline: getRelativeDate(3, "20:00"), // Thursday night
      importance: "high",
      estimatedEffort: 3,
      remainingEffort: 3,
      category: "personal",
      status: "pending",
      postponeCount: 0,
      createdAt: getRelativeDate(0, "08:00")
    },
    {
      id: "t4",
      title: "LeetCode Daily Practice",
      description: "Solve 3 medium DP problems for interview prep.",
      deadline: getRelativeDate(1, "22:00"), // Tomorrow
      importance: "medium",
      estimatedEffort: 2,
      remainingEffort: 2,
      category: "career",
      status: "pending",
      postponeCount: 0,
      createdAt: getRelativeDate(-1, "11:00")
    }
  ],
  goals: [
    {
      id: "g1",
      title: "Secure Summer Internship",
      category: "career",
      targetValue: 50,
      currentValue: 15,
      unit: "applications",
      deadline: getRelativeDate(30, "23:59"),
      completionPrediction: 85,
      progressHistory: [
        { date: "2026-06-15", value: 5 },
        { date: "2026-06-17", value: 10 },
        { date: "2026-06-19", value: 12 },
        { date: "2026-06-21", value: 15 }
      ]
    },
    {
      id: "g2",
      title: "Hit 225lb Bench Press",
      category: "health",
      targetValue: 225,
      currentValue: 185,
      unit: "lbs",
      deadline: getRelativeDate(60, "23:59"),
      completionPrediction: 95,
      progressHistory: [
        { date: "2026-05-15", value: 165 },
        { date: "2026-06-01", value: 175 },
        { date: "2026-06-21", value: 185 }
      ]
    },
    {
      id: "g3",
      title: "Maintain 3.8 GPA",
      category: "study",
      targetValue: 3.8,
      currentValue: 3.75,
      unit: "GPA",
      deadline: getRelativeDate(150, "23:59"),
      completionPrediction: 80,
      progressHistory: [
        { date: "2026-01-15", value: 3.7 },
        { date: "2026-05-18", value: 3.75 },
        { date: "2026-06-21", value: 3.75 }
      ]
    }
  ],
  habits: [
    {
      id: "h1",
      title: "Gym Session (Push/Pull/Legs)",
      frequency: "daily",
      streak: 4,
      lastCompleted: "2026-06-21",
      category: "health",
      history: [
        { date: "2026-06-18", completed: true },
        { date: "2026-06-19", completed: true },
        { date: "2026-06-20", completed: true },
        { date: "2026-06-21", completed: true }
      ]
    },
    {
      id: "h2",
      title: "LeetCode Prep",
      frequency: "daily",
      streak: 5,
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
      id: "h3",
      title: "Read 10 Pages",
      frequency: "daily",
      streak: 0,
      lastCompleted: "2026-06-20",
      category: "personal",
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
      title: "CS-301 Lecture",
      start: getRelativeDate(0, "10:00"),
      end: getRelativeDate(0, "11:30"),
      category: "study"
    },
    {
      id: "e2",
      title: "Gym (Pull Day)",
      start: getRelativeDate(0, "18:30"),
      end: getRelativeDate(0, "20:00"),
      category: "health"
    },
    {
      id: "e3",
      title: "Mock Interview with Seniors",
      start: getRelativeDate(2, "16:00"),
      end: getRelativeDate(2, "17:00"),
      category: "career"
    },
    {
      id: "e4",
      title: "Dinner",
      start: getRelativeDate(3, "19:30"),
      end: getRelativeDate(3, "22:00"),
      category: "personal",
      travelTime: 30,
      commuteBlocked: true
    },
    {
      id: "e5",
      title: "Project Deep Work",
      start: getRelativeDate(0, "10:00"),
      end: getRelativeDate(0, "12:30"),
      category: "deep_work",
      taskId: "t1"
    }
  ],
  scheduledSessions: [
    {
      id: "s1",
      taskId: "t1",
      taskTitle: "Data Structures Project",
      start: getRelativeDate(-1, "16:00"),
      end: getRelativeDate(-1, "18:30"),
      duration: 2.5,
      status: "completed"
    },
    {
      id: "s2",
      taskId: "t1",
      taskTitle: "Data Structures Project",
      start: getRelativeDate(0, "14:00"),
      end: getRelativeDate(0, "16:30"),
      duration: 2.5,
      status: "scheduled"
    },
    {
      id: "s3",
      taskId: "t1",
      taskTitle: "Data Structures Project",
      start: getRelativeDate(1, "14:30"),
      end: getRelativeDate(1, "16:30"),
      duration: 2,
      status: "scheduled"
    },
    {
      id: "s4",
      taskId: "t2",
      taskTitle: "Apply to SWE Internships",
      start: getRelativeDate(-1, "21:00"),
      end: getRelativeDate(-1, "23:00"),
      duration: 2,
      status: "missed" // Demonstates a missed session for Self-Healing
    },
    {
      id: "s5",
      taskId: "t4",
      taskTitle: "LeetCode Daily Practice",
      start: getRelativeDate(0, "22:00"),
      end: getRelativeDate(0, "23:30"),
      duration: 1.5,
      status: "scheduled"
    }
  ],
  gmailCommitments: [
    {
      id: "gm1",
      sender: "Prof. Smith",
      subject: "CS-301 Midterm Project Reminder",
      snippet: "Hi class, just a reminder that the final graph algorithm project is due on Friday at 5:00 PM. No late submissions.",
      date: getRelativeDate(-1, "08:15"),
      status: "imported",
      extractedTask: {
        title: "Data Structures Project",
        description: "Complete graph algorithms implementation.",
        deadline: getRelativeDate(4, "17:00"),
        importance: "high",
        estimatedEffort: 8,
        category: "study"
      }
    },
    {
      id: "gm2",
      sender: "Google Careers",
      subject: "Google SWE Internship - Next Steps",
      snippet: "Hi Raj, thank you for your application to the 2027 SWE Internship. Please complete the online assessment within the next 48 hours.",
      date: getRelativeDate(-1, "14:20"),
      status: "discovered",
      extractedTask: {
        title: "Complete Google OA",
        description: "Take the 90-minute online coding assessment.",
        deadline: getRelativeDate(1, "14:00"),
        importance: "critical",
        estimatedEffort: 2,
        category: "career"
      }
    },
    {
      id: "gm3",
      sender: "Priya",
      subject: "Reservations for Thursday!",
      snippet: "Hey! I got the reservations at the Italian place for Thursday night at 7:30. Super excited! Don't be late.",
      date: getRelativeDate(-2, "06:00"),
      status: "discovered",
      extractedTask: {
        title: "Dinner",
        description: "Dinner downtown at 7:30 PM.",
        deadline: getRelativeDate(3, "19:30"),
        importance: "medium",
        estimatedEffort: 2.5,
        category: "personal"
      }
    }
  ],
  notifications: [
    {
      id: "n1",
      title: "Risk Alert: Internship Applications",
      message: "You missed your application session yesterday. Current completion probability is 32% if you don't reschedule soon.",
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
      message: "Detected inactive LeetCode session yesterday. Schedule automatically updated to fit before gym today.",
      type: "recovery",
      timestamp: getRelativeDate(0, "09:00"),
      read: true,
      actionable: false
    }
  ],
  riskAssessments: [
    {
      taskId: "t1",
      probability: 88,
      status: "on_track",
      reason: "Most of your scheduled blocks are intact and you're keeping up with the project pace.",
      calculatedAt: getRelativeDate(0, "10:00")
    },
    {
      taskId: "t2",
      probability: 32,
      status: "likely_to_miss",
      reason: "You missed yesterday's application block. High risk of missing the target for this week.",
      calculatedAt: getRelativeDate(0, "10:00")
    },
    {
      taskId: "t3",
      probability: 99,
      status: "on_track",
      reason: "Calendar block is secure, no overlaps with other heavy tasks.",
      calculatedAt: getRelativeDate(0, "10:00")
    },
    {
      taskId: "t4",
      probability: 85,
      status: "on_track",
      reason: "Short session scheduled tonight. Low risk.",
      calculatedAt: getRelativeDate(0, "10:00")
    }
  ],
  rescheduleLogs: [
    {
      id: "r1",
      timestamp: getRelativeDate(0, "09:00"),
      taskId: "t2",
      taskTitle: "Apply to SWE Internships",
      reason: "Missed scheduled session yesterday evening.",
      originalSessions: [
        { start: getRelativeDate(-1, "18:00"), end: getRelativeDate(-1, "20:00") }
      ],
      newSessions: [
        { start: getRelativeDate(1, "19:00"), end: getRelativeDate(1, "21:00") }
      ]
    }
  ]
};

export function readDb(uid: string = 'default'): AppDatabase {
  try {
    const userFile = path.join(DB_DIR, `db_${uid}.json`);
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(userFile)) {
      if (uid !== 'default' && fs.existsSync(DB_FILE)) {
        try {
          const raw = fs.readFileSync(DB_FILE, 'utf-8');
          fs.writeFileSync(userFile, raw, 'utf-8');
          return JSON.parse(raw);
        } catch (e) {
          // fallback
        }
      }
      writeDb(defaultDatabase, uid);
      return defaultDatabase;
    }
    const raw = fs.readFileSync(userFile, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to read database for user ${uid}, resetting to seed data:`, err);
    return defaultDatabase;
  }
}

export function writeDb(data: AppDatabase, uid: string = 'default'): void {
  try {
    const userFile = path.join(DB_DIR, `db_${uid}.json`);
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(userFile, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Failed to write to database for user ${uid}:`, err);
  }
}

export function updateDb(updater: (data: AppDatabase) => void, uid: string = 'default'): AppDatabase {
  const db = readDb(uid);
  updater(db);
  writeDb(db, uid);
  return db;
}
