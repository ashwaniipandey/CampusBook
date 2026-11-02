import MetadataLayout from '@/components/MetadataLayout';
import { createPageMetadata } from '@/lib/pageMetadata';

export const metadata = createPageMetadata('Manage Book Listings', 'Review, approve, reject, and manage student book listings.', '/admin/books');
export default MetadataLayout;
