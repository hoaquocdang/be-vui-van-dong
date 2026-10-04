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
const NEAR_FACE = 'Ngồi hoặc đứng cách camera khoảng 1 m, để khuôn mặt nằm giữa khung hình';

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
  {
    id: 'dino', name: 'Khủng Long Chạy', icon: ['🦖', '🌵', '🦅'], accent: '#E0A93B', cat: ['move', 'react'],
    needs: 'pose', soft: true, touch: true, isNew: true,
    tag: 'Nhảy qua xương rồng, cúi xuống tránh chim bay — khủng long chạy mãi không dừng!',
    desc: 'Khủng long con chạy trong công viên thời tiền sử. Bé nhảy lên để qua xương rồng, cúi xuống để chui dưới chú chim bay. Càng lên cấp khủng long chạy càng nhanh, vật cản càng dày.',
    skill: '🦘 Nhảy & cúi đúng lúc', dist: FULL_BODY,
    how: [
      'Đứng cách camera khoảng 2 m sao cho thấy cả người bé.',
      'Thấy **xương rồng** dưới đất thì **nhảy lên**; thấy **chim bay** trên cao thì **cúi xuống**.',
      'Va vào vật cản mất 1 tim (3 tim mỗi cấp). Vượt đủ số vật cản là qua cấp, game tự chạy nhanh dần.',
    ],
  },
  {
    id: 'temple', name: 'Thỏ Chạy Vườn', icon: ['🐰', '🥕', '🪵'], accent: '#4FB36A', cat: ['move', 'react'],
    needs: 'pose', soft: true, touch: true, isNew: true,
    tag: 'Chạy tại chỗ cho thỏ chạy nhanh, nhảy qua khúc gỗ, cúi tránh ong và nhặt cà rốt!',
    desc: 'Bé thỏ chạy qua khu vườn. Bé chạy tại chỗ để thỏ chạy nhanh hơn, nhảy qua khúc gỗ, cúi xuống tránh chú ong và nhặt cà rốt — đủ 5 củ được thêm 1 tim.',
    skill: '🏃 Chạy, nhảy, cúi', dist: FULL_BODY,
    how: [
      'Đứng cách camera khoảng 2 m sao cho thấy cả người.',
      '**Chạy tại chỗ** để thỏ chạy nhanh (đứng yên thì thỏ chạy chậm).',
      '**Nhảy** qua khúc gỗ, **cúi** dưới ong bay, nhảy qua dãy cà rốt để nhặt: đủ 5 củ được thêm 1 tim.',
    ],
  },
  {
    id: 'shore', name: 'Chạy Bãi Biển', icon: ['🏖️', '🏃', '🌴'], accent: '#2DB5D9', cat: ['move', 'learn'],
    needs: 'pose', isNew: true,
    tag: 'Chạy tại chỗ dọc bờ biển, tới cổng thì dừng lại tạo dáng đúng!',
    desc: 'Bé chạy tại chỗ để tiến dọc bãi biển. Tới mỗi cổng, bé dừng lại và tạo đúng dáng hiện trên cổng — giơ tay, chống hông, ngồi xổm, đứng một chân… Tay chân nào đúng sẽ sáng xanh.',
    skill: '🤸 Chạy & tạo dáng', dist: FULL_BODY,
    how: [
      'Đứng cách camera khoảng 2 m sao cho thấy cả người bé.',
      '**Chạy tại chỗ** để tiến lên; đứng yên thì nhân vật dừng lại.',
      'Tới cổng, **dừng lại và làm đúng dáng** trên cổng trước khi hết giờ. Tay chân nào đúng sẽ sáng xanh.',
    ],
  },
  {
    id: 'quiz', name: 'Thỏ Đố Vui', icon: ['🐰', '❓', '🧠'], accent: '#8B6FEA', cat: ['learn', 'move'],
    needs: 'pose', soft: true, touch: true, isNew: true,
    tag: 'Nhảy hoặc cúi để chọn đáp án đúng cho câu hỏi vui!',
    desc: 'Thỏ con chạy tới từng cổng câu hỏi: đếm quả, gọi tên màu sắc, con vật, hình khối, phép cộng trừ… Bé nhảy lên để chọn đáp án phía trên, cúi xuống để chọn đáp án phía dưới. Càng lên cấp câu hỏi càng đa dạng và cổng tới càng nhanh.',
    skill: '🧠 Kiến thức & phản xạ', dist: FULL_BODY,
    how: [
      'Đứng cách camera khoảng 2 m sao cho thấy cả người bé.',
      'Đọc câu hỏi ở trên. Hai đáp án nằm trên cổng: **NHẢY lên** để chọn đáp án phía **trên**, **CÚI xuống** để chọn đáp án phía **dưới**.',
      'Chọn đúng đủ số lần là qua cấp. Chọn sai hoặc không chọn sẽ mất 1 tim.',
    ],
  },
  {
    id: 'surf', name: 'Lướt Sóng', icon: ['🏄', '🌊', '⭐'], accent: '#2D9CDB', cat: ['move', 'react'],
    needs: 'pose', touch: true, isNew: true,
    tag: 'Nghiêng người sang trái, phải để lướt trên sóng, nhặt sao và né đá!',
    desc: 'Bé lướt trên sóng biển với 3 làn. Bước hoặc nghiêng người sang trái, phải để đổi làn: nhặt ngôi sao, né tảng đá. Lên cấp cao sóng chạy nhanh hơn và đá nhiều hơn.',
    skill: '↔️ Thăng bằng & chọn làn', dist: FULL_BODY,
    how: [
      'Đứng giữa khung hình, cách camera khoảng 2 m.',
      '**Bước hoặc nghiêng người sang trái / phải** để đổi làn lướt (có 3 làn).',
      'Nhặt **ngôi sao ⭐**, né **tảng đá 🪨**. Nhặt đủ sao là qua cấp; va đá mất 1 tim.',
    ],
  },
  {
    id: 'crowd', name: 'Đám Đông Chạy', icon: ['👥', '🚪', '🏃'], accent: '#FF7A59', cat: ['learn', 'react'],
    needs: 'pose', touch: true, isNew: true,
    tag: 'Bước sang trái hoặc phải chọn cổng để đám đông ngày càng đông!',
    desc: 'Hai cổng hiện ra kèm phép tính (+, ×, −). Bé bước sang trái hoặc phải để chọn cổng làm đám đông đông hơn. Chọn cổng tốt hơn là được điểm; chọn cổng kém hơn mất 1 tim. Rèn so sánh số và tính nhẩm.',
    skill: '🔢 So sánh & tính nhẩm', dist: FULL_BODY,
    how: [
      'Đứng giữa khung hình, cách camera khoảng 2 m.',
      'Hai cổng chạy tới kèm phép tính như **+5** hay **×2**: chọn cổng cho **kết quả lớn hơn**.',
      '**Đứng nửa trái hoặc nửa phải** màn hình để chọn cổng bên đó. Chọn đúng đủ số lần là qua cấp.',
    ],
  },
  {
    id: 'fast', name: 'Tay Nhanh Như Chớp', icon: ['⚡', '🔴', '✋'], accent: '#FF4D5E', cat: ['react', 'learn'],
    needs: 'pose', soft: true, touch: true, isNew: true, players: '1-2',
    tag: 'Nhìn màu được gọi rồi đập thật nhanh đúng chấm tròn màu đó!',
    desc: 'Màn hình gọi tên một màu, nhiều chấm tròn nhiều màu hiện ra. Bé đập thật nhanh đúng chấm có màu được gọi — đập nhầm màu hoặc quá chậm sẽ mất tim. Càng lên cấp chấm càng nhiều, thời gian càng ngắn.',
    skill: '🎨 Màu sắc & tốc độ', dist: FULL_BODY,
    how: [
      'Đứng cách camera khoảng 2 m, hai tay thoải mái.',
      'Đọc màu được gọi ở trên rồi **đập đúng chấm tròn màu đó** bằng tay.',
      'Đập đủ số lần là qua cấp. Đập nhầm màu hoặc hết giờ mất 1 tim.',
    ],
  },
  {
    id: 'slice', name: 'Cắt Trái Cây', icon: ['🍉', '🔪', '🍊'], accent: '#FF8A3D', cat: ['react', 'move'],
    needs: 'pose', soft: true, touch: true, isNew: true, players: '1-2',
    tag: 'Vung tay thật nhanh để cắt trái cây bay lên — đừng cắt quả ớt cay!',
    desc: 'Trái cây bay vút lên từ phía dưới. Bé vung tay thật nhanh qua trái cây để cắt đôi chúng, nước ép bắn tung tóe! Nhớ né quả ớt 🌶️ — cắt trúng ớt là mất 1 tim.',
    skill: '🍉 Phản xạ & vung tay', dist: FULL_BODY,
    how: [
      'Đứng cách camera khoảng 2 m, chừa chỗ để vung tay.',
      '**Vung tay thật nhanh** qua trái cây để cắt (chạm chậm sẽ không cắt được).',
      'Cắt đủ số trái cây là qua cấp. Cắt trúng **quả ớt 🌶️** mất 1 tim.',
    ],
  },
  {
    id: 'whack', name: 'Đập Chuột', icon: ['🐭', '🔨', '🐰'], accent: '#A56B3F', cat: ['react'],
    needs: 'pose', soft: true, touch: true, isNew: true, players: '1-2',
    tag: 'Chuột chui lên thì đập, thỏ chui lên thì đừng đập!',
    desc: 'Chín cái hang, chuột và thỏ con thay nhau chui lên. Bé đập thật nhanh khi thấy chuột nhưng phải nhớ không đập bạn thỏ. Càng lên cấp chuột chui càng nhanh và nhiều.',
    skill: '🔨 Phản xạ & kiềm chế', dist: FULL_BODY,
    how: [
      'Đứng cách camera khoảng 2 m.',
      'Thấy **chuột 🐭** chui lên thì đưa tay **đập** vào hang.',
      '**Đừng đập thỏ 🐰** — đập nhầm thỏ mất 1 tim. Đập đủ số chuột là qua cấp.',
    ],
  },
  {
    id: 'letters', name: 'Bong Bóng Chữ Cái', icon: ['🔤', '🫧', '🐱'], accent: '#5AA9FF', cat: ['learn'],
    needs: 'pose', soft: true, touch: true, isNew: true, players: '1-2',
    tag: 'Chạm vào bong bóng có đúng chữ cái để ghép thành từ!',
    desc: 'Một hình vẽ hiện lên cùng từ cần ghép, ví dụ MÈO. Bé chạm vào các bong bóng chứa đúng chữ cái theo thứ tự để ghép từ. Từ càng lên cấp càng dài; chạm nhầm chữ mất 1 tim.',
    skill: '🔤 Nhận biết chữ cái', dist: FULL_BODY, age: '5–6 tuổi',
    how: [
      'Đứng cách camera khoảng 2 m, đưa tay chạm vào bong bóng.',
      'Nhìn hình và từ ở trên, chạm **đúng chữ cái tiếp theo** (chỗ còn trống _).',
      'Ghép xong từ là sang từ mới. Chạm nhầm chữ mất 1 tim.',
    ],
  },
  {
    id: 'drums', name: 'Trống Trên Không', icon: ['🥁', '🎶', '🙌'], accent: '#B983FF', cat: ['music', 'create'],
    needs: 'pose', soft: true, touch: true, isNew: true, players: '1-2',
    tag: 'Gõ trống bằng hai tay trên không — vui như một ban nhạc!',
    desc: 'Năm chiếc trống hiện trên màn hình. Bé vung tay gõ vào trống để nghe tiếng trống thật vui, làm theo trống đang sáng để ghi điểm và qua cấp. Không bao giờ thua — chỉ cần gõ cho vui!',
    skill: '🎵 Nhịp điệu & phối hợp', dist: FULL_BODY,
    how: [
      'Đứng cách camera khoảng 2 m, hai tay thoải mái.',
      '**Gõ tay vào trống** để nghe âm thanh — gõ trống nào cũng có tiếng.',
      'Gõ **trống đang sáng** để ghi điểm. Đủ điểm là qua cấp, không bao giờ thua.',
    ],
  },
  {
    id: 'keeper', name: 'Thủ Môn Nhí', icon: ['🧤', '⚽', '🥅'], accent: '#2FBF9F', cat: ['react', 'move'],
    needs: 'pose', soft: true, touch: true, isNew: true,
    tag: 'Bóng sút tới khung thành — vươn tay ra chặn bóng!',
    desc: 'Bé làm thủ môn! Quả bóng được sút về phía khung thành, bé vươn hai tay ra chặn lại. Bóng sút càng lúc càng nhanh và vào góc khó hơn. Để bóng vào lưới mất 1 tim.',
    skill: '🧤 Phản xạ & phán đoán', dist: FULL_BODY,
    how: [
      'Đứng cách camera khoảng 2 m, giang tay thoải mái.',
      'Quả bóng bay về phía khung thành — **đưa tay ra đỡ** đúng chỗ bóng sắp tới.',
      'Chặn đủ số bóng là qua cấp. Bóng vào lưới mất 1 tim.',
    ],
  },
  {
    id: 'colormix', name: 'Pha Màu', icon: ['🎨', '🪣', '🌈'], accent: '#FF7EB6', cat: ['learn', 'create'],
    needs: 'pose', soft: true, touch: true, isNew: true,
    tag: 'Giữ tay trên hai hũ sơn để trộn ra màu được yêu cầu!',
    desc: 'Màn hình nêu một màu như CAM, XANH LÁ hay TÍM. Bé đưa tay giữ trên hai hũ sơn đúng màu để đổ vào tô và trộn ra màu mới: đỏ + vàng ra màu cam, vàng + xanh dương ra màu xanh lá…',
    skill: '🌈 Màu sắc & trộn màu', dist: FULL_BODY,
    how: [
      'Đứng cách camera khoảng 2 m, đưa tay lên trước ngực.',
      'Đọc màu cần pha ở trên. **Giữ tay trên một hũ sơn** khoảng nửa giây để đổ vào tô, rồi chọn hũ thứ hai.',
      'Pha đúng màu là ghi điểm; pha sai hoặc hết giờ mất 1 tim.',
    ],
  },
  {
    id: 'trash', name: 'Phân Loại Rác', icon: ['♻️', '🍌', '🗑️'], accent: '#3BC97A', cat: ['learn'],
    needs: 'pose', touch: true, isNew: true,
    tag: 'Cầm rác lên và thả vào đúng thùng: hữu cơ, tái chế hay rác khác!',
    desc: 'Mỗi lần một món rác hiện ra. Bé giơ tay chạm để cầm lên rồi đưa tới đúng thùng: vỏ chuối, rau củ vào thùng hữu cơ; chai, lon, giấy vào thùng tái chế; còn lại là rác khác. Bé học thói quen bảo vệ môi trường.',
    skill: '♻️ Phân loại & bảo vệ môi trường', dist: FULL_BODY,
    how: [
      'Đứng cách camera khoảng 2 m, giơ tay thoải mái.',
      '**Chạm vào món rác** để cầm lên, đưa tay tới thùng rồi thả vào.',
      'Thùng xanh lá: **hữu cơ** (chuối, táo…); thùng xanh dương: **tái chế** (chai, lon, giấy…); thùng xám: **rác khác**.',
    ],
  },
  {
    id: 'brain', name: 'Giơ Tay Trả Lời', icon: ['✋', '🧠', '👨‍👩‍👧'], accent: '#8B6FEA', cat: ['learn', 'multi'],
    needs: 'pose', touch: true, isNew: true, players: '1-3',
    tag: 'Cả nhà cùng đứng trước camera, giơ tay chọn đáp án đúng!',
    desc: 'Tối đa 3 người cùng chơi trên một camera! Câu hỏi hiện ra cùng 3 đáp án; mỗi người giơ tay vào cột đáp án mình chọn và giữ yên. Ai chọn đúng được ngôi sao. Câu hỏi về số, màu sắc, con vật, hình khối, phép tính…',
    skill: '🧠 Kiến thức & chơi cùng nhau', dist: FULL_BODY,
    how: [
      'Đứng cách camera khoảng 2 m; có thể đứng 1–3 người cạnh nhau.',
      'Đọc câu hỏi, **giơ tay lên cao** vào cột có đáp án mình chọn và giữ yên khoảng 1 giây.',
      'Ai chọn đúng được ngôi sao. Chưa ai đúng thì mất 1 tim chung.',
    ],
  },
  {
    id: 'boxer', name: 'Đấm Bốc Theo Nhịp', icon: ['🥊', '🎯', '🥁'], accent: '#E14D5B', cat: ['music', 'react', 'move'],
    needs: 'pose', soft: true, touch: true, isNew: true, age: '5–6 tuổi',
    tag: 'Đấm trúng bia sáng đúng nhịp trống — combo càng cao càng sướng!',
    desc: 'Nhạc trống nổi lên, các bia tròn sáng lần lượt bên trái, bên phải. Bé đấm thật nhanh vào bia đúng nhịp để ghi điểm và nối combo. Nhịp càng lên cấp càng nhanh.',
    skill: '🥊 Nhịp điệu & phản xạ', dist: FULL_BODY,
    how: [
      'Đứng cách camera khoảng 2 m, chừa chỗ để vung tay.',
      'Bia sáng hiện ra kèm một vòng thu nhỏ — **đấm thật nhanh** vào bia khi vòng chạm bia để được **TUYỆT VỜI**.',
      'Đấm đủ số lần là qua cấp. Để trượt bia mất 1 tim.',
    ],
  },
  {
    id: 'coach', name: 'Huấn Luyện Viên', icon: ['🥋', '🥊', '↔️'], accent: '#FF8A3D', cat: ['move', 'react'],
    needs: 'pose', isNew: true,
    tag: 'Nghe huấn luyện viên gọi rồi làm theo: đấm trái, đấm phải, né, cúi!',
    desc: 'Huấn luyện viên gọi từng động tác: đấm tay trái, đấm tay phải, né sang trái, né sang phải, cúi xuống. Bé làm theo thật nhanh khi nghe gọi. Càng lên cấp động tác càng nhiều và gọi càng dồn dập — một buổi tập thể dục vui.',
    skill: '🥋 Nghe & làm theo', dist: FULL_BODY,
    how: [
      'Đứng cách camera khoảng 2 m, chừa chỗ để vung tay.',
      'Đọc (hoặc nghe) lời gọi: **ĐẤM TAY TRÁI**, **ĐẤM TAY PHẢI**, **NÉ TRÁI / PHẢI** (nghiêng người), **CÚI XUỐNG**.',
      'Làm đúng động tác trước khi hết giờ. Chậm quá mất 1 tim.',
    ],
  },
  {
    id: 'brawl', name: 'Đấu Toán', icon: ['👹', '🔢', '🥊'], accent: '#6C5CE7', cat: ['learn', 'react', 'move'],
    needs: 'pose', isNew: true, age: '5–6 tuổi',
    tag: 'Đấm đáp án đúng để hạ trùm, cúi hoặc nhảy để né đòn!',
    desc: 'Trùm xuất hiện cùng một phép tính. Ba đáp án nổi lên — bé đấm vào đáp án đúng để làm trùm mất máu. Thỉnh thoảng trùm ra đòn: đòn trên thì cúi, đòn dưới thì nhảy. Hạ hết máu trùm là qua cấp.',
    skill: '🔢 Tính nhẩm & phản xạ', dist: FULL_BODY,
    how: [
      'Đứng cách camera khoảng 2 m, chừa chỗ để vung tay.',
      'Nhìn phép tính rồi **đấm vào đáp án đúng** trong ba đáp án.',
      'Trùm ra đòn trên thì **cúi xuống**, đòn dưới thì **nhảy lên** để né. Hạ hết máu trùm là qua cấp.',
    ],
  },
  {
    id: 'dodge', name: 'Né Bóng', icon: ['⚽', '🥧', '🛡️'], accent: '#FF6B6B', cat: ['move', 'react'],
    needs: 'pose', isNew: true,
    tag: 'Bóng và bánh bay thẳng vào người — bước sang bên hoặc cúi để né!',
    desc: 'Bóng, bánh kem, cà chua bay thẳng về phía bé. Vòng tròn dưới sàn báo điểm rơi: bé bước sang một bên để né; bóng bay cao thì cúi xuống. Càng lên cấp bóng càng nhanh.',
    skill: '↔️ Né tránh & phản xạ', dist: FULL_BODY,
    how: [
      'Đứng giữa khung hình, cách camera khoảng 2 m, chừa chỗ hai bên để bước.',
      'Nhìn **vòng tròn dưới sàn** báo chỗ bóng sẽ rơi rồi **bước sang bên** để né.',
      'Bóng bay **cao** thì **cúi xuống**; bóng lăn dưới đất thì có thể **nhảy lên**. Bị trúng mất 1 tim.',
    ],
  },
  {
    id: 'squat', name: 'Nhịp Squat', icon: ['🦵', '🎵', '⬇️'], accent: '#2FBF9F', cat: ['music', 'move'],
    needs: 'pose', isNew: true,
    tag: 'Đứng lên, ngồi xuống đúng nhịp trống khi chấm tròn rơi tới vạch!',
    desc: 'Tiếng trống đều đặn, chấm tròn rơi xuống vạch: chấm xanh là đứng thẳng, chấm cam là ngồi xổm. Bé đứng lên ngồi xuống đúng nhịp, nhịp càng nhanh khi lên cấp. Bài tập chân vui nhộn!',
    skill: '🦵 Sức mạnh chân & nhịp', dist: FULL_BODY,
    how: [
      'Đứng cách camera khoảng 2 m sao cho thấy cả người.',
      'Chấm **xanh ⬆** = đứng thẳng, chấm **cam ⬇** = ngồi xổm. Làm đúng khi chấm chạm vạch.',
      'Đúng nhịp đủ số lần là qua cấp. Sai nhịp mất 1 tim.',
    ],
  },
  {
    id: 'hsk', name: 'Đầu Vai Gối Chân', icon: ['🙂', '🤷', '🦵', '🦶'], accent: '#FFB13D', cat: ['music', 'learn', 'move'],
    needs: 'pose', isNew: true,
    tag: 'Nghe gọi “đầu, vai, gối, chân” rồi chạm đúng chỗ — ngày càng nhanh!',
    desc: 'Bài hát quen thuộc thành trò chơi: nghe gọi tên bộ phận cơ thể rồi đưa hai tay chạm đúng chỗ. Lúc đầu gọi theo thứ tự như trong bài, về sau gọi lộn xộn và nhanh dần. Bé học tên các bộ phận cơ thể.',
    skill: '🧍 Nhận biết cơ thể', dist: FULL_BODY,
    how: [
      'Đứng cách camera khoảng 2 m sao cho thấy cả người.',
      'Khi gọi **ĐẦU / VAI / GỐI / CHÂN**, đưa **cả hai tay** chạm vào đúng chỗ đó.',
      'Giữ một chút để máy nhận. Chậm quá mất 1 tim.',
    ],
  },
  {
    id: 'clock', name: 'Đồng Hồ Người', icon: ['🕒', '🙆', '🧒'], accent: '#3C9BFF', cat: ['learn', 'move'],
    needs: 'pose', isNew: true, age: '5–6 tuổi',
    tag: 'Hai cánh tay là kim đồng hồ — dang tay chỉ đúng giờ!',
    desc: 'Bé trở thành chiếc đồng hồ! Máy cho một giờ như 3 giờ hay 6 giờ rưỡi, bé dang hai tay làm kim giờ và kim phút cho đúng. Vừa tập vận động vừa học xem giờ.',
    skill: '🕒 Học xem đồng hồ', dist: FULL_BODY,
    how: [
      'Đứng cách camera khoảng 2 m, chừa chỗ để dang hai tay.',
      'Nhìn đồng hồ và giờ ở trên. **Dang hai tay** thành hai kim: một tay là kim giờ (ngắn), một tay là kim phút (dài).',
      'Ví dụ **3 giờ**: một tay chỉ thẳng lên trên (số 12), tay kia dang ngang sang bên (số 3). Giữ yên một chút để máy chốt.',
    ],
  },
  {
    id: 'clap', name: 'Chim Vỗ Tay', icon: ['🐦', '👏', '🌤️'], accent: '#FFB13D', cat: ['react', 'move'],
    needs: 'pose', touch: true, isNew: true,
    tag: 'Vỗ hai tay vào nhau để chú chim bay lên, luồn qua khe giữa các cột!',
    desc: 'Chú chim nhỏ đang tập bay. Mỗi lần bé vỗ tay, chim vỗ cánh bay lên một chút; bé điều khiển chim bay qua khe hở giữa các cột xanh. Vỗ tay đều tay để chim bay thật khéo!',
    skill: '👏 Nhịp & phối hợp', dist: FULL_BODY,
    how: [
      'Đứng cách camera khoảng 2 m sao cho thấy hai tay.',
      '**Vỗ hai tay vào nhau** — mỗi cái vỗ làm chim bay vọt lên, rồi chim từ từ rơi xuống.',
      'Điều khiển chim luồn qua khe hở giữa các cột. Chạm cột hoặc rơi xuống đất mất 1 tim.',
    ],
  },
  {
    id: 'words', name: 'Nhảy Chữ', icon: ['🪨', '🔤', '🐸'], accent: '#4FB3A8', cat: ['learn', 'move'],
    needs: 'pose', touch: true, isNew: true, age: '5–6 tuổi',
    tag: 'Nhìn hình rồi bước tới viên đá có đúng từ!',
    desc: 'Một hình vẽ hiện lên cùng giọng đọc (nếu máy có tiếng Việt). Bé bước tới viên đá có đúng từ của hình đó — MÈO, CÁ, NHÀ… Lên cấp có thêm nhiều lựa chọn và thời gian ít hơn. Học mặt chữ bằng cả cơ thể.',
    skill: '🔤 Nhận mặt chữ', dist: FULL_BODY,
    how: [
      'Đứng giữa khung hình, cách camera khoảng 2 m, chừa chỗ hai bên để bước.',
      'Nhìn **hình** ở trên (và nghe đọc từ), tìm viên đá có **đúng từ** đó.',
      '**Bước sang viên đá** ấy và đứng yên khoảng 1 giây để chốt đáp án.',
    ],
  },
  {
    id: 'chomp', name: 'Ăn Trái Cây', icon: ['😋', '🍎', '🍌'], accent: '#FF7A59', cat: ['react', 'create'],
    needs: 'face', touch: true, isNew: true,
    tag: 'Há miệng thật to để ăn trái cây rơi xuống — ngậm miệng né ớt cay!',
    desc: 'Trái cây rơi từ trên xuống, bé di chuyển đầu cho miệng nằm dưới trái cây rồi há miệng thật to để “ăn” nó. Nhưng đừng ăn ớt cay hay chú sâu nhé — ngậm miệng lại! Càng lên cấp trái cây càng rơi nhanh.',
    skill: '😮 Phối hợp mặt & phản xạ', dist: NEAR_FACE,
    how: [
      'Ngồi hoặc đứng cách camera khoảng 1 m, đưa khuôn mặt vào giữa khung hình.',
      'Trái cây rơi xuống: **di chuyển đầu** cho miệng nằm gần trái cây rồi **há miệng thật to** để ăn.',
      '**Ngậm miệng** khi ớt 🌶️ hoặc sâu 🐛 tới gần — ăn nhầm mất 1 tim.',
    ],
  },
  {
    id: 'mirror', name: 'Gương Biến Hình', icon: ['🐶', '👑', '🕶️'], accent: '#B983FF', cat: ['create'],
    needs: 'face', touch: true, isNew: true, levels: false,
    tag: 'Hoá trang thành chó, mèo, thỏ, vua, sư tử… ngay trên khuôn mặt mình!',
    desc: 'Chiếc gương thần hoá trang cho bé: tai chó, tai mèo, tai thỏ, vương miện, kính ngầu, bờm sư tử, mũi chú hề… tất cả bám theo khuôn mặt, nghiêng đầu cũng theo. Há miệng to để đổi trang phục. Không có cấp độ — chỉ để vui và quay video!',
    skill: '🪄 Trí tưởng tượng', dist: NEAR_FACE,
    how: [
      'Ngồi hoặc đứng cách camera khoảng 1 m, đưa khuôn mặt vào giữa khung hình.',
      'Chạm vào **trang phục ở dưới** để đổi, hoặc **há miệng thật to khoảng 1 giây** để chuyển sang trang phục tiếp theo.',
      'Cười thật tươi để có hiệu ứng lấp lánh. Có thể quay màn hình để lưu lại khoảnh khắc vui!',
    ],
  },
  {
    id: 'facematch', name: 'Làm Mặt Hề', icon: ['🤪', '😮', '😉'], accent: '#FFB13D', cat: ['create', 'learn'],
    needs: 'face', isNew: true,
    tag: 'Làm đúng biểu cảm của emoji — cười, há miệng, nháy mắt, lè lưỡi!',
    desc: 'Một biểu tượng cảm xúc hiện lên, bé làm mặt giống hệt: cười tươi, há miệng, nháy một mắt, lè lưỡi, chu môi, phồng má… Làm giống là máy chụp lại một tấm ảnh kỷ niệm. Hợp để cả nhà cười thật nhiều!',
    skill: '🤪 Biểu cảm & nhận biết cảm xúc', dist: NEAR_FACE,
    how: [
      'Ngồi hoặc đứng cách camera khoảng 1 m, đưa khuôn mặt vào giữa khung hình.',
      'Nhìn **emoji** và dòng chữ gợi ý rồi **làm mặt giống hệt** — giữ nửa giây để máy chốt.',
      'Làm giống là máy chụp ảnh kỷ niệm. Hết giờ mà chưa giống mất 1 tim.',
    ],
  },
  {
    id: 'fishletters', name: 'Cá Con Bắt Chữ', icon: ['🐟', '🔤', '🫧'], accent: '#3C9BFF', cat: ['learn', 'react'],
    needs: 'face', touch: true, isNew: true, age: '5–6 tuổi',
    tag: 'Há miệng cho cá bơi lên, ngậm miệng cho cá chìm — bắt chữ cái được gọi!',
    desc: 'Chú cá con bơi trong biển chữ cái. Bé há miệng thì cá bơi lên, ngậm miệng thì cá chìm xuống. Nghe gọi một chữ cái rồi điều khiển cá bắt đúng chữ đó, né các chữ khác. Rèn nhận mặt chữ và điều khiển khuôn mặt.',
    skill: '🔤 Chữ cái & điều khiển mặt', dist: NEAR_FACE,
    how: [
      'Ngồi hoặc đứng cách camera khoảng 1 m, đưa khuôn mặt vào giữa khung hình.',
      '**Há miệng** để cá bơi **lên**, **ngậm miệng** để cá chìm **xuống** — há càng to cá lên càng cao.',
      'Bắt đúng **chữ cái được gọi** ở trên màn hình, né các chữ khác. Bắt nhầm chữ mất 1 tim.',
    ],
  },
  {
    id: 'wheel', name: 'Vòng Quay Thần Kỳ', icon: ['🎡', '➕', '🖐️'], accent: '#FF6B9A', cat: ['learn'],
    needs: 'hand', touch: true, isNew: true, age: '5–6 tuổi',
    tag: 'Quay ra phép tính rồi giơ số ngón tay là đáp án!',
    desc: 'Vòng quay thần kỳ quay ra phép cộng, phép trừ, phép nhân hoặc ô thưởng. Bé tính nhẩm rồi giơ đúng số ngón tay làm đáp án — đúng là được 5 điểm. Lên cấp cao có thêm phép nhân và đáp án tới 10.',
    skill: '🔢 Tính nhẩm bằng ngón tay', dist: NEAR,
    how: [
      'Đứng cách camera khoảng 1 m, giơ tay lên trước ngực cho camera thấy rõ.',
      'Vòng quay dừng ở một phép tính (hoặc ô **thưởng ⭐** bảo giơ số ngón tay cho trước).',
      'Tính ra đáp án rồi **giơ đúng số ngón tay** và giữ yên một chút. Số trong góc cho biết máy đếm được mấy ngón.',
    ],
  },
  {
    id: 'draw', name: 'Vẽ Trên Không', icon: ['🎨', '☝️', '🌈'], accent: '#FF8A3D', cat: ['create'],
    needs: 'hand', touch: true, isNew: true, levels: false,
    tag: 'Chỉ một ngón trỏ lên và vẽ tranh ngay trên không trung!',
    desc: 'Bé giơ bàn tay lên rồi chỉ một ngón trỏ để vẽ lên màn hình — xòe tay hay nắm tay thì dừng vẽ. Chạm ngón vào bảng màu bên trái để đổi màu (có cả màu cầu vồng) và chạm miếng bọt biển để xóa. Hai bàn tay vẽ cùng lúc cũng được!',
    skill: '🖌️ Sáng tạo & điều khiển ngón tay', dist: NEAR,
    how: [
      'Đứng cách camera khoảng 1 m, giơ tay lên trước ngực.',
      '**Chỉ một ngón trỏ** (các ngón khác co lại) để vẽ; **xòe tay hoặc nắm tay** để dừng vẽ.',
      'Để ngón tay trên **ô màu** khoảng nửa giây để đổi màu, trên **🧽** để xóa hết.',
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
