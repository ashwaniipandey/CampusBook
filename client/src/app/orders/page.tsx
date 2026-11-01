'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Check,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  MessageSquare,
  Star,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { BookImage, Order, OrderStatus, Review, User } from '@/types';
import { getBookPrice } from '@/lib/pricing';

type OrderRole = 'buying' | 'selling';
type Toast = { message: string; type: 'success' | 'error' };
type ReviewState = { rating: number; comment: string };
type PendingAction = { order: Order; status: 'confirmed' | 'completed' | 'cancelled' };

function getImageUrl(image: string | BookImage) {
  return typeof image === 'string' ? image : image.url;
}

function getUserName(user: User | string | undefined) {
  return typeof user === 'string' ? 'Campus student' : user?.name || 'Campus student';
}

function getReviewOrderId(review: Review) {
  return typeof review.order === 'string' ? review.order : review.order._id;
}

function getStatus(order: Order): OrderStatus {
  return order.status || order.orderStatus || 'placed';
}

const STATUS_STYLES: Record<string, string> = {
  placed: 'border-amber-200 bg-amber-50 text-amber-800',
  confirmed: 'border-blue-200 bg-blue-50 text-blue-800',
  completed: 'border-campus-200 bg-campus-50 text-campus-800',
  cancelled: 'border-rose-200 bg-rose-50 text-rose-800',
  ready_for_pickup: 'border-indigo-200 bg-indigo-50 text-indigo-800',
};

