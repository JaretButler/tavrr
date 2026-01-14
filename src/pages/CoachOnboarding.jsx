import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { GraduationCap, Users, BookOpen, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const roleOptions = [
  { value: 'coach', label: 'Coach', icon: Users, description: 'Athletic training & development' },
  { value: 'instructor', label: 'Instructor', icon: GraduationCap, description: 'Teacher, Educator, Tutor' },
];

const paymentOptions = [
  { value: 'venmo', label: 'Venmo', color: '#008CFF' },
  { value: 'zelle', label: 'Zelle', color: '#6D1ED4' },
  { value: 'apple_pay', label: 'Apple Pay', color: '#000000' },
  { value: 'google_pay', label: 'Google Pay', color: '#4285F4' },
];

export default function CoachOnboarding() {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const navigate = useNavigate();

  const createCoachMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      await base44.entities.Coach.create({
        user_id: user.email,
        display_name: user.full_name || 'Professional',
        role_type: selectedRole,
        accepted_payment_methods: selectedPayments,
      });
    },
    onSuccess: () => {
      navigate(createPageUrl('CoachDashboard'));
    },
  });

  const togglePayment = (value) => {
    setSelectedPayments(prev =>
      prev.includes(value)
        ? prev.filter(p => p !== value)
        : [...prev, value]
    );
  };

  const canProceed = step === 1 ? selectedRole : selectedPayments.length > 0;

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-8">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6965c061c9809ea85fc32161/b8b585dd5_JXyv2ZNYEizRWxtiY5Iwp.png"
            alt="Tavrr"
            className="h-12 mx-auto mb-6"
          />
          <h1 className="text-2xl font-medium text-neutral-900 mb-2">
            {step === 1 ? 'Welcome to Tavrr' : 'Payment Methods'}
          </h1>
          <p className="text-neutral-500">
            {step === 1 ? 'Tell us about your professional role' : 'Select the payment methods you accept'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-100 p-8">
          {step === 1 ? (
            <div className="space-y-3">
              {roleOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <motion.button
                    key={option.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedRole(option.value)}
                    className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
                      selectedRole === option.value
                        ? 'border-[#0066CC] bg-blue-50'
                        : 'border-neutral-100 hover:border-neutral-200'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${
                        selectedRole === option.value ? 'bg-[#0066CC]' : 'bg-neutral-100'
                      }`}>
                        <Icon className={`w-6 h-6 ${
                          selectedRole === option.value ? 'text-white' : 'text-neutral-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-neutral-900 mb-1">{option.label}</h3>
                        <p className="text-sm text-neutral-500">{option.description}</p>
                      </div>
                      {selectedRole === option.value && (
                        <Check className="w-5 h-5 text-[#0066CC]" />
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {paymentOptions.map((option) => (
                <motion.button
                  key={option.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => togglePayment(option.value)}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    selectedPayments.includes(option.value)
                      ? 'border-[#0066CC] bg-blue-50'
                      : 'border-neutral-100 hover:border-neutral-200'
                  }`}
                >
                  <div className="text-center">
                    <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${
                      selectedPayments.includes(option.value) ? 'bg-[#0066CC]' : 'bg-neutral-100'
                    }`}>
                      {selectedPayments.includes(option.value) && (
                        <Check className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <p className="font-medium text-neutral-900">{option.label}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          )}

          <div className="flex gap-3 mt-8">
            {step === 2 && (
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                Back
              </Button>
            )}
            <Button
              onClick={() => {
                if (step === 1) {
                  setStep(2);
                } else {
                  createCoachMutation.mutate();
                }
              }}
              disabled={!canProceed || createCoachMutation.isPending}
              className="flex-1 bg-[#0066CC] hover:bg-[#0052A3]"
            >
              {step === 1 ? 'Continue' : createCoachMutation.isPending ? 'Creating...' : 'Complete Setup'}
            </Button>
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-6">
          <div className={`w-2 h-2 rounded-full ${step === 1 ? 'bg-[#0066CC]' : 'bg-neutral-200'}`} />
          <div className={`w-2 h-2 rounded-full ${step === 2 ? 'bg-[#0066CC]' : 'bg-neutral-200'}`} />
        </div>
      </motion.div>
    </div>
  );
}