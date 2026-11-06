'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeftRight,
  BadgeCheck,
  Bell,
  BookOpen,
  Calendar,
  CheckCheck,
  ChevronDown,
  ClipboardList,
  GraduationCap,
  Heart,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  PackageCheck,
  PlusCircle,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShoppingCart,
  Sparkles,
  Star,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { Notification } from '@/types';
import SearchAutocomplete from '@/components/SearchAutocomplete';
import ThemeToggle from '@/components/ThemeToggle';
import { getVerificationHref, isVerifiedStudent } from '@/lib/verification';

function relativeTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 24);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}d ago` : date.toLocaleDateString();
}

function notificationIcon(type: Notification['type']) {
  if (type === 'order') return PackageCheck;
  if (type === 'exchange_request') return ArrowLeftRight;
  if (type === 'donation_request') return HeartHandshake;
  if (type === 'message') return MessageCircle;
  if (type === 'review') return Star;
  if (type === 'book_status' || type === 'wishlist_alert') return BookOpen;
  return Bell;
}

function countLabel(count: number) {
  return count > 99 ? '99+' : count;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout, cartCount } = useAuth();
  const {
    socket,
    totalUnread,
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useSocket();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationDesktopRef = useRef<HTMLDivElement>(null);
  const notificationCompactRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);
  const userMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const notificationDesktopTriggerRef = useRef<HTMLButtonElement>(null);
  const notificationCompactTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserDropdownOpen(false);
      }
      if (
        notificationDesktopRef.current &&
        !notificationDesktopRef.current.contains(target) &&
        notificationCompactRef.current &&
        !notificationCompactRef.current.contains(target)
      ) {
        setNotificationDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(target)) {
        setSearchOpen(false);
      }
      if (
        mobilePanelRef.current &&
        !mobilePanelRef.current.contains(target) &&
        mobileMenuTriggerRef.current &&
        !mobileMenuTriggerRef.current.contains(target)
      ) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (userDropdownOpen) userMenuTriggerRef.current?.focus();
      if (notificationDropdownOpen) {
        const desktopTrigger = notificationDesktopTriggerRef.current;
        if (desktopTrigger?.getClientRects().length) desktopTrigger.focus();
        else notificationCompactTriggerRef.current?.focus();
      }
      if (mobileMenuOpen) mobileMenuTriggerRef.current?.focus();
      if (searchOpen) searchTriggerRef.current?.focus();
      setUserDropdownOpen(false);
      setNotificationDropdownOpen(false);
      setMobileMenuOpen(false);
      setSearchOpen(false);
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen, notificationDropdownOpen, searchOpen, userDropdownOpen]);

  useEffect(() => {
    if (!socket) return;
    const handleNotification = (notification: Notification) => {
      setNotificationToast(notification.title || notification.message);
      window.setTimeout(() => setNotificationToast(null), 4000);
    };
    socket.on('notification', handleNotification);
    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setNotificationDropdownOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const openNotification = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await markNotificationRead(notification._id);
      } catch (error) {
        setNotificationToast(error instanceof Error ? error.message : 'Unable to mark notification as read.');
        window.setTimeout(() => setNotificationToast(null), 4000);
      }
    }
    setNotificationDropdownOpen(false);
    router.push(notification.link || '/notifications');
  };

  const markAllFromBell = async () => {
    try {
      await markAllNotificationsRead();
    } catch (error) {
      setNotificationToast(error instanceof Error ? error.message : 'Unable to mark notifications as read.');
      window.setTimeout(() => setNotificationToast(null), 4000);
    }
  };

  const getInitials = (name: string) =>
    name
      ? name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()
      : 'U';

  const universityName =
    typeof user?.university === 'object' && user.university
      ? user.university.name
      : 'Campus Member';

  const actionHref = (href: string) =>
    isAuthenticated ? href : `/login?redirect=${encodeURIComponent(href)}`;
  const sellHref = !isAuthenticated
    ? `/login?redirect=${encodeURIComponent('/sell')}`
    : isVerifiedStudent(user)
      ? '/sell'
      : getVerificationHref('/sell');

  // Exact matching for reference nav links
  const isHomeActive = pathname === '/';
  const isExploreActive = pathname === '/explore' && !pathname.includes('listingType');
  const isExchangeActive = pathname.includes('listingType=exchange') || pathname.startsWith('/exchanges');
  const isDonateActive = pathname.includes('listingType=donate') || pathname.startsWith('/donations');
  const isCollegesActive = pathname.startsWith('/colleges');
  const isEventsActive = pathname.startsWith('/events');

  const navPillClass = (active: boolean) =>
    active
      ? 'rounded-full bg-[#22c55e] px-4 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 transition-all duration-200'
      : 'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white/80 hover:text-emerald-300 hover:bg-emerald-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:bg-emerald-500/15 transition-all duration-200';

  const iconBtnClass =
    'relative flex h-9 w-9 items-center justify-center rounded-full text-white/75 hover:bg-emerald-500/15 hover:text-emerald-300 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#02130b]/90 backdrop-blur-xl transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" aria-label="CampusBook home" className="group flex shrink-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 shadow-sm transition group-hover:scale-105 group-hover:bg-emerald-500 group-hover:text-slate-950">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-lg sm:text-xl font-extrabold tracking-tight text-white dark:text-white">
              Campus<span className="text-emerald-400">Book</span>
            </span>
          </Link>

          {/* Center Navigation Links (Matching Screenshot) */}
          <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-1">
            <Link href="/" className={navPillClass(isHomeActive)}>
              Home
            </Link>
            <Link href="/explore" className={navPillClass(isExploreActive)}>
              Explore
            </Link>
            <Link href="/explore?listingType=exchange" className={navPillClass(isExchangeActive)}>
              Exchange
            </Link>
            <Link href="/explore?listingType=donate" className={navPillClass(isDonateActive)}>
              <Heart className="h-3.5 w-3.5" aria-hidden="true" /> Free Donations
            </Link>
            <Link href="/colleges" className={navPillClass(isCollegesActive)}>
              <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" /> Colleges
            </Link>
            <Link href="/events" className={navPillClass(isEventsActive)}>
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" /> Events
            </Link>
          </nav>

          {/* Right Action Icons (Matching Screenshot) */}
          <div className="hidden lg:flex items-center gap-1.5">
            {/* Search Trigger */}
            <div className="relative shrink-0" ref={searchRef}>
              <button
                type="button"
                ref={searchTriggerRef}
                onClick={() => setSearchOpen((open) => !open)}
                aria-label="Search books"
                title="Search books"
                className={iconBtnClass}
              >
                {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              </button>

              {searchOpen && (
                <div
                  id="navbar-search-panel"
                  className="absolute right-0 top-full z-[70] mt-2 w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-white/15 bg-slate-950/95 p-3.5 shadow-2xl backdrop-blur-2xl"
                >
                  <SearchAutocomplete
                    value={searchValue}
                    onChange={setSearchValue}
                    inputClassName="py-3"
                    placeholder="Search books, authors, or ISBN..."
                    onFocus={() => setSearchOpen(true)}
                  />
                </div>
              )}
            </div>

            {/* Messages / Chat (Logged-in users) */}
            {isAuthenticated && (
              <Link
                href="/messages"
                aria-label={`Messages, ${totalUnread} unread`}
                title="Messages"
                className={iconBtnClass}
              >
                <MessageCircle className="h-4 w-4" />
                {totalUnread > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-slate-950">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                )}
              </Link>
            )}

            {/* Wishlist Heart */}
            <Link href="/wishlist" aria-label="Wishlist" title="Wishlist" className={iconBtnClass}>
              <Heart className="h-4 w-4" />
            </Link>

            {/* Notification Bell with Green Dot */}
            <div className="relative" ref={notificationDesktopRef}>
              <button
                type="button"
                ref={notificationDesktopTriggerRef}
                onClick={() => setNotificationDropdownOpen((open) => !open)}
                aria-label={`Notifications, ${unreadNotificationCount} unread`}
                aria-expanded={notificationDropdownOpen}
                title="Notifications"
                className={iconBtnClass}
              >
                <Bell className="h-4 w-4" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#02130b] animate-pulse" />
                )}
              </button>

              {notificationDropdownOpen && (
                <NotificationDropdown
                  id="navbar-notifications-desktop"
                  notifications={notifications}
                  unreadCount={unreadNotificationCount}
                  openNotification={openNotification}
                  markAll={markAllFromBell}
                  close={() => setNotificationDropdownOpen(false)}
                />
              )}
            </div>

            {/* Shopping Cart */}
            <Link href="/cart" aria-label="Shopping Cart" title="Cart" className={iconBtnClass}>
              <ShoppingCart className="h-4 w-4" />
              {isAuthenticated && cartCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-slate-950">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Sun / Moon Pill Switch */}
            <div className="mx-1">
              <ThemeToggle />
            </div>

            {/* Admin Console Shortcut */}
            {user?.role === 'admin' && (
              <Link
                href="/admin"
                className="hidden xl:inline-flex h-8 items-center gap-1.5 rounded-full bg-purple-700/80 hover:bg-purple-700 px-3 text-xs font-bold text-white shadow-sm transition"
              >
                <Shield className="h-3.5 w-3.5" /> Admin
              </Link>
            )}

            {/* User Avatar Circle */}
            {isAuthenticated && user ? (
              <div className="relative shrink-0 ml-1" ref={userMenuRef}>
                <button
                  type="button"
                  ref={userMenuTriggerRef}
                  onClick={() => setUserDropdownOpen((open) => !open)}
                  aria-label={`Account menu for ${user.name}`}
                  aria-expanded={userDropdownOpen}
                  title={user.name}
                  className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-emerald-400/80 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-emerald-700 text-xs font-extrabold text-white">
                      {getInitials(user.name)}
                    </span>
                  )}
                </button>
                {userDropdownOpen && (
                  <UserDropdown
                    id="navbar-user-menu"
                    user={user}
                    universityName={universityName}
                    totalUnread={totalUnread}
                    close={() => setUserDropdownOpen(false)}
                    logout={logout}
                  />
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="ml-1 inline-flex h-8 items-center rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 transition"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Right Controls */}
          <div className="flex lg:hidden items-center gap-2">
            <ThemeToggle />
            {isAuthenticated && (
              <Link
                href="/messages"
                aria-label={`Messages, ${totalUnread} unread`}
                className={iconBtnClass}
              >
                <MessageCircle className="h-4 w-4" />
                {totalUnread > 0 && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-400" />
                )}
              </Link>
            )}
            <Link href="/cart" aria-label="Shopping Cart" className={iconBtnClass}>
              <ShoppingCart className="h-4 w-4" />
              {cartCount > 0 && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-400" />
              )}
            </Link>
            <button
              type="button"
              ref={mobileMenuTriggerRef}
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              className={iconBtnClass}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          id="navbar-mobile-menu"
          ref={mobilePanelRef}
          className="border-b border-white/10 bg-[#02130b] px-4 py-5 shadow-2xl lg:hidden sm:px-6"
        >
          <nav className="space-y-1.5">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`block rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                isHomeActive
                  ? 'bg-[#22c55e] text-slate-950'
                  : 'text-white/80 hover:bg-emerald-500/15 hover:text-emerald-300'
              }`}
            >
              Home
            </Link>
            <Link
              href="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className={`block rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                isExploreActive
                  ? 'bg-[#22c55e] text-slate-950 font-bold'
                  : 'text-white/80 hover:bg-emerald-500/15 hover:text-emerald-300'
              }`}
            >
              Explore
            </Link>
            <Link
              href="/explore?listingType=exchange"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                isExchangeActive
                  ? 'bg-[#22c55e] text-slate-950 font-bold'
                  : 'text-white/80 hover:bg-emerald-500/15 hover:text-emerald-300'
              }`}
            >
              <ArrowLeftRight className={`h-4 w-4 ${isExchangeActive ? 'text-slate-950' : 'text-emerald-400'}`} /> Exchange
            </Link>
            <Link
              href="/explore?listingType=donate"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                isDonateActive
                  ? 'bg-[#22c55e] text-slate-950 font-bold'
                  : 'text-white/80 hover:bg-emerald-500/15 hover:text-emerald-300'
              }`}
            >
              <Heart className={`h-4 w-4 ${isDonateActive ? 'text-slate-950' : 'text-rose-400'}`} /> Free Donations
            </Link>
            <Link
              href="/colleges"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                isCollegesActive
                  ? 'bg-[#22c55e] text-slate-950 font-bold'
                  : 'text-white/80 hover:bg-emerald-500/15 hover:text-emerald-300'
              }`}
            >
              <GraduationCap className={`h-4 w-4 ${isCollegesActive ? 'text-slate-950' : 'text-emerald-400'}`} /> Colleges
            </Link>
            <Link
              href="/events"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                isEventsActive
                  ? 'bg-[#22c55e] text-slate-950 font-bold'
                  : 'text-white/80 hover:bg-emerald-500/15 hover:text-emerald-300'
              }`}
            >
              <Calendar className={`h-4 w-4 ${isEventsActive ? 'text-slate-950' : 'text-amber-400'}`} /> Events
            </Link>

            <div className="my-3 border-t border-white/10" />

            {user?.role === 'admin' && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl bg-purple-700 px-4 py-2.5 text-sm font-bold text-white"
              >
                <Shield className="h-4 w-4" /> Open Admin Console
              </Link>
            )}

            <Link
              href={sellHref}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950"
            >
              <PlusCircle className="h-4 w-4" /> Sell a Book
            </Link>

            {isAuthenticated ? (
              <div className="space-y-1 pt-2">
                <Link
                  href="/messages"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-lg px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5"
                >
                  <span className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-emerald-400" /> Messages
                  </span>
                  {totalUnread > 0 && (
                    <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-slate-950">
                      {totalUnread}
                    </span>
                  )}
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5"
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5"
                >
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    void logout();
                  }}
                  className="block w-full text-left rounded-lg px-4 py-2 text-xs font-semibold text-rose-400 hover:bg-white/5"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
      )}

      {notificationToast && (
        <div
          role="status"
          className="fixed right-4 top-20 z-[80] max-w-sm rounded-2xl border border-emerald-400/30 bg-[#02130b]/95 p-4 text-xs font-semibold text-white shadow-2xl backdrop-blur-xl"
        >
          {notificationToast}
        </div>
      )}
    </header>
  );
}

function NotificationDropdown({
  id,
  notifications,
  unreadCount,
  openNotification,
  markAll,
  close,
}: {
  id: string;
  notifications: Notification[];
  unreadCount: number;
  openNotification: (notification: Notification) => Promise<void>;
  markAll: () => Promise<void>;
  close: () => void;
}) {
  return (
    <div
      id={id}
      className="absolute right-0 top-full z-[70] mt-2 w-[min(24rem,calc(100vw-1rem))] overflow-hidden rounded-3xl border border-white/15 bg-slate-950/95 shadow-2xl backdrop-blur-2xl"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <h2 className="font-bold text-white">Notifications</h2>
          <p className="text-[11px] text-emerald-400">{unreadCount} unread</p>
        </div>
        <button
          type="button"
          disabled={!unreadCount}
          onClick={() => void markAll()}
          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 disabled:opacity-40"
        >
          <CheckCheck className="h-3.5 w-3.5" /> Mark all read
        </button>
      </div>
      <div className="max-h-[min(26rem,60vh)] overflow-y-auto">
        {notifications.length ? (
          notifications.slice(0, 8).map((notification) => {
            const Icon = notificationIcon(notification.type);
            return (
              <button
                key={notification._id}
                type="button"
                onClick={() => void openNotification(notification)}
                className={`flex w-full gap-3 border-b border-white/5 px-4 py-3 text-left transition hover:bg-white/5 ${
                  notification.isRead ? 'opacity-70' : 'bg-emerald-950/30'
                }`}
              >
                <span className="relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className="line-clamp-1 text-xs font-bold text-white">{notification.title}</span>
                    <span className="shrink-0 text-[10px] text-slate-400">{relativeTime(notification.createdAt)}</span>
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-slate-300">
                    {notification.message}
                  </span>
                </span>
              </button>
            );
          })
        ) : (
          <div className="px-5 py-8 text-center text-xs text-slate-400">You’re all caught up!</div>
        )}
      </div>
      <Link
        href="/notifications"
        onClick={close}
        className="block border-t border-white/10 px-4 py-2.5 text-center text-xs font-bold text-emerald-400 hover:underline"
      >
        View all notifications
      </Link>
    </div>
  );
}

function UserDropdown({
  id,
  user,
  universityName,
  totalUnread,
  close,
  logout,
}: {
  id: string;
  user: NonNullable<ReturnType<typeof useAuth>['user']>;
  universityName: string;
  totalUnread: number;
  close: () => void;
  logout: () => Promise<void>;
}) {
  const dashboardHref = user.role === 'admin' ? '/admin' : '/dashboard';
  const linkClass =
    'flex min-h-9 items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition';

  return (
    <div
      id={id}
      className="absolute right-0 top-full z-[70] mt-2 w-64 overflow-hidden rounded-2xl border border-white/15 bg-slate-950/95 py-2 shadow-2xl backdrop-blur-2xl"
    >
      <div className="border-b border-white/10 px-4 py-3">
        <p className="truncate font-bold text-white text-sm">{user.name}</p>
        <p className="truncate text-xs text-slate-400">{user.email}</p>
        <p className="mt-0.5 truncate text-[11px] font-semibold text-emerald-400">{universityName}</p>
        <div className="mt-2">
          {user.role === 'admin' ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/20 px-2.5 py-0.5 text-[10px] font-bold text-purple-300">
              <Shield className="h-3 w-3" /> Administrator
            </span>
          ) : isVerifiedStudent(user) ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
              <BadgeCheck className="h-3 w-3" /> Verified Student
            </span>
          ) : (
            <Link
              href="/verify"
              onClick={close}
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 hover:underline"
            >
              <ShieldAlert className="h-3 w-3" /> Verify Student Status
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-0.5 px-2 py-2">
        <Link href="/my-books" onClick={close} className={linkClass}>
          <BookOpen className="h-3.5 w-3.5 text-emerald-400" /> My Books
        </Link>
        <Link href="/orders" onClick={close} className={linkClass}>
          <ClipboardList className="h-3.5 w-3.5 text-emerald-400" /> Orders
        </Link>
        <Link href="/wishlist" onClick={close} className={linkClass}>
          <Heart className="h-3.5 w-3.5 text-rose-400" /> Wishlist
        </Link>
        <Link href="/exchanges" onClick={close} className={linkClass}>
          <ArrowLeftRight className="h-3.5 w-3.5 text-amber-400" /> Exchanges
        </Link>
        <Link href="/donations" onClick={close} className={linkClass}>
          <HeartHandshake className="h-3.5 w-3.5 text-emerald-400" /> Donations
        </Link>
        <Link href="/messages" onClick={close} className={linkClass}>
          <MessageCircle className="h-3.5 w-3.5 text-emerald-400" /> Messages
          {totalUnread > 0 && (
            <span className="ml-auto rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-slate-950">
              {totalUnread}
            </span>
          )}
        </Link>
      </div>

      <div className="mx-3 border-t border-white/10" />

      <div className="space-y-0.5 px-2 py-2">
        {user.role === 'admin' && (
          <Link
            href="/admin"
            onClick={close}
            className="flex min-h-9 items-center gap-2.5 rounded-xl bg-purple-900/40 px-3 py-2 text-xs font-bold text-purple-300 hover:bg-purple-900/60 hover:text-white transition"
          >
            <Shield className="h-3.5 w-3.5 text-purple-400" /> Admin panel
          </Link>
        )}
        <Link href={dashboardHref} onClick={close} className={linkClass}>
          <LayoutDashboard className="h-3.5 w-3.5 text-purple-400" /> Dashboard
        </Link>
        <Link href="/profile" onClick={close} className={linkClass}>
          <UserIcon className="h-3.5 w-3.5 text-slate-400" /> Profile
        </Link>
        <Link href="/settings" onClick={close} className={linkClass}>
          <Settings className="h-3.5 w-3.5 text-slate-400" /> Settings
        </Link>
      </div>

      <div className="mx-3 border-t border-white/10" />

      <div className="px-2 pt-2">
        <button
          type="button"
          onClick={() => {
            close();
            void logout();
          }}
          className="flex min-h-9 w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/30 transition"
        >
          <LogOut className="h-3.5 w-3.5" /> Logout
        </button>
      </div>
    </div>
  );
}
