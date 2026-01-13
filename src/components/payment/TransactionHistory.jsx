import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Clock, ArrowUpRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const statusConfig = {
  completed: { 
    icon: CheckCircle2, 
    color: 'text-emerald-600', 
    bg: 'bg-emerald-50',
    label: 'Completed' 
  },
  pending: { 
    icon: Clock, 
    color: 'text-amber-600', 
    bg: 'bg-amber-50',
    label: 'Pending' 
  },
  failed: { 
    icon: XCircle, 
    color: 'text-red-600', 
    bg: 'bg-red-50',
    label: 'Failed' 
  },
  processing: { 
    icon: Clock, 
    color: 'text-blue-600', 
    bg: 'bg-blue-50',
    label: 'Processing' 
  },
};

export default function TransactionHistory({ transactions = [], isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-neutral-100">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-neutral-100 p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
          <ArrowUpRight className="w-8 h-8 text-neutral-300" />
        </div>
        <p className="text-neutral-500 font-medium mb-1">No transactions yet</p>
        <p className="text-sm text-neutral-400">Your payment history will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => {
        const config = statusConfig[transaction.status] || statusConfig.pending;
        const Icon = config.icon;
        const transactionDate = new Date(transaction.settled_at || transaction.created_date);

        return (
          <motion.div
            key={transaction.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-neutral-100 hover:border-neutral-200 transition-colors"
          >
            <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-neutral-900">
                    Session Payment
                  </p>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    {format(transactionDate, 'MMM d, yyyy')} · {format(transactionDate, 'h:mm a')}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-medium text-neutral-900">
                    ${transaction.amount.toFixed(2)}
                  </p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${config.bg} ${config.color}`}>
                    {config.label}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}