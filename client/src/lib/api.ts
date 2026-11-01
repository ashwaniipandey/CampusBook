import {
  AuthResponse,
  University,
  User,
  Category,
  Book,
  FiltersMeta,
  Order,
  Cart,
  CartItem,
  Review,
  OrderStatus,
  ExchangeRequest,
  DonationRequest,
  RequestStatus,
  Conversation,
  ChatMessage,
} from '@/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

/**
 * Universal fetch wrapper ensuring httpOnly cookies are included
 * Handles JSON and FormData payloads transparently
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...((options.headers as Record<string, string>) || {}),
  };

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Crucial for cross-origin httpOnly cookies
  };

  try {
    const response = await fetch(url, config);
    let data: any;

    try {
      data = await response.json();
    } catch {
      data = { message: response.statusText || 'Server returned an invalid response' };
    }

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data as T;
  } catch (error: any) {
    if (
      error.name === 'TypeError' &&
      (error.message.toLowerCase().includes('failed to fetch') ||
        error.message.toLowerCase().includes('networkerror') ||
        error.message.toLowerCase().includes('load failed'))
    ) {
      throw new Error(
        `Unable to connect to CampusBook server at ${API_BASE_URL}. Please verify the backend is running on http://localhost:5001.`
      );
    }
    throw error;
  }
}

export const api = {
  // Authentication
  login: (data: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: {
    name: string;
    email: string;
    password: string;
    universityId: string;
    department?: string;
    yearOfStudy?: number;
    studentId?: string;
    phone?: string;
  }) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  verifyOtp: (data: { email?: string; otp: string }) =>
    request<AuthResponse>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resendOtp: (data: { email?: string }) =>
    request<{ status: string; message: string }>('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () =>
    request<{ status: string; message: string }>('/auth/logout', {
      method: 'POST',
    }),

  getMe: () =>
    request<{ status: string; user: User }>('/auth/me', {
      method: 'GET',
    }),

  updateProfile: (data: Partial<User>) =>
    request<{ status: string; message: string; user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<AuthResponse>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  forgotPassword: (data: { email: string }) =>
    request<{ status: string; message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resetPassword: (data: { email: string; otp: string; newPassword: string }) =>
    request<AuthResponse>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Universities
  getUniversities: () =>
    request<{ status: string; results: number; universities: University[] }>(
      '/universities',
      {
        method: 'GET',
      }
    ),

  // Categories
  getCategories: () =>
    request<{ status: string; results: number; categories: Category[] }>(
      '/categories',
      {
        method: 'GET',
      }
    ),

  // Books
  getBooks: (params: Record<string, string | number | undefined> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
    const queryString = query.toString();
    return request<{
      status: string;
      books: Book[];
      total: number;
      page: number;
      totalPages: number;
    }>(`/books${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  getFiltersMeta: () =>
    request<{
      status: string;
      totalApproved: number;
      categoryCounts: { _id: string; name: string; slug: string; icon?: string; count: number }[];
      conditionCounts: Record<string, number>;
      listingTypeCounts: Record<string, number>;
      priceRange: { minPrice: number; maxPrice: number };
    }>('/books/filters-meta', {
      method: 'GET',
    }),

  createBook: (formData: FormData) =>
    request<{ status: string; message: string; book: Book }>('/books', {
      method: 'POST',
      body: formData,
    }),

  updateBook: (id: string, formData: FormData) =>
    request<{ status: string; message: string; book: Book }>(`/books/${id}`, {
      method: 'PUT',
      body: formData,
    }),

  getMyBooks: () =>
    request<{ status: string; results: number; books: Book[] }>('/books/my', {
      method: 'GET',
    }),

  getBookById: (id: string) =>
    request<{ status: string; book: Book; isWishlisted?: boolean }>(`/books/${id}`, {
      method: 'GET',
    }),

  getSimilarBooks: (id: string) =>
    request<{ status: string; results: number; books: Book[] }>(`/books/${id}/similar`, {
      method: 'GET',
    }),

  deleteBook: (id: string) =>
    request<{ status: string; message: string }>(`/books/${id}`, {
      method: 'DELETE',
    }),

  markBookSold: (id: string) =>
    request<{ status: string; message: string; book: Book }>(`/books/${id}/mark-sold`, {
      method: 'PATCH',
    }),

  // Wishlist
  getWishlist: () =>
    request<{ status: string; results: number; wishlist: any[]; books: Book[] }>('/wishlist', {
      method: 'GET',
    }),

  addToWishlist: (bookId: string) =>
    request<{ status: string; message: string; book: Book }>(`/wishlist/${bookId}`, {
      method: 'POST',
    }),

  removeFromWishlist: (bookId: string) =>
    request<{ status: string; message: string; bookId: string }>(`/wishlist/${bookId}`, {
      method: 'DELETE',
    }),

  // Cart
  getCart: () =>
    request<{
      status: string;
      cart: Cart;
      items: CartItem[];
      books: Book[];
      totalItems: number;
      totalAmount: number;
    }>('/cart', {
      method: 'GET',
    }),

  addToCart: (bookId: string) =>
    request<{
      status: string;
      message: string;
      cart: Cart;
      items: CartItem[];
      books: Book[];
      totalItems: number;
      totalAmount: number;
    }>(`/cart/${bookId}`, {
      method: 'POST',
    }),

  removeFromCart: (bookId: string) =>
    request<{
      status: string;
      message: string;
      cart: Cart;
      items: CartItem[];
      books: Book[];
      totalItems: number;
      totalAmount: number;
    }>(`/cart/${bookId}`, {
      method: 'DELETE',
    }),

  clearCart: () =>
    request<{
      status: string;
      message: string;
      cart: Cart;
      items: CartItem[];
      books: Book[];
      totalItems: number;
      totalAmount: number;
    }>('/cart', {
      method: 'DELETE',
    }),

  // Orders
  getOrders: (params: { role?: 'buying' | 'selling'; status?: OrderStatus } = {}) => {
    const query = new URLSearchParams();
    if (params.role) query.append('role', params.role);
    if (params.status) query.append('status', params.status);
    const queryString = query.toString();
    return request<{ status: string; results: number; orders: Order[] }>(
      `/orders${queryString ? `?${queryString}` : ''}`,
      {
        method: 'GET',
      }
    );
  },

  createOrder: (data: {
    bookId?: string;
    fromCart?: boolean;
    meetingLocation?: string;
    notes?: string;
  }) =>
    request<{ status: string; message: string; order?: Order; orders?: Order[] }>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateOrderStatus: (id: string, status: 'confirmed' | 'completed' | 'cancelled') =>
    request<{ status: string; message: string; order: Order }>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Exchange requests
  createExchangeRequest: (data: {
    requestedBookId: string;
    offeredBookId: string;
    message?: string;
  }) =>
    request<{ status: string; message: string; exchangeRequest: ExchangeRequest }>('/exchanges', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getExchangeRequests: (role: 'received' | 'sent') =>
    request<{
      status: string;
      results: number;
      exchangeRequests: ExchangeRequest[];
    }>(`/exchanges?role=${role}`, { method: 'GET' }),

  updateExchangeRequestStatus: (
    id: string,
    status: Extract<RequestStatus, 'accepted' | 'rejected' | 'cancelled' | 'completed'>
  ) =>
    request<{
      status: string;
      message: string;
      exchangeRequest: ExchangeRequest;
    }>(`/exchanges/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Donation requests
  createDonationRequest: (data: { bookId: string; message?: string }) =>
    request<{ status: string; message: string; donationRequest: DonationRequest }>('/donations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getDonationRequests: (role: 'received' | 'sent') =>
    request<{
      status: string;
      results: number;
      donationRequests: DonationRequest[];
    }>(`/donations?role=${role}`, { method: 'GET' }),

  updateDonationRequestStatus: (
    id: string,
    status: Extract<RequestStatus, 'accepted' | 'rejected' | 'cancelled' | 'completed'>
  ) =>
    request<{
      status: string;
      message: string;
      donationRequest: DonationRequest;
    }>(`/donations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Conversations and chat messages
  getConversations: (query = '') => {
    const search = query.trim()
      ? `?q=${encodeURIComponent(query.trim())}`
      : '';
    return request<{
      status: string;
      results: number;
      conversations: Conversation[];
    }>(`/conversations${search}`, { method: 'GET' });
  },

  createConversation: (data: { userId: string; bookId?: string }) =>
    request<{ status: string; conversation: Conversation }>('/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getConversationMessages: (id: string, page = 1, limit = 30) =>
    request<{
      status: string;
      results: number;
      page: number;
      limit: number;
      hasMore: boolean;
      messages: ChatMessage[];
    }>(`/conversations/${id}/messages?page=${page}&limit=${limit}`, {
      method: 'GET',
    }),

  sendConversationMessage: (id: string, text: string) =>
    request<{ status: string; message: string; sentMessage: ChatMessage }>(
      `/conversations/${id}/messages`,
      { method: 'POST', body: JSON.stringify({ text }) }
    ),

  sendConversationImage: (id: string, image: File, text = '') => {
    const formData = new FormData();
    formData.append('image', image);
    if (text.trim()) formData.append('text', text.trim());
    return request<{ status: string; message: string; sentMessage: ChatMessage }>(
      `/conversations/${id}/image`,
      { method: 'POST', body: formData }
    );
  },

  markConversationRead: (id: string) =>
    request<{
      status: string;
      message: string;
      conversationId: string;
      unreadCount: number;
    }>(`/conversations/${id}/read`, { method: 'PATCH' }),

  // Reviews
  createReview: (data: { orderId: string; rating: number; comment?: string }) =>
    request<{ status: string; message: string; review: Review }>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getSellerReviews: (sellerId: string) =>
    request<{
      status: string;
      seller: Partial<User>;
      results: number;
      reviews: Review[];
    }>(`/users/${sellerId}/reviews`, {
      method: 'GET',
    }),

  // Health
  getHealth: () =>
    request<{ status: string; service: string; environment: string; database: string }>(
      '/health',
      {
        method: 'GET',
      }
    ),
};

export default api;
