'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'admin';
  requireVerified?: boolean;
}

export default function ProtectedRoute({
  children,
  requiredRole,
  requireVerified = false,
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (requiredRole && user?.role !== requiredRole) {
        if (requiredRole === 'admin') {
          router.push('/dashboard');
        } else if (user?.role === 'admin') {
          // Admin is allowed to view student routes (marketplace, dashboard, etc.)
        } else {
          router.push('/dashboard');
        }
      } else if (requireVerified && user?.role !== 'admin' && !user?.isVerified) {
        router.replace(`/verify?required=1&returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      }
    }
  }, [loading, isAuthenticated, user, requiredRole, requireVerified, router]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-campus-600" />
        <p className="text-sm text-slate-500 font-medium">Verifying campus credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return null;
  }

  if (requireVerified && user?.role !== 'admin' && !user?.isVerified) {
    return null;
  }

  return <>{children}</>;
}
