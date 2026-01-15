import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { Bell, X, Check, Calendar, DollarSign, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotificationPanel({ userId, isOpen, onClose }) {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => base44.entities.Notification.filter({ user_id: userId }, '-created_date'),
    enabled: !!userId && isOpen,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      await base44.entities.Notification.update(notificationId, { read: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(
        unreadNotifications.map(n => 
          base44.entities.Notification.update(n.id, { read: true })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'session_confirmed':
      case 'session_reminder':
        return <Calendar className="w-5 h-5 text-emerald-600" />;
      case 'session_cancelled':
        return <X className="w-5 h-5 text-red-600" />;
      case 'payment_received':
        return <DollarSign className="w-5 h-5 text-blue-600" />;
      case 'booking_request':
      case 'slot_claimed':
        return <MessageCircle className="w-5 h-5 text-[#0066CC]" />;
      default:
        return <Bell className="w-5 h-5 text-neutral-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="border-b border-neutral-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-neutral-900" />
              <h2 className="text-lg font-semibold text-neutral-900">Notifications</h2>
              {unreadCount > 0 && (
                <span className="bg-[#0066CC] text-white text-xs font-medium px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              className="text-xs text-[#0066CC] hover:text-[#0052A3] h-7"
            >
              Mark all as read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-neutral-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <Bell className="w-12 h-12 text-neutral-200 mb-3" />
              <p className="text-neutral-400">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {notifications.map(notification => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 cursor-pointer hover:bg-neutral-50 transition-colors ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => {
                    if (!notification.read) {
                      markAsReadMutation.mutate(notification.id);
                    }
                    if (notification.action_url) {
                      window.location.href = notification.action_url;
                    }
                  }}
                >
                  <div className="flex gap-3">
                    <div className="shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-sm font-medium text-neutral-900">
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-[#0066CC] shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-neutral-600 mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
      />
    </AnimatePresence>
  );
}