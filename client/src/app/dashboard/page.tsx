'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import { Book, BookImage, StudentDashboard } from '@/types';
import { getBookPrice } from '@/lib/pricing';
import {
  User,
  GraduationCap,
  BadgeCheck,
  ShieldAlert,
  BookOpen,
  Lock,
  ArrowRight,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Phone,
  BookMarked,
  Sparkles,
  Calendar,
  ShoppingBag,
  Repeat2,
  HeartHandshake,
  MessageCircle,
  ClipboardList,
  Compass,
  PlusCircle,
  RefreshCw,
} from 'lucide-react';

function getCover(book: Book) {
  const image = book.images?.[0];
  return image ? (typeof image === 'string' ? image : (image as BookImage).url) : '';
}

export default function StudentDashboardPage() {
  const { user, updateProfile, changePassword } = useAuth();
  const [dashboard, setDashboard] = useState<StudentDashboard | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'edit-profile' | 'security'>('overview');

  // Edit Profile State
  const [name, setName] = useState(user?.name || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [yearOfStudy, setYearOfStudy] = useState(user?.yearOfStudy?.toString() || '1');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isChangingPass, setIsChangingPass] = useState(false);

  const universityName =
    typeof user?.university === 'object' && user.university
      ? user.university.name
      : 'Campus Member';

  const loadDashboard = async () => {
    setDashboardLoading(true);
    setDashboardError(null);
    try {
      const response = await api.getStudentDashboard();
      setDashboard(response);
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Unable to load your dashboard.');
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    setIsSavingProfile(true);

    const res = await updateProfile({
      name: name.trim(),
      department: department.trim(),
      yearOfStudy: Number(yearOfStudy),
      phone: phone.trim(),
      bio: bio.trim(),
    });

    setIsSavingProfile(false);
    if (res.success) {
      setProfileMessage({ type: 'success', text: 'Profile details updated successfully!' });
    } else {
      setProfileMessage({ type: 'error', text: res.error || 'Failed to update profile' });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters long' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    setIsChangingPass(true);
    const res = await changePassword({ currentPassword, newPassword });
    setIsChangingPass(false);

    if (res.success) {
      setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordMessage({ type: 'error', text: res.error || 'Failed to change password' });
    }
  };

  return (
    <ProtectedRoute requiredRole="student">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Student Welcome Banner */}
        <div className="bg-gradient-to-r from-campus-800 via-campus-700 to-emerald-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur border border-white/20 text-white flex items-center justify-center font-extrabold text-2xl shadow-inner">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.name}
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                user?.name?.[0]?.toUpperCase() || 'S'
              )}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Welcome back, {user?.name}
                </h1>
                {user?.isVerified ? (
                  <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/40 text-xs font-semibold backdrop-blur">
                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-300" />
                    Verified Student
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/40 text-xs font-semibold backdrop-blur">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
                    Unverified
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-emerald-100 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-200" />
                {universityName} • {user?.department || 'Student'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/explore"
              className="px-4 py-2.5 rounded-xl bg-white text-campus-800 hover:bg-emerald-50 font-semibold text-xs sm:text-sm shadow-sm transition"
            >
              Explore books
            </Link>
            <Link
              href="/profile"
              className="px-4 py-2.5 rounded-xl border border-white/40 bg-white/10 hover:bg-white/20 font-semibold text-xs sm:text-sm transition"
            >
              Edit profile
            </Link>
          </div>
        </div>

        {/* Verification Alert Callout (If Unverified) */}
        {!user?.isVerified && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-amber-900 text-sm">
                  Your student email is not yet verified
                </h3>
                <p className="text-xs text-amber-700 mt-0.5">
                  Verify your university email address to earn the Verified Student badge and unlock full textbook trading privileges.
                </p>
              </div>
            </div>
            <Link
              href="/verify-otp"
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition flex-shrink-0 flex items-center gap-1.5"
            >
              Verify with OTP
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        <section aria-label="Dashboard overview" className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Your campus activity</h2>
              <p className="mt-1 text-sm text-slate-500">A snapshot of your CampusBook marketplace activity.</p>
            </div>
            <Link href="/settings" className="text-sm font-semibold text-campus-700 hover:text-campus-900">
              Account settings
            </Link>
          </div>

          {dashboardError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
              <p className="font-semibold">{dashboardError}</p>
              <button
                type="button"
                onClick={() => void loadDashboard()}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-campus-700 px-3 py-2 font-semibold text-white hover:bg-campus-800"
              >
                <RefreshCw className="h-4 w-4" /> Retry
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {[
                  { label: 'Books Listed', value: dashboard?.booksListed, icon: BookOpen },
                  { label: 'Books Sold', value: dashboard?.booksSold, icon: ShoppingBag },
                  { label: 'Books Purchased', value: dashboard?.booksPurchased, icon: ClipboardList },
                  { label: 'Active Exchanges', value: dashboard?.activeExchanges, icon: Repeat2 },
                  { label: 'Donations Made', value: dashboard?.donationsMade, icon: HeartHandshake },
                  { label: 'Total Money Saved', value: dashboard ? `$${dashboard.totalMoneySaved.toFixed(2)}` : undefined, icon: Sparkles },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-campus-50 text-campus-700">
                      <Icon className="h-4 w-4" />
                    </span>
                    {dashboardLoading ? (
                      <div className="mt-4 h-7 w-16 animate-pulse rounded bg-slate-200" />
                    ) : (
                      <p className="mt-3 text-2xl font-extrabold text-slate-900">{value ?? 0}</p>
                    )}
                    <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
                <div className="space-y-4">
                  <Link href="/exchanges" className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-5 transition hover:bg-amber-100">
                    <span className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-amber-700"><Repeat2 className="h-5 w-5" /></span>
                      <span><span className="block font-bold text-slate-900">Pending requests</span><span className="text-xs text-slate-600">Exchange and donation requests</span></span>
                    </span>
                    <span className="text-2xl font-extrabold text-amber-800">{dashboardLoading ? '—' : dashboard?.pendingRequests ?? 0}</span>
                  </Link>
                  <Link href="/messages" className="flex items-center justify-between rounded-2xl border border-campus-200 bg-campus-50 p-5 transition hover:bg-campus-100">
                    <span className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-campus-700"><MessageCircle className="h-5 w-5" /></span>
                      <span><span className="block font-bold text-slate-900">Unread messages</span><span className="text-xs text-slate-600">Open your conversations</span></span>
                    </span>
                    <span className="text-2xl font-extrabold text-campus-800">{dashboardLoading ? '—' : dashboard?.unreadMessages ?? 0}</span>
                  </Link>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <h3 className="font-bold text-slate-900">Quick actions</h3>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Link href="/sell" className="flex items-center gap-2 rounded-xl bg-campus-700 px-3 py-3 text-sm font-bold text-white hover:bg-campus-800"><PlusCircle className="h-4 w-4" />Sell a Book</Link>
                      <Link href="/explore" className="flex items-center gap-2 rounded-xl bg-campus-50 px-3 py-3 text-sm font-bold text-campus-800 hover:bg-campus-100"><Compass className="h-4 w-4" />Explore</Link>
                      <Link href="/messages" className="flex items-center gap-2 rounded-xl bg-campus-50 px-3 py-3 text-sm font-bold text-campus-800 hover:bg-campus-100"><MessageCircle className="h-4 w-4" />Messages</Link>
                      <Link href="/orders" className="flex items-center gap-2 rounded-xl bg-campus-50 px-3 py-3 text-sm font-bold text-campus-800 hover:bg-campus-100"><ClipboardList className="h-4 w-4" />Orders</Link>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">Recent Activity</h3>
                    <Link href="/notifications" className="text-xs font-bold text-campus-700 hover:underline">Notifications</Link>
                  </div>
                  {dashboardLoading ? (
                    <div className="mt-4 space-y-3">
                      {[0, 1, 2, 3].map((item) => <div key={item} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}
                    </div>
                  ) : dashboard?.recentActivity.length ? (
                    <ul className="mt-3 divide-y divide-slate-100">
                      {dashboard.recentActivity.map((activity, index) => (
                        <li key={`${activity.type}-${activity.createdAt}-${index}`}>
                          <Link href={activity.link || '/dashboard'} className="flex items-center justify-between gap-3 py-3 hover:text-campus-700">
                            <span className="min-w-0 truncate text-sm font-medium text-slate-700">{activity.text}</span>
                            <time className="shrink-0 text-xs text-slate-400">{new Date(activity.createdAt).toLocaleDateString()}</time>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="py-12 text-center">
                      <Calendar className="mx-auto h-8 w-8 text-slate-300" />
                      <p className="mt-2 text-sm font-semibold text-slate-700">No recent activity yet</p>
                      <p className="mt-1 text-xs text-slate-500">Your orders and requests will appear here.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Recommended for You</h3>
                    <p className="text-sm text-slate-500">Books picked based on your campus and interests.</p>
                  </div>
                  <Link href="/explore" className="text-sm font-bold text-campus-700 hover:underline">Browse all</Link>
                </div>
                {dashboardLoading ? (
                  <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[0, 1, 2, 3].map((item) => <div key={item} className="h-48 animate-pulse rounded-xl bg-slate-100" />)}
                  </div>
                ) : dashboard?.recommended.length ? (
                  <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {dashboard.recommended.map((book) => (
                      <Link key={book._id} href={`/books/${book._id}`} className="overflow-hidden rounded-xl border border-slate-200 transition hover:border-campus-300 hover:shadow-md">
                        <div className="aspect-[4/3] bg-slate-100">
                          {getCover(book) ? <img src={getCover(book)} alt={book.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-300"><BookOpen className="h-10 w-10" /></div>}
                        </div>
                        <div className="p-3">
                          <p className="line-clamp-2 min-h-10 text-sm font-bold text-slate-900">{book.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{book.author}</p>
                          <p className="mt-2 text-sm font-extrabold text-campus-700">{book.listingType === 'donate' ? 'Free' : `$${getBookPrice(book).toFixed(2)}`}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <BookOpen className="mx-auto h-9 w-9 text-slate-300" />
                    <p className="mt-2 text-sm font-semibold text-slate-700">No recommendations yet</p>
                    <p className="mt-1 text-xs text-slate-500">Explore books to find something for your courses.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        {/* Dashboard Navigation Tabs */}
        <div className="hidden">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-campus-600 text-campus-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Profile Overview
          </button>
          <button
            onClick={() => setActiveTab('edit-profile')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'edit-profile'
                ? 'border-campus-600 text-campus-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Edit Profile
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'security'
                ? 'border-campus-600 text-campus-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Security & Password
          </button>
        </div>

        {/* TAB 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Account Details */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-campus-600" />
                  Academic Profile
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-slate-400 block text-xs">Full Name</span>
                    <span className="font-semibold text-slate-800">{user?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">University Email</span>
                    <span className="font-semibold text-slate-800">{user?.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">University</span>
                    <span className="font-semibold text-slate-800">{universityName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Major Course / Department</span>
                    <span className="font-semibold text-slate-800">{user?.department || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Year of Study</span>
                    <span className="font-semibold text-slate-800">Year {user?.yearOfStudy || 1}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Student ID</span>
                    <span className="font-semibold text-slate-800">{user?.studentId || 'N/A'}</span>
                  </div>
                </div>

                {user?.bio && (
                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-slate-400 block text-xs mb-1">Bio</span>
                    <p className="text-xs text-slate-600 leading-relaxed">{user.bio}</p>
                  </div>
                )}
              </div>

              {/* Verified Student Privileges Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Verified Student Privileges</span>
                </div>
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Post unlimited textbooks for sale, swap, or free donation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Verified blue badge visible to all campus buyers and sellers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Direct messaging and on-campus meetup scheduling</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Sidebar */}
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Campus Marketplace
                </h4>
                <div className="space-y-2">
                  <Link
                    href="/#browse"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition text-xs font-semibold text-slate-700"
                  >
                    <span>Browse All Textbooks</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </Link>
                  <Link
                    href="/#exchange"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition text-xs font-semibold text-slate-700"
                  >
                    <span>Book Exchange Hub</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </Link>
                  <Link
                    href="/#donations"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition text-xs font-semibold text-slate-700"
                  >
                    <span>Free Donations Track</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Edit Profile */}
        {activeTab === 'edit-profile' && (
          <div className="max-w-2xl bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Update Profile Information</h3>
              <p className="text-xs text-slate-500">Keep your department and contact details up to date.</p>
            </div>

            {profileMessage && (
              <div
                className={`p-3.5 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 ${
                  profileMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {profileMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5" />
                )}
                <span>{profileMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Department / Major</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Electrical Engineering"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-campus-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Year of Study</label>
                  <select
                    value={yearOfStudy}
                    onChange={(e) => setYearOfStudy(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-campus-500 bg-white"
                  >
                    <option value="1">1st Year (Freshman)</option>
                    <option value="2">2nd Year (Sophomore)</option>
                    <option value="3">3rd Year (Junior)</option>
                    <option value="4">4th Year (Senior)</option>
                    <option value="5">5th Year (Graduate / Master's)</option>
                    <option value="6">PhD / Doctorate</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Phone / Contact</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +1-650-555-0199"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Tell classmates about yourself and what books you are looking for..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="bg-campus-600 hover:bg-campus-700 disabled:bg-campus-400 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition shadow-sm flex items-center gap-2"
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Profile'
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: Security & Password */}
        {activeTab === 'security' && (
          <div className="max-w-2xl bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Change Password</h3>
              <p className="text-xs text-slate-500">Ensure your student account is using a strong password.</p>
            </div>

            {passwordMessage && (
              <div
                className={`p-3.5 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 ${
                  passwordMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {passwordMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5" />
                )}
                <span>{passwordMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Min 6 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPass}
                className="bg-campus-600 hover:bg-campus-700 disabled:bg-campus-400 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition shadow-sm flex items-center gap-2"
              >
                {isChangingPass ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  'Change Password'
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
