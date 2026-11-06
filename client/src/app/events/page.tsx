'use client';

import Link from 'next/link';
import { Calendar, Sparkles, BookOpen, ArrowRight } from 'lucide-react';

export default function EventsPage() {
  return (
    <main className="min-h-[85vh] bg-gradient-to-b from-[#02130b] via-[#041f12] to-[#010906] px-4 py-20 text-white sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="mx-auto max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-4 py-1 text-xs font-bold text-emerald-300">
          <Calendar className="h-4 w-4" /> Campus Events & Book Fairs
        </div>
        <h1 className="mt-6 text-4xl sm:text-6xl font-extrabold tracking-tight">
          Campus Book Fairs & <span className="text-emerald-400 italic">Drives</span>
        </h1>
        <p className="mt-4 text-base text-emerald-100/70 leading-relaxed">
          Upcoming semester book drives, peer exchange meetups, and campus donation events are being scheduled for this semester.
        </p>

        <div className="mt-8 rounded-3xl border border-emerald-500/20 bg-white/5 p-8 backdrop-blur-xl">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300 mb-4">
            <Sparkles className="h-6 w-6" />
          </span>
          <h2 className="text-xl font-bold text-white">Event Calendar Launching Soon</h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-300">
            Student union representatives and campus ambassadors will be announcing verified book exchange meetups right here.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 transition"
            >
              <BookOpen className="h-4 w-4" /> Explore Available Books <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

