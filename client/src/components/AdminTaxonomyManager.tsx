'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import AdminDataTable, { AdminTableColumn } from '@/components/AdminDataTable';
import AdminToast, { AdminToastState } from '@/components/AdminToast';
import api from '@/lib/api';
import { Category, University } from '@/types';

type TaxonomyItem = Category | University;
type TaxonomyKind = 'categories' | 'universities';

interface FormState {
  name: string;
  slug: string;
  description: string;
  icon: string;
  code: string;
  domain: string;
  city: string;
  state: string;
  country: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  slug: '',
  description: '',
  icon: 'book-open',
  code: '',
  domain: '',
  city: '',
  state: '',
  country: 'United States',
};

function isUniversity(item: TaxonomyItem): item is University {
  return 'domain' in item;
}

export default function AdminTaxonomyManager({ kind }: { kind: TaxonomyKind }) {
  const [items, setItems] = useState<TaxonomyItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TaxonomyItem | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<AdminToastState>(null);
  const isUniversities = kind === 'universities';
  const title = isUniversities ? 'Universities' : 'Categories';

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  };

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      if (isUniversities) {
        const response = await api.getAdminUniversities();
        setItems(response.universities);
      } else {
        const response = await api.getAdminCategories();
        setItems(response.categories);
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : `Unable to load ${title.toLowerCase()}.`, 'error');
    } finally {
      setLoading(false);
    }
  }, [isUniversities, title]);

  useEffect(() => { void loadItems(); }, [loadItems]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (item: TaxonomyItem) => {
    setEditing(item);
    setForm({
      ...EMPTY_FORM,
      name: item.name,
      ...(!isUniversity(item) ? { slug: item.slug, description: item.description || '', icon: item.icon || 'book-open' } : {}),
      ...(isUniversity(item) ? {
        code: item.code,
        domain: item.domain,
        city: item.city,
        state: item.state || '',
        country: item.country || '',
      } : {}),
    });
    setModalOpen(true);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const data: Partial<Category & University> = isUniversities
      ? {
        name: form.name.trim(),
        code: form.code.trim(),
        domain: form.domain.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        country: form.country.trim(),
      }
      : {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        icon: form.icon.trim(),
      };

    try {
      const response = isUniversities
        ? editing
          ? await api.updateAdminUniversity(editing._id, data)
          : await api.createAdminUniversity(data)
        : editing
          ? await api.updateAdminCategory(editing._id, data)
          : await api.createAdminCategory(data);
      showToast(response.message, 'success');
      setModalOpen(false);
      await loadItems();
    } catch (error) {
      showToast(error instanceof Error ? error.message : `Unable to save ${title.toLowerCase()}.`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: TaxonomyItem) => {
    const label = isUniversity(item) ? item.name : item.name;
    if (!window.confirm(`Delete “${label}”? This cannot be undone.`)) return;
    setDeletingId(item._id);
    try {
      const response = isUniversities
        ? await api.deleteAdminUniversity(item._id)
        : await api.deleteAdminCategory(item._id);
      showToast(response.message, 'success');
      await loadItems();
    } catch (error) {
      showToast(error instanceof Error ? error.message : `Unable to delete ${label}.`, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const columns: AdminTableColumn<TaxonomyItem>[] = isUniversities
    ? [
      { key: 'name', header: 'University', render: (item) => <span className="font-bold text-slate-900">{item.name}</span> },
      { key: 'code', header: 'Code', render: (item) => isUniversity(item) ? <span className="font-mono text-xs font-bold">{item.code}</span> : null },
      { key: 'domain', header: 'Email domain', render: (item) => isUniversity(item) ? `@${item.domain}` : null },
      { key: 'location', header: 'Location', render: (item) => isUniversity(item) ? `${item.city}${item.state ? `, ${item.state}` : ''}` : null },
      { key: 'active', header: 'Status', render: (item) => isUniversity(item) && item.isActive === false ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">Inactive</span> : <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800">Active</span> },
    ]
    : [
      { key: 'name', header: 'Category', render: (item) => <span className="font-bold text-slate-900">{item.name}</span> },
      { key: 'slug', header: 'Slug', render: (item) => !isUniversity(item) ? <span className="font-mono text-xs text-slate-600">{item.slug}</span> : null },
      { key: 'description', header: 'Description', render: (item) => !isUniversity(item) ? <span className="line-clamp-2 max-w-md text-xs text-slate-500">{item.description || '—'}</span> : null },
      { key: 'status', header: 'Status', render: (item) => !isUniversity(item) && item.isActive === false ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">Inactive</span> : <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800">Active</span> },
    ];
  const visibleItems = items.filter((item) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    if (isUniversity(item)) {
      return [item.name, item.code, item.domain, item.city].some((value) => value.toLowerCase().includes(query));
    }
    return [item.name, item.slug, item.description || ''].some((value) => value.toLowerCase().includes(query));
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Configuration</p>
          <h2 className="mt-1 text-2xl font-extrabold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">Manage marketplace {title.toLowerCase()}.</p>
        </div>
      </div>

      <AdminDataTable
        columns={columns}
        rows={visibleItems}
        getRowKey={(item) => item._id}
        loading={loading}
        page={1}
        totalPages={1}
        total={visibleItems.length}
        onPageChange={() => undefined}
        onSearchChange={setSearch}
        searchPlaceholder={`Search ${title.toLowerCase()}…`}
        toolbarActions={(
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2.5 text-xs font-bold text-white hover:bg-emerald-800">
            <Plus className="h-4 w-4" /> Add {isUniversities ? 'university' : 'category'}
          </button>
        )}
        emptyTitle={`No ${title.toLowerCase()} yet`}
        rowActions={(item) => (
          <div className="flex justify-end gap-1">
            <button type="button" onClick={() => openEdit(item)} aria-label={`Edit ${item.name}`} title="Edit" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100">
              <Pencil className="h-4 w-4" />
            </button>
            <button type="button" disabled={deletingId === item._id} onClick={() => void remove(item)} aria-label={`Delete ${item.name}`} title="Delete" className="rounded-lg p-2 text-rose-700 hover:bg-rose-50 disabled:opacity-50">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      {modalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="taxonomy-modal-title">
          <form onSubmit={submit} className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div>
              <h3 id="taxonomy-modal-title" className="text-lg font-extrabold text-slate-900">{editing ? 'Edit' : 'Add'} {isUniversities ? 'university' : 'category'}</h3>
              <p className="mt-1 text-sm text-slate-500">Fill in the details below.</p>
            </div>
            <label className="block space-y-1 text-xs font-bold text-slate-700">
              Name
              <input required minLength={2} maxLength={isUniversities ? 150 : 80} value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
            </label>
            {isUniversities ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1 text-xs font-bold text-slate-700">Code<input required maxLength={20} value={form.code} onChange={(event) => setForm((value) => ({ ...value, code: event.target.value }))} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></label>
                <label className="block space-y-1 text-xs font-bold text-slate-700">Email domain<input required value={form.domain} onChange={(event) => setForm((value) => ({ ...value, domain: event.target.value }))} placeholder="university.edu" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></label>
                <label className="block space-y-1 text-xs font-bold text-slate-700">City<input required value={form.city} onChange={(event) => setForm((value) => ({ ...value, city: event.target.value }))} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></label>
                <label className="block space-y-1 text-xs font-bold text-slate-700">State / region<input value={form.state} onChange={(event) => setForm((value) => ({ ...value, state: event.target.value }))} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></label>
                <label className="block space-y-1 text-xs font-bold text-slate-700 sm:col-span-2">Country<input required value={form.country} onChange={(event) => setForm((value) => ({ ...value, country: event.target.value }))} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></label>
              </div>
            ) : (
              <>
                <label className="block space-y-1 text-xs font-bold text-slate-700">Slug (optional)<input value={form.slug} onChange={(event) => setForm((value) => ({ ...value, slug: event.target.value }))} placeholder="generated-from-name" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></label>
                <label className="block space-y-1 text-xs font-bold text-slate-700">Description<textarea rows={3} maxLength={300} value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></label>
                <label className="block space-y-1 text-xs font-bold text-slate-700">Icon key<input value={form.icon} onChange={(event) => setForm((value) => ({ ...value, icon: event.target.value }))} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></label>
              </>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50">{saving ? 'Saving…' : editing ? 'Save changes' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}
      <AdminToast toast={toast} />
    </div>
  );
}
