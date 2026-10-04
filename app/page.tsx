import type { Metadata } from 'next';
import Link from 'next/link';
import GameGrid from '@/components/GameGrid';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import TvGuide from '@/components/TvGuide';
import { FAQ } from '@/lib/faq';
import { GAMES } from '@/lib/games';
import { SITE, abs } from '@/lib/site';

export const metadata: Metadata = {
  title: { absolute: SITE.title },
  description: SITE.description,
  alternates: { canonical: '/' },
};

const DECO: [string, string, string, string, string][] = [
  ['🎈', '6%', '0s', '15s', '44px'],
  ['🍎', '20%', '4s', '18s', '34px'],
  ['⭐', '38%', '9s', '16s', '40px'],
  ['🍓', '62%', '2s', '19s', '36px'],
  ['🎈', '78%', '6s', '14s', '46px'],
  ['🍊', '90%', '11s', '17s', '34px'],
];

export default function Home() {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': abs('/#website'),
        url: abs('/'),
        name: SITE.name,
        description: SITE.description,
        inLanguage: 'vi',
      },
      {
        '@type': 'ItemList',
        name: 'Danh sách trò chơi vận động cho bé',
        itemListElement: GAMES.map((g, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(`/games/${g.id}`), name: g.name })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      },
    ],
  };

  return (
    <>
      <JsonLd data={graph} />
      <div className="deco" aria-hidden="true">
        {DECO.map(([e, x, d, t, s], i) => (
          <span key={i} style={{ '--x': x, '--d': d, '--t': t, '--s': s } as React.CSSProperties}>
            {e}
          </span>
        ))}
      </div>
      <Header />
      <main className="hub">
        <section className="hero" id="top">
          <h1>Chơi game bằng chính cơ thể bé!</h1>
          <p className="lead">
            Chỉ cần camera điện thoại hoặc webcam: bé nhảy, giơ tay, đếm ngón tay, làm mặt hề… game <b>nhìn thấy hết</b> và biến thành trò chơi.{' '}
            {GAMES.length} trò, mỗi trò 30 cấp tự khó dần.
          </p>
          <div className="cta">
            <Link className="btn" href="/#games">
              ▶ Chơi ngay
            </Link>
            <TvGuide className="btn second">📺 Cách chiếu lên tivi</TvGuide>
          </div>
          <ul className="trust">
            <li>🆓 Miễn phí</li>
            <li>📲 Không cần cài app</li>
            <li>🔒 Hình camera chỉ xử lý trên máy</li>
            <li>👶 Dành cho bé 4–6 tuổi</li>
          </ul>
        </section>

        <section className="hubSec" id="games" aria-labelledby="gamesH">
          <h2 className="sec" id="gamesH">
            Chọn trò chơi
          </h2>
          <p className="secSub">
            Bấm vào một trò để xem cách chơi. Trò có nhãn <b>🦴 Khung xương</b>, <b>✋ Bàn tay</b>, <b>🙂 Khuôn mặt</b> dùng AI nhận diện ngay trên máy; trò{' '}
            <b>📷 Chuyển động</b> chạy được trên cả máy yếu.
          </p>
          <GameGrid />
        </section>

        <section className="hubSec" id="cach-choi" aria-labelledby="howH">
          <h2 className="sec" id="howH">
            Chơi như thế nào?
          </h2>
          <div className="steps3">
            <div className="stp">
              <span className="big" aria-hidden="true">
                📷
              </span>
              <h3>
                <span className="n">1</span>Mở camera
              </h3>
              <p>
                Chọn một trò rồi bấm <b>Bắt đầu chơi</b>, cho phép trình duyệt dùng camera. Hình ảnh được xử lý ngay trên máy, không gửi đi đâu.
              </p>
            </div>
            <div className="stp">
              <span className="big" aria-hidden="true">
                📏
              </span>
              <h3>
                <span className="n">2</span>Đứng đúng chỗ
              </h3>
              <p>
                Cách camera khoảng 1,5–2 m để thấy cả người bé (trò bàn tay và khuôn mặt thì lại gần, khoảng 1 m). Phòng đủ sáng, áo khác màu nền.
              </p>
            </div>
            <div className="stp">
              <span className="big" aria-hidden="true">
                🎮
              </span>
              <h3>
                <span className="n">3</span>Vận động &amp; chơi
              </h3>
              <p>Game nhìn khung xương, bàn tay, khuôn mặt của bé và phản hồi ngay. Qua cấp là tự động khó hơn, không cần chọn độ khó.</p>
            </div>
          </div>
        </section>

        <section className="hubSec" id="loi-ich" aria-labelledby="benH">
          <h2 className="sec" id="benH">
            Vì sao bé mê, bố mẹ yên tâm?
          </h2>
          <div className="benefits">
            <div className="ben">
              <span className="big" aria-hidden="true">
                💪
              </span>
              <b>Vận động thật sự</b>
              <p>Nhảy, cúi, chạy tại chỗ, giơ tay, đứng một chân — bé tiêu hao năng lượng thay vì ngồi yên trước màn hình.</p>
            </div>
            <div className="ben">
              <span className="big" aria-hidden="true">
                🧠
              </span>
              <b>Vừa chơi vừa học</b>
              <p>Đếm ngón tay và phép cộng trừ, ghép đôi, nhận biết màu sắc, bắt chước tư thế, nhận biết trái phải.</p>
            </div>
            <div className="ben">
              <span className="big" aria-hidden="true">
                👫
              </span>
              <b>Cả nhà cùng chơi</b>
              <p>Chế độ 2 người đứng hai bên camera để thi chạy vượt chướng ngại. Chiếu lên tivi cho cả nhà cùng xem.</p>
            </div>
            <div className="ben">
              <span className="big" aria-hidden="true">
                🔒
              </span>
              <b>Riêng tư &amp; không quảng cáo</b>
              <p>Không đăng nhập, không quảng cáo. Hình camera chỉ nằm trên máy của bạn, không lưu và không gửi đi.</p>
            </div>
          </div>
        </section>

        <section className="hubSec" id="hoi-dap" aria-labelledby="faqH">
          <h2 className="sec" id="faqH">
            Câu hỏi thường gặp
          </h2>
          <div className="faq">
            {FAQ.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
