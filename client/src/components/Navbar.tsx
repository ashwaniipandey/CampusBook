'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  BookOpen,
  Search,
  ArrowLeftRight,
  HeartHandshake,
  PlusCircle,
  Heart,
  ShoppingCart,
  ClipboardList,
  MessageCircle,
  Menu,
  X,
  BadgeCheck,
  ShieldAlert,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  Shield,
  ChevronDown,
  CheckCheck,
  PackageCheck,
  Star,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { Notification } from '@/types';
import SearchAutocomplete from '@/components/SearchAutocomplete';

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

export default function Navbar() {
  const router = useRouter();
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
  const [notificationToast, setNotificationToast] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const universityName =
    typeof user?.university === 'object' && user.university
      ? user.university.name
      : 'Campus Member';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="bg-campus-600 text-white p-2 rounded-xl shadow-sm group-hover:bg-campus-700 transition">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">
              Campus<span className="text-campus-600">Book</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 text-sm font-medium text-slate-700">
            <div className="hidden xl:block w-48">
              <SearchAutocomplete
                value={searchValue}
                onChange={setSearchValue}
                inputClassName="py-2 text-xs"
                placeholder="Search books..."
              />
            </div>
            <Link
              href="/explore"
              className="px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1.5"
            >
              <Search className="w-4 h-4 text-slate-500" />
              Explore
            </Link>
            <Link
              href="/explore?listingType=exchange"
              className="px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1.5"
            >
              <ArrowLeftRight className="w-4 h-4 text-amber-500" />
              Exchange
            </Link>
            <Link
              href="/explore?listingType=donate"
              className="px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1.5"
            >
              <HeartHandshake className="w-4 h-4 text-emerald-500" />
              Free Donations
            </Link>
            {isAuthenticated && (
              <Link
                href="/my-books"
                className="px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1.5"
              >
                <BookOpen className="w-4 h-4 text-campus-600" />
                My Books
              </Link>
            )}
            {isAuthenticated && user?.role !== 'admin' && (
              <Link
                href="/exchange-matches"
                className="px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                Matches
              </Link>
            )}
            {isAuthenticated && (
              <Link
                href="/wishlist"
                className="px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1.5"
              >
                <Heart className="w-4 h-4 text-rose-500" />
                Wishlist
              </Link>
            )}
            {isAuthenticated && (
              <Link
                href="/orders"
                className="px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1.5"
              >
                <ClipboardList className="w-4 h-4 text-campus-600" />
                Orders
              </Link>
            )}
            {isAuthenticated && (
              <Link
                href="/messages"
                aria-label={`Messages, ${totalUnread} unread`}
                className="relative px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4 text-campus-600" />
                Messages
                {totalUnread > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-campus-600 px-1 text-[9px] font-bold text-white">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                )}
              </Link>
            )}
          </nav>

          {isAuthenticated && (
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() => setNotificationDropdownOpen((open) => !open)}
                aria-label={`Notifications, ${unreadNotificationCount} unread`}
                aria-expanded={notificationDropdownOpen}
                className="relative rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-campus-700"
              >
                <Bell className="h-5 w-5" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                    {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                  </span>
                )}
              </button>
              {notificationDropdownOpen && (
                <div className="absolute right-0 top-full z-[65] mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div>
                      <h2 className="font-bold text-slate-900">Notifications</h2>
                      <p className="text-xs text-slate-500">{unreadNotificationCount} unread</p>
                    </div>
                    <button
                      type="button"
                      disabled={!unreadNotificationCount}
                      onClick={() => void markAllFromBell()}
                      className="inline-flex items-center gap-1 text-xs font-bold text-campus-700 hover:text-campus-900 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Mark all read
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
                          className={`flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-campus-50 ${
                            notification.isRead ? 'bg-white' : 'bg-campus-50/60'
                          }`}
                        >
                          <span className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-campus-100 text-campus-700">
                            <Icon className="h-4 w-4" />
                            {!notification.isRead && (
                              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-campus-600" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-start justify-between gap-2">
                              <span className="line-clamp-1 text-sm font-bold text-slate-900">{notification.title}</span>
                              <span className="shrink-0 text-[10px] text-slate-400">{relativeTime(notification.createdAt)}</span>
                            </span>
                            <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-600">{notification.message}</span>
                          </span>
                        </button>
                      );
                    }) : (
                      <div className="px-5 py-10 text-center">
                        <Bell className="mx-auto h-8 w-8 text-slate-300" />
                        <p className="mt-2 text-sm font-semibold text-slate-700">You’re all caught up</p>
                        <p className="mt-1 text-xs text-slate-500">New activity will appear here.</p>
                      </div>
                    )}
                  </div>
                  <Link
                    href="/notifications"
                    onClick={() => setNotificationDropdownOpen(false)}
                    className="block border-t border-slate-100 px-4 py-3 text-center text-sm font-bold text-campus-700 hover:bg-campus-50"
                  >
                    View all notifications
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* User Auth & Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated && (
              <Link
                href="/cart"
                aria-label={`Shopping cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
                className="relative rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-campus-700"
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-campus-600 px-1 text-[10px] font-bold text-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              </Link>
            )}
            <Link
              href={isAuthenticated ? '/sell' : '/login?redirect=/sell'}
              className="inline-flex items-center gap-1.5 bg-campus-600 hover:bg-campus-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" />
              Sell a Book
            </Link>

            {isAuthenticated && user ? (
              /* Logged In User Avatar Dropdown */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-slate-100 border border-slate-200 transition"
                  aria-expanded={userDropdownOpen}
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-lg bg-campus-100 text-campus-700 font-bold text-xs flex items-center justify-center border border-campus-200 shadow-2xs">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full rounded-lg object-cover"
                      />
                    ) : (
                      getInitials(user.name)
                    )}
                  </div>

                  {/* Name & Badge Preview */}
                  <div className="text-left hidden lg:block">
                    <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                      <span className="truncate max-w-[110px]">{user.name}</span>
                      {user.role === 'admin' ? (
                        <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.2 rounded">
                          ADMIN
                        </span>
                      ) : user.isVerified ? (
                        <span title="Verified Student">
                          <BadgeCheck className="w-3.5 h-3.5 text-campus-600 fill-campus-100 inline" />
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 text-sm z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="font-semibold text-slate-900 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      <p className="text-[11px] text-campus-600 font-medium truncate mt-0.5">
                        {universityName}
                      </p>

                      {/* Verification Status Banner */}
                      <div className="mt-2">
                        {user.role === 'admin' ? (
                          <div className="flex items-center gap-1.5 text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded-md font-medium">
                            <Shield className="w-3.5 h-3.5" />
                            Platform Administrator
                          </div>
                        ) : user.isVerified ? (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md font-medium">
                            <BadgeCheck className="w-4 h-4 text-emerald-600" />
                            Verified Student
                          </div>
                        ) : (
                          <Link
                            href="/verify-otp"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center justify-between text-xs text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-1.5 rounded-md font-medium transition"
                          >
                            <span className="flex items-center gap-1">
                              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                              Unverified Student
                            </span>
                            <span className="underline text-[10px] text-amber-900">Verify</span>
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Navigation Items */}
                    <div className="py-1">
                      {user.role === 'admin' ? (
                        <Link
                          href="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                        >
                          <Shield className="w-4 h-4 text-purple-600" />
                          Admin Console
                        </Link>
                      ) : (
                        <Link
                          href="/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                        >
                          <LayoutDashboard className="w-4 h-4 text-campus-600" />
                          Student Dashboard
                        </Link>
                      )}

                      <Link
                        href="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <UserIcon className="w-4 h-4 text-campus-600" />
                        Profile
                      </Link>

                      <Link
                        href="/settings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <Settings className="w-4 h-4 text-slate-500" />
                        Settings
                      </Link>

                      <Link
                        href="/sell"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <PlusCircle className="w-4 h-4 text-campus-600" />
                        Sell a Book
                      </Link>

                      <Link
                        href="/my-books"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <BookOpen className="w-4 h-4 text-campus-600" />
                        My Books
                      </Link>

                      <Link
                        href="/wishlist"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <Heart className="w-4 h-4 text-rose-500" />
                        Wishlist
                      </Link>

                      <Link
                        href="/orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <ClipboardList className="w-4 h-4 text-campus-600" />
                        Orders
                      </Link>

                      <Link
                        href="/messages"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center justify-between gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <span className="flex items-center gap-2.5">
                          <MessageCircle className="w-4 h-4 text-campus-600" />
                          Messages
                        </span>
                        {totalUnread > 0 && (
                          <span className="rounded-full bg-campus-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {totalUnread > 99 ? '99+' : totalUnread}
                          </span>
                        )}
                      </Link>

                      <Link
                        href="/exchanges"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <ArrowLeftRight className="w-4 h-4 text-amber-500" />
                        Exchanges
                      </Link>

                      {user.role !== 'admin' && (
                        <Link
                          href="/exchange-matches"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                        >
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          Exchange Matches
                        </Link>
                      )}

                      <Link
                        href="/donations"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <HeartHandshake className="w-4 h-4 text-emerald-500" />
                        Donations
                      </Link>

                      {!user.isVerified && user.role !== 'admin' && (
                        <Link
                          href="/verify-otp"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-amber-700 hover:bg-amber-50"
                        >
                          <BadgeCheck className="w-4 h-4 text-amber-600" />
                          Verify Student Status
                        </Link>
                      )}
                    </div>

                    {/* Sign Out */}
                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 text-left transition"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Guest Sign In Button */
              <Link
                href="/login"
                className="text-sm font-medium text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-lg border border-slate-300 hover:border-slate-400 transition"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2 text-sm font-medium">
          <SearchAutocomplete
            value={searchValue}
            onChange={setSearchValue}
            inputClassName="py-3"
            placeholder="Search books, authors, or ISBN..."
          />
          <Link
            href="/explore"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700"
          >
            <Search className="w-4 h-4" /> Explore Books
          </Link>
          <Link
            href="/explore?listingType=exchange"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700"
          >
            <ArrowLeftRight className="w-4 h-4 text-amber-500" /> Exchange
          </Link>
          <Link
            href="/explore?listingType=donate"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700"
          >
            <HeartHandshake className="w-4 h-4 text-emerald-500" /> Free Donations
          </Link>

          {isAuthenticated && user ? (
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <div className="px-3 py-2 bg-slate-50 rounded-xl">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  {user.name}
                  {user.role === 'admin' ? (
                    <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">
                      ADMIN
                    </span>
                  ) : user.isVerified ? (
                    <span className="text-[11px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-semibold inline-flex items-center gap-0.5">
                      <BadgeCheck className="w-3 h-3" /> Verified Student
                    </span>
                  ) : (
                    <span className="text-[11px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">
                      Unverified
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500">{user.email}</div>
              </div>

              <Link
                href={user.role === 'admin' ? '/admin' : '/dashboard'}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-campus-50 text-campus-700 font-semibold"
              >
                <LayoutDashboard className="w-4 h-4" />
                {user.role === 'admin' ? 'Admin Dashboard' : 'Student Dashboard'}
              </Link>

              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
              >
                <UserIcon className="w-4 h-4 text-campus-600" /> Profile
              </Link>

              <Link
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
              >
                <Settings className="w-4 h-4 text-slate-500" /> Settings
              </Link>

              <Link
                href="/sell"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-campus-700 hover:bg-campus-50 font-medium"
              >
                <PlusCircle className="w-4 h-4 text-campus-600" /> Sell a Book
              </Link>

              <Link
                href="/my-books"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
              >
                <BookOpen className="w-4 h-4 text-campus-600" /> My Books
              </Link>

              <Link
                href="/wishlist"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
              >
                <Heart className="w-4 h-4 text-rose-500" /> Wishlist
              </Link>

              <Link
                href="/cart"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-100"
              >
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-campus-600" /> Cart
                </span>
                <span className="rounded-full bg-campus-100 px-2 py-0.5 text-xs font-bold text-campus-800">{cartCount}</span>
              </Link>

              <Link
                href="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
              >
                <ClipboardList className="w-4 h-4 text-campus-600" /> Orders
              </Link>

              <Link
                href="/messages"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
              >
                <span className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-campus-600" /> Messages
                </span>
                {totalUnread > 0 && (
                  <span className="rounded-full bg-campus-600 px-2 py-0.5 text-xs font-bold text-white">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                )}
              </Link>

              <Link
                href="/exchanges"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
              >
                <ArrowLeftRight className="w-4 h-4 text-amber-500" /> Exchanges
              </Link>

              {user.role !== 'admin' && (
                <Link
                  href="/exchange-matches"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" /> Exchange Matches
                </Link>
              )}

              <Link
                href="/donations"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
              >
                <HeartHandshake className="w-4 h-4 text-emerald-500" /> Donations
              </Link>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 font-medium"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-200 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center text-sm font-medium text-slate-700 py-2.5 rounded-lg border border-slate-300"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-1.5 bg-campus-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      )}
      {notificationToast && (
        <div role="status" className="fixed right-4 top-20 z-[80] max-w-sm rounded-xl border border-campus-200 bg-campus-50 px-4 py-3 text-sm font-semibold text-campus-900 shadow-lg">
          {notificationToast}
        </div>
      )}
    </header>
  );
}
