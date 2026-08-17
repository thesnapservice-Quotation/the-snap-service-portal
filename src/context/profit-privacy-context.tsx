'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { verifyPassword } from '@/lib/crypto';

interface ProfitPrivacyContextType {
  isProfitUnlocked: boolean;
  showUnlockModal: boolean;
  openUnlockModal: () => void;
  closeUnlockModal: () => void;
  lockProfit: () => void;
  unlockWithPassword: (password: string) => Promise<{ success: boolean; message: string }>;
}

const ProfitPrivacyContext = createContext<ProfitPrivacyContextType | undefined>(undefined);

export function ProfitPrivacyProvider({ children }: { children: React.ReactNode }) {
  const [isProfitUnlocked, setIsProfitUnlocked] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const { currentUser } = useAuth();

  // Reset profit lock whenever user logs out or switches
  useEffect(() => {
    setIsProfitUnlocked(false);
  }, [currentUser?.id]);

  const openUnlockModal = () => setShowUnlockModal(true);
  const closeUnlockModal = () => setShowUnlockModal(false);
  const lockProfit = () => setIsProfitUnlocked(false);

  const unlockWithPassword = async (password: string): Promise<{ success: boolean; message: string }> => {
    if (!password) {
      return { success: false, message: 'Please enter your password.' };
    }

    if (!currentUser) {
      return { success: false, message: 'Please log in first.' };
    }

    let isValid = false;

    // 1. Verify against current user account password
    if (currentUser.password) {
      isValid = await verifyPassword(password, currentUser.password);
    }

    // 2. Fallback check for admin password
    if (!isValid && (password === 'admin123' || password === 'admin' || password === 'staff123')) {
      isValid = true;
    }

    if (isValid) {
      setIsProfitUnlocked(true);
      setShowUnlockModal(false);
      return { success: true, message: 'Profit figures unlocked!' };
    }

    return { success: false, message: 'Incorrect password. Access denied.' };
  };

  return (
    <ProfitPrivacyContext.Provider
      value={{
        isProfitUnlocked,
        showUnlockModal,
        openUnlockModal,
        closeUnlockModal,
        lockProfit,
        unlockWithPassword,
      }}
    >
      {children}
    </ProfitPrivacyContext.Provider>
  );
}

export function useProfitPrivacy() {
  const context = useContext(ProfitPrivacyContext);
  if (!context) {
    throw new Error('useProfitPrivacy must be used within a ProfitPrivacyProvider');
  }
  return context;
}
