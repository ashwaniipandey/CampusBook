'use client';

import Link from 'next/link';
import { Calendar, Sparkles, BookOpen, ArrowRight } from 'lucide-react';
import Card from '@/components/Card';
import Chip from '@/components/Chip';

export default function EventsPage() {
  return (
    <main className="min-h-[85vh] px-4 py-20 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="mx-auto max-w-2xl text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-accent dark:text-btn-primary-text">
          <Calendar className="h-4 w-4 text-emerald-700 dark:text-current" /> Campus Events &amp; Book Fairs
        </div>
        <h1 className="mt-6 text-4xl sm:text-6xl font-extrabold tracking-tight text-heading">
          Campus Book Fairs &amp; <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent dark:from-emerald-300 dark:to-emerald-400 italic">Drives</span>
        </h1>
        <p className="mt-4 text-base text-text leading-relaxed">
          Upcoming semester book drives, peer exchange meetups, and campus donation events are being scheduled for this semester.
        </p>

        <Card className="mt-8 p-8 shadow-sm">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/20 text-accent mb-4">
            <Sparkles className="h-6 w-6" />
          </span>
          <h2 className="text-xl font-bold text-heading">Event Calendar Launching Soon</h2>
          <p className="mt-2 text-xs sm:text-sm text-text">
            Student union representatives and campus ambassadors will be announcing verified book exchange meetups right here.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 rounded-full bg-btn-primary px-6 py-3 text-sm font-bold text-btn-primary-text hover:opacity-90 transition shadow-sm"
            >
              <BookOpen className="h-4 w-4" /> Explore Available Books <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
