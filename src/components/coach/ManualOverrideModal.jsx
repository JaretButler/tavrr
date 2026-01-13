import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function ManualOverrideModal({ isOpen, onClose, session, athlete, onConfirm, isLoading }) {
  const [sendNotification, setSendNotification] = useState(true);
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm({
      sessionId: session.id,
      sendNotification,
      reason,
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
            <h2 className="text-lg font-medium text-neutral-900">Manual Arrival</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-neutral-400" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Warning */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Override Verification</p>
                <p className="text-xs text-amber-600 mt-1">
                  This bypasses the electronic handshake. A verification request will be sent to the parent for confirmation.
                </p>
              </div>
            </div>

            {/* Session Info */}
            <div className="space-y-3">
              <Label className="text-xs tracking-wider uppercase text-neutral-400">Session Details</Label>
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                  style={{ backgroundColor: athlete?.avatar_color || '#6B7280' }}
                >
                  {athlete?.name?.charAt(0) || 'A'}
                </div>
                <div>
                  <p className="font-medium text-neutral-900">{athlete?.name}</p>
                  <p className="text-sm text-neutral-500">${session?.rate} session</p>
                </div>
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label className="text-xs tracking-wider uppercase text-neutral-400">Reason (Optional)</Label>
              <Textarea
                placeholder="e.g., Virtual session, device malfunction..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="resize-none h-20 border-neutral-200 focus:border-neutral-300 focus:ring-0"
              />
            </div>

            {/* Notification Toggle */}
            <div className="flex items-center justify-between py-3 px-4 bg-neutral-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-neutral-700">Notify Parent</p>
                <p className="text-xs text-neutral-400 mt-0.5">Send verification request to parent</p>
              </div>
              <Switch 
                checked={sendNotification} 
                onCheckedChange={setSendNotification}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-neutral-100 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={isLoading}
              className="bg-[#0066CC] hover:bg-[#0052A3] text-white"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Confirm Arrival
                </span>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}