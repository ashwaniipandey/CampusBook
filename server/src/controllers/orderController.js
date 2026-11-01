import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Book from '../models/Book.js';
import Cart from '../models/Cart.js';
import Notification from '../models/Notification.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * Helper to populate order references
 */
const populateOrder = (query) => {
  return query
    .populate({
      path: 'book',
      populate: [
        { path: 'category', select: 'name slug icon' },
        { path: 'university', select: 'name code domain city state' },
      ],
    })
    .populate('buyer', 'name email avatar isVerified department phone')
    .populate('seller', 'name email avatar isVerified department phone rating totalRatings');
};

/**
 * Create a new order (single book or checkout from cart)
 * POST /api/orders
 * Access: Private
 */
export const createOrder = async (req, res, next) => {
  try {
    const { bookId, fromCart, meetingLocation, notes } = req.body;

    // A. Checkout entire cart into individual orders
    if (fromCart) {
      const cart = await Cart.findOne({ user: req.user._id }).populate('items.book');
      if (!cart || !cart.items || cart.items.length === 0) {
        return next(new AppError('Your shopping cart is empty', 400));
      }

      const validItems = cart.items.filter((item) => item.book != null);
      if (validItems.length === 0) {
        return next(new AppError('No valid books found in your shopping cart', 400));
      }

      if (validItems.some((item) => item.book.listingType !== 'sell')) {
        return next(
          new AppError('Use the exchange or donation request for this book', 400)
        );
      }

      const createdOrders = [];

      for (const item of validItems) {
        const book = item.book;

        // Check ownership
        if (book.seller.toString() === req.user._id.toString()) {
          continue; // Skip user's own books safely
        }

        // Check availability
        const isApproved =
          ['approved', 'available'].includes(book.status) || book.isApproved === true;
        if (!isApproved || book.status === 'sold') {
          continue; // Skip unavailable books
        }

        // Prevent duplicate active orders
        const existingActiveOrder = await Order.findOne({
          buyer: req.user._id,
          book: book._id,
          status: { $in: ['placed', 'confirmed'] },
        });
        if (existingActiveOrder) {
          continue;
        }

        const price = Number(book.sellingPrice ?? book.price ?? 0);

        const newOrder = await Order.create({
          buyer: req.user._id,
          seller: book.seller,
          book: book._id,
          price,
          amount: price,
          status: 'placed',
          orderStatus: 'placed',
          meetingLocation: meetingLocation || '',
          pickupLocation: meetingLocation || '',
          notes: notes || '',
        });

        // Notify seller
        await Notification.create({
          recipient: book.seller,
          sender: req.user._id,
          type: 'order',
          title: 'New Order Received',
          message: `${req.user.name} placed an order for "${book.title}" ($${price.toFixed(2)}).`,
          link: '/dashboard/orders',
          data: { orderId: newOrder._id, bookId: book._id },
        });

        createdOrders.push(newOrder);
      }

      if (createdOrders.length === 0) {
        return next(
          new AppError(
            'Unable to place orders: books may be sold, unapproved, or already ordered.',
            400
          )
        );
      }

      // Clear cart after checkout
      cart.items = [];
      await cart.save();

      const populatedOrders = await populateOrder(
        Order.find({ _id: { $in: createdOrders.map((o) => o._id) } })
      );

      return res.status(201).json({
        status: 'success',
        message: `Successfully created ${createdOrders.length} order(s)`,
        orders: populatedOrders,
      });
    }

    // B. Direct order for a single book
    if (!bookId) {
      return next(new AppError('Please provide a bookId or set fromCart: true', 400));
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return next(new AppError('Book listing not found', 404));
    }

    if (book.listingType !== 'sell') {
      return next(
        new AppError('Use the exchange or donation request for this book', 400)
      );
    }

    // Rule 1: Cannot buy your own book
    if (book.seller.toString() === req.user._id.toString()) {
      return next(new AppError('You cannot buy your own book', 400));
    }

    // Rule 2: Book must be approved and not sold
    const isApproved =
      ['approved', 'available'].includes(book.status) || book.isApproved === true;
    if (!isApproved || book.status === 'sold') {
      return next(new AppError('This book is not available for purchase', 400));
    }

    // Rule 3: Prevent duplicate active orders by the same buyer for this book
    const existingActiveOrder = await Order.findOne({
      buyer: req.user._id,
      book: book._id,
      status: { $in: ['placed', 'confirmed'] },
    });
    if (existingActiveOrder) {
      return next(
        new AppError('You already have an active order pending for this book', 400)
      );
    }

    // Rule 4: Price taken from the book on the server (never trust client)
    const price = Number(book.sellingPrice ?? book.price ?? 0);

    const order = await Order.create({
      buyer: req.user._id,
      seller: book.seller,
      book: book._id,
      price,
      amount: price,
      status: 'placed',
      orderStatus: 'placed',
      meetingLocation: meetingLocation || '',
      pickupLocation: meetingLocation || '',
      notes: notes || '',
    });

    // Remove book from buyer's cart if it was added
    await Cart.updateOne(
      { user: req.user._id },
      { $pull: { items: { book: book._id } } }
    );

    // Notify seller
    await Notification.create({
      recipient: book.seller,
      sender: req.user._id,
      type: 'order',
      title: 'New Order Received',
      message: `${req.user.name} placed an order for "${book.title}" ($${price.toFixed(2)}).`,
      link: '/dashboard/orders',
      data: { orderId: order._id, bookId: book._id },
    });

    await populateOrder(order);

    res.status(201).json({
      status: 'success',
      message: 'Order placed successfully',
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user's orders (role=buying|selling)
 * GET /api/orders
 * Access: Private
 */
export const getOrders = async (req, res, next) => {
  try {
    const { role, status } = req.query;

    let filter = {};

    if (role === 'selling') {
      filter.seller = req.user._id;
    } else if (role === 'buying') {
      filter.buyer = req.user._id;
    } else {
      // Default: all orders where current user is either buyer or seller
      filter.$or = [{ buyer: req.user._id }, { seller: req.user._id }];
    }

    if (status) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [{ status }, { orderStatus: status }],
      });
    }

    const orders = await populateOrder(Order.find(filter).sort({ createdAt: -1 }));

    res.status(200).json({
      status: 'success',
      results: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update order status with role-based state machine
 * PATCH /api/orders/:id/status
 * Access: Private
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status: newStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid order ID format', 400));
    }

    const order = await Order.findById(id)
      .populate('book')
      .populate('buyer', 'name email avatar isVerified')
      .populate('seller', 'name email avatar isVerified');

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    const isBuyer = order.buyer._id.toString() === req.user._id.toString();
    const isSeller = order.seller._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isBuyer && !isSeller && !isAdmin) {
      return next(
        new AppError('You do not have permission to manage this order', 403)
      );
    }

    const currentStatus = order.status || order.orderStatus || 'placed';

    if (currentStatus === 'completed') {
      return next(new AppError('This order has already been completed and cannot be modified', 400));
    }

    if (currentStatus === 'cancelled') {
      return next(new AppError('This order has already been cancelled and cannot be modified', 400));
    }

    // 1. Seller can confirm
    if (newStatus === 'confirmed') {
      if (!isSeller && !isAdmin) {
        return next(new AppError('Only the seller can confirm this order', 403));
      }
      if (currentStatus !== 'placed') {
        return next(
          new AppError(`Cannot confirm order currently in '${currentStatus}' status`, 400)
        );
      }

      order.status = 'confirmed';
      order.orderStatus = 'confirmed';
      await order.save();

      // Notify buyer
      await Notification.create({
        recipient: order.buyer._id,
        sender: req.user._id,
        type: 'order',
        title: 'Order Confirmed',
        message: `${order.seller.name} confirmed your order #${order.orderNumber} for "${order.book?.title}". Please coordinate campus meeting.`,
        link: '/dashboard/orders',
        data: { orderId: order._id },
      });
    }

    // 2. Cancellation: Seller can cancel from placed/confirmed; Buyer can cancel while placed
    else if (newStatus === 'cancelled') {
      if (isBuyer && !isSeller && !isAdmin) {
        if (currentStatus !== 'placed') {
          return next(
            new AppError(
              'Buyers can only cancel an order while it is still placed. Please contact the seller.',
              400
            )
          );
        }
      } else if (!isSeller && !isBuyer && !isAdmin) {
        return next(new AppError('You do not have permission to cancel this order', 403));
      }

      order.status = 'cancelled';
      order.orderStatus = 'cancelled';
      order.cancelledAt = new Date();
      await order.save();

      // Ensure book stays available
      if (order.book) {
        await Book.findByIdAndUpdate(order.book._id, { status: 'approved' });
      }

      // Notify the other party
      const notifyRecipient = isBuyer ? order.seller._id : order.buyer._id;
      const cancelledByName = isBuyer ? 'The buyer' : 'The seller';

      await Notification.create({
        recipient: notifyRecipient,
        sender: req.user._id,
        type: 'order',
        title: 'Order Cancelled',
        message: `${cancelledByName} cancelled order #${order.orderNumber} for "${order.book?.title}".`,
        link: '/dashboard/orders',
        data: { orderId: order._id },
      });
    }

    // 3. Completion: Seller or Buyer can mark completed once confirmed
    else if (newStatus === 'completed') {
      if (currentStatus !== 'confirmed') {
        return next(
          new AppError('Order must be confirmed before it can be marked as completed', 400)
        );
      }

      order.status = 'completed';
      order.orderStatus = 'completed';
      order.completedAt = new Date();
      await order.save();

      // When order is completed, mark the book as "sold"
      if (order.book) {
        await Book.findByIdAndUpdate(order.book._id, { status: 'sold' });
      }

      // Notify the other party
      const notifyRecipient = isBuyer ? order.seller._id : order.buyer._id;
      const completedByName = isBuyer ? order.buyer.name : order.seller.name;

      await Notification.create({
        recipient: notifyRecipient,
        sender: req.user._id,
        type: 'order',
        title: 'Order Completed',
        message: `${completedByName} marked order #${order.orderNumber} for "${order.book?.title}" as completed. Please leave a review!`,
        link: '/dashboard/orders',
        data: { orderId: order._id },
      });
    } else {
      return next(new AppError(`Invalid status transition to '${newStatus}'`, 400));
    }

    await populateOrder(order);

    res.status(200).json({
      status: 'success',
      message: `Order status updated to ${newStatus}`,
      order,
    });
  } catch (error) {
    next(error);
  }
};
