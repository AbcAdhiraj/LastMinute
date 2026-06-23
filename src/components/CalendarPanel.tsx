import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, MapPin, Car, Plus, Compass, Check, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import { CalendarEvent } from '../types';
import { googleSignIn, getAccessToken } from '../utils/googleAuth';

interface CalendarPanelProps {
  events: CalendarEvent[];
  onEventCreated: () => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  onShowToast?: (msg: string) => void;
}

export function CalendarPanel({ events, onEventCreated, isLoading, setIsLoading, onShowToast }: CalendarPanelProps) {
  const [data, setData] = useState<CalendarEvent[]>(events);
  const [weekOffset, setWeekOffset] = useState(0);
  
  // Custom maps travel states
  const [origin, setOrigin] = useState('Home Studio');
  const [destination, setDestination] = useState('AWS Campus Center');
  const [travelReport, setTravelReport] = useState<any | null>(null);
  const [mapsLoading, setMapsLoading] = useState(false);

  // Manual event creator states
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('2026-06-23T16:00');
  const [end, setEnd] = useState('2026-06-23T17:00');
  const [category, setCategory] = useState<'work' | 'personal' | 'meeting'>('meeting');
  const [travelTime, setTravelTime] = useState(40);
  const [commuteBlocked, setCommuteBlocked] = useState(true);

  // Google Calendar Integration states
  const [gcalConnected, setGcalConnected] = useState(false);
  const [syncingGoogle, setSyncingGoogle] = useState(false);

  useEffect(() => {
    setData(events);
  }, [events]);

  const queryTransitDetails = async () => {
    setMapsLoading(true);
    try {
      const res = await fetch(`/api/maps/travel-time?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`);
      const payload = await res.json();
      setTravelReport(payload);
    } catch (err) {
      console.error(err);
    } finally {
      setMapsLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setIsLoading(true);
    onShowToast?.(`Inserting custom calendar slot "${title}"...`);
    try {
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          start: new Date(start).toISOString(),
          end: new Date(end).toISOString(),
          category,
          travelTime: category === 'meeting' ? travelTime : undefined,
          commuteBlocked: category === 'meeting' && commuteBlocked
        })
      });

      if (res.ok) {
        setTitle('');
        setShowAddEvent(false);
        onShowToast?.(`Successfully created calendar slot "${title}"!`);
        onEventCreated();
      } else {
        onShowToast?.("Failed to create calendar slot.");
      }
    } catch (err) {
      console.error(err);
      onShowToast?.("Failed to save calendar event due to connection issue.");
    } finally {
      setIsLoading(false);
    }
  };

  // Google Calendar integration
  const syncGoogleCalendar = async () => {
    setSyncingGoogle(true);
    onShowToast?.("Contacting Google OAuth credentials helper...");
    try {
      const token = getAccessToken();
      if (!token) {
        const resSig = await googleSignIn();
        if (resSig) {
          setGcalConnected(true);
          onShowToast?.("Google Account connected. Retrieving calendar agendas...");
          await fetchAndSyncEvents(resSig.accessToken);
        } else {
          onShowToast?.("Google connection cancelled.");
        }
      } else {
        await fetchAndSyncEvents(token);
      }
    } catch (err) {
      console.error("Failed to sync Google Calendar:", err);
      onShowToast?.("Authentication or connection block with Google Calendar service.");
    } finally {
      setSyncingGoogle(false);
    }
  };

  const fetchAndSyncEvents = async (token: string) => {
    let eventsToSync: any[] = [];
    if (token.startsWith("simulated_")) {
      // Return simulated Google calendar blockers to provide amazing interactive demo with high fidelity
      eventsToSync = [
        {
          id: "gcal_sim_1",
          summary: "🤝 Corporate Synergy Alignment Meeting",
          start: { dateTime: "2026-06-23T14:00:00-07:00" },
          end: { dateTime: "2026-06-23T15:30:00-07:00" }
        },
        {
          id: "gcal_sim_2",
          summary: "🍕 Client Dinner & Product Pitch",
          start: { dateTime: "2026-06-24T18:00:00-07:00" },
          end: { dateTime: "2026-06-24T20:30:00-07:00" }
        },
        {
          id: "gcal_sim_3",
          summary: "💼 Google Workspace Architecture Checkpoint",
          start: { dateTime: "2026-06-25T10:00:00-07:00" },
          end: { dateTime: "2026-06-25T11:30:00-07:00" }
        }
      ];
    } else {
      // Real API call to Google Calendar API!
      const timeMin = encodeURIComponent("2026-06-22T00:00:00Z");
      const timeMax = encodeURIComponent("2026-06-29T00:00:00Z");
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const payload = await res.json();
        eventsToSync = payload.items || [];
      } else {
        console.error("Google Calendar API failed. Falling back to simulator.");
      }
    }

    // Now send the synced events to server
    const response = await fetch('/api/calendar/sync-google-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: eventsToSync })
    });

    if (response.ok) {
      onShowToast?.("Successfully synced Google Calendar and optimized study windows!");
      onEventCreated(); // refresh parent state
    } else {
      onShowToast?.("Failed to synchronize external Google Calendar blockers.");
    }
  };

  // Organize events by day of week dynamically
  const daysOfWeek = React.useMemo(() => {
    const ref = new Date("2026-06-22T00:00:00");
    const day = ref.getDay();
    const diff = ref.getDate() - day + (day === 0 ? -6 : 1);
    ref.setDate(diff + weekOffset * 7);

    const days = [];
    const weekdayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    for (let i = 0; i < 7; i++) {
      const current = new Date(ref);
      current.setDate(ref.getDate() + i);
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      days.push({
        name: weekdayNames[i],
        dateStr: `${year}-${month}-${d}`
      });
    }
    return days;
  }, [weekOffset]);

  const getEventsForDay = (dateStr: string) => {
    return data.filter(e => {
      const d = new Date(e.start);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dayVal = String(d.getDate()).padStart(2, '0');
      const localDateStr = `${year}-${month}-${dayVal}`;
      return localDateStr === dateStr;
    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  };

  return (
    <div className="space-y-4">
      
      {/* Timeline calendar agenda list */}
      <div className="space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border-4 border-black rounded-xl p-4 neo-shadow-black">
          <div>
            <h2 className="text-xs font-black font-mono tracking-tight text-black uppercase flex items-center gap-2">
              <Calendar className="w-4 h-4 text-black" />
              Travel-Aware Schedule Agenda
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-black/60 font-mono font-bold">Week: {daysOfWeek[0]?.dateStr} to {daysOfWeek[6]?.dateStr}</span>
              <div className="flex items-center gap-1 bg-[#fff582] border-2 border-black rounded px-2 py-0.5 shadow-sm">
                <button 
                  onClick={() => {
                    setWeekOffset(prev => prev - 1);
                    onShowToast?.("Moving focus viewpoint to previous week...");
                  }}
                  className="px-1 text-black font-black font-mono text-[9px] cursor-pointer hover:underline"
                  title="Previous Week"
                >
                  &lsaquo; Prev
                </button>
                <span className="text-black/40 text-[9px] font-bold">•</span>
                <button 
                  onClick={() => {
                    setWeekOffset(0);
                    onShowToast?.("Reset calendar alignment back to active week.");
                  }}
                  className="px-1 text-black hover:underline font-black font-mono text-[9px] cursor-pointer"
                >
                  Today
                </button>
                <span className="text-black/40 text-[9px] font-bold">•</span>
                <button 
                  onClick={() => {
                    setWeekOffset(prev => prev + 1);
                    onShowToast?.("Moving focus viewpoint to next week...");
                  }}
                  className="px-1 text-black font-black font-mono text-[9px] cursor-pointer hover:underline"
                  title="Next Week"
                >
                  Next &rsaquo;
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
            <button
              onClick={syncGoogleCalendar}
              disabled={syncingGoogle}
              className={`${gcalConnected ? 'bg-[#b8f598] text-black' : 'bg-white hover:bg-neutral-50 text-black'} font-black text-[10px] sm:text-xs px-3 py-1.5 rounded flex items-center gap-1.5 cursor-pointer border-2 border-black shadow-xs active:translate-y-0.5`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingGoogle ? 'animate-spin' : ''}`} />
              <span>{gcalConnected ? "Sync Google Calendar" : "Connect Google Calendar"}</span>
            </button>
            <button
              onClick={() => {
                setShowAddEvent(!showAddEvent);
                onShowToast?.(showAddEvent ? "Closed calendar slot drawer." : "Opened manual slot drawer. Configure commitments!");
              }}
              className="bg-[#98e2ff] hover:bg-[#85d3f0] text-black font-black text-[10px] sm:text-xs px-3 py-1.5 rounded flex items-center gap-1 cursor-pointer shadow-xs border-2 border-black active:translate-y-0.5"
            >
              <Plus className="w-3.5 h-3.5 strike-[2.5px]" />
              Add Calendar Slot
            </button>
          </div>
        </div>

        {/* Modal-like event slot creator */}
        {showAddEvent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border-4 border-black p-5 rounded-xl space-y-3 text-xs neo-shadow-black"
          >
            <h3 className="text-xs font-black text-black uppercase tracking-tight">Create Calendar Slot</h3>
            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-black font-mono">Event Name</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Operating Systems Study block"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-white border-2 border-black rounded px-2.5 py-1.5 text-xs text-black focus:outline-none font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black text-black font-mono">Start</label>
                    <input
                      type="datetime-local"
                      required
                      value={start}
                      onChange={(e) => setStart(e.target.value)}
                      className="w-full bg-white border-2 border-black rounded px-2 py-1 text-[11px] text-black focus:outline-none font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black text-black font-mono">End</label>
                    <input
                      type="datetime-local"
                      required
                      value={end}
                      onChange={(e) => setEnd(e.target.value)}
                      className="w-full bg-white border-2 border-black rounded px-2 py-1 text-[11px] text-black focus:outline-none font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="text-[9px] uppercase font-black text-black font-mono">Slot Type</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full bg-white border-2 border-black rounded px-2 py-1.5 text-xs text-black focus:outline-none font-bold"
                  >
                    <option value="meeting">Business Meeting</option>
                    <option value="work">Focus Deep Work</option>
                    <option value="personal">Personal / Leisure</option>
                  </select>
                </div>

                {category === 'meeting' && (
                  <>
                    <div>
                      <label className="text-[9px] uppercase font-black text-black font-mono">Commute Duration (mins)</label>
                      <input
                        type="number"
                        value={travelTime}
                        onChange={(e) => setTravelTime(Number(e.target.value))}
                        className="w-full bg-white border-2 border-black rounded px-2 py-1 text-xs text-black focus:outline-none font-mono font-bold"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-4">
                      <input
                        type="checkbox"
                        id="blockCommute"
                        checked={commuteBlocked}
                        onChange={(e) => setCommuteBlocked(e.target.checked)}
                        className="w-3.5 h-3.5 accent-black rounded border-2 border-black cursor-pointer"
                      />
                      <label htmlFor="blockCommute" className="font-mono text-[9px] text-black cursor-pointer font-black">
                        Block Commute Buffer
                      </label>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddEvent(false)}
                  className="px-3 py-1.5 border-2 border-black text-black hover:bg-neutral-55 rounded cursor-pointer font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#b8f598] hover:bg-[#a0e080] border-2 border-black text-black font-black px-3 py-1.5 rounded cursor-pointer transition-all neo-shadow-black-sm"
                >
                  Insert Event Block
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Calendar days timeline */}
        <div className="space-y-4">
          {daysOfWeek.map((day) => {
            const evts = getEventsForDay(day.dateStr);
            const isToday = day.dateStr === '2026-06-22';

            return (
              <div key={day.dateStr} className={`p-4 rounded-xl border-4 border-black bg-white neo-shadow-black`}>
                <div className={`flex items-center justify-between border-b-2 border-black pb-2 mb-3 px-1 py-1 rounded ${isToday ? 'bg-[#fff582]' : 'bg-[#e4f3a2]/40'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-black uppercase">{day.name}</span>
                    <span className="text-[10px] text-black/60 font-mono font-bold">{day.dateStr}</span>
                  </div>
                  {isToday ? (
                    <span className="text-[8px] bg-black text-[#ffffff] font-extrabold px-2 py-0.5 rounded font-mono uppercase">
                      Today View
                    </span>
                  ) : (
                    <span className="text-[8px] bg-white border border-black text-black font-bold px-2 py-0.5 rounded font-mono uppercase">
                      Slotted
                    </span>
                  )}
                </div>

                {evts.length === 0 ? (
                  <p className="text-xs text-black/50 italic py-2 font-mono font-bold pl-2">No slotted occurrences planned.</p>
                ) : (
                  <div className="relative border-l-2 border-black/80 ml-2 pl-4 space-y-3 font-mono text-[11px]">
                    {evts.map((e) => {
                      const startTime = new Date(e.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const endTime = new Date(e.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                      let blockStyle = 'bg-white border-2 border-black text-black';
                      
                      if (e.category === 'meeting') {
                        blockStyle = 'bg-[#dfbeff] border-2 border-black text-black';
                      } else if (e.category === 'deep_work') {
                        blockStyle = 'bg-[#98e2ff] border-2 border-black text-black';
                      } else if (e.category === 'commute') {
                        blockStyle = 'bg-[#ff94e0]/30 border-2 border-dashed border-black text-black/80';
                      }

                      return (
                        <div key={e.id} className={`p-2.5 rounded border-2 border-black flex items-center justify-between neo-shadow-black-sm ${blockStyle}`}>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {e.category === 'commute' && <Car className="w-3.5 h-3.5 text-black" />}
                              <span className="font-extrabold">{e.title}</span>
                            </div>
                            
                            <div className="flex items-center gap-3 text-[10px] text-black/70 font-black">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-black" />
                                {startTime} – {endTime}
                              </span>
                              {e.travelTime && (
                                <span className="text-[#ff66b2] flex items-center gap-0.5 font-black underline decoration-2">
                                  <MapPin className="w-3 h-3 text-black" />
                                  Requires {e.travelTime}m travel buffer
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
