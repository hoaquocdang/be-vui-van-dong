'use client';

import { useEffect, useState } from 'react';
import { TRACKERS, type Game } from '@/lib/games';
import { loadEngine, playGame, preloadGame } from '@/lib/engine';
import { store } from '@/lib/util';

/** Khung "Bắt đầu chơi" trên trang của mỗi trò: tuỳ chọn + nút chơi. */
export default function GamePanel({ game }: { game: Game }) {
  const [players, setPlayers] = useState<1 | 2>(1);
  const [ai, setAi] = useState(true);
  const [sens, setSens] = useState<0 | 1 | 2>(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [noCam, setNoCam] = useState(false);

  useEffect(() => {
    setPlayers(store.get('bv_race_pc', '1') === '2' ? 2 : 1);
    setAi(store.get('bv_ai', '1') === '1');
    const s = parseInt(store.get('bv_sens', '1'), 10);
    setSens(s === 0 || s === 2 ? s : 1);
    setNoCam(!navigator.mediaDevices?.getUserMedia);
  }, []);

  // Engine nhỏ nên nạp ngay khi rảnh; bộ nhận diện (chục MB) chỉ tải ngầm sau khi người dùng bắt đầu tương tác với trang.
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 600));
    idle(() => loadEngine().catch(() => {}));
    const evs = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const;
    let done = false;
    const off = () => evs.forEach((e) => window.removeEventListener(e, kick));
    function kick() {
      if (done) return;
      done = true;
      off();
      preloadGame(game.id);
    }
    evs.forEach((e) => window.addEventListener(e, kick, { passive: true }));
    return off;
  }, [game.id]);

  const start = async (touch: boolean) => {
    setErr('');
    setBusy(true);
    try {
      await playGame(game.id, { touch, players, ai, sens });
    } catch {
      setErr('Không tải được phần chơi game. Kiểm tra kết nối mạng rồi thử lại nhé!');
    } finally {
      setBusy(false);
    }
  };

  const showAi = !!game.needs && !!game.soft;
  const showSens = !game.needs || (!!game.soft && !ai);
  const pick = (on: boolean) => 'sbtn' + (on ? ' on' : '');

  return (
    <section className="playBox" aria-label="Bắt đầu chơi">
      {game.players === '1-2' && (
        <div className="sens">
          Số người chơi:
          <button type="button" className={pick(players === 1)} aria-pressed={players === 1} onClick={() => setPlayers(1)}>
            1 người
          </button>
          <button type="button" className={pick(players === 2)} aria-pressed={players === 2} onClick={() => setPlayers(2)}>
            2 người (đứng 2 bên)
          </button>
        </div>
      )}
      {showAi && (
        <div className="sens">
          Chế độ camera:
          <button type="button" className={pick(ai)} aria-pressed={ai} onClick={() => setAi(true)}>
            🦴 AI nhận diện
          </button>
          <button type="button" className={pick(!ai)} aria-pressed={!ai} onClick={() => setAi(false)}>
            📷 Cơ bản
          </button>
        </div>
      )}
      {showSens && (
        <div className="sens">
          Độ nhạy chuyển động:
          {(['Thấp', 'Vừa', 'Cao'] as const).map((t, i) => (
            <button key={t} type="button" className={pick(sens === i)} aria-pressed={sens === i} onClick={() => setSens(i as 0 | 1 | 2)}>
              {t}
            </button>
          ))}
        </div>
      )}
      <div className="btns">
        <button type="button" className="btn" disabled={busy} onClick={() => start(false)}>
          {busy ? 'Đang tải…' : '🎥 Bắt đầu chơi'}
        </button>
        {game.touch && (
          <button type="button" className="btn second" disabled={busy} onClick={() => start(true)}>
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
      {err && (
        <div className="warn" role="alert">
          {err}
        </div>
      )}
    </section>
  );
}
