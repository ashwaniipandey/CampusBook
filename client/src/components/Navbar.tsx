'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeftRight,
  BadgeCheck,
  Bell,
  BookOpen,
  CheckCheck,
  ChevronDown,
  ClipboardList,
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
  const hours = Math.floor(minutes / 60);
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
      if (mobilePanelRef.current && !mobilePanelRef.current.contains(target) &&
          mobileMenuTriggerRef.current && !mobileMenuTriggerRef.current.contains(target)) {
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

  const isActive = (href: string) =>
    href === '/explore'
      ? pathname === '/explore'
      : pathname === href || pathname.startsWith(`${href}/`);

  const desktopNavClass = (href: string, active = isActive(href)) =>
    `inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-campus-500 ${
      active
        ? 'bg-campus-50 text-campus-800 dark:bg-campus-900/40 dark:text-campus-200'
        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white'
    }`;

  const menuLinkClass = (href: string, emphasized = false, active = isActive(href)) =>
    `flex min-h-10 items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-campus-500 ${
      emphasized
        ? 'bg-campus-50 font-semibold text-campus-800 hover:bg-campus-100 dark:bg-campus-900/40 dark:text-campus-200 dark:hover:bg-campus-900/60'
        : active
          ? 'bg-campus-50 font-semibold text-campus-800 dark:bg-campus-900/40 dark:text-campus-200'
          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
    }`;

  const iconButtonClass =
    'relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-campus-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-campus-500 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-campus-300';

  const renderIconLink = (
    href: string,
    label: string,
    Icon: typeof Heart,
    badge?: number,
    badgeTone: 'green' | 'rose' = 'green'
  ) => (
    <Link
      href={actionHref(href)}
      aria-label={badge !== undefined && badge > 0 ? `${label}, ${badge} unread` : label}
      title={label}
      className={`${iconButtonClass} ${isActive(href) ? 'bg-campus-50 text-campus-800' : ''}`}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      {badge !== undefined && badge > 0 && (
        <span className={`absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${
          badgeTone === 'rose' ? 'bg-rose-600' : 'bg-campus-600'
        }`}>
          {countLabel(badge)}
        </span>
      )}
    </Link>
  );

  const renderMenuLinks = (closeMenu: () => void) => (
    <>
      <Link href="/explore" onClick={closeMenu} className={menuLinkClass('/explore')}>
        <Search className="h-4 w-4 text-slate-500" aria-hidden="true" /> Explore
      </Link>
      <Link href="/explore?listingType=exchange" onClick={closeMenu} className={menuLinkClass('/explore', false, false)}>
        <ArrowLeftRight className="h-4 w-4 text-amber-500" aria-hidden="true" /> Exchange
      </Link>
      <Link href="/explore?listingType=donate" onClick={closeMenu} className={menuLinkClass('/explore', false, false)}>
        <HeartHandshake className="h-4 w-4 text-emerald-600" aria-hidden="true" /> Free Donations
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full overflow-x-clip border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto max-w-7xl px-3 sm:px-5 lg:px-8">
        <div className="flex h-16 min-w-0 items-center justify-between gap-2 whitespace-nowrap">
          <Link href="/" aria-label="CampusBook home" className="group flex shrink-0 items-center gap-2">
            <span className="rounded-xl bg-campus-600 p-2 text-white shadow-sm transition group-hover:bg-campus-700">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="hidden text-lg font-bold tracking-tight text-slate-900 min-[360px]:inline sm:text-xl dark:text-white">
              Campus<span className="text-campus-600">Book</span>
            </span>
          </Link>

          <nav aria-label="Main navigation" className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
            <Link href="/explore" aria-current={isActive('/explore') ? 'page' : undefined} className={desktopNavClass('/explore')}>
              <Search className="h-4 w-4 text-slate-500" aria-hidden="true" /> Explore
            </Link>
            <Link href="/explore?listingType=exchange" className={desktopNavClass('/explore', false)}>
              <ArrowLeftRight className="h-4 w-4 text-amber-500" aria-hidden="true" /> Exchange
            </Link>
            <Link href="/explore?listingType=donate" className={desktopNavClass('/explore', false)}>
              <HeartHandshake className="h-4 w-4 text-emerald-600" aria-hidden="true" /> Free Donations
            </Link>
            <div className="relative shrink-0" ref={searchRef}>
              <button
                type="button"
                ref={searchTriggerRef}
                onClick={() => setSearchOpen((open) => !open)}
                aria-label={searchOpen ? 'Close book search' : 'Open book search'}
                aria-expanded={searchOpen}
                aria-controls={searchOpen ? 'navbar-search-panel' : undefined}
                title="Search books"
                className={`${iconButtonClass} ${searchOpen ? 'bg-campus-50 text-campus-800' : ''}`}
              >
                {searchOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Search className="h-5 w-5" aria-hidden="true" />}
              </button>
              {searchOpen && (
                <div id="navbar-search-panel" className="absolute right-0 top-full z-[70] mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
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
          </nav>

          <div className="hidden shrink-0 items-center gap-1 lg:flex">
            {renderIconLink('/wishlist', 'Wishlist', Heart)}
            {renderIconLink('/messages', 'Messages', MessageCircle, totalUnread)}
            {isAuthenticated ? (
              <div className="relative" ref={notificationDesktopRef}>
                <button
                  type="button"
                  ref={notificationDesktopTriggerRef}
                  onClick={() => setNotificationDropdownOpen((open) => !open)}
                  aria-label={`Notifications, ${unreadNotificationCount} unread`}
                  aria-expanded={notificationDropdownOpen}
                  aria-controls={notificationDropdownOpen ? 'navbar-notifications-desktop' : undefined}
                  title="Notifications"
                  className={iconButtonClass}
                >
                  <Bell className="h-5 w-5" aria-hidden="true" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                      {countLabel(unreadNotificationCount)}
                    </span>
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
            ) : (
              <Link href="/login" aria-label="Sign in to view notifications" title="Notifications" className={iconButtonClass}>
                <Bell className="h-5 w-5" aria-hidden="true" />
              </Link>
            )}
            {renderIconLink('/cart', 'Cart', ShoppingCart, isAuthenticated ? cartCount : undefined)}
            <ThemeToggle />
            <Link
              href={sellHref}
              className="inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl bg-campus-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-campus-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-campus-500 focus-visible:ring-offset-2 xl:px-4"
            >
              <PlusCircle className="h-4 w-4" aria-hidden="true" /> Sell a Book
            </Link>
            {isAuthenticated && user ? (
              <div className="relative shrink-0" ref={userMenuRef}>
                <button
                  type="button"
                  ref={userMenuTriggerRef}
                  onClick={() => setUserDropdownOpen((open) => !open)}
                  aria-label={`Account menu for ${user.name}`}
                  aria-expanded={userDropdownOpen}
                  aria-controls={userDropdownOpen ? 'navbar-user-menu' : undefined}
                  title={user.name}
                  className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 p-1 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-campus-500 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-campus-200 bg-campus-100 text-xs font-bold text-campus-800 dark:border-campus-800 dark:bg-campus-900 dark:text-campus-200">
                    {user.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : getInitials(user.name)}
                    {isVerifiedStudent(user) && <BadgeCheck className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-white text-campus-600 dark:bg-slate-900" aria-label="Verified student" />}
                  </span>
                  <span className="hidden max-w-24 truncate text-xs font-semibold text-slate-800 xl:block dark:text-slate-100">{user.name}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                </button>
                {userDropdownOpen && <UserDropdown id="navbar-user-menu" user={user} universityName={universityName} close={() => setUserDropdownOpen(false)} logout={logout} />}
              </div>
            ) : (
              <Link href="/login" className="inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-campus-500 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                Sign In
              </Link>
            )}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1 lg:hidden">
            {isAuthenticated ? (
              <>
                {renderIconLink('/messages', 'Messages', MessageCircle, totalUnread)}
                <div className="relative" ref={notificationCompactRef}>
                  <button
                    type="button"
                    ref={notificationCompactTriggerRef}
                    onClick={() => setNotificationDropdownOpen((open) => !open)}
                    aria-label={`Notifications, ${unreadNotificationCount} unread`}
                    aria-expanded={notificationDropdownOpen}
                    aria-controls={notificationDropdownOpen ? 'navbar-notifications-compact' : undefined}
                    title="Notifications"
                    className={iconButtonClass}
                  >
                    <Bell className="h-5 w-5" aria-hidden="true" />
                    {unreadNotificationCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                        {countLabel(unreadNotificationCount)}
                      </span>
                    )}
                  </button>
                  {notificationDropdownOpen && (
                    <NotificationDropdown
                      id="navbar-notifications-compact"
                      notifications={notifications}
                      unreadCount={unreadNotificationCount}
                      openNotification={openNotification}
                      markAll={markAllFromBell}
                      close={() => setNotificationDropdownOpen(false)}
                    />
                  )}
                </div>
                {renderIconLink('/cart', 'Cart', ShoppingCart, cartCount)}
              </>
            ) : (
              <>
                <Link href="/login?redirect=%2Fmessages" aria-label="Sign in to view messages" title="Messages" className={iconButtonClass}>
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />
                </Link>
                <Link href="/login" aria-label="Sign in to view notifications" title="Notifications" className={iconButtonClass}>
                  <Bell className="h-5 w-5" aria-hidden="true" />
                </Link>
                <Link href="/login?redirect=%2Fcart" aria-label="Sign in to view cart" title="Cart" className={iconButtonClass}>
                  <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                </Link>
              </>
            )}
            <span className="hidden sm:block">
              <ThemeToggle />
            </span>
            <button
              type="button"
              ref={mobileMenuTriggerRef}
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls={mobileMenuOpen ? 'navbar-mobile-menu' : undefined}
              className={`${iconButtonClass} ml-1`}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          id="navbar-mobile-menu"
          ref={mobilePanelRef}
          className="absolute left-0 right-0 top-full z-[60] max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-slate-200 bg-white px-4 py-4 shadow-xl dark:border-slate-800 dark:bg-slate-950 lg:hidden sm:px-6"
        >
          <div className="mb-3">
            <SearchAutocomplete
              value={searchValue}
              onChange={setSearchValue}
              inputClassName="py-3"
              placeholder="Search books, authors, or ISBN..."
            />
          </div>
          <nav aria-label="Mobile navigation" className="space-y-1">
            {renderMenuLinks(() => setMobileMenuOpen(false))}
            {isAuthenticated && user && (
              <>
                <div className="my-3 border-t border-slate-200 dark:border-slate-800" />
              </>
            )}
            <Link href={actionHref('/wishlist')} onClick={() => setMobileMenuOpen(false)} className={menuLinkClass('/wishlist')}>
                  <Heart className="h-4 w-4 text-rose-500" aria-hidden="true" /> Wishlist
            </Link>
            <Link href={actionHref('/messages')} onClick={() => setMobileMenuOpen(false)} className={`${menuLinkClass('/messages')} justify-between`}>
              <span className="flex items-center gap-3"><MessageCircle className="h-4 w-4 text-campus-600" aria-hidden="true" /> Messages</span>
              {isAuthenticated && totalUnread > 0 && <CountBadge count={totalUnread} />}
            </Link>
            <Link href={actionHref('/notifications')} onClick={() => setMobileMenuOpen(false)} className={`${menuLinkClass('/notifications')} justify-between`}>
              <span className="flex items-center gap-3"><Bell className="h-4 w-4 text-campus-600" aria-hidden="true" /> Notifications</span>
              {isAuthenticated && unreadNotificationCount > 0 && <CountBadge count={unreadNotificationCount} />}
            </Link>
            <Link href={actionHref('/cart')} onClick={() => setMobileMenuOpen(false)} className={`${menuLinkClass('/cart')} justify-between`}>
              <span className="flex items-center gap-3"><ShoppingCart className="h-4 w-4 text-campus-600" aria-hidden="true" /> Cart</span>
              {isAuthenticated && cartCount > 0 && <CountBadge count={cartCount} />}
            </Link>
            {isAuthenticated && user && (
              <>
                <Link href="/orders" onClick={() => setMobileMenuOpen(false)} className={menuLinkClass('/orders')}>
                  <ClipboardList className="h-4 w-4 text-campus-600" aria-hidden="true" /> Orders
                </Link>
                <Link href="/my-books" onClick={() => setMobileMenuOpen(false)} className={menuLinkClass('/my-books')}>
                  <BookOpen className="h-4 w-4 text-campus-600" aria-hidden="true" /> My Books
                </Link>
                <Link href="/exchanges" onClick={() => setMobileMenuOpen(false)} className={menuLinkClass('/exchanges')}>
                  <ArrowLeftRight className="h-4 w-4 text-amber-500" aria-hidden="true" /> Exchanges
                </Link>
                {user.role !== 'admin' && (
                  <Link href="/exchange-matches" onClick={() => setMobileMenuOpen(false)} className={menuLinkClass('/exchange-matches')}>
                    <Sparkles className="h-4 w-4 text-amber-500" aria-hidden="true" /> Matches
                  </Link>
                )}
                <Link href="/donations" onClick={() => setMobileMenuOpen(false)} className={menuLinkClass('/donations')}>
                  <HeartHandshake className="h-4 w-4 text-emerald-600" aria-hidden="true" /> Donations
                </Link>
                <div className="my-3 border-t border-slate-200 dark:border-slate-800" />
                <Link href={user.role === 'admin' ? '/admin' : '/dashboard'} onClick={() => setMobileMenuOpen(false)} className={menuLinkClass(user.role === 'admin' ? '/admin' : '/dashboard')}>
                  <LayoutDashboard className="h-4 w-4 text-campus-600" aria-hidden="true" /> Dashboard
                </Link>
                <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className={menuLinkClass('/profile')}>
                  <UserIcon className="h-4 w-4 text-campus-600" aria-hidden="true" /> Profile
                </Link>
                <Link href="/settings" onClick={() => setMobileMenuOpen(false)} className={menuLinkClass('/settings')}>
                  <Settings className="h-4 w-4 text-slate-500" aria-hidden="true" /> Settings
                </Link>
                <button type="button" onClick={() => { setMobileMenuOpen(false); void logout(); }} className="flex min-h-10 w-full items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-700 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-campus-500 dark:text-rose-300 dark:hover:bg-rose-950/30">
                  <LogOut className="h-4 w-4" aria-hidden="true" /> Logout
                </button>
              </>
            )}
            <div className="my-3 border-t border-slate-200" />
            <Link href={sellHref} onClick={() => setMobileMenuOpen(false)} className="flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-campus-600 px-4 py-2 text-sm font-semibold text-white hover:bg-campus-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-campus-500">
              <PlusCircle className="h-4 w-4" aria-hidden="true" /> Sell a Book
            </Link>
            {!isAuthenticated && (
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="mt-2 flex min-h-10 items-center justify-center whitespace-nowrap rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                Sign In
              </Link>
            )}
            <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Appearance</span>
              <ThemeToggle />
            </div>
          </nav>
        </div>
      )}

      {notificationToast && (
        <div role="status" className="fixed right-4 top-20 z-[80] max-w-sm rounded-xl border border-campus-200 bg-white px-4 py-3 text-sm font-semibold text-campus-800 shadow-lg dark:border-campus-800 dark:bg-slate-900 dark:text-campus-200">
          {notificationToast}
        </div>
      )}
    </header>
  );
}

