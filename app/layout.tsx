import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import GameStage from '@/components/GameStage';
import { BOOT_SCRIPT } from '@/lib/bootScript';
import { SITE } from '@/lib/site';

/** boot.js chạy độc lập với React (nút chơi vẫn bấm được trên máy cũ); nhúng thẳng vào trang lúc build */
const BOOT = BOOT_SCRIPT.replace('__BUILD__', process.env.NEXT_PUBLIC_BUILD ?? '0');

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
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700;800&display=swap" />
      </head>
      <body>
        <noscript>
          <div className="warn" style={{ margin: 12, textAlign: 'center' }}>
            Trang này cần bật JavaScript để chơi game. Hãy bật JavaScript trong trình duyệt rồi tải lại trang nhé!
          </div>
        </noscript>
        {children}
        <GameStage />
      </body>
    </html>
  );
}
