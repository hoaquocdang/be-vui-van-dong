/**
 * Cầu nối giữa trang web Next.js và "engine" chơi game (các file JS thuần trong public/engine/).
 * Engine chỉ được nạp khi cần (vào trang một trò / bấm chơi) và chỉ nạp một lần.
 */
export interface PlayOpts {
  /** true = chơi bằng chạm / chuột, không bật camera */
  touch?: boolean;
  players?: 1 | 2;
  /** true = dùng AI nhận diện, false = camera cơ bản (phát hiện chuyển động) */
  ai?: boolean;
  sens?: 0 | 1 | 2;
  /** gọi khi bé bấm "Chọn trò khác" ở màn hình kết thúc */
  onHome?: () => void;
}

interface BVApp {
  ready: boolean;
  play(id: string, o?: PlayOpts): boolean;
  state?: string;
  configure(o: PlayOpts): void;
  preload(id: string): void;
  exit(): void;
}

declare global {
  interface Window {
    BVApp?: BVApp;
    __bvLoad?: () => Promise<void>;
    __bvLoadEngine?: (ok?: () => void, fail?: (e: Error) => void) => void;
  }
}

/** Bộ nạp engine nằm trong lib/boot.js (nhúng vào <head>, chạy độc lập với React). Ở đây chỉ bọc lại thành Promise. */
export function loadEngine(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Chỉ chạy trên trình duyệt'));
  if (window.BVApp?.ready) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const boot = window.__bvLoadEngine;
    if (!boot) {
      reject(new Error('Chưa có bộ nạp engine'));
      return;
    }
    boot(() => resolve(), (e) => reject(e));
  });
}

/** nạp engine, mở sân khấu và bắt đầu chơi */
export async function playGame(id: string, o: PlayOpts = {}): Promise<void> {
  await loadEngine();
  if (!window.BVApp?.play(id, o)) throw new Error('Không tìm thấy trò chơi ' + id);
}

/** tải ngầm bộ nhận diện của trò (khi bé đang đọc hướng dẫn) cho đỡ phải chờ */
export function preloadGame(id: string): void {
  loadEngine().then(() => window.BVApp?.preload(id)).catch(() => {});
}
