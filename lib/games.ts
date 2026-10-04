/**
 * Danh sách trò chơi — nguồn dữ liệu DUY NHẤT cho trang chủ, trang từng trò, sitemap và JSON-LD.
 * `id` trùng với id đăng ký trong public/engine/games-*.js (phần chạy game).
 * Chữ in đậm viết bằng **dấu sao đôi**.
 */
export type CatId = 'move' | 'learn' | 'react' | 'create' | 'music' | 'multi';
export type Tracker = 'pose' | 'hand' | 'face';

export interface Game {
  id: string;
  name: string;
  icon: string[];
  accent: string;
  cat: CatId[];
  tag: string;
  desc: string;
  skill: string;
  dist: string;
  how: string[];
  needs?: Tracker;
  /** có chế độ dự phòng bằng quét chuyển động khi máy không chạy được AI */
  soft?: boolean;
  /** hỗ trợ chơi bằng chạm / chuột khi không có camera */
  touch?: boolean;
  players?: '1' | '1-2' | '1-3';
  isNew?: boolean;
  /** false = trò sáng tạo, không có cấp độ */
  levels?: boolean;
  age?: string;
}

export const CATS: { id: 'all' | CatId; name: string; icon: string }[] = [
  { id: 'all', name: 'Tất cả', icon: '🎮' },
  { id: 'move', name: 'Vận động', icon: '🏃' },
  { id: 'learn', name: 'Học & tư duy', icon: '🧠' },
  { id: 'react', name: 'Phản xạ', icon: '⚡' },
  { id: 'music', name: 'Âm nhạc & nhịp', icon: '🎵' },
  { id: 'create', name: 'Sáng tạo', icon: '🎨' },
  { id: 'multi', name: 'Nhiều người chơi', icon: '👫' },
];

export const TRACKERS: Record<Tracker, { chip: string; label: string; mb: number }> = {
  pose: { chip: '🦴 Khung xương', label: 'nhận diện khung xương', mb: 18 },
  hand: { chip: '✋ Bàn tay', label: 'nhận diện bàn tay', mb: 20 },
  face: { chip: '🙂 Khuôn mặt', label: 'nhận diện khuôn mặt', mb: 16 },
};

const FULL_BODY = 'Đứng cách camera khoảng 2 m, để camera thấy cả người';
const NEAR = 'Đứng gần camera hơn, khoảng 1 m, giơ tay trước ngực';

