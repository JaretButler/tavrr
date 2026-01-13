import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, Dumbbell, Zap, Video, Calendar, MapPin, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SessionHistoryModal({ isOpen, onClose, sessions, athletes, coaches }) {
  const [filterType, setFilterType] = useState('all');

  if (!isOpen) return null;

  const sessionTypeConfig = {
    skill: { icon: Zap, label: 'Skill', color: 'text-blue-600', bg: 'bg-blue-50' },
    fitness: { icon: Dumbbell, label: 'Fitness', color: 'text-orange-600', bg: 'bg-orange-50' },
    virtual: { icon: Video, label: 'Virtual', color: 'text-purple-600', bg: 'bg-purple-50' },
  };

  const filteredSessions = filterType === 'all' 
    ? sessions 
    : sessions.filter(s => s.session_type === filterType);

  const totalSpent = filteredSessions.reduce((sum, s) => sum + (s.rate || 0), 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden"
        >
          {/* Header */}
          <div className="border-b border-neutral-100 px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-medium text-neutral-900">Session History</h2>
                <p className="text-sm text-neutral-500 mt-1">
                  {filteredSessions.length} completed sessions · ${totalSpent.toFixed(2)} total
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-neutral-400" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="skill">Skill</SelectItem>
                  <SelectItem value="fitness">Fitness</SelectItem>
                  <SelectItem value="virtual">Virtual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sessions List */}
          <div className="overflow-y-auto max-h-[calc(85vh-140px)] p-6">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-neutral-400">No sessions found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSessions.map((session) => {
                  const athlete = athletes.find(a => a.id === session.athlete_id);
                  const coach = coaches.find(c => c.id === session.coach_id);
                  const typeConfig = sessionTypeConfig[session.session_type] || sessionTypeConfig.skill;
                  const TypeIcon = typeConfig.icon;

                  return (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-neutral-50 rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
                            style={{ backgroundColor: athlete?.avatar_color || '#6B7280' }}
                          >
                            {athlete?.name?.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-neutral-900">
                              {athlete?.name}
                            </h3>
                            <p className="text-xs text-neutral-500">
                              with {coach?.display_name || 'Coach'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className={`px-2 py-1 rounded-lg flex items-center gap-1.5 ${typeConfig.bg}`}>
                            <TypeIcon className={`w-3 h-3 ${typeConfig.color}`} />
                            <span className={`text-xs font-medium ${typeConfig.color}`}>
                              {typeConfig.label}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-neutral-900">
                            ${session.rate}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-neutral-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(session.scheduled_time), 'MMM d, yyyy · h:mm a')}
                        </div>
                        {session.facility_name && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {session.facility_name}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <span>{session.duration_minutes || 60} min</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}