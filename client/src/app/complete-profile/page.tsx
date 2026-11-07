'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { completeProfileSchema, CompleteProfileFormValues } from '@/lib/validations/auth';
import { University } from '@/types';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  UserCheck,
  MapPin,
  Phone,
  GraduationCap,
  BookOpen,
  ArrowRight,
  AlertCircle,
  Loader2,
  Building,
} from 'lucide-react';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Chandigarh', 'Puducherry'
];

export default function CompleteProfilePage() {
  const { user, completeProfile } = useAuth();
  const router = useRouter();

  const [universities, setUniversities] = useState<University[]>([]);
  const [loadingUnis, setLoadingUnis] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CompleteProfileFormValues>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      state: user?.state || '',
      phone: user?.phone || '',
      city: user?.city || '',
      universityId: typeof user?.university === 'object' ? user.university?._id : (user?.university || ''),
      department: user?.department || '',
      course: user?.course || '',
      yearOfStudy: user?.yearOfStudy ? String(user.yearOfStudy) : '',
    },
  });

  const selectedUniId = watch('universityId');

  useEffect(() => {
    let mounted = true;
    setLoadingUnis(true);
    api.getUniversities()
      .then((res) => {
        if (mounted && res?.universities) {
          setUniversities(res.universities);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoadingUnis(false);
      });
    return () => { mounted = false; };
  }, []);

  const handleUniversitySelect = (uniId: string) => {
    setValue('universityId', uniId);
    const chosen = universities.find((u) => u._id === uniId);
    if (chosen) {
      if (chosen.state) setValue('state', chosen.state);
      if (chosen.city) setValue('city', chosen.city);
    }
  };

  const onSubmit = async (data: CompleteProfileFormValues) => {
    setServerError(null);

    const result = await completeProfile({
      state: data.state.trim(),
      phone: data.phone.trim(),
      city: data.city?.trim() || '',
      universityId: data.universityId || undefined,
      department: data.department?.trim() || '',
      course: data.course?.trim() || '',
      yearOfStudy: data.yearOfStudy ? Number(data.yearOfStudy) : undefined,
    });

    if (result.success) {
      router.push('/explore');
    } else {
      setServerError(result.error || 'Failed to complete profile. Please try again.');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#ecfdf5] via-white to-slate-50 dark:from-[#02130b] dark:via-[#041f12] dark:to-[#010906]">
        <div className="max-w-xl w-full space-y-8 bg-white dark:bg-white/5 dark:backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-200/80 dark:border-white/10">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 mb-2 shadow-xs">
              <UserCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Complete Your Profile
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Just a few more details to help connect you with students near you.
            </p>
          </div>

          {/* Server Error Alert */}
          {serverError && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm animate-in fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* State (Required) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  State / Region *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    {...register('state')}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-slate-900 dark:text-white dark:bg-slate-900 focus:outline-none focus:ring-2 ${
                      errors.state
                        ? 'border-rose-300 focus:ring-rose-500'
                        : 'border-slate-200 dark:border-white/15 focus:ring-emerald-400 dark:focus:ring-emerald-400/50'
                    }`}
                  >
                    <option value="">Select your state...</option>
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.state && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.state.message}
                  </p>
                )}
              </div>

              {/* Phone (Required, 10-digit Indian Mobile) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    maxLength={10}
                    {...register('phone')}
                    placeholder="10-digit mobile (e.g. 9876543210)"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-slate-900 dark:text-white dark:bg-white/5 focus:outline-none focus:ring-2 ${
                      errors.phone
                        ? 'border-rose-300 focus:ring-rose-500'
                        : 'border-slate-200 dark:border-white/15 focus:ring-emerald-400 dark:focus:ring-emerald-400/50'
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>

            {/* City (Optional) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                City / Town (Optional)
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  {...register('city')}
                  placeholder="e.g. Pune, Mohali, Bengaluru"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>

            {/* University (Optional Picker) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                College / University Campus (Optional)
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select
                  value={selectedUniId}
                  onChange={(e) => handleUniversitySelect(e.target.value)}
                  disabled={loadingUnis}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <option value="">Choose your college/university if applicable...</option>
                  {universities.map((uni) => (
                    <option key={uni._id} value={uni._id}>
                      {uni.name} ({uni.city}{uni.state ? `, ${uni.state}` : ''})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Course / Branch */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Course / Branch (Optional)
                </label>
                <div className="relative">
                  <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    {...register('course')}
                    placeholder="e.g. B.Tech CSE, B.Com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>

              {/* Year of study */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Year of Study (Optional)
                </label>
                <select
                  {...register('yearOfStudy')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <option value="">Select year...</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                  <option value="5">5th Year</option>
                </select>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-3 px-4 rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2 mt-6"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Profile...
                </>
              ) : (
                <>
                  Complete &amp; Start Exploring
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}

