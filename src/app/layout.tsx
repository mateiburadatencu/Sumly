import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/navbar';
import { Analytics } from '@vercel/analytics/next';

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  axes: ['opsz'],
});

const inter = Inter({
  variable: '--font-inter',
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
    images: [{ url: '/og-image.png', width: 1040, height: 560, alt: 'Sumly' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sumly — Turn YouTube videos into clear notes',
    description: 'Paste any YouTube link and get an AI-powered structured summary in seconds.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${inter.variable} antialiased`}>
        <Navbar />
        <main className="pt-16">{children}</main>
        <Analytics />
      </body>
    </html>
  );
}
