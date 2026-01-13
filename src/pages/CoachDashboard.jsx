import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { Calendar, Settings, Bell, RefreshCw, Users, MessageCircle, Plus, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import RevenueTicker from '@/components/coach/RevenueTicker';
import HandshakeFeed from '@/components/coach/HandshakeFeed';
import SessionCard from '@/components/coach/SessionCard';
import ManualOverrideModal from '@/components/coach/ManualOverrideModal';
import TrainingCalendar from '@/components/calendar/TrainingCalendar';
import MessageBubble from '@/components/messaging/MessageBubble';
import MessageInput from '@/components/messaging/MessageInput';
import ConversationList from '@/components/messaging/ConversationList';
import PaymentHistory from '@/components/coach/PaymentHistory';

export default function CoachDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showManualOverride, setShowManualOverride] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showTodaySessionsModal, setShowTodaySessionsModal] = useState(false);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: coach, isLoading: coachLoading } = useQuery({
    queryKey: ['coach', user?.email],
    queryFn: () => base44.entities.Coach.filter({ user_id: user?.email }),
    enabled: !!user?.email,
    select: (data) => data[0],
  });

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions', coach?.id],
    queryFn: () => base44.entities.Session.filter({ coach_id: coach?.id }, '-scheduled_time'),
    enabled: !!coach?.id,
  });

  const { data: athletes = [] } = useQuery({
    queryKey: ['athletes'],
    queryFn: () => base44.entities.Athlete.list(),
  });

  const { data: families = [] } = useQuery({
    queryKey: ['families'],
    queryFn: () => base44.entities.Family.list(),
  });

  const { data: allMessages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', coach?.id],
    queryFn: () => base44.entities.Message.list('-created_date', 500),
    enabled: !!coach?.id,
  });

  // Get unread messages count
  const { data: unreadMessages = [] } = useQuery({
    queryKey: ['unreadMessages', coach?.id],
    queryFn: () => base44.entities.Message.filter({ receiver_id: coach?.id, read: false }),
    enabled: !!coach?.id,
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions', coach?.id],
    queryFn: () => base44.entities.Transaction.filter({ coach_id: coach?.id }, '-created_date'),
    enabled: !!coach?.id,
  });

  const { data: allSessions = [] } = useQuery({
    queryKey: ['allSessions'],
    queryFn: () => base44.entities.Session.list(),
  });

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribeSession = base44.entities.Session.subscribe((event) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
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

  // Calculate revenue metrics
  const todaySessions = sessions.filter(s => isToday(new Date(s.scheduled_time)));
  const verifiedToday = todaySessions.filter(s => s.status === 'verified');
  const todayVerifiedRevenue = verifiedToday.reduce((sum, s) => sum + (s.rate || 0), 0);
  const todayProjectedRevenue = todaySessions.reduce((sum, s) => sum + (s.rate || 0), 0);

  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const monthSessions = sessions.filter(s => {
    const date = new Date(s.scheduled_time);
    return date >= monthStart && date <= monthEnd && s.status === 'verified';
  });
  const monthlyRecovered = monthSessions.reduce((sum, s) => sum + (s.rate || 0), 0);

  // Create handshakes for feed
  const recentHandshakes = verifiedToday.map(session => {
    const athlete = athletes.find(a => a.id === session.athlete_id);
    return {
      id: session.id,
      athleteName: athlete?.name || 'Athlete',
      verifiedAt: session.verification?.verified_at || session.updated_date,
      amount: session.rate,
      facilityName: session.facility_name,
      verification: session.verification,
    };
  });

  // Filter sessions for selected date
  const selectedDateSessions = sessions.filter(s => 
    isSameDay(new Date(s.scheduled_time), selectedDate)
  );

  const handleManualOverride = (session) => {
    const athlete = athletes.find(a => a.id === session.athlete_id);
    setSelectedSession(session);
    setSelectedAthlete(athlete);
    setShowManualOverride(true);
  };

  const overrideMutation = useMutation({
    mutationFn: async ({ sessionId, sendNotification, reason }) => {
      await base44.entities.Session.update(sessionId, {
        status: 'verified',
        verification: {
          gate_1_time: true,
          gate_2_location: true,
          gate_3_proximity: true,
          verified_at: new Date().toISOString(),
          manual_override: true,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setShowManualOverride(false);
    },
  });

  const manualSendMutation = useMutation({
    mutationFn: async (session) => {
      const platformFee = 1;
      const coachPayout = session.rate - platformFee;
      
      await base44.entities.Transaction.create({
        session_id: session.id,
        family_id: session.family_id,
        coach_id: session.coach_id,
        amount: session.rate,
        coach_payout: coachPayout,
        platform_fee: platformFee,
        status: 'pending',
      });

      await base44.entities.Session.update(session.id, {
        status: 'completed',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const refundMutation = useMutation({
    mutationFn: async (transaction) => {
      await base44.entities.Transaction.update(transaction.id, {
        status: 'refunded',
      });
      
      if (transaction.session_id) {
        await base44.entities.Session.update(transaction.session_id, {
          status: 'cancelled',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });

  // Build conversations from messages
  const conversations = React.useMemo(() => {
    if (!allMessages.length || !coach?.id) return [];
    const convMap = new Map();
    allMessages.forEach(msg => {
      const isOwnMessage = msg.sender_id === coach?.id;
      const otherPartyId = isOwnMessage ? msg.receiver_id : msg.sender_id;
      const convId = msg.conversation_id;
      if (!convMap.has(convId)) {
        const athlete = athletes.find(a => a.id === msg.athlete_id);
        convMap.set(convId, {
          conversation_id: convId,
          name: athlete?.name || 'Family',
          avatarColor: athlete?.avatar_color || '#6B7280',
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
  }, [allMessages, coach, athletes]);

  const conversationMessages = selectedConversation
    ? allMessages.filter(m => m.conversation_id === selectedConversation.conversation_id).reverse()
    : [];

  useEffect(() => {
    if (selectedConversation) {
      const unreadMsgs = conversationMessages.filter(m => !m.read && m.sender_type === 'family');
      unreadMsgs.forEach(msg => base44.entities.Message.update(msg.id, { read: true }));
    }
  }, [selectedConversation, conversationMessages]);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, messageType }) => {
      await base44.entities.Message.create({
        conversation_id: selectedConversation.conversation_id,
        sender_id: coach?.id,
        sender_type: 'coach',
        receiver_id: selectedConversation.otherPartyId,
        receiver_type: 'family',
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0]);
    }
  }, [conversations]);

  const isLoading = coachLoading || sessionsLoading;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6965c061c9809ea85fc32161/b8b585dd5_JXyv2ZNYEizRWxtiY5Iwp.png"
                alt="Tavrr"
                className="h-10"
              />
              <h1 className="text-xl font-medium text-neutral-900">Instructor Jaret</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link to={createPageUrl('Contacts')}>
                <Button variant="ghost" size="icon">
                  <Users className="w-5 h-5 text-neutral-500" />
                </Button>
              </Link>

              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5 text-neutral-500" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#0066CC] rounded-full" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5 text-neutral-500" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="mb-6 flex gap-6">
            <div className="flex flex-col gap-2">
              <Link to={createPageUrl('Home')}>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 bg-neutral-100 border-neutral-200 hover:bg-neutral-200 text-neutral-900 justify-start"
                >
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </Button>
              </Link>
              <Button
                variant="default"
                className="flex items-center gap-2 bg-[#0066CC] hover:bg-[#0052A3] justify-start"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule Session</span>
              </Button>
              <Button
                variant="default"
                onClick={() => setActiveTab('messages')}
                className="flex items-center gap-2 bg-[#0066CC] hover:bg-[#0052A3] relative justify-start"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Messages</span>
                {unreadMessages.length > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full">
                    {unreadMessages.length}
                  </span>
                )}
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => setActiveTab('payments')}
                className="justify-start bg-neutral-100 border-neutral-200 hover:bg-neutral-200 text-neutral-900"
              >
                Payment History
              </Button>
              <Button
                variant="outline"
                onClick={() => setActiveTab('sessionHistory')}
                className="justify-start bg-neutral-100 border-neutral-200 hover:bg-neutral-200 text-neutral-900"
              >
                Session History
              </Button>
            </div>
          </div>

          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Sessions & Feed */}
          <div className="lg:col-span-1 space-y-6">
            {/* Today's Sessions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-neutral-900">
                  {isToday(selectedDate) ? "Today's Sessions" : format(selectedDate, 'EEEE, MMM d')}
                </h2>
                <span className="text-sm text-neutral-400">
                  {selectedDateSessions.length} session{selectedDateSessions.length !== 1 ? 's' : ''}
                </span>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <Skeleton key={i} className="h-40 w-full rounded-xl" />
                  ))}
                </div>
              ) : selectedDateSessions.length === 0 ? (
                <div className="bg-white rounded-2xl border border-neutral-100 p-12 text-center">
                  <Calendar className="w-10 h-10 text-neutral-200 mx-auto mb-4" />
                  <p className="text-neutral-500">No sessions scheduled</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {selectedDateSessions.map(session => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        athlete={athletes.find(a => a.id === session.athlete_id)}
                        onManualOverride={handleManualOverride}
                        onManualSend={(session) => manualSendMutation.mutate(session)}
                        onCancel={() => {}}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>

            {/* Revenue Ticker */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-neutral-100 p-6"
            >
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-12 w-48" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ) : (
                <RevenueTicker
                  todayVerified={todayVerifiedRevenue}
                  todayProjected={todayProjectedRevenue}
                  monthlyRecovered={monthlyRecovered}
                  monthlyGoal={coach?.monthly_revenue_goal || 10000}
                />
              )}
            </motion.div>

            {/* Handshake Feed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-neutral-100 p-6"
            >
              <HandshakeFeed handshakes={recentHandshakes} />
            </motion.div>
          </div>

          {/* Right Column - Calendar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Calendar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <TrainingCalendar
                sessions={sessions}
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
              <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden flex flex-col h-[calc(100vh-16rem)]">
                <div className="px-4 py-3 border-b border-neutral-100">
                  <Button
                    variant="default"
                    onClick={() => setShowTodaySessionsModal(true)}
                    className="w-full bg-[#0066CC] hover:bg-[#0052A3] text-sm"
                  >
                    Message Today's Session
                  </Button>
                </div>
                <div className="overflow-y-auto flex-1">
                  <ConversationList
                    conversations={conversations}
                    selectedConversation={selectedConversation}
                    onSelect={setSelectedConversation}
                    isLoading={messagesLoading}
                  />
                </div>
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
                        isOwn={message.sender_id === coach?.id}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <MessageInput
                    onSend={(data) => sendMessageMutation.mutate(data)}
                    disabled={sendMessageMutation.isPending}
                    isCoach={true}
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

        <TabsContent value="payments">
          <div className="max-w-4xl">
            <div className="mb-6">
              <h2 className="text-xl font-medium text-neutral-900 mb-2">Payment History</h2>
              <p className="text-sm text-neutral-500">View and manage your recent payments</p>
            </div>

            <PaymentHistory
              transactions={transactions.map(t => ({
                ...t,
                session: allSessions.find(s => s.id === t.session_id)
              }))}
              athletes={athletes}
              isLoading={transactionsLoading}
              onRefund={(transaction) => {
                if (confirm('Are you sure you want to refund this payment? This action cannot be undone.')) {
                  refundMutation.mutate(transaction);
                }
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="sessionHistory">
          <div className="max-w-4xl">
            <div className="mb-6">
              <h2 className="text-xl font-medium text-neutral-900 mb-2">Session History</h2>
              <p className="text-sm text-neutral-500">View all your previous sessions</p>
            </div>

            <div className="space-y-4">
              {sessionsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-24 w-full rounded-xl" />
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <div className="bg-white rounded-2xl border border-neutral-100 p-12 text-center">
                  <Calendar className="w-10 h-10 text-neutral-200 mx-auto mb-4" />
                  <p className="text-neutral-500">No sessions found</p>
                </div>
              ) : (
                sessions.map(session => (
                  <div key={session.id} className="bg-white rounded-2xl border border-neutral-100 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-neutral-900">
                            {athletes.find(a => a.id === session.athlete_id)?.name || 'Athlete'}
                          </h3>
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            session.status === 'completed' ? 'bg-green-100 text-green-700' :
                            session.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            session.status === 'verified' ? 'bg-blue-100 text-blue-700' :
                            'bg-neutral-100 text-neutral-700'
                          }`}>
                            {session.status}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-500">
                          {format(new Date(session.scheduled_time), 'EEEE, MMMM d, yyyy • h:mm a')}
                        </p>
                        <p className="text-sm text-neutral-500 mt-1">
                          {session.facility_name} • {session.duration_minutes} min • ${session.rate}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>
        </Tabs>
        </main>

      {/* Manual Override Modal */}
      <ManualOverrideModal
        isOpen={showManualOverride}
        onClose={() => setShowManualOverride(false)}
        session={selectedSession}
        athlete={selectedAthlete}
        onConfirm={(data) => overrideMutation.mutate(data)}
        isLoading={overrideMutation.isPending}
      />

      {/* Today's Sessions Modal */}
      {showTodaySessionsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-neutral-100 w-full max-w-md p-6">
            <h2 className="text-lg font-medium text-neutral-900 mb-4">Message Today's Session</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {todaySessions.length === 0 ? (
                <p className="text-neutral-500 text-center py-6">No sessions scheduled for today</p>
              ) : (
                todaySessions.map(session => {
                  const athlete = athletes.find(a => a.id === session.athlete_id);
                  const existingConv = conversations.find(c => c.athleteId === session.athlete_id);
                  return (
                    <button
                      key={session.id}
                      onClick={() => {
                        if (existingConv) {
                          setSelectedConversation(existingConv);
                        }
                        setShowTodaySessionsModal(false);
                      }}
                      className="w-full text-left p-3 rounded-lg border border-neutral-100 hover:bg-neutral-50 transition-colors"
                    >
                      <p className="font-medium text-neutral-900">{athlete?.name || 'Athlete'}</p>
                      <p className="text-sm text-neutral-500">{format(new Date(session.scheduled_time), 'h:mm a')} • ${session.rate}</p>
                    </button>
                  );
                })
              )}
            </div>
            <button
              onClick={() => setShowTodaySessionsModal(false)}
              className="w-full mt-4 px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
      </div>
      );
      }