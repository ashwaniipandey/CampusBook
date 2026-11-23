'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftRight,
  ArrowRight,
  BadgeDollarSign,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  HeartHandshake,
  Leaf,
  Library,
  MapPin,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import SearchAutocomplete from '@/components/SearchAutocomplete';
import BookCover from '@/components/BookCover';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { formatPrice, getBookPrice } from '@/lib/pricing';
import { MotionCard, MotionSection } from '@/components/MotionEffects';
import { Book, Category, University } from '@/types';
import { getVerificationHref, isVerifiedStudent } from '@/lib/verification';

interface PublicStats {
  students: number;
  booksListed: number;
  universities: number;
  booksReused: number;
  co2SavedKg: number;
}

interface CategoryCount {
  _id: string;
  count: number;
}

function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-card-border bg-card">
          <div className="aspect-[4/3] animate-pulse bg-card/60" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-4/5 animate-pulse rounded bg-card/80" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-card/60" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-card/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionError({ message }: { message: string }) {
  const isConnecting =
    message.toLowerCase().includes('starting up') ||
    message.toLowerCase().includes('unable to connect');

  if (isConnecting) {
    return (
      <div
        role="status"
        className="flex flex-col gap-3 rounded-2xl border border-card-border bg-card px-5 py-4 text-sm text-heading sm:flex-row sm:items-center sm:justify-between"
      >
        <span className="flex items-center gap-2">
          {/* Spinner */}
          <svg
            className="h-4 w-4 shrink-0 animate-spin text-accent"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Server is starting up — content will load shortly. This can take up to 30 seconds on first visit.
        </span>
        <a href="/" className="w-fit whitespace-nowrap font-bold text-accent underline underline-offset-2">
          Retry
        </a>
      </div>
    );
  }

  return (
    <div role="status" className="flex flex-col gap-3 rounded-2xl border border-rose-400/30 bg-card px-5 py-4 text-sm text-rose-300 sm:flex-row sm:items-center sm:justify-between">
      <span>{message}</span>
      <a href="/" className="w-fit whitespace-nowrap font-bold text-rose-300 underline underline-offset-2 hover:text-heading">
        Try again
      </a>
    </div>
  );
}