export const GAMES: Game[] = [
  {
    id: 'race', name: 'Chạy Vượt Chướng Ngại', icon: ['🐰', '🚧', '🐢'], accent: '#FFA53D', cat: ['move', 'multi', 'react'],
    needs: 'pose', soft: true, touch: true, players: '1-2',
    tag: 'Nhảy, cúi hoặc chạy nhanh để thú cưng vượt chướng ngại — sai là ngã!',
    desc: 'Con thú cứ chạy tới, gặp chướng ngại phải làm đúng động tác mới qua được. Chơi 1 mình hoặc rủ bạn đứng 2 bên camera đấu trực tiếp.',
    skill: '🏃 Phản xạ & thi đấu', dist: FULL_BODY,
    how: [
      'Đứng cách camera khoảng 2 m sao cho thấy cả người bé.',
      'Thấy **NHẢY LÊN** thì nhảy, **CÚI XUỐNG** thì cúi người, **CHẠY NHANH** thì chạy tại chỗ.',
      'Làm đúng là con thú vượt qua, làm sai là vấp ngã! Chế độ 2 người: mỗi bé đứng một bên camera.',
    ],
  },
  {
    id: 'light', name: 'Đèn Xanh Đèn Đỏ', icon: ['🚦', '🐻'], accent: '#FF5A6E', cat: ['move', 'react'],
    needs: 'pose', soft: true, touch: true, isNew: true,
    tag: 'Đèn xanh thì chạy tại chỗ, đèn đỏ thì đứng im như tượng!',
    desc: 'Bạn gấu đang đứng ở vạch đích. Đèn xanh bé chạy tại chỗ để gấu tiến lên, đèn đỏ phải đứng im như tượng — cử động là mất tim. Đèn đổi càng lúc càng nhanh.',
    skill: '🛑 Kiểm soát cơ thể', dist: FULL_BODY,
    how: [
      'Đứng cách camera khoảng 2 m sao cho thấy cả người bé.',
      'Đèn **XANH**: chạy tại chỗ thật nhanh để tiến về đích.',
      'Đèn **ĐỎ**: đứng im như pho tượng! Cử động là mất tim, hết 3 tim là thua.',
    ],
  },
  {
    id: 'balloon', name: 'Giữ Bóng Bay', icon: ['🎈', '🙌'], accent: '#5AA9FF', cat: ['react', 'move', 'multi'],
    needs: 'pose', soft: true, touch: true, isNew: true, players: '1-3',
    tag: 'Đẩy bóng bay lên cao, đừng để bóng chạm đất!',
    desc: 'Bóng bay rơi xuống từ từ. Bé dùng tay, đầu, vai hay cả chân để đẩy bóng bay lên. Lên cấp cao có thêm nhiều quả bóng cùng lúc — cả nhà cùng chơi cũng được!',
    skill: '🎯 Phối hợp tay mắt', dist: FULL_BODY,
    how: [
      'Đứng cách camera khoảng 2 m sao cho thấy cả người.',
      'Bóng bay rơi xuống — dùng tay, đầu, vai hoặc chân đẩy bóng lên.',
      'Đẩy đủ số lần là qua cấp. Bóng chạm đất sẽ mất 1 tim.',
    ],
  },
  {
    id: 'fingers', name: 'Đếm Ngón Tay', icon: ['🖐️', '🔢'], accent: '#8B6FEA', cat: ['learn'],
    needs: 'hand', touch: true, isNew: true,
    tag: 'Giơ đúng số ngón tay theo hình, số hoặc phép cộng trừ!',
    desc: 'Màn hình hiện số trái cây, chữ số hoặc phép cộng trừ — bé giơ đúng số ngón tay. Lên cấp cao phải dùng cả hai bàn tay và làm phép tính trong phạm vi 10.',
    skill: '🔢 Đếm số & phép tính', dist: NEAR,
    how: [
      'Đứng cách camera khoảng 1 m, giơ bàn tay lên trước ngực cho camera thấy rõ.',
      'Nhìn số trái cây, chữ số hoặc phép tính trên màn hình.',
      'Giơ đúng số ngón tay và giữ yên một chút. Số trong góc cho biết máy đang đếm được mấy ngón.',
    ],
  },
  {
    id: 'rps', name: 'Kéo Búa Bao', icon: ['✌️', '✊', '🖐️'], accent: '#FF8A3D', cat: ['learn', 'react'],
    needs: 'hand', touch: true, isNew: true,
    tag: 'Chơi oẳn tù tì với máy — ra Kéo, Búa hoặc Bao!',
    desc: 'Cùng đếm "Oẳn… Tù… Tì!" rồi ra Kéo, Búa hoặc Bao để thắng máy. Cứ 5 cấp lại có luật mới: phải ra GIỐNG máy!',
    skill: '✌️ Nhận biết & phản xạ', dist: NEAR,
    how: [
      'Đứng cách camera khoảng 1 m, giơ một bàn tay trước ngực.',
      'Cùng đếm **Oẳn… Tù… Tì!** rồi ra **Búa** (nắm tay), **Kéo** (2 ngón) hoặc **Bao** (xòe tay).',
      'Thắng máy là qua cấp. Thua máy mất 1 tim; hoà thì chơi lại.',
    ],
  },
  {
    id: 'pose', name: 'Bé Tạo Dáng', icon: ['🤸', '🧸'], accent: '#2FBF9F', cat: ['move', 'learn'],
    needs: 'pose', soft: true, touch: true,
    tag: 'Nhìn hình rồi tạo dáng y hệt: giơ tay, dang tay, cúi người, đứng một chân…',
    desc: 'Hình người que hiện ra, bé bắt chước đúng tư thế trước khi hết giờ. Khung xương AI chấm từng tay từng chân; lên cấp cao có thêm đứng một chân, chống hông, nhảy sao.',
    skill: '🤸 Bắt chước & trái phải', dist: FULL_BODY,
    how: [
      'Đứng cách camera khoảng 2 m sao cho thấy cả người bé.',
      'Nhìn hình người que ở giữa màn hình rồi làm đúng tư thế đó.',
      'Tay chân nào đúng sẽ sáng xanh. Giữ đúng tư thế là qua cấp!',
    ],
  },
  {
    id: 'bubbles', name: 'Đập Bóng Vui', icon: ['🍎', '⭐'], accent: '#FF8A3D', cat: ['react', 'move'], touch: true,
    tag: 'Vẫy tay đập vỡ trái cây, né chú sâu nghịch ngợm!',
    desc: 'Trái cây bay lên, bé vẫy tay đập vỡ thật nhiều. Nhớ né chú sâu 🐛 nhé — đập trúng là mất tim!',
    skill: '⚡ Phản xạ nhanh', dist: 'Đứng cách camera 1,5–2 m',
    how: [
      'Đứng cách camera 1,5–2 m, chỗ đủ sáng.',
      'Vẫy tay vào trái cây hoặc ngôi sao để đập vỡ.',
      'Né chú sâu 🐛. Đập đủ số lượng là qua cấp!',
    ],
  },
  {
    id: 'colors', name: 'Bắt Đúng Màu', icon: ['🎨', '🍓'], accent: '#FF6B9A', cat: ['learn', 'react'], touch: true,
    tag: 'Chỉ đập đúng quả có màu được yêu cầu ở trên thôi nhé!',
    desc: 'Màu cần đập hiện ở góc trên. Đập đúng màu được điểm, đập nhầm màu là mất tim — màu đổi liên tục nên bé phải chú ý.',
    skill: '🎨 Nhận biết màu sắc', dist: 'Đứng cách camera 1,5–2 m',
    how: [
      'Đứng cách camera 1,5–2 m, chỗ đủ sáng.',
      'Nhìn màu ở góc trên bên trái rồi chỉ đập quả cùng màu.',
      'Màu sẽ đổi sau ít giây — chú ý nhìn lại nhé!',
    ],
  },
  {
    id: 'match', name: 'Bé Ghép Đôi', icon: ['🍓', '🍓'], accent: '#8B6FEA', cat: ['learn'], touch: true,
    tag: 'Nhìn kỹ rồi chạm vào 2 hình giống nhau, ghép hết cả bảng!',
    desc: 'Bảng ghép hình kiểu cổ điển: chọn 2 hình giống nhau để xóa. Bảng càng lên cấp càng lớn, chọn sai 3 lần là thua.',
    skill: '🔍 Quan sát & ghi nhớ', dist: 'Đứng cách camera 1,5–2 m',
    how: [
      'Đứng cách camera 1,5–2 m, chỗ đủ sáng.',
      'Đưa tay chạm vào một ô, rồi chạm ô thứ hai có hình giống.',
      'Ghép đúng thì hai ô biến mất; ghép sai mất 1 tim.',
    ],
  },
];

export const gameById = (id: string) => GAMES.find((g) => g.id === id);
export const trackerChip = (g: Game) => (g.needs ? TRACKERS[g.needs].chip : '📷 Chuyển động');
export const playersLabel = (g: Game) => (g.players === '1-2' ? '👫 1–2 người' : g.players === '1-3' ? '👨‍👩‍👧 1–3 người' : '🙋 1 người');

/** tách **đậm** thành các đoạn để hiển thị bằng React mà không cần innerHTML */
export function richParts(text: string): { t: string; b: boolean }[] {
  return text.split('**').map((t, i) => ({ t, b: i % 2 === 1 })).filter((p) => p.t);
}
