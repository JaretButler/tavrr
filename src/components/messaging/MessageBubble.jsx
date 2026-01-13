import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { FileText, MessageSquare } from 'lucide-react';

export default function MessageBubble({ message, isOwn }) {
  const getMessageIcon = () => {
    if (message.message_type === 'training_plan') return <FileText className="w-3 h-3" />;
    if (message.message_type === 'feedback') return <MessageSquare className="w-3 h-3" />;
    return null;
  };

  const getMessageLabel = () => {
    if (message.message_type === 'training_plan') return 'Training Plan';
    if (message.message_type === 'feedback') return 'Feedback';
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {message.message_type !== 'text' && (
          <div className={`flex items-center gap-1.5 text-xs ${isOwn ? 'text-blue-600' : 'text-neutral-600'}`}>
            {getMessageIcon()}
            <span className="font-medium">{getMessageLabel()}</span>
          </div>
        )}
        <div
          className={`rounded-2xl px-4 py-2.5 ${
            isOwn
              ? 'bg-[#0066CC] text-white'
              : 'bg-white border border-neutral-100 text-neutral-900'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <span className="text-xs text-neutral-400 px-1">
          {format(new Date(message.created_date), 'h:mm a')}
        </span>
      </div>
    </motion.div>
  );
}