import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Calendar, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import BookingCalendar from '@/components/scheduling/BookingCalendar';

export default function ScheduleSession() {
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: family } = useQuery({
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

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list(),
  });

  const handleBookingSuccess = () => {
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-medium text-neutral-900">Schedule Session</h1>
              <p className="text-sm text-neutral-500">Book a training session with your coach</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {bookingSuccess && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-emerald-900">Session booked successfully!</p>
              <p className="text-sm text-emerald-700">You'll receive a confirmation shortly.</p>
            </div>
          </div>
        )}

        {/* Athlete Selection */}
        {!selectedAthlete ? (
          <div className="bg-white rounded-2xl border border-neutral-100 p-6">
            <h2 className="text-lg font-medium text-neutral-900 mb-4">Select Athlete</h2>
            {athletesLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {athletes.map(athlete => (
                  <button
                    key={athlete.id}
                    onClick={() => setSelectedAthlete(athlete)}
                    className="w-full flex items-center gap-4 p-4 bg-neutral-50 hover:bg-neutral-100 rounded-xl transition-colors text-left"
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-medium"
                      style={{ backgroundColor: athlete.avatar_color || '#6B7280' }}
                    >
                      {athlete.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">{athlete.name}</p>
                      <p className="text-sm text-neutral-500">{athlete.sport_discipline}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                  style={{ backgroundColor: selectedAthlete.avatar_color || '#6B7280' }}
                >
                  {selectedAthlete.name?.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-neutral-900">{selectedAthlete.name}</p>
                  <p className="text-sm text-neutral-500">{selectedAthlete.sport_discipline}</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectedAthlete(null)}
              >
                Change Athlete
              </Button>
            </div>

            {/* Coach Selection & Booking */}
            {coaches.length > 0 && (
              <div className="bg-white rounded-2xl border border-neutral-100 p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-medium text-neutral-900 mb-2">
                    Book with {coaches[0]?.display_name || 'Coach'}
                  </h2>
                  <p className="text-sm text-neutral-500">
                    Select an available time slot • ${coaches[0]?.hourly_rate || 0}/hour
                  </p>
                </div>

                <BookingCalendar
                  coachId={coaches[0]?.id}
                  athleteId={selectedAthlete.id}
                  familyId={family?.id}
                  onBooked={handleBookingSuccess}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}