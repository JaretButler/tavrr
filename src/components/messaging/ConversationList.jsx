import React from 'react';
import { motion } from 'framer-motion';
import { format, isToday, isYesterday } from 'date-fns';
import { MessageCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ConversationList({ conversations, selectedConversation, onSelect, isLoading }) {
  const formatTime = (date) => {
    const d = new Date(date);
    if (isToday(d)) return format(d, 'h:mm a');
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMM d');
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MessageCircle className="w-12 h-12 text-neutral-200 mb-3" />
        <p className="text-sm text-neutral-400">No conversations yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {conversations.map((conv) => (
        <motion.button
          key={conv.conversation_id}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onSelect(conv)}
          className={`w-full text-left p-4 rounded-xl transition-colors ${
            selectedConversation?.conversation_id === conv.conversation_id
              ? 'bg-blue-50 border border-blue-100'
              : 'bg-white border border-neutral-100 hover:bg-neutral-50'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm shrink-0"
              style={{ backgroundColor: conv.avatarColor || '#6B7280' }}
            >
              {conv.name?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {conv.name}
                </p>
                <span className="text-xs text-neutral-400 shrink-0 ml-2">
                  {formatTime(conv.lastMessageDate)}
                </span>
              </div>
              <p className="text-xs text-neutral-500 truncate">{conv.lastMessage}</p>
              {conv.unreadCount > 0 && (
                <div className="mt-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-[#0066CC] rounded-full">
                    {conv.unreadCount}
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}