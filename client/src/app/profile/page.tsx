'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  BadgeCheck,
  Camera,
  CheckCircle2,
  LoaderCircle,
  UserRound,
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { University } from '@/types';

type FormNotice = { type: 'success' | 'error'; message: string };

function universityId(value: University | string) {
  return typeof value === 'string' ? value : value._id;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateProfile, uploadAvatar } = useAuth();
  const [universities, setUniversities] = useState<University[]>([]);
  const [universitiesLoading, setUniversitiesLoading] = useState(true);
  const [universitiesError, setUniversitiesError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [course, setCourse] = useState('');
  const [semester, setSemester] = useState('');
  const [bio, setBio] = useState('');
  const [notice, setNotice] = useState<FormNotice | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setPhone(user.phone || '');
    setSelectedUniversity(user.university ? universityId(user.university) : '');
    setCourse(user.course || user.department || '');
    setSemester(user.semester || '');
    setBio(user.bio || '');
  }, [user]);

  const loadUniversities = async () => {
    setUniversitiesLoading(true);
    setUniversitiesError(null);
    try {
      const response = await api.getUniversities();
      setUniversities(response.universities || []);
    } catch (error) {
      setUniversitiesError(error instanceof Error ? error.message : 'Unable to load universities.');
    } finally {
      setUniversitiesLoading(false);
    }
  };

  useEffect(() => {
    void loadUniversities();
  }, []);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const displayedAvatar = useMemo(() => previewUrl || user?.avatar || '', [previewUrl, user?.avatar]);

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setNotice({ type: 'error', message: 'Choose a JPG, PNG, or WebP image.' });
      event.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setNotice({ type: 'error', message: 'Avatar images must be 5 MB or smaller.' });
      event.target.value = '';
      return;
    }
    setNotice(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleAvatarUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setNotice(null);
    const result = await uploadAvatar(selectedFile);
    setUploading(false);
    if (result.success) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setNotice({ type: 'success', message: 'Profile photo updated.' });
    } else {
      setNotice({ type: 'error', message: result.error || 'Unable to upload your avatar.' });
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    const result = await updateProfile({
      name: name.trim(),
      phone: phone.trim(),
      university: selectedUniversity,
      course: course.trim(),
      semester: semester.trim(),
      bio: bio.trim(),
    });
    setSaving(false);
    if (result.success) {
      setNotice({ type: 'success', message: 'Profile updated successfully.' });
    } else {
      setNotice({ type: 'error', message: result.error || 'Unable to update your profile.' });
    }
  };

  return (
    <ProtectedRoute>
      <main className="mx-auto min-h-[70vh] max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-bold uppercase tracking-wider text-campus-700">Account</p>
          <h1 className="mt-1 text-3xl font-extrabold text-slate-900">Your profile</h1>
          <p className="mt-2 text-sm text-slate-500">Keep your campus and contact details up to date.</p>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-7 flex flex-wrap items-center gap-4">
            <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-campus-50 text-campus-700">
              {displayedAvatar ? (
                <img src={displayedAvatar} alt={`${user?.name || 'Your'} avatar preview`} className="h-full w-full object-cover" />
              ) : (
                <UserRound className="h-9 w-9" />
              )}
              {(user?.isVerified || user?.verificationStatus === 'verified') && (
                <span title="Verified student" className="absolute -right-0.5 -top-0.5 rounded-full bg-white p-0.5">
                  <BadgeCheck className="h-5 w-5 fill-campus-100 text-campus-700" />
                </span>
              )}
            </div>
            <div className="min-w-[12rem] flex-1">
              <p className="font-bold text-slate-900">{user?.name}</p>
              <p className="mt-0.5 text-sm text-slate-500">{user?.email}</p>
              {(user?.isVerified || user?.verificationStatus === 'verified') && <p className="mt-1 text-xs font-semibold text-campus-700">Verified student</p>}
              <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                <Camera className="h-4 w-4" />
                Choose avatar
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} className="sr-only" />
              </label>
            </div>
            {selectedFile && (
              <button
                type="button"
                onClick={() => void handleAvatarUpload()}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-xl bg-campus-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-campus-800 disabled:opacity-60"
              >
                {uploading && <LoaderCircle className="h-4 w-4 animate-spin" />}
                Upload photo
              </button>
            )}
          </div>

          {notice && (
            <div className={`mb-5 flex items-start gap-2 rounded-xl border p-3 text-sm ${
              notice.type === 'success'
                ? 'border-campus-200 bg-campus-50 text-campus-800'
                : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}>
              {notice.type === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
              <span>{notice.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm font-semibold text-slate-700">
                Name
                <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={100} className="w-full rounded-xl border border-slate-300 px-3.5 py-3 font-normal text-slate-900 outline-none focus:border-campus-500 focus:ring-2 focus:ring-campus-100" />
              </label>
              <label className="space-y-1.5 text-sm font-semibold text-slate-700">
                Phone
                <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={30} className="w-full rounded-xl border border-slate-300 px-3.5 py-3 font-normal text-slate-900 outline-none focus:border-campus-500 focus:ring-2 focus:ring-campus-100" />
              </label>
              <label className="space-y-1.5 text-sm font-semibold text-slate-700 sm:col-span-2">
                University
                {universitiesError ? (
                  <span className="block rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-normal text-rose-700">
                    {universitiesError}
                    <button type="button" onClick={() => void loadUniversities()} className="ml-2 font-bold underline">Retry</button>
                  </span>
                ) : (
                  <select
                    value={selectedUniversity}
                    onChange={(event) => setSelectedUniversity(event.target.value)}
                    disabled={universitiesLoading}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 font-normal text-slate-900 outline-none focus:border-campus-500 focus:ring-2 focus:ring-campus-100 disabled:bg-slate-100"
                  >
                    <option value="">{universitiesLoading ? 'Loading universities…' : 'Select your university'}</option>
                    {universities.map((university) => <option key={university._id} value={university._id}>{university.name}</option>)}
                  </select>
                )}
              </label>
              <label className="space-y-1.5 text-sm font-semibold text-slate-700">
                Course
                <input value={course} onChange={(event) => setCourse(event.target.value)} maxLength={100} className="w-full rounded-xl border border-slate-300 px-3.5 py-3 font-normal text-slate-900 outline-none focus:border-campus-500 focus:ring-2 focus:ring-campus-100" />
              </label>
              <label className="space-y-1.5 text-sm font-semibold text-slate-700">
                Semester
                <input value={semester} onChange={(event) => setSemester(event.target.value)} maxLength={50} className="w-full rounded-xl border border-slate-300 px-3.5 py-3 font-normal text-slate-900 outline-none focus:border-campus-500 focus:ring-2 focus:ring-campus-100" />
              </label>
              <label className="space-y-1.5 text-sm font-semibold text-slate-700 sm:col-span-2">
                Bio
                <textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={4} maxLength={500} className="w-full resize-y rounded-xl border border-slate-300 px-3.5 py-3 font-normal text-slate-900 outline-none focus:border-campus-500 focus:ring-2 focus:ring-campus-100" />
              </label>
            </div>
            <div className="flex flex-wrap gap-3 pt-1">
              <button type="submit" disabled={saving || universitiesLoading} className="inline-flex items-center gap-2 rounded-xl bg-campus-700 px-5 py-3 text-sm font-bold text-white hover:bg-campus-800 disabled:cursor-not-allowed disabled:opacity-60">
                {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
                Save profile
              </button>
              <button type="button" onClick={() => router.push('/dashboard')} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
                Back to dashboard
              </button>
            </div>
          </form>
        </section>
      </main>
    </ProtectedRoute>
  );
}
