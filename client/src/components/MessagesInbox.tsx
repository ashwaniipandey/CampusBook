'use client';

import {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  Check,
  CheckCheck,
  ImagePlus,
  LoaderCircle,
  MessageCircle,
  Search,
  Send,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import api from '@/lib/api';
import { ChatMessage, Conversation, User } from '@/types';

type Toast = { message: string; type: 'success' | 'error' };
type DisplayMessage = ChatMessage & {
  deliveryState?: 'sending' | 'failed';
  localPreview?: string;
  localFile?: File;
};

function getId(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && '_id' in value) {
    return String((value as { _id: unknown })._id);
  }
  return '';
}

function getUserName(user: User | string | undefined) {
  return typeof user === 'string' ? 'Campus student' : user?.name || 'Campus student';
}

function getImageUrl(image: string | { url: string } | undefined) {
  if (!image) return '';
  return typeof image === 'string' ? image : image.url;
}

function formatTime(date?: string) {
  if (!date) return '';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  const today = new Date();
  return parsed.toDateString() === today.toDateString()
    ? parsed.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : parsed.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatDay(date?: string) {
  if (!date) return 'Earlier';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Earlier';
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (parsed.toDateString() === today.toDateString()) return 'Today';
  if (parsed.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return parsed.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function MessagesInbox({ selectedId = null }: { selectedId?: string | null }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    socket,
    connectionStatus,
    onlineUserIds,
    setActiveConversationId,
    markConversationRead,
  } = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [olderLoading, setOlderLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(messages);
  const selectedRef = useRef(selectedId);
  const pageRef = useRef(1);
  const pendingScrollRef = useRef<{ height: number; top: number } | null>(null);
  const preservedScrollRef = useRef(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  selectedRef.current = selectedId;
  messagesRef.current = messages;

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  const loadConversations = useCallback(async (query: string, initial = false) => {
    if (!user) return;
    if (initial) setLoading(true);
    setErrorMessage(null);
    try {
      const response = await api.getConversations(query);
      setConversations(response.conversations || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load your conversations.';
      setErrorMessage(message);
      showToast(message, 'error');
    } finally {
      if (initial) setLoading(false);
    }
  }, [showToast, user]);

  useEffect(() => {
    if (!authLoading && !user) {
      const returnUrl = `${window.location.pathname}${window.location.search}`;
      router.replace(`/login?redirect=${encodeURIComponent(returnUrl)}`);
    } else if (user) {
      void loadConversations('', true);
    }
  }, [authLoading, user, router, loadConversations]);

  useEffect(() => {
    if (!user) return;
    const timeout = window.setTimeout(() => {
      void loadConversations(search);
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [search, user, loadConversations]);

  useEffect(() => {
    if (!socket || !user) return;
    const handleMessage = (message: ChatMessage) => {
      const conversationId = getId(message.conversation);
      if (!conversationId) return;
      const ownMessage = getId(message.sender) === user._id;

      setConversations((previous) => {
        const existing = previous.find((item) => item._id === conversationId);
        if (!existing) {
          void loadConversations(search);
          return previous;
        }
        const updated: Conversation = {
          ...existing,
          lastMessage: message.text || message.content || 'Image',
          lastMessageAt: message.createdAt || new Date().toISOString(),
          unreadCount:
            !ownMessage && selectedRef.current !== conversationId
              ? existing.unreadCount + 1
              : existing.unreadCount,
        };
        return [updated, ...previous.filter((item) => item._id !== conversationId)];
      });

      if (selectedRef.current === conversationId) {
        setMessages((previous) => {
          if (previous.some((item) => item._id === message._id)) return previous;
          const localMessage = ownMessage
            ? previous.find((item) => item.deliveryState === 'sending' && item.text === message.text)
            : undefined;
          return localMessage
            ? previous.map((item) => item._id === localMessage._id ? message : item)
            : [...previous, message];
        });
      }
    };

    const handleReadReceipt = (receipt: { conversationId: string; readerId: string; messageIds: string[]; readAt: string }) => {
      if (receipt.conversationId !== selectedRef.current || receipt.readerId === user._id) return;
      const readIds = new Set(receipt.messageIds.map(String));
      setMessages((previous) => previous.map((message) => (
        readIds.has(message._id) ? { ...message, isRead: true, readAt: receipt.readAt } : message
      )));
    };

    socket.on('receive_message', handleMessage);
    socket.on('messages_read', handleReadReceipt);
    return () => {
      socket.off('receive_message', handleMessage);
      socket.off('messages_read', handleReadReceipt);
    };
  }, [socket, user, loadConversations, search]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation._id === selectedId) || null,
    [conversations, selectedId]
  );
  const otherParticipant = selectedConversation?.otherParticipant;
  const otherUserId = otherParticipant?._id;
  const isOtherOnline = Boolean(otherUserId && onlineUserIds.has(otherUserId));
  const selectedBook = selectedConversation?.book || selectedConversation?.relatedBook;

  useEffect(() => {
    if (!selectedId) {
      setActiveConversationId(null);
      setMessages([]);
      return;
    }
    setActiveConversationId(selectedId);
  }, [selectedId, setActiveConversationId]);

  useEffect(() => {
    if (!socket || !selectedId || !otherUserId) return;
    const handlePresence = (presence: { userId: string; online: boolean; lastSeen?: string }) => {
      if (presence.userId !== otherUserId || !presence.lastSeen) return;
      setConversations((previous) => previous.map((conversation) => (
        conversation._id === selectedId
          ? {
              ...conversation,
              otherParticipant: {
                ...conversation.otherParticipant,
                lastSeen: presence.lastSeen,
              },
            }
          : conversation
      )));
    };
    socket.on('presence_update', handlePresence);
    return () => {
      socket.off('presence_update', handlePresence);
    };
  }, [socket, selectedId, otherUserId]);

  const loadMessages = useCallback(async () => {
    if (!selectedId || !user) return;
    setThreadLoading(true);
    setThreadError(null);
    try {
      const response = await api.getConversationMessages(selectedId, 1, 30);
      setMessages(response.messages || []);
      pageRef.current = 1;
      setHasOlderMessages(response.hasMore);
      try {
        await markConversationRead(selectedId);
        socket?.emit('mark_read', { conversationId: selectedId });
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Unable to mark messages as read.', 'error');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load this conversation.';
      setThreadError(message);
      showToast(message, 'error');
    } finally {
      setThreadLoading(false);
    }
  }, [selectedId, user, markConversationRead, socket, showToast]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      setHasOlderMessages(false);
      pageRef.current = 1;
      return;
    }
    setDraft('');
    setSelectedImage(null);
    setImagePreview(null);
    void loadMessages();
    if (socket?.connected) {
      socket.emit('join_conversation', selectedId, (result: { status?: string; message?: string }) => {
        if (result?.status === 'error') showToast(result.message || 'Unable to join conversation.', 'error');
      });
    }
    return () => {
      socket?.emit('leave_conversation', selectedId);
    };
  }, [selectedId, loadMessages, socket, showToast]);

  const loadOlderMessages = async () => {
    if (!selectedId || olderLoading || !hasOlderMessages || !messageListRef.current) return;
    const container = messageListRef.current;
    pendingScrollRef.current = { height: container.scrollHeight, top: container.scrollTop };
    setOlderLoading(true);
    try {
      const nextPage = pageRef.current + 1;
      const response = await api.getConversationMessages(selectedId, nextPage, 30);
      setMessages((previous) => [...(response.messages || []), ...previous]);
      pageRef.current = nextPage;
      setHasOlderMessages(response.hasMore);
    } catch (error) {
      pendingScrollRef.current = null;
      showToast(error instanceof Error ? error.message : 'Unable to load older messages.', 'error');
    } finally {
      setOlderLoading(false);
    }
  };

  useLayoutEffect(() => {
    const container = messageListRef.current;
    const previousPosition = pendingScrollRef.current;
    if (!container || !previousPosition) return;
    container.scrollTop = previousPosition.top + container.scrollHeight - previousPosition.height;
    pendingScrollRef.current = null;
    preservedScrollRef.current = true;
  }, [messages]);

  useEffect(() => {
    if (!socket || !selectedId) return;
    const handleTyping = (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (data.conversationId !== selectedId) return;
      setTypingUserId(data.isTyping ? data.userId : null);
    };
    const handleConnected = () => {
      socket.emit('join_conversation', selectedId);
      socket.emit('mark_read', { conversationId: selectedId });
    };
    socket.on('typing', handleTyping);
    socket.on('connect', handleConnected);
    return () => {
      socket.off('typing', handleTyping);
      socket.off('connect', handleConnected);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      socket.emit('typing', { conversationId: selectedId, isTyping: false });
    };
  }, [socket, selectedId]);

  useEffect(() => {
    if (preservedScrollRef.current) {
      preservedScrollRef.current = false;
      return;
    }
    if (!pendingScrollRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, typingUserId]);

  const persistTextMessage = async (conversationId: string, text: string, localId: string) => {
    try {
      if (socket?.connected) {
        await new Promise<void>((resolve) => {
          socket.timeout(10000).emit(
            'send_message',
            { conversationId, text },
            (timeoutError: Error | null, result?: { status?: string; message?: string | ChatMessage }) => {
              if (timeoutError || result?.status !== 'success' || typeof result.message !== 'object') {
                const reason = typeof result?.message === 'string'
                  ? result.message
                  : timeoutError ? 'Message sending timed out. Retry when connected.' : 'Unable to send message.';
                setMessages((previous) => previous.map((item) => (
                  item._id === localId ? { ...item, deliveryState: 'failed' } : item
                )));
                showToast(reason, 'error');
              } else {
                const sentMessage = result.message;
                setMessages((previous) => previous.map((item) => (
                  item._id === localId ? sentMessage : item
                )));
              }
              resolve();
            }
          );
        });
      } else {
        const response = await api.sendConversationMessage(conversationId, text);
        setMessages((previous) => (
          previous.map((item) => item._id === localId ? response.sentMessage : item)
        ));
      }
    } catch (error) {
      setMessages((previous) => previous.map((item) => (
        item._id === localId ? { ...item, deliveryState: 'failed' } : item
      )));
      showToast(error instanceof Error ? error.message : 'Unable to send message.', 'error');
    }
  };

  const persistImageMessage = async (conversationId: string, file: File, text: string, localId: string, preview: string) => {
    try {
      const response = await api.sendConversationImage(conversationId, file, text);
      setMessages((previous) => previous.map((item) => (
        item._id === localId ? response.sentMessage : item
      )));
      URL.revokeObjectURL(preview);
    } catch (error) {
      setMessages((previous) => previous.map((item) => (
        item._id === localId ? { ...item, deliveryState: 'failed' } : item
      )));
      showToast(error instanceof Error ? error.message : 'Unable to send image.', 'error');
    }
  };

  const sendMessage = async (event?: FormEvent<HTMLFormElement>, retryMessage?: DisplayMessage) => {
    event?.preventDefault();
    const conversationId = selectedId;
    if (!conversationId || sending) return;
    const text = retryMessage ? retryMessage.text : draft.trim();
    const file = retryMessage?.localFile || (retryMessage ? null : selectedImage);
    if (!retryMessage && !text && !file) return;
    setSending(true);
    if (!retryMessage) {
      setDraft('');
      setSelectedImage(null);
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
      }
    }
    const localId = retryMessage?._id || `local-${Date.now()}`;
    const preview = retryMessage?.localPreview || (file ? URL.createObjectURL(file) : undefined);
    const optimistic: DisplayMessage = retryMessage
      ? { ...retryMessage, deliveryState: 'sending' }
      : {
          _id: localId,
          conversation: conversationId,
          sender: user?._id || '',
          text,
          image: undefined,
          localPreview: preview,
          localFile: file || undefined,
          createdAt: new Date().toISOString(),
          deliveryState: 'sending',
        };
    setMessages((previous) => retryMessage
      ? previous.map((item) => item._id === localId ? optimistic : item)
      : [...previous, optimistic]);
    try {
      if (file && preview) {
        await persistImageMessage(conversationId, file, text, localId, preview);
      } else {
        await persistTextMessage(conversationId, text, localId);
      }
    } finally {
      setSending(false);
    }
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (socket?.connected && selectedId) {
      socket.emit('typing', { conversationId: selectedId, isTyping: Boolean(value.trim()) });
      if (value.trim()) {
        typingTimerRef.current = setTimeout(() => {
          socket.emit('typing', { conversationId: selectedId, isTyping: false });
        }, 1500);
      }
    }
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Choose a JPG, PNG, or WebP image.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Images must be 5 MB or smaller.', 'error');
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!sending && (draft.trim() || selectedImage)) void sendMessage();
    }
  };

  const removeSelectedImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setSelectedImage(null);
    setImagePreview(null);
  };

  useEffect(() => () => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  useEffect(() => () => {
    messagesRef.current.forEach((message) => {
      if (message.localPreview) URL.revokeObjectURL(message.localPreview);
    });
  }, []);

  useEffect(() => {
    if (!enlargedImage) return;
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setEnlargedImage(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enlargedImage]);

  const lastSeenText = otherParticipant?.lastSeen
    ? `Last seen ${formatTime(otherParticipant.lastSeen)}`
    : 'Offline';
  const isMobileThread = Boolean(selectedId);

  return (
    <div className="fixed inset-x-0 bottom-0 top-16 z-10 flex min-h-[32rem] overflow-hidden bg-white">
      {toast && (
        <div
          role="status"
          className={`fixed right-4 top-20 z-[70] max-w-sm rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${
            toast.type === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-800'
              : 'border-campus-200 bg-campus-50 text-campus-800'
          }`}
        >
          {toast.message}
        </div>
      )}

      <aside className={`${isMobileThread ? 'hidden' : 'flex'} w-full shrink-0 flex-col border-r border-slate-200 md:flex md:w-[22rem] lg:w-[25rem]`}>
        <div className="border-b border-slate-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-black text-slate-950">Messages</h1>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              connectionStatus === 'connected'
                ? 'bg-campus-50 text-campus-700'
                : 'bg-slate-100 text-slate-500'
            }`}>
              {connectionStatus === 'connected' ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {connectionStatus === 'connected' ? 'Online' : 'Connecting'}
            </span>
          </div>
          <label className="relative mt-4 block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search conversations"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-campus-500 focus:bg-white focus:ring-2 focus:ring-campus-100"
            />
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading || authLoading ? (
            <div className="space-y-1 p-3">
              {[0, 1, 2, 3, 4].map((item) => (
                <div key={item} className="flex animate-pulse gap-3 rounded-xl p-3">
                  <div className="h-12 w-12 shrink-0 rounded-full bg-slate-200" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 w-1/2 rounded bg-slate-200" />
                    <div className="h-3 w-4/5 rounded bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : errorMessage ? (
            <div className="p-6 text-center">
              <p className="text-sm text-slate-600">{errorMessage}</p>
              <button type="button" onClick={() => void loadConversations(search, true)} className="mt-4 rounded-lg bg-campus-600 px-4 py-2 text-sm font-bold text-white hover:bg-campus-700">
                Try again
              </button>
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <MessageCircle className="mx-auto h-10 w-10 text-slate-300" />
              <h2 className="mt-4 font-bold text-slate-900">{search ? 'No conversations found' : 'No conversations yet'}</h2>
              {!search && (
                <>
                  <p className="mt-2 text-sm text-slate-500">Start a conversation from a book listing.</p>
                  <Link href="/explore" className="mt-5 inline-flex rounded-xl bg-campus-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-campus-700">
                    Explore books
                  </Link>
                </>
              )}
            </div>
          ) : (
            <ul className="space-y-1 p-2">
              {conversations.map((conversation) => {
                const person = conversation.otherParticipant;
                const avatar = typeof person !== 'string' ? person?.avatar : '';
                const book = conversation.book || conversation.relatedBook;
                const isOnline = Boolean(person && onlineUserIds.has(person._id));
                return (
                  <li key={conversation._id}>
                    <button
                      type="button"
                      onClick={() => router.push(`/messages/${conversation._id}`)}
                      className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-campus-50 ${
                        selectedId === conversation._id ? 'bg-campus-50' : ''
                      }`}
                    >
                      <span className="relative h-12 w-12 shrink-0">
                        {avatar ? (
                          <img src={avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
                        ) : (
                          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-campus-100 font-bold text-campus-800">
                            {getUserName(person).slice(0, 1).toUpperCase()}
                          </span>
                        )}
                        <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-bold text-slate-900">{getUserName(person)}</span>
                          <span className="shrink-0 text-[10px] text-slate-400">{formatTime(conversation.lastMessageAt)}</span>
                        </span>
                        {book?.title && <span className="mt-0.5 block truncate text-[11px] font-semibold text-campus-700">{book.title}</span>}
                        <span className="mt-1 flex items-center justify-between gap-2">
                          <span className="truncate text-xs text-slate-500">{conversation.lastMessage || 'Start a conversation'}</span>
                          {conversation.unreadCount > 0 && (
                            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-campus-600 px-1 text-[10px] font-bold text-white">
                              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <section className={`${selectedId ? 'flex' : 'hidden'} min-w-0 flex-1 flex-col md:flex`}>
        {!selectedId ? (
          <div className="hidden h-full flex-col items-center justify-center px-6 text-center md:flex">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-campus-50 text-campus-600">
              <MessageCircle className="h-10 w-10" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-slate-900">Select a conversation</h2>
            <p className="mt-2 max-w-sm text-sm text-slate-500">Choose a conversation from your inbox to view messages.</p>
          </div>
        ) : (
          <>
            <header className="flex min-h-16 items-center gap-3 border-b border-slate-200 px-4 py-3">
              <button type="button" onClick={() => router.push('/messages')} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden" aria-label="Back to messages">
                <ArrowLeft className="h-5 w-5" />
              </button>
              {otherParticipant?.avatar ? (
                <img src={otherParticipant.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-campus-100 font-bold text-campus-800">
                  {getUserName(otherParticipant).slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="flex items-center gap-1.5 truncate font-bold text-slate-900">
                  <span className="truncate">{getUserName(otherParticipant)}</span>
                  {otherParticipant?.isVerified && (
                    <BadgeCheck aria-label="Verified student" className="h-4 w-4 shrink-0 fill-campus-100 text-campus-600" />
                  )}
                </h2>
                <p className={`text-xs ${isOtherOnline ? 'text-campus-700' : 'text-slate-500'}`}>
                  {isOtherOnline ? 'Online' : lastSeenText}
                  {typeof otherParticipant?.university === 'object' && otherParticipant.university?.name
                    ? ` · ${otherParticipant.university.name}`
                    : ''}
                </p>
              </div>
              {selectedBook && (
                <Link href={`/books/${selectedBook._id}`} className="flex max-w-[9rem] items-center gap-2 rounded-xl bg-slate-50 p-1.5 text-xs font-semibold text-slate-700 hover:bg-campus-50 sm:max-w-[14rem] sm:p-2">
                  {selectedBook.images?.[0] ? (
                    <img src={getImageUrl(selectedBook.images[0])} alt="" className="h-9 w-8 shrink-0 rounded object-cover" />
                  ) : (
                    <BookOpen className="h-4 w-4 shrink-0 text-campus-600" />
                  )}
                  <span className="hidden truncate sm:inline">{selectedBook.title}</span>
                </Link>
              )}
            </header>

            {connectionStatus !== 'connected' && (
              <div role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-center text-xs font-medium text-amber-800">
                Reconnecting…
              </div>
            )}

            <div ref={messageListRef} className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-4 py-5">
              {threadLoading ? (
                <div className="space-y-4">
                  {[0, 1, 2, 3].map((item) => (
                    <div key={item} className={`h-12 w-2/3 animate-pulse rounded-2xl bg-slate-200 ${item % 2 ? 'ml-auto' : ''}`} />
                  ))}
                </div>
              ) : threadError ? (
                <div className="mx-auto max-w-sm rounded-2xl border border-rose-200 bg-white p-5 text-center">
                  <p className="text-sm text-slate-600">{threadError}</p>
                  <button type="button" onClick={() => void loadMessages()} className="mt-4 rounded-lg bg-campus-600 px-4 py-2 text-sm font-bold text-white hover:bg-campus-700">Try again</button>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <MessageCircle className="h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm text-slate-500">No messages yet. Say hello!</p>
                </div>
              ) : (
                <div className="mx-auto flex max-w-3xl flex-col gap-3">
                  {hasOlderMessages && (
                    <div className="pb-2 text-center">
                      <button
                        type="button"
                        disabled={olderLoading}
                        onClick={() => void loadOlderMessages()}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:border-campus-300 hover:text-campus-700 disabled:opacity-60"
                      >
                        {olderLoading ? 'Loading…' : 'Load older messages'}
                      </button>
                    </div>
                  )}
                  {messages.map((message, index) => {
                    const ownMessage = getId(message.sender) === user?._id;
                    const currentDay = new Date(message.createdAt || 0).toDateString();
                    const previousDay = index > 0
                      ? new Date(messages[index - 1].createdAt || 0).toDateString()
                      : '';
                    const imageUrl = message.localPreview || message.image || '';
                    const isRead = Boolean(message.readAt || message.isRead);
                    return (
                      <div key={message._id}>
                        {(!index || currentDay !== previousDay) && (
                          <div className="my-3 flex justify-center">
                            <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-slate-500 shadow-sm">
                              {formatDay(message.createdAt)}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${ownMessage ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm sm:max-w-[70%] ${
                            ownMessage ? 'rounded-br-md bg-campus-600 text-white' : 'rounded-bl-md bg-white text-slate-800'
                          } ${message.deliveryState === 'failed' ? 'ring-2 ring-rose-300' : ''}`}>
                            {(message.text || message.content) && <p className="whitespace-pre-wrap break-words text-sm">{message.text || message.content}</p>}
                            {imageUrl && (
                              <button type="button" onClick={() => setEnlargedImage(imageUrl)} className="mt-2 block" aria-label="Enlarge shared image">
                                <img src={imageUrl} alt="Shared image" className="max-h-72 max-w-full rounded-lg object-cover" />
                              </button>
                            )}
                            <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${ownMessage ? 'text-campus-100' : 'text-slate-400'}`}>
                              {message.deliveryState === 'failed' ? (
                                <button type="button" onClick={() => void sendMessage(undefined, message)} className="font-bold text-rose-200 underline">
                                  Retry
                                </button>
                              ) : (
                                <>
                                  <span>{message.deliveryState === 'sending' ? 'Sending…' : formatTime(message.createdAt)}</span>
                                  {ownMessage && message.deliveryState !== 'sending' && (
                                    isRead
                                      ? <CheckCheck aria-label="Read" className="h-3.5 w-3.5 text-sky-200" />
                                      : <Check aria-label="Sent" className="h-3.5 w-3.5" />
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {typingUserId && <p className="text-xs italic text-slate-500">{getUserName(otherParticipant)} is typing…</p>}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            <form onSubmit={(event) => void sendMessage(event)} className="border-t border-slate-200 bg-white p-3 sm:p-4">
              {imagePreview && (
                <div className="mb-3 inline-flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                  <img src={imagePreview} alt="Image preview" className="h-16 w-16 rounded-lg object-cover" />
                  <button type="button" onClick={removeSelectedImage} disabled={sending} className="rounded-full bg-white p-1 text-slate-500 hover:text-rose-600" aria-label="Remove image attachment">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div className="flex items-end gap-2">
                <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => imageInputRef.current?.click()}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-campus-700 disabled:opacity-50"
                  aria-label="Attach image"
                >
                  <ImagePlus className="h-5 w-5" />
                </button>
                <textarea
                  value={draft}
                  onChange={(event) => handleDraftChange(event.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  maxLength={2000}
                  rows={1}
                  disabled={sending}
                  placeholder="Write a message…"
                  className="max-h-32 min-h-11 min-w-0 flex-1 resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-campus-500 focus:bg-white focus:ring-2 focus:ring-campus-100 disabled:opacity-60"
                />
                <button type="submit" disabled={(!draft.trim() && !selectedImage) || sending} aria-label="Send message" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-campus-600 text-white hover:bg-campus-700 disabled:cursor-not-allowed disabled:opacity-50">
                  {sending ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
              </div>
            </form>
          </>
        )}
      </section>
      {enlargedImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={() => setEnlargedImage(null)}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
        >
          <button
            type="button"
            onClick={() => setEnlargedImage(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close image"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={enlargedImage}
            alt="Enlarged shared image"
            onClick={(event) => event.stopPropagation()}
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        </div>
      )}
    </div>
  );
}
