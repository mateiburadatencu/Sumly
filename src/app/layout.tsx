import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/navbar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Sumly — Turn YouTube videos into clear notes',
  description:
    'Paste any YouTube link and get an AI-powered structured summary in seconds. Save time, learn faster.',
  keywords: ['youtube', 'summary', 'ai', 'notes', 'transcript', 'student'],
  openGraph: {
    title: 'Sumly — Turn YouTube videos into clear notes',
    description: 'Paste any YouTube link and get an AI-powered structured summary in seconds.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Navbar />
        <main className="pt-16">{children}</main>
      </body>
    </html>
  );
}
