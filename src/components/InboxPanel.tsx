import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, SearchCode, Calendar, ArrowRight, ShieldCheck, RefreshCw, AlertTriangle, Play } from 'lucide-react';
import { GmailCommitment } from '../types';
import { apiFetch } from '../utils/api';

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
      const res = await apiFetch('/api/gmail-commitments/discover', { method: 'POST' });
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
      const res = await apiFetch(`/api/gmail-commitments/import/${id}`, { method: 'POST' });
      const parsed = await res.json();
      if (parsed.success) {
        const titleText = parsed.task?.title || "Commitment";
        setSuccessMsg(`"${titleText}" imported successfully from email! Scheduling buffers configured immediately.`);
        onShowToast?.(`Imported "${titleText}" to active tasks and scheduled preparatory slots!`);
        // Reload inbox lists
        const freshRes = await apiFetch('/api/gmail-commitments');
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border-4 border-black p-6 rounded-xl neo-shadow-black text-black">
        <div>
          <h2 className="text-lg font-black text-black tracking-tight flex items-center gap-2 uppercase">
            <Mail className="w-5 h-5 text-black" />
            AI Commitment Discovery (Gmail Scan)
          </h2>
          <p className="text-xs text-black/70 mt-1 font-bold leading-relaxed">
            Cludder uses Gemini Pro models to continuously scan your email threads, pull deadlines, and predict risks.
          </p>
        </div>
        <button
          onClick={handleScanInbox}
          disabled={localScanning || isLoading}
          className="bg-[#98e2ff] hover:bg-[#85d3f0] text-black font-black text-xs px-4 py-2.5 rounded border-2 border-black flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer neo-shadow-black-sm active:translate-y-0.5 shrink-0 self-start md:self-auto"
        >
          {localScanning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-black" />
              Scanning Inbox...
            </>
          ) : (
            <>
              <SearchCode className="w-4 h-4 text-black" />
              Scan Inbox with Gemini
            </>
          )}
        </button>
      </div>

      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#b8f598] border-2 border-black text-black p-4 rounded text-xs leading-relaxed font-black"
        >
          {successMsg}
        </motion.div>
      )}

      {/* Commitments lists */}
      <div className="grid grid-cols-1 gap-4">
        {data.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border-4 border-black space-y-3 neo-shadow-black text-black">
            <Mail className="w-10 h-10 text-black mx-auto" />
            <p className="text-xs text-black/60 font-mono font-black">No commitments discovered in mailbox yet.</p>
            <button
              onClick={handleScanInbox}
              className="text-xs text-black bg-[#fff582] px-3 py-1 border-2 border-black rounded hover:bg-[#ffe050] font-mono font-black cursor-pointer shadow-xs active:translate-y-0.5"
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
              className={`p-5 rounded-xl border-2 border-black transition-all ${
                comm.status === 'imported'
                  ? 'bg-neutral-100/60 border-neutral-300 opacity-70'
                  : 'bg-white border-2 border-black hover:bg-[#fffdf2] neo-shadow-black-sm text-black'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Email details */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] bg-white text-black font-mono px-2 py-0.5 rounded border-2 border-black font-black">
                      From: {comm.sender}
                    </span>
                    <span className="text-[9px] font-mono font-black text-black/50">{new Date(comm.date).toLocaleDateString()}</span>
                    {comm.status === 'imported' && (
                      <span className="text-[9px] bg-[#b8f598] text-black font-black px-2 py-0.5 rounded border-2 border-black font-mono">
                        IMPORTED & SCHEDULED
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-black text-black">{comm.subject}</h3>
                  <p className="text-xs text-black italic block leading-relaxed max-w-4xl bg-[#dfbeff]/10 border-2 border-black/80 p-3 rounded font-bold">
                    "{comm.snippet}"
                  </p>
                </div>

                {/* Extracted block or import trigger */}
                <div className="lg:w-80 flex flex-col justify-between bg-white p-4 rounded border-2 border-black neo-shadow-black-sm text-black">
                  {comm.extractedTask ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b-2 border-black pb-2">
                        <span className="text-[10px] font-black font-mono tracking-tight text-black uppercase">AI Extracted Task</span>
                        <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded border-2 border-black ${
                          comm.extractedTask.importance === 'critical' ? 'bg-[#ff6161] text-black' :
                          comm.extractedTask.importance === 'high' ? 'bg-[#ffa852] text-black' :
                          'bg-[#98e2ff] text-black'
                        }`}>
                          {comm.extractedTask.importance}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <p className="font-black text-black truncate">{comm.extractedTask.title}</p>
                        <p className="text-[10px] text-black/70 font-bold leading-normal line-clamp-2">{comm.extractedTask.description}</p>
                        
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t-2 border-black text-[10px] font-mono text-black/70 font-black">
                          <div>
                            <span className="text-black/60 block text-[9px] font-black uppercase">Effort Budget</span>
                            <span className="text-black font-black">{comm.extractedTask.estimatedEffort} Hours</span>
                          </div>
                          <div>
                            <span className="text-black/60 block text-[9px] font-black uppercase">Deadline</span>
                            <span className="text-black font-black">{new Date(comm.extractedTask.deadline).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {comm.status !== 'imported' ? (
                        <button
                          onClick={() => handleImport(comm.id)}
                          disabled={isLoading}
                          className="w-full mt-3 bg-[#b8f598] hover:bg-[#a0e080] text-black font-black text-xs py-2.5 rounded border-2 border-black flex items-center justify-center gap-1.5 transition-all cursor-pointer neo-shadow-black-sm active:translate-y-0.5"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Import & Autoplan Schedule
                        </button>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 text-black font-mono text-[10px] font-black pt-2 bg-[#b8f598]/50 border-2 border-dashed border-black/40 rounded py-1">
                          <ShieldCheck className="w-4 h-4 text-black" />
                          <span>Task and study limits locked</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-black/50">
                      <AlertTriangle className="w-5 h-5 text-black mx-auto mb-2 animate-pulse" />
                      <p className="text-[11px] font-mono leading-normal font-black">
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
