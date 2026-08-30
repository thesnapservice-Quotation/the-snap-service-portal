'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { 
  Plus, 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  Settings, 
  LogOut, 
  Calendar, 
  PackageCheck, 
  BarChart3, 
  LogIn, 
  ListTodo, 
  Receipt,
  Menu,
  X,
  Crown,
  User,
  Sliders,
  Sparkles,
  ChevronRight
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', shortLabel: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Quotations', shortLabel: 'Quotes', href: '/quotations', icon: FileText },
  { label: 'Create Quotation', shortLabel: 'Create', href: '/quotations/new', icon: PlusCircle },
  { label: 'Master Schedule', shortLabel: 'Schedule', href: '/calendar', icon: Calendar },
  { label: 'Deliverables & Albums', shortLabel: 'Deliverables', href: '/deliverables', icon: PackageCheck },
  { label: 'Daily Tasks', shortLabel: 'Tasks', href: '/tasks', icon: ListTodo },
  { label: 'Expenses & Ledger', shortLabel: 'Expenses', href: '/expenses', icon: Receipt },
  { label: 'Studio Analytics', shortLabel: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Studio Settings', shortLabel: 'Settings', href: '/settings', icon: Sliders },
];

export function Header() {
  const pathname = usePathname();
  const { currentUser, isSuperAdmin, isTaskManager, isImpersonating, returnToSuperAdmin, logout } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  const allowedNavItems = isTaskManager
    ? NAV_ITEMS.filter((item) => item.href === '/tasks' || item.href === '/settings')
    : NAV_ITEMS;

  return (
    <>
      {/* ---------------------------------------------------- */}
      {/* MOBILE STICKY HEADER (VISIBLE ONLY ON MOBILE < 768px)*/}
      {/* ---------------------------------------------------- */}
      <header className="no-print bg-[#0D4F4F] text-white md:hidden sticky top-0 z-40 shadow-md border-b border-[#156060]">
        <div className="px-3.5 py-3 flex items-center justify-between">
          {/* Brand Logo & Name */}
          <Link href={isTaskManager ? '/tasks' : '/'} className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full border border-[#D4AF37] overflow-hidden bg-[#093A3A] shrink-0 shadow-xs">
              {/* eslint-disable-next-next/no-img-element */}
              <img src="/snap-service-logo.png" alt="Snap Service Logo" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <span className="font-serif font-bold text-xs text-white tracking-wider block truncate">
                THE SNAP SERVICE
              </span>
              <span className="text-[8.5px] text-[#D4AF37] block tracking-widest uppercase font-semibold truncate">
                {isTaskManager ? '🎯 Task Manager' : 'v2.0 Operating System'}
              </span>
            </div>
          </Link>

          {/* Quick Action + Hamburger Menu Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            {!isTaskManager && (
              <Link
                href="/quotations/new"
                className="flex items-center gap-1 bg-gradient-to-r from-[#D4AF37] to-[#B89228] text-[#0D4F4F] font-bold text-[11px] px-2.5 py-1.5 rounded-lg shadow-sm hover:brightness-110 transition-all shrink-0"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span className="font-black">New Quote</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className="p-2 rounded-xl bg-[#156060] text-white hover:bg-[#1b7272] transition-colors border border-[#D4AF37]/30 shadow-xs flex items-center justify-center cursor-pointer relative"
              title="Toggle Navigation Menu"
              aria-label="Toggle Navigation Menu"
            >
              {isDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              {isImpersonating && (
                <span className="w-2 h-2 rounded-full bg-[#D4AF37] absolute top-1 right-1 animate-ping" />
              )}
            </button>
          </div>
        </div>

        {/* Horizontal Quick-Scroll Tabs Bar for Instant Mobile Access */}
        <div className="overflow-x-auto no-scrollbar flex items-center gap-1.5 px-3 py-2 bg-[#093A3A] border-t border-[#156060]/70 text-xs font-semibold whitespace-nowrap">
          {allowedNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all shrink-0 text-[11px] ${
                  isActive
                    ? 'bg-[#0D4F4F] text-[#D4AF37] border border-[#D4AF37]/50 shadow-xs font-bold'
                    : 'text-[#C3DFDF] hover:text-white hover:bg-[#156060]/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#D4AF37]' : 'text-[#A5C8C8]'}`} />
                <span>{item.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* ---------------------------------------------------- */}
      {/* FULL-FEATURED MOBILE NAVIGATION DRAWER               */}
      {/* ---------------------------------------------------- */}
      {isDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-[285px] sm:w-80 max-w-[85vw] bg-[#0D4F4F] text-[#FAF9F6] border-r border-[#156060] z-50 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200 min-h-full overflow-y-auto">
            <div>
              {/* Drawer Brand Header */}
              <div className="p-5 border-b border-[#156060] bg-[#093A3A] flex items-center justify-between">
                <Link
                  href={isTaskManager ? '/tasks' : '/'}
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center gap-2.5"
                >
                  <div className="w-9 h-9 rounded-full border-2 border-[#D4AF37] overflow-hidden shadow-lg shrink-0">
                    {/* eslint-disable-next-next/no-img-element */}
                    <img src="/snap-service-logo.png" alt="Snap Service Logo" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h2 className="font-serif font-bold text-sm tracking-wider text-[#FAF9F6]">
                      THE SNAP SERVICE
                    </h2>
                    <p className="text-[9.5px] text-[#A5C8C8] tracking-widest uppercase font-medium">
                      Wedding Studio Portal
                    </p>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Impersonation Banner */}
              {isImpersonating && (
                <div className="mx-4 mt-3.5 p-3 rounded-xl bg-[#D4AF37] text-[#0D4F4F] font-bold text-xs space-y-2 shadow-lg border border-white/40 animate-pulse">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-extrabold">
                    <span>🔁 Switched Account</span>
                  </div>
                  <p className="text-[11px] font-semibold leading-tight text-[#0D4F4F]">
                    Viewing as: <span className="underline">{currentUser?.name}</span>
                  </p>
                  <button
                    onClick={() => {
                      returnToSuperAdmin();
                      setIsDrawerOpen(false);
                    }}
                    className="w-full py-1.5 rounded-lg bg-[#0D4F4F] text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider hover:bg-[#093A3A] transition-all shadow-xs"
                  >
                    ⬅ Return to Owner
                  </button>
                </div>
              )}

              {/* Logged in User Profile Card */}
              {currentUser && (
                <div className="mx-4 my-3 p-3 rounded-xl bg-[#093A3A] border border-[#D4AF37]/30 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-[#D4AF37] text-[#0D4F4F] flex items-center justify-center font-bold text-xs shrink-0">
                      {isSuperAdmin ? (
                        <Crown className="w-4 h-4 text-[#0D4F4F]" />
                      ) : isTaskManager ? (
                        <ListTodo className="w-4 h-4 text-[#0D4F4F]" />
                      ) : (
                        <User className="w-4 h-4 text-[#0D4F4F]" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <span className="font-bold text-xs text-white block truncate">{currentUser.name}</span>
                      <span className="text-[9px] text-[#D4AF37] font-semibold uppercase tracking-wider block">
                        {isSuperAdmin ? '👑 Super Admin' : isTaskManager ? '🎯 Task Manager' : '👤 Standard User'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Menu List */}
              <nav className="p-4 space-y-1.5">
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#A5C8C8]">
                  Main Navigation
                </div>
                {allowedNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsDrawerOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-[#093A3A] text-[#D4AF37] border border-[#D4AF37]/40 shadow-xs'
                          : 'text-[#C3DFDF] hover:bg-[#093A3A]/60 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#D4AF37]' : 'text-[#A5C8C8]'}`} />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#D4AF37]" />}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="p-4 border-t border-[#156060] bg-[#093A3A] space-y-2">
              {currentUser ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-950/60 border border-red-800/40 text-red-200 hover:bg-red-900 transition-colors text-xs font-bold cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-red-300" />
                  <span>Sign Out ({currentUser.name})</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#D4AF37] text-[#0D4F4F] font-bold text-xs shadow-md"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
              )}

              <div className="text-center text-[10px] text-[#A5C8C8]/60 pt-1">
                The Snap Service v2.0 • Studio OS
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
