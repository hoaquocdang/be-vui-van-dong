/* TỰ SINH từ scripts/boot.src.js bởi scripts/sync-boot.mjs — đừng sửa tay file này. */
export const BOOT_SCRIPT = String.raw`/* ============================================================
   boot.js — chạy ĐỘC LẬP với React/Next (được nhúng thẳng vào <head> lúc build, viết kiểu ES5 cho máy cũ)
   • nạp engine chơi game khi cần                         • xử lý các nút có thuộc tính data-bv-play
   • tải ngầm engine / bộ nhận diện khi bé bắt đầu đọc    • cảnh báo khi mở trong ứng dụng Zalo / Facebook… (camera thường bị chặn)
   Nhờ vậy nút "Bắt đầu chơi" vẫn bấm được trên máy tính bảng / trình duyệt đời cũ dù phần giao diện React không chạy nổi.
   LƯU Ý: thêm file trò chơi mới → thêm vào FILES (đúng thứ tự: engine.js trước, các games-*.js sau).
   ============================================================ */
(function (w, d) {
  'use strict';
  var FILES = ['track.js', 'engine.js', 'ai-body.js', 'games-lib.js', 'games-body.js', 'games-hand.js', 'games-run.js', 'games-run2.js',
    'games-reach.js', 'games-reach2.js', 'games-fit.js', 'games-fit2.js', 'games-face.js', 'games-hand2.js'];
  var BUILD = '__BUILD__';
  var state = 0;          // 0 chưa nạp · 1 đang nạp · 2 xong
  var waiters = [];

  function ready() { return !!(w.BVApp && w.BVApp.ready); }
  function flush(err) {
    var q = waiters; waiters = [];
    for (var i = 0; i < q.length; i++) { try { if (err) q[i][1](err); else q[i][0](); } catch (e) { /* bỏ qua */ } }
  }
  /** nạp toàn bộ engine (một lần). ok() khi xong, fail(err) khi lỗi mạng */
  w.__bvLoadEngine = function (ok, fail) {
    if (ready()) { if (ok) ok(); return; }
    waiters.push([ok || function () {}, fail || function () {}]);
    if (state === 1) return;
    state = 1;
    var left = FILES.length, failed = false;
    for (var i = 0; i < FILES.length; i++) {
      (function (f) {
        var s = d.createElement('script');
        s.src = '/engine/' + f + '?v=' + BUILD;
        s.async = false;                       // tải song song nhưng chạy đúng thứ tự
        s.onload = function () { if (failed) return; left--; if (left === 0) { state = 2; flush(); } };
        s.onerror = function () { if (failed) return; failed = true; state = 0; flush(new Error('Không tải được ' + f)); };
        d.head.appendChild(s);
      })(FILES[i]);
    }
  };

  function ls(k, def) { try { var v = w.localStorage.getItem(k); return v == null ? def : v; } catch (e) { return def; } }
  function playOpts(touch) {
    var s = parseInt(ls('bv_sens', '1'), 10);
    if (!(s === 0 || s === 1 || s === 2)) s = 1;
    return { touch: touch, players: ls('bv_race_pc', '1') === '2' ? 2 : 1, ai: ls('bv_ai', '1') === '1', sens: s,
      onHome: function () { w.location.href = '/#games'; } };
  }
  function showErr(msg) {
    var el = d.getElementById('bvErr');
    if (!el) { w.alert(msg); return; }
    el.textContent = msg; el.removeAttribute('hidden'); el.style.display = '';
  }
  function start(btn) {
    if (btn.getAttribute('data-busy') === '1') return;
    var id = btn.getAttribute('data-bv-play'), touch = btn.getAttribute('data-bv-touch') === '1';
    var label = btn.textContent;
    btn.setAttribute('data-busy', '1'); btn.textContent = '⏳ Đang tải…';
    var el = d.getElementById('bvErr'); if (el) el.setAttribute('hidden', '');
    function done() { btn.removeAttribute('data-busy'); btn.textContent = label; }
    w.__bvLoadEngine(function () {
      var ok = false;
      try { ok = w.BVApp.play(id, playOpts(touch)); } catch (ex) { done(); showErr('Có lỗi khi mở trò chơi (' + (ex && ex.message) + '). Thử tải lại trang nhé!'); return; }
      done();
      if (!ok) showErr('Không tìm thấy trò chơi này.');
    }, function () { done(); showErr('Không tải được phần chơi game. Kiểm tra kết nối mạng rồi thử lại nhé!'); });
  }

  // bấm vào bất kỳ phần tử nào (hoặc con của nó) có data-bv-play
  d.addEventListener('click', function (e) {
    var t = e.target;
    while (t && t !== d && !(t.getAttribute && t.getAttribute('data-bv-play'))) t = t.parentNode;
    if (!t || t === d) return;
    if (e.preventDefault) e.preventDefault();
    start(t);
  }, false);

  // trang một trò: nạp engine lúc rảnh, tải ngầm bộ nhận diện khi bé bắt đầu tương tác
  function firstPlayId() { var b = d.querySelector('[data-bv-play]'); return b ? b.getAttribute('data-bv-play') : ''; }
  function onReady() {
    var id = firstPlayId();
    if (id) {
      var idle = w.requestIdleCallback || function (cb) { return w.setTimeout(cb, 700); };
      idle(function () { w.__bvLoadEngine(); });
      var evs = ['pointerdown', 'touchstart', 'keydown', 'scroll'], fired = false;
      var kick = function () {
        if (fired) return; fired = true;
        for (var i = 0; i < evs.length; i++) w.removeEventListener(evs[i], kick, true);
        var nav = w.navigator, c = nav && nav.connection;
        if (c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || ''))) return;     // tiết kiệm dữ liệu: không tải ngầm
        w.__bvLoadEngine(function () { if (w.BVApp && w.BVApp.preload) w.BVApp.preload(id); });
      };
      for (var i = 0; i < evs.length; i++) w.addEventListener(evs[i], kick, true);
    }
    // mở trong ứng dụng (Zalo / Facebook / Messenger / Instagram / TikTok…) → camera thường bị chặn
    var ua = (w.navigator && w.navigator.userAgent) || '';
    if (/FBAN|FBAV|FB_IAB|FBIOS|Instagram|Zalo|MicroMessenger|Line\/|Messenger|musical_ly|TikTok|Bytedance|Snapchat/i.test(ua) && d.body) {
      var b = d.createElement('div');
      b.id = 'bvInApp'; b.setAttribute('role', 'alert');
      b.style.cssText = 'position:sticky;top:0;z-index:60;background:#FFF1D6;color:#8A5A12;font:700 14px/1.45 system-ui,sans-serif;padding:10px 14px;text-align:center';
      b.innerHTML = '⚠️ Bạn đang mở trong ứng dụng (Zalo / Facebook…), nơi camera thường bị chặn. Bấm nút <b>⋯</b> rồi chọn <b>“Mở bằng trình duyệt”</b> (Chrome hoặc Safari) để chơi nhé!';
      d.body.insertBefore(b, d.body.firstChild);
    }
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', onReady, false); else onReady();
})(window, document);
`;
