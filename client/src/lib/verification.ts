import { User } from '@/types';

export function isVerifiedStudent(user: User | null | undefined) {
  return Boolean(user && (user.role === 'admin' || user.verificationStatus === 'verified' || user.isVerified));
}

export function getVerificationHref(returnTo?: string) {
  const suffix = returnTo
    ? `&returnTo=${encodeURIComponent(returnTo)}`
    : '';
  return `/verify?required=1${suffix}`;
}
