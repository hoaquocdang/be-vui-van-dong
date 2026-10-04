import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { CSSProperties } from 'react';
import GameCard from '@/components/GameCard';
import GamePanel from '@/components/GamePanel';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import { CATS, GAMES, gameById, playersLabel, richParts, trackerChip, type Game } from '@/lib/games';
import { SITE, abs, fitDesc, pageMeta } from '@/lib/site';
import { hexA } from '@/lib/util';

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return GAMES.map((g) => ({ slug: g.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const g = gameById(slug);
  if (!g) return {};
  const title = `${g.name} | Game vận động cho bé qua camera`;
  const m = pageMeta(title, fitDesc(`${g.tag} ${g.desc}`), `/games/${g.id}`);
  m.title = { absolute: title }; // đã đủ tên trò + chủ đề, không thêm hậu tố thương hiệu cho khỏi dài quá 60 ký tự
  return m;
}

const LEARN: Record<string, string> = {
  move: 'Vận động thô, thăng bằng và sự dẻo dai',
  learn: 'Tư duy, đếm số, ghi nhớ và nhận biết',
  react: 'Phản xạ nhanh và phối hợp tay – mắt',
  music: 'Cảm nhận nhịp điệu và âm nhạc',
  create: 'Trí tưởng tượng và sự sáng tạo',
  multi: 'Chơi cùng bạn bè, anh chị em, bố mẹ',
};

function Rich({ text }: { text: string }) {
  return (
    <>
      {richParts(text).map((p, i) => (p.b ? <b key={i}>{p.t}</b> : <span key={i}>{p.t}</span>))}
    </>
  );
}

export default async function GamePage({ params }: Props) {
  const { slug } = await params;
  const g = gameById(slug);
  if (!g) notFound();
  const game: Game = g;

  const related = [...GAMES.filter((x) => x.id !== game.id && x.cat.some((c) => game.cat.includes(c))), ...GAMES.filter((x) => x.id !== game.id)]
    .filter((x, i, a) => a.findIndex((y) => y.id === x.id) === i)
    .slice(0, 4);
  const artStyle = { '--tint': hexA(game.accent, 0.16), '--tint2': hexA(game.accent, 0.4), fontSize: game.icon.length >= 3 ? 52 : 76 } as CSSProperties;
  const catNames = game.cat.map((c) => CATS.find((k) => k.id === c)).filter(Boolean);

  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'VideoGame',
        '@id': abs(`/games/${game.id}#game`),
        url: abs(`/games/${game.id}`),
        name: game.name,
        description: `${game.tag} ${game.desc}`,
        genre: ['Educational', 'Kids', 'Motion'],
        gamePlatform: 'Web Browser',
        playMode: game.players && game.players !== '1' ? ['SinglePlayer', 'MultiPlayer'] : 'SinglePlayer',
        audience: { '@type': 'PeopleAudience', suggestedMinAge: 4, suggestedMaxAge: 6 },
        inLanguage: 'vi',
        applicationCategory: 'GameApplication',
        operatingSystem: 'Any',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'VND' },
        isPartOf: { '@id': abs('/#website') },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: SITE.name, item: abs('/') },
          { '@type': 'ListItem', position: 2, name: 'Trò chơi', item: abs('/#games') },
          { '@type': 'ListItem', position: 3, name: game.name, item: abs(`/games/${game.id}`) },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={ld} />
      <Header />
      <main className="hub">
        <nav className="crumbs" aria-label="Đường dẫn">
          <Link href="/">Trang chủ</Link>
          <span aria-hidden="true">›</span>
          <Link href="/#games">Trò chơi</Link>
          <span aria-hidden="true">›</span>
          <span aria-current="page">{game.name}</span>
        </nav>

        <section className="gpHead">
          <div className="gpArt" style={artStyle} aria-hidden="true">
            {game.icon.map((e, i) => (
              <span key={i}>{e}</span>
            ))}
          </div>
          <div className="gpInfo">
            <h1>{game.name}</h1>
            <p className="lead">
              {game.tag} {game.desc}
            </p>
            <div className="chips">
              <span className="chip">{trackerChip(game)}</span>
              <span className="chip">{game.skill}</span>
              {game.levels !== false && <span className="chip">🏁 30 cấp</span>}
              <span className="chip">{playersLabel(game)}</span>
              <span className="chip">👶 {game.age ?? '4–6 tuổi'}</span>
            </div>
          </div>
        </section>

        <GamePanel game={game} />

        <section className="hubSec" aria-labelledby="howH">
          <h2 className="sec" id="howH">
            Cách chơi {game.name}
          </h2>
          <ol className="how">
            {game.how.map((h, i) => (
              <li key={i}>
                <Rich text={h} />
              </li>
            ))}
          </ol>
        </section>

        <section className="hubSec">
          <div className="twoCol">
            <div className="infoCard">
              <h3>🧒 Bé luyện được gì?</h3>
              <ul>
                {game.cat.map((c) => (
                  <li key={c}>{LEARN[c]}</li>
                ))}
                <li>
                  {game.skill.replace(/^\S+\s/, '')} — {catNames.map((c) => c!.name).join(', ')}
                </li>
              </ul>
            </div>
            <div className="infoCard">
              <h3>🛋️ Chuẩn bị trước khi chơi</h3>
              <ul>
                <li>📏 {game.dist}.</li>
                <li>💡 Phòng đủ sáng, đừng đứng ngược sáng trước cửa sổ.</li>
                <li>👕 Áo khác màu nền, trong khung hình chỉ có người chơi.</li>
                <li>
                  📱 Dựng điện thoại nằm ngang, camera trước hướng về phía bé.{' '}
                  <Link href="/#chieu-tivi">Xem cách chiếu lên tivi</Link> cho cả nhà cùng xem.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="hubSec" aria-labelledby="moreH">
          <h2 className="sec" id="moreH">
            Trò chơi khác
          </h2>
          <div className="gridSm">
            {related.map((x) => (
              <GameCard key={x.id} g={x} />
            ))}
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
