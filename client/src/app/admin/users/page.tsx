'use client';

import { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, Download, LoaderCircle, ShieldOff, ShieldCheck } from 'lucide-react';
import AdminDataTable, { AdminTableColumn, AdminTableFilter } from '@/components/AdminDataTable';
import AdminToast, { AdminToastState } from '@/components/AdminToast';
import api from '@/lib/api';
import { User } from '@/types';

type AdminUser = User & { isBlocked?: boolean; university: User['university'] };

function universityName(value: User['university']) {
  return typeof value === 'string' ? value : value?.name || '—';
}

function badge(text: string, tone: 'green' | 'amber' | 'rose' | 'slate') {
  const styles = {
    green: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-800 ring-amber-200',
    rose: 'bg-rose-50 text-rose-800 ring-rose-200',
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ring-1 ring-inset ${styles[tone]}`}>{text}</span>;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [actionId, setActionId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<AdminToastState>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getAdminUsers({ page, limit: 20, q: search || undefined, status: status || undefined, role: role || undefined });
      setUsers(response.results as AdminUser[]);
      setTotal(response.total);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to load users.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, status, role]);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  const setFilter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  const handleUserAction = async (user: AdminUser, action: 'block' | 'unblock' | 'verify') => {
    const prompts = {
      block: `Block ${user.name}? They will no longer be able to sign in.`,
      unblock: `Unblock ${user.name}?`,
      verify: `Mark ${user.name} as a verified student?`,
    };
    if (!window.confirm(prompts[action])) return;
    setActionId(user._id);
    try {
      const response = action === 'verify'
        ? await api.verifyAdminUser(user._id)
        : await api.setAdminUserBlocked(user._id, action === 'block');
      showToast(response.message, 'success');
      await loadUsers();
    } catch (error) {
      showToast(error instanceof Error ? error.message : `Unable to ${action} this user.`, 'error');
    } finally {
      setActionId(null);
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const blob = await api.downloadAdminCsv('users');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'campusbook-users.csv';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast('User CSV exported.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to export users.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const columns: AdminTableColumn<AdminUser>[] = [
    {
      key: 'user',
      header: 'User',
      render: (user) => (
        <div className="flex min-w-48 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-50 text-sm font-bold text-emerald-800">
            {user.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : user.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold text-slate-900">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'university', header: 'University', render: (user) => universityName(user.university) },
    { key: 'role', header: 'Role', render: (user) => badge(user.role, user.role === 'admin' ? 'slate' : 'green') },
    { key: 'verified', header: 'Verified', render: (user) => user.isVerified ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><BadgeCheck className="h-4 w-4" /> Verified</span> : badge('Unverified', 'amber') },
    { key: 'status', header: 'Status', render: (user) => user.isBlocked ? badge('Blocked', 'rose') : badge(user.status || 'active', user.status === 'suspended' ? 'rose' : 'green') },
  ];

  const filters: AdminTableFilter[] = [
    {
      label: 'Role',
      value: role,
      options: [{ label: 'All roles', value: '' }, { label: 'Students', value: 'student' }, { label: 'Admins', value: 'admin' }],
      onChange: (value) => setFilter(setRole, value),
    },
    {
      label: 'Status',
      value: status,
      options: [
        { label: 'All statuses', value: '' },
        { label: 'Active', value: 'active' },
        { label: 'Blocked', value: 'blocked' },
        { label: 'Suspended', value: 'suspended' },
        { label: 'Pending', value: 'pending' },
      ],
      onChange: (value) => setFilter(setStatus, value),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Management</p>
          <h2 className="mt-1 text-2xl font-extrabold text-slate-900">Users</h2>
          <p className="mt-1 text-sm text-slate-500">Review campus accounts, verification, and access.</p>
        </div>
      </div>
      <AdminDataTable
        columns={columns}
        rows={users}
        getRowKey={(user) => user._id}
        loading={loading}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
        onSearchChange={(value) => { setSearch(value); setPage(1); }}
        searchPlaceholder="Search name or email…"
        filters={filters}
        toolbarActions={(
          <button type="button" onClick={() => void exportCsv()} disabled={exporting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60">
            {exporting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Export CSV
          </button>
        )}
        emptyTitle="No users found"
        rowActions={(user) => (
          <div className="flex justify-end gap-1.5">
            {!user.isVerified && user.role !== 'admin' && (
              <button type="button" title="Verify user" aria-label={`Verify ${user.name}`} disabled={actionId === user._id} onClick={() => void handleUserAction(user, 'verify')} className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">
                {actionId === user._id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
              </button>
            )}
            {user.role !== 'admin' && (
              <button type="button" title={user.isBlocked ? 'Unblock user' : 'Block user'} aria-label={`${user.isBlocked ? 'Unblock' : 'Block'} ${user.name}`} disabled={actionId === user._id} onClick={() => void handleUserAction(user, user.isBlocked ? 'unblock' : 'block')} className={`rounded-lg p-2 disabled:opacity-50 ${user.isBlocked ? 'text-emerald-700 hover:bg-emerald-50' : 'text-rose-700 hover:bg-rose-50'}`}>
                {actionId === user._id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : user.isBlocked ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
              </button>
            )}
          </div>
        )}
      />
      <AdminToast toast={toast} />
    </div>
  );
}
