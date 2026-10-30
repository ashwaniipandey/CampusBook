'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Search, ArrowLeftRight, HeartHandshake, Bookmark, MessageSquare, PlusCircle, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="bg-campus-600 text-white p-2 rounded-xl shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">
              Campus<span className="text-campus-600">Book</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 text-sm font-medium text-slate-700">
            <Link
              href="#browse"
              className="px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1.5"
            >
              <Search className="w-4 h-4 text-slate-500" />
              Browse Books
            </Link>
            <Link
              href="#exchange"
              className="px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1.5"
            >
              <ArrowLeftRight className="w-4 h-4 text-amber-500" />
              Exchange
            </Link>
            <Link
              href="#donations"
              className="px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1.5"
            >
              <HeartHandshake className="w-4 h-4 text-emerald-500" />
              Free Donations
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <Link
              href="#list-book"
              className="inline-flex items-center gap-1.5 bg-campus-600 hover:bg-campus-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" />
              Post a Book
            </Link>
            <Link
              href="#signin"
              className="text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg border border-slate-300 hover:border-slate-400 transition"
            >
              Sign In
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
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

      {/* Mobile Menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2 text-sm font-medium">
          <Link
            href="#browse"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700"
          >
            <Search className="w-4 h-4" /> Browse Books
          </Link>
          <Link
            href="#exchange"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700"
          >
            <ArrowLeftRight className="w-4 h-4 text-amber-500" /> Exchange
          </Link>
          <Link
            href="#donations"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700"
          >
            <HeartHandshake className="w-4 h-4 text-emerald-500" /> Free Donations
          </Link>
          <div className="pt-2 border-t border-slate-200 flex flex-col gap-2">
            <Link
              href="#list-book"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-1.5 bg-campus-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
            >
              <PlusCircle className="w-4 h-4" /> Post a Book
            </Link>
            <Link
              href="#signin"
              onClick={() => setMobileMenuOpen(false)}
              className="text-center text-sm font-medium text-slate-700 py-2 rounded-lg border border-slate-300"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

