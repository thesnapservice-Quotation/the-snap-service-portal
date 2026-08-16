'use client';

import { useState, useCallback } from 'react';
import { AppSettings } from '@/lib/types';
import { storage } from '@/lib/storage';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => storage.getSettings());
  const [loading] = useState(false);

  const refreshSettings = useCallback(() => {
    const current = storage.getSettings();
    setSettings(current);
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
