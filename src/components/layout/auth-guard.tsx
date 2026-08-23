'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';
import { UserAccount } from '@/lib/types';

const PUBLIC_PATHS = ['/login', '/signup'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserAccount | null>(() => storage.getCurrentUser());
  const isPublic = PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/portal') || pathname.startsWith('/p/');
  const [checking, setChecking] = useState(() => !isPublic && !storage.getCurrentUser());

  useEffect(() => {
    const current = storage.getCurrentUser();
    setUser(current);

    if (!current && !isPublic) {
      router.push('/login');
    } else if (current && (pathname === '/login' || pathname === '/signup')) {
      if (current.role === 'task_manager') {
        router.push('/tasks');
      } else {
        router.push('/');
      }
    } else if (current && current.role === 'task_manager' && !pathname.startsWith('/tasks') && !isPublic) {
      router.push('/tasks');
    } else {
      setChecking(false);
    }
  }, [pathname, router, isPublic]);

  if (checking && !isPublic && !user) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4 font-sans text-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold text-[#0D4F4F]">
          <div className="w-5 h-5 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin" />
          <span>Verifying Studio Access...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
