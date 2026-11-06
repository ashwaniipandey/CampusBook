'use client';

import Link from 'next/link';
import { GraduationCap, ArrowRight, BookOpen, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { University } from '@/types';

export default function CollegesPage() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getUniversities()
      .then((res) => setUniversities(res.universities || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = universities.filter((u) => {
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.city.toLowerCase().includes(q) || u.code.toLowerCase().includes(q);
  });

  return (
    <main className="min-h-[85vh] bg-gradient-to-b from-[#02130b] via-[#041f12] to-[#010906] px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-1 text-xs font-bold text-emerald-300">
          <GraduationCap className="h-4 w-4" /> Campus Directory
        </div>
        <h1 className="mt-4 text-3xl sm:text-5xl font-extrabold tracking-tight">
          Partner Colleges & <span className="text-emerald-400 italic">Campuses</span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm sm:text-base text-emerald-100/70">
          Connect with active student textbook exchanges at premier institutes and universities across India and internationally.
        </p>

        {/* Search */}
        <div className="mt-8 relative max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search college, city, or institute code..."
            className="w-full rounded-2xl border border-white/15 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-400 backdrop-blur-md focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
          />
        </div>

        {/* Colleges Grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
            ))
          ) : filtered.length ? (
            filtered.map((uni) => (
              <div
                key={uni._id}
                className="group rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md transition hover:-translate-y-1 hover:border-emerald-500/40 hover:bg-white/10"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-300">
                    {uni.code}
                  </span>
                  <span className="text-xs text-slate-400">{uni.city}, {uni.country}</span>
                </div>
                <h3 className="mt-3 font-bold text-white group-hover:text-emerald-300 transition line-clamp-2">
                  {uni.name}
                </h3>
                <Link
                  href={`/explore?university=${encodeURIComponent(uni._id)}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300"
                >
                  Browse Campus Books <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))
          ) : (
            <p className="col-span-full py-12 text-center text-slate-400">No universities found matching your search.</p>
          )}
        </div>
      </div>
    </main>
  );
}

