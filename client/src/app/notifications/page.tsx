'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftRight,
  Bell,
  BookOpen,
  Check,
  CheckCheck,
  HeartHandshake,
  LoaderCircle,
  MessageCircle,
  PackageCheck,
  Star,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import api from '@/lib/api';
import { Notification as AppNotification } from '@/types';

type Filter = 'all' | 'unread';

function relativeTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}d ago` : date.toLocaleDateString();
}

function notificationIcon(type: AppNotification['type']) {
  if (type === 'order') return PackageCheck;
  if (type === 'exchange_request') return ArrowLeftRight;
  if (type === 'donation_request') return HeartHandshake;
  if (type === 'message') return MessageCircle;
  if (type === 'review') return Star;
  if (type === 'book_status' || type === 'wishlist_alert') return BookOpen;
  return Bell;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    refreshNotifications,
  } = useSocket();
  const [filter, setFilter] = useState<Filter>('all');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const requestSequence = useRef(0);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  const loadNotifications = useCallback(async (targetPage: number, append: boolean) => {
    const requestId = ++requestSequence.current;
    if (append) setLoadingMore(true);
    else {
      setLoading(true);
      setErrorMessage(null);
    }

    try {
      const response = await api.getNotifications({
        page: targetPage,
        limit: 20,
        ...(filter === 'unread' ? { unread: true } : {}),
      });
      if (requestId !== requestSequence.current) return;
      setNotifications((previous) => append
        ? [...previous, ...(response.notifications || [])]
        : response.notifications || []);
      setUnreadCount(response.unreadCount || 0);
      setPage(response.page || targetPage);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      if (requestId === requestSequence.current) {
        const message = error instanceof Error ? error.message : 'Unable to load notifications.';
        setErrorMessage(message);
        showToast(message);
      }
    } finally {
      if (requestId === requestSequence.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [filter, showToast]);

  useEffect(() => {
    if (!authLoading && !user) {
      const returnUrl = `${window.location.pathname}${window.location.search}`;
      router.replace(`/login?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }
    if (user) void loadNotifications(1, false);
  }, [authLoading, user, router, loadNotifications]);

  const changeFilter = (nextFilter: Filter) => {
    if (nextFilter === filter) return;
    requestSequence.current += 1;
    setFilter(nextFilter);
    setPage(1);
  };

  const loadMore = () => {
    if (loadingMore || page >= totalPages) return;
    void loadNotifications(page + 1, true);
  };

  const markRead = async (notification: AppNotification) => {
    if (notification.isRead) return;
    setActionId(notification._id);
    try {
      await markNotificationRead(notification._id);
      setNotifications((previous) => previous.map((item) => (
        item._id === notification._id ? { ...item, isRead: true } : item
      )));
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to mark notification as read.');
    } finally {
      setActionId(null);
    }
  };

  const markAllRead = async () => {
    if (!unreadCount || markingAll) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setNotifications((previous) => previous.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
      showToast('All notifications marked as read.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to mark notifications as read.');
    } finally {
      setMarkingAll(false);
    }
  };

  const removeNotification = async (notification: AppNotification) => {
    setActionId(notification._id);
    try {
      await deleteNotification(notification._id);
      setNotifications((previous) => previous.filter((item) => item._id !== notification._id));
      if (!notification.isRead) setUnreadCount((count) => Math.max(0, count - 1));
      showToast('Notification deleted.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to delete notification.');
    } finally {
      setActionId(null);
    }
  };

  const openNotification = async (notification: AppNotification) => {
    if (!notification.isRead) await markRead(notification);
    router.push(notification.link || '/notifications');
  };

  const retry = () => {
    void refreshNotifications().then(() => loadNotifications(1, false)).catch((error) => {
      const message = error instanceof Error ? error.message : 'Unable to refresh notifications.';
      setErrorMessage(message);
      showToast(message);
    });
  };

  if (authLoading || !user) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[70vh] max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-campus-700">Your activity</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Notifications</h1>
          <p className="mt-2 text-sm text-slate-600">
            {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void markAllRead()}
          disabled={!unreadCount || markingAll}
          className="inline-flex items-center gap-2 rounded-xl border border-campus-200 bg-white px-4 py-2.5 text-sm font-bold text-campus-800 transition hover:bg-campus-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {markingAll ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
          Mark all as read
        </button>
      </div>

      <div className="mt-7 flex gap-2 border-b border-slate-200">
        {(['all', 'unread'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => changeFilter(value)}
            className={`border-b-2 px-4 py-3 text-sm font-bold capitalize transition ${
              filter === value
                ? 'border-campus-600 text-campus-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {value === 'all' ? 'All' : 'Unread'}
          </button>
        ))}
      </div>

      {errorMessage ? (
        <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-10 text-center">
          <Bell className="mx-auto h-9 w-9 text-rose-500" />
          <h2 className="mt-3 text-lg font-bold text-slate-900">Couldn’t load notifications</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-rose-800">{errorMessage}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-5 rounded-xl bg-campus-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-campus-800"
          >
            Retry
          </button>
        </div>
      ) : loading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <Bell className="mx-auto h-10 w-10 text-slate-300" />
          <h2 className="mt-3 text-lg font-bold text-slate-900">
            {filter === 'unread' ? 'No unread notifications' : 'You’re all caught up'}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {filter === 'unread' ? 'You have read all your notifications.' : 'New activity will appear here.'}
          </p>
          {filter === 'all' && (
            <Link href="/explore" className="mt-5 inline-flex rounded-xl bg-campus-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-campus-800">
              Explore books
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {notifications.map((notification) => {
            const Icon = notificationIcon(notification.type);
            const busy = actionId === notification._id;
            return (
              <article
                key={notification._id}
                className={`flex gap-3 rounded-2xl border p-4 transition sm:gap-4 sm:p-5 ${
                  notification.isRead ? 'border-slate-200 bg-white' : 'border-campus-200 bg-campus-50/70'
                }`}
              >
                <button
                  type="button"
                  onClick={() => void openNotification(notification)}
                  className="flex min-w-0 flex-1 items-start gap-3 text-left sm:gap-4"
                >
                  <span className="relative mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-campus-100 text-campus-700">
                    <Icon className="h-5 w-5" />
                    {!notification.isRead && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-campus-600" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <span className="font-bold text-slate-900">{notification.title}</span>
                      <time
                        dateTime={notification.createdAt}
                        title={notification.createdAt ? new Date(notification.createdAt).toLocaleString() : undefined}
                        className="text-xs text-slate-500"
                      >
                        {relativeTime(notification.createdAt)}
                      </time>
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-slate-600">{notification.message}</span>
                  </span>
                </button>
                <div className="flex shrink-0 items-start gap-1">
                  {!notification.isRead && (
                    <button
                      type="button"
                      aria-label="Mark as read"
                      title="Mark as read"
                      disabled={busy}
                      onClick={() => void markRead(notification)}
                      className="rounded-lg p-2 text-campus-700 hover:bg-campus-100 disabled:opacity-50"
                    >
                      {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="Delete notification"
                    title="Delete notification"
                    disabled={busy}
                    onClick={() => void removeNotification(notification)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                  >
                    {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </article>
            );
          })}
          {page < totalPages && (
            <div className="pt-3 text-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {loadingMore && <LoaderCircle className="h-4 w-4 animate-spin" />}
                Load more
              </button>
            </div>
          )}
        </div>
      )}

      {toast && (
        <div role="status" className="fixed bottom-5 right-5 z-50 max-w-sm rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-xl">
          {toast}
        </div>
      )}
    </main>
  );
}
