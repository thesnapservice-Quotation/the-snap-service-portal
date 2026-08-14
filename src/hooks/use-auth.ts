'use me';
'use client';

import { useState, useEffect } from 'react';
import { UserAccount, UserRole } from '@/lib/types';
import { storage } from '@/lib/storage';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshAuth = () => {
    const user = storage.getCurrentUser();
    const allUsers = storage.getUsers();
    setCurrentUser(user);
    setUsers(allUsers);
    setLoading(false);
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  const login = (email: string, pass: string): { success: boolean; message: string } => {
    const allUsers = storage.getUsers();
    const match = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!match) {
      return { success: false, message: 'Invalid email address.' };
    }

    if (match.password && match.password !== pass) {
      return { success: false, message: 'Incorrect password.' };
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

  const signup = (
    name: string,
    email: string,
    pass: string,
    phone?: string
  ): { success: boolean; message: string } => {
    const allUsers = storage.getUsers();
    const existing = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (existing) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    const newUser: UserAccount = {
      id: `user-${Date.now()}`,
      name,
      email,
      password: pass,
      phone,
      role: 'user',
      approved: false, // Requires Super Admin approval
      active: true,
      createdAt: new Date().toISOString(),
    };

    storage.saveUser(newUser);
    refreshAuth();
    return {
      success: true,
      message: 'Signup request submitted! Your account is pending Super Admin approval.',
    };
  };

  const createUserDirectly = (
    name: string,
    email: string,
    pass: string,
    role: UserRole = 'user'
  ): { success: boolean; message: string } => {
    const allUsers = storage.getUsers();
    const existing = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (existing) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    const newUser: UserAccount = {
      id: `user-${Date.now()}`,
      name,
      email,
      password: pass,
      role,
      approved: true, // Super Admin direct creation is pre-approved
      active: true,
      createdAt: new Date().toISOString(),
    };

    storage.saveUser(newUser);
    refreshAuth();
    return { success: true, message: `Account created for ${name} (${role})` };
  };

  const approveUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      storage.saveUser({ ...target, approved: true, active: true });
      refreshAuth();
    }
  };

  const toggleUserActive = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      storage.saveUser({ ...target, active: !target.active });
      refreshAuth();
    }
  };

  const deleteUser = (userId: string) => {
    storage.deleteUser(userId);
    refreshAuth();
  };

  const switchUserAccount = (targetUserId: string) => {
    const targetUser = users.find((u) => u.id === targetUserId);
    if (!targetUser || !currentUser) return;

    // Track real admin ID if not already tracking
    const adminId = currentUser.originalAdminId || currentUser.id;

    const switchedSession: UserAccount = {
      ...targetUser,
      originalAdminId: adminId,
    };

    storage.setCurrentUser(switchedSession);
    setCurrentUser(switchedSession);
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
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
        window.location.href = '/settings';
      }
    }
  };

  const logout = () => {
    storage.setCurrentUser(null);
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
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
