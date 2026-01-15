import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

export default function OpenSlotsManager({ coachId }) {
  const queryClient = useQueryClient();

  const { data: openSlots = [], isLoading } = useQuery({
    queryKey: ['openSlots', coachId],
    queryFn: () => base44.entities.OpenSlot.filter({ coach_id: coachId }, '-scheduled_time'),
    enabled: !!coachId,
  });

  const { data: athletes = [] } = useQuery({
    queryKey: ['athletes'],
    queryFn: () => base44.entities.Athlete.list(),
  });

  const cancelSlotMutation = useMutation({
    mutationFn: async (slotId) => {
      await base44.entities.OpenSlot.update(slotId, { status: 'cancelled' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['openSlots'] });
    },
  });

  const activeSlots = openSlots.filter(s => s.status === 'available');
  const claimedSlots = openSlots.filter(s => s.status === 'claimed');

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (activeSlots.length === 0 && claimedSlots.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-100 p-12 text-center">
        <Calendar className="w-10 h-10 text-neutral-200 mx-auto mb-4" />
        <p className="text-neutral-500">No open slots published</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Available Slots */}
      {activeSlots.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-neutral-700 mb-3">Available Slots</h3>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {activeSlots.map(slot => (
                <motion.div
                  key={slot.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-xl border border-neutral-200 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-sm font-medium text-neutral-900">
                          {format(new Date(slot.scheduled_time), 'EEEE, MMMM d')}
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
                          Available
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {format(new Date(slot.scheduled_time), 'h:mm a')}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {slot.facility_name}
                        </span>
                        <span className="font-medium text-neutral-900">${slot.rate}</span>
                      </div>
                      {slot.description && (
                        <p className="text-xs text-neutral-400 mt-2">{slot.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => cancelSlotMutation.mutate(slot.id)}
                      className="text-neutral-400 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Claimed Slots */}
      {claimedSlots.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-neutral-700 mb-3">Claimed Slots</h3>
          <div className="space-y-3">
            {claimedSlots.map(slot => {
              const athlete = athletes.find(a => a.id === slot.claimed_by_athlete_id);
              return (
                <div
                  key={slot.id}
                  className="bg-white rounded-xl border border-neutral-200 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-sm font-medium text-neutral-900">
                          {format(new Date(slot.scheduled_time), 'EEEE, MMMM d')}
                        </div>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Claimed
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-neutral-500 mb-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {format(new Date(slot.scheduled_time), 'h:mm a')}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {slot.facility_name}
                        </span>
                        <span className="font-medium text-neutral-900">${slot.rate}</span>
                      </div>
                      {athlete && (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium"
                            style={{ backgroundColor: athlete.avatar_color }}
                          >
                            {athlete.name?.charAt(0)}
                          </div>
                          <span className="text-sm text-neutral-600">{athlete.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}