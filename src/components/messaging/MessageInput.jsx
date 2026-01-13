import React, { useState } from 'react';
import { Send, FileText, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function MessageInput({ onSend, disabled, isCoach }) {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('text');

  const handleSend = () => {
    if (!message.trim()) return;
    onSend({ content: message, messageType });
    setMessage('');
    setMessageType('text');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-neutral-100 bg-white p-4">
      {messageType !== 'text' && (
        <div className="mb-2 flex items-center gap-2 text-xs text-neutral-600">
          {messageType === 'training_plan' && <FileText className="w-3 h-3" />}
          {messageType === 'feedback' && <MessageSquare className="w-3 h-3" />}
          <span className="font-medium">
            Sending as {messageType === 'training_plan' ? 'Training Plan' : 'Feedback'}
          </span>
          <button
            onClick={() => setMessageType('text')}
            className="ml-auto text-neutral-400 hover:text-neutral-600"
          >
            Cancel
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        {isCoach && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <FileText className="w-5 h-5 text-neutral-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setMessageType('training_plan')}>
                <FileText className="w-4 h-4 mr-2" />
                Training Plan
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMessageType('feedback')}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Feedback
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="min-h-[44px] max-h-32 resize-none"
          disabled={disabled}
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          size="icon"
          className="shrink-0 bg-[#0066CC] hover:bg-[#0052A3]"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}