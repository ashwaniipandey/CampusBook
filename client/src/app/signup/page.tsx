'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
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
  CheckCircle2,
  BadgeCheck,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function SignupPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [universities, setUniversities] = useState<University[]>([]);
  const [loadingUnis, setLoadingUnis] = useState(true);

  // Form fields
  const [name, setName] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('1');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch universities
  useEffect(() => {
    async function loadUniversities() {
      try {
        const res = await api.getUniversities();
        if (res && res.universities) {
          setUniversities(res.universities);
          if (res.universities.length > 0) {
            setUniversityId(res.universities[0]._id);
          }
        }
      } catch (err: any) {
        console.error('Failed to load universities:', err);
      } finally {
        setLoadingUnis(false);
      }
    }
    loadUniversities();
  }, []);

  const selectedUni = universities.find((u) => u._id === universityId);
  const isUniEmail =
    selectedUni && email.toLowerCase().includes(selectedUni.domain.toLowerCase());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validations
    if (!name.trim()) {
      setError('Please provide your full name');
      return;
    }
    if (!universityId) {
      setError('Please select your university');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    const result = await register({
      name: name.trim(),
      email: email.trim(),
      password,
      universityId,
      department: department.trim(),
      yearOfStudy: Number(yearOfStudy),
      studentId: studentId.trim(),
    });
    setIsSubmitting(false);

    if (result.success) {
      // Redirect to OTP verification page
      router.push(`/verify-otp?email=${encodeURIComponent(email.trim())}`);
    } else {
      setError(result.error || 'Failed to create student account');
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
            Join your campus community to swap, buy, and donate textbooks safely.
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
        <form onSubmit={handleSubmit} className="space-y-4">
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-campus-500 text-sm text-slate-900"
                />
              </div>
            </div>

            {/* University Selector */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block">
                University Campus *
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select
                  value={universityId}
                  onChange={(e) => setUniversityId(e.target.value)}
                  disabled={loadingUnis}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-campus-500 text-sm text-slate-800 bg-white"
                >
                  {loadingUnis ? (
                    <option>Loading universities...</option>
                  ) : (
                    universities.map((uni) => (
                      <option key={uni._id} value={uni._id}>
                        {uni.name} ({uni.domain})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Student Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    selectedUni
                      ? `e.g. yourname@${selectedUni.domain}`
                      : 'e.g. student@university.edu'
                  }
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-campus-500 text-sm text-slate-900"
                />
              </div>
              {/* Domain Recognition Badge */}
              {isUniEmail ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 pt-1">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Valid {selectedUni?.domain} domain! Unlocks Verified Student badge upon OTP.
                  </span>
                </div>
              ) : selectedUni ? (
                <p className="text-[11px] text-slate-400 pt-0.5">
                  Tip: Use your institutional @{selectedUni.domain} address for automatic student verification.
                </p>
              ) : null}
            </div>

            {/* Department / Course */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Course / Department
              </label>
              <div className="relative">
                <BookMarked className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-campus-500 text-sm text-slate-900"
                />
              </div>
            </div>

            {/* Year of Study */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Year of Study
              </label>
              <select
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-campus-500 text-sm text-slate-800 bg-white"
              >
                <option value="1">1st Year (Freshman)</option>
                <option value="2">2nd Year (Sophomore)</option>
                <option value="3">3rd Year (Junior)</option>
                <option value="4">4th Year (Senior)</option>
                <option value="5">5th Year (Graduate / Master's)</option>
                <option value="6">PhD / Doctorate</option>
              </select>
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-campus-500 text-sm text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
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
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-campus-500 text-sm text-slate-900"
                />
              </div>
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
                Create Account & Send Verification Code
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

