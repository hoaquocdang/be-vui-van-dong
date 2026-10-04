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
  }
}

const BUILD = process.env.NEXT_PUBLIC_BUILD ?? '0';
/** thứ tự nạp rất quan trọng: engine.js định nghĩa các hàm chung mà các file trò chơi dùng */
const FILES = [
  'track.js',
  'engine.js',
  'ai-body.js',
  'games-lib.js',
  'games-body.js',
  'games-hand.js',
  'games-run.js',
  'games-run2.js',
  'games-reach.js',
  'games-reach2.js',
  'games-fit.js',
  'games-fit2.js',
  'games-face.js',
  'games-hand2.js',
];

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Không tải được ' + src));
    document.head.appendChild(s);
  });
}

let loading: Promise<void> | null = null;

export function loadEngine(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Chỉ chạy trên trình duyệt'));
  if (window.BVApp?.ready) return Promise.resolve();
  if (!loading) {
    // tạo thẻ <script> cùng lúc (async=false → tải song song nhưng chạy đúng thứ tự khai báo)
    loading = Promise.all(FILES.map((f) => loadScript(`/engine/${f}?v=${BUILD}`))).then(() => undefined).catch((e) => {
      loading = null; // cho phép thử lại
      throw e;
    });
  }
  return loading;
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
