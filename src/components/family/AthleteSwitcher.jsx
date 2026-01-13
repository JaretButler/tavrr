import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function AthleteSwitcher({ athletes = [], selectedAthlete, onSelect, onAddAthlete }) {
  const current = athletes.find(a => a.id === selectedAthlete) || athletes[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-neutral-50 transition-colors group">
          <div className="text-left">
            <p className="text-sm font-medium text-neutral-900">Callahan Family</p>
            <p className="text-xs text-neutral-400">{current?.name || 'Select Profile'}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600 transition-colors ml-2" />
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-56">
        {athletes.map((athlete) => (
          <DropdownMenuItem
            key={athlete.id}
            onClick={() => onSelect(athlete.id)}
            className="flex items-center gap-3 py-3"
          >
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-xs"
              style={{ backgroundColor: athlete.avatar_color || '#6B7280' }}
            >
              {athlete.name?.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-900">{athlete.name}</p>
              <p className="text-xs text-neutral-400">{athlete.sport_discipline}</p>
            </div>
            {athlete.id === selectedAthlete && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0066CC]" />
            )}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={onAddAthlete} className="flex items-center gap-3 py-3 text-[#0066CC]">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Add Person</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}