function CountBadge({ count }: { count: number }) {
  return <span className="rounded-full bg-campus-600 px-2 py-0.5 text-[10px] font-bold text-white">{countLabel(count)}</span>;
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
    <div id={id} className="absolute right-0 top-full z-[70] mt-2 w-[min(24rem,calc(100vw-1rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div>
          <h2 className="font-bold text-slate-900 dark:text-slate-100">Notifications</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{unreadCount} unread</p>
        </div>
        <button
          type="button"
          disabled={!unreadCount}
          onClick={() => void markAll()}
          className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-bold text-campus-700 hover:text-campus-900 disabled:cursor-not-allowed disabled:opacity-40 dark:text-campus-300 dark:hover:text-campus-200"
        >
          <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" /> Mark all read
        </button>
      </div>
      <div className="max-h-[min(28rem,65vh)] overflow-y-auto">
        {notifications.length ? notifications.slice(0, 8).map((notification) => {
          const Icon = notificationIcon(notification.type);
          return (
            <button
              key={notification._id}
              type="button"
              onClick={() => void openNotification(notification)}
              className={`flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-campus-50 dark:border-slate-800 dark:hover:bg-slate-800 ${
                notification.isRead ? 'bg-white dark:bg-slate-900' : 'bg-campus-50/60 dark:bg-campus-950/30'
              }`}
            >
              <span className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-campus-100 text-campus-700 dark:bg-campus-900 dark:text-campus-300">
                <Icon className="h-4 w-4" aria-hidden="true" />
                {!notification.isRead && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-campus-600" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                  <span className="line-clamp-1 text-sm font-bold text-slate-900 dark:text-slate-100">{notification.title}</span>
                  <span className="shrink-0 text-[10px] text-slate-400 dark:text-slate-500">{relativeTime(notification.createdAt)}</span>
                </span>
                <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-600 dark:text-slate-300">{notification.message}</span>
              </span>
            </button>
          );
        }) : (
          <div className="px-5 py-10 text-center">
            <Bell className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
            <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">You’re all caught up</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">New activity will appear here.</p>
          </div>
        )}
      </div>
      <Link href="/notifications" onClick={close} className="block border-t border-slate-100 px-4 py-3 text-center text-sm font-bold text-campus-700 hover:bg-campus-50 dark:border-slate-800 dark:text-campus-300 dark:hover:bg-slate-800">
        View all notifications
      </Link>
    </div>
  );
}

