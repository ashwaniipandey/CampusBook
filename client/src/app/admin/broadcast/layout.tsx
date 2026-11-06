import type { ReactNode } from 'react';
import { createPageMetadata } from '@/lib/pageMetadata';

export const metadata = createPageMetadata(
  'Broadcast Announcements | Admin',
  'Send real-time platform announcements to all registered students.',
  '/admin/broadcast'
);

export default function AdminBroadcastLayout({ children }: { children: ReactNode }) {
  return children;
}
