'use client';

import { useEffect, useState } from 'react';
import { CATS, GAMES } from '@/lib/games';
import { store } from '@/lib/util';
import GameCard from './GameCard';

/** Lưới trò chơi có lọc theo nhóm; hiện cấp cao nhất của bé (đọc từ localStorage sau khi tải trang). */
export default function GameGrid() {
  const [cat, setCat] = useState<string>('all');
  const [best, setBest] = useState<Record<string, string>>({});

  useEffect(() => {
    const b: Record<string, string> = {};
    for (const g of GAMES) {
      const v = parseInt(store.get('bv_best_' + g.id, '0'), 10) || 0;
      if (v > 0) b[g.id] = '🏆 Cấp cao nhất: ' + v + (v >= 30 ? ' 🎉' : '');
    }
    const l = parseInt(store.get('bv_race_left', '0'), 10) || 0;
    const r = parseInt(store.get('bv_race_right', '0'), 10) || 0;
    if (l + r > 0) b.race = (b.race ? b.race + ' • ' : '') + '👫 Trái ' + l + ' – ' + r + ' Phải';
    setBest(b);
  }, []);

  const list = GAMES.filter((g) => cat === 'all' || g.cat.includes(cat as never));
  return (
    <>
      <div className="cats" role="group" aria-label="Lọc theo nhóm trò chơi">
        {CATS.map((c) => (
          <button key={c.id} type="button" className={'cat' + (cat === c.id ? ' on' : '')} aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
            {c.icon} {c.name}
          </button>
        ))}
      </div>
      <div className="gameGrid">
        {list.map((g) => (
          <GameCard key={g.id} g={g} best={best[g.id]} />
        ))}
      </div>
    </>
  );
}
