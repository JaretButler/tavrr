import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Upload, Send, Search, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

import ContactCard from '@/components/contacts/ContactCard';
import AddContactModal from '@/components/contacts/AddContactModal';
import ImportContactsModal from '@/components/contacts/ImportContactsModal';

export default function Contacts() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editContact, setEditContact] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: coach } = useQuery({
    queryKey: ['coach', user?.email],
    queryFn: () => base44.entities.Coach.filter({ user_id: user?.email }),
    enabled: !!user?.email,
    select: (data) => data[0],
  });

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts', coach?.id],
    queryFn: () => base44.entities.Contact.filter({ coach_id: coach?.id }, '-created_date'),
    enabled: !!coach?.id,
  });

  const addContactMutation = useMutation({
    mutationFn: async (contactData) => {
      return base44.entities.Contact.create({
        ...contactData,
        coach_id: coach.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setShowAddModal(false);
      setEditContact(null);
      toast.success('Contact added successfully');
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return base44.entities.Contact.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setShowAddModal(false);
      setEditContact(null);
      toast.success('Contact updated successfully');
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (id) => {
      return base44.entities.Contact.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact deleted');
    },
  });

  const importContactsMutation = useMutation({
    mutationFn: async (importedContacts) => {
      const contactsWithCoachId = importedContacts.map(c => ({
        ...c,
        coach_id: coach.id,
      }));
      return base44.entities.Contact.bulkCreate(contactsWithCoachId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setShowImportModal(false);
      toast.success('Contacts imported successfully');
    },
  });

  const inviteContactsMutation = useMutation({
    mutationFn: async (contactIds) => {
      const updates = contactIds.map(id => 
        base44.entities.Contact.update(id, {
          invited: true,
          invited_at: new Date().toISOString(),
        })
      );
      return Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setSelectionMode(false);
      setSelectedContacts([]);
      toast.success('Invites sent successfully');
    },
  });

  const handleEdit = (contact) => {
    setEditContact(contact);
    setShowAddModal(true);
  };

  const handleSaveContact = (data) => {
    if (editContact) {
      updateContactMutation.mutate({ id: editContact.id, data });
    } else {
      addContactMutation.mutate(data);
    }
  };

  const handleToggleSelect = (contactId) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSendInvites = () => {
    if (selectedContacts.length > 0) {
      inviteContactsMutation.mutate(selectedContacts);
    }
  };

  const handleMessage = (contact) => {
    navigate(createPageUrl('CoachDashboard') + '?tab=messages&contact=' + contact.id);
  };

  const filteredContacts = contacts.filter(contact => {
    const query = searchQuery.toLowerCase();
    return (
      contact.athlete_name?.toLowerCase().includes(query) ||
      contact.parent_name?.toLowerCase().includes(query) ||
      contact.parent_email?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl('Home')}>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-medium text-neutral-900">Contacts</h1>
                <p className="text-sm text-neutral-400">{contacts.length} contact{contacts.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectionMode ? (
                <>
                  <Button variant="ghost" onClick={() => {
                    setSelectionMode(false);
                    setSelectedContacts([]);
                  }}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendInvites}
                    disabled={selectedContacts.length === 0 || inviteContactsMutation.isPending}
                    className="bg-[#0066CC] hover:bg-[#0052A3] text-white"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Invites ({selectedContacts.length})
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setSelectionMode(true)}
                    disabled={contacts.length === 0}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Invites
                  </Button>
                  <Button variant="outline" onClick={() => setShowImportModal(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                  <Button onClick={() => setShowAddModal(true)} className="bg-[#0066CC] hover:bg-[#0052A3] text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Contact
                  </Button>
                </>
              )}
            </div>
          </div>

          {contacts.length > 0 && (
            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-neutral-50 border-neutral-200"
                />
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-56 rounded-xl" />
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-neutral-100 p-12 text-center max-w-md mx-auto"
          >
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-neutral-300" />
            </div>
            <h3 className="font-medium text-neutral-900 mb-2">No contacts yet</h3>
            <p className="text-sm text-neutral-500 mb-6">
              Add contacts manually or import from a CSV file to get started
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={() => setShowImportModal(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
              <Button onClick={() => setShowAddModal(true)} className="bg-[#0066CC] hover:bg-[#0052A3] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            </div>
          </motion.div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-500">No contacts found matching "{searchQuery}"</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredContacts.map(contact => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  onSelect={handleToggleSelect}
                  isSelected={selectedContacts.includes(contact.id)}
                  onEdit={handleEdit}
                  onDelete={(id) => deleteContactMutation.mutate(id)}
                  onMessage={handleMessage}
                  selectionMode={selectionMode}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <AddContactModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditContact(null);
        }}
        onSave={handleSaveContact}
        isLoading={addContactMutation.isPending || updateContactMutation.isPending}
        editContact={editContact}
      />

      <ImportContactsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={(contacts) => importContactsMutation.mutate(contacts)}
        isLoading={importContactsMutation.isPending}
      />
    </div>
  );
}