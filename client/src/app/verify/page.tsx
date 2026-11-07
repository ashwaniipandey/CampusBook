'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BadgeCheck, CheckCircle2, FileImage, LoaderCircle, MailCheck, RefreshCw, ShieldCheck } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { isVerifiedStudent } from '@/lib/verification';

export default function VerifyPage() {
  const { user, sendCollegeVerificationOtp, verifyCollegeVerificationOtp, submitVerificationIdCard, refreshUser } = useAuth();
  const router = useRouter();
  const [collegeEmail, setCollegeEmail] = useState(user?.collegeEmail || '');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const status = user?.verificationStatus || (user?.isVerified ? 'verified' : 'unverified');

  const finishVerification = () => {
    const returnTo = new URLSearchParams(window.location.search).get('returnTo');
    if (returnTo?.startsWith('/') && !returnTo.startsWith('//')) {
      router.replace(returnTo);
    } else {
      setNotice({ type: 'success', message: 'Your student status is verified.' });
    }
  };

  const sendOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    const result = await sendCollegeVerificationOtp(collegeEmail.trim());
    setBusy(false);
    if (result.success) {
      setOtpSent(true);
      setNotice({ type: 'success', message: result.message || 'Verification code sent.' });
    } else {
      setNotice({ type: 'error', message: result.error || 'Unable to send a verification code.' });
    }
  };

  const verifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    const result = await verifyCollegeVerificationOtp(otp);
    setBusy(false);
    if (result.success) finishVerification();
    else setNotice({ type: 'error', message: result.error || 'The verification code could not be verified.' });
  };

  const uploadIdCard = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedImage) {
      setNotice({ type: 'error', message: 'Choose a photo of your college ID card first.' });
      return;
    }
    setBusy(true);
    setNotice(null);
    const result = await submitVerificationIdCard(selectedImage);
    setBusy(false);
    if (result.success) {
      setNotice({ type: 'success', message: 'Your ID card is submitted for review.' });
      setSelectedImage(null);
    } else {
      setNotice({ type: 'error', message: result.error || 'Unable to submit your ID card.' });
    }
  };

  const refreshStatus = async () => {
    setBusy(true);
    const refreshedUser = await refreshUser();
    setBusy(false);
    if (isVerifiedStudent(refreshedUser)) finishVerification();
    else setNotice({ type: 'success', message: 'Your verification status is up to date.' });
  };

  return (
    <ProtectedRoute>
      <main className="mx-auto min-h-[70vh] max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-7 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-campus-100 text-campus-700 dark:bg-campus-900/50 dark:text-campus-300">
              <ShieldCheck className="h-7 w-7" aria-hidden="true" />
            </span>
            <p className="mt-4 text-sm font-bold uppercase tracking-wider text-campus-700 dark:text-campus-300">CampusBook verification</p>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-slate-100">Verify your student status</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              Verification helps keep campus exchanges and meetups trusted and student-only.
            </p>
          </div>

          <section className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Current status</p>
              <p className="mt-1 flex items-center gap-2 font-bold capitalize text-slate-900 dark:text-slate-100">
                {status === 'verified' ? <BadgeCheck className="h-5 w-5 text-campus-600" /> : <ShieldCheck className="h-5 w-5 text-amber-600" />}
                {status}
              </p>
              {status === 'rejected' && user?.verificationNote && (
                <p className="mt-1 text-sm text-rose-700 dark:text-rose-300">{user.verificationNote}</p>
              )}
            </div>
            {(status === 'pending' || status === 'rejected') && (
              <button type="button" onClick={() => void refreshStatus()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
                {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh status
              </button>
            )}
          </section>

          {notice && (
            <div role="status" className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
              notice.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200'
                : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200'
            }`}>
              {notice.message}
            </div>
          )}

          {isVerifiedStudent(user) ? (
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-900 dark:bg-emerald-950/30">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
              <h2 className="mt-3 text-xl font-bold text-emerald-900 dark:text-emerald-100">Verified Student</h2>
              <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-200">Your account can use all CampusBook features.</p>
              <button type="button" onClick={finishVerification} className="mt-5 rounded-xl bg-campus-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-campus-700">Continue</button>
            </section>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {/* Option 1: College Email OTP */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"><MailCheck className="h-5 w-5" /></span>
                    <div>
                      <h2 className="font-bold text-slate-900 dark:text-slate-100">College Email Verification</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Instant verification via one-time code</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Enter your official university email ending in your college domain. Personal emails (Gmail, Yahoo, Outlook) are rejected.
                  </p>
                  <form onSubmit={sendOtp} className="mt-4 space-y-3">
                    <label htmlFor="college-email" className="block text-xs font-semibold text-slate-700 dark:text-slate-200">Official College Email</label>
                    <input id="college-email" type="email" required maxLength={254} value={collegeEmail} onChange={(event) => setCollegeEmail(event.target.value)} placeholder="e.g. rollno@college.ac.in" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400" />
                    <button type="submit" disabled={busy || !collegeEmail.trim()} className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition">
                      {busy ? 'Sending code…' : otpSent ? 'Resend code' : 'Send college verification code'}
                    </button>
                  </form>
                  {otpSent && (
                    <form onSubmit={verifyOtp} className="mt-4 space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                      <label htmlFor="college-otp" className="block text-xs font-semibold text-slate-700 dark:text-slate-200">6-digit verification code</label>
                      <input id="college-otp" type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm tracking-[0.3em] text-center font-mono text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                      <button type="submit" disabled={busy || otp.length !== 6} className="w-full rounded-xl border border-emerald-600 px-4 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-300 dark:hover:bg-emerald-900/30 transition">Verify college code</button>
                    </form>
                  )}
                </div>
              </section>

              {/* Option 2: College ID Card Upload */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"><FileImage className="h-5 w-5" /></span>
                    <div>
                      <h2 className="font-bold text-slate-900 dark:text-slate-100">College ID Card Upload</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Manual admin review (current or passout)</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Upload a clear photo of your student ID card or alumni pass. Perfect if your university does not provide institutional email or you are a passout student.
                  </p>
                  <form onSubmit={uploadIdCard} className="mt-4 space-y-4">
                    <label htmlFor="id-card-image" className="block text-xs font-semibold text-slate-700 dark:text-slate-200">Photo of your student ID</label>
                    <input id="id-card-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setSelectedImage(event.target.files?.[0] || null)} className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:font-semibold file:text-emerald-700 dark:text-slate-300 dark:file:bg-emerald-900/40 dark:file:text-emerald-200" />
                    <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">Upload one clear JPG, PNG, or WebP image up to 5 MB. Reviewed securely by campus admins.</p>
                    <button type="submit" disabled={busy || !selectedImage} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 transition">
                      {busy ? 'Submitting…' : 'Submit ID card for review'}
                    </button>
                  </form>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
