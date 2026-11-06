import MetadataLayout from '@/components/MetadataLayout';
import { createPageMetadata } from '@/lib/pageMetadata';

export const metadata = createPageMetadata(
  'Admin Profile',
  'Manage your administrator profile, personal information, avatar, and password credentials.',
  '/admin/profile'
);

export default MetadataLayout;

