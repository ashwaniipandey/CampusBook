'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, CheckCircle2, LoaderCircle, MessageCircle, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { MotionDialog } from '@/components/MotionEffects';
import {
  Book,
  BookImage,
  DonationRequest,
  ExchangeRequest,
  RequestStatus,
  User,
} from '@/types';

type RequestKind = 'exchange' | 'donation';
type RequestRole = 'received' | 'sent';
type ActionStatus = Extract<RequestStatus, 'accepted' | 'rejected' | 'cancelled' | 'completed'>;
type Toast = { message: string; type: 'success' | 'error' };

interface DashboardRequest {
  _id: string;
  requester: User | string;
  recipient: User | string;
  book: Book;
  offeredBook?: Book;
  status: RequestStatus;
  message: string;
  createdAt?: string;
}

interface PendingAction {
  request: DashboardRequest;
  status: ActionStatus;
}

function getImageUrl(image: string | BookImage | undefined) {
  if (!image) return '';
  return typeof image === 'string' ? image : image.url;
}

function getName(user: User | string | undefined) {
  return typeof user === 'string' ? 'Campus student' : user?.name || 'Campus student';
}

function fromExchange(request: ExchangeRequest): DashboardRequest {
  return {
    _id: request._id,
    requester: request.requester,
    recipient: request.bookOwner,
    book: request.requestedBook,
    offeredBook: request.offeredBook,
    status: request.status,
    message: request.message || '',
    createdAt: request.createdAt,
  };
}

function fromDonation(request: DonationRequest): DashboardRequest {
  return {
    _id: request._id,
    requester: request.requester,
    recipient: request.donor,
    book: request.book,
    status: request.status,
    message: request.message || request.reason || '',
    createdAt: request.createdAt,
  };
}

const STATUS_STYLES: Record<RequestStatus, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-800',
  accepted: 'border-blue-200 bg-blue-50 text-blue-800',
  rejected: 'border-rose-200 bg-rose-50 text-rose-800',
  cancelled: 'border-slate-200 bg-slate-100 text-slate-700',
  completed: 'border-campus-200 bg-campus-50 text-campus-800',
};

