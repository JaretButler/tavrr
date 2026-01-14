import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader2, Calendar, Clock, DollarSign, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { format, addDays, parse, setHours, setMinutes } from 'date-fns';

export default function AddSessionModal({ isOpen, onClose, coach, athletes, onSuccess }) {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedSessions, setParsedSessions] = useState(null);
  const [error, setError] = useState('');

  const handleProcess = async () => {
    if (!input.trim()) return;

    setIsProcessing(true);
    setError('');
    setParsedSessions(null);

    try {
      const athleteContext = athletes.map(a => `${a.name} (ID: ${a.id})`).join(', ');
      
      const prompt = `You are helping a coach schedule training sessions. Parse the following request into structured session data.

Available athletes: ${athleteContext}

Current date: ${format(new Date(), 'EEEE, MMMM d, yyyy')}

Coach request: "${input}"

Extract the following information for each session:
- athlete_name: Match to one of the available athletes
- date: Convert relative dates (e.g., "Monday", "tomorrow", "next week") to actual dates in YYYY-MM-DD format
- time: Convert to 24-hour format HH:mm
- duration_minutes: Default to 60 if not specified
- rate: Extract dollar amount if mentioned, otherwise use null
- facility_name: Extract location if mentioned
- notes: Any additional details

If multiple sessions are mentioned, create separate entries.
Return an array of session objects.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            sessions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  athlete_name: { type: "string" },
                  date: { type: "string" },
                  time: { type: "string" },
                  duration_minutes: { type: "number" },
                  rate: { type: ["number", "null"] },
                  facility_name: { type: ["string", "null"] },
                  notes: { type: ["string", "null"] }
                }
              }
            }
          }
        }
      });

      if (response.sessions && response.sessions.length > 0) {
        // Match athlete names to IDs
        const sessionsWithIds = response.sessions.map(session => {
          const athlete = athletes.find(a => 
            a.name.toLowerCase().includes(session.athlete_name.toLowerCase()) ||
            session.athlete_name.toLowerCase().includes(a.name.toLowerCase())
          );
          
          return {
            ...session,
            athlete_id: athlete?.id,
            athlete: athlete
          };
        });

        setParsedSessions(sessionsWithIds);
      } else {
        setError('Could not understand the request. Please try being more specific.');
      }
    } catch (err) {
      setError('Failed to process request. Please try again.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateSessions = async () => {
    if (!parsedSessions || parsedSessions.length === 0) return;

    setIsProcessing(true);
    try {
      for (const session of parsedSessions) {
        if (!session.athlete_id) continue;

        const [hours, minutes] = session.time.split(':');
        const sessionDate = new Date(session.date);
        sessionDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        await base44.entities.Session.create({
          coach_id: coach.id,
          athlete_id: session.athlete_id,
          family_id: session.athlete.family_id,
          scheduled_time: sessionDate.toISOString(),
          duration_minutes: session.duration_minutes,
          rate: session.rate || coach.hourly_rate || 0,
          facility_name: session.facility_name || coach.facilities?.[0]?.name || 'TBD',
          status: 'scheduled',
          rsvp_status: 'pending',
        });
      }

      onSuccess?.();
      handleClose();
    } catch (err) {
      setError('Failed to create sessions. Please try again.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setInput('');
    setParsedSessions(null);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl border border-neutral-100 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-neutral-900">Add Sessions with AI</h2>
                <p className="text-sm text-neutral-500">Describe your sessions in plain language</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">
                Describe the sessions you want to add
              </label>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Example: Schedule a session with John tomorrow at 3pm for 60 minutes at the gym for $50"
                className="min-h-[120px] resize-none"
                disabled={isProcessing || parsedSessions}
              />
              <p className="text-xs text-neutral-500">
                You can add multiple sessions at once. Try: "Sessions with John on Monday at 3pm and Sarah on Tuesday at 4pm"
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Parsed Sessions Preview */}
            {parsedSessions && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-neutral-700">Preview Sessions</h3>
                {parsedSessions.map((session, idx) => (
                  <div key={idx} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                    {!session.athlete_id ? (
                      <div className="text-sm text-red-600">
                        ⚠️ Could not match athlete: {session.athlete_name}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm"
                            style={{ backgroundColor: session.athlete.avatar_color }}
                          >
                            {session.athlete.name?.charAt(0)}
                          </div>
                          <span className="font-medium text-neutral-900">{session.athlete.name}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-neutral-600">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(session.date), 'EEEE, MMM d')}
                          </div>
                          <div className="flex items-center gap-2 text-neutral-600">
                            <Clock className="w-4 h-4" />
                            {session.time} • {session.duration_minutes} min
                          </div>
                          {session.rate && (
                            <div className="flex items-center gap-2 text-neutral-600">
                              <DollarSign className="w-4 h-4" />
                              ${session.rate}
                            </div>
                          )}
                          {session.facility_name && (
                            <div className="flex items-center gap-2 text-neutral-600">
                              <MapPin className="w-4 h-4" />
                              {session.facility_name}
                            </div>
                          )}
                        </div>
                        {session.notes && (
                          <p className="text-sm text-neutral-500 italic">{session.notes}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-neutral-100 flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            {!parsedSessions ? (
              <Button 
                onClick={handleProcess}
                disabled={!input.trim() || isProcessing}
                className="bg-[#0066CC] hover:bg-[#0052A3]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Process with AI
                  </>
                )}
              </Button>
            ) : (
              <Button 
                onClick={handleCreateSessions}
                disabled={isProcessing || !parsedSessions.some(s => s.athlete_id)}
                className="bg-[#0066CC] hover:bg-[#0052A3]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  `Create ${parsedSessions.filter(s => s.athlete_id).length} Session${parsedSessions.filter(s => s.athlete_id).length !== 1 ? 's' : ''}`
                )}
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}