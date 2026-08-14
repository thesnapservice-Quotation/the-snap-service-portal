'use me';
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Sparkles, Lock, Mail, KeyRound, UserCheck, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const res = login(email, password);
    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        router.push('/');
      }, 500);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4 font-sans text-slate-800">
      <div className="w-full max-w-md bg-white rounded-3xl border-2 border-[#E5E0D5] shadow-2xl p-8 space-y-6 relative overflow-hidden">
        {/* Top Gold Accent Decoration */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#0D4F4F] via-[#D4AF37] to-[#0D4F4F]" />

        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="w-20 h-20 mx-auto rounded-full border-2 border-[#D4AF37] p-0.5 shadow-lg bg-[#093A3A] overflow-hidden">
            {/* eslint-disable-next-next/no-img-element */}
            <img src="/snap-service-logo.png" alt="Snap Service Logo" className="w-full h-full object-cover rounded-full" />
          </div>
          <h1 className="font-serif font-extrabold text-2xl text-[#0D4F4F] tracking-wide flex items-center justify-center gap-1.5 mt-2">
            SNAP SERVICE <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          </h1>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">
            Wedding Quotation Studio — Sign In
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <UserCheck className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0D4F4F] to-[#093A3A] text-[#D4AF37] font-serif font-bold text-sm tracking-wider uppercase shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4 text-[#D4AF37]" /> Sign In to Studio
          </button>
        </form>

        {/* Signup Redirect Link */}
        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Need a new photographer account?{' '}
          <Link href="/signup" className="font-bold text-[#0D4F4F] hover:underline">
            Request Signup Access
          </Link>
        </div>
      </div>
    </div>
  );
}
