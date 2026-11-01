export const isApprovedBook = (book) =>
  Boolean(
    book &&
      book.status !== 'sold' &&
      (['approved', 'available'].includes(book.status) || book.isApproved === true)
  );
