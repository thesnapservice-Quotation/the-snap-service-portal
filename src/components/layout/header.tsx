'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Plus, LayoutDashboard, FileText, Settings, LogOut, Calendar, PackageCheck, BarChart3, LogIn } from 'lucide-react';

export function Header() {
  const { currentUser, isSuperAdmin, logout } = useAuth();

  return (
    <header className="no-print bg-[#0D4F4F] text-white p-3.5 md:hidden flex items-center justify-between shadow-md border-b border-[#156060] sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full border border-[#D4AF37] overflow-hidden bg-[#093A3A] shrink-0">
          {/* eslint-disable-next-next/no-img-element */}
          <img src="/snap-service-logo.png" alt="Snap Service Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <span className="font-serif font-bold text-xs text-white tracking-wider block">THE SNAP SERVICE</span>
          <span className="text-[8px] text-[#D4AF37] block tracking-widest uppercase">
            v2.0 Operating System
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-1">
        <Link
          href="/"
          className="p-1.5 rounded-lg bg-[#156060] text-[#C3DFDF] hover:text-white"
          title="Dashboard"
        >
          <LayoutDashboard className="w-4 h-4" />
        </Link>
        <Link
          href="/quotations"
          className="p-1.5 rounded-lg bg-[#156060] text-[#C3DFDF] hover:text-white"
          title="Quotations"
        >
          <FileText className="w-4 h-4" />
        </Link>
        <Link
          href="/calendar"
          className="p-1.5 rounded-lg bg-[#156060] text-[#C3DFDF] hover:text-white"
          title="Master Schedule"
        >
          <Calendar className="w-4 h-4" />
        </Link>
        <Link
          href="/deliverables"
          className="p-1.5 rounded-lg bg-[#156060] text-[#C3DFDF] hover:text-white"
          title="Deliverables"
        >
          <PackageCheck className="w-4 h-4" />
        </Link>
        <Link
          href="/analytics"
          className="p-1.5 rounded-lg bg-[#156060] text-[#C3DFDF] hover:text-white"
          title="Analytics"
        >
          <BarChart3 className="w-4 h-4" />
        </Link>
        <Link
          href="/settings"
          className="p-1.5 rounded-lg bg-[#156060] text-[#C3DFDF] hover:text-white"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </Link>
        <Link
          href="/quotations/new"
          className="flex items-center gap-1 bg-gradient-to-r from-[#D4AF37] to-[#B89228] text-[#0D4F4F] font-bold text-xs px-2 py-1.5 rounded-lg shadow ml-0.5"
        >
          <Plus className="w-4 h-4" />
        </Link>

        {currentUser ? (
          <button
            onClick={() => logout()}
            className="p-1.5 rounded-lg bg-red-900/60 text-red-200 hover:bg-red-800 transition-colors ml-0.5"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        ) : (
          <Link
            href="/login"
            className="p-1.5 rounded-lg bg-[#D4AF37] text-[#0D4F4F] font-bold text-xs ml-0.5"
            title="Sign In"
          >
            <LogIn className="w-4 h-4" />
          </Link>
        )}
      </div>
    </header>
  );
}
