import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import GameStage from '@/components/GameStage';
import { SITE } from '@/lib/site';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#7FD8F7',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.title, template: '%s | Bé Vui Vận Động' },
  description: SITE.description,
  applicationName: SITE.name,
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    locale: 'vi_VN',
    url: '/',
    title: SITE.title,
    description: SITE.description,
    images: [{ url: SITE.ogImage, width: 1200, height: 630, alt: 'Bé Vui Vận Động — game vận động cho bé qua camera điện thoại' }],
  },
  twitter: { card: 'summary_large_image', title: SITE.title, description: SITE.description, images: [SITE.ogImage] },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700;800&display=swap" />
      </head>
      <body>
        {children}
        <GameStage />
      </body>
    </html>
  );
}