export default function RequestDashboard({ kind }: { kind: RequestKind }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeRole, setActiveRole] = useState<RequestRole>('received');
  const [received, setReceived] = useState<DashboardRequest[]>([]);
  const [sent, setSent] = useState<DashboardRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [messagingRequestId, setMessagingRequestId] = useState<string | null>(null);
  const label = kind === 'exchange' ? 'Exchange' : 'Donation';

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  const loadRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      if (kind === 'exchange') {
        const [receivedResponse, sentResponse] = await Promise.all([
          api.getExchangeRequests('received'),
          api.getExchangeRequests('sent'),
        ]);
        setReceived((receivedResponse.exchangeRequests || []).map(fromExchange));
        setSent((sentResponse.exchangeRequests || []).map(fromExchange));
      } else {
        const [receivedResponse, sentResponse] = await Promise.all([
          api.getDonationRequests('received'),
          api.getDonationRequests('sent'),
        ]);
        setReceived((receivedResponse.donationRequests || []).map(fromDonation));
        setSent((sentResponse.donationRequests || []).map(fromDonation));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : `Unable to load ${label.toLowerCase()} requests.`;
      setErrorMessage(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [kind, label, showToast, user]);

  useEffect(() => {
    if (!authLoading && !user) {
      const returnUrl = `${window.location.pathname}${window.location.search}`;
      router.replace(`/login?redirect=${encodeURIComponent(returnUrl)}`);
    } else if (user) {
      void loadRequests();
    }
  }, [authLoading, user, router, loadRequests]);

  const updateRequest = async () => {
    if (!pendingAction) return;
    const { request, status } = pendingAction;
    setUpdatingId(request._id);
    try {
      let updatedRequest: DashboardRequest;
      let responseMessage: string;
      if (kind === 'exchange') {
        const response = await api.updateExchangeRequestStatus(request._id, status);
        updatedRequest = fromExchange(response.exchangeRequest);
        responseMessage = response.message;
      } else {
        const response = await api.updateDonationRequestStatus(request._id, status);
        updatedRequest = fromDonation(response.donationRequest);
        responseMessage = response.message;
      }
      const updateList = (items: DashboardRequest[]) => items.map((item) => (
        item._id === request._id ? updatedRequest : item
      ));
      setReceived(updateList);
      setSent(updateList);
      setPendingAction(null);
      showToast(responseMessage || `${label} request updated.`);
      if (status === 'accepted' && kind === 'donation') {
        await loadRequests();
      }
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : `Unable to update this ${label.toLowerCase()} request.`,
        'error'
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const messageRequestParty = async (request: DashboardRequest, otherPerson: User | string) => {
    const userId = typeof otherPerson === 'string' ? otherPerson : otherPerson._id;
    if (!userId || !request.book?._id || messagingRequestId) return;
    setMessagingRequestId(request._id);
    try {
      const response = await api.createConversation({ userId, bookId: request.book._id });
      router.push(`/messages/${response.conversation._id}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to open this conversation.', 'error');
    } finally {
      setMessagingRequestId(null);
    }
  };

  if (authLoading || !user || loading) {
    return (
      <main className="min-h-[65vh] bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 h-8 w-56 animate-pulse rounded-lg bg-slate-200" />
          <div className="mb-6 h-12 animate-pulse rounded-xl bg-slate-200" />
          <div className="space-y-4">
            {[0, 1, 2].map((item) => (
              <div key={item} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-4 h-4 w-1/3 rounded bg-slate-200" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="h-28 rounded-xl bg-slate-200" />
                  <div className="h-28 rounded-xl bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  const displayedRequests = activeRole === 'received' ? received : sent;
  const isReceived = activeRole === 'received';

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      {toast && (
        <div
          role="status"
          className={`fixed right-4 top-20 z-[70] max-w-sm rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${
            toast.type === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-800'
              : 'border-campus-200 bg-campus-50 text-campus-800'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="mx-auto max-w-5xl">
        <header className="mb-6">
          <p className="text-sm font-bold uppercase tracking-wider text-campus-700">{label} requests</p>
          <h1 className="mt-1 text-3xl font-black text-slate-950">
            {kind === 'exchange' ? 'Your exchanges' : 'Your donation requests'}
          </h1>
        </header>

        <div role="tablist" aria-label={`${label} request type`} className="mb-6 grid grid-cols-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {(['received', 'sent'] as RequestRole[]).map((role) => {
            const count = role === 'received' ? received.length : sent.length;
            return (
              <button
                key={role}
                type="button"
                role="tab"
                aria-selected={activeRole === role}
                onClick={() => setActiveRole(role)}
                className={`rounded-lg px-4 py-3 text-sm font-bold capitalize transition ${
                  activeRole === role ? 'bg-campus-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {role} <span className="ml-1 opacity-80">({count})</span>
              </button>
            );
          })}
        </div>

        {errorMessage ? (
          <section className="rounded-3xl border border-rose-200 bg-white px-6 py-14 text-center shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Unable to load requests</h2>
            <p className="mt-2 text-sm text-slate-600">{errorMessage}</p>
            <button type="button" onClick={() => void loadRequests()} className="mt-6 rounded-xl bg-campus-600 px-5 py-3 text-sm font-bold text-white hover:bg-campus-700">
              Try again
            </button>
          </section>
        ) : displayedRequests.length === 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-campus-50 text-campus-600">
              <BookOpen className="h-8 w-8" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-slate-900">No {label.toLowerCase()} requests yet</h2>
            <p className="mt-2 text-sm text-slate-500">
              {isReceived ? `Requests for your ${kind === 'exchange' ? 'exchange' : 'donation'} listings will appear here.` : `Your sent ${label.toLowerCase()} requests will appear here.`}
            </p>
            <Link href="/explore" className="mt-6 inline-flex rounded-xl bg-campus-600 px-5 py-3 text-sm font-bold text-white hover:bg-campus-700">
              Explore books
            </Link>
          </section>
        ) : (
          <div className="space-y-5">
            {displayedRequests.map((request) => {
              const status = request.status;
              const otherPerson = isReceived ? request.requester : request.recipient;
              const canRespond = isReceived && status === 'pending';
              const canCancel = !isReceived && status === 'pending';
              const canComplete = status === 'accepted';
              const mainImage = getImageUrl(request.book.images?.[0]);
              const offeredImage = getImageUrl(request.offeredBook?.images?.[0]);
              const personRole = kind === 'exchange'
                ? (isReceived ? 'Requester' : 'Book owner')
                : (isReceived ? 'Requester' : 'Donor');

              return (
                <article key={request._id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">
                    <p className="text-xs text-slate-500">
                      {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'Request'}
                    </p>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${STATUS_STYLES[status]}`}>
                      {status}
                    </span>
                  </div>

                  <div className={`grid gap-4 p-4 sm:p-5 ${request.offeredBook ? 'sm:grid-cols-2' : 'sm:grid-cols-[180px_1fr]'}`}>
                    {[{ book: request.book, image: mainImage, title: kind === 'exchange' ? 'Requested book' : 'Donation book' },
                      ...(request.offeredBook ? [{ book: request.offeredBook, image: offeredImage, title: 'Offered book' }] : [])]
                      .map(({ book, image, title }) => (
                        <Link
                          key={`${request._id}-${title}`}
                          href={`/books/${book._id}`}
                          className="flex min-w-0 gap-3 rounded-2xl border border-slate-100 p-3 transition hover:border-campus-200 hover:bg-campus-50/40"
                        >
                          <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                            {image ? (
                              <img src={image} alt={book.title} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-slate-300"><BookOpen className="h-8 w-8" /></div>
                            )}
                          </div>
                          <div className="min-w-0 self-center">
                            <span className="text-[10px] font-bold uppercase tracking-wide text-campus-700">{title}</span>
                            <h2 className="mt-1 line-clamp-2 font-bold leading-snug text-slate-900">{book.title}</h2>
                            <p className="mt-1 line-clamp-1 text-xs text-slate-500">{book.author}</p>
                          </div>
                        </Link>
                      ))}
                  </div>

                  <div className="space-y-2 px-4 pb-4 sm:px-5">
                    <p className="text-sm text-slate-600">
                      {personRole}: <span className="font-semibold text-slate-900">{getName(otherPerson)}</span>
                    </p>
                    {request.message && (
                      <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">{request.message}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-slate-100 px-4 py-4 sm:px-5">
                    {otherPerson && request.book?._id && (
                      <button
                        type="button"
                        disabled={messagingRequestId === request._id}
                        onClick={() => void messageRequestParty(request, otherPerson)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:border-campus-300 hover:bg-campus-50 hover:text-campus-800 disabled:opacity-50"
                      >
                        {messagingRequestId === request._id
                          ? <LoaderCircle className="h-4 w-4 animate-spin" />
                          : <MessageCircle className="h-4 w-4" />}
                        Message
                      </button>
                    )}
                      {canRespond && (
                        <>
                          <button type="button" disabled={updatingId === request._id} onClick={() => setPendingAction({ request, status: 'accepted' })} className="inline-flex items-center gap-2 rounded-xl bg-campus-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-campus-700 disabled:opacity-50">
                            <CheckCircle2 className="h-4 w-4" /> Accept
                          </button>
                          <button type="button" disabled={updatingId === request._id} onClick={() => setPendingAction({ request, status: 'rejected' })} className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50">
                            Reject
                          </button>
                        </>
                      )}
                      {canCancel && (
                        <button type="button" disabled={updatingId === request._id} onClick={() => setPendingAction({ request, status: 'cancelled' })} className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50">
                          Cancel
                        </button>
                      )}
                      {canComplete && (
                        <button type="button" disabled={updatingId === request._id} onClick={() => setPendingAction({ request, status: 'completed' })} className="inline-flex items-center gap-2 rounded-xl bg-campus-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-campus-700 disabled:opacity-50">
                          <CheckCircle2 className="h-4 w-4" /> Mark Completed
                        </button>
                      )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {pendingAction && (
        <MotionDialog
          labelledBy="request-action-title"
          onClose={() => setPendingAction(null)}
          closeDisabled={Boolean(updatingId)}
          panelClassName="max-w-sm p-6"
        >
            <div className="flex items-start justify-between gap-4">
              <h2 id="request-action-title" className="text-lg font-extrabold text-slate-900">
                {pendingAction.status === 'accepted' ? `Accept this ${label.toLowerCase()} request?`
                  : pendingAction.status === 'rejected' ? `Reject this ${label.toLowerCase()} request?`
                    : pendingAction.status === 'cancelled' ? `Cancel this ${label.toLowerCase()} request?`
                      : `Mark this ${label.toLowerCase()} completed?`}
              </h2>
              <button type="button" disabled={Boolean(updatingId)} aria-label="Close dialog" onClick={() => setPendingAction(null)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-50">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-500">This will update the request for “{pendingAction.request.book.title}”.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" disabled={Boolean(updatingId)} onClick={() => setPendingAction(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                Keep request
              </button>
              <button type="button" disabled={Boolean(updatingId)} onClick={() => void updateRequest()} className="inline-flex items-center gap-2 rounded-xl bg-campus-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-campus-700 disabled:opacity-50">
                {updatingId && <LoaderCircle className="h-4 w-4 animate-spin" />}
                Confirm
              </button>
            </div>
        </MotionDialog>
      )}
    </main>
  );
}
