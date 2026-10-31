'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '@/lib/api';
import { resetPasswordSchema, ResetPasswordFormValues } from '@/lib/validations/auth';
import {
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  Terminal,
} from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultEmail = searchParams.get('email') || '';

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: defaultEmail,
      otp: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setServerError(null);

    try {
      await api.resetPassword({
        email: data.email.trim(),
        otp: data.otp.trim(),
        newPassword: data.newPassword,
      });
      setSuccess(true);
    } catch (err: any) {
      setServerError(err.message || 'Failed to reset password. Please check your reset code.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-200/80">
        {!success ? (
          <>
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-campus-50 text-campus-600 mb-2 shadow-xs">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Reset Password
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Enter your 6-digit reset code and pick a new secure password.
              </p>
            </div>

            <div className="bg-slate-900 text-slate-300 p-3 rounded-2xl text-xs space-y-1 border border-slate-800">
              <div className="flex items-center gap-1.5 font-mono text-campus-400 font-semibold">
                <Terminal className="w-3.5 h-3.5" />
                <span>Console Reminder:</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                The reset code is in your server console under{' '}
                <code className="text-amber-400">Password Reset Request</code>.
              </p>
            </div>

            {serverError && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm animate-in fade-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    {...register('email')}
                    placeholder="e.g. alex.johnson@stanford.edu"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-slate-900 focus:outline-none focus:ring-2 ${
                      errors.email
                        ? 'border-rose-300 focus:ring-rose-500'
                        : 'border-slate-200 focus:ring-campus-500'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* OTP */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  6-Digit Reset Code (OTP)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    maxLength={6}
                    {...register('otp')}
                    placeholder="123456"
                    className={`w-full pl-10 pr-4 py-2.5 font-mono tracking-widest text-base rounded-xl border text-slate-900 font-bold focus:outline-none focus:ring-2 ${
                      errors.otp
                        ? 'border-rose-300 focus:ring-rose-500'
                        : 'border-slate-200 focus:ring-campus-500'
                    }`}
                  />
                </div>
                {errors.otp && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.otp.message}
                  </p>
                )}
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('newPassword')}
                    placeholder="Min 6 characters"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm text-slate-900 focus:outline-none focus:ring-2 ${
                      errors.newPassword
                        ? 'border-rose-300 focus:ring-rose-500'
                        : 'border-slate-200 focus:ring-campus-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.newPassword.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    placeholder="Re-enter new password"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-slate-900 focus:outline-none focus:ring-2 ${
                      errors.confirmPassword
                        ? 'border-rose-300 focus:ring-rose-500'
                        : 'border-slate-200 focus:ring-campus-500'
                    }`}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-campus-600 hover:bg-campus-700 disabled:bg-campus-400 text-white font-semibold py-3 px-4 rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2 mt-4"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  <>
                    Save New Password
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center space-y-6 py-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Password Reset Successful!</h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Your password has been securely updated. You can now log in.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-2 bg-campus-600 hover:bg-campus-700 text-white font-semibold py-3 px-4 rounded-xl text-sm transition shadow-sm"
            >
              Sign In to CampusBook
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-campus-600" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
