import { useState, useEffect } from 'react';
import { AppSettings } from '@/lib/types';
import { storage } from '@/lib/storage';
import { DEFAULT_SETTINGS } from '@/lib/defaults';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const refreshSettings = () => {
    const current = storage.getSettings();
    setSettings(current);
  };

  useEffect(() => {
    refreshSettings();
    setLoading(false);
  }, []);

  const updateSettings = (newSettings: AppSettings) => {
    storage.saveSettings(newSettings);
    setSettings(newSettings);
  };

  return {
    settings,
    loading,
    refreshSettings,
    updateSettings,
  };
}
