'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminDataTable, { AdminTableColumn, AdminTableFilter } from '@/components/AdminDataTable';
import AdminToast, { AdminToastState } from '@/components/AdminToast';
import api from '@/lib/api';
import { Book, DonationRequest, ExchangeRequest, Order, User } from '@/types';

type RequestKind = 'orders' | 'exchanges' | 'donations';
type AdminRequest = Order | ExchangeRequest | DonationRequest;

const ORDER_STATUSES = ['placed', 'confirmed', 'ready_for_pickup', 'completed', 'cancelled'];
const REQUEST_STATUSES = ['pending', 'accepted', 'rejected', 'cancelled', 'completed'];

function personName(value: User | string | undefined) {
  return typeof value === 'string' ? 'Campus student' : value?.name || 'Campus student';
}

function bookTitle(value: Book | string | undefined) {
  return typeof value === 'string' ? 'Book listing' : value?.title || 'Book listing';
}

function statusOf(row: AdminRequest) {
  if ('orderNumber' in row) return row.status || 'placed';
  return row.status;
}

function statusBadge(status: string) {
  const tone = status === 'completed' || status === 'confirmed'
    ? 'bg-emerald-50 text-emerald-800'
    : status === 'pending' || status === 'placed'
      ? 'bg-amber-50 text-amber-800'
      : status === 'rejected' || status === 'cancelled'
        ? 'bg-rose-50 text-rose-800'
        : 'bg-slate-100 text-slate-700';
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${tone}`}>{status.replaceAll('_', ' ')}</span>;
}

export default function AdminRequestTable({ kind }: { kind: RequestKind }) {
  const [rows, setRows] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<AdminToastState>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  };

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, q: search || undefined, status: status || undefined };
      const response = kind === 'orders'
        ? await api.getAdminOrders(params)
        : kind === 'exchanges'
          ? await api.getAdminExchanges(params)
          : await api.getAdminDonations(params);
      setRows(response.results);
      setTotal(response.total);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      showToast(error instanceof Error ? error.message : `Unable to load ${kind}.`, 'error');
    } finally {
      setLoading(false);
    }
  }, [kind, page, search, status]);

  useEffect(() => { void loadRows(); }, [loadRows]);

  const title = kind === 'orders' ? 'Orders' : kind === 'exchanges' ? 'Exchange requests' : 'Donation requests';
  const statuses = kind === 'orders' ? ORDER_STATUSES : REQUEST_STATUSES;

  const columns: AdminTableColumn<AdminRequest>[] = kind === 'orders'
    ? [
      { key: 'order', header: 'Order', render: (row) => 'orderNumber' in row ? <div><p className="font-bold text-slate-900">{row.orderNumber || row._id.slice(-8)}</p><p className="text-xs text-slate-500">{row.book?.title || 'Book listing'}</p></div> : null },
      { key: 'buyer', header: 'Buyer', render: (row) => 'buyer' in row ? personName(row.buyer) : null },
      { key: 'seller', header: 'Seller', render: (row) => 'seller' in row ? personName(row.seller) : null },
      { key: 'amount', header: 'Amount', render: (row) => 'amount' in row ? `$${Number(row.amount ?? row.price ?? 0).toFixed(2)}` : null },
      { key: 'status', header: 'Status', render: (row) => statusBadge(statusOf(row)) },
      { key: 'date', header: 'Date', render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—' },
    ]
    : kind === 'exchanges'
      ? [
        { key: 'books', header: 'Books', render: (row) => 'requestedBook' in row ? <div><p className="font-bold text-slate-900">{bookTitle(row.requestedBook)}</p><p className="text-xs text-slate-500">For: {bookTitle(row.offeredBook)}</p></div> : null },
        { key: 'requester', header: 'Requester', render: (row) => 'requester' in row ? personName(row.requester) : null },
        { key: 'owner', header: 'Owner', render: (row) => 'bookOwner' in row ? personName(row.bookOwner) : null },
        { key: 'message', header: 'Message', render: (row) => 'requestedBook' in row ? <span className="line-clamp-2 max-w-56 text-xs text-slate-500">{row.message || '—'}</span> : null },
        { key: 'status', header: 'Status', render: (row) => statusBadge(statusOf(row)) },
        { key: 'date', header: 'Date', render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—' },
      ]
      : [
        { key: 'book', header: 'Book', render: (row) => 'donor' in row ? <div><p className="font-bold text-slate-900">{bookTitle(row.book)}</p><p className="text-xs text-slate-500">{row.message || row.reason || '—'}</p></div> : null },
        { key: 'requester', header: 'Requester', render: (row) => 'donor' in row ? personName(row.requester) : null },
        { key: 'donor', header: 'Donor', render: (row) => 'donor' in row ? personName(row.donor) : null },
        { key: 'status', header: 'Status', render: (row) => statusBadge(statusOf(row)) },
        { key: 'date', header: 'Date', render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—' },
      ];

  const filters: AdminTableFilter[] = [{
    label: 'Status',
    value: status,
    options: [{ label: 'All statuses', value: '' }, ...statuses.map((value) => ({ label: value.replaceAll('_', ' '), value }))],
    onChange: (value) => { setStatus(value); setPage(1); },
  }];

  const exportOrders = async () => {
    setExporting(true);
    try {
      const blob = await api.downloadAdminCsv('orders');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'campusbook-orders.csv';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast('Orders CSV exported.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to export orders.', 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Marketplace records</p>
        <h2 className="mt-1 text-2xl font-extrabold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">Search and review marketplace records.</p>
      </div>
      <AdminDataTable
        columns={columns}
        rows={rows}
        getRowKey={(row) => row._id}
        loading={loading}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
        onSearchChange={(value) => { setSearch(value); setPage(1); }}
        searchPlaceholder={kind === 'orders' ? 'Search order, person, or book…' : 'Search people or books…'}
        filters={filters}
        toolbarActions={kind === 'orders' ? (
          <button type="button" onClick={() => void exportOrders()} disabled={exporting} className="rounded-xl bg-emerald-700 px-3 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60">
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        ) : undefined}
        emptyTitle={`No ${kind} found`}
        emptyMessage="Try changing the status filter or search."
      />
      <AdminToast toast={toast} />
    </div>
  );
}
