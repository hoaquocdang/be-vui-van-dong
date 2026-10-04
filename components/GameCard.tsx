import Link from 'next/link';
import type { CSSProperties } from 'react';
import { trackerChip, type Game } from '@/lib/games';
import { hexA } from '@/lib/util';

/** Thẻ trò chơi (dùng ở trang chủ và phần "Trò chơi khác"). */
export default function GameCard({ g, best }: { g: Game; best?: string }) {
  const style = { '--accent': g.accent, '--tint': hexA(g.accent, 0.16), '--tint2': hexA(g.accent, 0.4) } as CSSProperties;
  return (
    <Link href={`/games/${g.id}`} className="gcard" style={style}>
      <div className="gArt" aria-hidden="true">
        {g.icon.map((e, i) => (
          <span key={i}>{e}</span>
        ))}
      </div>
      {g.isNew && <span className="gNew">MỚI</span>}
      {g.levels !== false && <span className="gLv">30 cấp</span>}
      <div className="gBody">
        <h3 className="gName">{g.name}</h3>
        <p className="gDesc">{g.tag}</p>
        <div className="gChips">
          <span className="chip">{trackerChip(g)}</span>
          <span className="chip sk">{g.skill}</span>
        </div>
        <div className="gBest" hidden={!best}>
          {best}
        </div>
      </div>
    </Link>
  );
}
