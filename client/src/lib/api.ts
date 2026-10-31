import { AuthResponse, University, User } from '@/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Universal fetch wrapper ensuring httpOnly cookies are included
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
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
        `Unable to connect to CampusBook server at ${API_BASE_URL}. Please verify the backend is running on http://localhost:5000.`
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

