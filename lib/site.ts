import type { Metadata } from 'next';
import { GAMES } from './games';

export const SITE = {
  url: 'https://be-vui-van-dong.vercel.app',
  name: 'Bé Vui Vận Động',
  title: 'Bé Vui Vận Động – Game Vận Động Cho Bé 4-6 Tuổi Qua Camera',
  get description() {
    return `${GAMES.length} game vận động cho bé 4-6 tuổi chơi qua camera điện thoại: nhảy, né, đếm ngón tay, làm mặt hề… Miễn phí, không cần cài app, chiếu lên tivi, mỗi trò 30 cấp độ.`;
  },
  ogImage: '/og-image.png',
};

export const abs = (path: string) => new URL(path, SITE.url).toString();

/** Open Graph + Twitter + canonical cho một trang (Next.js không gộp sâu nên phải lặp lại ảnh ở mỗi trang). */
export function pageMeta(title: string, description: string, path: string): Metadata {
  const image = { url: SITE.ogImage, width: 1200, height: 630, alt: 'Bé Vui Vận Động — game vận động cho bé qua camera điện thoại' };
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: 'website', siteName: SITE.name, locale: 'vi_VN', url: path, title, description, images: [image] },
    twitter: { card: 'summary_large_image', title, description, images: [SITE.ogImage] },
  };
}

/** cắt mô tả cho vừa ~155 ký tự, dừng ở ranh giới câu / từ chứ không cắt giữa chữ */
export function fitDesc(text: string, max = 155): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const sentence = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  if (sentence > max * 0.6) return cut.slice(0, sentence + 1);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:—-]$/, '') + '…';
}
