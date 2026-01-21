import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Calendar, Clock, Star, Plus, X, Edit2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import AvailabilityManager from '@/components/scheduling/AvailabilityManager';
import TrainingCalendar from '@/components/calendar/TrainingCalendar';

export default function CoachAvailability() {
  const queryClient = useQueryClient();
  const [editingAbout, setEditingAbout] = useState(false);
  const [aboutText, setAboutText] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');
  const [editingSpecialties, setEditingSpecialties] = useState(false);

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

  const { data: testimonials = [] } = useQuery({
    queryKey: ['testimonials', coach?.id],
    queryFn: () => base44.entities.Testimonial.filter({ coach_id: coach?.id }),
    enabled: !!coach?.id,
  });

  const { data: availability = [] } = useQuery({
    queryKey: ['availability', coach?.id],
    queryFn: () => base44.entities.Availability.filter({ coach_id: coach?.id }),
    enabled: !!coach?.id,
  });

  const updateCoachMutation = useMutation({
    mutationFn: (data) => base44.entities.Coach.update(coach.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['coach']);
      setEditingAbout(false);
      setEditingSpecialties(false);
    },
  });

  const handleSaveAbout = () => {
    updateCoachMutation.mutate({ about_me: aboutText });
  };

  const handleAddSpecialty = () => {
    if (newSpecialty.trim()) {
      const updatedSpecialties = [...(coach?.specialties || []), newSpecialty.trim()];
      updateCoachMutation.mutate({ specialties: updatedSpecialties });
      setNewSpecialty('');
    }
  };

  const handleRemoveSpecialty = (specialty) => {
    const updatedSpecialties = (coach?.specialties || []).filter(s => s !== specialty);
    updateCoachMutation.mutate({ specialties: updatedSpecialties });
  };

  React.useEffect(() => {
    if (coach?.about_me) {
      setAboutText(coach.about_me);
    }
  }, [coach?.about_me]);

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
              <h1 className="text-xl font-medium text-neutral-900">Coach Profile</h1>
              <p className="text-sm text-neutral-500">Manage your profile and availability</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* About Me Section */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-neutral-900">About Me</h2>
            {!editingAbout ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingAbout(true)}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingAbout(false);
                    setAboutText(coach?.about_me || '');
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveAbout}
                  disabled={updateCoachMutation.isPending}
                  className="bg-[#0066CC] hover:bg-[#0052A3]"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            )}
          </div>
          
          {editingAbout ? (
            <Textarea
              value={aboutText}
              onChange={(e) => setAboutText(e.target.value)}
              placeholder="Tell families about your coaching philosophy, experience, and what makes you unique..."
              className="min-h-[150px]"
            />
          ) : (
            <p className="text-neutral-600 leading-relaxed">
              {coach?.about_me || 'No bio added yet. Click Edit to add information about yourself.'}
            </p>
          )}
        </div>

        {/* Coaching Specialties */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-neutral-900">Coaching Specialties</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingSpecialties(!editingSpecialties)}
            >
              {editingSpecialties ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4 mr-2" />}
              {editingSpecialties ? '' : 'Edit'}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {coach?.specialties?.map((specialty, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="px-3 py-1.5 text-sm"
              >
                {specialty}
                {editingSpecialties && (
                  <button
                    onClick={() => handleRemoveSpecialty(specialty)}
                    className="ml-2 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </Badge>
            ))}
            {(!coach?.specialties || coach.specialties.length === 0) && !editingSpecialties && (
              <p className="text-neutral-400 text-sm">No specialties added yet.</p>
            )}
          </div>

          {editingSpecialties && (
            <div className="flex gap-2">
              <Input
                value={newSpecialty}
                onChange={(e) => setNewSpecialty(e.target.value)}
                placeholder="e.g., Youth Soccer, Performance Training"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSpecialty();
                  }
                }}
              />
              <Button
                onClick={handleAddSpecialty}
                disabled={!newSpecialty.trim() || updateCoachMutation.isPending}
                className="bg-[#0066CC] hover:bg-[#0052A3]"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Availability Calendar */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-6">
          <h2 className="text-lg font-medium text-neutral-900 mb-4">Weekly Availability</h2>
          <AvailabilityManager coachId={coach?.id} />
        </div>

        {/* Testimonials */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-6">
          <h2 className="text-lg font-medium text-neutral-900 mb-4">Client Testimonials</h2>
          
          {testimonials.length > 0 ? (
            <div className="space-y-4">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="border border-neutral-100 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#0066CC] text-white flex items-center justify-center text-sm font-medium">
                        {testimonial.athlete_name?.[0]?.toUpperCase() || 'A'}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">{testimonial.athlete_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < testimonial.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-neutral-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-neutral-600 text-sm leading-relaxed">
                    {testimonial.comment}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-400 text-sm text-center py-8">
              No testimonials yet. Testimonials will appear here once families leave reviews.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}