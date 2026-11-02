import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/admin/',
        '/cart',
        '/dashboard',
        '/donations',
        '/exchange-matches',
        '/exchanges',
        '/messages',
        '/messages/',
        '/my-books',
        '/notifications',
        '/orders',
        '/profile',
        '/settings',
        '/wishlist',
        '/verify-otp',
      ],
    },
    sitemap: new URL('/sitemap.xml', origin).toString(),
  };
}
