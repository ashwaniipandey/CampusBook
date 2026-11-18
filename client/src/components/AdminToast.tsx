'use client';

import { CheckCircle2, XCircle } from 'lucide-react';

export type AdminToastState = { message: string; type: 'success' | 'error' } | null;

export default function AdminToast({ toast }: { toast: AdminToastState }) {
 if (!toast) return null;
 const success = toast.type === 'success';
 const Icon = success ? CheckCircle2 : XCircle;
 return (
 <div
 role="status"
 className={`fixed bottom-5 right-5 z-[90] flex max-w-sm items-start gap-2 rounded-xl border bg-card px-4 py-3 text-sm font-semibold shadow-xl ${
 success ? 'border-emerald-200 text-emerald-800 dark:border-emerald-800 dark:text-emerald-300' : 'border-rose-200 text-rose-800 dark:border-rose-800 dark:text-rose-300'
 }`}
 >
 <Icon className="mt-0.5 h-4 w-4 shrink-0" />
 <span>{toast.message}</span>
 </div>
 );
}
