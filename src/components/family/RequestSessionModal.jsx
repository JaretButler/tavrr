import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, User, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, addDays } from 'date-fns';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function RequestSessionModal({ isOpen, onClose, coaches, athletes, family, onSuccess, embedded = false }) {
  const [selectedCoach, setSelectedCoach] = useState('');
  const [selectedAthlete, setSelectedAthlete] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState('weekly');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');

  const requestMutation = useMutation({
    mutationFn: async () => {
      const coach = coaches.find(c => c.id === selectedCoach);
      const athlete = athletes.find(a => a.id === selectedAthlete);
      
      const dateTime = new Date(`${selectedDate}T${selectedTime}`);
      
      if (isRecurring) {
        // Create a recurring session request
        const dayOfWeek = dateTime.getDay();
        await base44.entities.RecurringSession.create({
          family_id: family.id,
          coach_id: selectedCoach,
          athlete_id: selectedAthlete,
          day_of_week: dayOfWeek,
          time: selectedTime,
          duration_minutes: 60,
          rate: coach.hourly_rate || 60,
          recurrence_pattern: recurrencePattern,
          recurrence_end_date: recurrenceEndDate,
          status: 'pending',
        });

        // Send message to coach about recurring request
        const conversationId = `conv_${family.id}_${selectedCoach}_${selectedAthlete}_${Date.now()}`;
        await base44.entities.Message.create({
          conversation_id: conversationId,
          sender_id: family.id,
          sender_type: 'family',
          receiver_id: selectedCoach,
          receiver_type: 'coach',
          content: `Hi ${coach.display_name}! I'd like to request recurring ${recurrencePattern} lessons for ${athlete.name} on ${format(dateTime, 'EEEE')}s at ${format(dateTime, 'h:mm a')}${recurrenceEndDate ? ` until ${format(new Date(recurrenceEndDate), 'MMM d, yyyy')}` : ''}. Please let me know if this works for you!`,
          message_type: 'text',
          athlete_id: selectedAthlete,
        });
      } else {
        // Create a one-time booking request
        await base44.entities.BookingRequest.create({
          family_id: family.id,
          coach_id: selectedCoach,
          athlete_id: selectedAthlete,
          requested_time: dateTime.toISOString(),
        });

        // Send message to coach
        const conversationId = `conv_${family.id}_${selectedCoach}_${selectedAthlete}_${Date.now()}`;
        await base44.entities.Message.create({
          conversation_id: conversationId,
          sender_id: family.id,
          sender_type: 'family',
          receiver_id: selectedCoach,
          receiver_type: 'coach',
          content: `Hi ${coach.display_name}! I'd like to request a lesson for ${athlete.name} on ${format(dateTime, 'EEEE, MMMM d')} at ${format(dateTime, 'h:mm a')}. Please let me know if this works for you!`,
          message_type: 'text',
          athlete_id: selectedAthlete,
        });
      }
    },
    onSuccess: () => {
      onSuccess?.();
      onClose();
      resetForm();
    },
  });

  const resetForm = () => {
    setSelectedCoach('');
    setSelectedAthlete('');
    setSelectedDate('');
    setSelectedTime('');
    setIsRecurring(false);
    setRecurrencePattern('weekly');
    setRecurrenceEndDate('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Generate next 14 days for date options
  const dateOptions = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(new Date(), i + 1);
    return {
      value: format(date, 'yyyy-MM-dd'),
      label: format(date, 'EEEE, MMM d'),
    };
  });

  // Generate time slots (8am to 8pm, every 30 mins)
  const timeOptions = [];
  for (let hour = 8; hour <= 20; hour++) {
    for (let min of [0, 30]) {
      const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      const displayTime = new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
      timeOptions.push({ value: time, label: displayTime });
    }
  }

  const canSubmit = selectedCoach && selectedAthlete && selectedDate && selectedTime;

  if (embedded) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-100 p-6">
        <div className="space-y-4">
          {/* Coach Selection */}
          <div>
            <label className="text-sm font-medium text-neutral-700 mb-2 block">
              Select Instructor
            </label>
            <Select value={selectedCoach} onValueChange={setSelectedCoach}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose an instructor..." />
              </SelectTrigger>
              <SelectContent>
                {coaches.map(coach => (
                  <SelectItem key={coach.id} value={coach.id}>
                    {coach.display_name} {coach.sport_discipline && `• ${coach.sport_discipline}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Athlete Selection */}
          <div>
            <label className="text-sm font-medium text-neutral-700 mb-2 block">
              Select Student/Athlete
            </label>
            <Select value={selectedAthlete} onValueChange={setSelectedAthlete}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose student..." />
              </SelectTrigger>
              <SelectContent>
                {athletes.map(athlete => (
                  <SelectItem key={athlete.id} value={athlete.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: athlete.avatar_color }}
                      />
                      {athlete.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
          <div>
            <label className="text-sm font-medium text-neutral-700 mb-2 block flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Suggested Date
            </label>
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a date..." />
              </SelectTrigger>
              <SelectContent>
                {dateOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time Selection */}
          <div>
            <label className="text-sm font-medium text-neutral-700 mb-2 block flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Suggested Time
            </label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a time..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {timeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recurring Option */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isRecurring-embedded"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 text-[#0066CC] bg-white border-neutral-300 rounded focus:ring-[#0066CC]"
            />
            <label htmlFor="isRecurring-embedded" className="text-sm font-medium text-neutral-700 flex items-center gap-2">
              <Repeat className="w-4 h-4" />
              Make this recurring
            </label>
          </div>

          {isRecurring && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-2 block">
                  Repeat Every
                </label>
                <Select value={recurrencePattern} onValueChange={setRecurrencePattern}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Week</SelectItem>
                    <SelectItem value="biweekly">2 Weeks</SelectItem>
                    <SelectItem value="monthly">Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-700 mb-2 block">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={recurrenceEndDate}
                  onChange={(e) => setRecurrenceEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={() => requestMutation.mutate()}
            disabled={!canSubmit || requestMutation.isPending}
            className="w-full bg-[#0066CC] hover:bg-[#0052A3]"
          >
            {requestMutation.isPending ? 'Sending...' : 'Send Request'}
          </Button>
        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl border border-neutral-100 w-full max-w-md p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-neutral-900">Request Session</h2>
            <button
              onClick={handleClose}
              className="text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Coach Selection */}
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block">
                Select Instructor
              </label>
              <Select value={selectedCoach} onValueChange={setSelectedCoach}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose an instructor..." />
                </SelectTrigger>
                <SelectContent>
                  {coaches.map(coach => (
                    <SelectItem key={coach.id} value={coach.id}>
                      {coach.display_name} {coach.sport_discipline && `• ${coach.sport_discipline}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Athlete Selection */}
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block">
                Select Student
              </label>
              <Select value={selectedAthlete} onValueChange={setSelectedAthlete}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose student..." />
                </SelectTrigger>
                <SelectContent>
                  {athletes.map(athlete => (
                    <SelectItem key={athlete.id} value={athlete.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: athlete.avatar_color }}
                        />
                        {athlete.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Selection */}
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Suggested Date
              </label>
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a date..." />
                </SelectTrigger>
                <SelectContent>
                  {dateOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time Selection */}
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Suggested Time
              </label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a time..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {timeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recurring Option */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isRecurring-modal"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 text-[#0066CC] bg-white border-neutral-300 rounded focus:ring-[#0066CC]"
              />
              <label htmlFor="isRecurring-modal" className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                <Repeat className="w-4 h-4" />
                Make this recurring
              </label>
            </div>

            {isRecurring && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-sm font-medium text-neutral-700 mb-2 block">
                    Repeat Every
                  </label>
                  <Select value={recurrencePattern} onValueChange={setRecurrencePattern}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Week</SelectItem>
                      <SelectItem value="biweekly">2 Weeks</SelectItem>
                      <SelectItem value="monthly">Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-neutral-700 mb-2 block">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={recurrenceEndDate}
                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={requestMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={() => requestMutation.mutate()}
                disabled={!canSubmit || requestMutation.isPending}
                className="flex-1 bg-[#0066CC] hover:bg-[#0052A3]"
              >
                {requestMutation.isPending ? 'Sending...' : 'Send Request'}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}