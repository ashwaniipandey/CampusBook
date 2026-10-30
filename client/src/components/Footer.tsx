import React from 'react';
import Link from 'next/link';
import { BookOpen, ShieldCheck, Heart, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="bg-campus-500 text-white p-2 rounded-xl">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-white">CampusBook</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              The peer-to-peer textbook marketplace and exchange network built exclusively for university students.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 pt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Campus verified student community</span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">Marketplace</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="#browse" className="hover:text-white transition">Buy Textbooks</Link></li>
              <li><Link href="#list-book" className="hover:text-white transition">Sell Used Books</Link></li>
              <li><Link href="#exchange" className="hover:text-white transition">Book Exchange</Link></li>
              <li><Link href="#donations" className="hover:text-white transition">Free Donations</Link></li>
            </ul>
          </div>

          {/* Supported Campuses */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">Campuses</h4>
            <ul className="space-y-2 text-xs">
              <li>Stanford University</li>
              <li>Massachusetts Institute of Technology</li>
              <li>UC Berkeley</li>
              <li>Harvard University</li>
              <li>University of Washington</li>
              <li>UT Austin</li>
            </ul>
          </div>

          {/* Guidelines */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">Safety & Trust</h4>
            <ul className="space-y-2 text-xs">
              <li>Campus Handover Guidelines</li>
              <li>Student Verification Policy</li>
              <li>Fair Pricing Standards</li>
              <li>Honor Code & Trust</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} CampusBook. Built with Next.js & Tailwind CSS.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 inline fill-rose-500" />
            <span>for students everywhere.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

