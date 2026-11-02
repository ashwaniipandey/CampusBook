import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const lastModified = new Date();

  return [
    { url: new URL('/', origin).toString(), lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: new URL('/explore', origin).toString(), lastModified, changeFrequency: 'daily', priority: 0.9 },
    { url: new URL('/sell', origin).toString(), lastModified, changeFrequency: 'monthly', priority: 0.7 },
  ];
}
