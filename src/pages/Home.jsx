import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

import AccountTypeSelector from '@/components/ui/AccountTypeSelector';
import CoachDashboard from './CoachDashboard';
import FamilyDashboard from './FamilyDashboard';
import FamilyOnboarding from './FamilyOnboarding';
import CoachOnboarding from './CoachOnboarding';

export default function Home() {
  const [accountType, setAccountType] = useState(null);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [showFamilyOnboarding, setShowFamilyOnboarding] = useState(false);
  const [showCoachOnboarding, setShowCoachOnboarding] = useState(false);
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Check for existing coach profile
  const { data: coachProfile, isLoading: coachLoading } = useQuery({
    queryKey: ['coachProfile', user?.email],
    queryFn: () => base44.entities.Coach.filter({ user_id: user?.email }),
    enabled: !!user?.email,
    select: (data) => data[0],
  });

  // Check for existing family profile
  const { data: familyProfile, isLoading: familyLoading } = useQuery({
    queryKey: ['familyProfile', user?.email],
    queryFn: () => base44.entities.Family.filter({ user_id: user?.email }),
    enabled: !!user?.email,
    select: (data) => data[0],
  });

  // Determine account type from existing profiles
  useEffect(() => {
    if (!coachLoading && !familyLoading) {
      if (coachProfile) {
        setAccountType('coach');
      } else if (familyProfile) {
        setAccountType('family');
      }
    }
  }, [coachProfile, familyProfile, coachLoading, familyLoading]);

  const setupCoachMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.Coach.create({
        user_id: user.email,
        display_name: user.full_name || 'Coach',
        hourly_rate: 60,
        monthly_revenue_goal: 10000,
        facilities: [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coachProfile'] });
      setAccountType('coach');
      setIsSettingUp(false);
    },
  });

  const setupFamilyMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.Family.create({
        user_id: user.email,
        family_name: user.full_name?.split(' ')[0] || 'Family',
        current_balance: 0,
        biometric_enabled: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyProfile'] });
      setAccountType('family');
      setIsSettingUp(false);
    },
  });

  const handleAccountTypeSelect = async (type) => {
    if (type === 'coach') {
      setShowCoachOnboarding(true);
    } else {
      setShowFamilyOnboarding(true);
    }
  };

  // Loading state
  if (userLoading || coachLoading || familyLoading || isSettingUp) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-neutral-200 border-t-[#0066CC] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-neutral-400">
            {isSettingUp ? 'Setting up your account...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Show coach onboarding if selected
  if (showCoachOnboarding && !coachProfile) {
    return <CoachOnboarding />;
  }

  // Show family onboarding if selected
  if (showFamilyOnboarding && !familyProfile) {
    return <FamilyOnboarding />;
  }

  // No account type selected - show selector
  if (!accountType && !coachProfile && !familyProfile) {
    return <AccountTypeSelector onSelect={handleAccountTypeSelect} />;
  }

  // Render appropriate dashboard
  if (accountType === 'coach' || coachProfile) {
    return <CoachDashboard />;
  }

  if (accountType === 'family' || familyProfile) {
    return <FamilyDashboard />;
  }

  return <AccountTypeSelector onSelect={handleAccountTypeSelect} />;
}