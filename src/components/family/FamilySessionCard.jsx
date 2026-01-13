import React from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, User, CheckCircle2, XCircle, Lock } from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';
import { Button } from '@/components/ui/button';

const statusConfig = {
  scheduled: { bg: 'bg-neutral-50', border: 'border-neutral-100' },
  verified: { bg: 'bg-emerald-50', border: 'border-emerald-100' },
  completed: { bg: 'bg-blue-50', border: 'border-blue-100' },
  cancelled: { bg: 'bg-neutral-50', border: 'border-neutral-100' },
};

export default function FamilySessionCard({ 
  session, 
  athlete, 
  coach, 
  onRsvp, 
  isLocked = false 
}) {
  const sessionDate = new Date(session.scheduled_time);
  const config = statusConfig[session.status] || statusConfig.scheduled;

  const getDateLabel = () => {
    if (isToday(sessionDate)) return 'Today';
    if (isTomorrow(sessionDate)) return 'Tomorrow';
    return format(sessionDate, 'EEE, MMM d');
  };

  const canRsvp = session.status === 'scheduled' && session.rsvp_status === 'pending';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${config.bg} border ${config.border} rounded-xl p-5 transition-all`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm"
            style={{ backgroundColor: athlete?.avatar_color || '#6B7280' }}
          >
            {athlete?.name?.charAt(0) || 'A'}
          </div>
          <div>
            <p className="font-medium text-neutral-900">{athlete?.name}</p>
            <p className="text-xs text-neutral-400">{athlete?.sport_discipline}</p>
          </div>
        </div>
        
        <span className="text-lg font-medium text-neutral-900">${session.rate}</span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-neutral-300" />
          <span className="text-sm text-neutral-600">
            {getDateLabel()} · {format(sessionDate, 'h:mm a')}
          </span>
          <span className="text-xs text-neutral-400">({session.duration_minutes}min)</span>
        </div>

        {session.facility_name && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-neutral-300" />
            <span className="text-sm text-neutral-500">{session.facility_name}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-neutral-300" />
          <span className="text-sm text-neutral-500">Coach {coach?.display_name}</span>
        </div>
      </div>

      {canRsvp && (
        <div className="pt-4 border-t border-neutral-100">
          {isLocked ? (
            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
              <Lock className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-amber-700">Settle balance to unlock RSVP</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => onRsvp(session.id, 'confirmed')}
                className="flex-1 bg-[#0066CC] hover:bg-[#0052A3] text-white rounded-lg h-10"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Confirm
              </Button>
              <Button
                onClick={() => onRsvp(session.id, 'declined')}
                variant="outline"
                className="flex-1 border-neutral-200 text-neutral-600 rounded-lg h-10"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Decline
              </Button>
            </div>
          )}
        </div>
      )}

      {session.rsvp_status !== 'pending' && (
        <div className="pt-4 border-t border-neutral-100">
          <div className={`flex items-center gap-2 ${session.rsvp_status === 'confirmed' ? 'text-emerald-600' : 'text-neutral-400'}`}>
            {session.rsvp_status === 'confirmed' ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-medium">Confirmed</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Declined</span>
              </>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}