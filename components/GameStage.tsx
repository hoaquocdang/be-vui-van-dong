'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { STAGE_HTML } from '@/lib/stageHtml';
import { loadEngine } from '@/lib/engine';

/**
 * "Sân khấu" chơi game: canvas, HUD, màn hình tạm dừng / kết thúc / lỗi / chờ.
 * Engine (public/engine) thao tác trực tiếp lên các phần tử này nên React chỉ dựng HTML một lần
 * (dangerouslySetInnerHTML) và không đụng tới nữa. Mặc định ẩn; engine tự hiện khi bắt đầu chơi.
 */
export default function GameStage() {
  const pathname = usePathname();
  // đổi trang (nút Back, bấm liên kết…) khi đang chơi → dừng game và nhả camera
  useEffect(() => {
    const app = window.BVApp;
    if (app && app.state && app.state !== 'menu') app.exit();
  }, [pathname]);
  useEffect(() => {
    window.__bvLoad = loadEngine; // phục vụ kiểm thử tự động
  }, []);
  return <div id="stage" hidden suppressHydrationWarning dangerouslySetInnerHTML={{ __html: STAGE_HTML }} />;
}
