'use client';

import { MyLendingProvider } from '@/components/my-lending/my-lending-provider';
import { AuthModal } from '@/components/my-lending/auth-modal';
import type { ReactNode } from 'react';

export function MyLendingShell({ children }: { children: ReactNode }) {
  return (
    <MyLendingProvider>
      {children}
      <AuthModal />
    </MyLendingProvider>
  );
}
