import { Book } from '@/types';

export function getBookPrice(book: Pick<Book, 'listingType' | 'sellingPrice' | 'price'>): number {
  const sellingPrice = Number(book.sellingPrice || 0);
  if (sellingPrice > 0) return sellingPrice;

  return book.listingType === 'sell' ? Number(book.price || 0) : 0;
}
