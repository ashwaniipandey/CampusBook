'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import { Book, BookStatus } from '@/types';
import {
  BookOpen,
  PlusCircle,
  Eye,
  CheckCircle,
  Clock,
  Trash2,
  Edit3,
  AlertCircle,
  CheckCheck,
  Search,
  School,
  Tag,
  ArrowUpDown,
  Filter,
  Loader2,
  RefreshCw,
  ExternalLink,
  XCircle,
} from 'lucide-react';

export default function MyBooksPage() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<'all' | 'approved' | 'pending' | 'sold'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Delete modal state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Action state (mark as sold)
  const [markingSoldId, setMarkingSoldId] = useState<string | null>(null);

  // Fetch books
  const fetchMyBooks = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await api.getMyBooks();
      setBooks(res.books || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load your books.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBooks();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg(null);
    }, 3500);
  };

  // Mark a book as sold
  const handleMarkSold = async (bookId: string) => {
    try {
      setMarkingSoldId(bookId);
      await api.markBookSold(bookId);
      setBooks((prev) =>
        prev.map((b) => (b._id === bookId ? { ...b, status: 'sold' as BookStatus } : b))
      );
      showToast('Book marked as sold successfully!');
    } catch (err: any) {
      showToast(err.message || 'Failed to mark book as sold.', 'error');
    } finally {
      setMarkingSoldId(null);
    }
  };

  // Delete book confirm
  const handleDeleteBook = async () => {
    if (!deletingId) return;

    try {
      setIsDeleting(true);
      await api.deleteBook(deletingId);
      setBooks((prev) => prev.filter((b) => b._id !== deletingId));
      showToast('Book listing deleted successfully.');
      setDeletingId(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete book.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter calculations
  const filteredBooks = books.filter((b) => {
    // Tab filter
    if (activeTab === 'approved') {
      if (b.status !== 'approved' && b.status !== 'available') return false;
    } else if (activeTab === 'pending') {
      if (b.status !== 'pending') return false;
    } else if (activeTab === 'sold') {
      if (b.status !== 'sold') return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = b.title?.toLowerCase().includes(q);
      const authorMatch = b.author?.toLowerCase().includes(q);
      const courseMatch = b.course?.toLowerCase().includes(q);
      return titleMatch || authorMatch || courseMatch;
    }

    return true;
  });

  // Summary counts
  const totalCount = books.length;
  const approvedCount = books.filter((b) => b.status === 'approved' || b.status === 'available').length;
  const pendingCount = books.filter((b) => b.status === 'pending').length;
  const soldCount = books.filter((b) => b.status === 'sold').length;

  const getStatusBadge = (status: BookStatus) => {
    switch (status) {
      case 'approved':
      case 'available':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-1 rounded-full">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Approved / Active
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-2.5 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pending Admin Review
          </span>
        );
      case 'sold':
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold px-2.5 py-1 rounded-full">
            <CheckCheck className="w-3.5 h-3.5 text-slate-500" />
            Sold Out
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold px-2.5 py-1 rounded-full">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold px-2.5 py-1 rounded-full capitalize">
            {status}
          </span>
        );
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Toast Banner */}
        {toastMsg && (
          <div
            className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl border flex items-center gap-3 animate-in slide-in-from-bottom-3 duration-200 ${
              toastMsg.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : 'bg-rose-900 text-white border-rose-700'
            }`}
          >
            {toastMsg.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="text-sm font-semibold">{toastMsg.text}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-campus-700 bg-campus-50 border border-campus-200 px-3 py-1 rounded-full w-fit mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              Seller Studio & Inventory
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Book Listings
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Manage your textbook inventory, view approval status, and update listings.
            </p>
          </div>

          <Link
            href="/sell"
            className="inline-flex items-center gap-2 bg-campus-600 hover:bg-campus-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition self-start sm:self-center"
          >
            <PlusCircle className="w-4 h-4" />
            Sell a Book
          </Link>
        </div>

        {/* Stat Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Listed
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{totalCount}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Approved / Active
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">
              {approvedCount}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Pending Review
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-700 mt-1">
              {pendingCount}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Sold Out
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-700 mt-1">{soldCount}</div>
          </div>
        </div>

        {/* Controls Bar: Tabs and Search */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Books', count: totalCount },
              { id: 'approved', label: 'Approved', count: approvedCount },
              { id: 'pending', label: 'Pending', count: pendingCount },
              { id: 'sold', label: 'Sold', count: soldCount },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-campus-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeTab === tab.id
                      ? 'bg-campus-700 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your inventory..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-campus-500"
            />
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={fetchMyBooks}
              className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:underline"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-xs"
              >
                <div className="h-48 bg-slate-200 rounded-2xl" />
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                  <div className="h-3 bg-slate-200 rounded-md w-1/2" />
                </div>
                <div className="h-8 bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredBooks.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs max-w-lg mx-auto my-8 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-campus-50 text-campus-600 flex items-center justify-center mx-auto shadow-inner">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {searchQuery || activeTab !== 'all'
                  ? 'No matching books found'
                  : 'You have not listed any books yet'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery || activeTab !== 'all'
                  ? 'Try adjusting your search keywords or switching between the status tabs above.'
                  : 'Clear out your bookshelf, earn cash back on your textbooks, and help juniors in your major.'}
              </p>
            </div>
            <div>
              <Link
                href="/sell"
                className="inline-flex items-center gap-2 bg-campus-600 hover:bg-campus-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition"
              >
                <PlusCircle className="w-4 h-4" />
                List Your First Book
              </Link>
            </div>
          </div>
        )}

        {/* Books Grid */}
        {!loading && filteredBooks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((book) => {
              // Extract primary image URL
              let coverUrl = '';
              if (Array.isArray(book.images) && book.images.length > 0) {
                const first = book.images[0];
                coverUrl = typeof first === 'string' ? first : first.url;
              }

              const categoryName =
                typeof book.category === 'object' && book.category ? book.category.name : '';
              const universityName =
                typeof book.university === 'object' && book.university
                  ? book.university.name
                  : '';

              const isSold = book.status === 'sold';

              return (
                <div
                  key={book._id}
                  className="bg-white border border-slate-200 hover:border-slate-300 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    {/* Cover Photo & Status Badge */}
                    <div className="relative aspect-16/10 bg-slate-100 overflow-hidden border-b border-slate-100">
                      {coverUrl ? (
                        <img
                          src={coverUrl}
                          alt={book.title}
                          className="w-full h-full object-cover transition hover:scale-105 duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                          <BookOpen className="w-10 h-10 mb-1 text-slate-300" />
                          <span className="text-[11px] font-medium">No cover image</span>
                        </div>
                      )}

                      {/* Status Badge in Header */}
                      <div className="absolute top-3 left-3">{getStatusBadge(book.status)}</div>

                      {/* Views Count */}
                      <div className="absolute bottom-2.5 right-3 bg-slate-900/70 text-white text-[11px] font-medium px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{book.views || 0} views</span>
                      </div>
                    </div>

                    {/* Book Metadata */}
                    <div className="p-5 space-y-3">
                      <div>
                        {categoryName && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-campus-700 bg-campus-50 px-2 py-0.5 rounded-md inline-block mb-1.5">
                            {categoryName}
                          </span>
                        )}
                        <h3 className="font-bold text-base text-slate-900 leading-snug line-clamp-2">
                          {book.title}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          By {book.author} ({book.edition || '1st Edition'})
                        </p>
                      </div>

                      {/* Academic tags */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
                        {book.course && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-700">
                            {book.course}
                          </span>
                        )}
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                          Cond: <strong>{book.condition}</strong>
                        </span>
                        {universityName && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[150px]">
                            {universityName}
                          </span>
                        )}
                      </div>

                      {/* Price Section */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            Offer Type
                          </span>
                          <div className="font-bold text-xs capitalize text-slate-800">
                            {book.listingType === 'donate'
                              ? 'Free Donation'
                              : book.listingType === 'exchange'
                              ? 'Book Exchange'
                              : 'Standard Sale'}
                          </div>
                        </div>

                        <div className="text-right">
                          {book.listingType === 'donate' ? (
                            <span className="text-sm font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                              $0.00 FREE
                            </span>
                          ) : book.listingType === 'exchange' ? (
                            <span className="text-sm font-extrabold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                              SWAP
                            </span>
                          ) : (
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-lg font-black text-campus-700">
                                ${Number(book.sellingPrice || 0).toFixed(2)}
                              </span>
                              {Number(book.originalPrice) > 0 && (
                                <span className="text-xs text-slate-400 line-through">
                                  ${Number(book.originalPrice).toFixed(2)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    {/* Mark Sold Button */}
                    {!isSold ? (
                      <button
                        type="button"
                        onClick={() => handleMarkSold(book._id)}
                        disabled={markingSoldId === book._id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
                        title="Mark as sold out"
                      >
                        {markingSoldId === book._id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        Mark Sold
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400 italic">
                        Item Sold Out
                      </span>
                    )}

                    {/* Edit and Delete */}
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/sell?edit=${book._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-campus-50 hover:bg-campus-100 text-campus-700 text-xs font-bold transition"
                        title="Edit book details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() => setDeletingId(book._id)}
                        className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                        title="Delete listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-slate-900">Delete Book Listing?</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Are you sure you want to remove this book from the campus marketplace? This action
                  is permanent and cannot be undone. Associated photos will also be cleared.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingId(null)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteBook}
                  disabled={isDeleting}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Yes, Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
