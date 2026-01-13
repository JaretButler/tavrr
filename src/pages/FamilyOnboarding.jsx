import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, User, GraduationCap, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const roleOptions = [
  { value: 'parent', label: 'Parent', icon: Users, description: 'Managing athletes or students' },
  { value: 'athlete', label: 'Athlete', icon: User, description: 'Training & development' },
  { value: 'student', label: 'Student', icon: GraduationCap, description: 'Learning & education' },
];

export default function FamilyOnboarding() {
  const [selectedRole, setSelectedRole] = useState(null);
  const navigate = useNavigate();

  const createFamilyMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      await base44.entities.Family.create({
        user_id: user.email,
        family_name: user.full_name || 'Family',
        role_type: selectedRole,
      });
    },
    onSuccess: () => {
      navigate(createPageUrl('FamilyDashboard'));
    },
  });

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
          <h1 className="text-2xl font-medium text-neutral-900 mb-2">Welcome to Tavrr</h1>
          <p className="text-neutral-500">Tell us about yourself</p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-100 p-8">
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

          <Button
            onClick={() => createFamilyMutation.mutate()}
            disabled={!selectedRole || createFamilyMutation.isPending}
            className="w-full mt-8 bg-[#0066CC] hover:bg-[#0052A3]"
          >
            {createFamilyMutation.isPending ? 'Creating...' : 'Complete Setup'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}