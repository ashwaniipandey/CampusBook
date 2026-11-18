import Link from 'next/link';
import { BookOpen, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[65vh] items-center justify-center px-4 py-16">
      <div className="max-w-lg text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-card-border bg-card text-accent">
          <BookOpen className="h-7 w-7" aria-hidden="true" />
        </span>
        <p className="mt-6 text-sm font-bold uppercase tracking-widest text-accent">404 · Page not found</p>
        <h1 className="mt-2 text-3xl font-extrabold text-heading">This page isn&apos;t on our shelf.</h1>
        <p className="mt-3 text-text">The link may be incorrect, or the page may have moved.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-xl bg-btn-primary px-5 py-3 text-sm font-bold text-btn-primary-text hover:opacity-90">Back home</Link>
          <Link href="/explore" className="inline-flex items-center gap-2 rounded-xl border border-card-border px-5 py-3 text-sm font-bold text-text hover:bg-card/60">
            <Search className="h-4 w-4" aria-hidden="true" /> Explore books
          </Link>
        </div>
      </div>
    </div>
  );
}
