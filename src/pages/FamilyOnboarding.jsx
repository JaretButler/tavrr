import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, User, GraduationCap, Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const roleOptions = [
  { value: 'parent', label: 'Parent', icon: Users, description: 'Managing athletes or students' },
  { value: 'athlete', label: 'Athlete', icon: User, description: 'Training & development' },
  { value: 'student', label: 'Student', icon: GraduationCap, description: 'Learning & education' },
];

export default function FamilyOnboarding() {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState(null);
  const [familyId, setFamilyId] = useState(null);
  const [athletes, setAthletes] = useState([{ name: '', age: '', sport: '' }]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createFamilyMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      const family = await base44.entities.Family.create({
        user_id: user.email,
        family_name: user.full_name?.split(' ')[0] + ' Family' || 'Family',
        role_type: selectedRole,
        current_balance: 0,
        biometric_enabled: false,
      });
      return family;
    },
    onSuccess: (family) => {
      setFamilyId(family.id);
      queryClient.invalidateQueries({ queryKey: ['familyProfile'] });
      setStep(2);
    },
  });

  const createAthletesMutation = useMutation({
    mutationFn: async () => {
      const colors = ['#0066CC', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
      await Promise.all(
        athletes
          .filter(a => a.name.trim())
          .map((athlete, idx) =>
            base44.entities.Athlete.create({
              family_id: familyId,
              name: athlete.name,
              age: athlete.age ? parseInt(athlete.age) : null,
              sport_discipline: athlete.sport || null,
              avatar_color: colors[idx % colors.length],
            })
          )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['athletes'] });
      navigate(createPageUrl('Home'));
    },
  });

  const handleAddAthlete = () => {
    setAthletes([...athletes, { name: '', age: '', sport: '' }]);
  };

  const handleRemoveAthlete = (index) => {
    setAthletes(athletes.filter((_, i) => i !== index));
  };

  const handleAthleteChange = (index, field, value) => {
    const updated = [...athletes];
    updated[index][field] = value;
    setAthletes(updated);
  };

  const handleNext = () => {
    if (step === 1 && selectedRole) {
      createFamilyMutation.mutate();
    }
  };

  const handleComplete = () => {
    createAthletesMutation.mutate();
  };

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
            {step === 1 ? 'Welcome to Tavrr' : 'Add Athlete Profiles'}
          </h1>
          <p className="text-neutral-500">
            {step === 1 ? 'Tell us about yourself' : 'Add the athletes you manage'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-100 p-8">
          {step === 1 ? (
            <>
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
                onClick={handleNext}
                disabled={!selectedRole || createFamilyMutation.isPending}
                className="w-full mt-8 bg-[#0066CC] hover:bg-[#0052A3]"
              >
                {createFamilyMutation.isPending ? 'Creating...' : 'Next'}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {athletes.map((athlete, index) => (
                  <div key={index} className="p-4 bg-neutral-50 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-700">
                        Athlete {index + 1}
                      </span>
                      {athletes.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAthlete(index)}
                          className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <Input
                      placeholder="Name *"
                      value={athlete.name}
                      onChange={(e) => handleAthleteChange(index, 'name', e.target.value)}
                      className="bg-white"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="Age"
                        type="number"
                        value={athlete.age}
                        onChange={(e) => handleAthleteChange(index, 'age', e.target.value)}
                        className="bg-white"
                      />
                      <Input
                        placeholder="Sport/Activity"
                        value={athlete.sport}
                        onChange={(e) => handleAthleteChange(index, 'sport', e.target.value)}
                        className="bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={handleAddAthlete}
                className="w-full mb-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Athlete
              </Button>

              <Button
                onClick={handleComplete}
                disabled={!athletes.some(a => a.name.trim()) || createAthletesMutation.isPending}
                className="w-full bg-[#0066CC] hover:bg-[#0052A3]"
              >
                {createAthletesMutation.isPending ? 'Completing...' : 'Complete Setup'}
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}