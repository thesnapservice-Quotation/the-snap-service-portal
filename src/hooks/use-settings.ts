'use client';

import { useState, useCallback, useEffect } from 'react';
import { AppSettings } from '@/lib/types';
import { storage } from '@/lib/storage';
import { apiFetchSettings, apiSaveSettings } from '@/lib/api-client';

export function useSettings(overrideUserId?: string) {
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    if (typeof window === 'undefined') return 'default';
    return overrideUserId || storage.getCurrentUser()?.id || 'default';
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const user = typeof window !== 'undefined' ? storage.getCurrentUser() : null;
    const targetId = overrideUserId || user?.id || 'default';
    return storage.getSettings(targetId);
  });
  const [loading, setLoading] = useState(false);

  // Sync latest cloud settings on load and when active user changes
  useEffect(() => {
    let isMounted = true;
    const user = storage.getCurrentUser();
    const targetId = overrideUserId || user?.id || 'default';
    setCurrentUserId(targetId);

    // Initial local load for active user
    const local = storage.getSettings(targetId);
    setSettings(local);

    async function loadCloudSettings() {
      try {
        setLoading(true);
        const cloud = await apiFetchSettings(targetId);
        if (cloud && cloud.bank && isMounted) {
          storage.saveSettings(cloud, targetId);
          setSettings(cloud);
        }
      } catch (e) {
        console.error('Failed to sync cloud settings', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCloudSettings();

    const handleUserOrStorageChange = () => {
      const u = storage.getCurrentUser();
      const tid = overrideUserId || u?.id || 'default';
      setCurrentUserId(tid);
      const curr = storage.getSettings(tid);
      setSettings(curr);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleUserOrStorageChange);
      window.addEventListener('snap_user_switched', handleUserOrStorageChange);
    }

    return () => {
      isMounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleUserOrStorageChange);
        window.removeEventListener('snap_user_switched', handleUserOrStorageChange);
      }
    };
  }, [overrideUserId]);

  const refreshSettings = useCallback(() => {
    const user = storage.getCurrentUser();
    const targetId = overrideUserId || user?.id || 'default';
    const current = storage.getSettings(targetId);
    setSettings(current);
  }, [overrideUserId]);

  const updateSettings = (newSettings: AppSettings) => {
    const user = storage.getCurrentUser();
    const targetId = overrideUserId || user?.id || 'default';
    storage.saveSettings(newSettings, targetId);
    setSettings(newSettings);
    apiSaveSettings(newSettings, targetId).catch((err) => console.error('Cloud settings save err:', err));
  };

  return {
    settings,
    loading,
    refreshSettings,
    updateSettings,
  };
}
