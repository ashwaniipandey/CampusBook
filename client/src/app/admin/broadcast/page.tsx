'use client';

import { useEffect, useState } from 'react';
import {
  Megaphone,
  Send,
  Bell,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  BookOpen,
  History,
  Users,
  GraduationCap,
  Clock,
  RefreshCw,
} from 'lucide-react';
import api from '@/lib/api';
import { University } from '@/types';

const templates = [
  {
    label: 'Campus Book Exchange Week',
    title: '📚 Campus Book Exchange Week is Live!',
    message: 'Trade your completed semester textbooks with fellow students around campus. Post your books or request a swap today!',
    link: '/explore?listingType=exchange',
  },
  {
    label: 'Semester Book Fair',
    title: '🎉 CampusBook Semester Fair',
    message: 'Find major discounts on engineering, science, economics and medical textbooks right on your campus.',
    link: '/explore',
  },
  {
    label: 'Book Donation Drive',
    title: '🤝 Campus Textbook Donation Drive',
    message: 'Pass your finished textbooks forward to support junior students. List any book as a free donation today!',
    link: '/explore?listingType=donate',
  },
  {
    label: 'Important Platform Notice',
    title: '📢 Important Update for CampusBook Members',
    message: 'Please verify your campus meetup locations before completing handbook exchanges with other students.',
    link: '/dashboard',
  },
];

interface BroadcastHistoryItem {
  title: string;
  message: string;
  link: string;
  sentAt: string;
  recipientCount: number;
}

