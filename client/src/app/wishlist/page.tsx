'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap, Heart, LoaderCircle, ShoppingCart, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getVerificationHref, isVerifiedStudent } from '@/lib/verification';
import BookCover from '@/components/BookCover';
import { Book, BookImage, University } from '@/types';
import { formatPrice, getBookPrice } from '@/lib/pricing';

type Toast = { message: string; type: 'success' | 'error' };

function getImageUrl(image: string | BookImage) {
  return typeof image === 'string' ? image : image.url;
}

function getUniversityName(university: University | string) {
  return typeof university === 'string' ? university : university.name;
}

export default function WishlistPage() {
  const router = useRouter();
  const {
    user,
    loading: authLoading,
    wishlistBooks,
    wishlistLoading,
    wishlistError,
    refreshWishlist,
    setWishlistItem,
    addCartBook,
  } = useAuth();
  const [pendingBook, setPendingBook] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      const returnUrl = `${window.location.pathname}${window.location.search}`;
      router.replace(`/login?redirect=${encodeURIComponent(returnUrl)}`);
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (wishlistError) showToast(wishlistError, 'error');
  }, [wishlistError, showToast]);

  const removeBook = async (book: Book) => {
    setPendingBook((previous) => ({ ...previous, [book._id]: true }));
    try {
      await setWishlistItem(book._id, false);
      showToast('Removed from your wishlist.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to remove this book.', 'error');
    } finally {
      setPendingBook((previous) => ({ ...previous, [book._id]: false }));
    }
  };

  const moveToCart = async (book: Book) => {
    if (!isVerifiedStudent(user)) {
      router.push(getVerificationHref('/wishlist'));
      return;
    }
    setPendingBook((previous) => ({ ...previous, [book._id]: true }));
    try {
      const message = await addCartBook(book);
      await setWishlistItem(book._id, false);
      showToast(message || 'Book moved to your cart.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to move this book to your cart.', 'error');
    } finally {
      setPendingBook((previous) => ({ ...previous, [book._id]: false }));
    }
  };

  if (authLoading || !user || wishlistLoading) {
    return (
      <main className="min-h-[65vh] bg-slate-50 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="animate-pulse overflow-hidden rounded-3xl border border-slate-200 bg-white p-4">
                <div className="aspect-[16/10] rounded-2xl bg-slate-200" />
                <div className="mt-4 h-4 w-3/4 rounded bg-slate-200" />
                <div className="mt-2 h-3 w-1/2 rounded bg-slate-200" />
                <div className="mt-5 h-10 rounded-xl bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      {toast && (
        <div
          role="status"
          className={`fixed right-4 top-20 z-[70] flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${
            toast.type === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-800'
              : 'border-campus-200 bg-campus-50 text-campus-800'
          }`}
        >
          <span>{toast.message}</span>
          <button type="button" aria-label="Dismiss notification" onClick={() => setToast(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-campus-700">
              <Heart className="h-4 w-4 fill-current" /> Saved for later
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">My Wishlist</h1>
          </div>
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
            {wishlistBooks.length} {wishlistBooks.length === 1 ? 'book' : 'books'}
          </span>
        </div>

        {wishlistError ? (
          <section className="rounded-3xl border border-rose-200 bg-white px-6 py-14 text-center shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Unable to load your wishlist</h2>
            <p className="mt-2 text-sm text-slate-600">{wishlistError}</p>
            <button
              type="button"
              onClick={() => void refreshWishlist()}
              className="mt-6 rounded-xl bg-campus-600 px-5 py-3 text-sm font-bold text-white hover:bg-campus-700"
            >
              Try again
            </button>
          </section>
        ) : wishlistBooks.length === 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-campus-50 text-campus-600">
              <Heart className="h-8 w-8" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-slate-900">Your wishlist is empty</h2>
            <p className="mt-2 text-sm text-slate-500">Save books you like and come back to them anytime.</p>
            <Link href="/explore" className="mt-6 inline-flex rounded-xl bg-campus-600 px-5 py-3 text-sm font-bold text-white hover:bg-campus-700">
              Explore books
            </Link>
          </section>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {wishlistBooks.map((book) => {
              const cover = book.images?.[0];
              const sellingPrice = getBookPrice(book);
              const price = book.listingType === 'donate' ? 'Free' : formatPrice(sellingPrice);

              return (
                <article key={book._id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
                  <Link href={`/books/${book._id}`} className="group relative block aspect-[4/3] overflow-hidden bg-slate-100">
                    <BookCover src={cover ? getImageUrl(cover) : ''} alt={`Cover of ${book.title}`} className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
                    <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold text-slate-800 shadow-sm">
                      {book.condition}
                    </span>
                  </Link>
                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/books/${book._id}`} className="line-clamp-2 font-bold leading-snug text-slate-900 hover:text-campus-700">
                          {book.title}
                        </Link>
                        <p className="mt-1 truncate text-sm text-slate-500">By {book.author}</p>
                      </div>
                      <span className="shrink-0 text-sm font-extrabold text-campus-700">{price}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate text-xs text-slate-500">
                      <GraduationCap className="h-4 w-4 shrink-0 text-campus-600" />
                      <span className="truncate">{getUniversityName(book.university)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        disabled={pendingBook[book._id]}
                        onClick={() => moveToCart(book)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-campus-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-campus-700 disabled:opacity-60"
                      >
                        {pendingBook[book._id] ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                        Move to Cart
                      </button>
                      <button
                        type="button"
                        disabled={pendingBook[book._id]}
                        onClick={() => removeBook(book)}
                        className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
