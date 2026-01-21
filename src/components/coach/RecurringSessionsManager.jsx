import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Repeat, Check, X, Calendar, Clock, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, addDays, addWeeks, addMonths, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function RecurringSessionsManager({ coachId }) {
  const [generatingFor, setGeneratingFor] = useState(null);
  const queryClient = useQueryClient();

  const { data: recurringSessions = [], isLoading } = useQuery({
    queryKey: ['recurringSessions', coachId],
    queryFn: () => base44.entities.RecurringSession.filter({ coach_id: coachId }, '-created_date'),
    enabled: !!coachId,
  });

  const { data: athletes = [] } = useQuery({
    queryKey: ['athletes'],
    queryFn: () => base44.entities.Athlete.list(),
  });

  const approveMutation = useMutation({
    mutationFn: async (recurringSessionId) => {
      await base44.entities.RecurringSession.update(recurringSessionId, { status: 'approved' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringSessions'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (recurringSessionId) => {
      await base44.entities.RecurringSession.update(recurringSessionId, { status: 'rejected' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringSessions'] });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: async (recurringSessionId) => {
      await base44.entities.RecurringSession.update(recurringSessionId, { status: 'paused' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringSessions'] });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: async (recurringSessionId) => {
      await base44.entities.RecurringSession.update(recurringSessionId, { status: 'approved' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringSessions'] });
    },
  });

  const generateSessionsMutation = useMutation({
    mutationFn: async (recurringSession) => {
      setGeneratingFor(recurringSession.id);
      
      // Generate sessions for next 12 weeks
      const sessions = [];
      const startDate = recurringSession.last_generated_date 
        ? addDays(parseISO(recurringSession.last_generated_date), 1)
        : new Date();
      const endDate = recurringSession.recurrence_end_date 
        ? new Date(recurringSession.recurrence_end_date)
        : addWeeks(new Date(), 12);

      let currentDate = startDate;
      
      while (currentDate <= endDate) {
        // Find the next occurrence of the target day of week
        const daysUntilTarget = (recurringSession.day_of_week - currentDate.getDay() + 7) % 7;
        const nextOccurrence = addDays(currentDate, daysUntilTarget || 7);
        
        if (nextOccurrence > endDate) break;
        
        // Create session date-time
        const [hours, minutes] = recurringSession.time.split(':');
        const sessionDateTime = new Date(nextOccurrence);
        sessionDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        sessions.push({
          coach_id: recurringSession.coach_id,
          athlete_id: recurringSession.athlete_id,
          family_id: recurringSession.family_id,
          scheduled_time: sessionDateTime.toISOString(),
          duration_minutes: recurringSession.duration_minutes,
          rate: recurringSession.rate,
          facility_name: recurringSession.facility_name,
          session_type: recurringSession.session_type,
          status: 'scheduled',
          rsvp_status: 'confirmed',
        });
        
        // Advance to next period based on pattern
        if (recurringSession.recurrence_pattern === 'weekly') {
          currentDate = addWeeks(nextOccurrence, 1);
        } else if (recurringSession.recurrence_pattern === 'biweekly') {
          currentDate = addWeeks(nextOccurrence, 2);
        } else if (recurringSession.recurrence_pattern === 'monthly') {
          currentDate = addMonths(nextOccurrence, 1);
        }
      }
      
      // Bulk create sessions
      if (sessions.length > 0) {
        await base44.entities.Session.bulkCreate(sessions);
        
        // Update last_generated_date
        await base44.entities.RecurringSession.update(recurringSession.id, {
          last_generated_date: format(sessions[sessions.length - 1].scheduled_time, 'yyyy-MM-dd'),
        });
      }
      
      return sessions.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['recurringSessions'] });
      setGeneratingFor(null);
    },
  });

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const patternLabels = {
    weekly: 'Weekly',
    biweekly: 'Every 2 Weeks',
    monthly: 'Monthly',
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (recurringSessions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-100 p-12 text-center">
        <Repeat className="w-10 h-10 text-neutral-200 mx-auto mb-4" />
        <p className="text-neutral-500">No recurring sessions</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recurringSessions.map((recurring) => {
        const athlete = athletes.find(a => a.id === recurring.athlete_id);
        const isGenerating = generatingFor === recurring.id;
        
        return (
          <motion.div
            key={recurring.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-neutral-100 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                  style={{ backgroundColor: athlete?.avatar_color || '#6B7280' }}
                >
                  {athlete?.name?.charAt(0)}
                </div>
                <div>
                  <h3 className="font-medium text-neutral-900">{athlete?.name || 'Athlete'}</h3>
                  <div className="flex items-center gap-2 text-sm text-neutral-500 mt-1">
                    <Repeat className="w-3 h-3" />
                    <span>{patternLabels[recurring.recurrence_pattern]}</span>
                    <span>•</span>
                    <span>{dayNames[recurring.day_of_week]}s</span>
                    <span>•</span>
                    <span>{recurring.time}</span>
                  </div>
                  {recurring.recurrence_end_date && (
                    <p className="text-xs text-neutral-400 mt-1">
                      Until {format(new Date(recurring.recurrence_end_date), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                  recurring.status === 'approved' ? 'bg-green-100 text-green-700' :
                  recurring.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  recurring.status === 'rejected' ? 'bg-red-100 text-red-700' :
                  recurring.status === 'paused' ? 'bg-gray-100 text-gray-700' :
                  'bg-neutral-100 text-neutral-700'
                }`}>
                  {recurring.status}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {recurring.status === 'pending' && (
                <>
                  <Button
                    size="sm"
                    onClick={() => approveMutation.mutate(recurring.id)}
                    disabled={approveMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rejectMutation.mutate(recurring.id)}
                    disabled={rejectMutation.isPending}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </>
              )}

              {recurring.status === 'approved' && (
                <>
                  <Button
                    size="sm"
                    onClick={() => generateSessionsMutation.mutate(recurring)}
                    disabled={isGenerating}
                    className="bg-[#0066CC] hover:bg-[#0052A3]"
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    {isGenerating ? 'Generating...' : 'Generate Sessions'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => pauseMutation.mutate(recurring.id)}
                    disabled={pauseMutation.isPending}
                  >
                    <Pause className="w-4 h-4 mr-1" />
                    Pause
                  </Button>
                </>
              )}

              {recurring.status === 'paused' && (
                <Button
                  size="sm"
                  onClick={() => resumeMutation.mutate(recurring.id)}
                  disabled={resumeMutation.isPending}
                  className="bg-[#0066CC] hover:bg-[#0052A3]"
                >
                  <Play className="w-4 h-4 mr-1" />
                  Resume
                </Button>
              )}
            </div>

            {recurring.last_generated_date && (
              <p className="text-xs text-neutral-400 mt-3">
                Sessions generated through {format(new Date(recurring.last_generated_date), 'MMM d, yyyy')}
              </p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}