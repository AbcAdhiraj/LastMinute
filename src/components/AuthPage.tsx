import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { apiFetch } from '../utils/api';
import { 
  Sparkles, Compass, Clock, CheckSquare, Target, Flame, 
  ArrowRight, ArrowLeft, Key, Mail, User, ShieldAlert
} from 'lucide-react';
import { AppDatabase, Task, Goal, Habit, CalendarEvent, ScheduledSession, GmailCommitment, Notification, RiskAssessment, RescheduleLog } from '../types';

interface AuthPageProps {
  onAuthComplete: (user: any, database: AppDatabase) => void;
}

export function AuthPage({ onAuthComplete }: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Onboarding States
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [tempUser, setTempUser] = useState<any>(null);

  // Onboarding Form States
  const [activeTarget, setActiveTarget] = useState('IIT Kharagpur Semester Prep');
  const [customTarget, setCustomTarget] = useState('');
  const [focusPeriod, setFocusPeriod] = useState('evening'); // morning, afternoon, evening, night
  const [focusHours, setFocusHours] = useState(4);
  const [initialTaskTitle, setInitialTaskTitle] = useState('Operating Systems Assignment');
  const [initialTaskDeadline, setInitialTaskDeadline] = useState('2026-06-26');
  const [initialTaskEffort, setInitialTaskEffort] = useState(6);
  const [initialTaskCategory, setInitialTaskCategory] = useState('study');

  const handleAuthError = (err: any) => {
    console.error(err);
    if (err.code === 'auth/email-already-in-use') {
      setError('This email is already registered.');
    } else if (err.code === 'auth/weak-password') {
      setError('Password must be at least 6 characters long.');
    } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
      setError('Invalid email or password.');
    } else if (err.code === 'auth/invalid-email') {
      setError('Please provide a valid email address.');
    } else if (err.code === 'auth/operation-not-allowed') {
      setError('Firebase Email/Password Authentication is not enabled in your Firebase Console. You can go to the Firebase Console to enable it, or click the Sandbox Mode button below to log in instantly without Firebase setup!');
    } else {
      setError(err.message || 'An error occurred during authentication.');
    }
  };

  const checkOnboardingStatus = async (user: any) => {
    setIsLoading(true);
    try {
      // 1. Try reading directly from Firestore client-side first
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as AppDatabase;
        onAuthComplete(user, data);
        return;
      }
    } catch (err: any) {
      console.warn("Client-side Firestore read failed (client might be offline or blocked by iframe). Trying server-side fetch...", err);
    }

    // 2. Fallback: Check user's profile on the server-side
    try {
      const res = await apiFetch('/api/profile', {
        headers: { 'x-user-uid': user.uid }
      });
      if (res.ok) {
        const data = await res.json();
        // If the user's database is actually set up on the server side (not just fallback default)
        if (data && data.userProfile && data.userProfile.email === user.email) {
          onAuthComplete(user, data as AppDatabase);
          return;
        }
      }
    } catch (serverErr) {
      console.error("Server-side profile fetch fallback failed:", serverErr);
    }

    // 3. New user / Not found: Go to onboarding flow
    setTempUser(user);
    setIsOnboarding(true);
    setOnboardingStep(1);
    setIsLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await checkOnboardingStatus(userCredential.user);
    } catch (err: any) {
      handleAuthError(err);
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password || !fullName) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Proceed to onboarding
      setTempUser(userCredential.user);
      setIsOnboarding(true);
      setOnboardingStep(1);
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      setFullName(userCredential.user.displayName || '');
      await checkOnboardingStatus(userCredential.user);
    } catch (err: any) {
      handleAuthError(err);
      setIsLoading(false);
    }
  };

  const handleSandboxSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    const finalEmail = (email || 'guest@local.dev').trim();
    const finalName = fullName || email.split('@')[0] || 'Local Explorer';
    
    setIsLoading(true);
    try {
      // Create a deterministic local-user ID from email
      const cleanEmail = finalEmail.toLowerCase();
      let hash = 0;
      for (let i = 0; i < cleanEmail.length; i++) {
        hash = (hash << 5) - hash + cleanEmail.charCodeAt(i);
        hash |= 0;
      }
      const uid = 'sandbox_' + Math.abs(hash).toString(36);
      
      const simulatedUser = {
        uid,
        email: finalEmail,
        displayName: finalName,
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
        isSandbox: true
      };
      
      localStorage.setItem('life-saver-sandbox-uid', uid);
      localStorage.setItem('life-saver-sandbox-user', JSON.stringify(simulatedUser));
      
      // Attempt to load existing profile database
      const res = await apiFetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        if (data && data.tasks && data.tasks.length > 0) {
          // User already has a populated database on the server side, sign in directly!
          onAuthComplete(simulatedUser, data);
          return;
        }
      }
      
      // No existing data or fallback required, run through onboarding
      setTempUser(simulatedUser);
      setIsOnboarding(true);
      setOnboardingStep(1);
    } catch (err: any) {
      console.error("Sandbox authentication failed:", err);
      setError("An error occurred entering Sandbox Mode. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Onboarding database seed construction
  const handleOnboardingComplete = async () => {
    setIsLoading(true);
    try {
      const finalTarget = activeTarget === 'other' ? customTarget : activeTarget;
      
      // Seed relative dates based on current local time
      const getRelativeSeedDate = (days: number, hourStr: string = "00:00") => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        const [hours, mins] = hourStr.split(':').map(Number);
        d.setHours(hours, mins, 0, 0);
        return d.toISOString();
      };

      // 1. Initial Task
      const initialTask: Task = {
        id: "task_init_" + Math.random().toString(36).substr(2, 9),
        title: initialTaskTitle || "Get Started with Onboarding Plan",
        description: `Set up initial focus blocks and launch study buffers for ${finalTarget}.`,
        deadline: new Date(initialTaskDeadline).toISOString(),
        importance: "high",
        estimatedEffort: Number(initialTaskEffort),
        remainingEffort: Number(initialTaskEffort),
        category: initialTaskCategory,
        status: "pending",
        postponeCount: 0,
        createdAt: new Date().toISOString()
      };

      // 2. Initial Risk Assessment
      const initialRisk: RiskAssessment = {
        taskId: initialTask.id,
        probability: 78,
        status: 'on_track',
        reason: `Your estimated effort (${initialTaskEffort}h) matches your peak focus setting (${focusHours}h/day).`,
        calculatedAt: new Date().toISOString()
      };

      // 3. Preset seeds tailored to focus preference
      const presetHabits: Habit[] = [
        {
          id: "h1",
          title: "Peak Routine Focus Block",
          frequency: "daily",
          streak: 1,
          lastCompleted: new Date().toISOString().split('T')[0],
          category: "study",
          history: [{ date: new Date().toISOString().split('T')[0], completed: true }]
        },
        {
          id: "h2",
          title: "Daily Stretch & Recover",
          frequency: "daily",
          streak: 0,
          category: "health",
          history: []
        }
      ];

      const presetGoals: Goal[] = [
        {
          id: "g1",
          title: `Succeed in ${finalTarget}`,
          category: "career",
          targetValue: 100,
          currentValue: 10,
          unit: "% progress",
          deadline: getRelativeSeedDate(30),
          completionPrediction: 85,
          progressHistory: [{ date: new Date().toISOString().split('T')[0], value: 10 }]
        }
      ];

      // Build scheduled sessions in their peak hour period
      let peakHourStart = 18; // default evening
      if (focusPeriod === 'morning') peakHourStart = 9;
      else if (focusPeriod === 'afternoon') peakHourStart = 13;
      else if (focusPeriod === 'night') peakHourStart = 21;

      const getPeakISO = (dayOffset: number, startH: number) => {
        const d = new Date();
        d.setDate(d.getDate() + dayOffset);
        d.setHours(startH, 0, 0, 0);
        return d.toISOString();
      };

      const getPeakEndISO = (dayOffset: number, startH: number, duration: number) => {
        const d = new Date();
        d.setDate(d.getDate() + dayOffset);
        d.setHours(startH + duration, 0, 0, 0);
        return d.toISOString();
      };

      const initialSession: ScheduledSession = {
        id: "sess_init_" + Math.random().toString(36).substr(2, 9),
        taskId: initialTask.id,
        taskTitle: initialTask.title,
        start: getPeakISO(1, peakHourStart),
        end: getPeakEndISO(1, peakHourStart, 2),
        duration: 2,
        status: "scheduled"
      };

      const initialCalendarEvent: CalendarEvent = {
        id: "evt_init_" + Math.random().toString(36).substr(2, 9),
        title: `Study: ${initialTask.title}`,
        start: initialSession.start,
        end: initialSession.end,
        category: "deep_work",
        taskId: initialTask.id
      };

      // Gmail seed discovery
      const presetGmailCommitments: GmailCommitment[] = [
        {
          id: "gm_init_1",
          sender: "Academic Counselor",
          subject: `${finalTarget} Syllabus Overview`,
          snippet: `Welcome to your academic syllabus prep! Here is the checklist to track and keep alignment for the semester goals. Make sure to complete initial logs.`,
          date: new Date().toISOString(),
          status: "discovered",
          extractedTask: {
            title: `Syllabus Review: ${finalTarget}`,
            description: "Go through requirements list and schedule necessary deep study.",
            deadline: getRelativeSeedDate(5),
            importance: "medium",
            estimatedEffort: 2,
            category: "study"
          }
        }
      ];

      const presetNotification: Notification = {
        id: "notif_init_1",
        title: "Welcome onboard!",
        message: `Last Minute Life Saver initialized for ${finalTarget}. We scheduled a study block during your preferred ${focusPeriod} peak focus time.`,
        type: "accountability",
        timestamp: new Date().toISOString(),
        read: false
      };

      // Complete Database Structure
      const newDatabase: AppDatabase = {
        userProfile: {
          name: fullName || tempUser.displayName || tempUser.email.split('@')[0],
          email: tempUser.email,
          avatarUrl: tempUser.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(tempUser.email)}`,
          joinedDate: new Date().toISOString().split('T')[0],
          lastActive: new Date().toISOString()
        },
        tasks: [initialTask],
        goals: presetGoals,
        habits: presetHabits,
        calendarEvents: [initialCalendarEvent],
        scheduledSessions: [initialSession],
        gmailCommitments: presetGmailCommitments,
        notifications: [presetNotification],
        riskAssessments: [initialRisk],
        rescheduleLogs: []
      };

      // Save to Firestore!
      try {
        await setDoc(doc(db, 'users', tempUser.uid), newDatabase);
      } catch (fsErr) {
        console.warn("Client-side Firestore write failed, trying server-side onboard endpoint...", fsErr);
        const res = await apiFetch('/api/profile/onboard', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-uid': tempUser.uid
          },
          body: JSON.stringify(newDatabase)
        });
        if (!res.ok) {
          throw new Error("Both client-side and server-side onboarding persistence failed.");
        }
      }

      // Trigger completion callback
      onAuthComplete(tempUser, newDatabase);
    } catch (err: any) {
      console.error(err);
      setError("Failed to initialize cloud user space. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f4df] flex flex-col items-center justify-center p-4 text-black font-sans selection:bg-[#ff9ee1]">
      
      {/* Title & Slogan Header block */}
      {!isOnboarding && (
        <div className="text-center mb-8 max-w-xl">
          <div className="inline-flex items-center gap-2 bg-[#dfbeff] px-4 py-1.5 border-4 border-black rounded-lg neo-shadow-black-sm mb-4 animate-bounce">
            <Sparkles className="w-5 h-5 text-black" />
            <span className="font-mono text-xs font-black tracking-widest">COGNITIVE TIME MANAGER</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none mb-3">
            Last Minute <br/>Life Saver
          </h1>
          <p className="text-xs md:text-sm text-black/80 font-mono font-bold leading-relaxed">
            An AI Productivity Chief of Staff that predicts scheduling risks and automatically heals your calendar when you fall behind.
          </p>
        </div>
      )}

      {/* Main card panel */}
      <div className="w-full max-w-lg bg-white border-4 border-black rounded-2xl p-6 sm:p-8 neo-shadow-black relative">
        
        {/* Error notification banner */}
        {error && (
          <div className="bg-[#ff6161] border-2 border-black p-3.5 rounded-lg mb-6 flex items-start gap-2.5 text-xs text-black font-bold">
            <ShieldAlert className="w-5 h-5 shrink-0 text-black stroke-[2.5px]" />
            <p>{error}</p>
          </div>
        )}

        {/* LOADING INDICATOR OVERLAY */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 rounded-xl z-50 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-mono font-black tracking-wide animate-pulse uppercase">Syncing Cloud Database...</p>
          </div>
        )}

        {/* ===================================== */}
        {/* ONBOARDING FLOW SETUP                 */}
        {/* ===================================== */}
        {isOnboarding ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div>
                <span className="text-[10px] font-mono font-black uppercase text-black/60">Step {onboardingStep} of 4</span>
                <h2 className="text-lg font-black uppercase tracking-wide">Personalize Chief of Staff</h2>
              </div>
              <Compass className="w-6 h-6 text-black stroke-[2.5px] animate-spin-slow" />
            </div>

            {/* STEP 1: Introduce Onboarding */}
            {onboardingStep === 1 && (
              <div className="space-y-4">
                <div className="p-4 bg-[#fffccf] border-2 border-black rounded-lg space-y-2">
                  <h3 className="text-sm font-black flex items-center gap-1.5 text-black">
                    <Sparkles className="w-4 h-4 text-black" />
                    Welcome {fullName || 'Productive Champ'}!
                  </h3>
                  <p className="text-xs leading-relaxed text-black/80 font-bold">
                    Let's custom calibrate Goofy AI to your schedule, exam deadlines, or workload speed metrics. This establishes your dedicated Firestore database.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono font-black uppercase tracking-tight block">Confirm Profile Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white border-2 border-black p-3 rounded font-bold text-sm focus:outline-none focus:bg-neutral-50"
                    placeholder="E.g., Adhiraj Tiwari"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: Target Goal focus */}
            {onboardingStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-xs font-mono font-black uppercase tracking-wide">What is your active target?</h3>
                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    { id: 'IIT Kharagpur Semester Prep', label: 'IIT Kharagpur Semester Prep 🎓' },
                    { id: 'LeetCode & FAANG System Design Prep', label: 'LeetCode & FAANG Prep 💻' },
                    { id: 'UPSC Civil Services Preparation', label: 'UPSC Civil Services Exam 🏛️' },
                    { id: 'other', label: 'Custom Goal / Project Prep 🌟' }
                  ].map((target) => (
                    <button
                      key={target.id}
                      onClick={() => setActiveTarget(target.id)}
                      className={`p-3.5 text-left text-xs font-black rounded-lg border-2 border-black transition-all cursor-pointer flex items-center justify-between ${activeTarget === target.id ? 'bg-[#dfbeff] translate-x-[1px] translate-y-[1px] shadow-[1.5px_1.5px_0px_0px_#000000]' : 'bg-white hover:bg-neutral-50'}`}
                    >
                      <span>{target.label}</span>
                    </button>
                  ))}
                </div>

                {activeTarget === 'other' && (
                  <div className="space-y-2 pt-1">
                    <label className="text-xs font-mono font-black uppercase tracking-tight block">Custom Prep Description</label>
                    <input
                      type="text"
                      value={customTarget}
                      onChange={(e) => setCustomTarget(e.target.value)}
                      className="w-full bg-white border-2 border-black p-3 rounded font-bold text-sm focus:outline-none"
                      placeholder="E.g., AWS Architect Certification Prep"
                    />
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Time calibration preferences */}
            {onboardingStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-xs font-mono font-black uppercase tracking-wide">Calibrate Peak Focus Hours</h3>
                <p className="text-[11px] font-mono text-black/60 leading-normal font-bold">
                  Goofy AI maps schedule buffers to periods of optimal cognitive density. Where do you work best?
                </p>

                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'morning', label: 'Morning Block', desc: '9:00 AM - 1:00 PM', color: 'bg-[#b8f598]' },
                    { id: 'afternoon', label: 'Afternoon Zone', desc: '1:00 PM - 5:00 PM', color: 'bg-[#98e2ff]' },
                    { id: 'evening', label: 'Evening Peak', desc: '6:00 PM - 10:00 PM', color: 'bg-[#ffa852]' },
                    { id: 'night', label: 'Night Owl Mode', desc: '10:00 PM - 2:00 AM', color: 'bg-[#ff9ee1]' }
                  ].map((period) => (
                    <button
                      key={period.id}
                      onClick={() => setFocusPeriod(period.id)}
                      className={`p-3 text-left border-2 border-black rounded-lg transition-all cursor-pointer flex flex-col justify-between h-24 ${focusPeriod === period.id ? `${period.color} translate-x-[1px] translate-y-[1px] shadow-[1.5px_1.5px_0px_0px_#000000]` : 'bg-white hover:bg-neutral-50'}`}
                    >
                      <span className="text-xs font-black">{period.label}</span>
                      <span className="text-[10px] font-mono font-bold text-black/60">{period.desc}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center text-xs font-mono font-black">
                    <span>DAILY COMMITMENT BUFFER</span>
                    <span className="bg-[#fffccf] border border-black px-1.5 rounded">{focusHours} HOURS</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={focusHours}
                    onChange={(e) => setFocusHours(Number(e.target.value))}
                    className="w-full accent-black cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* STEP 4: Build Initial Task */}
            {onboardingStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-xs font-mono font-black uppercase tracking-wide">Launch Your First Major Commitment</h3>
                <p className="text-[11px] font-mono text-black/60 leading-normal font-bold">
                  Input one active task or assignment that needs schedule tracking.
                </p>

                <div className="space-y-3.5 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-mono font-black uppercase text-black/60">Task Title</label>
                    <input
                      type="text"
                      value={initialTaskTitle}
                      onChange={(e) => setInitialTaskTitle(e.target.value)}
                      className="w-full bg-white border-2 border-black p-2.5 rounded font-bold text-sm focus:outline-none"
                      placeholder="E.g., Complete neural network assignment"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-mono font-black uppercase text-black/60">Hours Needed</label>
                      <input
                        type="number"
                        value={initialTaskEffort}
                        onChange={(e) => setInitialTaskEffort(Number(e.target.value))}
                        className="w-full bg-white border-2 border-black p-2.5 rounded font-mono font-black text-sm focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-mono font-black uppercase text-black/60">Category</label>
                      <select
                        value={initialTaskCategory}
                        onChange={(e) => setInitialTaskCategory(e.target.value)}
                        className="w-full bg-white border-2 border-black p-2.5 rounded font-black text-sm focus:outline-none"
                      >
                        <option value="study">Study & Classes</option>
                        <option value="career">Job & Career</option>
                        <option value="project">Project Work</option>
                        <option value="health">Fitness & Health</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono font-black uppercase text-black/60">Target Deadline</label>
                    <input
                      type="date"
                      value={initialTaskDeadline}
                      onChange={(e) => setInitialTaskDeadline(e.target.value)}
                      className="w-full bg-white border-2 border-black p-2.5 rounded font-mono font-black text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Stepper Wizard Button controls */}
            <div className="flex items-center justify-between pt-4 border-t-2 border-black">
              {onboardingStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setOnboardingStep(onboardingStep - 1)}
                  className="bg-white hover:bg-neutral-50 border-2 border-black px-4 py-2 rounded text-xs font-mono font-black flex items-center gap-1 cursor-pointer active:translate-y-0.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5px]" />
                  Back
                </button>
              ) : (
                <div />
              )}

              {onboardingStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setOnboardingStep(onboardingStep + 1)}
                  className="bg-[#b8f598] hover:bg-[#a0e080] border-2 border-black px-5 py-2.5 rounded text-xs font-mono font-black flex items-center gap-1 cursor-pointer neo-shadow-black-sm active:translate-y-0.5"
                >
                  Continue
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5px]" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOnboardingComplete}
                  className="bg-[#ffe555] hover:bg-[#ffd111] border-2 border-black px-6 py-2.5 rounded text-xs font-mono font-black flex items-center gap-1 cursor-pointer neo-shadow-black-sm active:translate-y-0.5 animate-pulse"
                >
                  Finish & Synchronize
                  <Sparkles className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ===================================== */
          /* REGULAR LOGIN / REGISTER FORM         */
          /* ===================================== */
          <div>
            <div className="flex items-center justify-center gap-3 border-b-2 border-black pb-4 mb-6">
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setError(''); }}
                className={`flex-1 py-2 font-mono font-black text-sm uppercase rounded transition-all cursor-pointer ${!isSignUp ? 'bg-black text-white' : 'text-black hover:bg-neutral-50'}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setError(''); }}
                className={`flex-1 py-2 font-mono font-black text-sm uppercase rounded transition-all cursor-pointer ${isSignUp ? 'bg-black text-white' : 'text-black hover:bg-neutral-50'}`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
              {isSignUp && (
                <div className="space-y-1.5 text-xs">
                  <label className="font-mono font-black uppercase text-black/60">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-white border-2 border-black py-3 pl-10 pr-3 rounded font-bold text-sm focus:outline-none"
                      placeholder="E.g., Adhiraj Tiwari"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5 text-xs">
                <label className="font-mono font-black uppercase text-black/60">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border-2 border-black py-3 pl-10 pr-3 rounded font-bold text-sm focus:outline-none"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="font-mono font-black uppercase text-black/60">Password</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border-2 border-black py-3 pl-10 pr-3 rounded font-bold text-sm focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {isSignUp && (
                <div className="space-y-1.5 text-xs">
                  <label className="font-mono font-black uppercase text-black/60">Confirm Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-white border-2 border-black py-3 pl-10 pr-3 rounded font-bold text-sm focus:outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#dfbeff] hover:bg-[#c99eff] text-black border-4 border-black font-mono font-black text-sm uppercase py-3 rounded-lg flex items-center justify-center gap-2 transition-all neo-shadow-black-sm cursor-pointer active:translate-y-0.5"
              >
                <span>{isSignUp ? "Sign Up & Start Onboarding" : "Sign In to Dashboard"}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5px]" />
              </button>
            </form>

            <div className="relative flex items-center justify-center my-6">
              <div className="absolute w-full border-t border-black"></div>
              <span className="relative bg-white px-3 font-mono text-[10px] uppercase font-black tracking-wider text-black/50">Or login with</span>
            </div>

            {/* Quick OAuth Provider login option */}
            <button
              onClick={handleGoogleSignIn}
              type="button"
              className="w-full bg-white hover:bg-neutral-50 text-black border-2 border-black font-mono font-black text-xs py-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:translate-y-0.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.86-3.577-7.86-8s3.53-8 7.86-8c2.46 0 4.105 1.025 5.047 1.926l3.245-3.13C18.423 1.91 15.613 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.983 0-.742-.08-1.302-.177-1.712H12.24z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Sandbox Mode fallback option */}
            <button
              onClick={() => handleSandboxSignIn()}
              type="button"
              className="w-full mt-3 bg-[#ffe555] hover:bg-[#ffd111] text-black border-4 border-black font-mono font-black text-xs py-3 rounded-lg flex items-center justify-center gap-2 transition-all neo-shadow-black-sm cursor-pointer active:translate-y-0.5"
            >
              <Sparkles className="w-4 h-4 text-black stroke-[2.5px]" />
              <span>Enter Sandbox Mode (Local & Instant)</span>
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
