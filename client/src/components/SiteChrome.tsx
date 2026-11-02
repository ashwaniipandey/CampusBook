'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { MotionPage } from '@/components/MotionEffects';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const verificationStatus = user?.verificationStatus || (user?.isVerified ? 'verified' : 'unverified');

  return (
    <>
      {!isAdminRoute && <Navbar />}
      {!isAdminRoute && user?.role !== 'admin' && ['pending', 'rejected'].includes(verificationStatus) && (
        <div className={`border-b px-4 py-2.5 text-center text-sm ${
          verificationStatus === 'pending'
            ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100'
            : 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100'
        }`}>
          <span className="inline-flex flex-wrap items-center justify-center gap-2">
            <ShieldAlert className="h-4 w-4" aria-hidden="true" />
            {verificationStatus === 'pending'
              ? user?.verificationMethod === 'college_email'
                ? 'Your college email verification is awaiting confirmation.'
                : 'Your student verification is awaiting review.'
              : `Your student verification was not approved${user?.verificationNote ? `: ${user.verificationNote}` : '.'}`}
            <Link href="/verify" className="font-bold underline underline-offset-2">View status</Link>
          </span>
        </div>
      )}
      <MotionPage pageKey={pathname}>{children}</MotionPage>
      {!isAdminRoute && <Footer />}
    </>
  );
}
