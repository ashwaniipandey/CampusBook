'use client';

import { useAuth } from '@/context/AuthContext';
import { BadgeCheck, LogOut, Shield } from 'lucide-react';

export default function AdminSettingsPage() {
  const { user, logout } = useAuth();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Account</p>
        <h2 className="mt-1 text-2xl font-extrabold text-slate-900">Admin settings</h2>
        <p className="mt-1 text-sm text-slate-500">Administrator account and session details.</p>
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50 text-xl font-extrabold text-emerald-800">
            {user?.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : user?.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">{user?.name}<BadgeCheck className="h-5 w-5 text-emerald-600" /></h3>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700"><Shield className="h-3 w-3" /> Administrator</span>
          </div>
        </div>
        <dl className="mt-7 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
          <div><dt className="text-xs font-semibold text-slate-500">Account role</dt><dd className="mt-1 text-sm font-bold capitalize text-slate-800">{user?.role}</dd></div>
          <div><dt className="text-xs font-semibold text-slate-500">University</dt><dd className="mt-1 text-sm font-bold text-slate-800">{typeof user?.university === 'string' ? user.university : user?.university?.name || '—'}</dd></div>
        </dl>
      </section>
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-white p-5 shadow-sm">
        <div><h3 className="font-bold text-slate-900">End admin session</h3><p className="mt-1 text-sm text-slate-500">Sign out from the administrator console.</p></div>
        <button type="button" onClick={() => void logout()} className="inline-flex items-center gap-2 rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-800"><LogOut className="h-4 w-4" /> Log out</button>
      </section>
    </div>
  );
}
