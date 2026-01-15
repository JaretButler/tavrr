import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isFuture, isSameDay } from 'date-fns';
import { Settings, Bell, Plus, MessageCircle, CheckCircle2, DollarSign, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import AthleteSwitcher from '@/components/family/AthleteSwitcher';
import BalanceCard from '@/components/family/BalanceCard';
import FamilySessionCard from '@/components/family/FamilySessionCard';
import TrainingCalendar from '@/components/calendar/TrainingCalendar';
import MessageBubble from '@/components/messaging/MessageBubble';
import MessageInput from '@/components/messaging/MessageInput';
import ConversationList from '@/components/messaging/ConversationList';
import SessionsCompletedCard from '@/components/family/SessionsCompletedCard';
import SessionHistoryModal from '@/components/family/SessionHistoryModal';
import NewMessageModal from '@/components/messaging/NewMessageModal';
import ProfileSettingsModal from '@/components/settings/ProfileSettingsModal';
import RequestSessionModal from '@/components/family/RequestSessionModal';

export default function FamilyDashboard() {
  const [selectedAthleteId, setSelectedAthleteId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isSettling, setIsSettling] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showSessionHistory, setShowSessionHistory] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showRequestSession, setShowRequestSession] = useState(false);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: family, isLoading: familyLoading } = useQuery({
    queryKey: ['family', user?.email],
    queryFn: () => base44.entities.Family.filter({ user_id: user?.email }),
    enabled: !!user?.email,
    select: (data) => data[0],
  });

  const { data: athletes = [], isLoading: athletesLoading } = useQuery({
    queryKey: ['athletes', family?.id],
    queryFn: () => base44.entities.Athlete.filter({ family_id: family?.id }),
    enabled: !!family?.id,
  });

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['familySessions', family?.id],
    queryFn: () => base44.entities.Session.filter({ family_id: family?.id }, '-scheduled_time'),
    enabled: !!family?.id,
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list(),
  });

  const { data: allMessages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', family?.id],
    queryFn: () => base44.entities.Message.list('-created_date', 500),
    enabled: !!family?.id,
  });

  // Get unread messages count
  const { data: unreadMessages = [] } = useQuery({
    queryKey: ['unreadMessages', family?.id],
    queryFn: () => base44.entities.Message.filter({ receiver_id: family?.id, read: false }),
    enabled: !!family?.id,
  });

  // Set first athlete as selected by default
  useEffect(() => {
    if (athletes.length > 0 && !selectedAthleteId) {
      setSelectedAthleteId(athletes[0].id);
    }
  }, [athletes, selectedAthleteId]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribeSession = base44.entities.Session.subscribe((event) => {
      queryClient.invalidateQueries({ queryKey: ['familySessions'] });
    });
    const unsubscribeMessage = base44.entities.Message.subscribe((event) => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      if (selectedConversation && event.data.conversation_id === selectedConversation.conversation_id) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    });
    return () => {
      unsubscribeSession();
      unsubscribeMessage();
    };
  }, [queryClient, selectedConversation]);

  const rsvpMutation = useMutation({
    mutationFn: async ({ sessionId, status }) => {
      await base44.entities.Session.update(sessionId, { rsvp_status: status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familySessions'] });
    },
  });

  const handleSettle = async () => {
    setIsSettling(true);
    // Simulate biometric/payment flow
    setTimeout(async () => {
      await base44.entities.Family.update(family.id, { current_balance: 0 });
      queryClient.invalidateQueries({ queryKey: ['family'] });
      setIsSettling(false);
    }, 2000);
  };

  // Build conversations from messages
  const conversations = React.useMemo(() => {
    if (!allMessages.length || !family?.id) return [];
    const convMap = new Map();
    allMessages.forEach(msg => {
      const isOwnMessage = msg.sender_id === family?.id;
      const otherPartyId = isOwnMessage ? msg.receiver_id : msg.sender_id;
      const convId = msg.conversation_id;
      if (!convMap.has(convId)) {
        const coach = coaches.find(c => c.id === otherPartyId);
        convMap.set(convId, {
          conversation_id: convId,
          name: coach?.display_name || 'Coach',
          avatarColor: '#6B7280',
          lastMessage: msg.content,
          lastMessageDate: msg.created_date,
          unreadCount: 0,
          otherPartyId,
          athleteId: msg.athlete_id,
        });
      }
      const conv = convMap.get(convId);
      if (!isOwnMessage && !msg.read) conv.unreadCount++;
    });
    return Array.from(convMap.values()).sort((a, b) => 
      new Date(b.lastMessageDate) - new Date(a.lastMessageDate)
    );
  }, [allMessages, family, coaches]);

  const conversationMessages = selectedConversation
    ? allMessages.filter(m => m.conversation_id === selectedConversation.conversation_id).reverse()
    : [];

  useEffect(() => {
    if (selectedConversation) {
      const unreadMsgs = conversationMessages.filter(m => !m.read && m.sender_type === 'coach');
      unreadMsgs.forEach(msg => base44.entities.Message.update(msg.id, { read: true }));
    }
  }, [selectedConversation, conversationMessages]);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, messageType }) => {
      await base44.entities.Message.create({
        conversation_id: selectedConversation.conversation_id,
        sender_id: family?.id,
        sender_type: 'family',
        receiver_id: selectedConversation.otherPartyId,
        receiver_type: 'coach',
        content,
        message_type: messageType,
        athlete_id: selectedConversation.athleteId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    },
  });

  const handleNewConversation = (coach, athlete) => {
    const conversationId = `conv_${family.id}_${coach.id}_${athlete.id}_${Date.now()}`;
    const newConversation = {
      conversation_id: conversationId,
      name: coach.display_name || 'Coach',
      avatarColor: '#6B7280',
      lastMessage: '',
      lastMessageDate: new Date().toISOString(),
      unreadCount: 0,
      otherPartyId: coach.id,
      athleteId: athlete.id,
    };
    setSelectedConversation(newConversation);
    setActiveTab('messages');
  };

  const sendPaymentReminderMutation = useMutation({
    mutationFn: async () => {
      const balance = family?.current_balance || 0;
      const coachId = owedCoach;
      const existingConv = conversations.find(c => c.otherPartyId === coachId);
      
      const conversationId = existingConv?.conversation_id || `conv_${Date.now()}`;
      
      await base44.entities.Message.create({
        conversation_id: conversationId,
        sender_id: family?.id,
        sender_type: 'family',
        receiver_id: coachId,
        receiver_type: 'coach',
        content: `Hi! I wanted to reach out about the outstanding balance of $${balance.toFixed(2)}. I plan to settle this soon. Thank you!`,
        message_type: 'text',
        athlete_id: selectedAthleteId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setActiveTab('messages');
    },
  });

  const deleteProfileMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Family.delete(family.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
      queryClient.invalidateQueries({ queryKey: ['familyProfile'] });
      window.location.href = createPageUrl('Home');
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0]);
    }
  }, [conversations]);

  // Filter sessions
  const filteredSessions = sessions.filter(s => 
    !selectedAthleteId || s.athlete_id === selectedAthleteId
  );

  const completedSessions = filteredSessions.filter(s => 
    s.status === 'completed' || s.status === 'verified'
  ).sort((a, b) => new Date(b.scheduled_time) - new Date(a.scheduled_time));

  const upcomingSessions = filteredSessions.filter(s => 
    isFuture(new Date(s.scheduled_time)) && s.status !== 'cancelled'
  ).slice(0, 5);

  const selectedDateSessions = filteredSessions.filter(s =>
    isSameDay(new Date(s.scheduled_time), selectedDate)
  );

  const isLocked = (family?.current_balance || 0) > 0;
  const isLoading = familyLoading || athletesLoading || sessionsLoading;

  // Find which coach is owed money (from most recent unpaid session)
  const owedCoach = sessions
    .filter(s => s.status === 'verified' || s.status === 'completed')
    .sort((a, b) => new Date(b.scheduled_time) - new Date(a.scheduled_time))[0]?.coach_id;
  const owedCoachData = coaches.find(c => c.id === owedCoach);
  const coachName = owedCoachData?.display_name;
  const coachAcceptedMethods = owedCoachData?.accepted_payment_methods || [];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6965c061c9809ea85fc32161/f390a923b_tfA4gvqQ0K1ptroztEoWt.png"
                alt="Tavrr"
                className="h-[3.26rem]"
              />
              <div className="border-l border-neutral-200 pl-4">
                <AthleteSwitcher
                  athletes={athletes}
                  selectedAthlete={selectedAthleteId}
                  onSelect={setSelectedAthleteId}
                  onAddAthlete={() => {}}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5 text-neutral-500" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowProfileSettings(true)}>
                <Settings className="w-5 h-5 text-neutral-500" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="mb-6 space-y-3">
            <TabsList className="h-10">
              <TabsTrigger value="dashboard" className="h-10 w-32">Home</TabsTrigger>
              <TabsTrigger value="messages" className="relative h-10 w-32">
                Messages
                {unreadMessages.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-[#0066CC] rounded-full">
                    {unreadMessages.length}
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNewMessage(true);
                  }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-[#0066CC] rounded-full flex items-center justify-center text-white hover:bg-[#0052A3] transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowRequestSession(true)}
                className="bg-[#0066CC] hover:bg-[#0052A3] h-10 w-32 text-sm"
              >
                <Plus className="w-4 h-4 -mr-2" />
                Request Session
              </Button>
              {isLocked && (
                <Button
                  variant="outline"
                  onClick={() => sendPaymentReminderMutation.mutate()}
                  disabled={sendPaymentReminderMutation.isPending}
                  className="flex items-center gap-2 text-[#0066CC] border-[#0066CC] hover:bg-[#0066CC]/5 h-10 px-6"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Send Payment Reminder</span>
                </Button>
              )}
            </div>
          </div>

          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Today's Training, Balance & Upcoming */}
          <div className="lg:col-span-1 space-y-6">
            {/* Today's Training */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs tracking-[0.2em] uppercase text-neutral-400 font-medium">
                  {isToday(selectedDate) ? "Today's Training" : format(selectedDate, 'EEEE, MMM d')}
                </span>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <Skeleton key={i} className="h-48 w-full rounded-xl" />
                  ))}
                </div>
              ) : selectedDateSessions.length === 0 ? (
                <div className="bg-white rounded-2xl border border-neutral-100 p-8 text-center">
                  <p className="text-neutral-400">No training scheduled</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedDateSessions.map(session => {
                    const athlete = athletes.find(a => a.id === session.athlete_id);
                    const coach = coaches.find(c => c.id === session.coach_id);

                    return (
                      <FamilySessionCard
                        key={session.id}
                        session={session}
                        athlete={athlete}
                        coach={coach}
                        onRsvp={(sessionId, status) => rsvpMutation.mutate({ sessionId, status })}
                        isLocked={isLocked}
                      />
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Balance Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {isLoading ? (
                <Skeleton className="h-48 w-full rounded-2xl" />
              ) : (
                <BalanceCard
                  balance={family?.current_balance || 0}
                  onSettle={handleSettle}
                  isSettling={isSettling}
                  biometricEnabled={family?.biometric_enabled}
                  paymentMethods={family?.payment_methods || []}
                  coachName={coachName}
                  coachAcceptedMethods={coachAcceptedMethods}
                />
              )}
            </motion.div>

            {/* Upcoming Sessions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs tracking-[0.2em] uppercase text-neutral-400 font-medium">
                  Upcoming Sessions
                </span>
                <span className="text-xs text-neutral-400">
                  {upcomingSessions.length} scheduled
                </span>
              </div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl border border-neutral-100 p-6"
              >
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                  </div>
                ) : upcomingSessions.length === 0 ? (
                  <p className="text-sm text-neutral-400 text-center py-6">
                    No upcoming sessions
                  </p>
                ) : (
                  <div className="space-y-3">
                    {upcomingSessions.map(session => {
                      const athlete = athletes.find(a => a.id === session.athlete_id);
                      const coach = coaches.find(c => c.id === session.coach_id);
                      const sessionDate = new Date(session.scheduled_time);

                      return (
                        <div 
                          key={session.id}
                          className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl"
                        >
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                            style={{ backgroundColor: athlete?.avatar_color || '#6B7280' }}
                          >
                            {athlete?.name?.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-900 truncate">
                              {athlete?.name}
                            </p>
                            <p className="text-xs text-neutral-400">
                              {isToday(sessionDate) ? 'Today' : format(sessionDate, 'EEE, MMM d')} · {format(sessionDate, 'h:mm a')}
                            </p>
                          </div>
                          <span className="text-sm font-medium text-neutral-900">
                            ${session.rate}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Session History Button */}
            <Button
              variant="outline"
              onClick={() => setShowSessionHistory(true)}
              className="flex items-center justify-center gap-2 h-10 w-full"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-neutral-500">Session History</span>
            </Button>
          </div>

          {/* Right Column - Calendar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Calendar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <TrainingCalendar
                sessions={filteredSessions}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
            </motion.div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="messages">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversations List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-neutral-100 p-4">
                <div className="mb-4">
                  <Button
                    onClick={() => setShowNewMessage(true)}
                    className="w-full bg-[#0066CC] hover:bg-[#0052A3]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Message
                  </Button>
                </div>
                <ConversationList
                  conversations={conversations}
                  selectedConversation={selectedConversation}
                  onSelect={setSelectedConversation}
                  isLoading={messagesLoading}
                />
              </div>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-2">
              {selectedConversation ? (
                <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden flex flex-col h-[calc(100vh-16rem)]">
                  {/* Chat Header */}
                  <div className="border-b border-neutral-100 px-6 py-4 shrink-0">
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
                  <div className="flex-1 overflow-y-auto p-6">
                    {conversationMessages.map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwn={message.sender_id === family?.id}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <MessageInput
                    onSend={(data) => sendMessageMutation.mutate(data)}
                    disabled={sendMessageMutation.isPending}
                    isCoach={false}
                  />
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-neutral-100 flex items-center justify-center h-[calc(100vh-16rem)]">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
                    <p className="text-neutral-400">Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      </main>

      {/* Session History Modal */}
      <SessionHistoryModal
        isOpen={showSessionHistory}
        onClose={() => setShowSessionHistory(false)}
        sessions={completedSessions}
        athletes={athletes}
        coaches={coaches}
      />

      {/* New Message Modal */}
      <NewMessageModal
        isOpen={showNewMessage}
        onClose={() => setShowNewMessage(false)}
        coaches={coaches}
        athletes={athletes}
        onSelect={handleNewConversation}
      />

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        isOpen={showProfileSettings}
        onClose={() => setShowProfileSettings(false)}
        profileType="family"
        onDeleteProfile={() => deleteProfileMutation.mutate()}
        isLoading={deleteProfileMutation.isPending}
      />

      {/* Request Session Modal */}
      <RequestSessionModal
        isOpen={showRequestSession}
        onClose={() => setShowRequestSession(false)}
        coaches={coaches}
        athletes={athletes}
        family={family}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['messages'] });
          setActiveTab('messages');
        }}
      />
    </div>
  );
}