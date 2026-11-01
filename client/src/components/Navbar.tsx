'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  ArrowLeftRight,
  HeartHandshake,
  PlusCircle,
  Heart,
  ShoppingCart,
  ClipboardList,
  Menu,
  X,
  BadgeCheck,
  ShieldAlert,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  Shield,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout, cartCount } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
            <Link
              href="/explore"
              className="px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1.5"
            >
              <Search className="w-4 h-4 text-slate-500" />
              Explore
            </Link>
            <Link
              href="/#exchange"
              className="px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1.5"
            >
              <ArrowLeftRight className="w-4 h-4 text-amber-500" />
              Exchange
            </Link>
            <Link
              href="/#donations"
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
          </nav>

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
          <Link
            href="/explore"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700"
          >
            <Search className="w-4 h-4" /> Explore Books
          </Link>
          <Link
            href="/#exchange"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700"
          >
            <ArrowLeftRight className="w-4 h-4 text-amber-500" /> Exchange
          </Link>
          <Link
            href="/#donations"
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
    </header>
  );
}
