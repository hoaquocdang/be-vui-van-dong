/** #RRGGBB + độ trong suốt → rgba() */
export function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** đọc / ghi localStorage an toàn (chế độ riêng tư có thể chặn) */
export const store = {
  get(key: string, def: string): string {
    try {
      const v = localStorage.getItem(key);
      return v == null ? def : v;
    } catch {
      return def;
    }
  },
  set(key: string, val: string) {
    try {
      localStorage.setItem(key, val);
    } catch {
      /* bỏ qua */
    }
  },
};

/** escape cho JSON-LD đặt trong thẻ <script> */
export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');
