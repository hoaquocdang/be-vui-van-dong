import Link from 'next/link';
import TvGuide from './TvGuide';

export default function Header() {
  return (
    <header className="topbar">
      <div className="topin">
        <Link className="brand keep" href="/" aria-label="Bé Vui Vận Động – trang chủ">
          <span className="lg" aria-hidden="true">
            🤸
          </span>
          <span>Bé Vui Vận Động</span>
        </Link>
        <nav className="nav" aria-label="Điều hướng">
          <Link href="/#games" className="keep">
            Trò chơi
          </Link>
          <Link href="/#cach-choi">Cách chơi</Link>
          <TvGuide>Chiếu lên tivi</TvGuide>
          <Link href="/#hoi-dap">Hỏi đáp</Link>
        </nav>
      </div>
    </header>
  );
}
