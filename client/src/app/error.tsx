'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page rendering failed:', error);
  }, [error]);

  return (
    <div className="flex min-h-[65vh] items-center justify-center px-4 py-16">
      <div className="max-w-lg text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <TriangleAlert className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold text-slate-900">We hit a temporary snag.</h1>
        <p className="mt-3 text-slate-600">Your account and listings are safe. Try loading this page again.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="rounded-xl bg-campus-700 px-5 py-3 text-sm font-bold text-white hover:bg-campus-800">Try again</button>
          <Link href="/" className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100">Back home</Link>
        </div>
      </div>
    </div>
  );
}
