import express from 'express';
import {
  getAllBooks,
  getFiltersMeta,
  createBook,
  getMyBooks,
  getBookById,
  getSimilarBooks,
  updateBook,
  deleteBook,
  markSold,
} from '../controllers/bookController.js';
import { getBookSuggestions } from '../controllers/searchController.js';
import { protect, optionalAuth } from '../middlewares/auth.js';
import { uploadBookImages } from '../middlewares/upload.js';
import {
  validateCreateBook,
  validateUpdateBook,
} from '../validations/bookValidation.js';

const router = express.Router();

/**
 * @route   GET /api/books
 * @desc    Get all approved books with search, multi-filters, sorting, and pagination
 * @access  Public
 */
router.get('/', optionalAuth, getAllBooks);

/**
 * @route   GET /api/books/suggestions?q=
 * @desc    Get autocomplete suggestions from approved book listings
 * @access  Public
 */
router.get('/suggestions', getBookSuggestions);

/**
 * @route   GET /api/books/my
 * @desc    Get all books listed by current authenticated user
 * @access  Private
 */
router.get('/my', protect, getMyBooks);

/**
 * @route   GET /api/books/filters-meta
 * @desc    Get aggregated filter metadata for marketplace sidebars
 * @access  Public
 */
router.get('/filters-meta', getFiltersMeta);

/**
 * @route   GET /api/books/:id/similar
 * @desc    Get up to 6 similar approved books in same category or subject
 * @access  Public
 */
router.get('/:id/similar', getSimilarBooks);

/**
 * @route   GET /api/books/:id
 * @desc    Get book listing details (public for approved; owner/admin for any status)
 * @access  Public / Optional Auth
 */
router.get('/:id', optionalAuth, getBookById);

/**
 * @route   POST /api/books
 * @desc    Create a new book listing (multipart with up to 5 images)
 * @access  Private
 */
router.post('/', uploadBookImages, protect, validateCreateBook, createBook);

/**
 * @route   PUT /api/books/:id
 * @desc    Update book listing (owner only, can add/remove images)
 * @access  Private
 */
router.put('/:id', uploadBookImages, protect, validateUpdateBook, updateBook);

/**
 * @route   DELETE /api/books/:id
 * @desc    Delete book listing and Cloudinary images (owner or admin)
 * @access  Private
 */
router.delete('/:id', protect, deleteBook);

/**
 * @route   PATCH /api/books/:id/mark-sold
 * @desc    Mark book listing as sold (owner only)
 * @access  Private
 */
router.patch('/:id/mark-sold', protect, markSold);

export default router;
