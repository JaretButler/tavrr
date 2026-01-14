import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format, addDays, startOfWeek, isSameDay, parseISO, setHours, setMinutes, getDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Clock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function BookingCalendar({ coachId, athleteId, familyId, onBooked }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState('weekly');
  const [recurringEndDate, setRecurringEndDate] = useState('');
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const queryClient = useQueryClient();

  const { data: availability = [] } = useQuery({
    queryKey: ['availability', coachId],
    queryFn: () => base44.entities.Availability.filter({ coach_id: coachId }),
    enabled: !!coachId,
  });

  const { data: existingSessions = [] } = useQuery({
    queryKey: ['coachSessions', coachId],
    queryFn: () => base44.entities.Session.filter({ coach_id: coachId }),
    enabled: !!coachId,
  });

  const { data: coach } = useQuery({
    queryKey: ['coach', coachId],
    queryFn: () => base44.entities.Coach.filter({ id: coachId }),
    enabled: !!coachId,
    select: (data) => data[0],
  });

  const bookMutation = useMutation({
    mutationFn: async (bookingData) => {
      if (isRecurring && recurringEndDate) {
        // Create recurring sessions
        const sessions = [];
        let currentDate = new Date(bookingData.scheduled_time);
        const endDate = new Date(recurringEndDate);
        
        while (currentDate <= endDate) {
          sessions.push({
            ...bookingData,
            scheduled_time: currentDate.toISOString(),
          });
          
          // Calculate next occurrence
          if (recurringFrequency === 'weekly') {
            currentDate = addDays(currentDate, 7);
          } else if (recurringFrequency === 'biweekly') {
            currentDate = addDays(currentDate, 14);
          } else if (recurringFrequency === 'monthly') {
            currentDate = addDays(currentDate, 30);
          }
        }
        
        await base44.entities.Session.bulkCreate(sessions);
      } else {
        await base44.entities.Session.create(bookingData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coachSessions'] });
      queryClient.invalidateQueries({ queryKey: ['familySessions'] });
      setSelectedSlot(null);
      setIsRecurring(false);
      setRecurringEndDate('');
      onBooked?.();
    },
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const availableSlots = useMemo(() => {
    return weekDays.map(day => {
      const dayOfWeek = getDay(day);
      const dayAvailability = availability.filter(a => a.day_of_week === dayOfWeek && a.is_active);
      
      const slots = [];
      dayAvailability.forEach(avail => {
        const [startHour, startMin] = avail.start_time.split(':').map(Number);
        const [endHour, endMin] = avail.end_time.split(':').map(Number);
        
        // Create 1-hour slots
        for (let hour = startHour; hour < endHour; hour++) {
          const slotStart = setMinutes(setHours(day, hour), startMin);
          const slotEnd = setMinutes(setHours(day, hour + 1), startMin);
          
          // Check if slot is already booked
          const isBooked = existingSessions.some(session => {
            const sessionTime = new Date(session.scheduled_time);
            return isSameDay(sessionTime, day) && 
                   sessionTime.getHours() === hour &&
                   session.status !== 'cancelled';
          });
          
          if (!isBooked && slotStart > new Date()) {
            slots.push({
              start: slotStart,
              end: slotEnd,
              time: format(slotStart, 'h:mm a'),
            });
          }
        }
      });
      
      return { day, slots };
    });
  }, [weekDays, availability, existingSessions]);

  const handleBooking = () => {
    if (!selectedSlot) return;
    
    bookMutation.mutate({
      coach_id: coachId,
      athlete_id: athleteId,
      family_id: familyId,
      scheduled_time: selectedSlot.start.toISOString(),
      duration_minutes: 60,
      rate: coach?.hourly_rate || 0,
      facility_name: coach?.facilities?.[0]?.name || '',
      session_type: 'skill',
      status: 'scheduled',
      rsvp_status: 'confirmed',
    });
  };

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setWeekStart(addDays(weekStart, -7))}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium text-neutral-700">
          {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setWeekStart(addDays(weekStart, 7))}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Available Slots Grid */}
      <div className="grid grid-cols-7 gap-2">
        {availableSlots.map(({ day, slots }, dayIndex) => (
          <div key={dayIndex} className="space-y-2">
            <div className="text-center py-2 bg-neutral-50 rounded-lg">
              <p className="text-xs font-medium text-neutral-500 uppercase">
                {format(day, 'EEE')}
              </p>
              <p className="text-sm font-semibold text-neutral-900">
                {format(day, 'd')}
              </p>
            </div>
            
            <div className="space-y-1">
              {slots.length === 0 ? (
                <p className="text-xs text-neutral-300 text-center py-2">No slots</p>
              ) : (
                slots.map((slot, slotIndex) => (
                  <button
                    key={slotIndex}
                    onClick={() => setSelectedSlot(slot)}
                    className={`w-full px-2 py-1.5 rounded-lg text-xs transition-colors ${
                      selectedSlot?.start?.getTime() === slot.start.getTime()
                        ? 'bg-[#0066CC] text-white'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Recurring Options */}
      {selectedSlot && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-neutral-100 p-6"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
                id="recurring"
              />
              <label htmlFor="recurring" className="text-sm font-medium text-neutral-700">
                Make this a recurring session
              </label>
            </div>

            {isRecurring && (
              <div className="grid grid-cols-2 gap-4 pl-7">
                <Select value={recurringFrequency} onValueChange={setRecurringFrequency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="date"
                  value={recurringEndDate}
                  onChange={(e) => setRecurringEndDate(e.target.value)}
                  min={format(selectedSlot.start, 'yyyy-MM-dd')}
                  placeholder="End date"
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {format(selectedSlot.start, 'EEEE, MMMM d')}
                </p>
                <p className="text-sm text-neutral-500">
                  {selectedSlot.time} • ${coach?.hourly_rate || 0}/hour
                </p>
              </div>
              <Button
                onClick={handleBooking}
                disabled={bookMutation.isPending || (isRecurring && !recurringEndDate)}
                className="bg-[#0066CC] hover:bg-[#0052A3]"
              >
                <Check className="w-4 h-4 mr-2" />
                {bookMutation.isPending ? 'Booking...' : 'Confirm Booking'}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}