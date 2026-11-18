'use client';

import Link from 'next/link';
import { GraduationCap, ArrowRight, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { University } from '@/types';
import Card from '@/components/Card';
import Chip from '@/components/Chip';

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
    <main className="min-h-[85vh] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Badge */}
        <Chip active>
          <GraduationCap className="h-4 w-4" /> Campus Directory
        </Chip>

        <h1 className="mt-4 text-3xl sm:text-5xl font-extrabold tracking-tight text-heading">
          Partner Colleges &amp; <span className="text-accent italic">Campuses</span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm sm:text-base text-text">
          Connect with active student textbook exchanges at premier institutes and universities across India and internationally.
        </p>

        {/* Search */}
        <div className="mt-8 relative max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search college, city, or institute code..."
            className="w-full rounded-2xl border border-card-border bg-card/60 py-3 pl-10 pr-4 text-sm text-heading placeholder:text-muted shadow-sm backdrop-blur-md focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>

        {/* Colleges Grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl border border-card-border bg-card/60" />
            ))
          ) : filtered.length ? (
            filtered.map((uni) => (
              <Card
                key={uni._id}
                className="group p-5 shadow-sm transition hover:-translate-y-1 hover:border-accent"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-chip border border-card-border/60 px-2 py-0.5 text-xs font-bold text-heading">
                    {uni.code}
                  </span>
                  <span className="text-xs text-muted">{uni.city}, {uni.country}</span>
                </div>
                <h3 className="mt-3 font-bold text-heading group-hover:text-accent transition line-clamp-2">
                  {uni.name}
                </h3>
                <Link
                  href={`/explore?university=${encodeURIComponent(uni._id)}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline"
                >
                  Browse Campus Books <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Card>
            ))
          ) : (
            <p className="col-span-full py-12 text-center text-muted">No universities found matching your search.</p>
          )}
        </div>
      </div>
    </main>
  );
}
