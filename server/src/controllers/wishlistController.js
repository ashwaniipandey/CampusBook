import mongoose from 'mongoose';
import Wishlist from '../models/Wishlist.js';
import Book from '../models/Book.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * Get current user's wishlist with populated book details
 * GET /api/wishlist
 * Access: Private
 */
export const getWishlist = async (req, res, next) => {
  try {
    const items = await Wishlist.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'book',
        populate: [
          { path: 'category', select: 'name slug icon' },
          { path: 'university', select: 'name code domain city state' },
          { path: 'seller', select: 'name avatar isVerified department yearOfStudy rating' },
        ],
      });

    // Filter out items where the book was deleted from the database
    const validItems = items.filter((item) => item.book != null);
    const books = validItems.map((item) => item.book);

    res.status(200).json({
      status: 'success',
      results: validItems.length,
      wishlist: validItems,
      books,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a book to user's wishlist (no duplicates)
 * POST /api/wishlist/:bookId
 * Access: Private
 */
export const addToWishlist = async (req, res, next) => {
  try {
    const { bookId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return next(new AppError('Invalid book ID format', 400));
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return next(new AppError('Book listing not found', 404));
    }

    // Check if already in wishlist
    const existing = await Wishlist.findOne({
      user: req.user._id,
      book: bookId,
    });

    if (existing) {
      return next(new AppError('Book is already in your wishlist', 400));
    }

    const item = await Wishlist.create({
      user: req.user._id,
      book: bookId,
    });

    await item.populate({
      path: 'book',
      populate: [
        { path: 'category', select: 'name slug icon' },
        { path: 'university', select: 'name code domain city state' },
        { path: 'seller', select: 'name avatar isVerified department yearOfStudy rating' },
      ],
    });

    res.status(201).json({
      status: 'success',
      message: 'Book added to wishlist',
      item,
      book: item.book,
    });
  } catch (error) {
    // Handle duplicate key error from Mongo unique compound index safely
    if (error.code === 11000) {
      return next(new AppError('Book is already in your wishlist', 400));
    }
    next(error);
  }
};

/**
 * Remove a book from user's wishlist
 * DELETE /api/wishlist/:bookId
 * Access: Private
 */
export const removeFromWishlist = async (req, res, next) => {
  try {
    const { bookId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return next(new AppError('Invalid book ID format', 400));
    }

    const deleted = await Wishlist.findOneAndDelete({
      user: req.user._id,
      book: bookId,
    });

    if (!deleted) {
      return next(new AppError('Book not found in your wishlist', 404));
    }

    res.status(200).json({
      status: 'success',
      message: 'Book removed from wishlist',
      bookId,
    });
  } catch (error) {
    next(error);
  }
};

