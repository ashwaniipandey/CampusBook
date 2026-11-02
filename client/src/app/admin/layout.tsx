import type { ReactNode } from 'react';
import AdminShell from './AdminShell';
import { createPageMetadata } from '@/lib/pageMetadata';

export const metadata = createPageMetadata('Admin Console', 'Manage CampusBook users, book listings, requests, categories, and reports.', '/admin');

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
