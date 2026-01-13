import React from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, User, CheckCircle2, XCircle, AlertCircle, MoreVertical, Send } from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const statusConfig = {
  scheduled: { color: 'bg-neutral-100 text-neutral-600', label: 'Scheduled' },
  verified: { color: 'bg-emerald-50 text-emerald-700', label: 'Verified' },
  completed: { color: 'bg-blue-50 text-blue-700', label: 'Completed' },
  cancelled: { color: 'bg-neutral-100 text-neutral-400', label: 'Cancelled' },
  no_show: { color: 'bg-red-50 text-red-600', label: 'No Show' },
};

const rsvpConfig = {
  pending: { icon: AlertCircle, color: 'text-amber-500' },
  confirmed: { icon: CheckCircle2, color: 'text-emerald-500' },
  declined: { icon: XCircle, color: 'text-red-500' },
};

export default function SessionCard({ session, athlete, onManualOverride, onCancel, onManualSend }) {
  const sessionDate = new Date(session.scheduled_time);
  const status = statusConfig[session.status] || statusConfig.scheduled;
  const rsvp = rsvpConfig[session.rsvp_status] || rsvpConfig.pending;
  const RsvpIcon = rsvp.icon;

  const getDateLabel = () => {
    if (isToday(sessionDate)) return 'Today';
    if (isTomorrow(sessionDate)) return 'Tomorrow';
    return format(sessionDate, 'EEE, MMM d');
  };

  const isVerifiable = session.status === 'scheduled' && !isPast(sessionDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-neutral-100 rounded-xl p-5 hover:border-neutral-200 transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-11 h-11 rounded-full flex items-center justify-center text-white font-medium"
            style={{ backgroundColor: athlete?.avatar_color || '#6B7280' }}
          >
            {athlete?.name?.charAt(0) || 'A'}
          </div>
          <div>
            <p className="font-medium text-neutral-900">{athlete?.name || 'Athlete'}</p>
            <p className="text-xs text-neutral-400">{athlete?.sport_discipline}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-4 h-4 text-neutral-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {isVerifiable && (
                <DropdownMenuItem onClick={() => onManualOverride?.(session)}>
                  Manual Arrival
                </DropdownMenuItem>
              )}
              {session.status === 'verified' && (
                <DropdownMenuItem onClick={() => onManualSend?.(session)}>
                  <Send className="w-4 h-4 mr-2" />
                  Manual Send
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onCancel?.(session)} className="text-red-600">
                Cancel Session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-neutral-300" />
            <span className="text-sm text-neutral-600">
              {getDateLabel()} · {format(sessionDate, 'h:mm a')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <RsvpIcon className={`w-4 h-4 ${rsvp.color}`} />
            <span className="text-xs text-neutral-500 capitalize">{session.rsvp_status}</span>
          </div>
        </div>

        {session.facility_name && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-neutral-300" />
            <span className="text-sm text-neutral-500">{session.facility_name}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-neutral-50 flex items-center justify-between">
        <span className="text-lg font-medium text-neutral-900">${session.rate}</span>
        
        {session.verification && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-400">Gates:</span>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${session.verification.gate_1_time ? 'bg-emerald-500' : 'bg-neutral-200'}`} 
                   title="Time" />
              <div className={`w-2 h-2 rounded-full ${session.verification.gate_2_location ? 'bg-emerald-500' : 'bg-neutral-200'}`}
                   title="Location" />
              <div className={`w-2 h-2 rounded-full ${session.verification.gate_3_proximity ? 'bg-emerald-500' : 'bg-neutral-200'}`}
                   title="Proximity" />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}