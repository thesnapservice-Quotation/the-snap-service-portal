'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  Sliders, 
  Sparkles, 
  Crown, 
  LogOut, 
  User, 
  Calendar,
  PackageCheck,
  BarChart3,
  ArrowRightLeft
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Quotations', href: '/quotations', icon: FileText },
  { label: 'Create Quotation', href: '/quotations/new', icon: PlusCircle },
  { label: 'Master Schedule', href: '/calendar', icon: Calendar },
  { label: 'Deliverables & Albums', href: '/deliverables', icon: PackageCheck },
  { label: 'Studio Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Studio Settings', href: '/settings', icon: Sliders },
];

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser, isSuperAdmin, isImpersonating, returnToSuperAdmin, logout } = useAuth();

  return (
    <aside className="w-64 bg-[#0D4F4F] text-[#FAF9F6] border-r border-[#156060] hidden md:flex flex-col justify-between shrink-0 shadow-xl min-h-screen">
      <div>
        {/* Brand Logo Header */}
        <div className="p-6 border-b border-[#156060] bg-[#093A3A]">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full border-2 border-[#D4AF37] overflow-hidden shadow-lg group-hover:scale-105 transition-transform shrink-0">
              {/* eslint-disable-next-next/no-img-element */}
              <img src="/snap-service-logo.png" alt="Snap Service Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg tracking-wider text-[#FAF9F6] flex items-center gap-1.5">
                THE SNAP SERVICE
              </h1>
              <p className="text-[10px] text-[#A5C8C8] tracking-widest uppercase font-medium">Wedding Quotation Studio</p>
            </div>
          </Link>
        </div>

        {/* Impersonation Banner for Super Admin */}
        {isImpersonating && (
          <div className="mx-4 mt-4 p-3 rounded-xl bg-[#D4AF37] text-[#0D4F4F] font-bold text-xs space-y-2 shadow-lg border border-white/40 animate-pulse">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-extrabold">
              <span>🔁 Switched Account</span>
            </div>
            <p className="text-[11px] font-semibold leading-tight text-[#0D4F4F]">
              Viewing as: <span className="underline">{currentUser?.name}</span>
            </p>
            <button
              onClick={() => returnToSuperAdmin()}
              className="w-full py-1.5 rounded-lg bg-[#0D4F4F] text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider hover:bg-[#093A3A] transition-all shadow-xs"
            >
              ⬅ Return to Owner
            </button>
          </div>
        )}

        {/* Current Logged In User Profile Card */}
        {currentUser && (
          <div className="mx-4 my-3 p-3 rounded-xl bg-[#093A3A] border border-[#D4AF37]/30 flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#D4AF37] text-[#0D4F4F] flex items-center justify-center font-bold text-xs shrink-0">
                {isSuperAdmin ? <Crown className="w-4 h-4 text-[#0D4F4F]" /> : <User className="w-4 h-4 text-[#0D4F4F]" />}
              </div>
              <div className="overflow-hidden">
                <span className="font-bold text-xs text-white block truncate">{currentUser.name}</span>
                <span className="text-[9px] text-[#D4AF37] font-semibold uppercase tracking-wider block">
                  {isSuperAdmin ? '👑 Super Admin' : '👤 Standard User'}
                </span>
              </div>
            </div>

            <button
              onClick={() => logout()}
              className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-slate-800 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89228] text-[#0D4F4F] font-bold shadow-md transform translate-x-1'
                    : 'text-[#C3DFDF] hover:bg-[#156060]/50 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Branding */}
      <div className="p-4 border-t border-[#156060] bg-[#093A3A]/40 text-center">
        <p className="text-[11px] text-[#8DBABA]">The Snap Service v2.0</p>
        <p className="text-[10px] text-[#5E9B9B] mt-0.5">Operating System</p>
      </div>
    </aside>
  );
}
