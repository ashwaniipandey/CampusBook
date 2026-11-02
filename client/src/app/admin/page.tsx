'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Clock3,
  LoaderCircle,
  RefreshCw,
  ShoppingBag,
  Users,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '@/lib/api';
import { Book, Order, User } from '@/types';
import { formatPrice, getBookPrice } from '@/lib/pricing';

type Stats = Awaited<ReturnType<typeof api.getAdminStats>>;
type ActivityData = Awaited<ReturnType<typeof api.getAdminActivity>>['months'];
type CategoriesData = Awaited<ReturnType<typeof api.getAdminCategoryAnalytics>>['categories'];
type UniversityData = Awaited<ReturnType<typeof api.getAdminUniversityAnalytics>>;
type RecentData = Awaited<ReturnType<typeof api.getAdminRecent>>;

const CHART_COLORS = ['#059669', '#34d399', '#a7f3d0', '#0f766e', '#6ee7b7', '#047857', '#d1fae5'];

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200 ${className}`} />;
}

function formatMonth(month: string) {
  const [year, value] = month.split('-').map(Number);
  return new Date(year, value - 1).toLocaleDateString(undefined, { month: 'short' });
}

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getImage(book: Book) {
  const image = book.images?.[0];
  return image ? (typeof image === 'string' ? image : image.url) : '';
}

function getPersonName(person: User | string | undefined) {
  return typeof person === 'string' ? 'Campus student' : person?.name || 'Campus student';
}

function StatCard({
  label,
  value,
  growth,
  icon: Icon,
  loading,
}: {
  label: string;
  value: number;
  growth?: number;
  icon: typeof Users;
  loading: boolean;
}) {
  const positive = (growth || 0) >= 0;
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          {loading ? <Skeleton className="mt-3 h-8 w-24" /> : <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{value.toLocaleString()}</p>}
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {growth !== undefined && (
        loading ? <Skeleton className="mt-3 h-4 w-28" /> : (
          <p className={`mt-3 inline-flex items-center gap-1 text-xs font-bold ${positive ? 'text-emerald-700' : 'text-rose-700'}`}>
            {positive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            {Math.abs(growth).toFixed(1)}% vs previous 30 days
          </p>
        )
      )}
    </article>
  );
}

function Panel({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<ActivityData>([]);
  const [categories, setCategories] = useState<CategoriesData>([]);
  const [universities, setUniversities] = useState<UniversityData | null>(null);
  const [recent, setRecent] = useState<RecentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  };

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [statsResponse, activityResponse, categoriesResponse, universitiesResponse, recentResponse] = await Promise.all([
        api.getAdminStats(),
        api.getAdminActivity(6),
        api.getAdminCategoryAnalytics(),
        api.getAdminUniversityAnalytics(),
        api.getAdminRecent(),
      ]);
      setStats(statsResponse);
      setActivity(activityResponse.months || []);
      setCategories(categoriesResponse.categories || []);
      setUniversities(universitiesResponse);
      setRecent(recentResponse);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load admin analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const universityChart = useMemo(() => {
    const users = universities?.topByUsers || [];
    const books = universities?.topByBooks || [];
    const userCounts = new Map(users.map((item) => [item.universityId, item]));
    const bookCounts = new Map(books.map((item) => [item.universityId, item]));
    return Array.from(userCounts.keys())
      .concat(Array.from(bookCounts.keys()))
      .filter((id, index, allIds) => allIds.indexOf(id) === index)
      .map((id) => ({
        university: userCounts.get(id)?.university || bookCounts.get(id)?.university || 'University',
        users: userCounts.get(id)?.count || 0,
        books: bookCounts.get(id)?.count || 0,
      }))
      .sort((left, right) => (right.users + right.books) - (left.users + left.books))
      .slice(0, 7);
  }, [universities]);

  const handleModeration = async (book: Book, action: 'approve' | 'reject') => {
    let reason: string | undefined;
    if (action === 'reject') {
      const enteredReason = window.prompt(`Optional reason for rejecting “${book.title}”:`);
      if (enteredReason === null) return;
      reason = enteredReason.trim() || undefined;
    }
    setActionId(book._id);
    try {
      const response = action === 'approve'
        ? await api.approveAdminBook(book._id)
        : await api.rejectAdminBook(book._id, reason);
      showToast(response.message || `Book ${action}d.`, 'success');
      await loadDashboard();
    } catch (error) {
      showToast(error instanceof Error ? error.message : `Unable to ${action} this listing.`, 'error');
    } finally {
      setActionId(null);
    }
  };

  const statCards = [
    { label: 'Total Students', value: stats?.totalStudents || 0, growth: stats?.growth.students, icon: Users },
    { label: 'Total Books', value: stats?.totalBooks || 0, growth: stats?.growth.books, icon: BookOpen },
    { label: 'Pending Approvals', value: stats?.pendingApprovals || 0, icon: Clock3 },
    { label: 'Total Orders', value: stats?.totalOrders || 0, growth: stats?.growth.orders, icon: ShoppingBag },
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Overview</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Platform dashboard</h2>
          <p className="mt-2 text-sm text-slate-500">Marketplace performance, moderation, and recent activity.</p>
        </div>
        <button type="button" onClick={() => void loadDashboard()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {errorMessage && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <span>{errorMessage}</span>
          <button type="button" onClick={() => void loadDashboard()} className="rounded-lg bg-rose-700 px-3 py-2 font-bold text-white hover:bg-rose-800">Retry</button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} loading={loading} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Marketplace activity" subtitle="New users, book listings, and orders by month">
          {loading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : activity.length ? (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activity.map((item) => ({ ...item, label: formatMonth(item.month) }))} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }} />
                  <Legend />
                  <Line type="monotone" dataKey="newUsers" name="New users" stroke="#059669" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="newBooks" name="New books" stroke="#0f766e" strokeWidth={3} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="orders" name="Orders" stroke="#34d399" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[280px] flex-col items-center justify-center text-center">
              <Activity className="h-9 w-9 text-slate-300" />
              <p className="mt-2 text-sm font-bold text-slate-700">No activity data yet</p>
              <p className="mt-1 text-xs text-slate-500">Monthly activity will appear when records are available.</p>
            </div>
          )}
        </Panel>

        <Panel title="Popular categories" subtitle={`${categories.reduce((total, item) => total + item.count, 0).toLocaleString()} books by category`}>
          {loading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : categories.some((category) => category.count > 0) ? (
            <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1.1fr)_minmax(150px,0.9fr)]">
              <div className="h-[260px] min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categories} dataKey="count" nameKey="name" innerRadius="58%" outerRadius="88%" paddingAngle={3}>
                      {categories.map((category, index) => <Cell key={`${category.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value, _name, item) => [`${value} books (${item.payload.percentage}%)`, item.payload.name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="max-h-[260px] space-y-3 overflow-y-auto">
                {categories.map((category, index) => (
                  <div key={`${category.name}-${index}`} className="flex items-center justify-between gap-3 text-xs">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                      <span className="truncate font-semibold text-slate-700">{category.name}</span>
                    </span>
                    <span className="shrink-0 text-slate-500">{category.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-[280px] flex-col items-center justify-center text-center">
              <BookOpen className="h-9 w-9 text-slate-300" />
              <p className="mt-2 text-sm font-bold text-slate-700">No categories to display</p>
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Top universities" subtitle="Users and book listings by university">
        {loading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : universityChart.length ? (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={universityChart} layout="vertical" margin={{ top: 0, right: 16, left: 16, bottom: 0 }} barGap={4}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis type="category" dataKey="university" width={150} tickLine={false} axisLine={false} tick={{ fill: '#475569', fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }} />
                <Legend />
                <Bar dataKey="users" name="Users" fill="#059669" radius={[0, 5, 5, 0]} />
                <Bar dataKey="books" name="Books" fill="#6ee7b7" radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-[220px] flex-col items-center justify-center text-center">
            <Users className="h-9 w-9 text-slate-300" />
            <p className="mt-2 text-sm font-bold text-slate-700">No university activity yet</p>
          </div>
        )}
      </Panel>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Recent signups" subtitle="Latest registered accounts" action={<Link href="/admin/users" className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline">Users <ArrowRight className="h-3.5 w-3.5" /></Link>}>
          {loading ? (
            <div className="space-y-3">{[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-14 w-full" />)}</div>
          ) : recent?.signups.length ? (
            <ul className="divide-y divide-slate-100">
              {recent.signups.slice(0, 6).map((signup) => (
                <li key={signup._id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-50 text-xs font-bold text-emerald-800">
                    {signup.avatar ? <img src={signup.avatar} alt="" className="h-full w-full object-cover" /> : signup.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">{signup.name}</p>
                    <p className="truncate text-xs text-slate-500">{signup.email}</p>
                  </div>
                  <time className="shrink-0 text-[10px] text-slate-400">{formatDate(signup.createdAt)}</time>
                </li>
              ))}
            </ul>
          ) : <p className="py-10 text-center text-sm text-slate-500">No signups yet.</p>}
        </Panel>

        <Panel title="Pending books" subtitle="Listings awaiting moderation" action={<Link href="/admin/books?status=pending" className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline">All books <ArrowRight className="h-3.5 w-3.5" /></Link>}>
          {loading ? (
            <div className="space-y-3">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-24 w-full" />)}</div>
          ) : recent?.pendingBooks.length ? (
            <ul className="space-y-3">
              {recent.pendingBooks.slice(0, 5).map((book) => (
                <li key={book._id} className="rounded-xl border border-slate-100 p-3">
                  <div className="flex gap-3">
                    <div className="h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      {getImage(book) ? <img src={getImage(book)} alt="" className="h-full w-full object-cover" /> : <BookOpen className="m-auto mt-4 h-5 w-5 text-slate-300" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-bold text-slate-800">{book.title}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">by {getPersonName(book.seller)} · {book.listingType === 'donate' ? 'Free' : formatPrice(getBookPrice(book))}</p>
                      <div className="mt-2 flex gap-2">
                        <button type="button" disabled={actionId === book._id} onClick={() => void handleModeration(book, 'approve')} className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-800 disabled:opacity-50">
                          {actionId === book._id ? <LoaderCircle className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Approve
                        </button>
                        <button type="button" disabled={actionId === book._id} onClick={() => void handleModeration(book, 'reject')} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-[11px] font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50">
                          <X className="h-3 w-3" /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className="py-10 text-center text-sm text-slate-500">No books are waiting for approval.</p>}
        </Panel>

        <Panel title="Recent orders" subtitle="Latest marketplace orders" action={<Link href="/admin/orders" className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline">Orders <ArrowRight className="h-3.5 w-3.5" /></Link>}>
          {loading ? (
            <div className="space-y-3">{[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-14 w-full" />)}</div>
          ) : recent?.orders.length ? (
            <ul className="divide-y divide-slate-100">
              {recent.orders.slice(0, 6).map((order: Order) => (
                <li key={order._id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">{order.book?.title || order.orderNumber || 'Order'}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{getPersonName(order.buyer)} · {formatDate(order.createdAt)}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold capitalize text-emerald-800">{(order.status || order.orderStatus || 'placed').replaceAll('_', ' ')}</span>
                </li>
              ))}
            </ul>
          ) : <p className="py-10 text-center text-sm text-slate-500">No orders yet.</p>}
        </Panel>
      </div>

      {toast && (
        <div role="status" className={`fixed bottom-5 right-5 z-50 flex max-w-sm items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold shadow-xl ${
          toast.type === 'success' ? 'border-emerald-200 bg-white text-emerald-800' : 'border-rose-200 bg-white text-rose-800'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
