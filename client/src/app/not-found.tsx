import Link from 'next/link';
import { BookOpen, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[65vh] items-center justify-center px-4 py-16">
      <div className="max-w-lg text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-campus-100 text-campus-800">
          <BookOpen className="h-7 w-7" aria-hidden="true" />
        </span>
        <p className="mt-6 text-sm font-bold uppercase tracking-widest text-campus-700">404 · Page not found</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">This page isn’t on our shelf.</h1>
        <p className="mt-3 text-slate-600">The link may be incorrect, or the page may have moved.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-xl bg-campus-700 px-5 py-3 text-sm font-bold text-white hover:bg-campus-800">Back home</Link>
          <Link href="/explore" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100">
            <Search className="h-4 w-4" aria-hidden="true" /> Explore books
          </Link>
        </div>
      </div>
    </div>
  );
}
