'use client';

import { useEffect, useState } from 'react';
import { TRACKERS, type Game } from '@/lib/games';
import { store } from '@/lib/util';

/**
 * Khung "Bắt đầu chơi" trên trang của mỗi trò: tuỳ chọn + nút chơi.
 * Hai nút chơi KHÔNG dùng onClick của React: chúng mang thuộc tính data-bv-play và được lib/boot.js (chạy độc lập) xử lý,
 * nhờ đó vẫn bấm được trên máy tính bảng / trình duyệt cũ mà phần giao diện React không chạy nổi.
 * Các tuỳ chọn lưu ngay vào localStorage để boot.js đọc lúc bấm.
 */
export default function GamePanel({ game }: { game: Game }) {
  const [players, setPlayers] = useState<1 | 2>(1);
  const [ai, setAi] = useState(true);
  const [sens, setSens] = useState<0 | 1 | 2>(1);
  const [noCam, setNoCam] = useState(false);

  useEffect(() => {
    setPlayers(store.get('bv_race_pc', '1') === '2' ? 2 : 1);
    setAi(store.get('bv_ai', '1') === '1');
    const s = parseInt(store.get('bv_sens', '1'), 10);
    setSens(s === 0 || s === 2 ? s : 1);
    setNoCam(!navigator.mediaDevices?.getUserMedia);
  }, []);

  const pickPlayers = (n: 1 | 2) => {
    setPlayers(n);
    store.set('bv_race_pc', String(n));
  };
  const pickAi = (v: boolean) => {
    setAi(v);
    store.set('bv_ai', v ? '1' : '0');
  };
  const pickSens = (i: 0 | 1 | 2) => {
    setSens(i);
    store.set('bv_sens', String(i));
  };

  const showAi = !!game.needs && !!game.soft;
  const showSens = !game.needs || (!!game.soft && !ai);
  const pick = (on: boolean) => 'sbtn' + (on ? ' on' : '');

  return (
    <section className="playBox" aria-label="Bắt đầu chơi">
      {game.players === '1-2' && (
        <div className="sens">
          Số người chơi:
          <button type="button" className={pick(players === 1)} aria-pressed={players === 1} onClick={() => pickPlayers(1)}>
            1 người
          </button>
          <button type="button" className={pick(players === 2)} aria-pressed={players === 2} onClick={() => pickPlayers(2)}>
            2 người (đứng 2 bên)
          </button>
        </div>
      )}
      {showAi && (
        <div className="sens">
          Chế độ camera:
          <button type="button" className={pick(ai)} aria-pressed={ai} onClick={() => pickAi(true)}>
            🦴 AI nhận diện
          </button>
          <button type="button" className={pick(!ai)} aria-pressed={!ai} onClick={() => pickAi(false)}>
            📷 Cơ bản
          </button>
        </div>
      )}
      {showSens && (
        <div className="sens">
          Độ nhạy chuyển động:
          {(['Thấp', 'Vừa', 'Cao'] as const).map((t, i) => (
            <button key={t} type="button" className={pick(sens === i)} aria-pressed={sens === i} onClick={() => pickSens(i as 0 | 1 | 2)}>
              {t}
            </button>
          ))}
        </div>
      )}
      <div className="btns">
        <button type="button" className="btn" data-bv-play={game.id} data-bv-touch="0">
          🎥 Bắt đầu chơi
        </button>
        {game.touch && (
          <button type="button" className="btn second" data-bv-play={game.id} data-bv-touch="1">
            👆 Chơi bằng chạm
          </button>
        )}
      </div>
      <p className="note">
        📏 {game.dist}
        {game.needs ? ` • ⬇️ Lần đầu tải bộ ${TRACKERS[game.needs].label} khoảng ${TRACKERS[game.needs].mb} MB (chỉ một lần).` : ''}
      </p>
      {noCam && (
        <div className="warn">
          Trình duyệt này chưa hỗ trợ camera. Hãy mở bằng Chrome, Safari hoặc Edge bản mới{game.touch ? ', hoặc bấm “Chơi bằng chạm”' : ''}.
        </div>
      )}
      <div id="bvErr" className="warn" role="alert" hidden />
    </section>
  );
}
