'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '@/lib/api';
import { resetPasswordSchema, ResetPasswordFormValues } from '@/lib/validations/auth';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
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
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full space-y-8 p-8 sm:p-10">
        {!success ? (
          <>
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl border border-card-border bg-card/60 text-accent mb-2 shadow-xs">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-heading tracking-tight">
                Reset Password
              </h2>
              <p className="text-xs sm:text-sm text-text">
                Enter your 6-digit reset code and pick a new secure password.
              </p>
            </div>

            <div className="border border-card-border bg-card/60 text-text p-3 rounded-2xl text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-mono text-accent font-semibold">
                <Terminal className="w-3.5 h-3.5" />
                <span>Console Reminder:</span>
              </div>
              <p className="text-muted text-[11px]">
                The reset code is in your server console under{' '}
                <code className="text-accent">Password Reset Request</code>.
              </p>
            </div>

            {serverError && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs sm:text-sm animate-in fade-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    {...register('email')}
                    placeholder="e.g. student@university.edu"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-heading placeholder:text-muted bg-card/60 focus:outline-none focus:ring-2 ${
                      errors.email
                        ? 'border-rose-400 focus:ring-rose-400/30'
                        : 'border-card-border focus:ring-accent/30'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* OTP */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text block">
                  6-Digit Reset Code (OTP)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    maxLength={6}
                    {...register('otp')}
                    placeholder="123456"
                    className={`w-full pl-10 pr-4 py-2.5 font-mono tracking-widest text-base rounded-xl border text-heading placeholder:text-muted bg-card/60 font-bold focus:outline-none focus:ring-2 ${
                      errors.otp
                        ? 'border-rose-400 focus:ring-rose-400/30'
                        : 'border-card-border focus:ring-accent/30'
                    }`}
                  />
                </div>
                {errors.otp && (
                  <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.otp.message}
                  </p>
                )}
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text block">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('newPassword')}
                    placeholder="Min 6 characters"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm text-heading placeholder:text-muted bg-card/60 focus:outline-none focus:ring-2 ${
                      errors.newPassword
                        ? 'border-rose-400 focus:ring-rose-400/30'
                        : 'border-card-border focus:ring-accent/30'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-muted hover:text-heading absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.newPassword.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text block">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    placeholder="Re-enter new password"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-heading placeholder:text-muted bg-card/60 focus:outline-none focus:ring-2 ${
                      errors.confirmPassword
                        ? 'border-rose-400 focus:ring-rose-400/30'
                        : 'border-card-border focus:ring-accent/30'
                    }`}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="w-full mt-4"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Resetting Password...
                  </>
                ) : (
                  <>
                    <span>Save New Password</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center space-y-6 py-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 border border-accent/40 bg-card text-accent rounded-3xl flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-heading">Password Reset Successful!</h2>
              <p className="text-xs sm:text-sm text-text">
                Your password has been securely updated. You can now log in.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-btn-primary px-4 py-3 text-sm font-semibold text-btn-primary-text transition"
            >
              Sign In to CampusBook
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
