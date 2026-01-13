import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { Calendar, Settings, Bell, RefreshCw, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import RevenueTicker from '@/components/coach/RevenueTicker';
import HandshakeFeed from '@/components/coach/HandshakeFeed';
import SessionCard from '@/components/coach/SessionCard';
import ManualOverrideModal from '@/components/coach/ManualOverrideModal';
import TrainingCalendar from '@/components/calendar/TrainingCalendar';

export default function CoachDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showManualOverride, setShowManualOverride] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: coach, isLoading: coachLoading } = useQuery({
    queryKey: ['coach', user?.email],
    queryFn: () => base44.entities.Coach.filter({ user_id: user?.email }),
    enabled: !!user?.email,
    select: (data) => data[0],
  });

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions', coach?.id],
    queryFn: () => base44.entities.Session.filter({ coach_id: coach?.id }, '-scheduled_time'),
    enabled: !!coach?.id,
  });

  const { data: athletes = [] } = useQuery({
    queryKey: ['athletes'],
    queryFn: () => base44.entities.Athlete.list(),
  });

  // Subscribe to real-time session updates
  useEffect(() => {
    const unsubscribe = base44.entities.Session.subscribe((event) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    });
    return unsubscribe;
  }, [queryClient]);

  // Calculate revenue metrics
  const todaySessions = sessions.filter(s => isToday(new Date(s.scheduled_time)));
  const verifiedToday = todaySessions.filter(s => s.status === 'verified');
  const todayVerifiedRevenue = verifiedToday.reduce((sum, s) => sum + (s.rate || 0), 0);
  const todayProjectedRevenue = todaySessions.reduce((sum, s) => sum + (s.rate || 0), 0);

  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const monthSessions = sessions.filter(s => {
    const date = new Date(s.scheduled_time);
    return date >= monthStart && date <= monthEnd && s.status === 'verified';
  });
  const monthlyRecovered = monthSessions.reduce((sum, s) => sum + (s.rate || 0), 0);

  // Create handshakes for feed
  const recentHandshakes = verifiedToday.map(session => {
    const athlete = athletes.find(a => a.id === session.athlete_id);
    return {
      id: session.id,
      athleteName: athlete?.name || 'Athlete',
      verifiedAt: session.verification?.verified_at || session.updated_date,
      amount: session.rate,
      facilityName: session.facility_name,
      verification: session.verification,
    };
  });

  // Filter sessions for selected date
  const selectedDateSessions = sessions.filter(s => 
    isSameDay(new Date(s.scheduled_time), selectedDate)
  );

  const handleManualOverride = (session) => {
    const athlete = athletes.find(a => a.id === session.athlete_id);
    setSelectedSession(session);
    setSelectedAthlete(athlete);
    setShowManualOverride(true);
  };

  const overrideMutation = useMutation({
    mutationFn: async ({ sessionId, sendNotification, reason }) => {
      await base44.entities.Session.update(sessionId, {
        status: 'verified',
        verification: {
          gate_1_time: true,
          gate_2_location: true,
          gate_3_proximity: true,
          verified_at: new Date().toISOString(),
          manual_override: true,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setShowManualOverride(false);
    },
  });

  const isLoading = coachLoading || sessionsLoading;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-medium text-neutral-900">Instructor Jaret</h1>
            <div className="flex items-center gap-3">
              <Link to={createPageUrl('Contacts')}>
                <Button variant="ghost" size="icon">
                  <Users className="w-5 h-5 text-neutral-500" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5 text-neutral-500" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#0066CC] rounded-full" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5 text-neutral-500" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Revenue & Feed */}
          <div className="lg:col-span-1 space-y-6">
            {/* Revenue Ticker */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-neutral-100 p-6"
            >
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-12 w-48" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ) : (
                <RevenueTicker
                  todayVerified={todayVerifiedRevenue}
                  todayProjected={todayProjectedRevenue}
                  monthlyRecovered={monthlyRecovered}
                  monthlyGoal={coach?.monthly_revenue_goal || 10000}
                />
              )}
            </motion.div>

            {/* Revenue Ticker */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl border border-neutral-100 p-6"
            >
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-12 w-48" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ) : (
                <RevenueTicker
                  todayVerified={todayVerifiedRevenue}
                  todayProjected={todayProjectedRevenue}
                  monthlyRecovered={monthlyRecovered}
                  monthlyGoal={coach?.monthly_revenue_goal || 10000}
                />
              )}
            </motion.div>

            {/* Handshake Feed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-neutral-100 p-6"
            >
              <HandshakeFeed handshakes={recentHandshakes} />
            </motion.div>
          </div>

          {/* Right Column - Calendar & Sessions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Calendar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <TrainingCalendar
                sessions={sessions}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
            </motion.div>

            {/* Sessions for Selected Date */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-neutral-900">
                  {isToday(selectedDate) ? "Today's Sessions" : format(selectedDate, 'EEEE, MMM d')}
                </h2>
                <span className="text-sm text-neutral-400">
                  {selectedDateSessions.length} session{selectedDateSessions.length !== 1 ? 's' : ''}
                </span>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-40 w-full rounded-xl" />
                  ))}
                </div>
              ) : selectedDateSessions.length === 0 ? (
                <div className="bg-white rounded-2xl border border-neutral-100 p-12 text-center">
                  <Calendar className="w-10 h-10 text-neutral-200 mx-auto mb-4" />
                  <p className="text-neutral-500">No sessions scheduled</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <AnimatePresence mode="popLayout">
                    {selectedDateSessions.map(session => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        athlete={athletes.find(a => a.id === session.athlete_id)}
                        onManualOverride={handleManualOverride}
                        onCancel={() => {}}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>

      {/* Manual Override Modal */}
      <ManualOverrideModal
        isOpen={showManualOverride}
        onClose={() => setShowManualOverride(false)}
        session={selectedSession}
        athlete={selectedAthlete}
        onConfirm={(data) => overrideMutation.mutate(data)}
        isLoading={overrideMutation.isPending}
      />
    </div>
  );
}