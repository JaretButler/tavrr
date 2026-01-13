import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CreditCard, Lock, Fingerprint, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function BalanceCard({ balance = 0, onSettle, isSettling, biometricEnabled, paymentMethods = [] }) {
  const hasBalance = balance > 0;
  const hasPaymentMethod = paymentMethods.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-6 ${hasBalance ? 'bg-amber-50 border border-amber-100' : 'bg-neutral-50 border border-neutral-100'}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-xs tracking-[0.2em] uppercase text-neutral-400 font-medium">
            Money Owed
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-4xl font-light tracking-tight ${hasBalance ? 'text-amber-700' : 'text-neutral-900'}`}>
              ${balance.toFixed(2)}
            </span>
            {hasBalance && (
              <span className="text-sm text-amber-600 font-medium">due</span>
            )}
          </div>
        </div>
        
        {hasBalance && (
          <div className="p-2.5 bg-amber-100 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
        )}
      </div>

      <div className="space-y-3">
        {hasBalance ? (
          <>
            <div className="flex items-start gap-2.5 p-3 bg-amber-100/50 rounded-xl">
              <Lock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                Future session RSVPs are locked until balance is settled. Settle now to unlock the field.
              </p>
            </div>
            
            {!hasPaymentMethod ? (
              <Link to={createPageUrl('PaymentSettings')}>
                <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white h-12 rounded-xl font-medium">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Add Payment Method to Settle
                </Button>
              </Link>
            ) : (
              <Button 
                onClick={onSettle}
                disabled={isSettling}
                className="w-full bg-[#0066CC] hover:bg-[#0052A3] text-white h-12 rounded-xl font-medium"
              >
                {isSettling ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <span className="flex items-center gap-2">
                    {biometricEnabled ? (
                      <>
                        <Fingerprint className="w-5 h-5" />
                        Settle with Face ID
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Settle Balance
                      </>
                    )}
                  </span>
                )}
              </Button>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2 text-emerald-600">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-medium">All caught up</span>
          </div>
        )}
        
        <Link to={createPageUrl('PaymentSettings')}>
          <Button variant="outline" className="w-full border-neutral-200 text-neutral-600 h-10 rounded-xl">
            <Settings className="w-4 h-4 mr-2" />
            Manage Payment Methods
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}