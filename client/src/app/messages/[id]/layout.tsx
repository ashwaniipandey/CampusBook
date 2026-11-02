import MetadataLayout from '@/components/MetadataLayout';
import { createPageMetadata } from '@/lib/pageMetadata';

export function generateMetadata({ params }: { params: { id: string } }) {
  return createPageMetadata(
    'Conversation',
    'Continue a private conversation about a CampusBook listing.',
    `/messages/${encodeURIComponent(params.id)}`
  );
}

export default MetadataLayout;
