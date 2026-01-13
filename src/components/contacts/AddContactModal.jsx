import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function AddContactModal({ isOpen, onClose, onSave, isLoading, editContact }) {
  const [formData, setFormData] = useState({
    parent_name: '',
    parent_email: '',
    parent_phone: '',
    athlete_name: '',
    athlete_age: '',
    sport_discipline: '',
    notes: '',
  });

  useEffect(() => {
    if (editContact) {
      setFormData({
        parent_name: editContact.parent_name || '',
        parent_email: editContact.parent_email || '',
        parent_phone: editContact.parent_phone || '',
        athlete_name: editContact.athlete_name || '',
        athlete_age: editContact.athlete_age || '',
        sport_discipline: editContact.sport_discipline || '',
        notes: editContact.notes || '',
      });
    } else {
      setFormData({
        parent_name: '',
        parent_email: '',
        parent_phone: '',
        athlete_name: '',
        athlete_age: '',
        sport_discipline: '',
        notes: '',
      });
    }
  }, [editContact, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave?.(formData);
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
            <h2 className="text-lg font-medium text-neutral-900">
              {editContact ? 'Edit Contact' : 'Add Contact'}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-neutral-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>Athlete Name *</Label>
              <Input
                placeholder="Jake Martinez"
                value={formData.athlete_name}
                onChange={(e) => setFormData({ ...formData, athlete_name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Age</Label>
                <Input
                  type="number"
                  placeholder="14"
                  value={formData.athlete_age}
                  onChange={(e) => setFormData({ ...formData, athlete_age: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Sport</Label>
                <Input
                  placeholder="Lacrosse"
                  value={formData.sport_discipline}
                  onChange={(e) => setFormData({ ...formData, sport_discipline: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-100">
              <p className="text-xs text-neutral-400 mb-3">Parent/Guardian Information</p>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    placeholder="Maria Martinez"
                    value={formData.parent_name}
                    onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    placeholder="parent@email.com"
                    value={formData.parent_email}
                    onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.parent_phone}
                    onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Any additional information..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="h-20"
              />
            </div>
          </form>

          <div className="px-6 py-4 border-t border-neutral-100 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-[#0066CC] hover:bg-[#0052A3] text-white"
            >
              {isLoading ? 'Saving...' : editContact ? 'Update Contact' : 'Add Contact'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}