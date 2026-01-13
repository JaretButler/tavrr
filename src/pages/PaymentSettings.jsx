import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, CreditCard, Receipt } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import PaymentMethodCard from '@/components/payment/PaymentMethodCard';
import AddPaymentMethodModal from '@/components/payment/AddPaymentMethodModal';
import TransactionHistory from '@/components/payment/TransactionHistory';

export default function PaymentSettings() {
  const [showAddModal, setShowAddModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: family, isLoading: familyLoading } = useQuery({
    queryKey: ['family', user?.email],
    queryFn: () => base44.entities.Family.filter({ user_id: user?.email }),
    enabled: !!user?.email,
    select: (data) => data[0],
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions', family?.id],
    queryFn: () => base44.entities.Transaction.filter({ family_id: family?.id }, '-created_date'),
    enabled: !!family?.id,
  });

  const addPaymentMethodMutation = useMutation({
    mutationFn: async (newMethod) => {
      const currentMethods = family.payment_methods || [];
      const isFirstMethod = currentMethods.length === 0;
      
      const method = {
        id: `pm_${Date.now()}`,
        ...newMethod,
        is_default: isFirstMethod || false,
      };

      await base44.entities.Family.update(family.id, {
        payment_methods: [...currentMethods, method],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
      setShowAddModal(false);
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (methodId) => {
      const updatedMethods = (family.payment_methods || []).map(m => ({
        ...m,
        is_default: m.id === methodId,
      }));
      await base44.entities.Family.update(family.id, {
        payment_methods: updatedMethods,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
    },
  });

  const deleteMethodMutation = useMutation({
    mutationFn: async (methodId) => {
      const updatedMethods = (family.payment_methods || []).filter(m => m.id !== methodId);
      await base44.entities.Family.update(family.id, {
        payment_methods: updatedMethods,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
    },
  });

  const paymentMethods = family?.payment_methods || [];

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-medium text-neutral-900">Payment Settings</h1>
              <p className="text-sm text-neutral-400">Manage payment methods and view history</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <Tabs defaultValue="methods" className="space-y-6">
          <TabsList className="bg-white border border-neutral-200">
            <TabsTrigger value="methods" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Payment Methods
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Transaction History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="methods" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-medium text-neutral-900">Your Payment Methods</h2>
                  <p className="text-sm text-neutral-500 mt-1">
                    {paymentMethods.length} method{paymentMethods.length !== 1 ? 's' : ''} on file
                  </p>
                </div>
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="bg-[#0066CC] hover:bg-[#0052A3] text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Method
                </Button>
              </div>

              {familyLoading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="h-28 bg-white rounded-xl border border-neutral-200 animate-pulse" />
                  ))}
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-neutral-300" />
                  </div>
                  <h3 className="font-medium text-neutral-900 mb-2">No payment methods yet</h3>
                  <p className="text-sm text-neutral-500 mb-6">
                    Add a credit card or bank account to get started
                  </p>
                  <Button
                    onClick={() => setShowAddModal(true)}
                    className="bg-[#0066CC] hover:bg-[#0052A3] text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Payment Method
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {paymentMethods.map((method) => (
                    <PaymentMethodCard
                      key={method.id}
                      method={method}
                      onSetDefault={(id) => setDefaultMutation.mutate(id)}
                      onDelete={(id) => deleteMethodMutation.mutate(id)}
                      disabled={setDefaultMutation.isPending || deleteMethodMutation.isPending}
                    />
                  ))}
                </div>
              )}

              <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-700">
                  <strong>Secure Payments:</strong> All payment information is encrypted and processed securely through Stripe. 
                  Your default payment method will be automatically charged when sessions are verified.
                </p>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="mb-4">
                <h2 className="text-lg font-medium text-neutral-900">Transaction History</h2>
                <p className="text-sm text-neutral-500 mt-1">
                  View all your past payments and settlements
                </p>
              </div>

              <TransactionHistory 
                transactions={transactions} 
                isLoading={transactionsLoading}
              />
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>

      <AddPaymentMethodModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={(method) => addPaymentMethodMutation.mutate(method)}
        isLoading={addPaymentMethodMutation.isPending}
      />
    </div>
  );
}