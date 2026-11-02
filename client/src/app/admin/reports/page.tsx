'use client';

import { useCallback, useEffect, useState } from 'react';
import { Activity, BookOpen, GraduationCap, ShoppingBag, Users } from 'lucide-react';
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
import AdminToast, { AdminToastState } from '@/components/AdminToast';
import api from '@/lib/api';
import { formatPrice } from '@/lib/pricing';

const COLORS = ['#059669', '#34d399', '#a7f3d0', '#0f766e', '#6ee7b7', '#047857', '#d1fae5'];

export default function AdminReportsPage() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof api.getAdminStats>> | null>(null);
  const [activity, setActivity] = useState<Awaited<ReturnType<typeof api.getAdminActivity>>['months']>([]);
  const [categories, setCategories] = useState<Awaited<ReturnType<typeof api.getAdminCategoryAnalytics>>['categories']>([]);
  const [universities, setUniversities] = useState<Awaited<ReturnType<typeof api.getAdminUniversityAnalytics>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<AdminToastState>(null);

  const showError = (error: unknown) => {
    setToast({ type: 'error', message: error instanceof Error ? error.message : 'Unable to load reports.' });
    window.setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsResponse, activityResponse, categoriesResponse, universitiesResponse] = await Promise.all([
        api.getAdminStats(),
        api.getAdminActivity(12),
        api.getAdminCategoryAnalytics(),
        api.getAdminUniversityAnalytics(),
      ]);
      setStats(statsResponse);
      setActivity(activityResponse.months);
      setCategories(categoriesResponse.categories);
      setUniversities(universitiesResponse);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const universityMap = new Map((universities?.topByUsers || []).map((item) => [item.universityId, item]));
  const universityData = Array.from(universityMap.keys()).map((id) => {
    const user = universityMap.get(id);
    const books = universities?.topByBooks.find((item) => item.universityId === id);
    return { university: user?.university || 'University', users: user?.count || 0, books: books?.count || 0 };
  }).slice(0, 8);

  const cards = [
    { title: 'Students', value: stats?.totalStudents, icon: Users },
    { title: 'Books', value: stats?.totalBooks, icon: BookOpen },
    { title: 'Orders', value: stats?.totalOrders, icon: ShoppingBag },
    { title: 'Revenue value', value: stats ? formatPrice(stats.totalRevenueValue) : undefined, icon: Activity },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Insights</p>
        <h2 className="mt-1 text-2xl font-extrabold text-slate-900">Reports</h2>
        <p className="mt-1 text-sm text-slate-500">Platform growth and marketplace composition.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ title, value, icon: Icon }) => (
          <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">{title}</p>
              <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700"><Icon className="h-4 w-4" /></span>
            </div>
            {loading ? <div className="mt-4 h-8 w-28 animate-pulse rounded bg-slate-200" /> : <p className="mt-3 text-2xl font-extrabold text-slate-900">{value ?? 0}</p>}
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="font-bold text-slate-900">Monthly activity</h3>
          <p className="mt-1 text-xs text-slate-500">New users, books, and orders over the past year.</p>
          {loading ? <div className="mt-5 h-72 animate-pulse rounded-xl bg-slate-100" /> : activity.length ? (
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activity.map((row) => ({ ...row, label: new Date(`${row.month}-01T00:00:00`).toLocaleDateString(undefined, { month: 'short', year: '2-digit' }) }))}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="newUsers" name="Users" stroke="#059669" strokeWidth={3} />
                  <Line type="monotone" dataKey="newBooks" name="Books" stroke="#0f766e" strokeWidth={3} />
                  <Line type="monotone" dataKey="orders" name="Orders" stroke="#34d399" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="py-24 text-center text-sm text-slate-500">No activity data available.</p>}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="font-bold text-slate-900">Books by category</h3>
          <p className="mt-1 text-xs text-slate-500">Share of listings across categories.</p>
          {loading ? <div className="mt-5 h-72 animate-pulse rounded-xl bg-slate-100" /> : categories.some((item) => item.count > 0) ? (
            <div className="mt-4 grid items-center gap-3 sm:grid-cols-[1fr_0.8fr]">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categories} dataKey="count" nameKey="name" innerRadius="54%" outerRadius="84%" paddingAngle={3}>
                      {categories.map((category, index) => <Cell key={`${category.name}-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2.5">
                {categories.map((category, index) => (
                  <p key={`${category.name}-${index}`} className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex min-w-0 items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} /><span className="truncate font-semibold text-slate-700">{category.name}</span></span>
                    <span className="shrink-0 text-slate-500">{category.percentage}%</span>
                  </p>
                ))}
              </div>
            </div>
          ) : <p className="py-24 text-center text-sm text-slate-500">No category data available.</p>}
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-emerald-700" /><h3 className="font-bold text-slate-900">University distribution</h3></div>
        <p className="mt-1 text-xs text-slate-500">Top universities by account and book count.</p>
        {loading ? <div className="mt-5 h-80 animate-pulse rounded-xl bg-slate-100" /> : universityData.length ? (
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={universityData} layout="vertical" margin={{ left: 12, right: 12 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="university" width={140} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#475569' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="users" name="Users" fill="#059669" radius={[0, 5, 5, 0]} />
                <Bar dataKey="books" name="Books" fill="#6ee7b7" radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <p className="py-24 text-center text-sm text-slate-500">No university data available.</p>}
      </section>
      {toast && <AdminToast toast={toast} />}
    </div>
  );
}
