import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;

export function createPageMetadata(title: string, description: string, path: string): Metadata {
  const absoluteUrl = siteUrl ? new URL(path, siteUrl).toString() : undefined;

  return {
    title,
    description,
    alternates: absoluteUrl ? { canonical: absoluteUrl } : undefined,
    openGraph: {
      title: `${title} | CampusBook`,
      description,
      siteName: 'CampusBook',
      type: 'website',
      ...(absoluteUrl ? { url: absoluteUrl } : {}),
      images: [
        {
          url: '/book-marketplace-hero.svg',
          width: 960,
          height: 720,
          alt: 'Books shared by students in the CampusBook marketplace',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | CampusBook`,
      description,
      images: ['/book-marketplace-hero.svg'],
    },
  };
}
