'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Camera,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  Mail,
  Phone,
  Shield,
  User as UserIcon,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AdminToast, { AdminToastState } from '@/components/AdminToast';

export default function AdminProfilePage() {
  const { user, updateProfile, uploadAvatar, changePassword } = useAuth();

  // Profile fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [toast, setToast] = useState<AdminToastState>(null);

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setPhone(user.phone || '');
    setBio(user.bio || '');
  }, [user]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 4000);
  };

  const displayedAvatar = useMemo(
    () => previewUrl || user?.avatar || '',
    [previewUrl, user?.avatar]
  );

  const handleAvatarSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Please select a JPG, PNG, or WebP image.', 'error');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file size must be under 5 MB.', 'error');
      event.target.value = '';
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleAvatarUpload = async () => {
    if (!selectedFile) return;
    setUploadingAvatar(true);
    try {
      const result = await uploadAvatar(selectedFile);
      if (result.success) {
        setSelectedFile(null);
        setPreviewUrl(null);
        showToast('Avatar updated and saved to Cloudinary.', 'success');
      } else {
        showToast(result.error || 'Failed to upload avatar.', 'error');
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Upload failed.', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const result = await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
      });
      if (result.success) {
        showToast('Admin profile details updated successfully.', 'success');
      } else {
        showToast(result.error || 'Could not update profile.', 'error');
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Update failed.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('The new passwords do not match.', 'error');
      return;
    }

    setSavingPassword(true);
    try {
      const result = await changePassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });
      if (result.success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        showToast('Password changed successfully.', 'success');
      } else {
        showToast(result.error || 'Failed to update password.', 'error');
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Password update failed.', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <AdminToast toast={toast} />

      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
          Account &amp; Security
        </p>
        <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Admin Profile
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Update your administrator credentials, personal profile details, and photo.
        </p>
      </div>

      {/* Profile Overview Card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-100 text-2xl font-extrabold text-emerald-800 ring-2 ring-emerald-500/20 dark:bg-emerald-950 dark:text-emerald-300">
                {displayedAvatar ? (
                  <img src={displayedAvatar} alt={user?.name} className="h-full w-full object-cover" />
                ) : (
                  <span>{user?.name?.slice(0, 1).toUpperCase()}</span>
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute -bottom-2 -right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-emerald-600 text-white shadow-md hover:bg-emerald-700 transition"
                title="Choose new photo"
              >
                <Camera className="h-4 w-4" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarSelect}
                  className="sr-only"
                />
              </label>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{user?.name}</h3>
                <BadgeCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                  <Shield className="h-3.5 w-3.5" /> Full Administrator
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  Active Session
                </span>
              </div>
            </div>
          </div>

          {selectedFile && (
            <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                Photo selected. Save to apply:
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={uploadingAvatar}
                  onClick={handleAvatarUpload}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                >
                  {uploadingAvatar && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
                  <span>Upload to Cloudinary</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Personal Info Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <UserIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Personal Information</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Display name, phone contact, and administrator bio.
            </p>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="mt-6 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="admin-name" className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Full Name *
              </label>
              <input
                id="admin-name"
                type="text"
                required
                minLength={2}
                maxLength={60}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Admin Full Name"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="admin-phone" className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Phone Number
              </label>
              <input
                id="admin-phone"
                type="tel"
                maxLength={30}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="admin-email" className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Email Address
            </label>
            <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
              <Mail className="h-4 w-4 text-slate-400" />
              <span>{user?.email}</span>
              <span className="ml-auto text-xs font-semibold text-slate-400">(Managed account ID)</span>
            </div>
          </div>

          <div>
            <label htmlFor="admin-bio" className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Bio / Administrator Notes
            </label>
            <textarea
              id="admin-bio"
              rows={3}
              maxLength={500}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A brief note about your responsibilities or contact hours..."
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            <p className="mt-1 text-right text-[11px] text-slate-400">
              {bio.length} / 500 characters
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              {savingProfile && <LoaderCircle className="h-4 w-4 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </section>

      {/* Change Password Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Security &amp; Password</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Change your password. For Google-linked accounts, enter your current password or standard credentials to update.
            </p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="current-password"
              className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
            >
              Current Password *
            </label>
            <input
              id="current-password"
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="new-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
              >
                New Password *
              </label>
              <input
                id="new-password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
              >
                Confirm New Password *
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm matching password"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-700 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-purple-800 disabled:opacity-50 transition"
            >
              {savingPassword && <LoaderCircle className="h-4 w-4 animate-spin" />}
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

