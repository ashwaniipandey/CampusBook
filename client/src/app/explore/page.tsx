'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { formatPrice, getBookPrice } from '@/lib/pricing';
import { Book, University, Category, FiltersMeta, BookCondition, ListingType } from '@/types';
import { useAuth } from '@/context/AuthContext';
import BookCover from '@/components/BookCover';
import {
  Search,
  Filter,
  X,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  GraduationCap,
  Heart,
  RotateCcw,
  Tag,
  Sparkles,
  ArrowUpDown,
  Check,
  AlertCircle,
  Loader2,
  DollarSign,
  ArrowLeftRight,
  HeartHandshake,
  BadgePercent,
  MapPin,
  Star,
} from 'lucide-react';

const CONDITIONS: { value: BookCondition; label: string }[] = [
  { value: 'New', label: 'New' },
  { value: 'Like New', label: 'Like New' },
  { value: 'Good', label: 'Good' },
  { value: 'Fair', label: 'Fair' },
  { value: 'Poor', label: 'Poor' },
];

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    user,
    loading: authLoading,
    wishlistBookIds,
    wishlistLoading,
    wishlistError,
    setWishlistItem,
  } = useAuth();

  // Read URL search params
  const initialQ = searchParams.get('q') || '';
  const initialCategories = searchParams.get('category') ? searchParams.get('category')!.split(',') : [];
  const initialUniversity = searchParams.get('university') || '';
  const initialScope = searchParams.get('scope') || 'all';
  const initialConditions = searchParams.get('condition') ? searchParams.get('condition')!.split(',') : [];
  const initialListingType = searchParams.get('listingType') || '';
  const initialMinPrice = searchParams.get('minPrice') || '';
  const initialMaxPrice = searchParams.get('maxPrice') || '';
  const initialSemester = searchParams.get('semester') || '';
  const initialEdition = searchParams.get('edition') || '';
  const initialCourse = searchParams.get('course') || '';
  const initialSort = searchParams.get('sort') || 'newest';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  // Filter & Search local state
  const [searchInput, setSearchInput] = useState(initialQ);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);
  const [selectedUniversity, setSelectedUniversity] = useState(initialUniversity);
  const [universityScope, setUniversityScope] = useState(initialScope);
  const [selectedConditions, setSelectedConditions] = useState<string[]>(initialConditions);
  const [selectedListingType, setSelectedListingType] = useState(initialListingType);
  const [minPriceInput, setMinPriceInput] = useState(initialMinPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(initialMaxPrice);
  const [semesterInput, setSemesterInput] = useState(initialSemester);
  const [editionInput, setEditionInput] = useState(initialEdition);
  const [courseInput, setCourseInput] = useState(initialCourse);
  const [currentSort, setCurrentSort] = useState(initialSort);
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Mobile drawer state
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Data state
  const [books, setBooks] = useState<Book[]>([]);
  const [totalBooks, setTotalBooks] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Metadata & Reference data
  const [filtersMeta, setFiltersMeta] = useState<FiltersMeta | null>(null);
  const [universities, setUniversities] = useState<University[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [pendingWishlist, setPendingWishlist] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    if (wishlistError) showToast(wishlistError, 'error');
  }, [wishlistError, showToast]);

  // 1. Fetch metadata & universities on mount
  useEffect(() => {
    async function loadMeta() {
      try {
        const [metaRes, uniRes, catRes] = await Promise.all([
          api.getFiltersMeta(),
          api.getUniversities(),
          api.getCategories(),
        ]);
        setFiltersMeta(metaRes);
        setUniversities(uniRes.universities || []);
        setCategories(catRes.categories || []);
      } catch (err: any) {
        console.warn('Failed to load filter metadata:', err.message);
      }
    }
    loadMeta();
  }, []);

  // 2. Synchronize URL query params
  const updateUrlParams = useCallback(
    (newParams: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams();
      const values = {
        q: searchInput.trim(),
        category: selectedCategories.join(','),
        university: selectedUniversity,
        scope: universityScope,
        condition: selectedConditions.join(','),
        listingType: selectedListingType,
        minPrice: minPriceInput,
        maxPrice: maxPriceInput,
        semester: semesterInput,
        edition: editionInput,
        course: courseInput,
        sort: currentSort,
        page: currentPage,
        ...newParams,
      };
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && !(key === 'scope' && value === 'all') &&
          !(key === 'sort' && value === 'newest') && !(key === 'page' && Number(value) <= 1)) {
          params.set(key, String(value));
        }
      });

      const queryStr = params.toString();
      router.push(`/explore${queryStr ? `?${queryStr}` : ''}`, { scroll: false });
    },
    [
      router,
      searchInput,
      selectedCategories,
      selectedUniversity,
      universityScope,
      selectedConditions,
      selectedListingType,
      minPriceInput,
      maxPriceInput,
      semesterInput,
      editionInput,
      courseInput,
      currentSort,
      currentPage,
    ]
  );

  // 3. Search debouncing (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== initialQ) {
        setCurrentPage(1);
        updateUrlParams({
          q: searchInput.trim(),
          category: selectedCategories.join(','),
          university: selectedUniversity,
          condition: selectedConditions.join(','),
          listingType: selectedListingType,
          minPrice: minPriceInput,
          maxPrice: maxPriceInput,
          semester: semesterInput,
          sort: currentSort,
          page: 1,
        });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput, initialQ, updateUrlParams]);

  // 4. Fetch books whenever URL search params change
  useEffect(() => {
    async function fetchBooks() {
      try {
        setLoading(true);
        setErrorMsg(null);

        const q = searchParams.get('q') || '';
        const category = searchParams.get('category') || '';
        const university = searchParams.get('university') || '';
        const scope = searchParams.get('scope') || 'all';
        const condition = searchParams.get('condition') || '';
        const listingType = searchParams.get('listingType') || '';
        const minPrice = searchParams.get('minPrice') || '';
        const maxPrice = searchParams.get('maxPrice') || '';
        const semester = searchParams.get('semester') || '';
        const edition = searchParams.get('edition') || '';
        const course = searchParams.get('course') || '';
        const sort = searchParams.get('sort') || 'newest';
        const page = parseInt(searchParams.get('page') || '1', 10);

        const res = await api.getBooks({
          q,
          category,
          university,
          scope,
          condition,
          listingType,
          minPrice,
          maxPrice,
          semester,
          edition,
          course,
          sort,
          page,
          limit: 12,
        });

        setBooks(res.books || []);
        setTotalBooks(res.total || 0);
        setTotalPages(res.totalPages || 1);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load books. Please check server connection.');
      } finally {
        setLoading(false);
      }
    }

    fetchBooks();
  }, [searchParams]);

  // Keep local filter inputs synced with URL back/forward button navigation
  useEffect(() => {
    setSearchInput(searchParams.get('q') || '');
    setSelectedCategories(searchParams.get('category') ? searchParams.get('category')!.split(',') : []);
    setSelectedUniversity(searchParams.get('university') || '');
    setUniversityScope(searchParams.get('scope') || 'all');
    setSelectedConditions(searchParams.get('condition') ? searchParams.get('condition')!.split(',') : []);
    setSelectedListingType(searchParams.get('listingType') || '');
    setMinPriceInput(searchParams.get('minPrice') || '');
    setMaxPriceInput(searchParams.get('maxPrice') || '');
    setSemesterInput(searchParams.get('semester') || '');
    setEditionInput(searchParams.get('edition') || '');
    setCourseInput(searchParams.get('course') || '');
    setCurrentSort(searchParams.get('sort') || 'newest');
    setCurrentPage(parseInt(searchParams.get('page') || '1', 10));
  }, [searchParams]);

  // Filter Handlers
  const handleCategoryToggle = (catId: string) => {
    let next: string[];
    if (selectedCategories.includes(catId)) {
      next = selectedCategories.filter((id) => id !== catId);
    } else {
      next = [...selectedCategories, catId];
    }
    setSelectedCategories(next);
    setCurrentPage(1);
    updateUrlParams({
      q: searchInput.trim(),
      category: next.join(','),
      university: selectedUniversity,
      condition: selectedConditions.join(','),
      listingType: selectedListingType,
      minPrice: minPriceInput,
      maxPrice: maxPriceInput,
      semester: semesterInput,
      sort: currentSort,
      page: 1,
    });
  };

  const handleConditionToggle = (cond: string) => {
    let next: string[];
    if (selectedConditions.includes(cond)) {
      next = selectedConditions.filter((c) => c !== cond);
    } else {
      next = [...selectedConditions, cond];
    }
    setSelectedConditions(next);
    setCurrentPage(1);
    updateUrlParams({
      q: searchInput.trim(),
      category: selectedCategories.join(','),
      university: selectedUniversity,
      condition: next.join(','),
      listingType: selectedListingType,
      minPrice: minPriceInput,
      maxPrice: maxPriceInput,
      semester: semesterInput,
      sort: currentSort,
      page: 1,
    });
  };

  const handleUniversityChange = (uniId: string) => {
    setSelectedUniversity(uniId);
    setCurrentPage(1);
    updateUrlParams({
      q: searchInput.trim(),
      category: selectedCategories.join(','),
      university: uniId,
      condition: selectedConditions.join(','),
      listingType: selectedListingType,
      minPrice: minPriceInput,
      maxPrice: maxPriceInput,
      semester: semesterInput,
      sort: currentSort,
      page: 1,
    });
  };

  const handleUniversityScopeChange = (scope: 'mine' | 'all') => {
    if (scope === 'mine' && authLoading) return;
    if (scope === 'mine' && !user) {
      router.push(`/login?redirect=${encodeURIComponent('/explore?scope=mine')}`);
      return;
    }
    setUniversityScope(scope);
    if (scope === 'mine') setSelectedUniversity('');
    setCurrentPage(1);
    updateUrlParams({
      scope,
      university: scope === 'mine' ? '' : selectedUniversity,
      page: 1,
    });
  };

  const applyAcademicFilters = () => {
    setCurrentPage(1);
    updateUrlParams({ edition: editionInput.trim(), course: courseInput.trim(), semester: semesterInput.trim(), page: 1 });
  };

  const handleListingTypeChange = (type: string) => {
    const nextType = selectedListingType === type ? '' : type;
    setSelectedListingType(nextType);
    setCurrentPage(1);
    updateUrlParams({
      q: searchInput.trim(),
      category: selectedCategories.join(','),
      university: selectedUniversity,
      condition: selectedConditions.join(','),
      listingType: nextType,
      minPrice: minPriceInput,
      maxPrice: maxPriceInput,
      semester: semesterInput,
      sort: currentSort,
      page: 1,
    });
  };

  const handleApplyPrice = () => {
    setCurrentPage(1);
    updateUrlParams({
      q: searchInput.trim(),
      category: selectedCategories.join(','),
      university: selectedUniversity,
      condition: selectedConditions.join(','),
      listingType: selectedListingType,
      minPrice: minPriceInput,
      maxPrice: maxPriceInput,
      semester: semesterInput,
      sort: currentSort,
      page: 1,
    });
  };

  const handleSortChange = (newSort: string) => {
    setCurrentSort(newSort);
    updateUrlParams({
      q: searchInput.trim(),
      category: selectedCategories.join(','),
      university: selectedUniversity,
      condition: selectedConditions.join(','),
      listingType: selectedListingType,
      minPrice: minPriceInput,
      maxPrice: maxPriceInput,
      semester: semesterInput,
      sort: newSort,
      page: currentPage,
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    updateUrlParams({
      q: searchInput.trim(),
      category: selectedCategories.join(','),
      university: selectedUniversity,
      condition: selectedConditions.join(','),
      listingType: selectedListingType,
      minPrice: minPriceInput,
      maxPrice: maxPriceInput,
      semester: semesterInput,
      sort: currentSort,
      page: newPage,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearAll = () => {
    setSearchInput('');
    setSelectedCategories([]);
    setSelectedUniversity('');
    setSelectedConditions([]);
    setSelectedListingType('');
    setMinPriceInput('');
    setMaxPriceInput('');
    setSemesterInput('');
    setEditionInput('');
    setCourseInput('');
    setUniversityScope('all');
    setCurrentSort('newest');
    setCurrentPage(1);
    router.push('/explore');
  };

  // Count active filters
  const activeFiltersCount = [
    Boolean(searchInput.trim()),
    selectedCategories.length > 0,
    Boolean(selectedUniversity),
    selectedConditions.length > 0,
    Boolean(selectedListingType),
    Boolean(minPriceInput || maxPriceInput),
    Boolean(semesterInput),
    Boolean(editionInput),
    Boolean(courseInput),
    universityScope === 'mine',
  ].filter(Boolean).length;

  const toggleWishlist = async (e: React.MouseEvent, book: Book) => {
    e.preventDefault();
    e.stopPropagation();
    if (authLoading) return;
    if (!user) {
      const returnUrl = `${window.location.pathname}${window.location.search}`;
      router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }

    const wishlisted = wishlistBookIds.includes(book._id);
    setPendingWishlist((previous) => ({ ...previous, [book._id]: true }));
    try {
      await setWishlistItem(book._id, !wishlisted, book);
      showToast(wishlisted ? 'Removed from your wishlist.' : 'Added to your wishlist.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to update your wishlist.', 'error');
    } finally {
      setPendingWishlist((previous) => ({ ...previous, [book._id]: false }));
    }
  };

  // Reusable Filter Sidebar Component
  const FilterSidebar = () => (
    <div className="divide-y divide-slate-100 text-sm [&>div]:pt-5 [&>div:first-child]:pt-0">
      {/* Header with Clear All */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <Filter className="w-4 h-4 text-campus-600" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="bg-campus-100 text-campus-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Clear All
          </button>
        )}
      </div>

      {/* 1. University Filter */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Campus / University
        </label>
        <select
          value={selectedUniversity}
          onChange={(e) => handleUniversityChange(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-campus-500 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="">All Universities</option>
          {universities.map((uni) => (
            <option key={uni._id} value={uni._id}>
              {uni.name} ({uni.code})
            </option>
          ))}
        </select>
      </div>

      {/* 2. Listing Type Filter */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Listing Offer Type
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: 'sell', label: 'Buy/Sell', icon: DollarSign },
            { id: 'exchange', label: 'Exchange', icon: ArrowLeftRight },
            { id: 'donate', label: 'Free', icon: HeartHandshake },
          ].map((type) => {
            const Icon = type.icon;
            const isSelected = selectedListingType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => handleListingTypeChange(type.id)}
                className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'border-campus-600 bg-campus-50 text-campus-800 ring-1 ring-campus-600'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{type.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Categories with Counts */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Academic Categories
        </label>
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {categories.map((cat) => {
            const metaItem = filtersMeta?.categoryCounts?.find((c) => c._id === cat._id);
            const count = metaItem?.count ?? 0;
            const isChecked = selectedCategories.includes(cat._id);

            return (
              <label
                key={cat._id}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer select-none transition"
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleCategoryToggle(cat._id)}
                    className="w-4 h-4 rounded text-campus-600 focus:ring-campus-500 border-slate-300"
                  />
                  <span className={`text-xs ${isChecked ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                    {cat.name}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded-full">
                  {count}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 4. Price Range */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Price Range ($)
          </label>
          {(minPriceInput || maxPriceInput) && (
            <button
              onClick={() => {
                setMinPriceInput('');
                setMaxPriceInput('');
                updateUrlParams({
                  q: searchInput.trim(),
                  category: selectedCategories.join(','),
                  university: selectedUniversity,
                  condition: selectedConditions.join(','),
                  listingType: selectedListingType,
                  minPrice: '',
                  maxPrice: '',
                  semester: semesterInput,
                  sort: currentSort,
                  page: 1,
                });
              }}
              className="text-[11px] text-slate-400 hover:text-slate-600 underline"
            >
              Reset
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
            <input
              type="number"
              min="0"
              placeholder="Min"
              value={minPriceInput}
              onChange={(e) => setMinPriceInput(e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-1.5 pl-6 pr-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-campus-500 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <span className="text-slate-400 text-xs font-bold">—</span>
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
            <input
              type="number"
              min="0"
              placeholder="Max"
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-1.5 pl-6 pr-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-campus-500 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <button
            onClick={handleApplyPrice}
            className="px-3 py-1.5 rounded-xl bg-campus-600 hover:bg-campus-700 text-white text-xs font-bold shadow-xs transition"
          >
            Go
          </button>
        </div>
      </div>

      {/* 5. Book Condition */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Book Condition
        </label>
        <div className="space-y-1">
          {CONDITIONS.map((cond) => {
            const count = filtersMeta?.conditionCounts?.[cond.value] ?? 0;
            const isChecked = selectedConditions.includes(cond.value);

            return (
              <label
                key={cond.value}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer select-none transition"
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleConditionToggle(cond.value)}
                    className="w-4 h-4 rounded text-campus-600 focus:ring-campus-500 border-slate-300"
                  />
                  <span className={`text-xs ${isChecked ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                    {cond.label}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded-full">
                  {count}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 6. Semester Filter */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Academic Semester
        </label>
        <input
          type="text"
          value={semesterInput}
          onChange={(e) => setSemesterInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              setCurrentPage(1);
              updateUrlParams({
                q: searchInput.trim(),
                category: selectedCategories.join(','),
                university: selectedUniversity,
                condition: selectedConditions.join(','),
                listingType: selectedListingType,
                minPrice: minPriceInput,
                maxPrice: maxPriceInput,
                semester: semesterInput.trim(),
                sort: currentSort,
                page: 1,
              });
            }
          }}
          placeholder="e.g. Fall 2026, Spring (Enter)"
          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-campus-500"
        />
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700">Edition</label>
          <input
            type="text"
            value={editionInput}
            onChange={(event) => setEditionInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                applyAcademicFilters();
              }
            }}
            placeholder="e.g. 3rd Edition"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-campus-500"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700">Course</label>
          <input
            type="text"
            value={courseInput}
            onChange={(event) => setCourseInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                applyAcademicFilters();
              }
            }}
            placeholder="e.g. Computer Science"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-campus-500"
          />
        </div>
        <button type="button" onClick={applyAcademicFilters} className="w-full rounded-xl bg-campus-50 px-3 py-2 text-xs font-bold text-campus-800 hover:bg-campus-100">
          Apply academic filters
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      {/* Breadcrumb & Title */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-campus-700 uppercase tracking-wider mb-1">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Campus Marketplace</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Explore Student Books
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Browse verified textbook listings from students across top universities.
        </p>
        <div className="mt-4 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm" role="group" aria-label="University listing scope">
          <button
            type="button"
            onClick={() => handleUniversityScopeChange('mine')}
            disabled={authLoading}
            aria-pressed={universityScope === 'mine'}
            className={`rounded-lg px-3 py-2 text-xs font-bold transition disabled:cursor-wait disabled:opacity-50 ${universityScope === 'mine' ? 'bg-campus-700 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            My University
          </button>
          <button
            type="button"
            onClick={() => handleUniversityScopeChange('all')}
            aria-pressed={universityScope !== 'mine'}
            className={`rounded-lg px-3 py-2 text-xs font-bold transition ${universityScope !== 'mine' ? 'bg-campus-700 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            All Universities
          </button>
        </div>
      </div>

      {/* Main Layout Grid: Left Sidebar (Desktop) + Right Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Sidebar Column */}
        <aside className="hidden lg:block lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs sticky top-20">
          <FilterSidebar />
        </aside>

        {/* Mobile Slide-Over Drawer Modal */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileFiltersOpen(false)}
            />

            {/* Slide-in panel */}
            <div className="relative ml-auto w-full max-w-xs sm:max-w-sm h-full bg-white shadow-2xl p-6 overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-200">
              <div>
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
                  <h3 className="font-bold text-base text-slate-900">Filter Marketplace</h3>
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <FilterSidebar />
              </div>

              <div className="pt-6 border-t border-slate-200 mt-6">
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-full bg-campus-600 hover:bg-campus-700 text-white font-bold py-2.5 rounded-xl text-sm shadow-sm"
                >
                  Show Results ({totalBooks})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Right Content Column */}
        <main className="lg:col-span-3 space-y-6">
          {/* Top Control Bar: Search Input, Counter & Sort */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search Field */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by title, author, course (e.g. CS106), ISBN, or subject..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-9 text-xs text-slate-900 placeholder:text-slate-500 focus:border-campus-500 focus:outline-none focus:ring-2 focus:ring-campus-500/30 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 sm:text-sm"
                />
                {searchInput && (
                  <button
                    onClick={() => setSearchInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Mobile Filter Button & Sort Dropdown */}
              <div className="flex items-center gap-2">
                {/* Mobile Filter Trigger Button */}
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-campus-600" />
                  <span>Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="bg-campus-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                  <select
                    value={currentSort}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-campus-500 focus:outline-none focus:ring-2 focus:ring-campus-500/30 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="newest">Newest</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="popular">Popular</option>
                    <option value="relevance" disabled={!searchInput.trim()}>Most relevant</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Active Filters Pill Bar & Results Counter */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="font-semibold text-slate-600">
                {loading ? (
                  <span>Searching marketplace...</span>
                ) : (
                  <span>
                    Found <strong className="text-slate-900">{totalBooks}</strong> textbooks
                    {totalPages > 1 && (
                      <span className="text-slate-400 font-normal ml-1">
                        (Page {currentPage} of {totalPages})
                      </span>
                    )}
                  </span>
                )}
              </div>

              {activeFiltersCount > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">Active:</span>
                  {searchInput.trim() && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      “{searchInput.trim()}”
                      <button type="button" aria-label="Clear search filter" onClick={() => setSearchInput('')} className="hover:text-rose-500">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {selectedCategories.map((categoryId) => (
                    <span key={categoryId} className="inline-flex items-center gap-1 rounded-full bg-campus-50 px-2.5 py-1 text-[11px] text-campus-800 dark:bg-campus-900/50 dark:text-campus-200">
                      {categories.find((category) => category._id === categoryId)?.name || 'Category'}
                      <button type="button" aria-label="Remove category filter" onClick={() => handleCategoryToggle(categoryId)} className="hover:text-rose-500">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {universityScope === 'mine' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-campus-50 px-2.5 py-1 text-[11px] text-campus-800 dark:bg-campus-900/50 dark:text-campus-200">
                      My University
                      <button type="button" aria-label="Show all universities" onClick={() => handleUniversityScopeChange('all')} className="hover:text-rose-500">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {selectedUniversity && (
                    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px]">
                      {universities.find((university) => university._id === selectedUniversity)?.name || 'Campus'}
                      <button onClick={() => handleUniversityChange('')} className="hover:text-rose-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedListingType && (
                    <span className="inline-flex items-center gap-1 bg-campus-50 text-campus-700 px-2 py-0.5 rounded-md text-[11px] capitalize">
                      {selectedListingType}
                      <button onClick={() => handleListingTypeChange(selectedListingType)} className="hover:text-rose-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedConditions.map((cond) => (
                    <span key={cond} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px]">
                      {cond}
                      <button onClick={() => handleConditionToggle(cond)} className="hover:text-rose-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {editionInput && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      Edition: {editionInput}
                      <button type="button" aria-label="Remove edition filter" onClick={() => { setEditionInput(''); updateUrlParams({ edition: '', page: 1 }); }} className="hover:text-rose-500">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {courseInput && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      Course: {courseInput}
                      <button type="button" aria-label="Remove course filter" onClick={() => { setCourseInput(''); updateUrlParams({ course: '', page: 1 }); }} className="hover:text-rose-500">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {semesterInput && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      Semester: {semesterInput}
                      <button type="button" aria-label="Remove semester filter" onClick={() => { setSemesterInput(''); updateUrlParams({ semester: '', page: 1 }); }} className="hover:text-rose-500">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {(minPriceInput || maxPriceInput) && (
                    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px]">
                      {formatPrice(minPriceInput || '0')} - {maxPriceInput ? formatPrice(maxPriceInput) : 'Any'}
                      <button
                        onClick={() => {
                          setMinPriceInput('');
                          setMaxPriceInput('');
                          updateUrlParams({
                            q: searchInput.trim(),
                            category: selectedCategories.join(','),
                            university: selectedUniversity,
                            condition: selectedConditions.join(','),
                            listingType: selectedListingType,
                            minPrice: '',
                            maxPrice: '',
                            semester: semesterInput,
                            sort: currentSort,
                            page: 1,
                          });
                        }}
                        className="hover:text-rose-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  <button
                    onClick={handleClearAll}
                    className="text-[11px] text-rose-600 hover:underline font-semibold ml-1 cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Error Alert with Retry */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button
                onClick={() => router.refresh()}
                className="text-xs font-bold text-rose-700 underline hover:no-underline cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading Skeletons */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-200 rounded-3xl p-4 space-y-3 shadow-xs"
                >
                  <div className="aspect-16/10 bg-slate-200 rounded-2xl" />
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                    <div className="h-3 bg-slate-200 rounded-md w-1/2" />
                  </div>
                  <div className="h-6 bg-slate-200 rounded-lg w-1/3 pt-2" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && books.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs max-w-md mx-auto my-12 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-campus-50 text-campus-600 flex items-center justify-center mx-auto shadow-inner">
                <BookOpen className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">No books match your filters</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  Try clearing some filters, expanding your price range, or searching for a different course code.
                </p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="inline-flex items-center gap-2 bg-campus-600 hover:bg-campus-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset All Filters
                </button>
              </div>
            </div>
          )}

          {/* Books Grid */}
          {!loading && books.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {books.map((book) => {
                // Primary image
                let coverUrl = '';
                if (Array.isArray(book.images) && book.images.length > 0) {
                  const first = book.images[0];
                  coverUrl = typeof first === 'string' ? first : first.url;
                }

                const uniName =
                  typeof book.university === 'object' && book.university
                    ? book.university.name
                    : '';
                const catName =
                  typeof book.category === 'object' && book.category ? book.category.name : '';

                const isWishlisted = wishlistBookIds.includes(book._id);

                // Discount calculation
                const orig = Number(book.originalPrice || 0);
                const sell = getBookPrice(book);
                const discount = orig > 0 && sell < orig ? Math.round(((orig - sell) / orig) * 100) : 0;

                return (
                  <Link
                    key={book._id}
                    href={`/books/${book._id}`}
                    className="group flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-campus-300 hover:shadow-[0_16px_36px_-18px_rgba(21,128,61,0.42)] focus-visible:ring-2 focus-visible:ring-campus-500 dark:bg-slate-900"
                  >
                    <div>
                      {/* Image Thumbnail with Wishlist Heart */}
                      <div className="relative aspect-[4/3] overflow-hidden border-b border-slate-100 bg-slate-100">
                        <BookCover
                          src={coverUrl}
                          alt={`Cover of ${book.title}`}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />

                        {/* Condition Badge */}
                        <div className="absolute top-3 left-3">
                          <span className="rounded-full border border-white/80 bg-white/95 px-2.5 py-1 text-[10px] font-bold text-slate-800 shadow-sm backdrop-blur dark:border-slate-600 dark:bg-slate-900/95 dark:text-slate-100">
                            {book.condition}
                          </span>
                        </div>

                        {/* Wishlist Heart Icon */}
                        <button
                          type="button"
                          onClick={(e) => toggleWishlist(e, book)}
                          disabled={authLoading || wishlistLoading || pendingWishlist[book._id]}
                          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                          aria-pressed={isWishlisted}
                          className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 hover:bg-white shadow-xs backdrop-blur-xs transition text-slate-400 hover:text-rose-500 disabled:opacity-50"
                          title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                        >
                          <Heart
                            className={`w-4 h-4 transition ${
                              isWishlisted ? 'fill-rose-500 text-rose-500' : ''
                            }`}
                          />
                        </button>

                        {/* Course Code Tag */}
                        {book.course && (
                          <div className="absolute bottom-2.5 left-3">
                            <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
                              {book.course}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content Info */}
                      <div className="p-4 space-y-2">
                        {catName && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-campus-700 bg-campus-50 px-2 py-0.5 rounded-md inline-block">
                            {catName}
                          </span>
                        )}

                        <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2 group-hover:text-campus-700 transition">
                          {book.title}
                        </h3>

                        <p className="line-clamp-1 text-xs font-medium text-slate-500">
                          By {book.author} ({book.edition || '1st Edition'})
                        </p>

                        {/* University Name */}
                        {uniName && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate pt-1">
                            <GraduationCap className="w-3.5 h-3.5 text-campus-600 shrink-0" />
                            <span className="truncate">{uniName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price Footer */}
                    <div className="flex items-center justify-between border-t border-slate-100 p-4 pt-3">
                      {book.listingType === 'donate' ? (
                        <span className="text-xs font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg">
                          Free
                        </span>
                      ) : book.listingType === 'exchange' ? (
                        <span className="text-xs font-black text-amber-700 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg">
                          Exchange
                        </span>
                      ) : (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-black text-slate-900">
                            {formatPrice(sell)}
                          </span>
                          {orig > 0 && (
                            <span className="text-xs text-slate-400 line-through">
                              {formatPrice(orig)}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Discount Badge */}
                      {discount > 0 && book.listingType === 'sell' && (
                        <span className="text-[10px] font-bold text-campus-700 bg-campus-100 px-2 py-0.5 rounded-md">
                          {discount}% OFF
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    // Show first, last, and window around current page
                    return (
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - currentPage) <= 1
                    );
                  })
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && p - prev > 1;

                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && (
                          <span className="px-2 text-slate-400 text-xs">...</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handlePageChange(p)}
                          className={`w-8 h-8 rounded-xl text-xs font-bold transition ${
                            currentPage === p
                              ? 'bg-campus-600 text-white shadow-xs'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-campus-600" />
          <p className="text-slate-500 text-sm">Loading Campus Marketplace...</p>
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
