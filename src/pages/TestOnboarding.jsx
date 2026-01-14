import React from 'react';
import AccountTypeSelector from '@/components/ui/AccountTypeSelector';

export default function TestOnboarding() {
  return (
    <AccountTypeSelector onSelect={(type) => console.log('Selected:', type)} />
  );
}