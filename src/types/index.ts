/**
 * Last Minute Life Saver - Types and Interfaces
 */

export type ImportanceLevel = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'missed';
export type SessionStatus = 'scheduled' | 'completed' | 'missed';
export type MetricRiskStatus = 'on_track' | 'at_risk' | 'likely_to_miss';
export type NotificationType = 'risk' | 'schedule_change' | 'deadline' | 'missed' | 'recovery' | 'goal' | 'accountability';

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string; // ISO String
  importance: ImportanceLevel;
  estimatedEffort: number; // in hours
  remainingEffort: number; // in hours
  category: string; // E.g., 'career', 'study', 'health', 'finance', 'project'
  status: TaskStatus;
  isSystemGenerated?: boolean;
  postponeCount: number;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  category: string;
  targetValue: number;
  currentValue: number;
  unit: string; // E.g., 'problems', 'pages', 'sessions'
  deadline: string;
  completionPrediction: number; // 0 - 100 percentage
  progressHistory: {
    date: string; // YYYY-MM-DD
    value: number;
  }[];
}

export interface Habit {
  id: string;
  title: string;
  frequency: 'daily' | 'weekly';
  streak: number;
  lastCompleted?: string; // YYYY-MM-DD
  category: string;
  history: {
    date: string; // YYYY-MM-DD
    completed: boolean;
  }[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO String
  end: string; // ISO String
  category: 'work' | 'personal' | 'commute' | 'study' | 'meeting' | 'deep_work';
  taskId?: string; // Optional reference to a Task
  travelTime?: number; // Estimated travel time in minutes
  commuteBlocked?: boolean;
  isCommuteStub?: boolean;
}

export interface ScheduledSession {
  id: string;
  taskId: string;
  taskTitle: string;
  start: string; // ISO String
  end: string; // ISO String
  duration: number; // in hours
  status: SessionStatus;
}

export interface GmailCommitment {
  id: string;
  sender: string;
  subject: string;
  snippet: string;
  date: string;
  status: 'discovered' | 'imported' | 'ignored';
  extractedTask?: {
    title: string;
    description: string;
    deadline: string;
    importance: ImportanceLevel;
    estimatedEffort: number;
    category: string;
  };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string; // ISO String
  read: boolean;
  actionable?: boolean;
  actionId?: string; // e.g. taskId
  actionType?: 'view_task' | 'heal_schedule' | 'view_goal' | 'start_session';
}

export interface RiskAssessment {
  taskId: string;
  probability: number; // 0 - 100%
  status: MetricRiskStatus;
  reason: string;
  calculatedAt: string;
}

export interface Analytics {
  completedTasks: number;
  missedTasks: number;
  completionRate: number; // percentage
  deepWorkHours: number;
  focusTime: number; // in mins
  meetingTime: number; // in mins
  productivityScore: number; // 0 - 100
  goalProgress: number; // average status
  categoryBreakdown: { [category: string]: number };
  weeklyTrends: {
    week: string; // E.g., "Mon", "Tue"
    completed: number;
    missed: number;
    deepWork: number;
  }[];
  hourlyProductivity: {
    hour: string; // E.g., "09:00", "14:00"
    score: number;
  }[];
}

export interface RescheduleLog {
  id: string;
  timestamp: string;
  taskId: string;
  taskTitle: string;
  reason: string;
  originalSessions: { start: string; end: string }[];
  newSessions: { start: string; end: string }[];
}

export interface AppDatabase {
  tasks: Task[];
  goals: Goal[];
  habits: Habit[];
  calendarEvents: CalendarEvent[];
  scheduledSessions: ScheduledSession[];
  gmailCommitments: GmailCommitment[];
  notifications: Notification[];
  riskAssessments: RiskAssessment[];
  rescheduleLogs: RescheduleLog[];
  userProfile: {
    name: string;
    email: string;
    avatarUrl: string;
    joinedDate: string;
    lastActive: string;
  };
}