const STATUS_LABELS: Record<string, string> = {
  ready_for_pickup: 'Ready for pickup',
};

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeRole, setActiveRole] = useState<OrderRole>('buying');
  const [buyingOrders, setBuyingOrders] = useState<Order[]>([]);
  const [sellingOrders, setSellingOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Record<string, ReviewState>>({});
  const [reviewForms, setReviewForms] = useState<Record<string, ReviewState>>({});
  const [submittingReviewId, setSubmittingReviewId] = useState<string | null>(null);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  const loadOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const [buyingResponse, sellingResponse] = await Promise.all([
        api.getOrders({ role: 'buying' }),
        api.getOrders({ role: 'selling' }),
      ]);
      const buying = buyingResponse.orders || [];
      setBuyingOrders(buying);
      setSellingOrders(sellingResponse.orders || []);

      const completed = buying.filter((order) => getStatus(order) === 'completed');
      const sellerIds = Array.from(new Set(completed.map((order) => (
        typeof order.seller === 'string' ? order.seller : order.seller._id
      ))));
      try {
        const reviewResponses = await Promise.all(
          sellerIds.map((sellerId) => api.getSellerReviews(sellerId))
        );
        const existingReviews: Record<string, ReviewState> = {};
        reviewResponses.forEach((response) => {
          (response.reviews || []).forEach((review) => {
            const orderId = getReviewOrderId(review);
            if (completed.some((order) => order._id === orderId)) {
              existingReviews[orderId] = {
                rating: review.rating,
                comment: review.comment || '',
              };
            }
          });
        });
        setReviews((previous) => ({ ...existingReviews, ...previous }));
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Unable to load previous reviews.', 'error');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load your orders.';
      setErrorMessage(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    if (!authLoading && !user) {
      const returnUrl = `${window.location.pathname}${window.location.search}`;
      router.replace(`/login?redirect=${encodeURIComponent(returnUrl)}`);
    } else if (user) {
      void loadOrders();
    }
  }, [authLoading, user, router, loadOrders]);

  const updateOrder = async () => {
    if (!pendingAction) return;
    const { order, status } = pendingAction;
    setUpdatingOrderId(order._id);
    try {
      const response = await api.updateOrderStatus(order._id, status);
      const updatedOrder = response.order;
      const updateList = (orders: Order[]) => orders.map((item) => (
        item._id === order._id
          ? { ...item, ...updatedOrder, status: updatedOrder.status || status, orderStatus: updatedOrder.orderStatus || status }
          : item
      ));
      setBuyingOrders(updateList);
      setSellingOrders(updateList);
      setPendingAction(null);
      showToast(response.message || 'Order status updated.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to update this order.', 'error');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const submitReview = async (event: FormEvent<HTMLFormElement>, order: Order) => {
    event.preventDefault();
    const form = reviewForms[order._id] || { rating: 5, comment: '' };
    setSubmittingReviewId(order._id);
    try {
      const response = await api.createReview({
        orderId: order._id,
        rating: form.rating,
        comment: form.comment.trim(),
      });
      setReviews((previous) => ({
        ...previous,
        [order._id]: { rating: response.review.rating, comment: response.review.comment || '' },
      }));
      showToast(response.message || 'Review submitted successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to submit your review.';
      if (/already (submitted|reviewed)|already reviewed/i.test(message)) {
        setReviews((previous) => ({ ...previous, [order._id]: form }));
      }
      showToast(message, 'error');
    } finally {
      setSubmittingReviewId(null);
    }
  };

  if (authLoading || !user || loading) {
    return (
      <main className="min-h-[65vh] bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
          <div className="mb-6 h-12 animate-pulse rounded-xl bg-slate-200" />
          <div className="space-y-4">
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex animate-pulse gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="h-28 w-28 shrink-0 rounded-xl bg-slate-200" />
                <div className="flex-1 space-y-3 py-2">
                  <div className="h-4 w-3/4 rounded bg-slate-200" />
                  <div className="h-3 w-1/2 rounded bg-slate-200" />
                  <div className="h-3 w-1/3 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  const displayedOrders = activeRole === 'buying' ? buyingOrders : sellingOrders;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      {toast && (
        <div
          role="status"
          className={`fixed right-4 top-20 z-[70] flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${
            toast.type === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-800'
              : 'border-campus-200 bg-campus-50 text-campus-800'
          }`}
        >
          <span>{toast.message}</span>
          <button type="button" aria-label="Dismiss notification" onClick={() => setToast(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-campus-700">Your marketplace activity</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Orders</h1>
        </div>

        <div role="tablist" aria-label="Order type" className="mb-6 grid grid-cols-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {([
            ['buying', 'Buying', buyingOrders.length],
            ['selling', 'Selling', sellingOrders.length],
          ] as const).map(([role, label, count]) => (
            <button
              key={role}
              type="button"
              role="tab"
              aria-selected={activeRole === role}
              onClick={() => setActiveRole(role)}
              className={`rounded-lg px-4 py-2.5 text-sm font-bold transition ${
                activeRole === role ? 'bg-campus-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {label} <span className="ml-1 opacity-80">({count})</span>
            </button>
          ))}
        </div>

        {errorMessage ? (
          <section className="rounded-3xl border border-rose-200 bg-white px-6 py-14 text-center shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Unable to load orders</h2>
            <p className="mt-2 text-sm text-slate-600">{errorMessage}</p>
            <button type="button" onClick={() => void loadOrders()} className="mt-6 rounded-xl bg-campus-600 px-5 py-3 text-sm font-bold text-white hover:bg-campus-700">
              Try again
            </button>
          </section>
        ) : displayedOrders.length === 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-campus-50 text-campus-600">
              <BookOpen className="h-8 w-8" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-slate-900">No orders yet</h2>
            <p className="mt-2 text-sm text-slate-500">
              {activeRole === 'buying' ? 'Explore the marketplace to find books for your courses.' : 'Your book sales and order requests will appear here.'}
            </p>
            {activeRole === 'buying' && (
              <Link href="/explore" className="mt-6 inline-flex rounded-xl bg-campus-600 px-5 py-3 text-sm font-bold text-white hover:bg-campus-700">
                Explore books
              </Link>
            )}
          </section>
        ) : (
          <div className="space-y-5">
            {displayedOrders.map((order) => {
              const status = getStatus(order);
              const book = order.book;
              const image = book?.images?.[0];
              const bookHref = book?._id ? `/books/${book._id}` : '/explore';
              const storedPrice = Number(order.price || order.amount || 0);
              const price = storedPrice > 0 ? storedPrice : getBookPrice(book);
              const otherParty = activeRole === 'buying' ? order.seller : order.buyer;
              const review = reviews[order._id];
              const reviewForm = reviewForms[order._id] || { rating: 5, comment: '' };
              const canConfirm = activeRole === 'selling' && status === 'placed';
              const canBuyerCancel = activeRole === 'buying' && status === 'placed';
              const canSellerCancel = activeRole === 'selling' && (status === 'placed' || status === 'confirmed');
              const canComplete = status === 'confirmed';

              return (
                <article key={order._id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-bold text-slate-700">{order.orderNumber || 'Order'}</span>
                      {order.createdAt && <span>· {new Date(order.createdAt).toLocaleDateString()}</span>}
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${STATUS_STYLES[status] || 'border-slate-200 bg-slate-100 text-slate-700'}`}>
                      {STATUS_LABELS[status] || status.replaceAll('_', ' ')}
                    </span>
                  </div>

                  <div className="grid gap-5 p-4 sm:grid-cols-[112px_1fr_auto] sm:p-5">
                    <Link href={bookHref} className="block h-44 overflow-hidden rounded-xl bg-slate-100 sm:h-28 sm:w-28">
                      {image ? (
                        <img src={getImageUrl(image)} alt={book.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-300"><BookOpen className="h-10 w-10" /></div>
                      )}
                    </Link>

                    <div className="min-w-0 space-y-2">
                      <Link href={bookHref} className="line-clamp-2 font-bold leading-snug text-slate-900 hover:text-campus-700">
                        {book?.title || 'Book listing unavailable'}
                      </Link>
                      {book?.author && <p className="text-sm text-slate-500">By {book.author}</p>}
                      <p className="text-sm text-slate-600">
                        {activeRole === 'buying' ? 'Seller' : 'Buyer'}: <span className="font-semibold text-slate-800">{getUserName(otherParty)}</span>
                      </p>
                      <p className="flex items-start gap-1.5 text-sm text-slate-600">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-campus-600" />
                        {order.meetingLocation || order.pickupLocation || 'Meeting location not set'}
                      </p>
                      {order.notes && (
                        <p className="flex items-start gap-1.5 text-sm text-slate-500">
                          <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" />
                          {order.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-3 sm:flex-col sm:items-end">
                      <p className="text-lg font-extrabold text-slate-900">
                        {book?.listingType === 'donate' ? 'Free' : `$${price.toFixed(2)}`}
                      </p>
                      <Link href={bookHref} className="text-xs font-bold text-campus-700 hover:text-campus-900">
                        View book
                      </Link>
                    </div>
                  </div>

                  {(canConfirm || canBuyerCancel || canSellerCancel || canComplete) && (
                    <div className="flex flex-wrap gap-2 border-t border-slate-100 px-4 py-4 sm:px-5">
                      {canConfirm && (
                        <button type="button" disabled={updatingOrderId === order._id} onClick={() => setPendingAction({ order, status: 'confirmed' })} className="rounded-xl bg-campus-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-campus-700 disabled:opacity-50">
                          Confirm
                        </button>
                      )}
                      {canComplete && (
                        <button type="button" disabled={updatingOrderId === order._id} onClick={() => setPendingAction({ order, status: 'completed' })} className="inline-flex items-center gap-2 rounded-xl bg-campus-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-campus-700 disabled:opacity-50">
                          <CheckCircle2 className="h-4 w-4" /> Mark Completed
                        </button>
                      )}
                      {(canBuyerCancel || canSellerCancel) && (
                        <button type="button" disabled={updatingOrderId === order._id} onClick={() => setPendingAction({ order, status: 'cancelled' })} className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50">
                          Cancel
                        </button>
                      )}
                    </div>
                  )}

                  {activeRole === 'buying' && status === 'completed' && (
                    <div className="border-t border-slate-100 px-4 py-4 sm:px-5">
                      {review ? (
                        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-campus-800">
                          <Check className="h-4 w-4" /> Reviewed
                          <span className="flex items-center gap-0.5 text-amber-500" aria-label={`${review.rating} out of 5 stars`}>
                            {Array.from({ length: 5 }, (_, index) => (
                              <Star key={index} className={`h-4 w-4 ${index < review.rating ? 'fill-current' : 'text-slate-300'}`} />
                            ))}
                          </span>
                        </div>
                      ) : (
                        <form onSubmit={(event) => void submitReview(event, order)} className="space-y-3">
                          <h3 className="text-sm font-bold text-slate-900">Leave a review</h3>
                          <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
                            {Array.from({ length: 5 }, (_, index) => {
                              const rating = index + 1;
                              return (
                                <button
                                  key={rating}
                                  type="button"
                                  role="radio"
                                  aria-checked={reviewForm.rating === rating}
                                  aria-label={`${rating} star${rating === 1 ? '' : 's'}`}
                                  onClick={() => setReviewForms((previous) => ({ ...previous, [order._id]: { ...reviewForm, rating } }))}
                                  className="rounded p-0.5 text-amber-500 hover:scale-110"
                                >
                                  <Star className={`h-6 w-6 ${rating <= reviewForm.rating ? 'fill-current' : 'text-slate-300'}`} />
                                </button>
                              );
                            })}
                          </div>
                          <textarea
                            value={reviewForm.comment}
                            onChange={(event) => setReviewForms((previous) => ({ ...previous, [order._id]: { ...reviewForm, comment: event.target.value } }))}
                            maxLength={1000}
                            rows={3}
                            placeholder="Share your experience (optional)"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-campus-500 focus:ring-2 focus:ring-campus-100"
                          />
                          <button type="submit" disabled={submittingReviewId === order._id} className="inline-flex items-center gap-2 rounded-xl bg-campus-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-campus-700 disabled:opacity-50">
                            {submittingReviewId === order._id && <LoaderCircle className="h-4 w-4 animate-spin" />}
                            Submit review
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {pendingAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && updatingOrderId !== pendingAction.order._id) setPendingAction(null);
        }}>
          <section role="dialog" aria-modal="true" aria-labelledby="order-action-title" className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <h2 id="order-action-title" className="text-lg font-extrabold text-slate-900">
              {pendingAction.status === 'confirmed' ? 'Confirm this order?' : pendingAction.status === 'completed' ? 'Mark this order completed?' : 'Cancel this order?'}
            </h2>
            <p className="mt-2 text-sm leading-5 text-slate-600">
              {pendingAction.status === 'cancelled'
                ? 'This will cancel the order. The other party will be notified.'
                : pendingAction.status === 'completed'
                  ? 'Confirm that the handoff is complete.'
                  : 'Confirm that you can fulfill this order.'}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" disabled={updatingOrderId === pendingAction.order._id} onClick={() => setPendingAction(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                Keep order
              </button>
              <button type="button" disabled={updatingOrderId === pendingAction.order._id} onClick={() => void updateOrder()} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60 ${pendingAction.status === 'cancelled' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-campus-600 hover:bg-campus-700'}`}>
                {updatingOrderId === pendingAction.order._id && <LoaderCircle className="h-4 w-4 animate-spin" />}
                {pendingAction.status === 'confirmed' ? 'Confirm order' : pendingAction.status === 'completed' ? 'Mark completed' : 'Cancel order'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
