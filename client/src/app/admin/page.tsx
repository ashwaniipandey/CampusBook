'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import {
  Shield,
  Activity,
  Users,
  BookOpen,
  GraduationCap,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Database,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [healthData, setHealthData] = useState<any>(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  useEffect(() => {
    async function fetchHealth() {
      try {
        const res = await api.getHealth();
        setHealthData(res);
      } catch (err) {
        console.error('Error fetching health status:', err);
      } finally {
        setLoadingHealth(false);
      }
    }
    fetchHealth();
  }, []);

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Admin Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold">
              <Shield className="w-3.5 h-3.5" />
              <span>CampusBook Administrator Console</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Platform Administration</h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Logged in as <strong className="text-white">{user?.name}</strong> ({user?.email})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-white/10 backdrop-blur px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Admin Authorization Active
            </div>
          </div>
        </div>

        {/* System Health Overview Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Activity className="w-4 h-4 text-campus-600" />
              <span>API & Database Health Status</span>
            </div>
            <span className="text-xs text-slate-400">Real-time status check</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-400 block">Service Status</span>
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {healthData?.status === 'ok' ? 'Online' : 'Checking...'}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-400 block">Database</span>
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
                <Database className="w-4 h-4 text-campus-600" />
                {healthData?.database || 'Connecting...'}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-400 block">Environment</span>
              <div className="font-bold text-slate-800 text-sm capitalize">
                {healthData?.environment || 'Development'}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-400 block">Server Uptime</span>
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
                <Clock className="w-4 h-4 text-amber-500" />
                {healthData?.uptime || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Admin Operational Modules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">User Management</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Monitor 10+ student accounts, review domain verification statuses, and moderate campus participants.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-campus-600 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Textbook Listings</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Review 40+ seeded textbooks, handle flagged content, manage fair pricing policies and campus delivery safety.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Partner Universities</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Configure participating campuses: Stanford, MIT, UC Berkeley, Harvard, UW, UT Austin and valid student domains.
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

