import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

import MessageBubble from '@/components/messaging/MessageBubble';
import MessageInput from '@/components/messaging/MessageInput';
import ConversationList from '@/components/messaging/ConversationList';

export default function Messages() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();
  const location = useLocation();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: coach } = useQuery({
    queryKey: ['coach', user?.email],
    queryFn: () => base44.entities.Coach.filter({ user_id: user?.email }),
    enabled: !!user?.email,
    select: (data) => data[0],
  });

  const { data: family } = useQuery({
    queryKey: ['family', user?.email],
    queryFn: () => base44.entities.Family.filter({ user_id: user?.email }),
    enabled: !!user?.email,
    select: (data) => data[0],
  });

  const { data: athletes = [] } = useQuery({
    queryKey: ['athletes'],
    queryFn: () => base44.entities.Athlete.list(),
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list(),
  });

  const { data: families = [] } = useQuery({
    queryKey: ['families'],
    queryFn: () => base44.entities.Family.list(),
  });

  const isCoach = !!coach;
  const currentEntityId = isCoach ? coach?.id : family?.id;

  const { data: allMessages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', currentEntityId],
    queryFn: () => base44.entities.Message.list('-created_date', 500),
    enabled: !!currentEntityId,
  });

  // Subscribe to real-time message updates
  useEffect(() => {
    const unsubscribe = base44.entities.Message.subscribe((event) => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      if (selectedConversation && event.data.conversation_id === selectedConversation.conversation_id) {
        scrollToBottom();
      }
    });
    return unsubscribe;
  }, [queryClient, selectedConversation]);

  // Build conversations from messages
  const conversations = React.useMemo(() => {
    if (!allMessages.length || !currentEntityId) return [];

    const convMap = new Map();

    allMessages.forEach(msg => {
      const isOwnMessage = (isCoach && msg.sender_id === coach?.id) || (!isCoach && msg.sender_id === family?.id);
      const otherPartyId = isOwnMessage ? msg.receiver_id : msg.sender_id;
      const convId = msg.conversation_id;

      if (!convMap.has(convId)) {
        const otherParty = isCoach 
          ? families.find(f => f.id === otherPartyId)
          : coaches.find(c => c.id === otherPartyId);

        const athlete = athletes.find(a => a.id === msg.athlete_id);

        convMap.set(convId, {
          conversation_id: convId,
          name: isCoach ? (athlete?.name || 'Family') : (otherParty?.display_name || 'Coach'),
          avatarColor: isCoach ? athlete?.avatar_color : '#6B7280',
          lastMessage: msg.content,
          lastMessageDate: msg.created_date,
          unreadCount: 0,
          otherPartyId,
          athleteId: msg.athlete_id,
        });
      }

      const conv = convMap.get(convId);
      if (!isOwnMessage && !msg.read) {
        conv.unreadCount++;
      }
    });

    return Array.from(convMap.values()).sort((a, b) => 
      new Date(b.lastMessageDate) - new Date(a.lastMessageDate)
    );
  }, [allMessages, currentEntityId, isCoach, coach, family, athletes, coaches, families]);

  // Get messages for selected conversation
  const conversationMessages = selectedConversation
    ? allMessages.filter(m => m.conversation_id === selectedConversation.conversation_id).reverse()
    : [];

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      const unreadMessages = conversationMessages.filter(m => 
        !m.read && 
        ((isCoach && m.sender_type === 'family') || (!isCoach && m.sender_type === 'coach'))
      );
      
      unreadMessages.forEach(msg => {
        base44.entities.Message.update(msg.id, { read: true });
      });
    }
  }, [selectedConversation, conversationMessages, isCoach]);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, messageType }) => {
      const conversationId = selectedConversation.conversation_id;
      await base44.entities.Message.create({
        conversation_id: conversationId,
        sender_id: currentEntityId,
        sender_type: isCoach ? 'coach' : 'family',
        receiver_id: selectedConversation.otherPartyId,
        receiver_type: isCoach ? 'family' : 'coach',
        content,
        message_type: messageType,
        athlete_id: selectedConversation.athleteId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      scrollToBottom();
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  // Auto-select conversation from URL or first conversation
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const convId = params.get('conversation_id');
    
    if (convId && conversations.length > 0) {
      const conv = conversations.find(c => c.conversation_id === convId);
      if (conv) setSelectedConversation(conv);
    } else if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0]);
    }
  }, [conversations, location.search]);

  const unreadTotal = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="h-screen flex flex-col bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-100 px-6 py-4 shrink-0">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl(isCoach ? 'CoachDashboard' : 'FamilyDashboard')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-medium text-neutral-900">Messages</h1>
            {unreadTotal > 0 && (
              <p className="text-xs text-neutral-500">{unreadTotal} unread</p>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List */}
        <div className="w-80 bg-neutral-50 border-r border-neutral-100 overflow-y-auto p-4">
          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelect={setSelectedConversation}
            isLoading={messagesLoading}
          />
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-neutral-100 px-6 py-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm"
                    style={{ backgroundColor: selectedConversation.avatarColor }}
                  >
                    {selectedConversation.name?.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-sm font-medium text-neutral-900">
                      {selectedConversation.name}
                    </h2>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 bg-neutral-50">
                {conversationMessages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={(isCoach && message.sender_id === coach?.id) || (!isCoach && message.sender_id === family?.id)}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <MessageInput
                onSend={(data) => sendMessageMutation.mutate(data)}
                disabled={sendMessageMutation.isPending}
                isCoach={isCoach}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
                <p className="text-neutral-400">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}