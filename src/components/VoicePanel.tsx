import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Volume2, Sparkles, RefreshCw, Radio, PlayCircle, Command, HelpCircle } from 'lucide-react';
import { apiFetch } from '../utils/api';

interface VoicePanelProps {
  onCommandExecuted: () => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
}

export function VoicePanel({ onCommandExecuted, isLoading, setIsLoading }: VoicePanelProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState(false);

  const presets = [
    { text: "Postpone Machine Learning assignment deadline till Saturday", label: "Postpone assignment" },
    { text: "Schedule a leisure block on Thursday night", label: "Book personal space" },
    { text: "Recover schedule for today", label: "Run emergency healing" },
  ];

  const handleVoiceCommandSubmit = async (commandText: string) => {
    setIsLoading(true);
    setTranscription(commandText);
    setReplyText(null);
    try {
      const res = await apiFetch('/api/voice/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: commandText, command: commandText, returnAudio: true })
      });
      const parsed = await res.json();
      
      const textResponse = parsed.reply || parsed.text || parsed.feedback;
      setReplyText(textResponse);
      onCommandExecuted(); // refresh task states

      const audioStr = parsed.audioBase64 || parsed.base64Audio;
      if (audioStr) {
        playBase64Mp3(audioStr);
      }
    } catch (err) {
      console.error(err);
      setReplyText("I was unable to process the audio command matrix. Try checking system routes.");
    } finally {
      setIsLoading(false);
    }
  };

  const playBase64Mp3 = (base64Str: string) => {
    try {
      setPlayingAudio(true);
      const binaryString = window.atob(base64Str);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => setPlayingAudio(false);
      audio.play();
    } catch (e) {
      console.error("Audio WebAPI stream failed", e);
      setPlayingAudio(false);
    }
  };

  const toggleMockRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      // Automatically send a default command after recording ends to demonstrate features
      handleVoiceCommandSubmit("Postpone Machine Learning assignment deadline till Saturday");
    } else {
      setIsRecording(true);
      setTranscription(null);
      setReplyText(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Main interaction canvas */}
      <div className="lg:col-span-2 bg-white border-4 border-black rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-6 neo-shadow-black text-black">
        
        <div>
          <h2 className="text-xs font-black font-mono tracking-wider text-black uppercase">Voice Operating System</h2>
          <p className="text-xs text-black/60 font-mono mt-1 font-bold">Talk to Goofy to edit schedules hands-free</p>
        </div>

        {/* Recording active visualization widget of waves */}
        <div className="h-28 flex items-center justify-center gap-1.5 px-10">
          {isRecording ? (
            <div className="flex items-end gap-1 h-12 w-48">
              {[1, 2, 3, 4, 3, 2, 4, 5, 3, 2, 4, 2, 1, 3, 4, 3, 1].map((val, idx) => (
                <motion.div
                  key={idx}
                  animate={{ height: [`${val * 10}%`, `${val * 20}%`, `${val * 8}%`, `${val * 10}%`] }}
                  transition={{ repeat: Infinity, duration: 1.2 + Math.random() }}
                  className="w-1.5 bg-black rounded shadow-xs"
                />
              ))}
            </div>
          ) : playingAudio ? (
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-black stroke-[2.5px] animate-pulse" />
              <span className="text-[10px] text-black font-mono tracking-wide animate-pulse font-black">PLAYING SPEECH AUDIO FEEDBACK...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 text-black/55">
              <MicOff className="w-8 h-8 opacity-45 text-black" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-black/60 font-black">Speech Idle</span>
            </div>
          )}
        </div>

        {/* Tactile core microphone trigger */}
        <button
          onClick={toggleMockRecording}
          className={`w-16 h-16 rounded-full flex items-center justify-center border-4 border-black transition-all duration-150 relative cursor-pointer ${
            isRecording
              ? 'bg-[#ff6161] text-black animate-pulse shadow-xs'
              : 'bg-[#fff582] hover:bg-[#ffe555] text-black active:scale-95 neo-shadow-black-sm'
          }`}
        >
          {isRecording ? <MicOff className="w-6 h-6 animate-pulse" /> : <Mic className="w-6 h-6 stroke-[2.5px]" />}
        </button>

        <p className="text-[11px] text-black/80 max-w-sm font-mono leading-relaxed font-bold">
          {isRecording ? (
            <span className="text-[#ff6161] font-black animate-pulse">Listening... Click microphone again to send voice command</span>
          ) : (
            "Click record, or use preset widgets below to send rapid cognitive speech commands."
          )}
        </p>

      </div>

      {/* Side list of commands output transcription & audio feedback */}
      <div className="bg-white border-4 border-black rounded-xl p-5 space-y-4 h-fit neo-shadow-black text-black">
        
        <div className="border-b-2 border-black pb-3 text-xs">
          <span className="text-[9px] font-mono font-black tracking-wider text-black uppercase flex items-center gap-1">
            <Command className="w-3.5 h-3.5 text-black stroke-[2.5px] animate-pulse" />
            Transcription Log
          </span>
          <h3 className="text-xs font-black text-black mt-1">Processed Audio Diagnostics</h3>
        </div>

        {/* Presets and shortcut commands list */}
        <div className="space-y-2">
          <span className="text-[9px] uppercase font-black text-black/50 font-mono tracking-wide">Command Presets</span>
          <div className="space-y-2.5">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleVoiceCommandSubmit(preset.text)}
                className="w-full text-left p-3 bg-white border-2 border-black hover:bg-neutral-50 hover:neo-shadow-black-sm text-xs text-black rounded-lg flex items-center justify-between transition-all cursor-pointer neo-shadow-black-sm"
              >
                <div>
                  <p className="font-black text-black">{preset.label}</p>
                  <p className="text-[10px] text-black/60 truncate max-w-[170px] font-mono font-bold">"{preset.text}"</p>
                </div>
                <PlayCircle className="w-4 h-4 text-black stroke-[2.5px] shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Live transcription bubble output */}
        {transcription && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 bg-[#dfbeff]/20 border-2 border-black rounded-lg text-xs leading-normal space-y-2 neo-shadow-black-sm text-black"
          >
            <div>
              <span className="text-[8px] font-mono text-black font-black uppercase block">Transcription</span>
              <p className="text-black font-black italic">"{transcription}"</p>
            </div>
            
            {replyText && (
              <div className="pt-2 border-t-2 border-black text-black">
                <span className="text-[8px] font-mono text-black font-black uppercase block">AI Reply</span>
                <p className="text-[11px] leading-relaxed font-sans text-black font-bold">{replyText}</p>
              </div>
            )}
          </motion.div>
        )}

      </div>

    </div>
  );
}
