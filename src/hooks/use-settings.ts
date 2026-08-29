'use client';

import { useState, useCallback, useEffect } from 'react';
import { AppSettings } from '@/lib/types';
import { storage } from '@/lib/storage';
import { apiFetchSettings, apiSaveSettings } from '@/lib/api-client';

function resolveWorkspaceId(override?: string): string {
  if (override) {
    if (override.startsWith('ws_')) return override;
    return override === 'user-super-admin' || override === 'global' ? 'ws_user-super-admin' : `ws_${override}`;
  }
  if (typeof window === 'undefined') return 'ws_user-super-admin';
  const u = storage.getCurrentUser();
  if (!u || !u.id) return 'ws_user-super-admin';
  if (u.role === 'super_admin' || u.id === 'user-super-admin') return 'ws_user-super-admin';
  return u.workspaceId || `ws_${u.id}`;
}

export function useSettings(overrideWorkspaceId?: string) {
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>(() => resolveWorkspaceId(overrideWorkspaceId));

  const [settings, setSettings] = useState<AppSettings>(() => {
    const ws = resolveWorkspaceId(overrideWorkspaceId);
    return storage.getSettings(ws);
  });
  const [loading, setLoading] = useState(false);

  // Sync latest cloud settings on load and when active workspace changes
  useEffect(() => {
    let isMounted = true;
    const ws = resolveWorkspaceId(overrideWorkspaceId);
    setCurrentWorkspaceId(ws);

    // Initial local load for active workspace
    const local = storage.getSettings(ws);
    setSettings(local);

    async function loadCloudSettings() {
      try {
        setLoading(true);
        const cloud = await apiFetchSettings(ws);
        if (cloud && cloud.bank && isMounted) {
          storage.saveSettings(cloud, ws);
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
      const activeWs = resolveWorkspaceId(overrideWorkspaceId);
      setCurrentWorkspaceId(activeWs);
      const curr = storage.getSettings(activeWs);
      setSettings(curr);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleUserOrStorageChange);
      window.addEventListener('snap_user_switched', handleUserOrStorageChange);
      window.addEventListener('snap_settings_updated', handleUserOrStorageChange);
    }

    return () => {
      isMounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleUserOrStorageChange);
        window.removeEventListener('snap_user_switched', handleUserOrStorageChange);
        window.removeEventListener('snap_settings_updated', handleUserOrStorageChange);
      }
    };
  }, [overrideWorkspaceId]);

  const refreshSettings = useCallback(() => {
    const ws = resolveWorkspaceId(overrideWorkspaceId);
    const current = storage.getSettings(ws);
    setSettings(current);
  }, [overrideWorkspaceId]);

  const updateSettings = async (newSettings: AppSettings) => {
    const ws = resolveWorkspaceId(overrideWorkspaceId);
    const settingsWithWs: AppSettings = {
      ...newSettings,
      workspaceId: ws,
    };
    storage.saveSettings(settingsWithWs, ws);
    setSettings(settingsWithWs);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('snap_settings_updated'));
      window.dispatchEvent(new Event('storage'));
    }
    try {
      await apiSaveSettings(settingsWithWs, ws);
    } catch (err) {
      console.error('Cloud settings save err:', err);
    }
  };

  return {
    settings,
    loading,
    refreshSettings,
    updateSettings,
  };
}