export default function AdminBroadcastPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('/');
  const [audience, setAudience] = useState<'all' | 'verified' | 'university'>('all');
  const [universityId, setUniversityId] = useState('');
  const [universities, setUniversities] = useState<University[]>([]);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [history, setHistory] = useState<BroadcastHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const loadUniversities = async () => {
    try {
      const res = await api.getUniversities();
      setUniversities(res.universities || []);
    } catch {
      // Non-critical
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.getBroadcastHistory();
      setHistory(res.history || []);
    } catch {
      // Non-critical
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadUniversities();
    loadHistory();
  }, []);

  const applyTemplate = (tpl: (typeof templates)[0]) => {
    setTitle(tpl.title);
    setMessage(tpl.message);
    setLink(tpl.link);
    setFeedback(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setFeedback({ type: 'error', text: 'Please provide both an announcement title and message.' });
      return;
    }

    if (audience === 'university' && !universityId) {
      setFeedback({ type: 'error', text: 'Please select a university for targeted broadcast.' });
      return;
    }

    setSending(true);
    setFeedback(null);

    try {
      const res = await api.broadcastAnnouncement({
        title: title.trim(),
        message: message.trim(),
        link: link.trim() || '/',
        audience,
        universityId: audience === 'university' ? universityId : undefined,
      });
      setFeedback({
        type: 'success',
        text: res.message || `Announcement successfully broadcast to ${res.count} users!`,
      });
      setTitle('');
      setMessage('');
      setLink('/');
      loadHistory();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Failed to broadcast announcement. Please try again.',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
            <Megaphone className="h-5 w-5" />
          </span>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-700 dark:text-purple-300">
            Admin Communications
          </p>
        </div>
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Broadcast Announcements &amp; Notifications
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Send platform announcements to all students, verified members, or a specific campus. Real-time push via Socket.io and instant notification bell delivery.
        </p>
      </div>

      {/* Quick Templates */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Quick Templates
        </p>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {templates.map((tpl) => (
            <button
              key={tpl.label}
              type="button"
              onClick={() => applyTemplate(tpl)}
              className="flex flex-col items-start rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-purple-300 hover:bg-purple-50/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-purple-700 dark:hover:bg-purple-950/30"
            >
              <span className="text-xs font-bold text-purple-700 dark:text-purple-300">{tpl.label}</span>
              <span className="mt-1 line-clamp-1 text-xs text-slate-600 dark:text-slate-300 font-medium">
                {tpl.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Composer Grid */}
      <div className="grid gap-8 lg:grid-cols-[1.3fr_.9fr]">
        {/* Form Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Send className="h-4 w-4 text-purple-600" /> Compose Announcement
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Target Audience Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Target Audience *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAudience('all')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold transition ${
                    audience === 'all'
                      ? 'border-purple-600 bg-purple-50 text-purple-700 dark:border-purple-500 dark:bg-purple-950/60 dark:text-purple-300'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-850'
                  }`}
                >
                  <Users className="h-3.5 w-3.5" /> All Users
                </button>
                <button
                  type="button"
                  onClick={() => setAudience('verified')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold transition ${
                    audience === 'verified'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-850'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Verified Only
                </button>
                <button
                  type="button"
                  onClick={() => setAudience('university')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold transition ${
                    audience === 'university'
                      ? 'border-amber-600 bg-amber-50 text-amber-700 dark:border-amber-500 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-850'
                  }`}
                >
                  <GraduationCap className="h-3.5 w-3.5" /> Single Campus
                </button>
              </div>

              {audience === 'university' && (
                <div className="mt-3">
                  <select
                    value={universityId}
                    onChange={(e) => setUniversityId(e.target.value)}
                    required
                    aria-label="Select Target University"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="">Select target university...</option>
                    {universities.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.code || u.city})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="announcement-title" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Announcement Title *
              </label>
              <input
                id="announcement-title"
                type="text"
                required
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 📚 Semester Book Exchange Starts Today!"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
              <p className="mt-1 text-right text-[10px] text-slate-400">{title.length} / 120</p>
            </div>

            <div>
              <label htmlFor="announcement-message" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Message Body *
              </label>
              <textarea
                id="announcement-message"
                required
                rows={4}
                maxLength={500}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write the message that students will see in their notification drawer..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
              <p className="mt-1 text-right text-[10px] text-slate-400">{message.length} / 500</p>
            </div>

            <div>
              <label htmlFor="announcement-link" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Action Link (Optional)
              </label>
              <input
                id="announcement-link"
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="e.g. /explore or /sell or https://..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Students will be navigated here upon clicking. Default is home (/).
              </p>
            </div>

            {feedback && (
              <div
                role="alert"
                className={`flex items-start gap-3 rounded-xl p-3.5 text-sm ${
                  feedback.type === 'success'
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                    : 'border border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
                )}
                <span>{feedback.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={sending || !title.trim() || !message.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Broadcasting announcement...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Broadcast Announcement
                </>
              )}
            </button>
          </form>
        </div>

        {/* Live Preview Box & Stats */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bell className="h-4 w-4 text-slate-500" /> Student Preview
          </h2>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Notification Drawer Card
            </p>

            <div className="flex gap-3 rounded-xl border border-purple-100 bg-purple-50/60 p-4 dark:border-purple-900 dark:bg-purple-950/30">
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                <BookOpen className="h-5 w-5" />
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-purple-600" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                    {title || 'Your announcement title here'}
                  </h3>
                  <span className="shrink-0 text-[10px] text-slate-400">Just now</span>
                </div>
                <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-600 dark:text-slate-300">
                  {message || 'Your broadcast message preview will appear here in real-time as you type.'}
                </p>
                {link && (
                  <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:underline dark:text-purple-300">
                    Open link <ExternalLink className="h-3 w-3" />
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
            <p className="font-bold flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Real-Time Socket.io Push
            </p>
            <p className="mt-1 leading-relaxed text-slate-600 dark:text-slate-300">
              Connected students receive this immediately in their notification bell without refreshing, and an unread notification is saved to their account.
            </p>
          </div>
        </div>
      </div>

      {/* Sent History List */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-purple-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Broadcast History</h2>
          </div>
          <button
            type="button"
            onClick={loadHistory}
            className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 hover:underline dark:text-purple-300"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${historyLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        <div className="mt-4">
          {historyLoading ? (
            <div className="py-8 text-center text-xs text-slate-500">Loading broadcast history...</div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">No announcements sent yet.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {history.map((item, index) => (
                <div key={index} className="py-3.5 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                        <Users className="h-3 w-3" /> {item.recipientCount} recipients
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {new Date(item.sentAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{item.message}</p>
                  {item.link && item.link !== '/' && (
                    <span className="mt-1 inline-block text-[11px] font-semibold text-purple-700 dark:text-purple-300">
                      Target: {item.link}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
