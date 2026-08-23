'use client';

import { useState, useEffect, useCallback } from 'react';
import { Service } from '@/lib/types';
import { storage } from '@/lib/storage';
import { generateSecureId } from '@/lib/crypto';

import { apiFetchServices, apiSaveServices } from '@/lib/api-client';

export function useServices(overrideUserId?: string) {
  const [services, setServices] = useState<Service[]>(() => {
    const user = typeof window !== 'undefined' ? storage.getCurrentUser() : null;
    const targetId = overrideUserId || user?.id || 'default';
    return storage.getServices(targetId);
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const user = storage.getCurrentUser();
    const targetId = overrideUserId || user?.id || 'default';
    setServices(storage.getServices(targetId));

    async function loadCloudServices() {
      try {
        setLoading(true);
        const cloud = await apiFetchServices(targetId);
        if (cloud && Array.isArray(cloud) && cloud.length > 0 && isMounted) {
          storage.saveServices(cloud, targetId);
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
      const u = storage.getCurrentUser();
      const tid = overrideUserId || u?.id || 'default';
      setServices(storage.getServices(tid));
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

  const saveServices = (newServices: Service[]) => {
    const user = storage.getCurrentUser();
    const targetId = overrideUserId || user?.id || 'default';
    storage.saveServices(newServices, targetId);
    setServices(newServices);
    apiSaveServices(newServices, targetId).catch((err) => console.error('Cloud save services err:', err));
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
