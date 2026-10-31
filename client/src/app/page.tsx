'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  BookOpen,
  ArrowLeftRight,
  HeartHandshake,
  DollarSign,
  GraduationCap,
  MapPin,
  Star,
  CheckCircle,
  Sparkles,
  ArrowRight,
  BookMarked,
  Users,
  ShieldCheck,
  Tag,
} from 'lucide-react';

// Preview books matching the seed data
const sampleBooks = [
  {
    id: '1',
    title: 'Introduction to Algorithms (CLRS)',
    author: 'Cormen, Leiserson, Rivest, Stein',
    edition: '4th Edition',
    category: 'Computer Science',
    university: 'MIT',
    campusCity: 'Cambridge, MA',
    seller: 'Emily Zhang',
    sellerRating: 5.0,
    listingType: 'sale',
    price: 65,
    originalPrice: 135,
    condition: 'Like New',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500',
  },
  {
    id: '2',
    title: 'Clean Code: Agile Software Craftsmanship',
    author: 'Robert C. Martin',
    edition: '1st Edition',
    category: 'Computer Science',
    university: 'Stanford',
    campusCity: 'Stanford, CA',
    seller: 'Alex Johnson',
    sellerRating: 4.9,
    listingType: 'sale',
    price: 25,
    originalPrice: 55,
    condition: 'Good',
    imageUrl: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=500',
  },
  {
    id: '3',
    title: 'Operating System Concepts (Dinosaur Book)',
    author: 'Silberschatz, Galvin, Gagne',
    edition: '10th Edition',
    category: 'Computer Science',
    university: 'UC Berkeley',
    campusCity: 'Berkeley, CA',
    seller: 'Marcus Williams',
    sellerRating: 4.8,
    listingType: 'exchange',
    price: 0,
    originalPrice: 120,
    exchangeFor: 'Kurose Networks or DB Systems',
    condition: 'Good',
    imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500',
  },
  {
    id: '4',
    title: 'Campbell Biology (Pre-Med Essential)',
    author: 'Urry, Cain, Wasserman',
    edition: '12th Edition',
    category: 'Biology & Life Sciences',
    university: 'Harvard',
    campusCity: 'Cambridge, MA',
    seller: 'Sophia Patel',
    sellerRating: 4.95,
    listingType: 'sale',
    price: 80,
    originalPrice: 220,
    condition: 'Like New',
    imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500',
  },
  {
    id: '5',
    title: 'Organic Chemistry as a Second Language',
    author: 'David R. Klein',
    edition: '5th Edition',
    category: 'Chemistry',
    university: 'Harvard',
    campusCity: 'Cambridge, MA',
    seller: 'Sophia Patel',
    sellerRating: 4.95,
    listingType: 'donation',
    price: 0,
    originalPrice: 45,
    condition: 'Like New',
    imageUrl: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=500',
  },
  {
    id: '6',
    title: 'Calculus: Early Transcendentals',
    author: 'James Stewart',
    edition: '8th Edition',
    category: 'Mathematics',
    university: 'Stanford',
    campusCity: 'Stanford, CA',
    seller: 'Liam Chen',
    sellerRating: 5.0,
    listingType: 'sale',
    price: 35,
    originalPrice: 150,
    condition: 'Good',
    imageUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=500',
  },
  {
    id: '7',
    title: 'Introduction to Electrodynamics',
    author: 'David J. Griffiths',
    edition: '4th Edition',
    category: 'Physics',
    university: 'MIT',
    campusCity: 'Cambridge, MA',
    seller: 'Ava Thompson',
    sellerRating: 4.9,
    listingType: 'exchange',
    price: 0,
    originalPrice: 95,
    exchangeFor: 'Griffiths Quantum Mechanics',
    condition: 'Like New',
    imageUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=500',
  },
  {
    id: '8',
    title: 'Justice: What\'s the Right Thing to Do?',
    author: 'Michael J. Sandel',
    edition: '1st Edition',
    category: 'Humanities',
    university: 'Harvard',
    campusCity: 'Cambridge, MA',
    seller: 'Hannah Martinez',
    sellerRating: 5.0,
    listingType: 'donation',
    price: 0,
    originalPrice: 30,
    condition: 'Good',
    imageUrl: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=500',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [filterType, setFilterType] = useState<'all' | 'sale' | 'exchange' | 'donation'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('all');

  const handleHeroSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    router.push(`/explore${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const filteredBooks = sampleBooks.filter((book) => {
    const matchesType = filterType === 'all' || book.listingType === filterType;
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUni = selectedUniversity === 'all' || book.university.toLowerCase() === selectedUniversity.toLowerCase();
    return matchesType && matchesSearch && matchesUni;
  });

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/80 via-white to-slate-50 pt-12 pb-20 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 text-emerald-800 text-xs sm:text-sm font-semibold shadow-xs">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Peer-to-Peer Campus Textbook Network • Phase 2 Live</span>
          </div>

          {/* Heading */}
          <div className="max-w-3xl mx-auto space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Buy, Sell, Exchange & Donate{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-campus-600 to-emerald-800">
                Textbooks on Campus
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Stop overpaying at college bookstores. Connect directly with verified classmates at your university for
              affordable course materials, instant swaps, and free textbook donations.
            </p>
          </div>

          {/* Search Box Card */}
          <form
            onSubmit={handleHeroSearch}
            className="max-w-4xl mx-auto bg-white p-3 sm:p-4 rounded-2xl shadow-xl border border-slate-200/80 text-left"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Text Search */}
              <div className="md:col-span-6 relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search book title, author, course code, or ISBN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-campus-500 focus:border-transparent text-sm text-slate-900 placeholder-slate-400"
                />
              </div>

              {/* Campus Filter */}
              <div className="md:col-span-4 relative">
                <GraduationCap className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select
                  value={selectedUniversity}
                  onChange={(e) => setSelectedUniversity(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-campus-500 focus:border-transparent text-sm text-slate-800 bg-white"
                >
                  <option value="all">All Universities</option>
                  <option value="stanford">Stanford University</option>
                  <option value="mit">MIT</option>
                  <option value="uc berkeley">UC Berkeley</option>
                  <option value="harvard">Harvard University</option>
                  <option value="uw">University of Washington</option>
                  <option value="ut austin">UT Austin</option>
                </select>
              </div>

              {/* Search Button */}
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full bg-campus-600 hover:bg-campus-700 text-white font-medium py-3 px-4 rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  Browse Books
                </button>
              </div>
            </div>
          </form>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6 text-left">
            <div className="bg-white/80 backdrop-blur p-4 rounded-xl border border-slate-200">
              <div className="text-2xl font-bold text-slate-900">40+</div>
              <div className="text-xs text-slate-500 mt-0.5">Seeded Textbooks</div>
            </div>
            <div className="bg-white/80 backdrop-blur p-4 rounded-xl border border-slate-200">
              <div className="text-2xl font-bold text-campus-600">6</div>
              <div className="text-xs text-slate-500 mt-0.5">Partner Universities</div>
            </div>
            <div className="bg-white/80 backdrop-blur p-4 rounded-xl border border-slate-200">
              <div className="text-2xl font-bold text-emerald-600">100%</div>
              <div className="text-xs text-slate-500 mt-0.5">Verified .edu Students</div>
            </div>
            <div className="bg-white/80 backdrop-blur p-4 rounded-xl border border-slate-200">
              <div className="text-2xl font-bold text-amber-600">$0</div>
              <div className="text-xs text-slate-500 mt-0.5">Free Donations Track</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Browse Section */}
      <section id="browse" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header & Listing Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Featured Campus Listings</h2>
            <p className="text-sm text-slate-500 mt-1">
              Browse available course books listed by fellow students.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="inline-flex p-1 bg-slate-200/80 rounded-xl text-xs sm:text-sm font-medium">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-1.5 rounded-lg transition ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Listings
            </button>
            <button
              onClick={() => setFilterType('sale')}
              className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                filterType === 'sale'
                  ? 'bg-white text-campus-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" /> For Sale
            </button>
            <button
              onClick={() => setFilterType('exchange')}
              className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                filterType === 'exchange'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" /> Exchange
            </button>
            <button
              onClick={() => setFilterType('donation')}
              className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                filterType === 'donation'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" /> Free Donation
            </button>
          </div>
        </div>

        {/* Book Grid */}
        {filteredBooks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <BookMarked className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-800">No books found</h3>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your filters or search keywords.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col group"
              >
                {/* Book Cover Image Container */}
                <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={book.imageUrl}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  {/* Badge: Listing Type */}
                  <div className="absolute top-3 left-3">
                    {book.listingType === 'sale' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-campus-600 text-white shadow-xs">
                        For Sale
                      </span>
                    )}
                    {book.listingType === 'exchange' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500 text-white shadow-xs">
                        Exchange
                      </span>
                    )}
                    {book.listingType === 'donation' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-600 text-white shadow-xs">
                        Free Donation
                      </span>
                    )}
                  </div>

                  {/* Condition Badge */}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2.5 py-0.5 rounded-full text-[11px] font-medium text-slate-700 shadow-xs">
                    {book.condition}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <div className="text-[11px] uppercase font-semibold text-campus-600 tracking-wider">
                      {book.category}
                    </div>
                    <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2" title={book.title}>
                      {book.title}
                    </h3>
                    <p className="text-xs text-slate-500">{book.author}</p>
                  </div>

                  {/* Price / Exchange detail */}
                  <div className="pt-2 border-t border-slate-100">
                    {book.listingType === 'sale' && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-slate-900">${book.price}</span>
                        {book.originalPrice > 0 && (
                          <span className="text-xs text-slate-400 line-through">${book.originalPrice}</span>
                        )}
                        <span className="text-[11px] text-emerald-600 font-semibold ml-auto">
                          {Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100)}% OFF
                        </span>
                      </div>
                    )}
                    {book.listingType === 'exchange' && (
                      <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg font-medium leading-relaxed">
                        🔄 Wants: {book.exchangeFor}
                      </div>
                    )}
                    {book.listingType === 'donation' && (
                      <div className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg font-medium">
                        🎁 Free for student in need
                      </div>
                    )}
                  </div>

                  {/* University & Seller Info */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1 text-slate-700 font-medium">
                      <GraduationCap className="w-3.5 h-3.5 text-campus-600" />
                      <span>{book.university}</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 font-semibold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{book.sellerRating}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-campus-600 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5">
                    {book.listingType === 'sale' && 'Contact Seller'}
                    {book.listingType === 'exchange' && 'Propose Exchange'}
                    {book.listingType === 'donation' && 'Request Donation'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* How CampusBook Works */}
      <section className="bg-white py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-3xl font-bold text-slate-900">How CampusBook Works</h2>
            <p className="text-sm text-slate-500">Simple, secure, student-to-student textbook trading on your campus.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 bg-campus-100 text-campus-600 rounded-2xl flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">1. Find or List Your Book</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Search by ISBN, title, or course code. Or snap photos and post your used book for sale, trade, or donation in under a minute.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">2. Chat Directly</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Connect directly with classmates via campus messaging. Agree on price, exchange terms, or donation eligibility.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">3. Safe Campus Handover</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Meet up safely on campus — student union, library steps, or dining hall. No shipping fees or waiting weeks for deliveries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-campus-600 to-emerald-800 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <h2 className="text-3xl font-extrabold tracking-tight">Ready to clear your bookshelf?</h2>
            <p className="text-emerald-100 text-sm leading-relaxed">
              Join thousands of university students saving hundreds of dollars every semester. Post your books or request books in seconds.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link
              href="/signup"
              className="bg-white text-campus-800 hover:bg-emerald-50 font-semibold px-6 py-3 rounded-xl text-sm transition shadow-sm text-center"
            >
              Register with .edu Email
            </Link>
            <Link
              href="/explore"
              className="bg-campus-800/80 hover:bg-campus-800 border border-white/20 text-white font-semibold px-6 py-3 rounded-xl text-sm transition text-center"
            >
              Explore Listings
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

