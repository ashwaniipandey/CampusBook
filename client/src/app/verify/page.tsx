'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BadgeCheck, CheckCircle2, FileImage, LoaderCircle, MailCheck, RefreshCw, ShieldCheck } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { isVerifiedStudent } from '@/lib/verification';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';

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
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-card-border bg-card text-accent">
              <ShieldCheck className="h-7 w-7" aria-hidden="true" />
            </span>
            <p className="mt-4 text-sm font-bold uppercase tracking-wider text-accent">CampusBook verification</p>
            <h1 className="mt-2 text-3xl font-extrabold text-heading">Verify your student status</h1>
            <p className="mt-2 text-text">
              Verification helps keep campus exchanges and meetups trusted and student-only.
            </p>
          </div>

          <Card className="mb-6 flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Current status</p>
              <p className="mt-1 flex items-center gap-2 font-bold capitalize text-heading">
                {status === 'verified' ? <BadgeCheck className="h-5 w-5 text-accent" /> : <ShieldCheck className="h-5 w-5 text-amber-500" />}
                {status}
              </p>
              {status === 'rejected' && user?.verificationNote && (
                <p className="mt-1 text-sm text-rose-400">{user.verificationNote}</p>
              )}
            </div>
            {(status === 'pending' || status === 'rejected') && (
              <Button type="button" variant="ghost" onClick={() => void refreshStatus()} disabled={busy} className="inline-flex items-center gap-2 text-sm">
                {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh status
              </Button>
            )}
          </Card>

          {notice && (
            <div role="status" className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
              notice.type === 'success'
                ? 'border-accent/40 bg-card text-accent'
                : 'border-rose-500/40 bg-rose-950/40 text-rose-300'
            }`}>
              {notice.message}
            </div>
          )}

          {isVerifiedStudent(user) ? (
            <Card className="p-6 text-center border-accent/40 bg-card">
              <CheckCircle2 className="mx-auto h-10 w-10 text-accent" />
              <h2 className="mt-3 text-xl font-bold text-heading">Verified Student</h2>
              <p className="mt-2 text-sm text-text">Your account can use all CampusBook features.</p>
              <Button type="button" variant="primary" onClick={finishVerification} className="mt-5">Continue</Button>
            </Card>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {/* Option 1: College Email OTP */}
              <Card className="p-5 sm:p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl border border-card-border bg-card p-2.5 text-accent"><MailCheck className="h-5 w-5" /></span>
                    <div>
                      <h2 className="font-bold text-heading">College Email Verification</h2>
                      <p className="text-xs text-muted">Instant verification via one-time code</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted leading-relaxed">
                    Enter your official university email ending in your college domain. Personal emails (Gmail, Yahoo, Outlook) are rejected.
                  </p>
                  <form onSubmit={sendOtp} className="mt-4 space-y-3">
                    <label htmlFor="college-email" className="block text-xs font-semibold text-text">Official College Email</label>
                    <input id="college-email" type="email" required maxLength={254} value={collegeEmail} onChange={(event) => setCollegeEmail(event.target.value)} placeholder="e.g. rollno@college.ac.in" className="w-full rounded-xl border border-card-border bg-card/60 px-3 py-2.5 text-sm text-heading placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30" />
                    <Button type="submit" variant="primary" disabled={busy || !collegeEmail.trim()} className="w-full">
                      {busy ? 'Sending code…' : otpSent ? 'Resend code' : 'Send college verification code'}
                    </Button>
                  </form>
                  {otpSent && (
                    <form onSubmit={verifyOtp} className="mt-4 space-y-3 border-t border-card-border pt-4">
                      <label htmlFor="college-otp" className="block text-xs font-semibold text-text">6-digit verification code</label>
                      <input id="college-otp" type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" className="w-full rounded-xl border border-card-border bg-card/60 px-3 py-2.5 text-sm tracking-[0.3em] text-center font-mono text-heading focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30" />
                      <Button type="submit" variant="secondary" disabled={busy || otp.length !== 6} className="w-full">Verify college code</Button>
                      <p className="mt-2 text-center text-xs text-muted leading-relaxed">
                        Didn’t get the code? Check your Spam or Junk folder. College emails can take up to 2-3 minutes.
                      </p>
                    </form>
                  )}
                </div>
              </Card>

              {/* Option 2: College ID Card Upload */}
              <Card className="p-5 sm:p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl border border-card-border bg-card p-2.5 text-accent"><FileImage className="h-5 w-5" /></span>
                    <div>
                      <h2 className="font-bold text-heading">College ID Card Upload</h2>
                      <p className="text-xs text-muted">Manual admin review (current or passout)</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted leading-relaxed">
                    Upload a clear photo of your student ID card or alumni pass. Perfect if your university does not provide institutional email or you are a passout student.
                  </p>
                  <form onSubmit={uploadIdCard} className="mt-4 space-y-4">
                    <label htmlFor="id-card-image" className="block text-xs font-semibold text-text">Photo of your student ID</label>
                    <input id="id-card-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setSelectedImage(event.target.files?.[0] || null)} className="block w-full text-xs text-text file:mr-3 file:rounded-lg file:border-0 file:bg-btn-secondary file:px-3 file:py-2 file:font-semibold file:text-btn-secondary-text" />
                    <p className="text-[11px] leading-relaxed text-muted">Upload one clear JPG, PNG, or WebP image up to 5 MB. Reviewed securely by campus admins.</p>
                    <Button type="submit" variant="ghost" disabled={busy || !selectedImage} className="w-full">
                      {busy ? 'Submitting…' : 'Submit ID card for review'}
                    </Button>
                  </form>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
