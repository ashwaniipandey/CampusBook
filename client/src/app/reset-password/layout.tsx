import MetadataLayout from '@/components/MetadataLayout';
import { createPageMetadata } from '@/lib/pageMetadata';

export const metadata = createPageMetadata('Choose a New Password', 'Set a new secure password for your CampusBook account.', '/reset-password');
export default MetadataLayout;
