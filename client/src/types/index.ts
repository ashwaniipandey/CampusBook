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

