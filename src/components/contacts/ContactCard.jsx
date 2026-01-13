import React from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Send, CheckCircle2, MoreVertical, Trash2, Edit, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ContactCard({ contact, onSelect, isSelected, onEdit, onDelete, onInvite, onMessage, selectionMode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white border rounded-xl p-5 transition-all ${
        isSelected ? 'border-[#0066CC] ring-2 ring-[#0066CC]/10' : 'border-neutral-100 hover:border-neutral-200'
      }`}
    >
      <div className="flex items-start gap-4">
        {selectionMode && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect?.(contact.id)}
            className="mt-1"
          />
        )}

        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium flex-shrink-0">
          {contact.athlete_name?.charAt(0) || 'A'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h3 className="font-medium text-neutral-900">{contact.athlete_name}</h3>
              {contact.sport_discipline && (
                <p className="text-sm text-neutral-500">{contact.sport_discipline}</p>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1">
                  <MoreVertical className="w-4 h-4 text-neutral-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onMessage?.(contact)}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(contact)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete?.(contact.id)} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-neutral-300" />
              <span className="text-neutral-600">{contact.parent_name || 'Parent/Guardian'}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-neutral-300" />
              <span className="text-neutral-600">{contact.parent_email}</span>
            </div>

            {contact.parent_phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-neutral-300" />
                <span className="text-neutral-600">{contact.parent_phone}</span>
              </div>
            )}
          </div>

          {contact.invited && (
            <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">
                Invited {contact.invited_at && `on ${format(new Date(contact.invited_at), 'MMM d')}`}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}