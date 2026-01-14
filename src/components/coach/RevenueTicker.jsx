import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, CheckCircle2 } from 'lucide-react';

export default function RevenueTicker({ todayVerified, todayProjected, monthlyRecovered, monthlyGoal }) {
  const todayPercent = todayProjected > 0 ? (todayVerified / todayProjected) * 100 : 0;
  const monthlyPercent = monthlyGoal > 0 ? (monthlyRecovered / monthlyGoal) * 100 : 0;

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Today's Recovery */}
      <div className="space-y-3">
        <div className="flex flex-col">
          <span className="text-[10px] tracking-[0.2em] uppercase text-neutral-400 font-medium">
            Today's Recovery
          </span>
          <span className="text-sm text-neutral-500">
            {Math.round(todayPercent)}% verified
          </span>
        </div>
        
        <div className="flex flex-col">
          <motion.span 
            className="text-2xl font-light tracking-tight text-neutral-900"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={todayVerified}
          >
            ${todayVerified.toLocaleString()}
          </motion.span>
          <span className="text-xs text-neutral-300 font-light">
            of ${todayProjected.toLocaleString()}
          </span>
        </div>

        <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-[#0066CC] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(todayPercent, 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Yearly Revenue */}
      <div className="space-y-3">
        <div className="flex flex-col">
          <span className="text-[10px] tracking-[0.2em] uppercase text-neutral-400 font-medium">
            Yearly Revenue
          </span>
          <span className="text-sm text-emerald-600 font-medium">
            {Math.round(monthlyPercent)}% of goal
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-2xl font-light tracking-tight text-neutral-900">
            ${monthlyRecovered.toLocaleString()}
          </span>
          <span className="text-xs text-neutral-300 font-light">
            of ${monthlyGoal.toLocaleString()}
          </span>
        </div>

        <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(monthlyPercent, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}