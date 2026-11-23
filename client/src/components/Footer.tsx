'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  if (pathname === '/messages' || pathname?.startsWith('/messages/')) {
    return null;
  }

  return (
    <footer className="border-t border-card-border bg-card/40 backdrop-blur-md text-text text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="bg-accent text-btn-primary-text p-2 rounded-xl shadow-sm">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg text-heading">CampusBook</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              The peer-to-peer textbook marketplace and exchange network built exclusively for university students.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-accent pt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Campus verified student community</span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-heading font-semibold text-xs tracking-wider uppercase mb-3">Marketplace</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/explore" className="text-muted hover:text-heading transition">Explore Books</Link></li>
              <li><Link href="/sell" className="text-muted hover:text-heading transition">Sell a Book</Link></li>
              <li><Link href="/explore?listingType=exchange" className="text-muted hover:text-heading transition">Book Exchange</Link></li>
              <li><Link href="/explore?listingType=donate" className="text-muted hover:text-heading transition">Free Donations</Link></li>
            </ul>
          </div>

          {/* Student resources */}
          <div>
            <h4 className="text-heading font-semibold text-xs tracking-wider uppercase mb-3">Student resources</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/explore" className="text-muted hover:text-heading transition">Browse categories</Link></li>
              <li><Link href="/exchange-matches" className="text-muted hover:text-heading transition">Exchange matches</Link></li>
              <li><Link href="/messages" className="text-muted hover:text-heading transition">Messages</Link></li>
              <li><Link href="/dashboard" className="text-muted hover:text-heading transition">Student dashboard</Link></li>
            </ul>
          </div>

          {/* Guidelines */}
          <div>
            <h4 className="text-heading font-semibold text-xs tracking-wider uppercase mb-3">Safety & Trust</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/signup" className="text-muted hover:text-heading transition">Student verification</Link></li>
              <li><Link href="/explore" className="text-muted hover:text-heading transition">Fair campus pricing</Link></li>
              <li><Link href="/messages" className="text-muted hover:text-heading transition">Arrange a safe handover</Link></li>
              <li><Link href="/profile" className="text-muted hover:text-heading transition">Your profile</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-card-border flex flex-col sm:flex-row items-center justify-between text-xs text-muted gap-4">
          <p>© {new Date().getFullYear()} CampusBook. Built for university students.</p>
          <div className="flex items-center gap-1 text-muted">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 inline fill-rose-500" />
            <span>for students everywhere.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
