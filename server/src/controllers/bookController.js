import Book from '../models/Book.js';
import University from '../models/University.js';
import Category from '../models/Category.js';
import { AppError } from '../middlewares/errorHandler.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';

/**
 * Create a new book listing
 * POST /api/books
 * Access: Private (Authenticated user)
 */
export const createBook = async (req, res, next) => {
  try {
    const {
      title,
      author,
      isbn,
      edition,
      publisher,
      publicationYear,
      category,
      subject,
      course,
      semester,
      university,
      condition,
      originalPrice,
      sellingPrice,
      listingType,
      description,
      exchangePreferences,
    } = req.body;

    // Verify category exists
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return next(new AppError('The selected Category does not exist', 400));
    }

    // Determine university
    const targetUniId = university || req.user.university?._id || req.user.university;
    if (!targetUniId) {
      return next(
        new AppError('University is required. Please select your campus.', 400)
      );
    }

    const universityDoc = await University.findById(targetUniId);
    if (!universityDoc) {
      return next(new AppError('The selected University does not exist', 400));
    }

    // Process uploaded images
    const images = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        uploadToCloudinary(file.buffer, 'campusbook/books')
      );
      const uploadedImages = await Promise.all(uploadPromises);
      uploadedImages.forEach((img) => images.push(img));
    }

    // Determine prices based on listing type
    const isDonation = ['donate', 'donation'].includes(listingType);
    const finalSellingPrice = isDonation ? 0 : Number(sellingPrice || 0);
    const finalOriginalPrice = Number(originalPrice || 0);

    const newBook = await Book.create({
      title,
      author,
      isbn: isbn || '',
      edition: edition || '1st Edition',
      publisher: publisher || '',
      publicationYear: publicationYear ? Number(publicationYear) : undefined,
      category: categoryDoc._id,
      subject: subject || '',
      course: course || '',
      semester: semester || '',
      university: universityDoc._id,
      seller: req.user._id,
      condition,
      listingType,
      sellingPrice: finalSellingPrice,
      price: finalSellingPrice,
      originalPrice: finalOriginalPrice,
      description,
      images,
      exchangePreferences: exchangePreferences || '',
      status: 'pending', // Default listing status as specified
      isApproved: false,
    });

    const populatedBook = await Book.findById(newBook._id)
      .populate('seller', 'name email avatar rating isVerified department yearOfStudy')
      .populate('category', 'name slug icon')
      .populate('university', 'name code domain city state');

    res.status(201).json({
      status: 'success',
      message: 'Book listed successfully. It is pending administrator review.',
      book: populatedBook,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user's book listings (all statuses: pending, available, sold, etc.)
 * GET /api/books/my
 * Access: Private (Authenticated user)
 */
export const getMyBooks = async (req, res, next) => {
  try {
    const books = await Book.find({ seller: req.user._id })
      .populate('category', 'name slug icon')
      .populate('university', 'name code domain')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: books.length,
      books,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single book listing by ID
 * GET /api/books/:id
 * Access: Public for approved/available books; Owner or Admin for any status
 */
export const getBookById = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('seller', 'name email avatar rating isVerified department yearOfStudy')
      .populate('category', 'name slug description icon')
      .populate('university', 'name code domain city state campuses');

    if (!book) {
      return next(new AppError('Book listing not found', 404));
    }

    const isPublic =
      book.status === 'approved' || book.status === 'available' || book.isApproved === true;
    const isOwner =
      req.user && book.seller && book.seller._id.toString() === req.user._id.toString();
    const isAdmin = req.user && req.user.role === 'admin';

    // If not public, only owner or admin can view
    if (!isPublic && !isOwner && !isAdmin) {
      return next(
        new AppError(
          'This book listing is pending review or not publicly available.',
          403
        )
      );
    }

    // Atomically increment views count
    await Book.findByIdAndUpdate(req.params.id, { $inc: { viewsCount: 1 } });
    book.viewsCount = (book.viewsCount || 0) + 1;

    res.status(200).json({
      status: 'success',
      book,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing book listing
 * PUT /api/books/:id
 * Access: Private (Owner only)
 */
export const updateBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return next(new AppError('Book listing not found', 404));
    }

    // Owner check
    if (book.seller.toString() !== req.user._id.toString()) {
      return next(
        new AppError('Forbidden: You can only update your own book listings', 403)
      );
    }

    // 1. Handle image removal if requested
    let remainingImages = Array.isArray(book.images) ? [...book.images] : [];
    let removeImages = req.body.removeImages;

    if (removeImages) {
      let idsToRemove = [];
      if (Array.isArray(removeImages)) {
        idsToRemove = removeImages;
      } else if (typeof removeImages === 'string') {
        try {
          idsToRemove = JSON.parse(removeImages);
        } catch {
          idsToRemove = removeImages.split(',').map((s) => s.trim());
        }
      }

      if (Array.isArray(idsToRemove) && idsToRemove.length > 0) {
        for (const item of remainingImages) {
          const itemKey = typeof item === 'object' ? item.public_id || item.url : item;
          if (idsToRemove.includes(itemKey) || (item.url && idsToRemove.includes(item.url))) {
            if (typeof item === 'object' && item.public_id) {
              await deleteFromCloudinary(item.public_id);
            }
          }
        }

        remainingImages = remainingImages.filter((item) => {
          const itemKey = typeof item === 'object' ? item.public_id || item.url : item;
          return !idsToRemove.includes(itemKey) && (!item.url || !idsToRemove.includes(item.url));
        });
      }
    }

    // 2. Handle new image uploads
    if (req.files && req.files.length > 0) {
      const totalImagesCount = remainingImages.length + req.files.length;
      if (totalImagesCount > 5) {
        return next(
          new AppError(
            `Total images cannot exceed 5. Currently have ${remainingImages.length}, attempting to add ${req.files.length}.`,
            400
          )
        );
      }

      const uploadPromises = req.files.map((file) =>
        uploadToCloudinary(file.buffer, 'campusbook/books')
      );
      const newUploaded = await Promise.all(uploadPromises);
      remainingImages.push(...newUploaded);
    }

    book.images = remainingImages;

    // 3. Update text and numeric fields
    const allowedFields = [
      'title',
      'author',
      'isbn',
      'edition',
      'publisher',
      'publicationYear',
      'category',
      'subject',
      'course',
      'semester',
      'condition',
      'listingType',
      'originalPrice',
      'sellingPrice',
      'description',
      'exchangePreferences',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        book[field] = req.body[field];
      }
    });

    // Ensure price sync
    if (['donate', 'donation'].includes(book.listingType)) {
      book.sellingPrice = 0;
      book.price = 0;
    } else if (req.body.sellingPrice !== undefined) {
      book.sellingPrice = Number(req.body.sellingPrice);
      book.price = Number(req.body.sellingPrice);
    }

    await book.save();

    const updatedBook = await Book.findById(book._id)
      .populate('seller', 'name email avatar rating isVerified department yearOfStudy')
      .populate('category', 'name slug icon')
      .populate('university', 'name code domain');

    res.status(200).json({
      status: 'success',
      message: 'Book listing updated successfully',
      book: updatedBook,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a book listing and remove associated Cloudinary images
 * DELETE /api/books/:id
 * Access: Private (Owner or Admin)
 */
export const deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return next(new AppError('Book listing not found', 404));
    }

    // Owner or admin check
    const isOwner = book.seller.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return next(
        new AppError('Forbidden: You do not have permission to delete this listing', 403)
      );
    }

    // Delete all images associated with this book from Cloudinary
    if (Array.isArray(book.images)) {
      const deletePromises = book.images
        .filter((img) => typeof img === 'object' && img.public_id)
        .map((img) => deleteFromCloudinary(img.public_id));
      await Promise.all(deletePromises);
    }

    // Delete record from database
    await Book.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Book listing and associated images deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a book listing as sold
 * PATCH /api/books/:id/mark-sold
 * Access: Private (Owner only)
 */
export const markSold = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return next(new AppError('Book listing not found', 404));
    }

    // Owner check
    if (book.seller.toString() !== req.user._id.toString()) {
      return next(
        new AppError('Forbidden: You can only mark your own book listings as sold', 403)
      );
    }

    book.status = 'sold';
    await book.save();

    res.status(200).json({
      status: 'success',
      message: 'Book marked as sold successfully',
      book,
    });
  } catch (error) {
    next(error);
  }
};

