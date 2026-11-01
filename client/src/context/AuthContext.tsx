'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Book, CartItem, User } from '@/types';
import api from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  wishlistBooks: Book[];
  wishlistBookIds: string[];
  wishlistLoading: boolean;
  wishlistError: string | null;
  refreshWishlist: () => Promise<void>;
  setWishlistItem: (bookId: string, wishlisted: boolean, book?: Book) => Promise<void>;
  cartItems: CartItem[];
  cartCount: number;
  cartTotalAmount: number;
  cartLoading: boolean;
  cartError: string | null;
  refreshCart: () => Promise<void>;
  addCartBook: (book: Book) => Promise<string>;
  removeCartBook: (bookId: string) => Promise<string>;
  clearCart: () => Promise<string>;
  emptyCart: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    universityId: string;
    department?: string;
    yearOfStudy?: number;
    studentId?: string;
    phone?: string;
  }) => Promise<{ success: boolean; error?: string; user?: User }>;
  verifyOtp: (otp: string, email?: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  resendOtp: (email?: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string; user?: User }>;
  changePassword: (data: { currentPassword: string; newPassword: string }) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
  redirectByRole: (userToRoute?: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [wishlistBooks, setWishlistBooks] = useState<Book[]>([]);
  const [wishlistBookIds, setWishlistBookIds] = useState<string[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState<boolean>(false);
  const [wishlistError, setWishlistError] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartTotalAmount, setCartTotalAmount] = useState(0);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const wishlistBooksRef = useRef<Book[]>([]);
  const wishlistBookIdsRef = useRef<string[]>([]);
  const loadedWishlistUserRef = useRef<string | null>(null);
  const cartItemsRef = useRef<CartItem[]>([]);
  const loadedCartUserRef = useRef<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);
  currentUserIdRef.current = user?._id || null;
  const router = useRouter();

  const replaceWishlist = useCallback((books: Book[]) => {
    wishlistBooksRef.current = books;
    wishlistBookIdsRef.current = books.map((book) => book._id);
    setWishlistBooks(books);
    setWishlistBookIds(wishlistBookIdsRef.current);
  }, []);

  const replaceCart = useCallback((items: CartItem[]) => {
    cartItemsRef.current = items;
    setCartItems(items);
    setCartTotalAmount(items.reduce((total, item) => {
      const book = item.book;
      return total + Number(book?.sellingPrice ?? book?.price ?? 0);
    }, 0));
  }, []);

  const refreshCart = useCallback(async () => {
    const userId = user?._id;
    if (!userId) return;

    loadedCartUserRef.current = userId;
    setCartLoading(true);
    setCartError(null);
    try {
      const response = await api.getCart();
      if (currentUserIdRef.current === userId) {
        replaceCart(response.items || []);
        setCartTotalAmount(Number(response.totalAmount || 0));
      }
    } catch (error) {
      if (currentUserIdRef.current === userId) {
        setCartError(error instanceof Error ? error.message : 'Unable to load your cart.');
      }
    } finally {
      if (currentUserIdRef.current === userId) setCartLoading(false);
    }
  }, [user?._id, replaceCart]);

  const emptyCart = useCallback(() => {
    replaceCart([]);
    setCartTotalAmount(0);
    setCartError(null);
  }, [replaceCart]);

  const addCartBook = async (book: Book) => {
    if (!user) throw new Error('Please sign in to add items to your cart.');

    const userId = user._id;
    const previousItems = cartItemsRef.current;
    const alreadyAdded = previousItems.some((item) => item.book._id === book._id);
    if (!alreadyAdded) {
      replaceCart([...previousItems, { _id: book._id, book }]);
    }

    try {
      const response = await api.addToCart(book._id);
      if (currentUserIdRef.current === userId) {
        replaceCart(response.items?.length ? response.items : cartItemsRef.current);
        setCartTotalAmount(Number(response.totalAmount ?? cartTotalAmount));
        setCartError(null);
      }
      return response.message;
    } catch (error) {
      if (!alreadyAdded && currentUserIdRef.current === userId) {
        replaceCart(cartItemsRef.current.filter((item) => item.book._id !== book._id));
      }
      throw error;
    }
  };

  const removeCartBook = async (bookId: string) => {
    if (!user) throw new Error('Please sign in to update your cart.');

    const userId = user._id;
    const previousItem = cartItemsRef.current.find((item) => item.book._id === bookId);
    if (!previousItem) throw new Error('Book not found in your cart.');
    replaceCart(cartItemsRef.current.filter((item) => item.book._id !== bookId));

    try {
      const response = await api.removeFromCart(bookId);
      if (currentUserIdRef.current === userId) {
        replaceCart(response.items || []);
        setCartTotalAmount(Number(response.totalAmount || 0));
        setCartError(null);
      }
      return response.message;
    } catch (error) {
      if (currentUserIdRef.current === userId && !cartItemsRef.current.some((item) => item.book._id === bookId)) {
        replaceCart([...cartItemsRef.current, previousItem]);
      }
      throw error;
    }
  };

  const clearCart = async () => {
    if (!user) throw new Error('Please sign in to clear your cart.');

    const userId = user._id;
    const previousItems = cartItemsRef.current;
    emptyCart();
    try {
      const response = await api.clearCart();
      if (currentUserIdRef.current === userId) {
        replaceCart(response.items || []);
        setCartTotalAmount(Number(response.totalAmount || 0));
      }
      return response.message;
    } catch (error) {
      if (currentUserIdRef.current === userId && cartItemsRef.current.length === 0) {
        replaceCart(previousItems);
      }
      throw error;
    }
  };

  const refreshWishlist = useCallback(async () => {
    const userId = user?._id;
    if (!userId) return;

    loadedWishlistUserRef.current = userId;
    setWishlistLoading(true);
    setWishlistError(null);
    try {
      const response = await api.getWishlist();
      if (currentUserIdRef.current === userId) {
        replaceWishlist(response.books || []);
      }
    } catch (error) {
      if (currentUserIdRef.current === userId) {
        setWishlistError(error instanceof Error ? error.message : 'Unable to load your wishlist.');
      }
    } finally {
      if (currentUserIdRef.current === userId) setWishlistLoading(false);
    }
  }, [user?._id, replaceWishlist]);

  useEffect(() => {
    const userId = user?._id;
    if (!userId) {
      loadedWishlistUserRef.current = null;
      replaceWishlist([]);
      setWishlistLoading(false);
      setWishlistError(null);
      return;
    }

    if (loadedWishlistUserRef.current === userId) return;
    replaceWishlist([]);
    void refreshWishlist();
  }, [user?._id, replaceWishlist, refreshWishlist]);

  useEffect(() => {
    const userId = user?._id;
    if (!userId) {
      loadedCartUserRef.current = null;
      emptyCart();
      setCartLoading(false);
      setCartError(null);
      return;
    }

    if (loadedCartUserRef.current === userId) return;
    replaceCart([]);
    void refreshCart();
  }, [user?._id, emptyCart, replaceCart, refreshCart]);

  const setWishlistItem = async (bookId: string, wishlisted: boolean, book?: Book) => {
    if (!user) throw new Error('Please sign in to update your wishlist.');

    const wasWishlisted = wishlistBookIdsRef.current.includes(bookId);
    if (wasWishlisted === wishlisted) return;
    const previousBook = wishlistBooksRef.current.find((item) => item._id === bookId);

    const updateMembership = (ids: string[], included: boolean) => (
      included ? (ids.includes(bookId) ? ids : [...ids, bookId]) : ids.filter((id) => id !== bookId)
    );
    wishlistBookIdsRef.current = updateMembership(wishlistBookIdsRef.current, wishlisted);
    setWishlistBookIds(wishlistBookIdsRef.current);
    if (wishlisted && book && !previousBook) {
      wishlistBooksRef.current = [...wishlistBooksRef.current, book];
      setWishlistBooks(wishlistBooksRef.current);
    } else if (!wishlisted) {
      wishlistBooksRef.current = wishlistBooksRef.current.filter((item) => item._id !== bookId);
      setWishlistBooks(wishlistBooksRef.current);
    }

    try {
      if (wishlisted) {
        const response = await api.addToWishlist(bookId);
        setWishlistError(null);
        const savedBook = response.book || book;
        if (savedBook && currentUserIdRef.current === user._id) {
          const exists = wishlistBooksRef.current.some((item) => item._id === bookId);
          wishlistBooksRef.current = exists
            ? wishlistBooksRef.current.map((item) => item._id === bookId ? savedBook : item)
            : [...wishlistBooksRef.current, savedBook];
          setWishlistBooks(wishlistBooksRef.current);
        }
      } else {
        await api.removeFromWishlist(bookId);
        setWishlistError(null);
      }
    } catch (error) {
      if (currentUserIdRef.current === user._id) {
        wishlistBookIdsRef.current = updateMembership(wishlistBookIdsRef.current, wasWishlisted);
        setWishlistBookIds(wishlistBookIdsRef.current);
        wishlistBooksRef.current = wishlistBooksRef.current.filter((item) => item._id !== bookId);
        if (previousBook) wishlistBooksRef.current = [...wishlistBooksRef.current, previousBook];
        setWishlistBooks(wishlistBooksRef.current);
      }
      throw error;
    }
  };

  // Helper to redirect based on user role
  const redirectByRole = (userToRoute?: User | null) => {
    const targetUser = userToRoute || user;
    if (!targetUser) {
      router.push('/login');
      return;
    }
    if (targetUser.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  // Fetch current user on initial mount
  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      if (res && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  // Login handler
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      if (res.user) {
        setUser(res.user);
        return { success: true, user: res.user };
      }
      return { success: false, error: 'Login failed: no user data returned' };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Register handler
  const register = async (data: {
    name: string;
    email: string;
    password: string;
    universityId: string;
    department?: string;
    yearOfStudy?: number;
    studentId?: string;
    phone?: string;
  }) => {
    setLoading(true);
    try {
      const res = await api.register(data);
      if (res.user) {
        setUser(res.user);
        return { success: true, user: res.user };
      }
      return { success: false, error: 'Registration failed: no user data returned' };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP handler
  const verifyOtp = async (otp: string, email?: string) => {
    try {
      const res = await api.verifyOtp({ otp, email: email || user?.email });
      if (res.user) {
        setUser(res.user);
        return { success: true, user: res.user };
      }
      return { success: false, error: res.message || 'OTP verification failed' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Resend OTP handler
  const resendOtp = async (email?: string) => {
    try {
      const res = await api.resendOtp({ email: email || user?.email });
      return { success: true, message: res.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      router.push('/login');
    }
  };

  // Update profile handler
  const updateProfile = async (data: Partial<User>) => {
    try {
      const res = await api.updateProfile(data);
      if (res.user) {
        setUser(res.user);
        return { success: true, user: res.user };
      }
      return { success: false, error: 'Failed to update profile' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Change password handler
  const changePassword = async (data: { currentPassword: string; newPassword: string }) => {
    try {
      const res = await api.changePassword(data);
      if (res.user) {
        setUser(res.user);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        wishlistBooks,
        wishlistBookIds,
        wishlistLoading,
        wishlistError,
        refreshWishlist,
        setWishlistItem,
        cartItems,
        cartCount: cartItems.length,
        cartTotalAmount,
        cartLoading,
        cartError,
        refreshCart,
        addCartBook,
        removeCartBook,
        clearCart,
        emptyCart,
        login,
        register,
        verifyOtp,
        resendOtp,
        logout,
        updateProfile,
        changePassword,
        refreshUser,
        redirectByRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
