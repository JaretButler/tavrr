import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns';
import { Button } from '@/components/ui/button';

export default function TrainingCalendar({ sessions = [], onDateSelect, selectedDate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getSessionsForDay = (day) => {
    return sessions.filter(session => 
      isSameDay(new Date(session.scheduled_time), day)
    );
  };

  const getSessionIndicator = (daySessions) => {
    if (daySessions.length === 0) return null;
    const hasVerified = daySessions.some(s => s.status === 'verified');
    const hasPending = daySessions.some(s => s.rsvp_status === 'pending');
    
    if (hasVerified) return 'bg-emerald-500';
    if (hasPending) return 'bg-amber-400';
    return 'bg-[#0066CC]';
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-50 rounded-lg">
              <CalendarIcon className="w-5 h-5 text-neutral-600" />
            </div>
            <div>
              <h3 className="font-medium text-neutral-900">Training Calendar</h3>
              <p className="text-xs text-neutral-400">Tavrr-verified sessions only</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium text-neutral-700 min-w-[120px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center py-2">
              <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                {day}
              </span>
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const daySessions = getSessionsForDay(day);
            const indicator = getSessionIndicator(daySessions);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            
            return (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onDateSelect?.(day)}
                className={`
                  relative aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-colors
                  ${isCurrentMonth ? 'text-neutral-900' : 'text-neutral-300'}
                  ${isToday(day) ? 'bg-neutral-100' : ''}
                  ${isSelected ? 'bg-[#0066CC] text-white' : 'hover:bg-neutral-50'}
                `}
              >
                <span className={`text-sm ${isSelected ? 'font-medium' : ''}`}>
                  {format(day, 'd')}
                </span>
                
                {indicator && (
                  <div className="flex items-center gap-0.5">
                    {daySessions.slice(0, 3).map((_, i) => (
                      <div 
                        key={i}
                        className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : indicator}`}
                      />
                    ))}
                    {daySessions.length > 3 && (
                      <span className={`text-[8px] ml-0.5 ${isSelected ? 'text-white/70' : 'text-neutral-400'}`}>
                        +{daySessions.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-3 border-t border-neutral-100 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-neutral-500">Verified</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#0066CC]" />
          <span className="text-xs text-neutral-500">Confirmed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-xs text-neutral-500">Pending RSVP</span>
        </div>
      </div>
    </div>
  );
}