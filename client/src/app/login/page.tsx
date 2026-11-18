'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { loginSchema, LoginFormValues } from '@/lib/validations/auth';
import {
  BookOpen,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import Card from '@/components/Card';

export default function LoginPage() {
  const { login, googleLogin, redirectByRole } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null);
    const result = await login(data.email.trim(), data.password);
    if (result.success) {
      const redirect = new URLSearchParams(window.location.search).get('redirect');
      if (redirect?.startsWith('/') && !redirect.startsWith('//')) {
        router.replace(redirect);
      } else {
        redirectByRole(result.user);
      }
    } else {
      const errMsg = result.error || 'Invalid email or password';
      // If unverified email: redirect to OTP page
      if (errMsg.toLowerCase().includes('not verified') || errMsg.toLowerCase().includes('verification code')) {
        router.push(`/verify-otp?email=${encodeURIComponent(data.email.trim())}`);
        return;
      }
      setServerError(errMsg);
    }
  };

  const onGoogleCredential = async (credential: string) => {
    setServerError(null);
    const result = await googleLogin(credential);
    if (result.success) {
      const redirect = new URLSearchParams(window.location.search).get('redirect');
      if (redirect?.startsWith('/') && !redirect.startsWith('//')) {
        router.replace(redirect);
      } else {
        redirectByRole(result.user);
      }
    } else {
      setServerError(result.error || 'Google sign-in failed.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full space-y-8 p-8 sm:p-10 rounded-3xl shadow-xl">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-accent/20 text-accent mb-2 shadow-xs">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-heading tracking-tight">
            Welcome to CampusBook
          </h2>
          <p className="text-xs sm:text-sm text-muted">
            Sign in to trade, buy, or donate textbooks at your campus.
          </p>
        </div>

        <GoogleSignInButton
          onCredential={onGoogleCredential}
          onError={setServerError}
        />
        <div className="flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-card-border" />
          <span>or sign in with email</span>
          <span className="h-px flex-1 bg-card-border" />
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-card border border-rose-400/30 text-rose-300 text-xs sm:text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Form with React Hook Form + Zod */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-heading block">
              University / Account Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                {...register('email')}
                placeholder="e.g. yourname@university.edu"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-heading bg-card/60 placeholder:text-muted focus:outline-none focus:ring-2 ${
                  errors.email
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-card-border focus:border-accent focus:ring-accent/30'
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

          {/* Password */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-heading block">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-accent hover:underline transition"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="••••••••"
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm text-heading bg-card/60 placeholder:text-muted focus:outline-none focus:ring-2 ${
                  errors.password
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-card-border focus:border-accent focus:ring-accent/30'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-muted hover:text-heading absolute right-3 top-1/2 -translate-y-1/2"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-btn-primary hover:opacity-90 disabled:opacity-50 text-btn-primary-text font-semibold py-3 px-4 rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center text-xs text-muted pt-2 border-t border-card-border">
          <span>New to CampusBook? </span>
          <Link
            href="/signup"
            className="font-semibold text-accent hover:underline transition"
          >
            Create student account
          </Link>
        </div>
      </Card>
    </div>
  );
}
