'use client';

import React, { useState } from 'react';
import { useProfitPrivacy } from '@/context/profit-privacy-context';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  X, 
  KeyRound, 
  ShieldAlert, 
  Sparkles, 
  ShieldCheck, 
  Settings, 
  CheckCircle2,
  LockKeyhole
} from 'lucide-react';

export function ProfitUnlockModal() {
  const { showUnlockModal, closeUnlockModal, unlockWithPassword, changeProfitPassword } = useProfitPrivacy();
  
  // Tab state: 'unlock' or 'change_password'
  const [activeTab, setActiveTab] = useState<'unlock' | 'change_password'>('unlock');

  // Unlock state
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [unlockError, setUnlockError] = useState('');
  const [unlockLoading, setUnlockLoading] = useState(false);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoStepCode, setTwoStepCode] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [changeError, setChangeError] = useState('');
  const [changeSuccess, setChangeSuccess] = useState('');
  const [changeLoading, setChangeLoading] = useState(false);

  if (!showUnlockModal) return null;

  // Handle Unlock Submit
  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError('');
    setUnlockLoading(true);

    const res = await unlockWithPassword(password);
    setUnlockLoading(false);

    if (!res.success) {
      setUnlockError(res.message);
    } else {
      setPassword('');
      setUnlockError('');
    }
  };

  // Handle Change Password Submit
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError('');
    setChangeSuccess('');
    setChangeLoading(true);

    const res = await changeProfitPassword({
      currentPassword,
      newPassword,
      confirmPassword,
      twoStepCode,
    });

    setChangeLoading(false);

    if (!res.success) {
      setChangeError(res.message);
    } else {
      setChangeSuccess(res.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTwoStepCode('');
      setTimeout(() => {
        setChangeSuccess('');
        setActiveTab('unlock');
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-7 shadow-2xl border-2 border-[#D4AF37] space-y-4 animate-in fade-in zoom-in-95 duration-150 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#0D4F4F] text-[#D4AF37] shadow-sm">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#0D4F4F]">
                {activeTab === 'unlock' ? 'Confidential Profit Figures' : 'Change Profit Password'}
              </h3>
              <p className="text-[10.5px] text-slate-500 font-medium">
                {activeTab === 'unlock' ? 'Protected financial metrics' : 'Admin 2-Step Authorization'}
              </p>
            </div>
          </div>

          <button
            onClick={closeUnlockModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('unlock');
              setUnlockError('');
              setChangeError('');
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'unlock'
                ? 'bg-white text-[#0D4F4F] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LockKeyhole className="w-3.5 h-3.5" /> Unlock Profit
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('change_password');
              setUnlockError('');
              setChangeError('');
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'change_password'
                ? 'bg-white text-[#0D4F4F] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> Change Password (Admin)
          </button>
        </div>

        {/* TAB 1: UNLOCK FORM */}
        {activeTab === 'unlock' && (
          <form onSubmit={handleUnlockSubmit} className="space-y-4 pt-1">
            <p className="text-xs text-slate-600 leading-relaxed">
              Cost breakdowns, profit amounts, and margins are protected. Enter your password to reveal:
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Profit Password / PIN</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoFocus
                  placeholder="Enter password or PIN..."
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setUnlockError('');
                  }}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {unlockError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
                <span>{unlockError}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setActiveTab('change_password')}
                className="text-[11px] text-[#0D4F4F] hover:underline font-semibold flex items-center gap-1"
              >
                <Settings className="w-3 h-3 text-[#D4AF37]" /> Change password
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeUnlockModal}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={unlockLoading || !password}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B89228] text-[#0D4F4F] font-bold text-xs shadow-md hover:brightness-105 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {unlockLoading ? (
                    <div className="w-4 h-4 border-2 border-[#0D4F4F] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>Reveal Profit</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: CHANGE PASSWORD FORM (WITH 2-STEP CODE) */}
        {activeTab === 'change_password' && (
          <form onSubmit={handleChangePasswordSubmit} className="space-y-3 pt-1 text-xs">
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-tight space-y-1">
              <span className="font-bold flex items-center gap-1 text-amber-950">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" /> Admin Security Verification
              </span>
              <p>
                Changing the profit PIN requires your current password and the secret 2-step verification code.
              </p>
            </div>

            {/* Current Password */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Current Password / PIN</label>
              <input
                type="password"
                placeholder="Enter current password..."
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setChangeError('');
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-1 focus:ring-[#0D4F4F] focus:outline-none"
              />
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">New Password / PIN</label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  placeholder="Enter new password (min 4 chars)..."
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setChangeError('');
                  }}
                  className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-1 focus:ring-[#0D4F4F] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Re-enter New Password */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Re-enter New Password</label>
              <input
                type="password"
                placeholder="Confirm new password..."
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setChangeError('');
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-1 focus:ring-[#0D4F4F] focus:outline-none"
              />
            </div>

            {/* 2-Step Verification Code (Hidden master code: 232132) */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-700 flex items-center justify-between">
                <span>2-Step Verification Code</span>
                <span className="text-[10px] text-amber-700 font-semibold">Admin Required</span>
              </label>
              <input
                type="password"
                placeholder="Enter 6-digit 2-step code..."
                value={twoStepCode}
                onChange={(e) => {
                  setTwoStepCode(e.target.value);
                  setChangeError('');
                }}
                className="w-full px-3 py-2 bg-amber-50/50 border border-amber-300 rounded-xl font-mono font-bold tracking-widest text-slate-900 focus:ring-1 focus:ring-[#0D4F4F] focus:outline-none"
              />
            </div>

            {/* Error Message */}
            {changeError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
                <span>{changeError}</span>
              </div>
            )}

            {/* Success Message */}
            {changeSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{changeSuccess}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('unlock')}
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={changeLoading || !currentPassword || !newPassword || !confirmPassword || !twoStepCode}
                className="px-5 py-2 rounded-xl bg-[#0D4F4F] text-[#D4AF37] font-bold shadow-md hover:brightness-110 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {changeLoading ? (
                  <div className="w-4 h-4 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Update Password</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

