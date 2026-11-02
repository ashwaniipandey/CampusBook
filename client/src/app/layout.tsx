import type { Metadata } from 'next';
import './globals.css';
import SiteChrome from '@/components/SiteChrome';
import ThemeProvider from '@/components/ThemeProvider';
import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: {
    default: 'CampusBook | Student Book Marketplace',
    template: '%s | CampusBook',
  },
  description:
    'Buy, sell, exchange, and donate course textbooks within your university campus. Save money, help fellow students, and build campus community.',
  keywords: ['college textbooks', 'book exchange', 'campus marketplace', 'used textbooks', 'student book donation'],
  openGraph: {
    title: 'CampusBook | Student Book Marketplace',
    description:
      'Buy, sell, exchange, and donate course books with students at your university.',
    type: 'website',
    siteName: 'CampusBook',
    images: ['/book-marketplace-hero.svg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-campus-100 selection:text-campus-900">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <SocketProvider>
              <SiteChrome>{children}</SiteChrome>
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
