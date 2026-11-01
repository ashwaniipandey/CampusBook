import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';

export const metadata: Metadata = {
  title: 'CampusBook | University Student Textbook Marketplace & Exchange',
  description:
    'Buy, sell, exchange, and donate course textbooks within your university campus. Save money, help fellow students, and build campus community.',
  keywords: ['college textbooks', 'book exchange', 'campus marketplace', 'used textbooks', 'student book donation'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-campus-100 selection:text-campus-900">
        <AuthProvider>
          <SocketProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
