/* ================= điều hướng + vẽ trang (go, render), chuyển động, thanh nút dưới ================= */
let userMoved = false, sumGuardUntil = 0;   // người dùng vừa tự vuốt/cuộn: đừng kéo trang về đầu nữa
['touchstart', 'wheel', 'keydown', 'mousedown'].forEach(t => addEventListener(t, () => { userMoved = true; }, { capture: true, passive: true }));
/* Trong ~1,8 giây đầu của trang Tổng kết, bất cứ thứ gì cuộn trang xuống (iPhone tự cuộn, hàm đóng ô nhập khôi phục vị trí cũ…) đều bị kéo về đầu, trừ khi người dùng tự vuốt */
const sumGuard = () => { if (view === 'sum' && !userMoved && performance.now() < sumGuardUntil && (scrollY > 0 || (visualViewport && visualViewport.offsetTop > 1))) window.scrollTo(0, 0); };
addEventListener('scroll', sumGuard, { passive: true }); visualViewport?.addEventListener('scroll', sumGuard); visualViewport?.addEventListener('resize', sumGuard);
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
function go(v){
  if (v === 'sum') document.activeElement?.blur?.();   // đang gõ dở thì hạ bàn phím ngay, khỏi để iPhone tự cuộn trang lại
  view = v; entering = true; render(); window.scrollTo({ top: 0 });
  if (v === 'sum') {   // iPhone (nhất là app thêm ra màn hình chính) có thể cuộn trang xuống lại sau khi bàn phím hạ / thanh trình duyệt co lại → kéo về đầu thêm vài lần cho tới khi người dùng tự vuốt
    userMoved = false; sumGuardUntil = performance.now() + 1800;
    [60, 160, 350, 700, 1200].forEach(ms => setTimeout(() => { if (view === 'sum' && !userMoved && (scrollY > 0 || (visualViewport && visualViewport.offsetTop > 1))) window.scrollTo({ top: 0 }); }, ms));
  }
}
const rerender = () => { const y = scrollY; render(); window.scrollTo({ top: y }); };   // vẽ lại, giữ nguyên vị trí cuộn
/* chuyển động như app Coong cafe: vào trang thì các khối hiện dần từ trên xuống (riêng tiêu đề trang `header` đứng yên, không nháy: POD 21/11); thêm gì mới thì cái mới nảy vào */
const RMO = matchMedia('(prefers-reduced-motion: reduce)').matches;
let entering = true, sumEnter = false;   // sumEnter: vừa bấm Tổng kết → chạy hiệu ứng vào trang tổng kết (khối hiện dần, số chạy lên, thanh quỹ chạy)
const ENTER_SEL = '#app .view > :not(header):not(.fstack):not(.stack):not(.welcome):not(#exps), #app .fstack > *, #exps > *, #app .stack > *, #app .ill > *, #app .hello, #bar > *';
const KEYED = '#app .exp[data-exp], #app [data-fdel], #app [data-sdel], #app .flow, #app .kform, #app .krow2';
function keyOf(el){
  if (el.matches('.exp')) return 'e' + el.dataset.exp;
  if (el.matches('.kform')) return 'k' + (kEdit || 'new');
  if (el.matches('.krow2')) return 'r' + el.dataset.kedit;
  if (el.dataset.fdel) return 'm' + el.dataset.fdel;
  if (el.dataset.sdel) return 's' + el.dataset.sdel;
  return 'f' + (el.closest('[data-exp]')?.dataset.exp || '') + ':' + (el.querySelector('.who b')?.textContent || '');
}
const pop = (el, d = 0) => el.animate([{ opacity: 0, translate: '0 16px', scale: .97 }, { opacity: 1, translate: '0 0', scale: 1 }], { duration: 520, delay: d, easing: 'cubic-bezier(.34,1.4,.64,1)', fill: 'backwards' });
/* Số chạy lên: giữ nguyên định dạng đang hiện (+86K, −13K, 1.234K, 1.160.000, 12,5K), đếm từ 0 tới đúng giá trị, cuối cùng trả lại đúng chữ gốc */
function countUp(el, ms = 650, delay = 0){
  const txt = el.textContent.trim(), m = txt.match(/^([+−-]?)(\d[\d.]*)(?:,(\d+))?(K?)$/); if (!m) return;
  const dec = m[3] ? m[3].length : 0, n = parseFloat(m[2].replace(/\./g, '') + (m[3] ? '.' + m[3] : '')); if (!n) return;
  const sep = x => x.replace(/\B(?=(\d{3})+(?!\d))/g, '.'), show = v => { const f = dec ? v.toFixed(dec).split('.') : [String(Math.round(v))]; return m[1] + sep(f[0]) + (dec ? ',' + f[1] : '') + m[4]; };
  const t0 = performance.now() + delay; el.textContent = show(0);
  const step = now => { const t = Math.min(1, Math.max(0, (now - t0) / ms)); el.textContent = t >= 1 ? txt : show(n * (1 - Math.pow(1 - t, 3))); if (t < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
function sumFx(){   // trang Tổng kết: số Quỹ chung + dòng Quỹ còn chạy lên, thanh quỹ chạy từ 0 (các khối hiện dần do animIn lo, như mọi trang)
  document.querySelectorAll('.sumv .fund .top b').forEach(el => countUp(el, 700, 150));
  document.querySelectorAll('.sumv .tbl tr.fin td:not(:first-child)').forEach((el, i) => countUp(el, 650, 450 + Math.min(i, 8) * 40));
  document.querySelectorAll('.sumv .fund .fbar i').forEach(el => { const w = el.style.width; if (w) el.animate([{ width: '0%' }, { width: w }], { duration: 800, delay: 200, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }); });
}
function animIn(before){
  const sumIn = view === 'sum' && (entering || sumEnter); sumEnter = false;
  if (RMO || !Element.prototype.animate) { entering = false; return; }
  if (entering || sumIn) { entering = false; let k = 0;
    document.querySelectorAll(ENTER_SEL).forEach(el => { if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return; if (el.getBoundingClientRect().top > innerHeight) return; pop(el, 60 + Math.min(k++, 12) * 45); });
    if (sumIn) sumFx();
    return; }
  if (before) document.querySelectorAll(KEYED).forEach(el => { if (!before.has(keyOf(el))) pop(el.dataset.sdel ? el.closest('.frow') || el : el); });
}
let txPin = null;   // POD 25/11: tích ở Ai chuyển cho ai thì dòng giữ nguyên chỗ, chỉ sắp xếp lại khi F5 hoặc vào lại trang Tổng kết
function render(){ unlift();
  const before = entering ? null : new Set([...document.querySelectorAll(KEYED)].map(keyOf));
  const app = $('#app');
  if (view === 'home' && !BILL && !root.acct?.uid) { adraft = { from: 'home', name: '', avatar: '' }; onbSt = { h: '', st: 'empty' }; lgErr = ''; view = 'login'; }   // chưa có tài khoản: trang Đăng nhập (Figma 510:6457)   // v2: bỏ trang Xin chào, khách mới vào thẳng trang tạo tài khoản
  if (view === 'home' && !BILL && root.acct?.uid) view = 'list';   // v2: có tài khoản thì trang chủ là danh sách nhóm (Figma 397:783); chưa có thì trang chào
  if (['group', 'cal', 'kho'].includes(view) && (!G || !root.groups.includes(G))) view = 'list';
  if (G && view === 'cal') store.set(LAST, G.id);
  if (BILL && BILL.st !== 'ok') app.innerHTML = billMsg();
  else if (view === 'home') app.innerHTML = homeView();
  else if (view === 'list') app.innerHTML = listView();
  else if (view === 'cal') app.innerHTML = calView();
  else if (view === 'kho') app.innerHTML = kvView();
  else if (view === 'acct') app.innerHTML = acctView();
  else if (view === 'onb') app.innerHTML = onbView();
  else if (view === 'login') app.innerHTML = loginView();
  else if (view === 'pin') app.innerHTML = pinView();
  else if (view === 'log') app.innerHTML = logView();
  else if (view === 'noti') { app.innerHTML = notiView(); notiSeen(); }
  else if (view === 'form') app.innerHTML = formView();
  else if (view === 'sum') { if (txPin && (txPin.v !== 'sum' || txPin.gid !== G?.id)) txPin = null; R = settle(G); app.innerHTML = sumView(); if (!BILL) ensureBill(G); }
  if (view !== 'sum' && txPin) txPin.v = view;   // rời trang Tổng kết: lần vào lại sắp xếp lại card Ai chuyển cho ai
  renderBar(); if ($('#sheet').hidden) document.body.classList.remove('sheetdrag');
  kbSync(); document.body.classList.toggle('kbbar', false); document.body.classList.toggle('barshow', view === 'form'); cmpPlace();
  if (view === 'home' && !BILL) fitWelcome();
  if (view === 'form') sizeAmts();
  fundAnim(); animIn(before); kbSync(); if (view === 'cal') calAfter(); if (view === 'acct') fitOname(); if (view === 'login') lgLook(adraft?.name); if (view === 'onb' || view === 'login') { fitOname(); $('#aName')?.focus({ preventScroll: true }); } if (view === 'pin') $('#pinIn')?.focus({ preventScroll: true });   // bật sẵn bàn phím để nhập tên (iPhone chỉ bật khi có chạm trước đó)
}
/* POD 26/11: số Quỹ chung chạy từ số cũ tới số mới khi có người nộp vào quỹ / quỹ trả lại (hoặc quỹ đổi vì lý do khác) */
const fundPrev = {}; let fundRun = null;   // fundRun: hiệu ứng đang chạy; trang vẽ lại giữa chừng (tích xong tự chốt sổ, đồng bộ...) thì chạy tiếp trên thẻ mới
function fundAnim(){
  const els = () => [...document.querySelectorAll('.qt b[data-fv]')], gid = G?.id; if (!els().length || gid == null) return;
  const to = Number(els()[0].dataset.fv), from = fundPrev[gid]; fundPrev[gid] = to;
  const txt = v => (v < 0 ? '−' : '') + fmt(Math.abs(Math.round(v / 1000) * 1000)), bump = up => els().forEach(el => { el.classList.remove('fvup', 'fvdn'); void el.offsetWidth; el.classList.add(up ? 'fvup' : 'fvdn'); });
  if (fundRun && fundRun.gid === gid && fundRun.to === to) { const r = fundRun; els().forEach(el => { el.textContent = txt(r.cur); el.classList.add(r.to > r.from ? 'fvup' : 'fvdn'); }); return; }   // đang chạy dở: giữ số đang chạy trên thẻ vừa vẽ lại
  if (from == null || from === to || matchMedia('(prefers-reduced-motion: reduce)').matches) { fundRun = null; return; }
  const start = fundRun && fundRun.gid === gid ? fundRun.cur : from;   // đang chạy mà số lại đổi: chạy tiếp từ số đang hiện
  const r = fundRun = { gid, from: start, to, cur: start, t0: performance.now() }, D = 500;
  bump(to > start); els().forEach(el => { el.textContent = txt(start); });
  const step = now => { if (fundRun !== r) return; const k = Math.min(1, (now - r.t0) / D), e = 1 - Math.pow(1 - k, 3); r.cur = k < 1 ? r.from + (r.to - r.from) * e : r.to;
    els().forEach(el => { el.textContent = txt(r.cur); }); if (k < 1) requestAnimationFrame(step); else fundRun = null; };
  requestAnimationFrame(step);
}
/* ô số tiền trong form quỹ co theo nội dung, để tên cách số đúng 8px */
const mctx = document.createElement('canvas').getContext('2d');
function sizeAmt(el){ const cs = getComputedStyle(el); mctx.font = el.value ? `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}` : `500 16px ${cs.fontFamily}`;   /* ô trống: đo theo chữ gợi ý "Nhập số tiền" 16px */ el.style.width = Math.ceil(mctx.measureText(el.value || el.placeholder || '0').width + 2) + 'px'; }
function sizeAmts(){ document.querySelectorAll('.frow input:not(.bname)').forEach(sizeAmt); }
document.addEventListener('input', e => { const t = e.target; if (t.matches?.('.frow input:not(.bname)')) requestAnimationFrame(() => sizeAmt(t)); });
document.fonts?.ready.then(() => { if (view === 'form') sizeAmts(); });
function fitWelcome(){
  const sec = $('.home0'), il = $('.ill'), st = $('.steps'), bt = $('#startBtn'); if (!sec || !il || !st || !bt) return;
  const Z = parseFloat(document.documentElement.style.zoom) || 1, lim = bt.getBoundingClientRect().top - 44;
  il.style.zoom = 1;
  sec.style.minHeight = Math.max(0, (lim - sec.getBoundingClientRect().top - scrollY) / Z) + 'px';   // trang xin chào vừa khít trên nút, không phải cuộn
  const need = (st.getBoundingClientRect().bottom + scrollY - lim) / Z, h = il.offsetHeight;
  il.style.zoom = Math.min(.78, need > 0 ? Math.max(.5, (h - need) / h) : 1).toFixed(3);   // minh hoạ thu nhỏ còn 78% cho thoáng; màn thấp thì nhỏ hơn nữa cho vừa
}
const billMsg = () => `<section class="view"><header class="logo"><svg class="wm" viewBox="0 0 135 27" role="img" aria-label="Coong Nợ"><use href="#i-logo"/></svg></header><p class="note">${{ load: 'Đang tải bill…', none: 'Không tìm thấy bill này. Có thể nhóm đã đổi tên hoặc đã bị xoá.', err: 'Chưa tải được bill. Kiểm tra mạng rồi mở lại link.' }[BILL.st]}</p></section>`;
function renderBar(){
  const b = $('#bar');
  if (BILL) b.innerHTML = `<button class="btn yel" id="tryNew">Trải nghiệm Coong Nợ mới</button>`;
  else if (view === 'home') b.innerHTML = `<button class="btn" id="startBtn">Bắt đầu ngay!</button>`;
  else if (view === 'onb') b.innerHTML = '';
  else if (view === 'form') b.innerHTML = '';
  else if (view === 'list') b.innerHTML = root.groups.length ? `<button class="btn" id="newGroup">${svg('i-plus')}Tạo nhóm mới</button>` : '';
  else if (['group', 'cal'].includes(view)) b.innerHTML = `<button class="fab" id="fabAdd" aria-label="Thêm khoản chi hoặc góp quỹ">${svg('i-plus')}</button><button class="btn" id="toSum">Tổng kết</button>`;
  else if (view === 'sum') b.innerHTML = `<button class="btn" id="dlImg">${svg('i-img')}Tải ảnh</button><button class="btn yel" id="shareBill">${svg('i-share')}Chia sẻ</button>`;
  else b.innerHTML = '';
}
