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
  university: University | string;
  studentId?: string;
  department?: string;
  yearOfStudy?: number;
  phone?: string;
  avatar?: string;
  bio?: string;
  rating?: number;
  totalRatings?: number;
  isVerified: boolean;
  status: 'active' | 'suspended' | 'pending';
  createdAt?: string;
  updatedAt?: string;
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
  viewsCount?: number;
  isApproved?: boolean;
  createdAt?: string;
  updatedAt?: string;
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
