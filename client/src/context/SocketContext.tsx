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
import { ChatMessage, Notification } from '@/types';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

interface SocketContextValue {
  socket: Socket | null;
  connectionStatus: ConnectionStatus;
  onlineUserIds: Set<string>;
  totalUnread: number;
  notifications: Notification[];
  unreadNotificationCount: number;
  setActiveConversationId: (conversationId: string | null) => void;
  refreshUnreadCount: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const notificationsRef = useRef<Notification[]>([]);
  const activeConversationId = useRef<string | null>(null);

  notificationsRef.current = notifications;

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

  const refreshNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadNotificationCount(0);
      return;
    }

    const [listResponse, countResponse] = await Promise.all([
      api.getNotifications({ limit: 8 }),
      api.getUnreadNotificationCount(),
    ]);
    notificationsRef.current = listResponse.notifications || [];
    setNotifications(listResponse.notifications || []);
    setUnreadNotificationCount(countResponse.unreadCount || 0);
  }, [user]);

  const markNotificationRead = useCallback(async (notificationId: string) => {
    await api.markNotificationRead(notificationId);
    const wasUnread = notificationsRef.current.find((item) => item._id === notificationId && !item.isRead);
    notificationsRef.current = notificationsRef.current.map((notification) => (
      notification._id === notificationId ? { ...notification, isRead: true } : notification
    ));
    setNotifications((previous) => previous.map((notification) => (
      notification._id === notificationId ? { ...notification, isRead: true } : notification
    )));
    if (wasUnread) setUnreadNotificationCount((count) => Math.max(0, count - 1));
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    await api.markAllNotificationsRead();
    notificationsRef.current = notificationsRef.current.map((notification) => ({ ...notification, isRead: true }));
    setNotifications((previous) => previous.map((notification) => ({ ...notification, isRead: true })));
    setUnreadNotificationCount(0);
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    await api.deleteNotification(notificationId);
    const notification = notificationsRef.current.find((item) => item._id === notificationId);
    notificationsRef.current = notificationsRef.current.filter((item) => item._id !== notificationId);
    setNotifications((previous) => previous.filter((item) => item._id !== notificationId));
    if (notification && !notification.isRead) {
      setUnreadNotificationCount((count) => Math.max(0, count - 1));
    }
  }, []);

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
      notificationsRef.current = [];
      setNotifications([]);
      setUnreadNotificationCount(0);
      return;
    }

    void refreshUnreadCount();
    void refreshNotifications().catch((error) => {
      console.error(
        error instanceof Error ? `Unable to load notifications: ${error.message}` : error
      );
    });
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
    const handleNotification = (notification: Notification) => {
      const existing = notificationsRef.current.find((item) => item._id === notification._id);
      notificationsRef.current = [
        notification,
        ...notificationsRef.current.filter((item) => item._id !== notification._id),
      ].slice(0, 8);
      setNotifications(notificationsRef.current);
      if (!existing || existing.isRead) {
        setUnreadNotificationCount((count) => count + 1);
      }
    };

    connection.on('connect', handleConnect);
    connection.on('disconnect', handleDisconnect);
    connection.on('connect_error', handleConnectError);
    connection.on('presence_update', handlePresence);
    connection.on('receive_message', handleMessage);
    connection.on('notification', handleNotification);

    return () => {
      connection.off('connect', handleConnect);
      connection.off('disconnect', handleDisconnect);
      connection.off('connect_error', handleConnectError);
      connection.off('presence_update', handlePresence);
      connection.off('receive_message', handleMessage);
      connection.off('notification', handleNotification);
      connection.disconnect();
      setSocket(null);
      setConnectionStatus('disconnected');
      setOnlineUserIds(new Set());
    };
  }, [authLoading, user, refreshUnreadCount, refreshNotifications]);

  const value = useMemo<SocketContextValue>(
    () => ({
      socket,
      connectionStatus,
      onlineUserIds,
      totalUnread: Object.values(unreadByConversation).reduce((total, count) => total + count, 0),
      notifications,
      unreadNotificationCount,
      setActiveConversationId,
      refreshUnreadCount,
      refreshNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification,
      markConversationRead,
    }),
    [
      socket,
      connectionStatus,
      onlineUserIds,
      unreadByConversation,
      notifications,
      unreadNotificationCount,
      setActiveConversationId,
      refreshUnreadCount,
      refreshNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification,
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
