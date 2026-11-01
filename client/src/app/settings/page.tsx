'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  LockKeyhole,
  LogOut,
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
  const { changePassword, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'The new passwords do not match.' });
      return;
    }
    setSaving(true);
    const result = await changePassword({ currentPassword, newPassword });
    setSaving(false);
    if (result.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'Your password was changed successfully.' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Unable to change your password.' });
    }
  };

  return (
    <ProtectedRoute>
      <main className="mx-auto min-h-[70vh] max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-bold uppercase tracking-wider text-campus-700">Account</p>
          <h1 className="mt-1 text-3xl font-extrabold text-slate-900">Settings</h1>
          <p className="mt-2 text-sm text-slate-500">Manage your sign-in security and session.</p>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-6 flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-campus-50 text-campus-700"><LockKeyhole className="h-5 w-5" /></span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Change password</h2>
              <p className="mt-1 text-sm text-slate-500">Choose a strong password that you do not use elsewhere.</p>
            </div>
          </div>

          {message && (
            <div className={`mb-5 flex items-start gap-2 rounded-xl border p-3 text-sm ${
              message.type === 'success' ? 'border-campus-200 bg-campus-50 text-campus-800' : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-1.5 text-sm font-semibold text-slate-700">
              Current password
              <input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required className="w-full rounded-xl border border-slate-300 px-3.5 py-3 font-normal text-slate-900 outline-none focus:border-campus-500 focus:ring-2 focus:ring-campus-100" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5 text-sm font-semibold text-slate-700">
                New password
                <input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required minLength={6} className="w-full rounded-xl border border-slate-300 px-3.5 py-3 font-normal text-slate-900 outline-none focus:border-campus-500 focus:ring-2 focus:ring-campus-100" />
              </label>
              <label className="block space-y-1.5 text-sm font-semibold text-slate-700">
                Confirm new password
                <input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={6} className="w-full rounded-xl border border-slate-300 px-3.5 py-3 font-normal text-slate-900 outline-none focus:border-campus-500 focus:ring-2 focus:ring-campus-100" />
              </label>
            </div>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-campus-700 px-5 py-3 text-sm font-bold text-white hover:bg-campus-800 disabled:cursor-not-allowed disabled:opacity-60">
              {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
              Update password
            </button>
          </form>
        </section>

        <section className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="font-bold text-slate-900">Sign out</h2>
            <p className="mt-1 text-sm text-slate-500">End your current CampusBook session.</p>
          </div>
          <button type="button" onClick={() => void logout()} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-50">
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </section>

        <p className="mt-5 text-sm text-slate-500">
          Update your account details on the <Link href="/profile" className="font-semibold text-campus-700 hover:underline">profile page</Link>.
        </p>
      </main>
    </ProtectedRoute>
  );
}
