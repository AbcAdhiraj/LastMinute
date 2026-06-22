import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, SearchCode, Calendar, ArrowRight, ShieldCheck, RefreshCw, AlertTriangle, Play } from 'lucide-react';
import { GmailCommitment } from '../types';

interface InboxPanelProps {
  commitments: GmailCommitment[];
  onCommitmentImported: () => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
}

export function InboxPanel({ commitments, onCommitmentImported, isLoading, setIsLoading }: InboxPanelProps) {
  const [data, setData] = useState<GmailCommitment[]>(commitments);
  const [localScanning, setLocalScanning] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setData(commitments);
  }, [commitments]);

  const handleScanInbox = async () => {
    setLocalScanning(true);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/gmail-commitments/discover', { method: 'POST' });
      const parsed = await res.json();
      if (parsed.success) {
        setData(parsed.commitments);
        setSuccessMsg(parsed.message || "Inbox scanned successfully!");
        onCommitmentImported(); // triggers parent database reload
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLocalScanning(false);
    }
  };

  const handleImport = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/gmail-commitments/import/${id}`, { method: 'POST' });
      const parsed = await res.json();
      if (parsed.success) {
        setSuccessMsg(`"${parsed.task.title}" imported successfully from email! Scheduling buffers configured immediately.`);
        // Reload inbox lists
        const freshRes = await fetch('/api/gmail-commitments');
        const freshData = await freshRes.json();
        setData(freshData);
        onCommitmentImported(); // reload home view tasks
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-stone-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-stone-850 tracking-tight flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-600" />
            AI Commitment Discovery (Gmail Scan)
          </h2>
          <p className="text-xs text-stone-500 mt-1 font-medium">
            Last Minute Life Saver uses Gemini Pro models to continuously scan your email threads, pull deadlines, and predict risks.
          </p>
        </div>
        <button
          onClick={handleScanInbox}
          disabled={localScanning || isLoading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm border border-indigo-650 shrink-0 self-start md:self-auto"
        >
          {localScanning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Scanning Inbox...
            </>
          ) : (
            <>
              <SearchCode className="w-4 h-4 text-indigo-100" />
              Scan Inbox with Gemini
            </>
          )}
        </button>
      </div>

      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-150 text-emerald-800 p-4 rounded-lg text-xs leading-relaxed shadow-sm font-medium"
        >
          {successMsg}
        </motion.div>
      )}

      {/* Commitments lists */}
      <div className="grid grid-cols-1 gap-4">
        {data.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-stone-200/80 space-y-3 shadow-xs">
            <Mail className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="text-xs text-stone-400 font-mono font-semibold">No commitments discovered in mailbox yet.</p>
            <button
              onClick={handleScanInbox}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold hover:underline inline-block font-mono cursor-pointer"
            >
              Run initial scan to find threads &gt;
            </button>
          </div>
        ) : (
          data.map((comm) => (
            <motion.div
              key={comm.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-xl border transition-all ${
                comm.status === 'imported'
                  ? 'bg-stone-50/50 border-stone-200 opacity-80'
                  : 'bg-white border-stone-200/85 hover:border-stone-300 shadow-sm'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Email details */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] bg-stone-50 text-stone-600 font-mono px-2 py-0.5 rounded-full border border-stone-200 font-bold">
                      From: {comm.sender}
                    </span>
                    <span className="text-[9px] font-mono font-semibold text-stone-400">{new Date(comm.date).toLocaleDateString()}</span>
                    {comm.status === 'imported' && (
                      <span className="text-[9px] bg-emerald-100/80 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200 font-mono">
                        IMPORTED & SCHEDULED
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-stone-850">{comm.subject}</h3>
                  <p className="text-xs text-stone-550 italic block leading-relaxed max-w-4xl bg-stone-50/70 p-3 rounded-lg border border-stone-150/70 font-medium">
                    "{comm.snippet}"
                  </p>
                </div>

                {/* Extracted block or import trigger */}
                <div className="lg:w-80 flex flex-col justify-between bg-stone-50/60 p-4 rounded-lg border border-stone-200/80 shadow-xs">
                  {comm.extractedTask ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-stone-200/60 pb-2">
                        <span className="text-[10px] font-bold font-mono tracking-wider text-indigo-700 uppercase">AI Extracted Task</span>
                        <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                          comm.extractedTask.importance === 'critical' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                          comm.extractedTask.importance === 'high' ? 'bg-amber-100 text-amber-805 border-amber-200' :
                          'bg-indigo-100 text-indigo-805 border-indigo-200'
                        }`}>
                          {comm.extractedTask.importance}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <p className="font-bold text-stone-850 truncate">{comm.extractedTask.title}</p>
                        <p className="text-[10px] text-stone-500 font-medium leading-normal line-clamp-2">{comm.extractedTask.description}</p>
                        
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200/40 text-[10px] font-mono text-stone-500 font-bold">
                          <div>
                            <span className="text-stone-405 block text-[9px] font-bold uppercase">Effort Budget</span>
                            <span className="text-stone-800 font-extrabold">{comm.extractedTask.estimatedEffort} Hours</span>
                          </div>
                          <div>
                            <span className="text-stone-405 block text-[9px] font-bold uppercase">Deadline</span>
                            <span className="text-stone-800 font-extrabold">{new Date(comm.extractedTask.deadline).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {comm.status !== 'imported' ? (
                        <button
                          onClick={() => handleImport(comm.id)}
                          disabled={isLoading}
                          className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm border border-indigo-650"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Import & Autoplan Schedule
                        </button>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 text-emerald-700 font-mono text-[10px] font-bold pt-2">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Task and study limits locked</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-stone-400">
                      <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                      <p className="text-[11px] font-mono leading-normal font-medium">
                        This email thread contains unextracted tasks. Click Scan input.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
