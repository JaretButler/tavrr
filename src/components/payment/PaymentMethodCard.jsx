import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Building2, Check, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const cardBrands = {
  visa: { color: 'bg-blue-600', name: 'Visa' },
  mastercard: { color: 'bg-orange-500', name: 'Mastercard' },
  amex: { color: 'bg-blue-800', name: 'Amex' },
  discover: { color: 'bg-orange-600', name: 'Discover' },
  default: { color: 'bg-neutral-700', name: 'Card' },
};

export default function PaymentMethodCard({ method, onSetDefault, onDelete, disabled }) {
  const isCard = method.type === 'card';
  const brandConfig = cardBrands[method.brand?.toLowerCase()] || cardBrands.default;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-white border rounded-xl p-5 transition-all ${
        method.is_default ? 'border-[#0066CC] ring-2 ring-[#0066CC]/10' : 'border-neutral-200 hover:border-neutral-300'
      }`}
    >
      {method.is_default && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-[#0066CC] text-white text-xs font-medium rounded-full">
          <Check className="w-3 h-3" />
          Default
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-lg ${brandConfig.color} flex items-center justify-center flex-shrink-0`}>
          {isCard ? (
            <CreditCard className="w-6 h-6 text-white" />
          ) : (
            <Building2 className="w-6 h-6 text-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-neutral-900">
                {isCard ? brandConfig.name : 'Bank Account'}
              </p>
              <p className="text-sm text-neutral-500 mt-0.5">
                •••• {method.last4}
              </p>
              {isCard && method.exp_month && method.exp_year && (
                <p className="text-xs text-neutral-400 mt-1">
                  Expires {String(method.exp_month).padStart(2, '0')}/{method.exp_year}
                </p>
              )}
            </div>

            {!method.is_default && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 -mt-1"
                    disabled={disabled}
                  >
                    <MoreVertical className="w-4 h-4 text-neutral-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onSetDefault?.(method.id)}>
                    Set as Default
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete?.(method.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}