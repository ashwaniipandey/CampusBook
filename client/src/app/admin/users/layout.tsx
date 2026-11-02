import MetadataLayout from '@/components/MetadataLayout';
import { createPageMetadata } from '@/lib/pageMetadata';

export const metadata = createPageMetadata('Manage Users', 'Review and manage CampusBook student accounts.', '/admin/users');
export default MetadataLayout;
