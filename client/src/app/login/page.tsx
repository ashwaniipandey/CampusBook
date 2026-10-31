'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  Sparkles,
} from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
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
    if (!result.success) {
      setServerError(result.error || 'Invalid email or password');
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setValue('email', demoEmail, { shouldValidate: true });
    setValue('password', demoPass, { shouldValidate: true });
    setServerError(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-200/80">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-campus-50 text-campus-600 mb-2 shadow-xs">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome to CampusBook
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Sign in to trade, buy, or donate textbooks at your campus.
          </p>
        </div>

        {/* Quick Fill Demo Badges */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
          <div className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Quick Fill Test Accounts:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('admin@campusbook.edu', 'AdminPass123!')}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 hover:bg-purple-200 transition"
            >
              Demo Admin (admin@campusbook.edu)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('alex.johnson@stanford.edu', 'StudentPass123!')}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-campus-100 text-campus-800 hover:bg-campus-200 transition"
            >
              Demo Student (Stanford)
            </button>
          </div>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Form with React Hook Form + Zod */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              University / Account Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                {...register('email')}
                placeholder="e.g. yourname@stanford.edu"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 ${
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

          {/* Password */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 block">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-campus-600 hover:text-campus-700 transition"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="••••••••"
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 ${
                  errors.password
                    ? 'border-rose-300 focus:ring-rose-500'
                    : 'border-slate-200 focus:ring-campus-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-campus-600 hover:bg-campus-700 disabled:bg-campus-400 text-white font-semibold py-3 px-4 rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2 mt-2"
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
        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>New to CampusBook? </span>
          <Link
            href="/signup"
            className="font-semibold text-campus-600 hover:text-campus-700 transition"
          >
            Create student account
          </Link>
        </div>
      </div>
    </div>
  );
}
