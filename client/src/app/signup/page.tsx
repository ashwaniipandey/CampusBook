'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { signupSchema, SignupFormValues } from '@/lib/validations/auth';
import { University } from '@/types';
import api from '@/lib/api';
import {
  BookOpen,
  Mail,
  Lock,
  User,
  GraduationCap,
  BookMarked,
  ArrowRight,
  AlertCircle,
  Loader2,
  BadgeCheck,
  Eye,
  EyeOff,
  Search,
  ChevronDown,
  Check,
  RotateCw,
  Sparkles,
} from 'lucide-react';

const popularCourses = [
  'Computer Science',
  'Economics & Finance',
  'Biology & Pre-Med',
  'Mechanical Engineering',
  'Business Administration',
  'Mathematics & Statistics',
];

export default function SignupPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();

  const [universities, setUniversities] = useState<University[]>([]);
  const [loadingUnis, setLoadingUnis] = useState(true);
  const [uniError, setUniError] = useState<string | null>(null);

  // Searchable university dropdown state
  const [isUniDropdownOpen, setIsUniDropdownOpen] = useState(false);
  const [uniSearchQuery, setUniSearchQuery] = useState('');
  const uniDropdownRef = useRef<HTMLDivElement>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      universityId: '',
      email: '',
      department: '',
      yearOfStudy: '1',
      studentId: '',
      password: '',
      confirmPassword: '',
    },
  });

  const watchedUniId = watch('universityId');
  const watchedEmail = watch('email') || '';

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        uniDropdownRef.current &&
        !uniDropdownRef.current.contains(event.target as Node)
      ) {
        setIsUniDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch universities
  const loadUniversities = async () => {
    setLoadingUnis(true);
    setUniError(null);
    try {
      const res = await api.getUniversities();
      if (res && res.universities && res.universities.length > 0) {
        setUniversities(res.universities);
        // Default to first university if none selected
        if (!watchedUniId) {
          setValue('universityId', res.universities[0]._id, { shouldValidate: true });
        }
      } else {
        setUniError('No university campuses returned by server.');
      }
    } catch (err: any) {
      setUniError(err.message || 'Unable to connect to server to load universities.');
    } finally {
      setLoadingUnis(false);
    }
  };

  useEffect(() => {
    loadUniversities();
  }, []);

  const selectedUni = universities.find((u) => u._id === watchedUniId);

  // Filter universities based on search query
  const filteredUniversities = universities.filter((u) => {
    const q = uniSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.code.toLowerCase().includes(q) ||
      u.domain.toLowerCase().includes(q) ||
      (u.city && u.city.toLowerCase().includes(q))
    );
  });

  const isUniEmail =
    selectedUni &&
    watchedEmail.toLowerCase().endsWith(`@${selectedUni.domain.toLowerCase()}`);

  const onSubmit = async (data: SignupFormValues) => {
    setServerError(null);

    const result = await registerUser({
      name: data.name.trim(),
      email: data.email.trim(),
      password: data.password,
      universityId: data.universityId,
      department: data.department ? data.department.trim() : '',
      yearOfStudy: Number(data.yearOfStudy || 1),
      studentId: data.studentId ? data.studentId.trim() : '',
    });

    if (result.success) {
      router.push(`/verify-otp?email=${encodeURIComponent(data.email.trim())}`);
    } else {
      setServerError(result.error || 'Failed to create student account');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-xl w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-200/80">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-campus-50 text-campus-600 mb-2 shadow-xs">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Create Student Account
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Join your campus community to trade, swap, and donate textbooks safely.
          </p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  {...register('name')}
                  placeholder="e.g. Alex Johnson"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-slate-900 focus:outline-none focus:ring-2 ${
                    errors.name
                      ? 'border-rose-300 focus:ring-rose-500'
                      : 'border-slate-200 focus:ring-campus-500'
                  }`}
                />
              </div>
              {errors.name && (
                <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Searchable University Dropdown */}
            <div className="space-y-1 sm:col-span-2" ref={uniDropdownRef}>
              <label className="text-xs font-semibold text-slate-700 block">
                University Campus *
              </label>

              {/* Hidden field for React Hook Form registration */}
              <input type="hidden" {...register('universityId')} />

              {/* Error Loading Universities with Retry Button */}
              {uniError ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>{uniError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={loadUniversities}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg flex items-center gap-1 flex-shrink-0 transition"
                  >
                    <RotateCw className="w-3.5 h-3.5" /> Retry
                  </button>
                </div>
              ) : (
                /* Dropdown Trigger Box */
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsUniDropdownOpen(!isUniDropdownOpen)}
                    disabled={loadingUnis}
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm text-left flex items-center justify-between bg-white focus:outline-none focus:ring-2 ${
                      errors.universityId
                        ? 'border-rose-300 focus:ring-rose-500'
                        : 'border-slate-200 focus:ring-campus-500'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <span className="truncate text-slate-800 font-medium">
                      {loadingUnis ? (
                        <span className="text-slate-400 flex items-center gap-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading universities...
                        </span>
                      ) : selectedUni ? (
                        `${selectedUni.name} (@${selectedUni.domain})`
                      ) : (
                        <span className="text-slate-400">Select or search your campus...</span>
                      )}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  </button>

                  {/* Searchable Options Menu */}
                  {isUniDropdownOpen && !loadingUnis && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-2 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                      {/* Search Filter Input */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={uniSearchQuery}
                          onChange={(e) => setUniSearchQuery(e.target.value)}
                          placeholder="Type college name, code, or city..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-campus-500 text-slate-900 bg-slate-50"
                          autoFocus
                        />
                      </div>

                      {/* University Options List */}
                      <div className="max-h-52 overflow-y-auto space-y-1">
                        {filteredUniversities.length === 0 ? (
                          <div className="p-3 text-center text-xs text-slate-400">
                            No university matching &quot;{uniSearchQuery}&quot; found
                          </div>
                        ) : (
                          filteredUniversities.map((uni) => {
                            const isSelected = uni._id === watchedUniId;
                            return (
                              <button
                                key={uni._id}
                                type="button"
                                onClick={() => {
                                  setValue('universityId', uni._id, { shouldValidate: true });
                                  setIsUniDropdownOpen(false);
                                  setUniSearchQuery('');
                                }}
                                className={`w-full px-3 py-2 text-xs rounded-xl flex items-center justify-between text-left transition ${
                                  isSelected
                                    ? 'bg-campus-50 text-campus-800 font-bold'
                                    : 'hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <div>
                                  <div className="font-semibold text-slate-900">{uni.name}</div>
                                  <div className="text-[11px] text-slate-400">
                                    @{uni.domain} • {uni.city}, {uni.state || uni.country}
                                  </div>
                                </div>
                                {isSelected && (
                                  <Check className="w-4 h-4 text-campus-600 flex-shrink-0" />
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {errors.universityId && (
                <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.universityId.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block">
                University Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  {...register('email')}
                  placeholder={
                    selectedUni
                      ? `e.g. yourname@${selectedUni.domain}`
                      : 'e.g. student@university.edu'
                  }
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
              {isUniEmail ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 pt-1 font-medium">
                  <BadgeCheck className="w-4 h-4 text-emerald-600" />
                  <span>
                    Valid @{selectedUni?.domain} domain recognized! Unlocks Verified Student badge upon OTP.
                  </span>
                </div>
              ) : selectedUni ? (
                <p className="text-[11px] text-slate-500 pt-0.5">
                  Must end with <strong>@{selectedUni.domain}</strong> to register for this campus.
                </p>
              ) : null}
            </div>

            {/* Department / Course Field */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Course / Department / Major
              </label>
              <div className="relative">
                <BookMarked className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  {...register('department')}
                  placeholder="e.g. Computer Science, Economics, etc."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
              </div>
              {/* Quick Pick Course Suggestion Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Suggested:</span>
                {popularCourses.map((course) => (
                  <button
                    key={course}
                    type="button"
                    onClick={() => setValue('department', course, { shouldValidate: true })}
                    className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-campus-50 hover:text-campus-700 text-slate-600 transition"
                  >
                    {course}
                  </button>
                ))}
              </div>
            </div>

            {/* Year of Study */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Year of Study
              </label>
              <select
                {...register('yearOfStudy')}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-campus-500"
              >
                <option value="1">1st Year (Freshman)</option>
                <option value="2">2nd Year (Sophomore)</option>
                <option value="3">3rd Year (Junior)</option>
                <option value="4">4th Year (Senior)</option>
                <option value="5">5th Year (Graduate / Master&apos;s)</option>
                <option value="6">PhD / Doctorate</option>
              </select>
            </div>

            {/* Student ID (Optional) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Student ID <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                {...register('studentId')}
                placeholder="e.g. ST-2024-001"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="Min 6 characters"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm text-slate-900 focus:outline-none focus:ring-2 ${
                    errors.password
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
              {errors.password && (
                <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  placeholder="Re-enter password"
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
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-campus-600 hover:bg-campus-700 disabled:bg-campus-400 text-white font-semibold py-3 px-4 rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2 mt-4"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Student Account...
              </>
            ) : (
              <>
                Create Account & Dispatch OTP
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Already registered? </span>
          <Link
            href="/login"
            className="font-semibold text-campus-600 hover:text-campus-700 transition"
          >
            Sign in to your account
          </Link>
        </div>
      </div>
    </div>
  );
}
