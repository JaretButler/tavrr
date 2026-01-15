import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, DollarSign, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format, addDays } from 'date-fns';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function PublishOpenSlotModal({ isOpen, onClose, coach, onSuccess }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [rate, setRate] = useState(coach?.hourly_rate?.toString() || '60');
  const [facilityName, setFacilityName] = useState('');
  const [sessionType, setSessionType] = useState('skill');
  const [description, setDescription] = useState('');

  const publishMutation = useMutation({
    mutationFn: async () => {
      const dateTime = new Date(`${selectedDate}T${selectedTime}`);
      
      await base44.entities.OpenSlot.create({
        coach_id: coach.id,
        scheduled_time: dateTime.toISOString(),
        duration_minutes: parseInt(duration),
        rate: parseFloat(rate),
        facility_name: facilityName,
        session_type: sessionType,
        description: description || undefined,
      });
    },
    onSuccess: () => {
      onSuccess?.();
      onClose();
      resetForm();
    },
  });

  const resetForm = () => {
    setSelectedDate('');
    setSelectedTime('');
    setDuration('60');
    setRate(coach?.hourly_rate?.toString() || '60');
    setFacilityName('');
    setSessionType('skill');
    setDescription('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Generate next 30 days for date options
  const dateOptions = Array.from({ length: 30 }, (_, i) => {
    const date = addDays(new Date(), i + 1);
    return {
      value: format(date, 'yyyy-MM-dd'),
      label: format(date, 'EEEE, MMM d'),
    };
  });

  // Generate time slots (6am to 9pm, every 30 mins)
  const timeOptions = [];
  for (let hour = 6; hour <= 21; hour++) {
    for (let min of [0, 30]) {
      const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      const displayTime = new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
      timeOptions.push({ value: time, label: displayTime });
    }
  }

  const canSubmit = selectedDate && selectedTime && rate && facilityName;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl border border-neutral-100 w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-neutral-900">Publish Open Slot</h2>
            <button
              onClick={handleClose}
              className="text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Date Selection */}
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date
              </label>
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a date..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
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
                Time
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

            {/* Duration & Rate */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-2 block">
                  Duration (min)
                </label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="60"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-2 block flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Rate
                </label>
                <Input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="60"
                />
              </div>
            </div>

            {/* Facility */}
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Facility
              </label>
              <Input
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                placeholder="e.g., Main Training Center"
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

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block">
                Description (Optional)
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add any details about this session..."
                className="h-20"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={publishMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={() => publishMutation.mutate()}
                disabled={!canSubmit || publishMutation.isPending}
                className="flex-1 bg-[#0066CC] hover:bg-[#0052A3]"
              >
                {publishMutation.isPending ? 'Publishing...' : 'Publish Slot'}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}