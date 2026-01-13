import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, TrendingUp } from 'lucide-react';

export default function SessionsCompletedCard({ completedCount, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-2xl border border-neutral-100 p-6 text-left w-full hover:shadow-lg transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-emerald-50 rounded-xl">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        </div>
        <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
          <TrendingUp className="w-3 h-3" />
          <span>View All</span>
        </div>
      </div>
      
      <div>
        <p className="text-3xl font-bold text-neutral-900 mb-1">
          {completedCount}
        </p>
        <p className="text-sm text-neutral-500">Sessions Completed</p>
      </div>
    </motion.button>
  );
}