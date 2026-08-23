'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserAccount, UserRole } from '@/lib/types';
import { storage } from '@/lib/storage';
import { hashPassword, verifyPassword, generateSecureId } from '@/lib/crypto';
import { apiFetchUsers, apiSaveUser } from '@/lib/api-client';

export function useAuth() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => storage.getCurrentUser());
  const [users, setUsers] = useState<UserAccount[]>(() => storage.getUsers());
  const [loading, setLoading] = useState(false);

  const refreshAuth = useCallback(async () => {
    const user = storage.getCurrentUser();
    let allUsers = storage.getUsers();
    setCurrentUser(user);
    setUsers(allUsers);

    try {
      const cloudUsers = await apiFetchUsers();
      if (Array.isArray(cloudUsers) && cloudUsers.length > 0) {
        // Merge cloud users into local storage
        cloudUsers.forEach((u) => {
          storage.saveUser(u);
        });
        allUsers = storage.getUsers();
        setUsers(allUsers);
        
        // If current user was updated (e.g. approved by admin), update current session
        if (user) {
          const freshCurrent = allUsers.find((u) => u.id === user.id);
          if (freshCurrent) {
            storage.setCurrentUser(freshCurrent);
            setCurrentUser(freshCurrent);
          }
        }
      }
    } catch (e) {
      console.error('Error syncing users with cloud:', e);
    }
  }, []);

  // Fetch latest users on mount
  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const login = async (email: string, pass: string): Promise<{ success: boolean; message: string }> => {
    // 1. First ensure latest users from cloud are loaded
    let allUsers = storage.getUsers();
    try {
      const cloudUsers = await apiFetchUsers();
      if (Array.isArray(cloudUsers) && cloudUsers.length > 0) {
        cloudUsers.forEach((u) => storage.saveUser(u));
        allUsers = storage.getUsers();
        setUsers(allUsers);
      }
    } catch {}

    const cleanEmail = (email || '').trim().toLowerCase();

    const match = allUsers.find((u) => {
      const uEmail = (u.email || '').trim().toLowerCase();
      if (uEmail === cleanEmail) return true;

      // Handle common studio email domain variations (.com vs .pk vs thesnapservice.com)
      if (u.role === 'super_admin') {
        const isSuperAdminAlias =
          cleanEmail === 'admin@snapservice.com' ||
          cleanEmail === 'admin@snapservice.pk' ||
          cleanEmail === 'admin@thesnapservice.com' ||
          cleanEmail === 'zunair@snapservice.com' ||
          cleanEmail === 'zunair@snapservice.pk' ||
          cleanEmail === 'zunair@thesnapservice.com';
        return isSuperAdminAlias;
      }

      if (u.id === 'user-staff-1' || uEmail.startsWith('staff@')) {
        const isStaffAlias =
          cleanEmail === 'staff@snapservice.com' ||
          cleanEmail === 'staff@snapservice.pk' ||
          cleanEmail === 'staff@thesnapservice.com';
        return isStaffAlias;
      }

      return false;
    });

    if (!match) {
      return { success: false, message: 'Invalid email address.' };
    }

    if (match.password) {
      const isValid = await verifyPassword(pass, match.password);
      if (!isValid) {
        return { success: false, message: 'Incorrect password.' };
      }
    }

    if (!match.approved) {
      return {
        success: false,
        message: 'Your account is pending Super Admin approval. Please contact Zunair Ahmad (Owner).',
      };
    }

    if (!match.active) {
      return { success: false, message: 'Your account has been deactivated.' };
    }

    storage.setCurrentUser(match);
    setCurrentUser(match);
    return { success: true, message: 'Login successful!' };
  };

  const signup = async (
    name: string,
    email: string,
    pass: string,
    phone?: string
  ): Promise<{ success: boolean; message: string }> => {
    // 1. Sync latest users from cloud first
    let allUsers = storage.getUsers();
    try {
      const cloudUsers = await apiFetchUsers();
      if (Array.isArray(cloudUsers) && cloudUsers.length > 0) {
        cloudUsers.forEach((u) => storage.saveUser(u));
        allUsers = storage.getUsers();
      }
    } catch {}

    const existing = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (existing) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    const hashedPassword = await hashPassword(pass);

    const newUser: UserAccount = {
      id: generateSecureId('user'),
      name,
      email,
      password: hashedPassword,
      phone,
      role: 'user',
      approved: false, // Requires Super Admin approval
      active: true,
      createdAt: new Date().toISOString(),
    };

    // Save locally
    storage.saveUser(newUser);
    setUsers((prev) => [...prev, newUser]);

    // Save to Cloud Central Database so Admin sees the request immediately on all devices
    try {
      await apiSaveUser(newUser);
    } catch (e) {
      console.error('Error saving user to central cloud:', e);
    }

    refreshAuth();
    return {
      success: true,
      message: 'Signup request submitted! Your account is pending Super Admin approval.',
    };
  };

  const createUserDirectly = async (
    name: string,
    email: string,
    pass: string,
    role: UserRole = 'user'
  ): Promise<{ success: boolean; message: string }> => {
    const allUsers = storage.getUsers();
    const existing = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (existing) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    const hashedPassword = await hashPassword(pass);

    const newUser: UserAccount = {
      id: generateSecureId('user'),
      name,
      email,
      password: hashedPassword,
      role,
      approved: true, // Super Admin direct creation is pre-approved
      active: true,
      createdAt: new Date().toISOString(),
    };

    storage.saveUser(newUser);
    try {
      await apiSaveUser(newUser);
    } catch {}
    refreshAuth();
    return { success: true, message: `Account created for ${name} (${role})` };
  };

  const approveUser = async (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      const updated: UserAccount = { ...target, approved: true, active: true };
      storage.saveUser(updated);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      try {
        await apiSaveUser(updated);
      } catch {}
      refreshAuth();
    }
  };

  const toggleUserActive = async (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      const updated: UserAccount = { ...target, active: !target.active };
      storage.saveUser(updated);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      try {
        await apiSaveUser(updated);
      } catch {}
      refreshAuth();
    }
  };

  const deleteUser = async (userId: string) => {
    storage.deleteUser(userId);
    refreshAuth();
  };

  const switchUserAccount = (targetUserId: string) => {
    const targetUser = users.find((u) => u.id === targetUserId);
    if (!targetUser || !currentUser) return;

    const adminId = currentUser.originalAdminId || currentUser.id;

    const switchedSession: UserAccount = {
      ...targetUser,
      originalAdminId: adminId,
    };

    storage.setCurrentUser(switchedSession);
    setCurrentUser(switchedSession);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('snap_quotation_updated'));
      window.dispatchEvent(new Event('storage'));
    }
    router.push('/');
  };

  const returnToSuperAdmin = () => {
    const allUsers = storage.getUsers();
    const adminId = currentUser?.originalAdminId || 'user-super-admin';
    const adminUser = allUsers.find((u) => u.id === adminId) || allUsers.find((u) => u.role === 'super_admin');

    if (adminUser) {
      const cleanAdmin = { ...adminUser };
      delete cleanAdmin.originalAdminId;
      storage.setCurrentUser(cleanAdmin);
      setCurrentUser(cleanAdmin);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('snap_quotation_updated'));
        window.dispatchEvent(new Event('storage'));
      }
      router.push('/settings');
    }
  };

  const logout = () => {
    storage.setCurrentUser(null);
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('snap_quotation_updated'));
      window.dispatchEvent(new Event('storage'));
    }
    router.push('/login');
  };

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isImpersonating = !!currentUser?.originalAdminId;

  return {
    currentUser,
    users,
    loading,
    isSuperAdmin,
    isImpersonating,
    login,
    signup,
    createUserDirectly,
    approveUser,
    toggleUserActive,
    deleteUser,
    switchUserAccount,
    returnToSuperAdmin,
    logout,
    refreshAuth,
  };
}
