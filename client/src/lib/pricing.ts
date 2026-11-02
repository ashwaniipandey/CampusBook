import { Book } from '@/types';

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPrice(value: number | string): string {
  if (typeof value === 'string' && !value.trim()) return '—';
  const amount = Number(value);
  return Number.isFinite(amount) ? inrFormatter.format(amount) : '—';
}

export function getBookPrice(book: Pick<Book, 'listingType' | 'sellingPrice' | 'price'>): number {
  const sellingPrice = Number(book.sellingPrice || 0);
  if (sellingPrice > 0) return sellingPrice;

  return ['sell', 'sale'].includes(String(book.listingType))
    ? Number(book.price || 0)
    : 0;
}
