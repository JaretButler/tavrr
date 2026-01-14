import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AvailabilityManager from '@/components/scheduling/AvailabilityManager';

export default function CoachAvailability() {
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

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('CoachDashboard')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-medium text-neutral-900">Manage Availability</h1>
              <p className="text-sm text-neutral-500">Set your weekly availability for bookings</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <AvailabilityManager coachId={coach?.id} />
      </main>
    </div>
  );
}