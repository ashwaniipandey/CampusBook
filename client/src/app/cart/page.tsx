'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  GraduationCap,
  LoaderCircle,
  MapPin,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import BookCover from '@/components/BookCover';
import { BookImage, User, Address } from '@/types';
import api from '@/lib/api';
import { formatPrice, getBookPrice } from '@/lib/pricing';
import { getVerificationHref, isVerifiedStudent } from '@/lib/verification';
import DeliveryAddressSelector from '@/components/DeliveryAddressSelector';

type Toast = { message: string; type: 'success' | 'error' };

function getImageUrl(image: string | BookImage) {
  return typeof image === 'string' ? image : image.url;
}

export default function CartPage() {
  const router = useRouter();
  const {
    user,
    loading: authLoading,
    cartItems,
    cartCount,
    cartTotalAmount,
    cartLoading,
    cartError,
    refreshCart,
    removeCartBook,
    clearCart,
    emptyCart,
  } = useAuth();
  const [meetingLocation, setMeetingLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [pendingBook, setPendingBook] = useState<Record<string, boolean>>({});
  const [clearingCart, setClearingCart] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
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
    if (cartError) showToast(cartError, 'error');
  }, [cartError, showToast]);

  const removeItem = async (bookId: string) => {
    setPendingBook((previous) => ({ ...previous, [bookId]: true }));
    try {
      const message = await removeCartBook(bookId);
      showToast(message || 'Removed from your cart.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to remove this book.', 'error');
    } finally {
      setPendingBook((previous) => ({ ...previous, [bookId]: false }));
    }
  };

  const clearAll = async () => {
    setClearingCart(true);
    try {
      const message = await clearCart();
      showToast(message || 'Cart cleared.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to clear your cart.', 'error');
    } finally {
      setClearingCart(false);
    }
  };

  const checkout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isVerifiedStudent(user)) {
      router.push(getVerificationHref('/cart'));
      return;
    }

    if (!selectedAddress) {
      showToast('Please select or add a delivery address to place your order.', 'error');
      return;
    }

    const effectiveLocation =
      meetingLocation.trim() ||
      `${selectedAddress.houseNo}, ${selectedAddress.area}, ${selectedAddress.city} - ${selectedAddress.pincode}`;

    setPlacingOrder(true);
    try {
      const response = await api.createOrder({
        fromCart: true,
        addressId: selectedAddress._id,
        meetingLocation: effectiveLocation,
        notes: notes.trim(),
      });
      emptyCart();
      showToast(response.message || 'Order placed successfully.');
      window.setTimeout(() => router.push('/orders'), 700);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to place your order.', 'error');
      setPlacingOrder(false);
    }
  };

  if (authLoading || !user || cartLoading) {
    return (
      <main className="min-h-[65vh] px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 h-8 w-48 animate-pulse rounded-lg bg-card/60" />
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              {[0, 1, 2].map((item) => (
                <div key={item} className="flex animate-pulse gap-4 rounded-2xl border border-card-border bg-card p-4">
                  <div className="h-28 w-28 shrink-0 rounded-xl bg-card/60" />
                  <div className="flex-1 space-y-3 py-2">
                    <div className="h-4 w-3/4 rounded bg-card/60" />
                    <div className="h-3 w-1/2 rounded bg-card/60" />
                    <div className="h-3 w-1/3 rounded bg-card/60" />
                  </div>
                </div>
              ))}
            </div>
            <div className="h-72 animate-pulse rounded-3xl bg-card/60" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
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
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
              <ShoppingCart className="h-4 w-4" /> Your selections
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-heading sm:text-3xl">Shopping Cart</h1>
          </div>
          {cartCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              disabled={clearingCart || placingOrder}
              className="inline-flex items-center gap-2 rounded-xl border border-card-border bg-card px-4 py-2.5 text-sm font-semibold text-text hover:border-rose-200 hover:text-rose-700 disabled:opacity-50"
            >
              {clearingCart ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Clear cart
            </button>
          )}
        </div>

        {cartError ? (
          <section className="rounded-3xl border border-rose-200 bg-card px-6 py-14 text-center shadow-sm">
            <h2 className="text-xl font-bold text-heading">Unable to load your cart</h2>
            <p className="mt-2 text-sm text-text">{cartError}</p>
            <button
              type="button"
              onClick={() => void refreshCart()}
              className="mt-6 rounded-xl bg-btn-primary px-5 py-3 text-sm font-bold text-btn-primary-text hover:opacity-90"
            >
              Try again
            </button>
          </section>
        ) : cartItems.length === 0 ? (
          <section className="rounded-3xl border border-card-border bg-card px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-campus-50 text-accent">
              <ShoppingCart className="h-8 w-8" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-heading">Your cart is empty</h2>
            <p className="mt-2 text-sm text-muted">Explore the marketplace and find your next course book.</p>
            <Link href="/explore" className="mt-6 inline-flex rounded-xl bg-btn-primary px-5 py-3 text-sm font-bold text-btn-primary-text hover:opacity-90">
              Explore books
            </Link>
          </section>
        ) : (
          <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <section aria-label="Cart items" className="space-y-4">
                {cartItems.map((item) => {
                  const book = item.book;
                  const cover = book.images?.[0];
                  const seller = typeof book.seller === 'string' ? 'Campus seller' : (book.seller as User).name;
                  const price = getBookPrice(book);
                  const priceLabel = book.listingType === 'donate' ? 'Free' : formatPrice(price);

                  return (
                    <article key={item._id || book._id} className="flex flex-col gap-4 rounded-2xl border border-card-border bg-card p-4 shadow-sm sm:flex-row">
                      <Link href={`/books/${book._id}`} className="relative block h-44 shrink-0 overflow-hidden rounded-xl bg-card/60 sm:h-32 sm:w-32">
                        <BookCover src={cover ? getImageUrl(cover) : ''} alt={`Cover of ${book.title}`} className="h-full w-full object-cover" />
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div className="min-w-0 space-y-2">
                          <Link href={`/books/${book._id}`} className="line-clamp-2 font-bold leading-snug text-heading hover:text-accent">
                            {book.title}
                          </Link>
                          <p className="truncate text-sm text-muted">By {book.author}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="rounded-full bg-chip px-2.5 py-1 font-semibold text-heading">{book.condition}</span>
                            <span className="inline-flex items-center gap-1 text-muted">
                              <GraduationCap className="h-3.5 w-3.5 text-accent" />
                              {seller}
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end">
                          <span className="text-lg font-extrabold text-heading">{priceLabel}</span>
                          <button
                            type="button"
                            disabled={pendingBook[book._id] || placingOrder}
                            onClick={() => removeItem(book._id)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-muted hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                          >
                            {pendingBook[book._id] ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            Remove
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </section>

              {/* Delivery Address Selection Step */}
              <DeliveryAddressSelector
                selectedAddressId={selectedAddress?._id || null}
                onSelectAddress={setSelectedAddress}
              />
            </div>

            <aside className="space-y-5 rounded-3xl border border-card-border bg-card p-5 shadow-sm sm:p-6 lg:sticky lg:top-24">
              <div>
                <h2 className="text-lg font-extrabold text-heading">Order summary</h2>
                <div className="mt-4 flex justify-between border-b border-card-border pb-3 text-sm">
                  <span className="text-muted">Items ({cartCount})</span>
                  <span className="font-semibold text-heading">{formatPrice(cartTotalAmount)}</span>
                </div>
                <div className="flex justify-between pt-3">
                  <span className="font-bold text-heading">Total</span>
                  <span className="text-lg font-extrabold text-accent">{formatPrice(cartTotalAmount)}</span>
                </div>
              </div>

              {/* Delivery Address Summary in Sidebar */}
              {selectedAddress ? (
                <div className="rounded-2xl border border-card-border bg-card/60 p-3.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-text">Deliver to:</span>
                    <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">
                      {selectedAddress.addressType}
                    </span>
                  </div>
                  <p className="mt-1.5 font-bold text-heading truncate">
                    {selectedAddress.fullName} ({selectedAddress.phone})
                  </p>
                  <p className="mt-0.5 text-muted leading-relaxed line-clamp-2">
                    {selectedAddress.houseNo}, {selectedAddress.area}, {selectedAddress.city} - {selectedAddress.pincode}
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-rose-500/40 bg-rose-500/10 p-3 text-center text-xs text-rose-500 font-medium">
                  Please select or add a delivery address to place your order.
                </div>
              )}

              <form onSubmit={checkout} className="space-y-4 border-t border-card-border pt-5">
                <h3 className="text-sm font-bold text-heading">Delivery & Handover notes</h3>
                <label className="block text-sm font-semibold text-text">
                  Meeting landmark / Instructions <span className="font-normal text-muted">(optional)</span>
                  <span className="relative mt-1.5 block">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted" />
                    <input
                      value={meetingLocation}
                      onChange={(event) => setMeetingLocation(event.target.value)}
                      maxLength={200}
                      placeholder={
                        selectedAddress
                          ? `e.g. Near main gate, or leave blank to use address`
                          : 'e.g. Main library entrance'
                      }
                      className="w-full rounded-xl border border-card-border bg-card/60 py-2.5 pl-10 pr-3 text-sm text-heading placeholder:text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                    />
                  </span>
                </label>
                <label className="block text-sm font-semibold text-text">
                  Notes <span className="font-normal text-muted">(optional)</span>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    maxLength={500}
                    rows={2}
                    placeholder="Add any details for the sellers"
                    className="mt-1.5 w-full resize-y rounded-xl border border-card-border bg-card/60 px-3 py-2.5 text-sm text-heading placeholder:text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                  />
                </label>
                <button
                  type="submit"
                  disabled={placingOrder || cartCount === 0 || !selectedAddress}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-btn-primary px-4 py-3 text-sm font-bold text-btn-primary-text hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {placingOrder && <LoaderCircle className="h-4 w-4 animate-spin" />}
                  {placingOrder ? 'Placing order…' : 'Place Order'}
                </button>
                <p className="text-center text-xs leading-5 text-muted">
                  Confirm your handoff with each seller and meet in a public campus location.
                </p>
              </form>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
