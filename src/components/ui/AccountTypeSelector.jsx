import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Users } from 'lucide-react';

export default function AccountTypeSelector({ onSelect }) {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full"
      >
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-8">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6965c061c9809ea85fc32161/icon_kj3COwIJy0HO0QfNyIYSR.png"
              alt="Tavrr Icon"
              className="h-16 w-16"
            />
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6965c061c9809ea85fc32161/f390a923b_tfA4gvqQ0K1ptroztEoWt.png"
              alt="Tavrr"
              className="h-20"
            />
          </div>
          <h1 className="text-3xl font-light text-neutral-900 mb-3 tracking-tight">
            Welcome to Tavrr
          </h1>
          <p className="text-lg text-neutral-600 mb-2">
            Instant payments at every handshake
          </p>
          <p className="text-sm text-neutral-400">
            Automated billing and revenue recovery for coaches. Simple, structured payments for families.
          </p>
        </div>

        <div className="grid gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect('coach')}
            className="bg-white border border-neutral-200 rounded-2xl p-8 text-left hover:border-[#0066CC] hover:shadow-lg transition-all group"
          >
            <div className="flex items-start gap-5">
              <div className="p-4 bg-neutral-100 rounded-xl group-hover:bg-blue-50 transition-colors">
                <Briefcase className="w-6 h-6 text-neutral-600 group-hover:text-[#0066CC]" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-neutral-900 mb-1">I'm a Coach</h2>
                <p className="text-sm text-neutral-500">
                  Get paid instantly. Automate billing, track revenue recovery, and grow your business with zero payment friction.
                </p>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect('family')}
            className="bg-white border border-neutral-200 rounded-2xl p-8 text-left hover:border-[#0066CC] hover:shadow-lg transition-all group"
          >
            <div className="flex items-start gap-5">
              <div className="p-4 bg-neutral-100 rounded-xl group-hover:bg-blue-50 transition-colors">
                <Users className="w-6 h-6 text-neutral-600 group-hover:text-[#0066CC]" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-neutral-900 mb-1">I'm a Family</h2>
                <p className="text-sm text-neutral-500">
                  No more invoices or awkward payments. Track sessions, manage schedules, and pay automatically in one simple app.
                </p>
              </div>
            </div>
          </motion.button>
        </div>

        <p className="text-xs text-neutral-400 text-center mt-8">
          COPPA & MAAPP Compliant
        </p>
      </motion.div>
    </div>
  );
}