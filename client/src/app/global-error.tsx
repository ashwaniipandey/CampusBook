'use client';

import './globals.css';
import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-16 text-slate-900">
        <main className="max-w-lg text-center">
          <TriangleAlert className="mx-auto h-12 w-12 text-amber-600" aria-hidden="true" />
          <h1 className="mt-5 text-3xl font-extrabold">CampusBook is having trouble.</h1>
          <p className="mt-3 text-slate-600">Please retry, or return to the home page.</p>
          <div className="mt-7 flex justify-center gap-3">
            <button type="button" onClick={reset} className="rounded-xl bg-campus-700 px-5 py-3 text-sm font-bold text-white">Try again</button>
            <Link href="/" className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold">Back home</Link>
          </div>
        </main>
      </body>
    </html>
  );
}
