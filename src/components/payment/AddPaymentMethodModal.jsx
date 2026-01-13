import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Building2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AddPaymentMethodModal({ isOpen, onClose, onAdd, isLoading }) {
  const [activeTab, setActiveTab] = useState('card');
  const [cardData, setCardData] = useState({
    number: '',
    exp_month: '',
    exp_year: '',
    cvc: '',
  });
  const [bankData, setBankData] = useState({
    account_number: '',
    routing_number: '',
    account_holder: '',
  });

  const handleAddCard = () => {
    // In real app, this would use Stripe.js to tokenize
    const brand = cardData.number.startsWith('4') ? 'visa' : 
                  cardData.number.startsWith('5') ? 'mastercard' : 
                  cardData.number.startsWith('3') ? 'amex' : 'card';
    
    onAdd?.({
      type: 'card',
      brand,
      last4: cardData.number.slice(-4),
      exp_month: parseInt(cardData.exp_month),
      exp_year: parseInt(cardData.exp_year),
      stripe_payment_method_id: `pm_${Math.random().toString(36).substring(7)}`,
    });
  };

  const handleAddBank = () => {
    onAdd?.({
      type: 'bank_account',
      brand: 'bank',
      last4: bankData.account_number.slice(-4),
      stripe_payment_method_id: `ba_${Math.random().toString(36).substring(7)}`,
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
            <h2 className="text-lg font-medium text-neutral-900">Add Payment Method</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-neutral-400" />
            </button>
          </div>

          <div className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="card" className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Card
                </TabsTrigger>
                <TabsTrigger value="bank" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Bank
                </TabsTrigger>
              </TabsList>

              <TabsContent value="card" className="space-y-4">
                <div className="space-y-2">
                  <Label>Card Number</Label>
                  <Input
                    placeholder="4242 4242 4242 4242"
                    value={cardData.number}
                    onChange={(e) => setCardData({ ...cardData, number: e.target.value.replace(/\s/g, '') })}
                    maxLength={16}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Month</Label>
                    <Input
                      placeholder="MM"
                      value={cardData.exp_month}
                      onChange={(e) => setCardData({ ...cardData, exp_month: e.target.value })}
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Input
                      placeholder="YYYY"
                      value={cardData.exp_year}
                      onChange={(e) => setCardData({ ...cardData, exp_year: e.target.value })}
                      maxLength={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CVC</Label>
                    <Input
                      placeholder="123"
                      value={cardData.cvc}
                      onChange={(e) => setCardData({ ...cardData, cvc: e.target.value })}
                      maxLength={4}
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg mt-4">
                  <Lock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    Your payment information is encrypted and securely processed by Stripe. Tavrr never stores your full card details.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="bank" className="space-y-4">
                <div className="space-y-2">
                  <Label>Account Holder Name</Label>
                  <Input
                    placeholder="John Doe"
                    value={bankData.account_holder}
                    onChange={(e) => setBankData({ ...bankData, account_holder: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Routing Number</Label>
                  <Input
                    placeholder="110000000"
                    value={bankData.routing_number}
                    onChange={(e) => setBankData({ ...bankData, routing_number: e.target.value })}
                    maxLength={9}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input
                    placeholder="000123456789"
                    value={bankData.account_number}
                    onChange={(e) => setBankData({ ...bankData, account_number: e.target.value })}
                  />
                </div>

                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg mt-4">
                  <Lock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    Bank account verification may take 1-2 business days. Micro-deposits will be sent for verification.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="px-6 py-4 border-t border-neutral-100 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={activeTab === 'card' ? handleAddCard : handleAddBank}
              disabled={isLoading}
              className="bg-[#0066CC] hover:bg-[#0052A3] text-white"
            >
              {isLoading ? 'Adding...' : 'Add Payment Method'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}