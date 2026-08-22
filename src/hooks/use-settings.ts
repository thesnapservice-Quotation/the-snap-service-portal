'use client';

import { useState, useCallback, useEffect } from 'react';
import { AppSettings } from '@/lib/types';
import { storage } from '@/lib/storage';
import { apiFetchSettings, apiSaveSettings } from '@/lib/api-client';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => storage.getSettings());
  const [loading, setLoading] = useState(false);

  // Sync latest cloud settings on load
  useEffect(() => {
    let isMounted = true;
    async function loadCloudSettings() {
      try {
        const cloud = await apiFetchSettings();
        if (cloud && cloud.bank && isMounted) {
          storage.saveSettings(cloud);
          setSettings(cloud);
        }
      } catch (e) {
        console.error('Failed to sync cloud settings', e);
      }
    }
    loadCloudSettings();
    return () => { isMounted = false; };
  }, []);

  const refreshSettings = useCallback(() => {
    const current = storage.getSettings();
    setSettings(current);
  }, []);

  const updateSettings = (newSettings: AppSettings) => {
    storage.saveSettings(newSettings);
    setSettings(newSettings);
    apiSaveSettings(newSettings).catch((err) => console.error('Cloud settings save err:', err));
  };

  return {
    settings,
    loading,
    refreshSettings,
    updateSettings,
  };
}
