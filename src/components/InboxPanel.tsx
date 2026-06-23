import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, SearchCode, Calendar, ArrowRight, ShieldCheck, RefreshCw, AlertTriangle, Play } from 'lucide-react';
import { GmailCommitment } from '../types';

interface InboxPanelProps {
  commitments: GmailCommitment[];
  onCommitmentImported: () => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  onShowToast?: (msg: string) => void;
}

export function InboxPanel({ commitments, onCommitmentImported, isLoading, setIsLoading, onShowToast }: InboxPanelProps) {
  const [data, setData] = useState<GmailCommitment[]>(commitments);
  const [localScanning, setLocalScanning] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setData(commitments);
  }, [commitments]);

  const handleScanInbox = async () => {
    setLocalScanning(true);
    setSuccessMsg(null);
    onShowToast?.("Contacting Gemini 3.5 Flash to inspect academic emails...");
    try {
      const res = await fetch('/api/gmail-commitments/discover', { method: 'POST' });
      const parsed = await res.json();
      if (parsed.success) {
        setData(parsed.commitments);
        setSuccessMsg(parsed.message || "Inbox scanned successfully!");
        onShowToast?.("Gmail scan complete! Discovered new action plans.");
        onCommitmentImported(); // triggers parent database reload
      } else {
        onShowToast?.("Scan complete but no new commitments were identified.");
      }
    } catch (err) {
      console.error(err);
      onShowToast?.("Gmail inbox sync failed due to network difficulty.");
    } finally {
      setLocalScanning(false);
    }
  };

  const handleImport = async (id: string) => {
    setIsLoading(true);
    onShowToast?.("Importing discovered email commitment to active backlog...");
    try {
      const res = await fetch(`/api/gmail-commitments/import/${id}`, { method: 'POST' });
      const parsed = await res.json();
      if (parsed.success) {
        const titleText = parsed.task?.title || "Commitment";
        setSuccessMsg(`"${titleText}" imported successfully from email! Scheduling buffers configured immediately.`);
        onShowToast?.(`Imported "${titleText}" to active tasks and scheduled preparatory slots!`);
        // Reload inbox lists
        const freshRes = await fetch('/api/gmail-commitments');
        const freshData = await freshRes.json();
        setData(freshData);
        onCommitmentImported(); // reload home view tasks
      } else {
        onShowToast?.("Extraction payload missing fields. Try manually entering.");
      }
    } catch (err) {
      console.error(err);
      onShowToast?.("Task importing failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-br from-[#0c0c0c] to-black border border-neutral-850 p-6 rounded-xl shadow-2xl">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-400" />
            AI Commitment Discovery (Gmail Scan)
          </h2>
          <p className="text-xs text-neutral-400 mt-1 font-medium leading-relaxed">
            Last Minute Life Saver uses Gemini Pro models to continuously scan your email threads, pull deadlines, and predict risks.
          </p>
        </div>
        <button
          onClick={handleScanInbox}
          disabled={localScanning || isLoading}
          className="bg-neutral-900 hover:bg-neutral-800 text-neutral-200 font-bold text-xs px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md border border-neutral-750 shrink-0 self-start md:self-auto"
        >
          {localScanning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
              Scanning Inbox...
            </>
          ) : (
            <>
              <SearchCode className="w-4 h-4 text-blue-404" />
              Scan Inbox with Gemini
            </>
          )}
        </button>
      </div>

      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-950/25 border border-emerald-900/40 text-emerald-400 p-4 rounded-lg text-xs leading-relaxed shadow-md font-medium"
        >
          {successMsg}
        </motion.div>
      )}

      {/* Commitments lists */}
      <div className="grid grid-cols-1 gap-4">
        {data.length === 0 ? (
          <div className="text-center py-12 bg-neutral-950 rounded-xl border border-neutral-855 space-y-3 shadow-md">
            <Mail className="w-10 h-10 text-neutral-650 mx-auto" />
            <p className="text-xs text-neutral-450 font-mono font-semibold">No commitments discovered in mailbox yet.</p>
            <button
              onClick={handleScanInbox}
              className="text-xs text-blue-400 hover:text-blue-300 font-bold hover:underline inline-block font-mono cursor-pointer"
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
                  ? 'bg-neutral-950/30 border-neutral-900 opacity-70'
                  : 'bg-gradient-to-br from-[#0c0c0c] to-black border-neutral-850 hover:border-neutral-800 shadow-md'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Email details */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] bg-neutral-900 text-neutral-300 font-mono px-2 py-0.5 rounded-full border border-neutral-800 font-bold">
                      From: {comm.sender}
                    </span>
                    <span className="text-[9px] font-mono font-semibold text-neutral-500">{new Date(comm.date).toLocaleDateString()}</span>
                    {comm.status === 'imported' && (
                      <span className="text-[9px] bg-emerald-950/25 text-emerald-450 font-bold px-2 py-0.5 rounded border border-emerald-900/40 font-mono">
                        IMPORTED & SCHEDULED
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-white">{comm.subject}</h3>
                  <p className="text-xs text-neutral-400 italic block leading-relaxed max-w-4xl bg-neutral-950 border border-neutral-900/60 p-3 rounded-lg font-medium">
                    "{comm.snippet}"
                  </p>
                </div>

                {/* Extracted block or import trigger */}
                <div className="lg:w-80 flex flex-col justify-between bg-neutral-900/60 p-4 rounded-lg border border-neutral-850 shadow-xs">
                  {comm.extractedTask ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-neutral-805/80 pb-2">
                        <span className="text-[10px] font-bold font-mono tracking-wider text-blue-400 uppercase">AI Extracted Task</span>
                        <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                          comm.extractedTask.importance === 'critical' ? 'bg-red-955/20 text-red-400 border-red-900/50' :
                          comm.extractedTask.importance === 'high' ? 'bg-orange-955/20 text-orange-400 border-orange-900/50' :
                          'bg-blue-955/20 text-blue-400 border-blue-900/50'
                        }`}>
                          {comm.extractedTask.importance}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <p className="font-bold text-white truncate">{comm.extractedTask.title}</p>
                        <p className="text-[10px] text-neutral-400 font-medium leading-normal line-clamp-2">{comm.extractedTask.description}</p>
                        
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-808/50 text-[10px] font-mono text-neutral-400 font-bold">
                          <div>
                            <span className="text-neutral-500 block text-[9px] font-bold uppercase">Effort Budget</span>
                            <span className="text-white font-extrabold">{comm.extractedTask.estimatedEffort} Hours</span>
                          </div>
                          <div>
                            <span className="text-neutral-500 block text-[9px] font-bold uppercase">Deadline</span>
                            <span className="text-white font-extrabold">{new Date(comm.extractedTask.deadline).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {comm.status !== 'imported' ? (
                        <button
                          onClick={() => handleImport(comm.id)}
                          disabled={isLoading}
                          className="w-full mt-3 bg-gradient-to-r from-neutral-200 via-white to-neutral-200 hover:brightness-95 text-black font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Import & Autoplan Schedule
                        </button>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-mono text-[10px] font-bold pt-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-450" />
                          <span>Task and study limits locked</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-neutral-500">
                      <AlertTriangle className="w-5 h-5 text-orange-400 mx-auto mb-2 animate-pulse" />
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
