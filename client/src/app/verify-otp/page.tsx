'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { verifyOtpSchema, VerifyOtpFormValues } from '@/lib/validations/auth';
import {
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

function VerifyOtpContent() {
  const { user, verifyOtp, resendOtp, redirectByRole } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const queryEmail = searchParams.get('email') || '';
  const emailToVerify = queryEmail || user?.email || '';

  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [isVerifiedSuccess, setIsVerifiedSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyOtpFormValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: {
      otp: '',
    },
  });

  // Countdown timer for resend (60s cooldown)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const onSubmit = async (data: VerifyOtpFormValues) => {
    setServerError(null);
    setSuccessMessage(null);

    const result = await verifyOtp(data.otp.trim(), emailToVerify);

    if (result.success) {
      setIsVerifiedSuccess(true);
      // Auto-continue to complete-profile or explore after brief celebration
      setTimeout(() => {
        if (result.user?.isProfileComplete) {
          router.push('/explore');
        } else {
          router.push('/complete-profile');
        }
      }, 1500);
    } else {
      setServerError(result.error || 'Invalid or expired verification code.');
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setServerError(null);
    setIsResending(true);

    const result = await resendOtp(emailToVerify);
    setIsResending(false);

    if (result.success) {
      setSuccessMessage('A fresh verification code has been sent to your email.');
      setCooldown(60);
    } else {
      setServerError(result.error || 'Failed to resend code.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#ecfdf5] via-white to-slate-50 dark:from-[#02130b] dark:via-[#041f12] dark:to-[#010906]">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-white/5 dark:backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-200/80 dark:border-white/10">
        {!isVerifiedSuccess ? (
          <>
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 mb-1 shadow-xs">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Verify Your Email
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Enter the 6-digit code sent to:{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200 block mt-1">
                  {emailToVerify || 'your registered email'}
                </span>
              </p>
            </div>

            {/* Error or Success Alert */}
            {serverError && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm animate-in fade-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}
            {successMessage && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm animate-in fade-in">
                <Sparkles className="w-5 h-5 flex-shrink-0 text-emerald-500 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* OTP Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2 text-center">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  {...register('otp')}
                  placeholder="123456"
                  className={`w-full text-center tracking-[0.5em] font-mono text-2xl py-3 px-4 rounded-xl border font-bold text-slate-900 dark:text-white dark:bg-white/5 focus:outline-none focus:ring-2 ${
                    errors.otp
                      ? 'border-rose-300 focus:ring-rose-500'
                      : 'border-slate-300 dark:border-white/15 focus:ring-emerald-400 dark:focus:ring-emerald-400/50'
                  }`}
                  autoFocus
                />
                {errors.otp && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.otp.message}
                  </p>
                )}
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-3 px-4 rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Validating Code...
                  </>
                ) : (
                  <>
                    Verify &amp; Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Resend Action */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || isResending}
                className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:text-slate-400 font-medium transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend verification code'}
              </button>
            </div>
          </>
        ) : (
          /* Verified Success Celebration */
          <div className="text-center space-y-6 py-4 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-md">
              <ShieldCheck className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                Email Verified!
              </span>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Welcome to CampusBook
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Your email is confirmed. Now complete your profile details to start exploring campus textbooks.
              </p>
            </div>

            <button
              onClick={() => redirectByRole()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
            >
              Complete Profile
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
