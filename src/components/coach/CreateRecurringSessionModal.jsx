import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Repeat, Calendar, Clock, DollarSign, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';

export default function CreateRecurringSessionModal({ isOpen, onClose, coach, athletes, onSuccess }) {
  const [selectedAthlete, setSelectedAthlete] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [time, setTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [rate, setRate] = useState(coach?.hourly_rate || 60);
  const [facilityName, setFacilityName] = useState('');
  const [sessionType, setSessionType] = useState('skill');
  const [recurrencePattern, setRecurrencePattern] = useState('weekly');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');

  const createMutation = useMutation({
    mutationFn: async () => {
      const athlete = athletes.find(a => a.id === selectedAthlete);
      
      await base44.entities.RecurringSession.create({
        coach_id: coach.id,
        athlete_id: selectedAthlete,
        family_id: athlete.family_id,
        day_of_week: parseInt(dayOfWeek),
        time: time,
        duration_minutes: durationMinutes,
        rate: parseFloat(rate),
        facility_name: facilityName || coach.facilities?.[0]?.name || 'TBD',
        session_type: sessionType,
        recurrence_pattern: recurrencePattern,
        recurrence_end_date: recurrenceEndDate || null,
        status: 'approved', // Coach-created sessions are auto-approved
      });
    },
    onSuccess: () => {
      onSuccess?.();
      handleClose();
    },
  });

  const handleClose = () => {
    setSelectedAthlete('');
    setDayOfWeek('');
    setTime('');
    setDurationMinutes(60);
    setRate(coach?.hourly_rate || 60);
    setFacilityName('');
    setSessionType('skill');
    setRecurrencePattern('weekly');
    setRecurrenceEndDate('');
    onClose();
  };

  // Generate time slots (6am to 9pm, every 30 mins)
  const timeOptions = [];
  for (let hour = 6; hour <= 21; hour++) {
    for (let min of [0, 30]) {
      const timeValue = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      const displayTime = new Date(`2000-01-01T${timeValue}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
      timeOptions.push({ value: timeValue, label: displayTime });
    }
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const canSubmit = selectedAthlete && dayOfWeek !== '' && time && durationMinutes && rate;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl border border-neutral-100 w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#0066CC] rounded-lg">
                <Repeat className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-neutral-900">Create Recurring Session</h2>
                <p className="text-sm text-neutral-500">Set up a repeating session pattern</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Athlete Selection */}
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block">
                Select Athlete
              </label>
              <Select value={selectedAthlete} onValueChange={setSelectedAthlete}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose athlete..." />
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

            {/* Day of Week */}
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Day of Week
              </label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose day..." />
                </SelectTrigger>
                <SelectContent>
                  {dayNames.map((day, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time */}
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Time
              </label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose time..." />
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

            {/* Duration and Rate */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-2 block">
                  Duration (min)
                </label>
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                  min="15"
                  step="15"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-2 block flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Rate
                </label>
                <input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                  min="0"
                  step="5"
                />
              </div>
            </div>

            {/* Facility */}
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Facility (Optional)
              </label>
              <input
                type="text"
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                placeholder="Enter location..."
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
              />
            </div>

            {/* Session Type */}
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block">
                Session Type
              </label>
              <Select value={sessionType} onValueChange={setSessionType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="skill">Skill Training</SelectItem>
                  <SelectItem value="fitness">Fitness</SelectItem>
                  <SelectItem value="virtual">Virtual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Recurrence Pattern */}
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

            {/* End Date */}
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
              <p className="text-xs text-neutral-500 mt-1">
                Leave empty for indefinite recurrence
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-neutral-100 flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button 
              onClick={() => createMutation.mutate()}
              disabled={!canSubmit || createMutation.isPending}
              className="bg-[#0066CC] hover:bg-[#0052A3]"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Recurring Session'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}