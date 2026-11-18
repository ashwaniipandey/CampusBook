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
import Card from '@/components/Card';

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
    const errorParam = searchParams.get('error');
    if (errorParam === 'EMAIL_SEND_FAILED' || searchParams.get('sendFailed') === 'true') {
      setServerError('We could not send the verification email. Please try again in a minute.');
      setCooldown(0);
    }
  }, [searchParams]);

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
    setSuccessMessage(null);
    setIsResending(true);

    const result = await resendOtp(emailToVerify);
    setIsResending(false);

    if (result.success) {
      setSuccessMessage('A fresh verification code has been sent to your email.');
      setCooldown(60);
    } else {
      setServerError(result.error || 'We could not send the verification email. Please try again in a minute.');
      setCooldown(0);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full space-y-8 p-8 sm:p-10 rounded-3xl shadow-xl">
        {!isVerifiedSuccess ? (
          <>
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex p-3.5 rounded-2xl bg-accent/20 text-accent mb-1 shadow-xs">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-heading tracking-tight">
                Verify Your Email
              </h2>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                Enter the 6-digit code sent to:{' '}
                <span className="font-semibold text-heading block mt-1">
                  {emailToVerify || 'your registered email'}
                </span>
              </p>
            </div>

            {/* Error or Success Alert */}
            {serverError && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-card border border-rose-400/30 text-rose-300 text-xs sm:text-sm animate-in fade-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}
            {successMessage && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-card border border-card-border text-heading text-xs sm:text-sm animate-in fade-in">
                <Sparkles className="w-5 h-5 flex-shrink-0 text-accent mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* OTP Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2 text-center">
                <label className="text-xs font-semibold text-heading block">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  {...register('otp')}
                  placeholder="123456"
                  className={`w-full text-center tracking-[0.5em] font-mono text-2xl py-3 px-4 rounded-xl border font-bold text-heading bg-card/60 placeholder:text-muted focus:outline-none focus:ring-2 ${
                    errors.otp
                      ? 'border-rose-400 focus:ring-rose-500'
                      : 'border-card-border focus:border-accent focus:ring-accent/30'
                  }`}
                  autoFocus
                />
                {errors.otp && (
                  <p className="text-xs text-rose-400 mt-1 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.otp.message}
                  </p>
                )}
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-btn-primary hover:opacity-90 disabled:opacity-50 text-btn-primary-text font-semibold py-3 px-4 rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
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
                className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-heading disabled:opacity-50 font-medium transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend verification code'}
              </button>
            </div>

            {/* Delivery Note */}
            <p className="text-center text-xs text-muted pt-1 leading-relaxed">
              Didn’t get the code? Check your Spam or Junk folder. College emails can take up to 2-3 minutes.
            </p>
          </>
        ) : (
          /* Verified Success Celebration */
          <div className="text-center space-y-6 py-4 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-accent/20 text-accent rounded-3xl flex items-center justify-center mx-auto shadow-md">
              <ShieldCheck className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent text-btn-primary-text text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                Email Verified!
              </span>
              <h2 className="text-2xl font-bold text-heading">
                Welcome to CampusBook
              </h2>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                Your email is confirmed. Now complete your profile details to start exploring campus textbooks.
              </p>
            </div>

            <button
              onClick={() => redirectByRole()}
              className="w-full bg-btn-primary hover:opacity-90 text-btn-primary-text font-semibold py-3 px-4 rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
            >
              Complete Profile
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
