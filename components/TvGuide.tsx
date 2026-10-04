'use client';

import { useRef, type ReactNode } from 'react';

/** Nút + hộp thoại hướng dẫn chiếu game lên tivi. */
export default function TvGuide({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className={className} onClick={() => ref.current?.showModal()}>
        {children}
      </button>
      <dialog
        ref={ref}
        className="dlg"
        aria-labelledby="tvTitle"
        onClick={(e) => {
          if (e.target === ref.current) ref.current?.close();
        }}
      >
        <div className="card" style={{ textAlign: 'left' }}>
          <p className="dlgTitle" id="tvTitle">Chiếu game lên tivi 📺</p>
          <div className="step">
            <span className="sicon">🤖</span>
            <div>
              <b>Điện thoại Android</b>
              <p>
                Vuốt từ trên xuống mở Cài đặt nhanh → chọn <b>Trình chiếu / Cast / Smart View</b> → chọn tivi. Rồi dựng điện thoại dưới tivi,
                camera trước hướng về phía người chơi.
              </p>
            </div>
          </div>
          <div className="step">
            <span className="sicon">🍏</span>
            <div>
              <b>iPhone / iPad</b>
              <p>
                Mở Trung tâm điều khiển → <b>Phản chiếu màn hình</b> (AirPlay) → chọn tivi. Tivi cần hỗ trợ AirPlay 2 hoặc có Apple TV.
              </p>
            </div>
          </div>
          <div className="step">
            <span className="sicon">💻</span>
            <div>
              <b>Laptop + cáp HDMI</b>
              <p>Mở trang web trên laptop có webcam, cắm HDMI sang tivi, chọn chế độ nhân đôi màn hình.</p>
            </div>
          </div>
          <div className="tipbox">
            💡 Xoay ngang điện thoại trước khi chiếu • đứng cách camera 1,5–2 m • phòng đủ sáng • game không nhận bé → thử &quot;Camera cơ bản&quot; hoặc tăng
            độ nhạy ở trang giới thiệu của trò.
          </div>
          <button type="button" className="btn" onClick={() => ref.current?.close()}>
            Đã hiểu
          </button>
        </div>
      </dialog>
    </>
  );
}
