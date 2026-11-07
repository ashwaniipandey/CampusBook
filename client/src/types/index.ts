export interface University {
  _id: string;
  name: string;
  code: string;
  domain: string;
  city: string;
  state?: string;
  country: string;
  campuses?: string[];
  isActive?: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  university: University | string | null;
  studentId?: string;
  department?: string;
  course?: string;
  semester?: string;
  yearOfStudy?: number;
  phone?: string;
  state?: string;
  city?: string;
  emailVerified?: boolean;
  isProfileComplete?: boolean;
  avatar?: string;
  bio?: string;
  rating?: number;
  totalRatings?: number;
  isVerified: boolean;
  verificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
  verificationMethod?: 'college_email' | 'id_card' | '';
  collegeEmail?: string;
  idCardImage?: string;
  verificationNote?: string;
  status: 'active' | 'suspended' | 'pending';
  isBlocked?: boolean;
  lastSeen?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VerificationStatus {
  status: 'unverified' | 'pending' | 'verified' | 'rejected';
  method?: User['verificationMethod'];
  collegeEmail?: string;
  idCardImage?: string;
  note?: string;
  isVerified: boolean;
}

export interface AuthResponse {
  status: 'success' | 'fail' | 'error';
  message?: string;
  token?: string;
  user?: User;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive?: boolean;
}

export interface BookImage {
  url: string;
  public_id?: string;
}

export type BookCondition = 'New' | 'Like New' | 'Good' | 'Fair' | 'Poor';
export type ListingType = 'sell' | 'exchange' | 'donate';
export type BookStatus =
  | 'pending'
  | 'available'
  | 'approved'
  | 'reserved'
  | 'sold'
  | 'exchanged'
  | 'donated'
  | 'rejected';

export interface Book {
  _id: string;
  title: string;
  author: string;
  isbn?: string;
  edition?: string;
  publisher?: string;
  publicationYear?: number;
  category: Category | string;
  subject?: string;
  course?: string;
  semester?: string;
  university: University | string;
  seller: User | string;
  condition: BookCondition;
  listingType: ListingType;
  originalPrice: number;
  sellingPrice: number;
  price?: number;
  description: string;
  images: (string | BookImage)[];
  exchangePreferences?: string;
  status: BookStatus;
  views?: number;
  isApproved?: boolean;
  rejectionReason?: string;
  isWishlisted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type OrderStatus = 'placed' | 'confirmed' | 'ready_for_pickup' | 'completed' | 'cancelled';

export interface Order {
  _id: string;
  orderNumber: string;
  buyer: User | string;
  seller: User | string;
  book: Book;
  price: number;
  amount: number;
  status: OrderStatus;
  orderStatus?: OrderStatus;
  meetingLocation?: string;
  pickupLocation?: string;
  notes?: string;
  completedAt?: string;
  cancelledAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';

export interface ExchangeRequest {
  _id: string;
  requester: User | string;
  bookOwner: User | string;
  requestedBook: Book;
  offeredBook: Book;
  status: RequestStatus;
  message?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DonationRequest {
  _id: string;
  requester: User | string;
  donor: User | string;
  book: Book;
  status: RequestStatus;
  message?: string;
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Conversation {
  _id: string;
  participants: User[];
  otherParticipant: User;
  book?: Pick<Book, '_id' | 'title' | 'images'> | null;
  relatedBook?: Pick<Book, '_id' | 'title' | 'images'> | null;
  lastMessage: string;
  lastMessageAt?: string;
  unreadCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatMessage {
  _id: string;
  conversation: string;
  sender: User | string;
  recipient?: User | string;
  text: string;
  content?: string;
  image?: string;
  isRead?: boolean;
  readBy?: string[];
  readAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  _id: string;
  book: Book;
  addedAt?: string;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Review {
  _id: string;
  order: Order | string;
  reviewer: User | string;
  seller: User | string;
  rating: number;
  comment?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Notification {
  _id: string;
  recipient?: string;
  sender?: User | string;
  type: 'order' | 'exchange_request' | 'donation_request' | 'message' | 'review' | 'book_status' | 'wishlist_alert' | 'system';
  title: string;
  message: string;
  link?: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationListResponse {
  status: string;
  notifications: Notification[];
  unreadCount: number;
  total: number;
  page: number;
  totalPages: number;
}

export interface StudentDashboard {
  booksListed: number;
  booksSold: number;
  booksPurchased: number;
  activeExchanges: number;
  donationsMade: number;
  donationsReceived: number;
  totalMoneySaved: number;
  pendingRequests: number;
  unreadMessages: number;
  recentActivity: {
    type: string;
    text: string;
    link: string;
    createdAt: string;
  }[];
  recommended: Book[];
}

export interface SmartRecommendation extends Book {
  score: number;
  reasons: string[];
}

export interface SmartPriceSuggestion {
  min: number;
  max: number;
  suggested: number;
  basedOn: 'similar listings' | 'condition formula';
  sampleSize: number;
}

export interface SmartSavings {
  totalSaved: number;
  purchases: number;
  impact: {
    booksReused: number;
    estimatedCo2SavedKg: number;
    treesSaved: number;
  };
}

export interface ExchangeMatch {
  matchType: 'mutual' | 'one_way';
  yourBook: Book;
  theirBook: Book;
  otherUser: Pick<User, '_id' | 'name' | 'rating' | 'totalRatings'> & {
    university: University | string;
  };
  matchScore: number;
  reason: string;
}

export interface FiltersMeta {
  totalApproved: number;
  categoryCounts: {
    _id: string;
    name: string;
    slug: string;
    icon?: string;
    count: number;
  }[];
  conditionCounts: Record<string, number>;
  listingTypeCounts: Record<string, number>;
  priceRange: {
    minPrice: number;
    maxPrice: number;
  };
}
