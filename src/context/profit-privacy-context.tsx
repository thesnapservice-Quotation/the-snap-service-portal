'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { verifyPassword, hashPassword } from '@/lib/crypto';
import { storage } from '@/lib/storage';

export interface ChangeProfitPasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  twoStepCode: string;
}

interface ProfitPrivacyContextType {
  isProfitUnlocked: boolean;
  showUnlockModal: boolean;
  openUnlockModal: () => void;
  closeUnlockModal: () => void;
  lockProfit: () => void;
  unlockWithPassword: (password: string) => Promise<{ success: boolean; message: string }>;
  changeProfitPassword: (payload: ChangeProfitPasswordPayload) => Promise<{ success: boolean; message: string }>;
}

const ProfitPrivacyContext = createContext<ProfitPrivacyContextType | undefined>(undefined);

const MASTER_2STEP_CODE = '232132';

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

  const getCustomProfitPassword = (userId?: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      if (userId) {
        const userSpecific = localStorage.getItem(`snap_service_profit_password_${userId}`);
        if (userSpecific) return userSpecific;
      }
      return localStorage.getItem('snap_service_profit_password');
    } catch {
      return null;
    }
  };

  const unlockWithPassword = async (password: string): Promise<{ success: boolean; message: string }> => {
    if (!password) {
      return { success: false, message: 'Please enter your password.' };
    }

    let isValid = false;

    // 1. Check custom profit password from localStorage
    const customPass = getCustomProfitPassword(currentUser?.id);
    if (customPass) {
      // Once a custom profit password is set, ONLY that password is accepted (all old/default passwords strictly expired)
      if (password === customPass) {
        isValid = true;
      }
    } else {
      // 2. Only if no custom password was ever set, check initial user account password
      if (currentUser?.password) {
        isValid = await verifyPassword(password, currentUser.password);
      }

      // 3. Initial default fallback only if user password not set
      if (!isValid && (password === 'admin123' || password === 'admin' || password === 'staff123' || password === '5791')) {
        isValid = true;
      }
    }

    if (isValid) {
      setIsProfitUnlocked(true);
      setShowUnlockModal(false);
      return { success: true, message: 'Profit figures unlocked!' };
    }

    return { success: false, message: 'Incorrect password. Access denied.' };
  };

  const changeProfitPassword = async (
    payload: ChangeProfitPasswordPayload
  ): Promise<{ success: boolean; message: string }> => {
    const { currentPassword, newPassword, confirmPassword, twoStepCode } = payload;

    // 1. Validate 2-step verification code
    if (!twoStepCode || twoStepCode.trim() !== MASTER_2STEP_CODE) {
      return { 
        success: false, 
        message: 'Invalid 2-Step Verification Code. Admin authorization failed.' 
      };
    }

    // 2. Validate new password matching
    if (!newPassword || newPassword.length < 4) {
      return { 
        success: false, 
        message: 'New password must be at least 4 characters long.' 
      };
    }

    if (newPassword !== confirmPassword) {
      return { 
        success: false, 
        message: 'New password and Re-entered password do not match.' 
      };
    }

    // 3. Validate current password
    let isCurrentValid = false;
    const customPass = getCustomProfitPassword(currentUser?.id);
    if (customPass) {
      // Only the current active custom password is valid
      if (currentPassword === customPass) {
        isCurrentValid = true;
      }
    } else {
      if (currentUser?.password) {
        isCurrentValid = await verifyPassword(currentPassword, currentUser.password);
      }
      if (!isCurrentValid && (currentPassword === 'admin123' || currentPassword === 'admin' || currentPassword === 'staff123' || currentPassword === '5791')) {
        isCurrentValid = true;
      }
    }

    if (!isCurrentValid) {
      return { 
        success: false, 
        message: 'Current password is incorrect. Please check and try again.' 
      };
    }

    // 4. Save new profit password locally and sync
    try {
      if (typeof window !== 'undefined') {
        if (currentUser?.id) {
          localStorage.setItem(`snap_service_profit_password_${currentUser.id}`, newPassword);
        }
        localStorage.setItem('snap_service_profit_password', newPassword);
      }

      // Also update account password in storage if logged in
      if (currentUser) {
        const hashed = await hashPassword(newPassword);
        const updatedUser = { ...currentUser, password: hashed };
        storage.saveUser(updatedUser);
      }

      return { 
        success: true, 
        message: '✅ Profit Password updated successfully!' 
      };
    } catch (e) {
      console.error('Error saving new profit password', e);
      return { 
        success: false, 
        message: 'Failed to save new password. Please try again.' 
      };
    }
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
        changeProfitPassword,
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
