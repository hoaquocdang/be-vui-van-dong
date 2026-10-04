# Bé Vui Vận Động

Game vận động cho bé 4–6 tuổi chơi qua camera điện thoại / webcam (chiếu lên tivi được). Nhận diện khung xương, bàn tay, khuôn mặt chạy **ngay trên thiết bị** (MediaPipe), không gửi hình đi đâu.

- Site: https://be-vui-van-dong.vercel.app — Next.js 16 (App Router), tự deploy khi `git push` lên `master`.
- 39 trò, mỗi trò 30 cấp (trừ trò sáng tạo). Cách chơi lấy cảm hứng từ các game vận động bằng webcam; toàn bộ mã, hình (emoji + canvas) và chữ tiếng Việt đều tự viết.

## Cấu trúc

| Thư mục | Vai trò |
|---|---|
| `lib/games.ts` | **Nguồn dữ liệu duy nhất** cho phần hiển thị: tên, mô tả, cách chơi, nhóm, icon của từng trò → trang chủ, `/games/[slug]`, sitemap, JSON-LD |
| `app/`, `components/` | Trang Next.js (SSG). `GameStage` dựng sân khấu canvas/HUD một lần, engine tự điều khiển |
| `lib/engine.ts` | Nạp lười các file trong `public/engine/` (thứ tự `FILES` quan trọng), `playGame()` |
| `public/engine/` | Engine chơi game viết bằng JS thuần (các file dùng chung biến global): `engine.js` (vòng lặp, camera, âm thanh, trò cũ), `track.js` (MediaPipe), `ai-body.js` (nhảy/cúi/tạo dáng), `games-lib.js` (tiện ích chung), `games-*.js` (các trò) |
| `public/vendor`, `public/models` | MediaPipe Tasks Vision + model (khung xương, bàn tay, khuôn mặt) tự lưu, không gọi CDN |
| `public/_test` | Bộ test trong trình duyệt (camera giả, bot) — **không commit** |
| `scripts/make_og.py` | Tạo lại `public/og-image.png` khi đổi số lượng trò |

## Thêm một trò mới

1. Viết `registerGame({id, name, needs, soft, motion, touch, trackOpts, begin(), update(dt), draw(), hud(), tap(), ...})` trong một file `public/engine/games-*.js` (xem các trò có sẵn làm mẫu), thêm file vào `FILES` trong `lib/engine.ts`.
2. Thêm một mục cùng `id` vào `lib/games.ts` (tên, mô tả, cách chơi, nhóm…).
3. `npm run build` → chạy `/seo-check` → ghi `.seo-ok` → `git push`.

## Chạy thử

```bash
npm install
npm run dev      # http://localhost:3100
npm run build && npm start
```
