import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AvailabilityManager({ coachId }) {
  const [newSlot, setNewSlot] = useState({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00',
  });
  const queryClient = useQueryClient();

  const { data: availability = [], isLoading } = useQuery({
    queryKey: ['availability', coachId],
    queryFn: () => base44.entities.Availability.filter({ coach_id: coachId }),
    enabled: !!coachId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Availability.create({ ...data, coach_id: coachId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      setNewSlot({ day_of_week: 1, start_time: '09:00', end_time: '17:00' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Availability.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });

  const groupedByDay = DAYS.map((day, index) => ({
    day,
    dayIndex: index,
    slots: availability.filter(a => a.day_of_week === index),
  }));

  return (
    <div className="space-y-6">
      {/* Add New Slot */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-6">
        <h3 className="text-lg font-medium text-neutral-900 mb-4">Add Availability</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            value={newSlot.day_of_week.toString()}
            onValueChange={(value) => setNewSlot({ ...newSlot, day_of_week: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAYS.map((day, index) => (
                <SelectItem key={index} value={index.toString()}>{day}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="time"
            value={newSlot.start_time}
            onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
          />

          <Input
            type="time"
            value={newSlot.end_time}
            onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
          />

          <Button
            onClick={() => createMutation.mutate(newSlot)}
            disabled={createMutation.isPending}
            className="bg-[#0066CC] hover:bg-[#0052A3]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Slot
          </Button>
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h3 className="text-lg font-medium text-neutral-900">Weekly Schedule</h3>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {groupedByDay.map(({ day, dayIndex, slots }) => (
                <div key={dayIndex} className="flex items-start gap-4">
                  <div className="w-32 pt-2">
                    <span className="text-sm font-medium text-neutral-700">{day}</span>
                  </div>
                  <div className="flex-1">
                    {slots.length === 0 ? (
                      <p className="text-sm text-neutral-400 py-2">No availability</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <AnimatePresence>
                          {slots.map(slot => (
                            <motion.div
                              key={slot.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg"
                            >
                              <Clock className="w-3 h-3 text-emerald-600" />
                              <span className="text-sm text-emerald-700">
                                {slot.start_time} - {slot.end_time}
                              </span>
                              <button
                                onClick={() => deleteMutation.mutate(slot.id)}
                                className="ml-1 text-emerald-600 hover:text-emerald-800"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}