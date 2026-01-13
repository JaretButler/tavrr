import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NewMessageModal({ isOpen, onClose, coaches = [], athletes = [], onSelect }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-2xl shadow-xl w-full max-w-md"
        >
          <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
            <h2 className="text-lg font-medium text-neutral-900">New Message</h2>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6">
            <p className="text-sm text-neutral-500 mb-4">Select a coach/instructor to message:</p>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {coaches.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-8">
                  No coaches available
                </p>
              ) : (
                coaches.map(coach => (
                  <button
                    key={coach.id}
                    onClick={() => {
                      onSelect(coach, athletes[0]);
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 p-4 bg-neutral-50 hover:bg-neutral-100 rounded-xl transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 font-medium text-sm">
                      {coach.display_name?.charAt(0) || 'C'}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-neutral-900">{coach.display_name || 'Coach'}</p>
                      {coach.sport_discipline && (
                        <p className="text-xs text-neutral-500">{coach.sport_discipline}</p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}