function UserDropdown({
  id,
  user,
  universityName,
  close,
  logout,
}: {
  id: string;
  user: NonNullable<ReturnType<typeof useAuth>['user']>;
  universityName: string;
  close: () => void;
  logout: () => Promise<void>;
}) {
  const dashboardHref = user.role === 'admin' ? '/admin' : '/dashboard';
  const linkClass = 'flex min-h-9 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-campus-500 dark:text-slate-200 dark:hover:bg-slate-800';
  const navLink = (href: string, label: string, Icon: typeof BookOpen, color: string) => (
    <Link href={href} onClick={close} className={linkClass}>
      <Icon className={`h-4 w-4 ${color}`} aria-hidden="true" /> {label}
    </Link>
  );

  return (
    <div id={id} className="absolute right-0 top-full z-[70] mt-2 max-h-[min(80vh,42rem)] w-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white py-2 text-sm shadow-xl dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
        <p className="mt-0.5 truncate text-[11px] font-medium text-campus-700">{universityName}</p>
        <div className="mt-2">
          {user.role === 'admin' ? (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700">
              <Shield className="h-3.5 w-3.5" aria-hidden="true" /> Platform Administrator
            </span>
          ) : isVerifiedStudent(user) ? (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
              <BadgeCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" /> Verified Student
            </span>
          ) : (
            <Link href="/verify" onClick={close} className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" /> Verify Student Status
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-0.5 px-2 py-2">
        {navLink('/my-books', 'My Books', BookOpen, 'text-campus-600')}
        {navLink('/orders', 'Orders', ClipboardList, 'text-campus-600')}
        {navLink('/wishlist', 'Wishlist', Heart, 'text-rose-500')}
        {navLink('/exchanges', 'Exchanges', ArrowLeftRight, 'text-amber-500')}
        {user.role !== 'admin' && navLink('/exchange-matches', 'Matches', Sparkles, 'text-amber-500')}
        {navLink('/donations', 'Donations', HeartHandshake, 'text-emerald-600')}
      </div>

      <div className="mx-3 border-t border-slate-100 dark:border-slate-800" />
      <div className="space-y-0.5 px-2 py-2">
        {navLink(dashboardHref, 'Dashboard', user.role === 'admin' ? Shield : LayoutDashboard, user.role === 'admin' ? 'text-purple-600' : 'text-campus-600')}
        {navLink('/profile', 'Profile', UserIcon, 'text-campus-600')}
        {navLink('/settings', 'Settings', Settings, 'text-slate-500')}
      </div>

      <div className="mx-3 border-t border-slate-100 dark:border-slate-800" />
      <div className="px-2 pt-2">
        <button type="button" onClick={() => { close(); void logout(); }} className={`${linkClass} w-full text-left text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/30`}>
          <LogOut className="h-4 w-4" aria-hidden="true" /> Logout
        </button>
      </div>
    </div>
  );
}
