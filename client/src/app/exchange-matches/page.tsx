'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftRight, BadgeCheck, Loader2, MessageCircle, RefreshCw, Sparkles } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import BookCover from '@/components/BookCover';
import api from '@/lib/api';
import { ExchangeMatch } from '@/types';

function cover(book: ExchangeMatch['yourBook']) {
  const image = book.images?.[0];
  return image ? (typeof image === 'string' ? image : image.url) : '';
}

function ExchangeMatchesContent() {
  const router = useRouter();
  const [matches, setMatches] = useState<ExchangeMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyMatch, setBusyMatch] = useState<string | null>(null);
  const [sentMatches, setSentMatches] = useState<string[]>([]);
  const [toast, setToast] = useState('');

  const loadMatches = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.getExchangeMatches();
      setMatches(response.matches || []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load exchange matches.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMatches();
  }, [loadMatches]);

  const sendRequest = async (match: ExchangeMatch) => {
    const key = `${match.theirBook._id}:${match.yourBook._id}`;
    setBusyMatch(key);
    setToast('');
    try {
      const response = await api.createExchangeRequest({
        requestedBookId: match.theirBook._id,
        offeredBookId: match.yourBook._id,
        message: 'I found your listing through CampusBook exchange matching.',
      });
      setSentMatches((previous) => [...previous, key]);
      setToast(response.message || 'Exchange request sent.');
    } catch (requestError) {
      setToast(requestError instanceof Error ? requestError.message : 'Unable to send exchange request.');
    } finally {
      setBusyMatch(null);
    }
  };

  const messageStudent = async (match: ExchangeMatch) => {
    setBusyMatch(`message:${match.otherUser._id}`);
    setToast('');
    try {
      const response = await api.createConversation({
        userId: match.otherUser._id,
        bookId: match.theirBook._id,
      });
      router.push(`/messages/${response.conversation._id}`);
    } catch (requestError) {
      setToast(requestError instanceof Error ? requestError.message : 'Unable to start a conversation.');
      setBusyMatch(null);
    }
  };

  return (
    <ProtectedRoute requiredRole="student">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-campus-700"><Sparkles className="h-4 w-4" /> SMART EXCHANGE MATCHING</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Exchange matches</h1>
            <p className="mt-1 text-sm text-slate-600">Students who want books you have, and may have books you want.</p>
          </div>
          <Link href="/sell" className="rounded-xl bg-campus-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-campus-800">List an exchange book</Link>
        </div>

        {toast && (
          <div role="status" className="mb-5 rounded-xl border border-campus-200 bg-campus-50 px-4 py-3 text-sm text-campus-900">
            {toast}
          </div>
        )}

        {loading ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {[0, 1, 2, 3].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl bg-slate-200" />)}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
            <p className="font-semibold text-rose-800">{error}</p>
            <button type="button" onClick={() => void loadMatches()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-campus-700 px-4 py-2 text-sm font-bold text-white">
              <RefreshCw className="h-4 w-4" /> Retry
            </button>
          </div>
        ) : matches.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
            <ArrowLeftRight className="mx-auto h-10 w-10 text-campus-500" />
            <h2 className="mt-3 text-lg font-bold text-slate-900">No exchange matches yet</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">Add books to your wishlist and list an approved book with exchange preferences to find students with shared interests.</p>
            <div className="mt-5 flex justify-center gap-3">
              <Link href="/wishlist" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">View wishlist</Link>
              <Link href="/explore?listingType=exchange" className="rounded-lg bg-campus-700 px-4 py-2 text-sm font-semibold text-white hover:bg-campus-800">Explore exchanges</Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {matches.map((match) => {
              const key = `${match.theirBook._id}:${match.yourBook._id}`;
              const university = typeof match.otherUser.university === 'object'
                ? match.otherUser.university.name
                : '';
              return (
                <article key={key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-campus-100 font-bold text-campus-800">
                        {match.otherUser.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="flex items-center gap-1.5 font-bold text-slate-900">
                          {match.otherUser.name}
                          <BadgeCheck className="h-4 w-4 text-campus-600" />
                        </h2>
                        <p className="text-xs text-slate-500">{university || 'Campus student'} · ★ {Number(match.otherUser.rating || 0).toFixed(1)} ({match.otherUser.totalRatings || 0})</p>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${match.matchType === 'mutual' ? 'bg-campus-100 text-campus-800' : 'bg-amber-100 text-amber-800'}`}>
                      {match.matchScore}% {match.matchType === 'mutual' ? 'mutual' : 'match'}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {[
                      { title: 'Your book', book: match.yourBook },
                      { title: 'Their book', book: match.theirBook },
                    ].map(({ title, book }) => (
                      <Link key={book._id} href={`/books/${book._id}`} className="overflow-hidden rounded-xl border border-slate-200 hover:border-campus-300">
                        <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                          <BookCover src={cover(book)} alt={`Cover of ${book.title}`} className="h-full w-full object-cover" />
                        </div>
                        <div className="p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-campus-700">{title}</p>
                          <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900">{book.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{book.author}</p>
                        </div>
                      </Link>
                    ))}
                  </div>

                  <p className="mt-4 rounded-xl bg-campus-50 px-3 py-2 text-sm text-campus-900">{match.reason}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyMatch !== null || sentMatches.includes(key)}
                      onClick={() => void sendRequest(match)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-campus-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-campus-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {busyMatch === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeftRight className="h-4 w-4" />}
                      {sentMatches.includes(key) ? 'Request sent' : 'Send exchange request'}
                    </button>
                    <button
                      type="button"
                      disabled={busyMatch !== null}
                      onClick={() => void messageStudent(match)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {busyMatch === `message:${match.otherUser._id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                      Message
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}

export default function ExchangeMatchesPage() {
  return <ExchangeMatchesContent />;
}
