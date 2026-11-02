'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Eye, LoaderCircle, Trash2, X } from 'lucide-react';
import AdminDataTable, { AdminTableColumn } from '@/components/AdminDataTable';
import AdminToast, { AdminToastState } from '@/components/AdminToast';
import BookCover from '@/components/BookCover';
import api from '@/lib/api';
import { Book, BookImage } from '@/types';
import { formatPrice, getBookPrice } from '@/lib/pricing';
import { MotionDialog } from '@/components/MotionEffects';

type BookStatusFilter = '' | 'pending' | 'approved' | 'rejected' | 'sold';

function getImage(book: Book) {
  const image = book.images?.[0];
  return image ? (typeof image === 'string' ? image : (image as BookImage).url) : '';
}

function getName(user: Book['seller']) {
  return typeof user === 'string' ? 'Campus student' : user?.name || 'Campus student';
}

function statusStyle(status: string) {
  if (status === 'approved' || status === 'available') return 'bg-emerald-50 text-emerald-800';
  if (status === 'pending') return 'bg-amber-50 text-amber-800';
  if (status === 'rejected') return 'bg-rose-50 text-rose-800';
  return 'bg-slate-100 text-slate-700';
}

export default function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<BookStatusFilter>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectingBook, setRejectingBook] = useState<Book | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [toast, setToast] = useState<AdminToastState>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  };

  const loadBooks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getAdminBooks({ page, limit: 20, q: search || undefined, status: status || undefined });
      setBooks(response.results || []);
      setTotal(response.total);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to load book listings.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { void loadBooks(); }, [loadBooks]);

  const moderate = async (book: Book, action: 'approve' | 'reject', reason?: string) => {
    setActionId(book._id);
    try {
      const response = action === 'approve'
        ? await api.approveAdminBook(book._id)
        : await api.rejectAdminBook(book._id, reason);
      showToast(response.message, 'success');
      setRejectingBook(null);
      setRejectionReason('');
      await loadBooks();
    } catch (error) {
      showToast(error instanceof Error ? error.message : `Unable to ${action} this listing.`, 'error');
    } finally {
      setActionId(null);
    }
  };

  const deleteBook = async (book: Book) => {
    if (!window.confirm(`Permanently delete “${book.title}” and its associated images?`)) return;
    setActionId(book._id);
    try {
      const response = await api.deleteAdminBook(book._id);
      showToast(response.message, 'success');
      await loadBooks();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to delete this listing.', 'error');
    } finally {
      setActionId(null);
    }
  };

  const tabs: { label: string; value: BookStatusFilter }[] = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Sold', value: 'sold' },
  ];

  const columns: AdminTableColumn<Book>[] = [
    {
      key: 'book',
      header: 'Book',
      render: (book) => (
        <div className="flex min-w-56 items-center gap-3">
          <div className="h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-slate-100">
            <BookCover src={getImage(book)} alt={`Cover of ${book.title}`} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="line-clamp-2 font-bold text-slate-900">{book.title}</p>
            <p className="truncate text-xs text-slate-500">{book.author}</p>
          </div>
        </div>
      ),
    },
    { key: 'seller', header: 'Seller', render: (book) => <span className="font-medium">{getName(book.seller)}</span> },
    { key: 'price', header: 'Price', render: (book) => <span className="font-bold text-slate-900">{book.listingType === 'donate' ? 'Free' : formatPrice(getBookPrice(book))}</span> },
    { key: 'listingType', header: 'Listing', render: (book) => <span className="capitalize">{book.listingType}</span> },
    { key: 'status', header: 'Status', render: (book) => <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${statusStyle(book.status)}`}>{book.status}</span> },
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Moderation</p>
        <h2 className="mt-1 text-2xl font-extrabold text-slate-900">Book listings</h2>
        <p className="mt-1 text-sm text-slate-500">Review listings and manage marketplace visibility.</p>
      </div>
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map((tab) => (
          <button key={tab.value || 'all'} type="button" onClick={() => { setStatus(tab.value); setPage(1); }} className={`shrink-0 border-b-2 px-4 py-3 text-sm font-bold transition ${status === tab.value ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            {tab.label}
          </button>
        ))}
      </div>
      <AdminDataTable
        columns={columns}
        rows={books}
        getRowKey={(book) => book._id}
        loading={loading}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
        onSearchChange={(value) => { setSearch(value); setPage(1); }}
        searchPlaceholder="Search title, author, or ISBN…"
        emptyTitle="No listings found"
        rowActions={(book) => (
          <div className="flex justify-end gap-1">
            <Link href={`/books/${book._id}`} target="_blank" aria-label={`View ${book.title}`} title="View listing" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100">
              <Eye className="h-4 w-4" />
            </Link>
            {book.status === 'pending' && (
              <>
                <button type="button" disabled={actionId === book._id} onClick={() => void moderate(book, 'approve')} aria-label={`Approve ${book.title}`} title="Approve" className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">
                  {actionId === book._id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </button>
                <button type="button" disabled={actionId === book._id} onClick={() => { setRejectingBook(book); setRejectionReason(''); }} aria-label={`Reject ${book.title}`} title="Reject" className="rounded-lg p-2 text-amber-700 hover:bg-amber-50 disabled:opacity-50">
                  <X className="h-4 w-4" />
                </button>
              </>
            )}
            <button type="button" disabled={actionId === book._id} onClick={() => void deleteBook(book)} aria-label={`Delete ${book.title}`} title="Delete listing" className="rounded-lg p-2 text-rose-700 hover:bg-rose-50 disabled:opacity-50">
              {actionId === book._id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
          </div>
        )}
      />

      {rejectingBook && (
        <MotionDialog
          labelledBy="reject-book-title"
          onClose={() => setRejectingBook(null)}
          closeDisabled={actionId === rejectingBook._id}
          panelClassName="max-w-lg p-5 sm:p-6"
        >
            <h3 id="reject-book-title" className="text-lg font-extrabold text-slate-900">Reject listing</h3>
            <p className="mt-1 text-sm text-slate-500">Add an optional reason for “{rejectingBook.title}”. The seller will be notified.</p>
            <textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} maxLength={500} rows={4} placeholder="Reason for rejection…" className="mt-4 w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
            <p className="mt-1 text-right text-xs text-slate-400">{rejectionReason.length}/500</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setRejectingBook(null)} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="button" disabled={actionId === rejectingBook._id} onClick={() => void moderate(rejectingBook, 'reject', rejectionReason.trim() || undefined)} className="inline-flex items-center gap-2 rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-800 disabled:opacity-50">
                {actionId === rejectingBook._id && <LoaderCircle className="h-4 w-4 animate-spin" />} Reject listing
              </button>
            </div>
        </MotionDialog>
      )}
      <AdminToast toast={toast} />
    </div>
  );
}
