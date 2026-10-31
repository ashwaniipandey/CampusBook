import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import Book from '../models/Book.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * Helper to populate cart items with book details
 */
const populateCart = (query) => {
  return query.populate({
    path: 'items.book',
    populate: [
      { path: 'category', select: 'name slug icon' },
      { path: 'university', select: 'name code domain city state' },
      { path: 'seller', select: 'name avatar isVerified department yearOfStudy rating' },
    ],
  });
};

/**
 * Get current user's shopping cart
 * GET /api/cart
 * Access: Private
 */
export const getCart = async (req, res, next) => {
  try {
    let cart = await populateCart(Cart.findOne({ user: req.user._id }));

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Filter out items where the book was deleted from the database
    const validItems = cart.items.filter((item) => item.book != null);
    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    const books = validItems.map((item) => item.book);
    const totalAmount = validItems.reduce((acc, item) => {
      const bookPrice = Number(item.book.sellingPrice ?? item.book.price ?? 0);
      return acc + bookPrice;
    }, 0);

    res.status(200).json({
      status: 'success',
      cart,
      items: validItems,
      books,
      totalItems: validItems.length,
      totalAmount: Math.round(totalAmount * 100) / 100,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a book to the shopping cart
 * POST /api/cart/:bookId
 * Access: Private
 */
export const addToCart = async (req, res, next) => {
  try {
    const { bookId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return next(new AppError('Invalid book ID format', 400));
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return next(new AppError('Book listing not found', 404));
    }

    // Rule 1: Cannot add your own book
    if (book.seller.toString() === req.user._id.toString()) {
      return next(new AppError('You cannot add your own book to the cart', 400));
    }

    // Rule 2: Only approved books that are not sold
    const isApproved =
      ['approved', 'available'].includes(book.status) || book.isApproved === true;
    if (!isApproved || book.status === 'sold') {
      return next(new AppError('This book is not available for purchase', 400));
    }

    // Rule 3: Only books with listingType 'sell'
    if (book.listingType !== 'sell' && book.listingType !== 'sale') {
      return next(new AppError('Only books listed for sale can be added to the cart', 400));
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Rule 4: No duplicates in cart
    const isAlreadyInCart = cart.items.some(
      (item) => item.book.toString() === bookId
    );
    if (isAlreadyInCart) {
      return next(new AppError('Book is already in your cart', 400));
    }

    cart.items.push({ book: bookId });
    await cart.save();

    await populateCart(cart);

    const validItems = cart.items.filter((item) => item.book != null);
    const books = validItems.map((item) => item.book);
    const totalAmount = validItems.reduce((acc, item) => {
      const bookPrice = Number(item.book.sellingPrice ?? item.book.price ?? 0);
      return acc + bookPrice;
    }, 0);

    res.status(200).json({
      status: 'success',
      message: 'Book added to cart',
      cart,
      items: validItems,
      books,
      totalItems: validItems.length,
      totalAmount: Math.round(totalAmount * 100) / 100,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a specific book from the shopping cart
 * DELETE /api/cart/:bookId
 * Access: Private
 */
export const removeFromCart = async (req, res, next) => {
  try {
    const { bookId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return next(new AppError('Invalid book ID format', 400));
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter((item) => item.book.toString() !== bookId);

    if (cart.items.length === initialLength) {
      return next(new AppError('Book not found in cart', 404));
    }

    await cart.save();
    await populateCart(cart);

    const validItems = cart.items.filter((item) => item.book != null);
    const books = validItems.map((item) => item.book);
    const totalAmount = validItems.reduce((acc, item) => {
      const bookPrice = Number(item.book.sellingPrice ?? item.book.price ?? 0);
      return acc + bookPrice;
    }, 0);

    res.status(200).json({
      status: 'success',
      message: 'Book removed from cart',
      cart,
      items: validItems,
      books,
      totalItems: validItems.length,
      totalAmount: Math.round(totalAmount * 100) / 100,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear all items from the shopping cart
 * DELETE /api/cart
 * Access: Private
 */
export const clearCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    } else {
      cart.items = [];
      await cart.save();
    }

    res.status(200).json({
      status: 'success',
      message: 'Cart cleared successfully',
      cart,
      items: [],
      books: [],
      totalItems: 0,
      totalAmount: 0,
    });
  } catch (error) {
    next(error);
  }
};

