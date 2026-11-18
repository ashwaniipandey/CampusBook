'use client';

import './globals.css';
import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center px-4 py-16">
        <main className="max-w-lg text-center">
          <TriangleAlert className="mx-auto h-12 w-12 text-amber-400" aria-hidden="true" />
          <h1 className="mt-5 text-3xl font-extrabold text-heading">CampusBook is having trouble.</h1>
          <p className="mt-3 text-text">Please retry, or return to the home page.</p>
          <div className="mt-7 flex justify-center gap-3">
            <button type="button" onClick={reset} className="rounded-xl bg-btn-primary px-5 py-3 text-sm font-bold text-btn-primary-text">Try again</button>
            <Link href="/" className="rounded-xl border border-card-border px-5 py-3 text-sm font-bold text-text">Back home</Link>
          </div>
        </main>
      </body>
    </html>
  );
}
