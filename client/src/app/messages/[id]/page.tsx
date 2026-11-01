'use client';

import { useParams } from 'next/navigation';
import MessagesInbox from '@/components/MessagesInbox';

export default function ConversationPage() {
  const params = useParams<{ id: string }>();
  return <MessagesInbox selectedId={params.id} />;
}
