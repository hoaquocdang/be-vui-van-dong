import type { MetadataRoute } from 'next';
import { GAMES } from '@/lib/games';
import { abs } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: abs('/'), lastModified: now, changeFrequency: 'weekly', priority: 1 },
    ...GAMES.map((g) => ({ url: abs(`/games/${g.id}`), lastModified: now, changeFrequency: 'monthly' as const, priority: 0.8 })),
  ];
}
