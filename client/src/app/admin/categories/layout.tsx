import MetadataLayout from '@/components/MetadataLayout';
import { createPageMetadata } from '@/lib/pageMetadata';

export const metadata = createPageMetadata('Manage Categories', 'Manage the subject categories used to organize book listings.', '/admin/categories');
export default MetadataLayout;
