'use client';

import { useState, useEffect, useCallback } from 'react';
import { Service } from '@/lib/types';
import { storage } from '@/lib/storage';
import { generateSecureId } from '@/lib/crypto';

import { apiFetchServices, apiSaveServices } from '@/lib/api-client';

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

export function useServices(overrideWorkspaceId?: string) {
  const [services, setServices] = useState<Service[]>(() => {
    const ws = resolveWorkspaceId(overrideWorkspaceId);
    return storage.getServices(ws);
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const ws = resolveWorkspaceId(overrideWorkspaceId);
    setServices(storage.getServices(ws));

    async function loadCloudServices() {
      try {
        setLoading(true);
        const cloud = await apiFetchServices(ws);
        if (cloud && Array.isArray(cloud) && cloud.length > 0 && isMounted) {
          storage.saveServices(cloud, ws);
          setServices(cloud);
        }
      } catch (e) {
        console.error('Failed to sync cloud services', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCloudServices();

    const handleUserOrStorageChange = () => {
      const activeWs = resolveWorkspaceId(overrideWorkspaceId);
      setServices(storage.getServices(activeWs));
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
  }, [overrideWorkspaceId]);

  const saveServices = (newServices: Service[]) => {
    const ws = resolveWorkspaceId(overrideWorkspaceId);
    storage.saveServices(newServices, ws);
    setServices(newServices);
    apiSaveServices(newServices, ws).catch((err) => console.error('Cloud save services err:', err));
  };

  const addService = (service: Omit<Service, 'id'>) => {
    const newService: Service = {
      ...service,
      id: generateSecureId('srv'),
    };
    const updated = [...services, newService];
    saveServices(updated);
    return newService;
  };

  const updateService = (updatedService: Service) => {
    const updated = services.map((s) => (s.id === updatedService.id ? updatedService : s));
    saveServices(updated);
  };

  const toggleServiceActive = (id: string) => {
    const updated = services.map((s) => (s.id === id ? { ...s, active: !s.active } : s));
    saveServices(updated);
  };

  const deleteService = (id: string) => {
    const updated = services.filter((s) => s.id !== id);
    saveServices(updated);
  };

  return {
    services,
    loading,
    addService,
    updateService,
    toggleServiceActive,
    deleteService,
  };
}
