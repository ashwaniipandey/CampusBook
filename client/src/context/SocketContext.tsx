'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { ChatMessage } from '@/types';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

interface SocketContextValue {
  socket: Socket | null;
  connectionStatus: ConnectionStatus;
  onlineUserIds: Set<string>;
  totalUnread: number;
  setActiveConversationId: (conversationId: string | null) => void;
  refreshUnreadCount: () => Promise<void>;
  markConversationRead: (conversationId: string) => Promise<void>;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

const configuredApiUrl =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
const socketUrl = configuredApiUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');

function getId(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && '_id' in value) {
    return String((value as { _id: unknown })._id);
  }
  return '';
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [unreadByConversation, setUnreadByConversation] = useState<Record<string, number>>({});
  const activeConversationId = useRef<string | null>(null);

  const refreshUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadByConversation({});
      return;
    }

    try {
      const response = await api.getConversations();
      const counts = Object.fromEntries(
        (response.conversations || [])
          .filter((conversation) => conversation.unreadCount > 0)
          .map((conversation) => [conversation._id, conversation.unreadCount])
      );
      setUnreadByConversation(counts);
    } catch (error) {
      console.error(
        error instanceof Error ? `Unable to load message unread counts: ${error.message}` : error
      );
    }
  }, [user]);

  const markConversationRead = useCallback(async (conversationId: string) => {
    await api.markConversationRead(conversationId);
    setUnreadByConversation((previous) => {
      const next = { ...previous };
      delete next[conversationId];
      return next;
    });
  }, []);

  const setActiveConversationId = useCallback((conversationId: string | null) => {
    activeConversationId.current = conversationId;
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setSocket(null);
      setConnectionStatus('disconnected');
      setOnlineUserIds(new Set());
      setUnreadByConversation({});
      return;
    }

    void refreshUnreadCount();
    setConnectionStatus('connecting');
    const connection = io(socketUrl, { withCredentials: true });
    setSocket(connection);

    const handleConnect = () => {
      setConnectionStatus('connected');
      connection.emit('get_online_users', (result: { userIds?: string[] }) => {
        setOnlineUserIds(new Set(result?.userIds || []));
      });
    };
    const handleDisconnect = () => setConnectionStatus('disconnected');
    const handleConnectError = (error: Error) => {
      setConnectionStatus('disconnected');
      console.error(`Chat socket connection failed: ${error.message}`);
    };
    const handlePresence = (presence: { userId: string; online: boolean }) => {
      setOnlineUserIds((previous) => {
        const next = new Set(previous);
        if (presence.online) next.add(presence.userId);
        else next.delete(presence.userId);
        return next;
      });
    };
    const handleMessage = (message: ChatMessage) => {
      const conversationId = getId(message.conversation);
      const senderId = getId(message.sender);
      if (!conversationId || senderId === user._id || activeConversationId.current === conversationId) {
        return;
      }
      setUnreadByConversation((previous) => ({
        ...previous,
        [conversationId]: (previous[conversationId] || 0) + 1,
      }));
    };

    connection.on('connect', handleConnect);
    connection.on('disconnect', handleDisconnect);
    connection.on('connect_error', handleConnectError);
    connection.on('presence_update', handlePresence);
    connection.on('receive_message', handleMessage);

    return () => {
      connection.off('connect', handleConnect);
      connection.off('disconnect', handleDisconnect);
      connection.off('connect_error', handleConnectError);
      connection.off('presence_update', handlePresence);
      connection.off('receive_message', handleMessage);
      connection.disconnect();
      setSocket(null);
      setConnectionStatus('disconnected');
      setOnlineUserIds(new Set());
    };
  }, [authLoading, user, refreshUnreadCount]);

  const value = useMemo<SocketContextValue>(
    () => ({
      socket,
      connectionStatus,
      onlineUserIds,
      totalUnread: Object.values(unreadByConversation).reduce((total, count) => total + count, 0),
      setActiveConversationId,
      refreshUnreadCount,
      markConversationRead,
    }),
    [
      socket,
      connectionStatus,
      onlineUserIds,
      unreadByConversation,
      setActiveConversationId,
      refreshUnreadCount,
      markConversationRead,
    ]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
