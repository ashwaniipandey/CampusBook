'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Book, User, University, Category, BookImage } from '@/types';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Heart,
  Share2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Calendar,
  Tag,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  MapPin,
  Check,
  Building,
  Hash,
  Layers,
  Clock,
  ArrowLeftRight,
  HeartHandshake,
  DollarSign,
} from 'lucide-react';

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const bookId = typeof params?.id === 'string' ? params.id : '';

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active preview image index
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);
  const [contactNotice, setContactNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!bookId) return;

    let isMounted = true;
    setLoading(true);
    setErrorMsg(null);

    api
      .getBookById(bookId)
      .then((res) => {
        if (!isMounted) return;
        if (res && res.book) {
          setBook(res.book);
        } else {
          setErrorMsg('Listing not found');
        }
      })
      .catch((err: any) => {
        if (!isMounted) return;
        console.error('Error fetching book detail:', err);
        setErrorMsg(
          err.message || 'Unable to load book details. Please try again later.'
        );
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [bookId]);

  // Copy shareable link
  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleContactClick = () => {
    if (!book) return;
    const seller = typeof book.seller === 'object' && book.seller ? (book.seller as User) : null;
    const email = seller?.email || 'the seller';
    setContactNotice(
      `Direct messaging will be available in Phase 6. You can reach out directly to ${seller?.name || 'the seller'} via campus email: ${email}`
    );
    setTimeout(() => setContactNotice(null), 6000);
  };

  // Extract images
  const images: string[] = [];
  if (book && Array.isArray(book.images)) {
    book.images.forEach((img: string | BookImage) => {
      if (typeof img === 'string' && img.trim()) {
        images.push(img);
      } else if (img && typeof img === 'object' && img.url) {
        images.push(img.url);
      }
    });
  }

  // Type guards for populated fields
  const seller = book && typeof book.seller === 'object' && book.seller ? (book.seller as User) : null;
  const university = book && typeof book.university === 'object' && book.university ? (book.university as University) : null;
  const category = book && typeof book.category === 'object' && book.category ? (book.category as Category) : null;

  const isOwner = Boolean(
    currentUser &&
      book &&
      ((typeof book.seller === 'string' && book.seller === currentUser._id) ||
        (seller && seller._id === currentUser._id))
  );

  // Price calculations
  const originalPrice = book ? Number(book.originalPrice || 0) : 0;
  const sellingPrice = book ? Number(book.sellingPrice ?? book.price ?? 0) : 0;
  const savings = originalPrice > 0 && sellingPrice < originalPrice ? originalPrice - sellingPrice : 0;
  const discountPercent = originalPrice > 0 && savings > 0 ? Math.round((savings / originalPrice) * 100) : 0;

  // Condition description helper
  const getConditionDescription = (cond: string) => {
    switch (cond) {
      case 'New':
        return 'Brand new, unread, pristine condition with no markings or spine wear.';
      case 'Like New':
        return 'Appears brand new with virtually no signs of wear, flawless pages and cover.';
      case 'Good':
        return 'Clean copy with minor shelf wear or light notes/highlighting. Completely intact.';
      case 'Fair':
        return 'Readable and sturdy with noticeable wear, cover scuffs, or frequent highlighting.';
      case 'Poor':
        return 'Heavy wear, bent corners or binding wear, but all essential course pages are readable.';
      default:
        return 'Carefully inspected student copy.';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Top Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-campus-600 transition group"
          >
            <span className="p-1.5 rounded-xl bg-white border border-slate-200 group-hover:border-campus-300 group-hover:bg-campus-50 transition shadow-xs">
              <ArrowLeft className="w-4 h-4 text-slate-600 group-hover:text-campus-600" />
            </span>
            <span>Back to Marketplace</span>
          </Link>

          {book && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-xs font-semibold text-slate-700 shadow-xs transition cursor-pointer"
                title="Share link"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied Link!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Share</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsWishlisted(!isWishlisted)}
                className="p-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-500 shadow-xs transition cursor-pointer"
                title="Save to wishlist"
              >
                <Heart
                  className={`w-4 h-4 transition ${
                    isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-slate-400 hover:text-rose-500'
                  }`}
                />
              </button>
            </div>
          )}
        </div>

        {/* Loading State Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
            <div className="lg:col-span-5 space-y-4">
              <div className="aspect-4/3 sm:aspect-square bg-slate-200 rounded-3xl" />
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-square bg-slate-200 rounded-xl" />
                ))}
              </div>
            </div>
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-3">
                <div className="h-4 bg-slate-200 rounded-md w-24" />
                <div className="h-8 bg-slate-200 rounded-xl w-4/5" />
                <div className="h-4 bg-slate-200 rounded-md w-1/2" />
              </div>
              <div className="h-24 bg-slate-200 rounded-2xl" />
              <div className="h-32 bg-slate-200 rounded-2xl" />
              <div className="h-28 bg-slate-200 rounded-2xl" />
            </div>
          </div>
        )}

        {/* Error / Not Found State */}
        {!loading && errorMsg && (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs max-w-lg mx-auto my-12 space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Book Not Found</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                {errorMsg}
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 bg-campus-600 hover:bg-campus-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Browse Other Books
              </Link>
            </div>
          </div>
        )}

        {/* Main Book Detail View */}
        {!loading && book && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Image Gallery & Safety Assurance */}
            <div className="lg:col-span-5 space-y-5">
              {/* Main Image Container */}
              <div className="relative bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                <div className="aspect-4/3 sm:aspect-square relative bg-slate-100 flex items-center justify-center overflow-hidden">
                  {images.length > 0 ? (
                    <img
                      src={images[activeImageIndex] || images[0]}
                      alt={book.title}
                      className="w-full h-full object-contain p-4 transition-all duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                      <BookOpen className="w-16 h-16 text-slate-300 mb-2" />
                      <p className="text-sm font-semibold">No cover image available</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Seller listed this book without photos
                      </p>
                    </div>
                  )}

                  {/* Condition Badge on Cover */}
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/95 backdrop-blur-xs text-slate-800 text-xs font-black px-3 py-1 rounded-xl shadow-xs border border-slate-200">
                      {book.condition}
                    </span>
                  </div>

                  {/* Status Indicator */}
                  {book.status && (
                    <div className="absolute top-4 right-4">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-xl uppercase tracking-wider backdrop-blur-xs ${
                          book.status === 'sold'
                            ? 'bg-slate-900 text-white'
                            : book.status === 'pending'
                            ? 'bg-amber-100/90 text-amber-800 border border-amber-200'
                            : 'bg-emerald-600 text-white shadow-xs'
                        }`}
                      >
                        {book.status === 'approved' || book.status === 'available'
                          ? 'Available'
                          : book.status}
                      </span>
                    </div>
                  )}
                </div>

                {/* Thumbnails if > 1 image */}
                {images.length > 1 && (
                  <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
                    {images.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                          activeImageIndex === idx
                            ? 'border-campus-600 ring-2 ring-campus-200'
                            : 'border-slate-200 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`${book.title} - photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Campus Trust & Safety Notice */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-campus-700 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-campus-600" />
                  <span>Campus Safety Assurance</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Always meet in high-traffic campus locations (Library, Student Center, Campus
                  Coffee Shop) to inspect books and complete payments safely.
                </p>
                <div className="pt-1 flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-campus-600" />
                    Verified Campus
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-campus-600" />
                    Peer-to-Peer
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-campus-600" />
                    Zero Commission
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Listing Information & Details */}
            <div className="lg:col-span-7 space-y-6">
              {/* Category, Subject & Course Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {category && (
                  <span className="text-xs font-bold uppercase tracking-wider text-campus-700 bg-campus-50 border border-campus-200/60 px-3 py-1 rounded-xl">
                    {category.name}
                  </span>
                )}
                {book.course && (
                  <span className="text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200 px-3 py-1 rounded-xl">
                    Course: {book.course}
                  </span>
                )}
                {book.semester && (
                  <span className="text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
                    {book.semester}
                  </span>
                )}
              </div>

              {/* Book Title & Author */}
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  {book.title}
                </h1>
                <p className="text-sm sm:text-base text-slate-600 font-medium">
                  By <span className="text-slate-900 font-semibold">{book.author}</span>
                  {book.edition ? ` • ${book.edition}` : ''}
                </p>
              </div>

              {/* Price & Listing Type Box */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {book.listingType === 'donate' ? (
                    <div>
                      <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-black px-3.5 py-1.5 rounded-xl">
                        <HeartHandshake className="w-4 h-4 text-emerald-600" />
                        <span>FREE DONATION</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5">
                        This book is offered 100% free of charge to any student who needs it.
                      </p>
                    </div>
                  ) : book.listingType === 'exchange' ? (
                    <div>
                      <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm font-black px-3.5 py-1.5 rounded-xl">
                        <ArrowLeftRight className="w-4 h-4 text-amber-600" />
                        <span>BOOK EXCHANGE / SWAP</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5">
                        Seller is looking to swap this book for other course materials.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-3">
                        <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                          ${sellingPrice.toFixed(2)}
                        </span>
                        {originalPrice > 0 && originalPrice > sellingPrice && (
                          <span className="text-base sm:text-lg text-slate-400 line-through">
                            ${originalPrice.toFixed(2)}
                          </span>
                        )}
                        {discountPercent > 0 && (
                          <span className="text-xs font-black text-campus-700 bg-campus-100 px-2.5 py-1 rounded-lg">
                            {discountPercent}% OFF
                          </span>
                        )}
                      </div>
                      {savings > 0 && (
                        <p className="text-xs text-emerald-600 font-bold mt-1">
                          You save ${savings.toFixed(2)} compared to campus bookstore retail!
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions: Owner Manage vs Student Contact */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isOwner ? (
                      <Link
                        href="/my-books"
                        className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-sm transition"
                      >
                        <Layers className="w-4 h-4" />
                        <span>Manage My Listing</span>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={handleContactClick}
                        className="inline-flex items-center justify-center gap-2 bg-campus-600 hover:bg-campus-700 text-white px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-sm hover:shadow transition cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Contact Seller</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Contact Notice Alert */}
                {contactNotice && (
                  <div className="p-3.5 rounded-2xl bg-campus-50 border border-campus-200 text-campus-900 text-xs font-medium flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-campus-600 shrink-0 mt-0.5" />
                    <span>{contactNotice}</span>
                  </div>
                )}
              </div>

              {/* Condition Details Card */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Book Condition
                  </h3>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                    {book.condition}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {getConditionDescription(book.condition)}
                </p>
              </div>

              {/* Academic & Book Metadata Grid */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Course & Publishing Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                  {university && (
                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
                      <GraduationCap className="w-4 h-4 text-campus-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-[11px] font-bold text-slate-400 uppercase">
                          University Campus
                        </span>
                        <span className="font-semibold text-slate-800">{university.name}</span>
                        {university.city && (
                          <span className="block text-[11px] text-slate-500">
                            {university.city}, {university.country}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {book.subject && (
                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
                      <BookOpen className="w-4 h-4 text-campus-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-[11px] font-bold text-slate-400 uppercase">
                          Subject / Department
                        </span>
                        <span className="font-semibold text-slate-800">{book.subject}</span>
                      </div>
                    </div>
                  )}

                  {book.isbn && (
                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
                      <Hash className="w-4 h-4 text-campus-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-[11px] font-bold text-slate-400 uppercase">
                          ISBN
                        </span>
                        <span className="font-mono font-semibold text-slate-800">{book.isbn}</span>
                      </div>
                    </div>
                  )}

                  {(book.publisher || book.publicationYear) && (
                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
                      <Building className="w-4 h-4 text-campus-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-[11px] font-bold text-slate-400 uppercase">
                          Publisher & Year
                        </span>
                        <span className="font-semibold text-slate-800">
                          {book.publisher || 'N/A'}{' '}
                          {book.publicationYear ? `(${book.publicationYear})` : ''}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description Section */}
              {book.description && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Seller's Notes & Description
                  </h3>
                  <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {book.description}
                  </div>
                </div>
              )}

              {/* Exchange Preferences (if exchange listing) */}
              {book.listingType === 'exchange' && book.exchangePreferences && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-6 shadow-xs space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                    <ArrowLeftRight className="w-4 h-4 text-amber-700" />
                    <span>Looking to Exchange For</span>
                  </div>
                  <p className="text-xs sm:text-sm text-amber-900/90 leading-relaxed">
                    {book.exchangePreferences}
                  </p>
                </div>
              )}

              {/* Seller Information Card */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Listed By
                </h3>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    {seller?.avatar ? (
                      <img
                        src={seller.avatar}
                        alt={seller.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-campus-100 text-campus-700 font-black text-base flex items-center justify-center border border-campus-200">
                        {seller?.name ? seller.name.charAt(0).toUpperCase() : 'S'}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-sm">
                          {seller?.name || 'Campus Student'}
                        </span>
                        {seller?.isVerified && (
                          <span
                            title="Verified Campus Student"
                            className="inline-flex text-campus-600"
                          >
                            <CheckCircle2 className="w-4 h-4 fill-campus-50 text-campus-600" />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        {seller?.department && <span>{seller.department}</span>}
                        {seller?.yearOfStudy && (
                          <span>• Year {seller.yearOfStudy}</span>
                        )}
                        {!seller?.department && !seller?.yearOfStudy && (
                          <span>Student Member</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Seller Rating Badge */}
                  <div className="text-right">
                    <div className="inline-flex items-center gap-1 text-xs font-black text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
                      <span>★</span>
                      <span>{seller?.rating ? seller.rating.toFixed(1) : '5.0'}</span>
                    </div>
                    <span className="block text-[10px] text-slate-400 mt-1">
                      {seller?.totalRatings ? `${seller.totalRatings} ratings` : 'Campus Verified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Listing Meta Footer */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-2 pt-2">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  {book.viewsCount || 1} views
                </span>

                {book.createdAt && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Listed on {new Date(book.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

