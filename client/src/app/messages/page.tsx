'use client';

import { useSearchParams } from 'next/navigation';
import MessagesInbox from '@/components/MessagesInbox';

export default function MessagesPage() {
  const searchParams = useSearchParams();
  return <MessagesInbox selectedId={searchParams.get('c')} />;
}
