import { useState, useEffect } from 'react';
import { Service } from '@/lib/types';
import { storage } from '@/lib/storage';
import { DEFAULT_SERVICES } from '@/lib/defaults';

export function useServices() {
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setServices(storage.getServices());
    setLoading(false);
  }, []);

  const saveServices = (newServices: Service[]) => {
    storage.saveServices(newServices);
    setServices(newServices);
  };

  const addService = (service: Omit<Service, 'id'>) => {
    const newService: Service = {
      ...service,
      id: `srv-${Date.now()}`,
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
