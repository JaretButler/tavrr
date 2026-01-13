import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isFuture, isSameDay } from 'date-fns';
import { Settings, Bell, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import AthleteSwitcher from '@/components/family/AthleteSwitcher';
import BalanceCard from '@/components/family/BalanceCard';
import FamilySessionCard from '@/components/family/FamilySessionCard';
import TrainingCalendar from '@/components/calendar/TrainingCalendar';

export default function FamilyDashboard() {
  const [selectedAthleteId, setSelectedAthleteId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isSettling, setIsSettling] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: family, isLoading: familyLoading } = useQuery({
    queryKey: ['family', user?.email],
    queryFn: () => base44.entities.Family.filter({ user_id: user?.email }),
    enabled: !!user?.email,
    select: (data) => data[0],
  });

  const { data: athletes = [], isLoading: athletesLoading } = useQuery({
    queryKey: ['athletes', family?.id],
    queryFn: () => base44.entities.Athlete.filter({ family_id: family?.id }),
    enabled: !!family?.id,
  });

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['familySessions', family?.id],
    queryFn: () => base44.entities.Session.filter({ family_id: family?.id }, '-scheduled_time'),
    enabled: !!family?.id,
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list(),
  });

  // Set first athlete as selected by default
  useEffect(() => {
    if (athletes.length > 0 && !selectedAthleteId) {
      setSelectedAthleteId(athletes[0].id);
    }
  }, [athletes, selectedAthleteId]);

  // Subscribe to real-time session updates
  useEffect(() => {
    const unsubscribe = base44.entities.Session.subscribe((event) => {
      queryClient.invalidateQueries({ queryKey: ['familySessions'] });
    });
    return unsubscribe;
  }, [queryClient]);

  const rsvpMutation = useMutation({
    mutationFn: async ({ sessionId, status }) => {
      await base44.entities.Session.update(sessionId, { rsvp_status: status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familySessions'] });
    },
  });

  const handleSettle = async () => {
    setIsSettling(true);
    // Simulate biometric/payment flow
    setTimeout(async () => {
      await base44.entities.Family.update(family.id, { current_balance: 0 });
      queryClient.invalidateQueries({ queryKey: ['family'] });
      setIsSettling(false);
    }, 2000);
  };

  // Filter sessions
  const filteredSessions = sessions.filter(s => 
    !selectedAthleteId || s.athlete_id === selectedAthleteId
  );

  const upcomingSessions = filteredSessions.filter(s => 
    isFuture(new Date(s.scheduled_time)) && s.status !== 'cancelled'
  ).slice(0, 5);

  const selectedDateSessions = filteredSessions.filter(s =>
    isSameDay(new Date(s.scheduled_time), selectedDate)
  );

  const isLocked = (family?.current_balance || 0) > 0;
  const isLoading = familyLoading || athletesLoading || sessionsLoading;

  // Find which coach is owed money (from most recent unpaid session)
  const owedCoach = sessions
    .filter(s => s.status === 'verified' || s.status === 'completed')
    .sort((a, b) => new Date(b.scheduled_time) - new Date(a.scheduled_time))[0]?.coach_id;
  const coachName = coaches.find(c => c.id === owedCoach)?.display_name;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6965c061c9809ea85fc32161/f390a923b_tfA4gvqQ0K1ptroztEoWt.png"
                alt="Tavrr"
                className="h-[2.8rem]"
              />
              <div className="border-l border-neutral-200 pl-4">
                <AthleteSwitcher
                  athletes={athletes}
                  selectedAthlete={selectedAthleteId}
                  onSelect={setSelectedAthleteId}
                  onAddAthlete={() => {}}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5 text-neutral-500" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5 text-neutral-500" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Balance & Upcoming */}
          <div className="lg:col-span-1 space-y-6">
            {/* Balance Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {isLoading ? (
                <Skeleton className="h-48 w-full rounded-2xl" />
              ) : (
                <BalanceCard
                  balance={family?.current_balance || 0}
                  onSettle={handleSettle}
                  isSettling={isSettling}
                  biometricEnabled={family?.biometric_enabled}
                  paymentMethods={family?.payment_methods || []}
                  coachName={coachName}
                />
              )}
            </motion.div>

            {/* Today's Training */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-neutral-900">
                  {isToday(selectedDate) ? "Today's Training" : format(selectedDate, 'EEEE, MMM d')}
                </h2>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <Skeleton key={i} className="h-48 w-full rounded-xl" />
                  ))}
                </div>
              ) : selectedDateSessions.length === 0 ? (
                <div className="bg-white rounded-2xl border border-neutral-100 p-12 text-center">
                  <p className="text-neutral-400">No training scheduled</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedDateSessions.map(session => {
                    const athlete = athletes.find(a => a.id === session.athlete_id);
                    const coach = coaches.find(c => c.id === session.coach_id);

                    return (
                      <FamilySessionCard
                        key={session.id}
                        session={session}
                        athlete={athlete}
                        coach={coach}
                        onRsvp={(sessionId, status) => rsvpMutation.mutate({ sessionId, status })}
                        isLocked={isLocked}
                      />
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Upcoming Sessions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs tracking-[0.2em] uppercase text-neutral-400 font-medium">
                  Upcoming Sessions
                </span>
                <span className="text-xs text-neutral-400">
                  {upcomingSessions.length} scheduled
                </span>
              </div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl border border-neutral-100 p-6"
              >
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                  </div>
                ) : upcomingSessions.length === 0 ? (
                  <p className="text-sm text-neutral-400 text-center py-8">
                    No upcoming sessions
                  </p>
                ) : (
                  <div className="space-y-3">
                    {upcomingSessions.map(session => {
                      const athlete = athletes.find(a => a.id === session.athlete_id);
                      const coach = coaches.find(c => c.id === session.coach_id);
                      const sessionDate = new Date(session.scheduled_time);

                      return (
                        <div 
                          key={session.id}
                          className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl"
                        >
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                            style={{ backgroundColor: athlete?.avatar_color || '#6B7280' }}
                          >
                            {athlete?.name?.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-900 truncate">
                              {athlete?.name}
                            </p>
                            <p className="text-xs text-neutral-400">
                              {isToday(sessionDate) ? 'Today' : format(sessionDate, 'EEE, MMM d')} · {format(sessionDate, 'h:mm a')}
                            </p>
                          </div>
                          <span className="text-sm font-medium text-neutral-900">
                            ${session.rate}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Right Column - Calendar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Calendar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <TrainingCalendar
                sessions={filteredSessions}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}