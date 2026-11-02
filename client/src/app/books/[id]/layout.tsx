import MetadataLayout from '@/components/MetadataLayout';
import { createPageMetadata } from '@/lib/pageMetadata';

export function generateMetadata({ params }: { params: { id: string } }) {
  return createPageMetadata(
    'Book Listing',
    'View book details, pricing, seller information, and related student listings.',
    `/books/${encodeURIComponent(params.id)}`
  );
}

export default MetadataLayout;