function BookCard({ book }: { book: Book }) {
  const image = book.images?.[0];
  const imageUrl = image ? (typeof image === 'string' ? image : image.url) : '';
  const categoryName = typeof book.category === 'object' ? book.category.name : '';
  const universityName = typeof book.university === 'object' ? book.university.name : '';
  const price = getBookPrice(book);
  const originalPrice = Number(book.originalPrice || 0);
  const discount = originalPrice > price && price > 0
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <MotionCard className="h-full">
      <Link
        href={`/books/${book._id}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-card-border bg-card shadow-sm transition duration-200 hover:-translate-y-1 hover:border-accent"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-card/40">
          <BookCover
            src={imageUrl}
            alt={`Cover of ${book.title}`}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
          <span className="absolute left-3 top-3 rounded-full border border-card-border bg-card/90 px-2.5 py-1 text-[10px] font-bold text-heading shadow-sm backdrop-blur">
            {book.condition}
          </span>
          {book.listingType === 'donate' && (
            <span className="absolute right-3 top-3 rounded-full bg-accent px-3 py-1 text-xs font-bold text-btn-primary-text shadow">
              Free
            </span>
          )}
          {book.listingType === 'exchange' && (
            <span className="absolute right-3 top-3 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-btn-primary-text shadow">
              Exchange
            </span>
          )}
          {discount > 0 && book.listingType === 'sell' && (
            <span className="absolute right-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold text-btn-primary-text shadow">
              {discount}% off
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col p-4">
          {categoryName && <p className="text-[11px] font-bold uppercase tracking-wide text-accent">{categoryName}</p>}
          <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-bold text-heading">{book.title}</h3>
          <p className="mt-1 line-clamp-1 text-xs text-muted">{book.author}</p>
          <div className="mt-auto flex items-end justify-between gap-2 pt-4">
            <span className="font-extrabold text-heading">
              {book.listingType === 'donate' ? 'Free' : book.listingType === 'exchange' ? 'Trade' : formatPrice(price)}
            </span>
            <span className="max-w-[55%] truncate text-right text-[11px] text-muted">
              {universityName || book.condition}
            </span>
          </div>
          {discount > 0 && book.listingType === 'sell' && (
            <span className="mt-1 text-right text-[11px] text-muted line-through">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>
      </Link>
    </MotionCard>
  );
}

const smartFeatures = [
  {
    icon: Sparkles,
    title: 'Personalized recommendations',
    description: 'Find books matched to your course, campus, wishlist, and interests.',
    href: '/dashboard',
  },
  {
    icon: BadgeDollarSign,
    title: 'Fair price suggestions',
    description: 'Get a data-informed price range from comparable campus listings.',
    href: '/sell',
  },
  {
    icon: ArrowLeftRight,
    title: 'Exchange matching',
    description: 'Discover students whose book needs line up with your own.',
    href: '/exchange-matches',
  },
  {
    icon: Leaf,
    title: 'Savings and impact',
    description: 'See the money you save and the books you help keep in circulation.',
    href: '/dashboard',
  },
  {
    icon: Search,
    title: 'Smarter search',
    description: 'Find titles, authors, and ISBNs with quick suggestions and filters.',
    href: '/explore',
  },
  {
    icon: MessageCircle,
    title: 'Campus messaging',
    description: 'Coordinate trades and safe handovers directly with other students.',
    href: '/messages',
  },
];

const sampleTestimonials = [
  {
    quote: 'I found the book I needed for class and arranged a quick campus pickup.',
    attribution: 'Sample student story',
  },
  {
    quote: 'Passing my textbooks on helped another student and cleared my shelf.',
    attribution: 'Sample community story',
  },
  {
    quote: 'The exchange made it easy to trade a book I had for one I needed.',
    attribution: 'Sample exchange story',
  },
];

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const reduceMotion = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [universities, setUniversities] = useState<University[]>([]);
  const [universityError, setUniversityError] = useState('');
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<CategoryCount[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState('');
  const [trendingBooks, setTrendingBooks] = useState<Book[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [trendingError, setTrendingError] = useState('');
  const [exchangeBooks, setExchangeBooks] = useState<Book[]>([]);
  const [donationBooks, setDonationBooks] = useState<Book[]>([]);
  const [highlightsLoading, setHighlightsLoading] = useState(true);
  const [highlightsError, setHighlightsError] = useState('');

  useEffect(() => {
    let active = true;
    api.getUniversities()
      .then((response) => {
        if (active) setUniversities(response.universities || []);
      })
      .catch((error: unknown) => {
        if (active) setUniversityError(error instanceof Error ? error.message : 'Unable to load universities.');
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    api.getPublicStats()
      .then((response) => {
        if (active) setStats(response);
      })
      .catch((error: unknown) => {
        if (active) setStatsError(error instanceof Error ? error.message : 'Unable to load community stats.');
      })
      .finally(() => {
        if (active) setStatsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([api.getCategories(), api.getFiltersMeta()])
      .then(([categoryResponse, filtersResponse]) => {
        if (active) {
          setCategories(categoryResponse.categories || []);
          setCategoryCounts(filtersResponse.categoryCounts || []);
        }
      })
      .catch((error: unknown) => {
        if (active) setCategoriesError(error instanceof Error ? error.message : 'Unable to load categories.');
      })
      .finally(() => {
        if (active) setCategoriesLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    api.getSmartTrending()
      .then((response) => {
        if (active) setTrendingBooks(response.books || []);
      })
      .catch((error: unknown) => {
        if (active) setTrendingError(error instanceof Error ? error.message : 'Unable to load trending books.');
      })
      .finally(() => {
        if (active) setTrendingLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.getBooks({ listingType: 'exchange', limit: 3, sort: 'popular' }),
      api.getBooks({ listingType: 'donate', limit: 3, sort: 'popular' }),
    ])
      .then(([exchangeResponse, donationResponse]) => {
        if (active) {
          setExchangeBooks(exchangeResponse.books || []);
          setDonationBooks(donationResponse.books || []);
        }
      })
      .catch((error: unknown) => {
        if (active) setHighlightsError(error instanceof Error ? error.message : 'Unable to load exchange and donation listings.');
      })
      .finally(() => {
        if (active) setHighlightsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const categoryCountById = useMemo(
    () => new Map(categoryCounts.map((item) => [item._id, item.count])),
    [categoryCounts]
  );

  const goToExplore = (query = searchQuery) => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (selectedUniversity) params.set('university', selectedUniversity);
    router.push(`/explore${params.size ? `?${params.toString()}` : ''}`);
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    goToExplore();
  };

  const sellHref = !isAuthenticated
    ? `/login?redirect=${encodeURIComponent('/sell')}`
    : isVerifiedStudent(user)
      ? '/sell'
      : getVerificationHref('/sell');

  const isServerStarting =
    (statsLoading || trendingLoading || categoriesLoading || highlightsLoading) &&
    !stats &&
    !trendingBooks.length &&
    !categories.length;

  return (
    <main className="overflow-hidden">
      {isServerStarting && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
        >
          <svg
            className="h-4 w-4 shrink-0 animate-spin text-amber-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span>CampusBook server is waking up — live listings will appear shortly. First visit may take up to 30 seconds.</span>
        </div>
      )}
      {/* HERO SECTION */}
      <MotionSection className="relative isolate overflow-hidden text-heading">
        {/* Ambient blurred glow blobs */}
        <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-accent/15 blur-[120px]" />
        <div className="pointer-events-none absolute right-0 top-1/4 h-[32rem] w-[32rem] rounded-full bg-accent/10 blur-[140px]" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-accent/10 blur-[130px]" />

        {/* Subtle decorative grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pt-10 pb-16 sm:px-6 sm:pt-14 sm:pb-20 lg:px-8 lg:pt-16 lg:pb-24">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
            {/* Left Column: Headline, Subtext, Search, CTAs */}
            <div className="lg:col-span-6 xl:col-span-6">
              {/* Pill Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 shadow-inner dark:border-card-border dark:bg-card/60 dark:text-heading backdrop-blur-md">
                <GraduationCap className="h-4 w-4 text-emerald-700 dark:text-accent" />
                <span>Student-to-Student Book Marketplace</span>
              </div>

              {/* Headline */}
              <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-heading sm:text-5xl lg:text-[52px] lg:leading-[1.12]">
                Your Next Chapter Starts With a{' '}
                <span className="relative inline-block whitespace-nowrap italic bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent dark:from-emerald-300 dark:to-emerald-400">
                  Pre-Loved Book
                  {/* Hand-drawn curved underline */}
                  <svg
                    className="absolute -bottom-2.5 left-0 w-full overflow-visible text-emerald-600 dark:text-accent"
                    height="12"
                    viewBox="0 0 240 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 9.5C65 2.5 175 1.5 238 9"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>

              {/* Subtext */}
              <p className="mt-6 max-w-xl text-base leading-relaxed text-text sm:text-lg">
                Buy, sell, exchange or donate academic books within your campus
                community. Save money, share knowledge and make learning more
                sustainable.
              </p>

              {/* Search Bar Pill Form */}
              <form
                onSubmit={handleSearchSubmit}
                className="mt-8 rounded-3xl border border-card-border bg-card/60 p-2 shadow-2xl backdrop-blur-xl sm:rounded-full sm:p-2 sm:pl-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  {/* Autocomplete Input */}
                  <div className="relative flex-1">
                    <SearchAutocomplete
                      value={searchQuery}
                      onChange={setSearchQuery}
                      onSearch={goToExplore}
                      placeholder="Search books (e.g. DBMS, OS, DSA...)"
                      inputClassName="w-full bg-transparent border-0 text-sm text-heading placeholder:text-muted focus:ring-0 focus:outline-none py-3 pl-2"
                    />
                  </div>

                  {/* Vertical Divider */}
                  <div className="hidden h-7 w-px bg-card-border sm:block" />

                  {/* University Campus Select */}
                  <div className="relative min-w-[170px] sm:max-w-[210px]">
                    <GraduationCap className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
                    <select
                      value={selectedUniversity}
                      onChange={(event) => setSelectedUniversity(event.target.value)}
                      aria-label="All Colleges"
                      className="w-full appearance-none truncate rounded-full border-0 bg-transparent py-2.5 pl-9 pr-8 text-xs font-semibold text-heading focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <option value="" className="bg-card text-heading">
                        All Colleges
                      </option>
                      {universities.map((university) => (
                        <option
                          key={university._id}
                          value={university._id}
                          className="bg-card text-heading"
                        >
                          {university.name}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted text-[10px]">
                      ▼
                    </span>
                  </div>
                </div>
              </form>

              {universityError && (
                <p
                  role="status"
                  className="mt-2.5 flex items-center gap-2 text-xs text-rose-300"
                >
                  <span>{universityError}</span>
                  <a href="/" className="font-bold underline underline-offset-2">
                    Retry
                  </a>
                </p>
              )}

              {/* Action Buttons */}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => goToExplore()}
                  className="inline-flex items-center gap-2 rounded-full bg-btn-primary px-6 py-3.5 text-sm font-bold text-btn-primary-text shadow-md transition hover:opacity-90 active:scale-[0.98]"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Explore Books</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <Link
                  href={sellHref}
                  className="inline-flex items-center gap-2 rounded-full border border-card-border/60 bg-btn-secondary px-6 py-3.5 text-sm font-bold text-btn-secondary-text shadow-sm transition hover:opacity-90 active:scale-[0.98]"
                >
                  <Plus className="h-4 w-4" />
                  <span>Sell a Book</span>
                </Link>
              </div>
            </div>

            {/* Right Column: Hero Image with Floating Polaroid Cards */}
            <div className="relative lg:col-span-6 xl:col-span-6">
              {/* Soft Radial Green Glow behind hero image */}
              <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-accent/20 blur-3xl" />

              {/* Main Campus Photo */}
              <div className="relative aspect-[16/11] w-full overflow-hidden rounded-3xl border border-card-border bg-card shadow-2xl">
                <Image
                  src="/images/hero-campus.jpg"
                  alt="Students studying with books outside the campus library"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>

              {/* Floating Polaroid Cards (overlapping left edge) */}
              {/* Card 1: Campus Library (Top, rotated -6deg) */}
              <motion.div
                className="absolute -top-6 -left-4 sm:-top-8 sm:-left-8 z-20 w-36 sm:w-44 rounded-2xl border-2 border-card-border bg-card p-2 shadow-2xl backdrop-blur-md"
                style={{ rotate: -6 }}
                animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-card/40">
                  <Image
                    src="/images/library.jpg"
                    alt="Campus Library stacks"
                    fill
                    sizes="180px"
                    className="object-cover"
                  />
                </div>
                <div className="mt-2 flex items-center justify-center gap-1 rounded-md bg-chip px-2 py-1 text-[11px] font-bold text-heading">
                  <Library className="h-3 w-3 text-accent" />
                  <span>Campus Library</span>
                </div>
              </motion.div>

              {/* Card 2: Course Books (Middle, rotated +4deg) */}
              <motion.div
                className="absolute top-1/3 -left-6 sm:-left-12 z-20 w-38 sm:w-48 rounded-2xl border-2 border-card-border bg-card p-2 shadow-2xl backdrop-blur-md"
                style={{ rotate: 4 }}
                animate={reduceMotion ? undefined : { y: [0, 8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-card/40">
                  <Image
                    src="/images/books.jpg"
                    alt="Stacked engineering course books"
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                </div>
                <div className="mt-2 flex items-center justify-center gap-1 rounded-md bg-chip px-2 py-1 text-[11px] font-bold text-heading">
                  <BookOpen className="h-3 w-3 text-accent" />
                  <span>Course Books</span>
                </div>
              </motion.div>

              {/* Card 3: Exchange / Donate (Bottom, rotated -4deg) */}
              <motion.div
                className="absolute -bottom-6 -left-3 sm:-bottom-8 sm:-left-6 z-20 w-40 sm:w-52 rounded-2xl border-2 border-card-border bg-card p-2 shadow-2xl backdrop-blur-md"
                style={{ rotate: -4 }}
                animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
                transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 1.6 }}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-card/40">
                  <Image
                    src="/images/exchange.jpg"
                    alt="Handing over a pre-loved book to another student"
                    fill
                    sizes="220px"
                    className="object-cover"
                  />
                </div>
                <div className="mt-2 flex items-center justify-center gap-1 rounded-md bg-chip px-2 py-1 text-[11px] font-bold text-heading">
                  <ArrowLeftRight className="h-3 w-3 text-accent" />
                  <span>Exchange / Donate</span>
                </div>
              </motion.div>

              {/* Subtle Decorative sparkles and leaf strokes */}
              <div className="pointer-events-none absolute -top-8 right-6 text-accent/40">
                <Sparkles className="h-8 w-8" />
              </div>
              <div className="pointer-events-none absolute bottom-4 -right-4 text-accent/30">
                <Leaf className="h-10 w-10 rotate-12" />
              </div>
            </div>
          </div>

          {/* Glassmorphism Benefits Bar */}
          <div className="mt-16 sm:mt-20 rounded-3xl border border-card-border bg-card p-6 shadow-2xl backdrop-blur-xl">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-card-border">
              {/* Item 1: Save Money */}
              <div className="flex items-center gap-4 lg:px-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/20 text-accent ring-1 ring-card-border">
                  <Wallet className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-heading">Save Money</h3>
                  <p className="mt-0.5 text-xs text-muted">
                    Get quality books at student-friendly prices
                  </p>
                </div>
              </div>

              {/* Item 2: Promote Reuse */}
              <div className="flex items-center gap-4 lg:px-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/20 text-accent ring-1 ring-card-border">
                  <RefreshCw className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-heading">Promote Reuse</h3>
                  <p className="mt-0.5 text-xs text-muted">
                    Give books a second life on campus
                  </p>
                </div>
              </div>

              {/* Item 3: Student Community */}
              <div className="flex items-center gap-4 lg:px-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/20 text-accent ring-1 ring-card-border">
                  <Users className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-heading">Student Community</h3>
                  <p className="mt-0.5 text-xs text-muted">
                    Connect with peers from your college
                  </p>
                </div>
              </div>

              {/* Item 4: Academic Support */}
              <div className="flex items-center gap-4 lg:px-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/20 text-accent ring-1 ring-card-border">
                  <GraduationCap className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-heading">Academic Support</h3>
                  <p className="mt-0.5 text-xs text-muted">
                    Find the right books for your course &amp; semester
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MotionSection>

      <MotionSection aria-label="Live CampusBook community statistics" className="border-b border-card-border bg-transparent">
        <h2 className="mx-auto max-w-7xl px-4 pt-5 text-sm font-bold text-heading sm:px-6 lg:px-8">
          A campus community growing together
        </h2>
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-card-border px-4 sm:px-6 md:grid-cols-3 md:divide-y-0 lg:grid-cols-5 lg:px-8">
          {[
            { label: 'Students', value: stats?.students, icon: Users },
            { label: 'Books listed', value: stats?.booksListed, icon: BookOpen },
            { label: 'Universities', value: stats?.universities, icon: GraduationCap },
            { label: 'Books reused', value: stats?.booksReused, icon: HeartHandshake },
            { label: 'CO₂ saved', value: stats ? `${stats.co2SavedKg.toFixed(1)} kg` : undefined, icon: Leaf },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-5 sm:justify-center sm:px-6 lg:py-7">
              <span className="hidden h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-accent sm:flex">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                {statsLoading ? (
                  <div className="h-7 w-16 animate-pulse rounded bg-card/60" />
                ) : (
                  <p className="text-xl font-extrabold text-heading sm:text-2xl">{statsError ? '—' : value ?? '—'}</p>
                )}
                <p className="mt-0.5 text-xs font-medium text-muted">{label}</p>
              </div>
            </div>
          ))}
        </div>
        {statsError && (
          <p role="status" className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-2 px-4 pb-3 text-xs text-rose-300 sm:px-6 lg:px-8">
            <span>{statsError} Showing neutral placeholders until live counts are available.</span>
            <a href="/" className="font-bold underline underline-offset-2">Retry</a>
          </p>
        )}
      </MotionSection>

      <MotionSection className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-accent">A better way to find your books</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-heading sm:text-4xl">How CampusBook works</h2>
          <p className="mt-3 text-sm leading-6 text-text">A simple, local loop that keeps useful course books moving between students.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: BookOpen, title: 'List a book', text: 'Post a book to sell, exchange, or donate in a few steps.' },
            { icon: Search, title: 'Discover', text: 'Search listings by title, course, ISBN, or university.' },
            { icon: MessageCircle, title: 'Connect and chat', text: 'Message students to ask questions and agree on the details.' },
            { icon: MapPin, title: 'Meet on campus', text: 'Arrange a convenient handover at a familiar campus spot.' },
          ].map(({ icon: Icon, title, text }, index) => (
            <article key={title} className="relative rounded-2xl border border-card-border bg-card p-5 shadow-sm backdrop-blur-md">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/20 text-accent"><Icon className="h-5 w-5" /></span>
              <span className="absolute right-5 top-5 text-3xl font-black text-card-border">0{index + 1}</span>
              <h3 className="mt-5 text-base font-bold text-heading">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-text">{text}</p>
            </article>
          ))}
        </div>
      </MotionSection>

      <MotionSection className="border-y border-card-border bg-transparent">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-accent">Browse by subject</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-heading">Explore categories</h2>
            </div>
            <Link href="/explore" className="inline-flex items-center gap-1 text-sm font-bold text-accent hover:underline">
              Browse all books <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {categoriesLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl bg-card/60" />)}
            </div>
          ) : categoriesError ? (
            <SectionError message={categoriesError} />
          ) : categories.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {categories.slice(0, 8).map((category) => (
                <Link
                  key={category._id}
                  href={`/explore?category=${encodeURIComponent(category._id)}`}
                  className="group flex items-center justify-between gap-2 rounded-2xl border border-card-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-accent sm:p-5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-heading group-hover:text-accent">{category.name}</span>
                    <span className="mt-1 block text-xs text-muted">{categoryCountById.get(category._id) ?? 0} books</span>
                  </span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent transition group-hover:bg-accent group-hover:text-btn-primary-text">
                    <BookOpen className="h-4 w-4" />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-card-border bg-card p-8 text-center text-sm text-muted">
              <p>Categories will appear here as they become available.</p>
              <a href="/" className="mt-3 inline-block font-bold text-accent underline underline-offset-2">Refresh categories</a>
            </div>
          )}
        </div>
      </MotionSection>

      <MotionSection className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-accent">Popular on campus</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-heading">Featured and trending books</h2>
            <p className="mt-2 text-sm text-text">Real listings students are browsing right now.</p>
          </div>
          <Link href="/explore" className="inline-flex items-center gap-1 text-sm font-bold text-accent hover:underline">
            See all listings <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {trendingLoading ? (
          <SkeletonGrid count={4} />
        ) : trendingError ? (
          <SectionError message={trendingError} />
        ) : trendingBooks.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {trendingBooks.slice(0, 8).map((book) => <BookCard key={book._id} book={book} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-card-border bg-card p-8 text-center text-sm text-muted">
            <p>There are no trending listings yet. Browse all books or check back soon.</p>
            <a href="/" className="mt-3 inline-block font-bold text-accent underline underline-offset-2">Refresh listings</a>
          </div>
        )}
      </MotionSection>

      <MotionSection className="border-y border-card-border bg-transparent">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-accent">Give books another chapter</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-heading sm:text-4xl">Exchange or pass one on for free</h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-text">Find a different book through a trade, or help another student by donating a title you’ve finished.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/explore?listingType=exchange" className="inline-flex items-center gap-2 rounded-xl bg-btn-primary px-4 py-3 text-sm font-bold text-btn-primary-text shadow-sm hover:opacity-90">
                <ArrowLeftRight className="h-4 w-4" /> Browse exchanges
              </Link>
              <Link href="/explore?listingType=donate" className="inline-flex items-center gap-2 rounded-xl border border-card-border/60 bg-btn-secondary px-4 py-3 text-sm font-bold text-btn-secondary-text shadow-sm hover:opacity-90">
                <HeartHandshake className="h-4 w-4" /> Find free books
              </Link>
            </div>
          </div>
          {highlightsLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((item) => <div key={item} className="h-52 animate-pulse rounded-2xl bg-card/60" />)}
            </div>
          ) : highlightsError ? (
            <SectionError message={highlightsError} />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {[
                ...exchangeBooks.slice(0, 2),
                ...donationBooks.slice(0, 2),
              ].map((book) => <BookCard key={book._id} book={book} />)}
              {!exchangeBooks.length && !donationBooks.length && (
                <p className="col-span-2 rounded-2xl border border-card-border bg-card p-8 text-center text-sm text-muted">
                  No exchange or donation listings are available right now.{' '}
                  <a href="/" className="font-bold text-accent underline underline-offset-2">Refresh listings</a>
                </p>
              )}
            </div>
          )}
        </div>
      </MotionSection>

      <MotionSection className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-accent">Built for student book sharing</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-heading sm:text-4xl">Smarter tools for every chapter</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {smartFeatures.map(({ icon: Icon, title, description, href }) => (
            <Link key={title} href={href} className="group rounded-2xl border border-card-border bg-card p-5 transition hover:border-accent hover:shadow-md">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/20 text-accent group-hover:bg-accent group-hover:text-btn-primary-text">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-bold text-heading">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-text">{description}</p>
            </Link>
          ))}
        </div>
      </MotionSection>

      <MotionSection className="border-y border-card-border bg-transparent">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto mb-9 max-w-2xl text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-accent">Student stories</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-heading">A community built around sharing</h2>
            <p className="mt-2 text-xs text-muted">Sample testimonials for demonstration; not verified user reviews.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {sampleTestimonials.map((testimonial) => (
              <figure key={testimonial.attribution} className="rounded-2xl border border-card-border bg-card p-6 shadow-sm backdrop-blur-md">
                <div className="flex gap-1 text-amber-400" aria-label="Sample five-star rating">
                  {Array.from({ length: 5 }, (_, index) => <span key={index} aria-hidden="true">★</span>)}
                </div>
                <blockquote className="mt-4 text-sm leading-6 text-text">“{testimonial.quote}”</blockquote>
                <figcaption className="mt-5 flex items-center gap-2 text-xs font-bold text-accent">
                  <CheckCircle2 className="h-4 w-4" /> {testimonial.attribution}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </MotionSection>

      <MotionSection className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-[2rem] border border-card-border bg-card p-7 text-heading shadow-xl backdrop-blur-xl sm:p-10 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Your campus book community</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-heading sm:text-4xl">Ready to find your next read?</h2>
            <p className="mt-3 text-sm leading-6 text-text">Explore student listings or give a book a new home on campus.</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link href="/explore" className="inline-flex items-center justify-center gap-2 rounded-xl bg-btn-primary px-5 py-3 text-sm font-bold text-btn-primary-text shadow-sm hover:opacity-90">
              Explore Books <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href={isAuthenticated ? '/sell' : '/login?redirect=%2Fsell'} className="inline-flex items-center justify-center gap-2 rounded-xl border border-card-border/60 bg-btn-secondary px-5 py-3 text-sm font-bold text-btn-secondary-text shadow-sm hover:opacity-90">
              Sell a Book <BookOpen className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </MotionSection>
    </main>
  );
}
