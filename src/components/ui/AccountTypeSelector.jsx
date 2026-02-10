import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AccountTypeSelector({ onSelect }) {
  const [selectedType, setSelectedType] = useState(null);
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full"
      >
        <div className="text-center mb-12">
          <div className="flex justify-center mb-8">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6965c061c9809ea85fc32161/f390a923b_tfA4gvqQ0K1ptroztEoWt.png"
              alt="Tavrr"
              className="h-[88px]"
            />
          </div>
          <h1 className="text-3xl font-light text-neutral-900 mb-3 tracking-tight">
            Welcome to Tavrr
          </h1>
          <p className="text-lg text-neutral-600 mb-2">
            Empowering the instructor. Crafted for the student and competitor.
          </p>
          <p className="text-sm text-neutral-400">
            Intelligent scheduling, instant payments, and seamless coordination for instructors, families, athletes, and students.
          </p>
        </div>

        <div className="grid gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setSelectedType('coach');
              onSelect('coach');
            }}
            className="bg-white border rounded-2xl p-8 text-left hover:border-[#0066CC] hover:shadow-lg transition-all group border-neutral-200"
          >
            <div className="flex items-start gap-5">
              <div className="p-4 bg-neutral-100 rounded-xl group-hover:bg-blue-50 transition-colors">
                <Briefcase className="w-6 h-6 text-neutral-600 group-hover:text-[#0066CC]" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-neutral-900 mb-1">I'm an Instructor</h2>
                <p className="text-xs text-neutral-400 mb-2">Coaches, Tutors, Teachers</p>
                <p className="text-sm text-neutral-500">
                  Manage your business effortlessly. Automate billing, track revenue recovery, and grow your business with zero payment friction.
                </p>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedType('family')}
            className={`bg-white border rounded-2xl p-8 text-left hover:border-[#0066CC] hover:shadow-lg transition-all group ${
              selectedType === 'family' ? 'border-[#0066CC] shadow-lg' : 'border-neutral-200'
            }`}
          >
            <div className="flex items-start gap-5">
              <div className="p-4 bg-neutral-100 rounded-xl group-hover:bg-blue-50 transition-colors">
                <Users className="w-6 h-6 text-neutral-600 group-hover:text-[#0066CC]" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-neutral-900 mb-1">I'm a Participant</h2>
                <p className="text-xs text-neutral-400 mb-2">Athlete, Student, or Family Member</p>
                <p className="text-sm text-neutral-500">
                  Track sessions, manage schedules, and pay automatically in one simple app.
                </p>
              </div>
            </div>
          </motion.button>
        </div>

        <AnimatePresence>
          {selectedType === 'family' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6"
            >
              <Button
                onClick={() => onSelect('family')}
                className="w-full bg-[#0066CC] hover:bg-[#0052A3] h-12 text-base"
              >
                Next
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-xs text-neutral-400 text-center mt-8">
          COPPA & MAAPP Compliant
        </p>
      </motion.div>
    </div>
  );
}