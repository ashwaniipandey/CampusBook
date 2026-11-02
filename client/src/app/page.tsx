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
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import SearchAutocomplete from '@/components/SearchAutocomplete';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { formatPrice, getBookPrice } from '@/lib/pricing';
import { MotionCard, MotionSection } from '@/components/MotionEffects';
import { Book, Category, University } from '@/types';

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
        <div key={index} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="aspect-[4/3] animate-pulse bg-slate-200" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionError({ message }: { message: string }) {
  return (
    <div role="status" className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200 sm:flex-row sm:items-center sm:justify-between">
      <span>{message}</span>
      <a href="/" className="w-fit whitespace-nowrap font-bold underline underline-offset-2 hover:text-rose-950">
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

  return (
    <MotionCard className="h-full">
      <Link
        href={`/books/${book._id}`}
          className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-campus-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900"
      >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`Cover of ${book.title}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <BookOpen className="h-12 w-12" aria-hidden="true" />
          </div>
        )}
        {book.listingType === 'donate' && (
          <span className="absolute left-3 top-3 rounded-full bg-emerald-700 px-3 py-1 text-xs font-bold text-white shadow">
            Free
          </span>
        )}
        {book.listingType === 'exchange' && (
          <span className="absolute left-3 top-3 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow">
            Exchange
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        {categoryName && <p className="text-[11px] font-bold uppercase tracking-wide text-campus-700">{categoryName}</p>}
        <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-bold text-slate-900">{book.title}</h3>
        <p className="mt-1 line-clamp-1 text-xs text-slate-500">{book.author}</p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <span className="font-extrabold text-campus-800">
            {book.listingType === 'donate' ? 'Free' : book.listingType === 'exchange' ? 'Trade' : formatPrice(price)}
          </span>
          <span className="max-w-[55%] truncate text-right text-[11px] text-slate-500">
            {universityName || book.condition}
          </span>
        </div>
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
  const { isAuthenticated } = useAuth();
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

  return (
    <main className="overflow-hidden">
      <MotionSection className="relative isolate border-b border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-green-50 dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950">
        <div className="absolute -right-32 -top-32 -z-10 h-96 w-96 rounded-full bg-emerald-100/70 blur-3xl dark:bg-emerald-900/30" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-xs font-bold text-campus-800 shadow-sm dark:border-emerald-800 dark:bg-slate-900/80 dark:text-emerald-200">
              <ShieldCheck className="h-4 w-4 text-campus-600" />
              The student-to-student book marketplace
            </span>
            <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Your Next Chapter Starts With a{' '}
              <span className="text-campus-700 dark:text-emerald-300">Pre-Loved Book</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
              Find affordable course books from students around your campus. Buy, exchange, or pass on the books you no longer need.
            </p>

            <form onSubmit={handleSearchSubmit} className="mt-8 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-emerald-900/5 dark:border-slate-700 dark:bg-slate-900 sm:p-4">
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <SearchAutocomplete
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onSearch={goToExplore}
                  placeholder="Search title, author, course, or ISBN"
                  inputClassName="py-3.5"
                />
                <label className="relative block">
                  <GraduationCap className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    value={selectedUniversity}
                    onChange={(event) => setSelectedUniversity(event.target.value)}
                    aria-label="Filter by university"
                    className="w-full min-w-0 rounded-xl border border-slate-200 bg-white py-3.5 pl-10 pr-8 text-sm text-slate-800 focus:border-campus-400 focus:outline-none focus:ring-2 focus:ring-campus-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 md:min-w-64"
                  >
                    <option value="">All universities</option>
                    {universities.map((university) => (
                      <option key={university._id} value={university._id}>{university.name}</option>
                    ))}
                  </select>
                </label>
              </div>
              {universityError && (
                <p role="status" className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-rose-700 dark:text-rose-300">
                  <span>{universityError}</span>
                  <a href="/" className="font-bold underline underline-offset-2">Retry</a>
                </p>
              )}
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button type="submit" className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-campus-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-campus-800">
                  <Search className="h-4 w-4" /> Explore Books
                </button>
                <Link href={isAuthenticated ? '/sell' : '/login?redirect=%2Fsell'} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-campus-200 bg-campus-50 px-5 py-3 text-sm font-bold text-campus-800 transition hover:bg-campus-100 dark:border-campus-800 dark:bg-campus-950 dark:text-campus-200 dark:hover:bg-campus-900">
                  <BookOpen className="h-4 w-4" /> Sell a Book
                </Link>
              </div>
            </form>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-campus-200/70 to-emerald-100/30 blur-xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white bg-white p-3 shadow-2xl shadow-emerald-950/10 dark:border-slate-700 dark:bg-slate-900">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-campus-700 to-emerald-950">
                <Image
                  src="/book-marketplace-hero.svg"
                  alt="Illustration of books being shared in a campus community"
                  fill
                  priority
                  sizes="(max-width: 1024px) 90vw, 45vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute bottom-7 left-7 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-campus-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <HeartHandshake className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Books find new stories</p>
                  <p className="text-xs text-slate-500 dark:text-slate-300">Shared locally, used again</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MotionSection>

      <MotionSection aria-label="Live CampusBook community statistics" className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <h2 className="mx-auto max-w-7xl px-4 pt-5 text-sm font-bold text-slate-700 dark:text-slate-200 sm:px-6 lg:px-8">
          A campus community growing together
        </h2>
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-slate-100 px-4 sm:px-6 md:grid-cols-3 md:divide-y-0 lg:grid-cols-5 lg:px-8">
          {[
            { label: 'Students', value: stats?.students, icon: Users },
            { label: 'Books listed', value: stats?.booksListed, icon: BookOpen },
            { label: 'Universities', value: stats?.universities, icon: GraduationCap },
            { label: 'Books reused', value: stats?.booksReused, icon: HeartHandshake },
            { label: 'CO₂ saved', value: stats ? `${stats.co2SavedKg.toFixed(1)} kg` : undefined, icon: Leaf },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-5 sm:justify-center sm:px-6 lg:py-7">
              <span className="hidden h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-campus-700 sm:flex">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                {statsLoading ? (
                  <div className="h-7 w-16 animate-pulse rounded bg-slate-100" />
                ) : (
                  <p className="text-xl font-extrabold text-slate-900 sm:text-2xl">{statsError ? '—' : value ?? '—'}</p>
                )}
                <p className="mt-0.5 text-xs font-medium text-slate-500">{label}</p>
              </div>
            </div>
          ))}
        </div>
        {statsError && (
          <p role="status" className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-2 px-4 pb-3 text-xs text-rose-700 dark:text-rose-300 sm:px-6 lg:px-8">
            <span>{statsError} Showing neutral placeholders until live counts are available.</span>
            <a href="/" className="font-bold underline underline-offset-2">Retry</a>
          </p>
        )}
      </MotionSection>

      <MotionSection className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-campus-700">A better way to find your books</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">How CampusBook works</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">A simple, local loop that keeps useful course books moving between students.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: BookOpen, title: 'List a book', text: 'Post a book to sell, exchange, or donate in a few steps.' },
            { icon: Search, title: 'Discover', text: 'Search listings by title, course, ISBN, or university.' },
            { icon: MessageCircle, title: 'Connect and chat', text: 'Message students to ask questions and agree on the details.' },
            { icon: MapPin, title: 'Meet on campus', text: 'Arrange a convenient handover at a familiar campus spot.' },
          ].map(({ icon: Icon, title, text }, index) => (
            <article key={title} className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-campus-50 text-campus-700"><Icon className="h-5 w-5" /></span>
              <span className="absolute right-5 top-5 text-3xl font-black text-emerald-100">0{index + 1}</span>
              <h3 className="mt-5 text-base font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </MotionSection>

      <MotionSection className="border-y border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-campus-700">Browse by subject</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Explore categories</h2>
            </div>
            <Link href="/explore" className="inline-flex items-center gap-1 text-sm font-bold text-campus-700 hover:text-campus-900">
              Browse all books <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {categoriesLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl bg-slate-200" />)}
            </div>
          ) : categoriesError ? (
            <SectionError message={categoriesError} />
          ) : categories.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {categories.slice(0, 8).map((category) => (
                <Link
                  key={category._id}
                  href={`/explore?category=${encodeURIComponent(category._id)}`}
                  className="group flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-campus-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-950 sm:p-5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-slate-900 group-hover:text-campus-800">{category.name}</span>
                    <span className="mt-1 block text-xs text-slate-500">{categoryCountById.get(category._id) ?? 0} books</span>
                  </span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-campus-700 transition group-hover:bg-campus-700 group-hover:text-white">
                    <BookOpen className="h-4 w-4" />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950">
              <p>Categories will appear here as they become available.</p>
              <a href="/" className="mt-3 inline-block font-bold text-campus-700 underline underline-offset-2">Refresh categories</a>
            </div>
          )}
        </div>
      </MotionSection>

      <MotionSection className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-campus-700">Popular on campus</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Featured and trending books</h2>
            <p className="mt-2 text-sm text-slate-600">Real listings students are browsing right now.</p>
          </div>
          <Link href="/explore" className="inline-flex items-center gap-1 text-sm font-bold text-campus-700 hover:text-campus-900">
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
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900">
            <p>There are no trending listings yet. Browse all books or check back soon.</p>
            <a href="/" className="mt-3 inline-block font-bold text-campus-700 underline underline-offset-2">Refresh listings</a>
          </div>
        )}
      </MotionSection>

      <MotionSection className="bg-campus-950">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-300">Give books another chapter</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Exchange or pass one on for free</h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-emerald-100/80">Find a different book through a trade, or help another student by donating a title you’ve finished.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/explore?listingType=exchange" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-campus-900 hover:bg-emerald-50">
                <ArrowLeftRight className="h-4 w-4" /> Browse exchanges
              </Link>
              <Link href="/explore?listingType=donate" className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-4 py-3 text-sm font-bold text-white hover:bg-white/10">
                <HeartHandshake className="h-4 w-4" /> Find free books
              </Link>
            </div>
          </div>
          {highlightsLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((item) => <div key={item} className="h-52 animate-pulse rounded-2xl bg-white/10" />)}
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
                <p className="col-span-2 rounded-2xl border border-white/20 bg-white/5 p-8 text-center text-sm text-emerald-100">
                  No exchange or donation listings are available right now.{' '}
                  <a href="/" className="font-bold underline underline-offset-2">Refresh listings</a>
                </p>
              )}
            </div>
          )}
        </div>
      </MotionSection>

      <MotionSection className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-campus-700">Built for student book sharing</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Smarter tools for every chapter</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {smartFeatures.map(({ icon: Icon, title, description, href }) => (
            <Link key={title} href={href} className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-campus-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-campus-50 text-campus-700 group-hover:bg-campus-700 group-hover:text-white">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </Link>
          ))}
        </div>
      </MotionSection>

      <MotionSection className="border-y border-slate-200 bg-emerald-50/60 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto mb-9 max-w-2xl text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-campus-700">Student stories</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">A community built around sharing</h2>
            <p className="mt-2 text-xs text-slate-500">Sample testimonials for demonstration; not verified user reviews.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {sampleTestimonials.map((testimonial) => (
              <figure key={testimonial.attribution} className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                <div className="flex gap-1 text-amber-400" aria-label="Sample five-star rating">
                  {Array.from({ length: 5 }, (_, index) => <span key={index} aria-hidden="true">★</span>)}
                </div>
                <blockquote className="mt-4 text-sm leading-6 text-slate-700 dark:text-slate-200">“{testimonial.quote}”</blockquote>
                <figcaption className="mt-5 flex items-center gap-2 text-xs font-bold text-campus-800">
                  <CheckCircle2 className="h-4 w-4" /> {testimonial.attribution}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </MotionSection>

      <MotionSection className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-[2rem] bg-gradient-to-r from-campus-800 to-emerald-950 p-7 text-white shadow-xl sm:p-10 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">Your campus book community</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Ready to find your next read?</h2>
            <p className="mt-3 text-sm leading-6 text-emerald-100">Explore student listings or give a book a new home on campus.</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link href="/explore" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-campus-900 hover:bg-emerald-50">
              Explore Books <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href={isAuthenticated ? '/sell' : '/login?redirect=%2Fsell'} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">
              Sell a Book <BookOpen className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </MotionSection>
    </main>
  );
}
