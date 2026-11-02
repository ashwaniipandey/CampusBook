'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { MotionPage } from '@/components/MotionEffects';

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');

  return (
    <>
      {!isAdminRoute && <Navbar />}
      <MotionPage pageKey={pathname}>{children}</MotionPage>
      {!isAdminRoute && <Footer />}
    </>
  );
}
