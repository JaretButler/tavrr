import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { DollarSign, RotateCcw, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const statusConfig = {
  pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Pending' },
  processing: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Processing' },
  completed: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Completed' },
  failed: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Failed' },
  refunded: { icon: RotateCcw, color: 'text-neutral-500', bg: 'bg-neutral-50', label: 'Refunded' },
};

export default function PaymentHistory({ transactions = [], athletes = [], isLoading, onRefund }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-100 p-12 text-center">
        <DollarSign className="w-10 h-10 text-neutral-200 mx-auto mb-4" />
        <p className="text-neutral-500">No payment history yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => {
        const athlete = athletes.find(a => a.id === transaction.session?.athlete_id);
        const status = statusConfig[transaction.status] || statusConfig.pending;
        const StatusIcon = status.icon;
        const canRefund = transaction.status === 'completed';

        return (
          <motion.div
            key={transaction.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-neutral-100 rounded-xl p-5 hover:border-neutral-200 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div 
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white font-medium shrink-0"
                  style={{ backgroundColor: athlete?.avatar_color || '#6B7280' }}
                >
                  {athlete?.name?.charAt(0) || 'A'}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-neutral-900">{athlete?.name || 'Athlete'}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color} ${status.bg}`}>
                      {status.label}
                    </span>
                  </div>
                  
                  <p className="text-sm text-neutral-500 mb-2">
                    {format(new Date(transaction.created_date), 'MMM d, yyyy · h:mm a')}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-neutral-400">
                    <span>Total: ${transaction.amount}</span>
                    <span>Your payout: ${transaction.coach_payout}</span>
                    <span>Platform fee: ${transaction.platform_fee}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 ml-4">
                <div className="text-right">
                  <p className="text-xl font-medium text-neutral-900">
                    ${transaction.coach_payout}
                  </p>
                </div>
                
                {canRefund && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRefund?.(transaction)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Refund
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}