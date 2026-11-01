'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

export interface AdminTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

export interface AdminTableFilter {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}

interface AdminDataTableProps<T> {
  columns: AdminTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  loading: boolean;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  onSearchChange: (search: string) => void;
  searchPlaceholder?: string;
  filters?: AdminTableFilter[];
  toolbarActions?: ReactNode;
  emptyTitle?: string;
  emptyMessage?: string;
  rowActions?: (row: T) => ReactNode;
}

export default function AdminDataTable<T>({
  columns,
  rows,
  getRowKey,
  loading,
  page,
  totalPages,
  total,
  onPageChange,
  onSearchChange,
  searchPlaceholder = 'Search records…',
  filters = [],
  toolbarActions,
  emptyTitle = 'No records found',
  emptyMessage = 'Try adjusting your search or filters.',
  rowActions,
}: AdminDataTableProps<T>) {
  const [search, setSearch] = useState('');
  const searchCallback = useRef(onSearchChange);
  const firstSearchEffect = useRef(true);

  useEffect(() => {
    searchCallback.current = onSearchChange;
  }, [onSearchChange]);

  useEffect(() => {
    if (firstSearchEffect.current) {
      firstSearchEffect.current = false;
      return;
    }
    const timer = window.setTimeout(() => searchCallback.current(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const colSpan = columns.length + (rowActions ? 1 : 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row">
          <label className="relative block min-w-0 flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          {filters.map((filter) => (
            <label key={filter.label} className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="sr-only">{filter.label}</span>
              <select
                aria-label={filter.label}
                value={filter.value}
                onChange={(event) => filter.onChange(event.target.value)}
                className="min-w-32 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                {filter.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          ))}
        </div>
        {toolbarActions && <div className="flex shrink-0 items-center gap-2">{toolbarActions}</div>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse text-left">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col" className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 ${column.className || ''}`}>
                  {column.header}
                </th>
              ))}
              {rowActions && <th scope="col" className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 6 }).map((_, rowIndex) => (
                <tr key={`loading-${rowIndex}`}>
                  {Array.from({ length: colSpan }).map((__, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-4">
                      <div className="h-4 animate-pulse rounded bg-slate-100" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length ? (
              rows.map((row) => (
                <tr key={getRowKey(row)} className="transition hover:bg-slate-50/80">
                  {columns.map((column) => (
                    <td key={column.key} className={`px-4 py-4 text-sm text-slate-700 ${column.className || ''}`}>
                      {column.render(row)}
                    </td>
                  ))}
                  {rowActions && <td className="px-4 py-4 text-right">{rowActions(row)}</td>}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={Math.max(colSpan, 1)} className="px-6 py-16 text-center">
                  <p className="font-bold text-slate-800">{emptyTitle}</p>
                  <p className="mt-1 text-sm text-slate-500">{emptyMessage}</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          {loading ? 'Loading records…' : `${total.toLocaleString()} total · Page ${page} of ${Math.max(totalPages, 1)}`}
        </p>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={loading || page <= 1}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={loading || page >= totalPages}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
