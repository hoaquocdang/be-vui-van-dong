import { jsonLd } from '@/lib/util';

/** Nhúng dữ liệu có cấu trúc (schema.org) cho công cụ tìm kiếm. */
export default function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />;
}
