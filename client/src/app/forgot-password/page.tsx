'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  BookOpen,
  Mail,
  KeyRound,
  ArrowRight,
  AlertCircle,
  Loader2,
  Terminal,
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid account email address');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.forgotPassword({ email: email.trim() });
      setIsSubmitting(false);
      // Navigate to reset password page with email param
      router.push(`/reset-password?email=${encodeURIComponent(email.trim())}`);
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Failed to dispatch password reset code');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-200/80">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-amber-50 text-amber-600 mb-2 shadow-xs">
            <KeyRound className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Forgot Password?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Enter your university email to receive a password reset code.
          </p>
        </div>

        {/* Dev Mode Banner */}
        <div className="bg-slate-900 text-slate-300 p-3.5 rounded-2xl text-xs space-y-1 border border-slate-800">
          <div className="flex items-center gap-1.5 font-mono text-amber-400 font-semibold">
            <Terminal className="w-3.5 h-3.5" />
            <span>Dev Console Tip:</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            The 6-digit password reset code will be printed in your server terminal.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Registered Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. alex.johnson@stanford.edu"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-campus-500 text-sm text-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-campus-600 hover:bg-campus-700 disabled:bg-campus-400 text-white font-semibold py-3 px-4 rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Dispatching Reset Code...
              </>
            ) : (
              <>
                Send Reset Code
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Remember your password? </span>
          <Link
            href="/login"
            className="font-semibold text-campus-600 hover:text-campus-700 transition"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

