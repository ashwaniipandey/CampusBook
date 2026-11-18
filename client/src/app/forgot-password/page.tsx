'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '@/lib/api';
import { forgotPasswordSchema, ForgotPasswordFormValues } from '@/lib/validations/auth';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
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
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setServerError(null);

    try {
      await api.forgotPassword({ email: data.email.trim() });
      router.push(`/reset-password?email=${encodeURIComponent(data.email.trim())}`);
    } catch (err: any) {
      setServerError(err.message || 'Failed to dispatch password reset code');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full space-y-8 p-8 sm:p-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl border border-card-border bg-card/60 text-accent mb-2 shadow-xs">
            <KeyRound className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-heading tracking-tight">
            Forgot Password?
          </h2>
          <p className="text-xs sm:text-sm text-text">
            Enter your university email to receive a password reset code.
          </p>
        </div>

        {/* Dev Mode Banner */}
        <div className="border border-card-border bg-card/60 text-text p-3.5 rounded-2xl text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-mono text-accent font-semibold">
            <Terminal className="w-3.5 h-3.5" />
            <span>Dev Console Tip:</span>
          </div>
          <p className="text-muted text-[11px]">
            The 6-digit password reset code will be logged directly in your server terminal.
          </p>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs sm:text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Form with React Hook Form + Zod */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text block">
              Registered University Email
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

          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="w-full mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Dispatching Reset Code...
              </>
            ) : (
              <>
                <span>Send Reset Code</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>

        <div className="text-center text-xs text-muted pt-2 border-t border-card-border">
          <span>Remember your password? </span>
          <Link
            href="/login"
            className="font-semibold text-accent hover:underline transition"
          >
            Back to sign in
          </Link>
        </div>
      </Card>
    </div>
  );
}
