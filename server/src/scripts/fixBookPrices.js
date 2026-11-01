import dotenv from 'dotenv';
import connectDB, { disconnectDB } from '../config/db.js';
import Book from '../models/Book.js';
import Order from '../models/Order.js';

dotenv.config();

const randomOriginalPrice = () => (30 + Math.floor(Math.random() * 121)) * 10;

const getSellingPrice = (originalPrice) => {
  const minimum = Math.ceil((originalPrice * 0.4) / 10) * 10;
  const maximum = Math.floor((originalPrice * 0.75) / 10) * 10;
  const priceInIncrements = Math.floor(
    Math.random() * (maximum / 10 - minimum / 10 + 1)
  ) + minimum / 10;

  return priceInIncrements * 10;
};

const normalizeListingType = (listingType) =>
  String(listingType || '').trim().toLowerCase();

const getListingTypeCounts = async () => {
  const counts = await Book.collection
    .aggregate([
      { $group: { _id: '$listingType', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ])
    .toArray();
  return Object.fromEntries(counts.map(({ _id, count }) => [_id ?? '(missing)', count]));
};

const runMigration = async () => {
  console.log(
    `Book listingType counts before: ${JSON.stringify(await getListingTypeCounts())}`
  );

  const books = await Book.collection
    .find({
      $or: [
        { listingType: { $regex: /^(sale|sell)$/i } },
        { listingType: { $regex: /^(donation|donate|free)$/i } },
        { listingType: { $regex: /^(swap|exchange)$/i } },
        {
          viewsCount: { $exists: true },
          $or: [{ views: { $exists: false } }, { views: null }],
        },
        { status: 'approved', isApproved: { $ne: true } },
      ],
    })
    .toArray();

  const sellBooks = books.filter((book) =>
    ['sale', 'sell'].includes(normalizeListingType(book.listingType))
  );
  const donateBooks = books.filter((book) =>
    ['donation', 'donate', 'free'].includes(normalizeListingType(book.listingType))
  );
  const exchangeBooks = books.filter((book) =>
    ['swap', 'exchange'].includes(normalizeListingType(book.listingType))
  );
  const booksWithLegacyViews = books.filter(
    (book) =>
      book.viewsCount !== undefined &&
      (book.views === undefined || book.views === null)
  );
  const approvedBooks = books.filter(
    (book) => book.status === 'approved' && book.isApproved !== true
  );

  console.log(`Books matched sale/sell rule: ${sellBooks.length}`);
  console.log(`Books matched donation/free rule: ${donateBooks.length}`);
  console.log(`Books matched swap/exchange rule: ${exchangeBooks.length}`);
  console.log(`Books matched viewsCount-to-views rule: ${booksWithLegacyViews.length}`);
  console.log(`Books matched approved-flag rule: ${approvedBooks.length}`);

  const bookOperations = [];
  for (const book of books) {
    const listingType = normalizeListingType(book.listingType);
    const set = {};

    if (['sale', 'sell'].includes(listingType)) {
      let originalPrice = Number(book.originalPrice) || 0;
      let sellingPrice = Number(book.sellingPrice) || 0;

      if (sellingPrice <= 0 && Number(book.price) > 0) {
        sellingPrice = Number(book.price);
      }

      if (sellingPrice <= 0) {
        const minimum = Math.ceil((originalPrice * 0.4) / 10) * 10;
        const maximum = Math.floor((originalPrice * 0.75) / 10) * 10;
        if (originalPrice <= 0 || maximum < minimum) {
          originalPrice = randomOriginalPrice();
        }
        sellingPrice = getSellingPrice(originalPrice);
      }

      if (originalPrice <= 0) originalPrice = randomOriginalPrice();
      if (sellingPrice > originalPrice) originalPrice = sellingPrice;

      set.listingType = 'sell';
      set.sellingPrice = sellingPrice;
      set.price = sellingPrice;
      if (Number(book.originalPrice) !== originalPrice) set.originalPrice = originalPrice;
    } else if (['donation', 'donate', 'free'].includes(listingType)) {
      set.listingType = 'donate';
      set.sellingPrice = 0;
      set.price = 0;
    } else if (['swap', 'exchange'].includes(listingType)) {
      set.listingType = 'exchange';
      set.sellingPrice = 0;
      set.price = 0;
    }

    if (
      book.viewsCount !== undefined &&
      (book.views === undefined || book.views === null)
    ) {
      set.views = book.viewsCount;
    }
    if (book.status === 'approved' && book.isApproved !== true) {
      set.isApproved = true;
    }

    const changed = Object.entries(set).some(
      ([field, value]) => book[field] !== value
    );
    if (changed) {
      bookOperations.push({
        updateOne: {
          filter: { _id: book._id },
          update: { $set: set },
        },
      });
    }
  }

  const bookResult = bookOperations.length
    ? await Book.collection.bulkWrite(bookOperations)
    : { modifiedCount: 0 };
  console.log(`Books modified: ${bookResult.modifiedCount}`);

  const orders = await Order.collection
    .find({
      $or: [
        { price: 0 },
        { price: null },
        { price: { $exists: false } },
      ],
    })
    .toArray();
  const candidateBookIds = orders.map((order) => order.book).filter(Boolean);
  const sellBooksById = new Map(
    (
      await Book.collection
        .find({ _id: { $in: candidateBookIds }, listingType: 'sell' })
        .project({ sellingPrice: 1 })
        .toArray()
    ).map((book) => [book._id.toString(), Number(book.sellingPrice) || 0])
  );
  const orderOperations = orders
    .filter((order) => sellBooksById.get(order.book?.toString()) > 0)
    .map((order) => {
      const sellingPrice = sellBooksById.get(order.book.toString());
      return {
        updateOne: {
          filter: {
            _id: order._id,
            $or: [{ price: 0 }, { price: null }, { price: { $exists: false } }],
          },
          update: { $set: { price: sellingPrice, amount: sellingPrice } },
        },
      };
    });

  const orderResult = orderOperations.length
    ? await Order.collection.bulkWrite(orderOperations)
    : { modifiedCount: 0 };
  console.log(`Orders matched zero/missing price for sell books: ${orderOperations.length}`);
  console.log(`Orders updated: ${orderResult.modifiedCount}`);
  console.log(`Book listingType counts after: ${JSON.stringify(await getListingTypeCounts())}`);
};

const run = async () => {
  try {
    await connectDB();
    await runMigration();
  } catch (error) {
    console.error(`Book price migration failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
};

await run();
