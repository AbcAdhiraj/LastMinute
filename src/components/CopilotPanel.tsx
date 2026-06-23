import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, HelpCircle, Activity, Heart, ShieldAlert, Cpu, HeartHandshake } from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

interface CopilotPanelProps {
  onSelfHealTriggered: () => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
}

export function CopilotPanel({ onSelfHealTriggered, isLoading, setIsLoading }: CopilotPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'assistant',
      text: "Hello Adhiraj! I am Gemini, your Executive Assistant. I have audited your calendar, goals, and email commitments for June 2026. What should we organize today?",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const presets = [
    { label: "What should I work on right now?", text: "What should I focus on right now? Pick my highest priority active task block." },
    { label: "What is my biggest risk this week?", text: "Identify my highest-risk task and tell me why I am in jeopardy of delay." },
    { label: "Can I finish everything before Friday?", text: "Audit my workload against remaining free hours. Can I submit ML and Operating Systems by Friday?" },
    { label: "Heal my missed study sessions", text: "I missed a study slot. Run the self-healing scheduler to repair my calendar." }
  ];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Check if the user clicked the heal shortcut to run calendar repairs directly!
    if (textToSend.toLowerCase().includes('heal') || textToSend.toLowerCase().includes('missed')) {
      const userMsg: Message = { id: `u_${Date.now()}`, sender: 'user', text: textToSend, timestamp: new Date() };
      setMessages(prev => [...prev, userMsg]);
      setInputText('');
      setIsLoading(true);
      
      const assistantMsg: Message = {
        id: `a_${Date.now()}`,
        sender: 'assistant',
        text: "Understood. Activating the calendar Self-Healing Schedule engine. Recalculating remaining session requirements, sliding pending allocations forwards, and securing your Friday submission plan...",
        timestamp: new Date()
      };
      
      setTimeout(async () => {
        try {
          const res = await fetch('/api/self-heal', { method: 'POST' });
          const parsed = await res.json();
          onSelfHealTriggered(); // update parent tasks list
          
          setMessages(prev => [...prev, {
            id: `a_heal_${Date.now()}`,
            sender: 'assistant',
            text: `Schedule successfully repaired! I detected missed blocks for your assignments and automatically re-slid ${parsed.healedTasksCount || 1} corrective blocks to your available calendar windows. Risk assessments updated!`,
            timestamp: new Date()
          }]);
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoading(false);
        }
      }, 1000);
      return;
    }

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToSend })
      });
      const parsed = await res.json();

      setMessages(prev => [...prev, {
        id: `a_${Date.now()}`,
        sender: 'assistant',
        text: parsed.response,
        timestamp: new Date()
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: "I experienced communication issues updating your schedule matrices. Please inspect your local servers.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[520px] bg-[#ffffff] border-4 border-black rounded-xl overflow-hidden text-xs neo-shadow-black">
      
      {/* Header bar */}
      <div className="bg-[#b8f598] border-b-4 border-black px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-black animate-pulse" />
          <div>
            <h3 className="font-black text-[#000000] text-sm uppercase">Goofy</h3>
            <p className="text-[10px] text-black/60 font-mono font-bold">IIT-KGP Study Copilot</p>
          </div>
        </div>
        <button
          onClick={onSelfHealTriggered}
          className="bg-[#ffa852] hover:bg-[#ff9a36] text-black font-black font-mono text-[10px] py-1.5 px-3 rounded border-2 border-black transition-all flex items-center gap-1.5 cursor-pointer neo-shadow-black-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-xs"
        >
          <Activity className="w-3.5 h-3.5" />
          Heal Schedule
        </button>
      </div>

      {/* Messages console area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#fbfdfa]">
        {messages.map((m) => {
          const isAI = m.sender === 'assistant';
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 max-w-4xl ${isAI ? '' : 'flex-row-reverse ml-auto'}`}
            >
              {/* Avatar holder */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 border-black uppercase font-black text-[10px] font-mono select-none ${
                isAI ? 'bg-[#ff9ee1] text-black' : 'bg-[#fff066] text-black'
              }`}>
                {isAI ? 'G' : 'A'}
              </div>

              {/* Speech bubble */}
              <div className={`p-3.5 rounded-xl border-2 border-black leading-relaxed text-black text-xs max-w-[85%] neo-shadow-black-sm ${
                isAI ? 'bg-[#ffffff]' : 'bg-[#98e2ff]'
              }`}>
                {/* Custom markdown formatting simulation */}
                <p className="whitespace-pre-line leading-relaxed font-sans font-bold">{m.text}</p>
                <span className="text-[8px] font-mono text-black/50 block text-right mt-1 pt-1 border-t border-black/10">
                  {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          );
        })}
        {isLoading && (
          <div className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-[#ff9ee1] border-2 border-black flex items-center justify-center text-[10px] text-black font-black font-mono">G</div>
            <div className="p-3 bg-white border-2 border-black rounded-xl flex items-center gap-1.5 py-4 px-6 text-black/70 font-mono">
              <Cpu className="w-3.5 h-3.5 animate-spin text-black" />
              <span className="font-extrabold text-[11px]">Re-mapping constraints...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Interactive preset shortcuts */}
      {messages.length < 3 && (
        <div className="px-5 py-2.5 flex flex-wrap gap-2 border-t-2 border-black bg-[#e4f3a2]/30">
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p.text)}
              className="text-[10px] bg-[#ffffff] border-2 border-black rounded px-2.5 py-1 text-black font-extrabold hover:bg-neutral-100 active:translate-y-0.5 transition-all font-mono cursor-pointer shadow-xs"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Input query form */}
      <div className="p-4 border-t-4 border-black bg-[#ffffff]">
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Query your schedule metrics, e.g. 'Can I finish Operating Systems?'"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage(inputText);
            }}
            disabled={isLoading}
            className="w-full bg-[#ffffff] border-2 border-black rounded-lg pl-4 pr-12 py-3 text-xs text-black placeholder-neutral-500 focus:outline-none focus:ring-0 font-bold font-sans"
          />
          <button
            onClick={() => handleSendMessage(inputText)}
            disabled={isLoading || !inputText.trim()}
            className="absolute right-3 p-1.5 rounded border-2 border-black bg-[#fff582] disabled:bg-neutral-100 disabled:text-neutral-450 hover:brightness-95 text-black transition-all cursor-pointer shadow-sm active:translate-y-0.5"
          >
            <Send className="w-3.5 h-3.5 strike-[2.5px]" />
          </button>
        </div>
      </div>

    </div>
  );
}
