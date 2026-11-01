'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  BookOpen,
  GraduationCap,
  HeartHandshake,
  LayoutDashboard,
  Menu,
  Repeat2,
  Settings,
  ShoppingCart,
  Tags,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const navigation = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Book Listings', href: '/admin/books', icon: BookOpen },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Exchange Requests', href: '/admin/exchanges', icon: Repeat2 },
  { label: 'Donation Requests', href: '/admin/donations', icon: HeartHandshake },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { label: 'Categories', href: '/admin/categories', icon: Tags },
  { label: 'Universities', href: '/admin/universities', icon: GraduationCap },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else if (user.role !== 'admin') router.replace('/dashboard');
  }, [loading, user, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close admin navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden"
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-950 text-slate-300 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex h-20 items-center justify-between border-b border-slate-800 px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <BookOpen className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-lg font-extrabold tracking-tight text-white">CampusBook</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">Admin console</span>
            </span>
          </Link>
          <button type="button" onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Admin navigation" className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Management</p>
          {navigation.map(({ label, href, icon: Icon }) => {
            const active = href === '/admin' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                  active
                    ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/20'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-emerald-400' : 'text-slate-500'}`} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-900 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-900 font-bold text-emerald-300">
              {user.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : user.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">{user.name}</p>
              <p className="truncate text-xs text-slate-500">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open admin menu">
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-xs font-semibold text-slate-500">CampusBook administration</p>
              <h1 className="text-sm font-extrabold text-slate-900 sm:text-base">Welcome, {user.name}</h1>
            </div>
          </div>
          <span className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 sm:inline-flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Admin access
          </span>
        </header>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
