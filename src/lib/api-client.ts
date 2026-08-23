import { Quotation } from './types';

/**
 * REST API Client for Central Production Database Operations
 * Enforces strict cache-busting and no-store headers across all devices.
 */

export async function apiFetchQuotations(userId?: string): Promise<Quotation[]> {
  try {
    const timestamp = Date.now();
    const url = userId
      ? `/api/quotations?userId=${encodeURIComponent(userId)}&_t=${timestamp}`
      : `/api/quotations?_t=${timestamp}`;

    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.quotations)) {
        return data.quotations;
      }
    }
  } catch (e) {
    console.error('API Fetch Quotations Error:', e);
  }
  return [];
}

export async function apiFetchQuotationById(id: string): Promise<Quotation | null> {
  if (!id) return null;
  try {
    const timestamp = Date.now();
    const url = `/api/quotations/${encodeURIComponent(id)}?_t=${timestamp}`;

    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.quotation) {
        return data.quotation;
      }
    }
  } catch (e) {
    console.error('API Fetch Quotation By ID Error:', e);
  }
  return null;
}

export async function apiSaveQuotation(quotation: Quotation): Promise<Quotation> {
  try {
    const res = await fetch('/api/quotations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify(quotation),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.quotation) {
        return data.quotation;
      }
    }
  } catch (e) {
    console.error('API Save Quotation Error:', e);
  }
  return quotation;
}

export async function apiDeleteQuotation(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/quotations/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'Cache-Control': 'no-cache' },
    });
    return res.ok;
  } catch (e) {
    console.error('API Delete Quotation Error:', e);
    return false;
  }
}

import { AppSettings } from './types';

export async function apiFetchSettings(userId?: string): Promise<AppSettings | null> {
  try {
    const timestamp = Date.now();
    const url = userId
      ? `/api/settings?userId=${encodeURIComponent(userId)}&_t=${timestamp}`
      : `/api/settings?_t=${timestamp}`;
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.bank) {
        return data as AppSettings;
      }
    }
  } catch (e) {
    console.error('API Fetch Settings Error:', e);
  }
  return null;
}

export async function apiSaveSettings(settings: AppSettings, userId?: string): Promise<AppSettings> {
  try {
    const url = userId ? `/api/settings?userId=${encodeURIComponent(userId)}` : '/api/settings';
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({ settings, userId }),
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (e) {
    console.error('API Save Settings Error:', e);
  }
  return settings;
}

import { Service } from './types';

export async function apiFetchServices(userId?: string): Promise<Service[]> {
  try {
    const timestamp = Date.now();
    const url = userId
      ? `/api/services?userId=${encodeURIComponent(userId)}&_t=${timestamp}`
      : `/api/services?_t=${timestamp}`;
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data as Service[];
      }
    }
  } catch (e) {
    console.error('API Fetch Services Error:', e);
  }
  return [];
}

export async function apiSaveServices(services: Service[], userId?: string): Promise<Service[]> {
  try {
    const url = userId ? `/api/services?userId=${encodeURIComponent(userId)}` : '/api/services';
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({ services, userId }),
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (e) {
    console.error('API Save Services Error:', e);
  }
  return services;
}

import { UserAccount } from './types';

export async function apiFetchUsers(): Promise<UserAccount[]> {
  try {
    const timestamp = Date.now();
    const res = await fetch(`/api/users?_t=${timestamp}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.users)) {
        return data.users as UserAccount[];
      }
    }
  } catch (e) {
    console.error('API Fetch Users Error:', e);
  }
  return [];
}

export async function apiSaveUser(user: UserAccount): Promise<UserAccount> {
  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify(user),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.user) {
        return data.user;
      }
    }
  } catch (e) {
    console.error('API Save User Error:', e);
  }
  return user;
}

import { TaskItem } from './types';

export async function apiFetchTasks(): Promise<TaskItem[]> {
  try {
    const timestamp = Date.now();
    const res = await fetch(`/api/tasks?_t=${timestamp}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.tasks)) {
        return data.tasks as TaskItem[];
      }
    }
  } catch (e) {
    console.error('API Fetch Tasks Error:', e);
  }
  return [];
}

export async function apiSaveTask(task: TaskItem): Promise<TaskItem> {
  try {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify(task),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.task) {
        return data.task;
      }
    }
  } catch (e) {
    console.error('API Save Task Error:', e);
  }
  return task;
}

export async function apiDeleteTask(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/tasks?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'Cache-Control': 'no-cache' },
    });
    return res.ok;
  } catch (e) {
    console.error('API Delete Task Error:', e);
    return false;
  }
}
