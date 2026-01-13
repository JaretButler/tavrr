import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, CheckCircle2 } from 'lucide-react';

export default function RevenueTicker({ todayVerified, todayProjected, monthlyRecovered, monthlyGoal }) {
  const todayPercent = todayProjected > 0 ? (todayVerified / todayProjected) * 100 : 0;
  const monthlyPercent = monthlyGoal > 0 ? (monthlyRecovered / monthlyGoal) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Today's Recovery */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs tracking-[0.2em] uppercase text-neutral-400 font-medium">
            Today's Recovery
          </span>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0066CC]" />
            <span className="text-xs text-neutral-500">
              {Math.round(todayPercent)}% verified
            </span>
          </div>
        </div>
        
        <div className="flex items-baseline gap-3">
          <motion.span 
            className="text-5xl font-light tracking-tight text-neutral-900"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={todayVerified}
          >
            ${todayVerified.toLocaleString()}
          </motion.span>
          <span className="text-lg text-neutral-300 font-light">
            / ${todayProjected.toLocaleString()}
          </span>
        </div>

        <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-[#0066CC] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(todayPercent, 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* STD (Sessions-to-Date) */}
      <div className="pt-6 border-t border-neutral-100">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs tracking-[0.2em] uppercase text-neutral-400 font-medium">
            STD Revenue
          </span>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs text-emerald-600 font-medium">
              {Math.round(monthlyPercent)}% of goal
            </span>
          </div>
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-light tracking-tight text-neutral-900">
            ${monthlyRecovered.toLocaleString()}
          </span>
          <span className="text-sm text-neutral-300 font-light">
            / ${monthlyGoal.toLocaleString()} target
          </span>
        </div>

        <div className="mt-3 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
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