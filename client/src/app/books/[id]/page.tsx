'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Heart,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Share2,
  ShoppingCart,
  Star,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Book, BookImage, Category, Review, University, User } from '@/types';
import { formatPrice, getBookPrice } from '@/lib/pricing';
import { MotionDialog } from '@/components/MotionEffects';

type Toast = { message: string; type: 'success' | 'error' };

function getName(value: University | Category | string | undefined, fallback = 'Not provided') {
  if (!value) return fallback;
  return typeof value === 'string' ? value : value.name;
}

function getImageUrl(image: string | BookImage) {
  return typeof image === 'string' ? image : image.url;
}

function getReviewerName(review: Review) {
  return typeof review.reviewer === 'string' ? 'Campus student' : review.reviewer.name;
}

function BookCard({ book }: { book: Book }) {
  const image = book.images?.[0];
  const price = book.listingType === 'donate' ? 'Free' : formatPrice(getBookPrice(book));

  return (
    <Link
      href={`/books/${book._id}`}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-campus-300 hover:shadow-lg"
    >
      <div className="aspect-[4/3] bg-slate-100">
        {image ? (
          <img src={getImageUrl(image)} alt={book.title} className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <BookOpen className="h-12 w-12" />
          </div>
        )}
      </div>
      <div className="space-y-2 p-4">
        <h3 className="line-clamp-2 min-h-10 text-sm font-bold text-slate-900 group-hover:text-campus-700">{book.title}</h3>
        <p className="truncate text-xs text-slate-500">{book.author}</p>
        <div className="flex items-center justify-between gap-2">
          <span className="font-extrabold text-campus-700">{price}</span>
          <span className="rounded-full bg-campus-50 px-2.5 py-1 text-[10px] font-semibold text-campus-700">{book.condition}</span>
        </div>
      </div>
    </Link>
  );
}

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const {
    user,
    loading: authLoading,
    wishlistBookIds,
    wishlistLoading,
    wishlistError,
    setWishlistItem,
    addCartBook,
  } = useAuth();
  const bookId = typeof params?.id === 'string' ? params.id : '';

  const [book, setBook] = useState<Book | null>(null);
  const [similarBooks, setSimilarBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [meetingLocation, setMeetingLocation] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [exchangeModalOpen, setExchangeModalOpen] = useState(false);
  const [donationModalOpen, setDonationModalOpen] = useState(false);
  const [myBooks, setMyBooks] = useState<Book[]>([]);
  const [myBooksLoading, setMyBooksLoading] = useState(false);
  const [offeredBookId, setOfferedBookId] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [openingConversation, setOpeningConversation] = useState(false);

  const seller = book && typeof book.seller !== 'string' ? (book.seller as User) : null;
  const sellerId = typeof book?.seller === 'string' ? book.seller : seller?._id;
  const isOwner = Boolean(user && sellerId === user._id);
  const isSold = book?.status === 'sold';
  const canPurchase = Boolean(book && book.listingType === 'sell' && !isOwner && !isSold);
  const isApproved = Boolean(
    book && (['approved', 'available'].includes(book.status) || book.isApproved === true)
  );
  const canRequestExchange = Boolean(
    book && book.listingType === 'exchange' && isApproved && !isOwner && !isSold
  );
  const canRequestDonation = Boolean(
    book && book.listingType === 'donate' && isApproved && !isOwner && !isSold
  );
  const wishlisted = Boolean(book && wishlistBookIds.includes(book._id));
  const images = useMemo(
    () => (book?.images || []).map(getImageUrl).filter((image) => Boolean(image)),
    [book]
  );
  const categoryName = getName(book?.category, 'Not provided');
  const universityName = getName(book?.university, 'Not provided');
  const sellingPrice = book ? getBookPrice(book) : 0;
  const originalPrice = Number(book?.originalPrice || 0);
  const discount = originalPrice > sellingPrice && originalPrice > 0
    ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100)
    : 0;
  const isNotFound = Boolean(errorMessage && /not found|does not exist/i.test(errorMessage));

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    if (wishlistError) showToast(wishlistError, 'error');
  }, [wishlistError, showToast]);

  useEffect(() => {
    if (!bookId) return;
    let active = true;
    setLoading(true);
    setErrorMessage(null);

    api.getBookById(bookId)
      .then(async (response) => {
        if (!active) return;
        if (!response.book) {
          setErrorMessage('Book listing not found');
          return;
        }
        setBook(response.book);

        try {
          const similarResponse = await api.getSimilarBooks(bookId);
          if (active) setSimilarBooks((similarResponse.books || []).slice(0, 6));
        } catch (error) {
          if (active) {
            showToast(error instanceof Error ? error.message : 'Unable to load similar books.', 'error');
          }
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'Unable to load this book.';
        setErrorMessage(message);
        showToast(message, 'error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [bookId]);

  const requireLogin = () => {
    if (authLoading) return false;
    if (user) return true;
    const returnUrl = `${window.location.pathname}${window.location.search}`;
    router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
    return false;
  };

  const toggleWishlist = async () => {
    if (!book || isSold || !requireLogin()) return;
    const previousValue = wishlisted;
    try {
      await setWishlistItem(book._id, !previousValue, book);
      showToast(previousValue ? 'Removed from your wishlist.' : 'Added to your wishlist.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to update your wishlist.', 'error');
    }
  };

  const addToCart = async () => {
    if (!book || !requireLogin()) return;
    setAddingToCart(true);
    try {
      const message = await addCartBook(book);
      showToast(message || 'Added to your cart.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to add this book to your cart.', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const submitOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!book || !requireLogin()) return;
    setSubmittingOrder(true);
    try {
      await api.createOrder({
        bookId: book._id,
        meetingLocation: meetingLocation.trim(),
        notes: orderNotes.trim(),
      });
      router.push('/orders');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to place your order.', 'error');
      setSubmittingOrder(false);
    }
  };

  const openExchangeRequest = async () => {
    if (!book || !requireLogin()) return;
    setMyBooksLoading(true);
    try {
      const response = await api.getMyBooks();
      const eligibleBooks = (response.books || []).filter(
        (ownedBook) =>
          ownedBook.status !== 'sold' &&
          (['approved', 'available'].includes(ownedBook.status) || ownedBook.isApproved === true)
      );
      setMyBooks(eligibleBooks);
      setOfferedBookId(eligibleBooks[0]?._id || '');
      setRequestMessage('');
      setExchangeModalOpen(true);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to load your eligible books.', 'error');
    } finally {
      setMyBooksLoading(false);
    }
  };

  const submitExchangeRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!book || !offeredBookId || !requireLogin()) return;
    setSubmittingRequest(true);
    try {
      const response = await api.createExchangeRequest({
        requestedBookId: book._id,
        offeredBookId,
        message: requestMessage.trim(),
      });
      showToast(response.message || 'Exchange request sent.');
      setExchangeModalOpen(false);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to send the exchange request.', 'error');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const submitDonationRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!book || !requireLogin()) return;
    setSubmittingRequest(true);
    try {
      const response = await api.createDonationRequest({
        bookId: book._id,
        message: requestMessage.trim(),
      });
      showToast(response.message || 'Donation request sent.');
      setDonationModalOpen(false);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to send the donation request.', 'error');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const chatWithSeller = async () => {
    if (!book || !sellerId || isOwner || !requireLogin() || openingConversation) return;
    setOpeningConversation(true);
    try {
      const response = await api.createConversation({ userId: sellerId, bookId: book._id });
      router.push(`/messages/${response.conversation._id}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to open a conversation with the seller.', 'error');
    } finally {
      setOpeningConversation(false);
    }
  };

  const toggleReviews = async () => {
    const opening = !reviewsOpen;
    setReviewsOpen(opening);
    if (!opening || reviewsLoaded || !sellerId) return;
    setReviewsLoading(true);
    try {
      const response = await api.getSellerReviews(sellerId);
      setReviews(response.reviews || []);
      setReviewsLoaded(true);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to load seller reviews.', 'error');
    } finally {
      setReviewsLoading(false);
    }
  };

  const shareBook = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to copy the link.', 'error');
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">
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

      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/explore" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-campus-700">
            <ArrowLeft className="h-4 w-4" />
            Back to marketplace
          </Link>
          {book && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={shareBook}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-campus-300"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
              {!isSold && (
                <button
                  type="button"
                  onClick={toggleWishlist}
                  disabled={authLoading || wishlistLoading}
                  aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  aria-pressed={wishlisted}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:border-rose-200 hover:text-rose-600 disabled:opacity-50"
                >
                  <Heart className={`h-5 w-5 ${wishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>
              )}
            </div>
          )}
        </div>

        {loading && (
          <div className="grid animate-pulse gap-8 lg:grid-cols-2">
            <div className="space-y-3">
              <div className="aspect-[4/3] rounded-3xl bg-slate-200" />
              <div className="grid grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((item) => <div key={item} className="aspect-square rounded-xl bg-slate-200" />)}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-5 w-1/4 rounded bg-slate-200" />
              <div className="h-10 w-3/4 rounded bg-slate-200" />
              <div className="h-32 rounded-2xl bg-slate-200" />
              <div className="h-48 rounded-2xl bg-slate-200" />
            </div>
          </div>
        )}

        {!loading && errorMessage && (
          <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <BookOpen className="mx-auto mb-4 h-10 w-10 text-slate-300" />
            <h1 className="text-2xl font-bold text-slate-900">{isNotFound ? 'Book not found' : 'Unable to load this book'}</h1>
            <p className="mt-2 text-sm text-slate-600">{errorMessage}</p>
            <Link href="/explore" className="mt-6 inline-flex rounded-xl bg-campus-600 px-5 py-3 text-sm font-bold text-white hover:bg-campus-700">
              Browse books
            </Link>
          </section>
        )}

        {!loading && book && (
          <>
            <section className="grid items-start gap-8 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-white">
                  {images.length ? (
                    <img src={images[activeImage] || images[0]} alt={book.title} className="h-full w-full object-contain p-4" />
                  ) : (
                    <div className="text-center text-slate-300">
                      <BookOpen className="mx-auto h-16 w-16" />
                      <p className="mt-2 text-sm text-slate-500">No photos available</p>
                    </div>
                  )}
                  <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-800 shadow">
                    {book.condition}
                  </div>
                  {book.listingType === 'donate' && (
                    <div className="absolute right-4 top-4 rounded-full bg-campus-600 px-3 py-1.5 text-xs font-extrabold text-white">FREE</div>
                  )}
                  {isSold && (
                    <div className="absolute bottom-4 right-4 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">SOLD</div>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {images.map((image, index) => (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        onClick={() => setActiveImage(index)}
                        aria-label={`View photo ${index + 1}`}
                        aria-pressed={activeImage === index}
                        className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 ${activeImage === index ? 'border-campus-600 ring-2 ring-campus-100' : 'border-slate-200'}`}
                      >
                        <img src={image} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-campus-50 px-3 py-1 text-xs font-bold text-campus-800">{categoryName}</span>
                  {book.subject && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{book.subject}</span>}
                  {book.course && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{book.course}</span>}
                </div>
                <div>
                  <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">{book.title}</h1>
                  <p className="mt-2 text-base text-slate-600">By <span className="font-semibold text-slate-900">{book.author}</span></p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
                  <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
                    {book.listingType === 'donate' ? (
                      <>
                        <span className="text-3xl font-black text-campus-700">Free</span>
                        <span className="mb-1 rounded-full bg-campus-50 px-3 py-1 text-xs font-bold text-campus-700">Donation</span>
                      </>
                    ) : (
                      <>
                        <span className="text-3xl font-black text-slate-950">{formatPrice(sellingPrice)}</span>
                        {originalPrice > sellingPrice && (
                          <span className="mb-1 text-lg text-slate-400 line-through">{formatPrice(originalPrice)}</span>
                        )}
                        {discount > 0 && <span className="mb-1 rounded-full bg-campus-50 px-3 py-1 text-xs font-bold text-campus-800">{discount}% off</span>}
                      </>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {isSold ? 'This listing has been sold.' : isOwner ? 'This is your listing.' : book.listingType === 'exchange' ? 'Exchange listing' : 'Arrange a safe campus handoff with the seller.'}
                  </p>

                  {canPurchase ? (
                    <div className="mt-5 space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={addToCart}
                          disabled={addingToCart || authLoading}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-campus-600 px-4 py-3 text-sm font-bold text-campus-700 hover:bg-campus-50 disabled:opacity-50"
                        >
                          {addingToCart ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                          {addingToCart ? 'Adding…' : 'Add to Cart'}
                        </button>
                        <button
                          type="button"
                          onClick={() => requireLogin() && setOrderModalOpen(true)}
                          disabled={authLoading}
                          className="rounded-xl bg-campus-600 px-4 py-3 text-sm font-bold text-white hover:bg-campus-700 disabled:opacity-50"
                        >
                          Buy Now
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 space-y-3">
                      <p className="text-sm font-semibold text-slate-500">
                        {isSold
                          ? 'Purchase unavailable · This book is sold'
                          : isOwner
                            ? 'Purchase unavailable · This is your listing'
                            : book.listingType === 'exchange'
                              ? 'Purchase unavailable · Exchange listing'
                              : book.listingType === 'donate'
                                ? 'Purchase unavailable · Free donation'
                                : 'Purchase unavailable'}
                      </p>
                    </div>
                  )}
                  {canRequestExchange && (
                    <button
                      type="button"
                      onClick={() => void openExchangeRequest()}
                      disabled={myBooksLoading || authLoading}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-campus-600 px-4 py-3 text-sm font-bold text-campus-700 hover:bg-campus-50 disabled:opacity-50"
                    >
                      {myBooksLoading && <LoaderCircle className="h-4 w-4 animate-spin" />}
                      Request Exchange
                    </button>
                  )}
                  {canRequestDonation && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!requireLogin()) return;
                        setRequestMessage('');
                        setDonationModalOpen(true);
                      }}
                      disabled={authLoading}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-campus-600 px-4 py-3 text-sm font-bold text-white hover:bg-campus-700 disabled:opacity-50"
                    >
                      Request Donation
                    </button>
                  )}
                  {sellerId && !isOwner && (
                    <button
                      type="button"
                      onClick={() => void chatWithSeller()}
                      disabled={authLoading || openingConversation}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:border-campus-400 hover:bg-campus-50 hover:text-campus-800 disabled:opacity-50"
                    >
                      {openingConversation ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                      {openingConversation ? 'Opening chat…' : 'Chat with Seller'}
                    </button>
                  )}
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
                  <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">Book details</h2>
                  <dl className="divide-y divide-slate-100">
                    {[
                      ['Category', categoryName],
                      ['Subject', book.subject],
                      ['Course', book.course],
                      ['Semester', book.semester],
                      ['University', universityName],
                      ['ISBN', book.isbn],
                    ].map(([label, value]) => (
                      <div key={label} className="grid grid-cols-3 gap-3 py-3 text-sm">
                        <dt className="font-medium text-slate-500">{label}</dt>
                        <dd className="col-span-2 break-words font-semibold text-slate-800">{value || 'Not provided'}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                {book.description && (
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
                    <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Description</h2>
                    <p className="whitespace-pre-line text-sm leading-6 text-slate-700">{book.description}</p>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {seller?.avatar ? (
                    <img src={seller.avatar} alt="" className="h-14 w-14 rounded-2xl object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-campus-50 text-xl font-bold text-campus-700">
                      {seller?.name?.slice(0, 1).toUpperCase() || 'S'}
                    </div>
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-slate-900">{seller?.name || 'Campus seller'}</h2>
                      {seller?.isVerified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-campus-50 px-2 py-1 text-[11px] font-semibold text-campus-700">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                        </span>
                      )}
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                      <GraduationCap className="h-4 w-4" /> {universityName}
                    </p>
                  </div>
                </div>
                <div className="sm:text-right">
                  <p className="inline-flex items-center gap-1 font-bold text-amber-600">
                    <Star className="h-4 w-4 fill-current" /> {Number(seller?.rating ?? 0).toFixed(1)}
                  </p>
                  <p className="text-xs text-slate-500">{seller?.totalRatings ?? 0} reviews</p>
                </div>
              </div>
              {sellerId && (
                <button type="button" onClick={toggleReviews} className="mt-5 text-sm font-bold text-campus-700 hover:text-campus-900">
                  {reviewsOpen ? 'Hide reviews' : 'View reviews'}
                </button>
              )}
              {reviewsOpen && (
                <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                  {reviewsLoading ? (
                    <p className="text-sm text-slate-500">Loading reviews…</p>
                  ) : reviews.length ? (
                    reviews.slice(0, 5).map((review) => (
                      <article key={review._id} className="rounded-2xl bg-slate-50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-bold text-slate-800">{getReviewerName(review)}</p>
                          <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                            <Star className="h-3.5 w-3.5 fill-current" /> {review.rating}/5
                          </div>
                        </div>
                        {review.comment && <p className="mt-2 text-sm leading-5 text-slate-600">{review.comment}</p>}
                        {review.createdAt && <p className="mt-2 text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</p>}
                      </article>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No reviews yet.</p>
                  )}
                </div>
              )}
            </section>

            {similarBooks.length > 0 && (
              <section className="space-y-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Similar books</h2>
                  <p className="mt-1 text-sm text-slate-500">More books you might be interested in.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
                  {similarBooks.map((similarBook) => <BookCard key={similarBook._id} book={similarBook} />)}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {orderModalOpen && book && (
        <MotionDialog
          labelledBy="order-dialog-title"
          onClose={() => setOrderModalOpen(false)}
          closeDisabled={submittingOrder}
          panelClassName="max-w-md p-6"
        >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="order-dialog-title" className="text-xl font-extrabold text-slate-900">Arrange your purchase</h2>
                <p className="mt-1 text-sm text-slate-500">Choose a campus meeting point and add any notes.</p>
              </div>
              <button type="button" aria-label="Close dialog" disabled={submittingOrder} onClick={() => setOrderModalOpen(false)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submitOrder} className="mt-5 space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                Meeting location
                <span className="relative mt-1.5 block">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    value={meetingLocation}
                    onChange={(event) => setMeetingLocation(event.target.value)}
                    maxLength={200}
                    placeholder="e.g. Main library entrance"
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-campus-500 focus:ring-2 focus:ring-campus-100"
                  />
                </span>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Notes <span className="font-normal text-slate-400">(optional)</span>
                <textarea
                  value={orderNotes}
                  onChange={(event) => setOrderNotes(event.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Add a note for the seller"
                  className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-campus-500 focus:ring-2 focus:ring-campus-100"
                />
              </label>
              <button type="submit" disabled={submittingOrder} className="flex w-full items-center justify-center gap-2 rounded-xl bg-campus-600 px-4 py-3 text-sm font-bold text-white hover:bg-campus-700 disabled:opacity-60">
                {submittingOrder && <LoaderCircle className="h-4 w-4 animate-spin" />}
                {submittingOrder ? 'Placing order…' : `Place order · ${formatPrice(sellingPrice)}`}
              </button>
            </form>
        </MotionDialog>
      )}

      {exchangeModalOpen && book && (
        <MotionDialog
          labelledBy="exchange-dialog-title"
          onClose={() => setExchangeModalOpen(false)}
          closeDisabled={submittingRequest}
          panelClassName="max-w-md p-6"
        >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="exchange-dialog-title" className="text-xl font-extrabold text-slate-900">Request an exchange</h2>
                <p className="mt-1 text-sm text-slate-500">Choose one of your approved books to offer for “{book.title}”.</p>
              </div>
              <button type="button" aria-label="Close dialog" disabled={submittingRequest} onClick={() => setExchangeModalOpen(false)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            {myBooks.length === 0 ? (
              <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <p>You have no eligible approved books to offer.</p>
                <Link href="/sell" className="mt-2 inline-flex font-bold text-campus-700 hover:text-campus-900">List a book</Link>
              </div>
            ) : (
              <form onSubmit={submitExchangeRequest} className="mt-5 space-y-4">
                <label className="block text-sm font-semibold text-slate-700">
                  Your offer
                  <select value={offeredBookId} onChange={(event) => setOfferedBookId(event.target.value)} required className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-campus-500 focus:ring-2 focus:ring-campus-100">
                    {myBooks.map((ownedBook) => (
                      <option key={ownedBook._id} value={ownedBook._id}>{ownedBook.title}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Message <span className="font-normal text-slate-400">(optional)</span>
                  <textarea value={requestMessage} onChange={(event) => setRequestMessage(event.target.value)} maxLength={1000} rows={3} placeholder="Add a note for the owner" className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-campus-500 focus:ring-2 focus:ring-campus-100" />
                </label>
                <button type="submit" disabled={!offeredBookId || submittingRequest} className="flex w-full items-center justify-center gap-2 rounded-xl bg-campus-600 px-4 py-3 text-sm font-bold text-white hover:bg-campus-700 disabled:opacity-60">
                  {submittingRequest && <LoaderCircle className="h-4 w-4 animate-spin" />}
                  {submittingRequest ? 'Sending…' : 'Send Request'}
                </button>
              </form>
            )}
        </MotionDialog>
      )}

      {donationModalOpen && book && (
        <MotionDialog
          labelledBy="donation-dialog-title"
          onClose={() => setDonationModalOpen(false)}
          closeDisabled={submittingRequest}
          panelClassName="max-w-md p-6"
        >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="donation-dialog-title" className="text-xl font-extrabold text-slate-900">Request this donation</h2>
                <p className="mt-1 text-sm text-slate-500">Send an optional message to the donor.</p>
              </div>
              <button type="button" aria-label="Close dialog" disabled={submittingRequest} onClick={() => setDonationModalOpen(false)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submitDonationRequest} className="mt-5 space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                Message <span className="font-normal text-slate-400">(optional)</span>
                <textarea value={requestMessage} onChange={(event) => setRequestMessage(event.target.value)} maxLength={1000} rows={4} placeholder="Add a note for the donor" className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-campus-500 focus:ring-2 focus:ring-campus-100" />
              </label>
              <button type="submit" disabled={submittingRequest} className="flex w-full items-center justify-center gap-2 rounded-xl bg-campus-600 px-4 py-3 text-sm font-bold text-white hover:bg-campus-700 disabled:opacity-60">
                {submittingRequest && <LoaderCircle className="h-4 w-4 animate-spin" />}
                {submittingRequest ? 'Sending…' : 'Send Request'}
              </button>
            </form>
        </MotionDialog>
      )}
    </main>
  );
}
