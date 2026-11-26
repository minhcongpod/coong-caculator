/* ================= helpers ================= */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const txKey = t => `${t.from}>${t.to}:${t.amount}`;   // khoá đánh dấu đã chuyển (G.done)
const fmt = n => Math.round(n || 0).toLocaleString('vi-VN');
const parseMoney = v => Number(String(v).replace(/\D/g,'')) || 0;
const addAmt = (t, x) => t + (Number(x.amt) || 0);   // dùng với .reduce(addAmt, 0): cộng tiền một danh sách khoản
/* Khung 390 giống Coong cafe: điện thoại thì phóng theo bề ngang 390, màn lớn thì khung 390×700 vừa chiều cao cửa sổ */
const COARSE = matchMedia('(pointer:coarse)').matches;   // điện thoại/máy tính bảng: có bàn phím ảo che màn hình
function fitZoom(){
  const de = document.documentElement, w = innerWidth, h = innerHeight;
  const z = w <= 500 ? w / 390 : Math.min(w / 390, h / 844);   // máy tính / máy tính bảng: khung 390×844 vừa cửa sổ
  de.style.zoom = z; de.style.setProperty('--vh', (h / z) + 'px'); de.style.setProperty('--z', z);
  de.style.setProperty('--fx', Math.max(0, (w / z - 390) / 2) + 'px');
  /* app ghim ra màn hình chính (iOS 26): trang KHÔNG cuộn được thì iOS chỉ vẽ tới ~50px trên đáy (thanh nút bị đẩy lên / bị cắt); trang cuộn được (như Tổng kết) thì vẽ kín màn hình.
     → mọi trang cao ít nhất bằng màn hình + 1px (--sh, body min-height) để trang nào cũng như Tổng kết */
  const sa = navigator.standalone || matchMedia('(display-mode: standalone)').matches, portrait = matchMedia('(orientation: portrait)').matches;
  const full = Math.max(h, sa && COARSE ? (portrait ? Math.max(screen.width, screen.height) : Math.min(screen.width, screen.height)) : h);
  de.style.setProperty('--sh', (full / z) + 'px');
  requestAnimationFrame(() => { let pr = document.getElementById('fxProbe'); if (!pr) { pr = document.createElement('div'); pr.id = 'fxProbe'; pr.style.cssText = 'position:fixed;top:0;bottom:0;left:0;width:1px;visibility:hidden;pointer-events:none'; document.body.appendChild(pr); }
    /* app ghim ra màn hình chính: cả màn hình là của app, nhưng iOS (26) báo innerHeight / đáy lớp cố định hụt ~50px so với đáy thật khi trang cuộn được → lấy chiều cao màn hình (screen) làm đáy thật, như Coong cafe lấp kín màn hình */
    /* POD 23/11 (iPhone Pro Max mất nút + / Tổng kết tới khi F5): đo lúc bàn phím đang mở / đang đóng thì hụt cả trăm px → thanh nút bị kéo xuống khỏi màn hình.
       Chỉ đo khi không có ô nào đang gõ và bàn phím đã đóng hẳn; lệch quá 80px là số đo sai, bỏ qua (giữ 0) */
    const vv = window.visualViewport, a = document.activeElement, typing = a?.matches?.('input:not([type=checkbox]):not([type=date]),textarea') && a.isConnected, kbOpen = vv && innerHeight - vv.height > 80;
    if (typing || kbOpen) return;
    const d = full / z - pr.offsetHeight; de.style.setProperty('--fxb', (d > 1 && d <= 80 ? d : 0) + 'px'); });   // iPhone (app lưu ra màn hình): đáy lớp cố định nằm cao hơn đáy màn hình → kéo thanh nút / bảng xuống cho đúng   // lề hai bên khung: thanh nút, bảng, hộp thoại không tràn ra ngoài khung 390
}
fitZoom(); addEventListener('resize', fitZoom);
/* Học Coong cafe (khung luôn lấp kín innerHeight, thanh tab sát đáy): đo lại đáy khung vài lần sau khi mở / đổi viền trình duyệt / quay lại app, vì iPhone (app ghim ra màn hình) lúc mới mở báo chiều cao khác lúc ổn định → thanh nút bị cách đáy một khoảng lớn. Không đo lúc bàn phím đang mở. */
const refit = () => { if (!document.body.classList.contains('kb')) fitZoom(); };
['pageshow', 'load', 'orientationchange'].forEach(t => addEventListener(t, () => { refit(); setTimeout(refit, 300); setTimeout(refit, 1200); }));
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { refit(); setTimeout(refit, 300); } });
window.visualViewport?.addEventListener('resize', () => setTimeout(refit, 120));
setTimeout(refit, 150); setTimeout(refit, 800);
if (/[?&]debug\b/.test(location.search)) {   // ?debug: hiện số đo khung trên màn hình để chẩn đoán dải đen dưới bảng trên iPhone
  const pr = document.createElement('div'); pr.style.cssText = 'position:fixed;left:0;right:0;bottom:0;height:0;padding-bottom:env(safe-area-inset-bottom,0px);visibility:hidden'; document.body.appendChild(pr);
  const dv = document.createElement('div'); dv.style.cssText = 'position:fixed;left:8px;top:60px;z-index:99;background:#f0f;color:#000;font:11px/14px monospace;padding:4px 6px;border-radius:6px;white-space:pre;pointer-events:none'; document.body.appendChild(dv);
  setInterval(() => { const vv = visualViewport, sh = document.querySelector('#sheetBody'), r = sh && !document.querySelector('#sheet').hidden ? sh.getBoundingClientRect() : null;
    dv.textContent = `inner ${innerWidth}x${innerHeight} vv ${Math.round(vv.width)}x${Math.round(vv.height)} off ${Math.round(vv.offsetTop)}\nscreen ${screen.width}x${screen.height} client ${document.documentElement.clientHeight}\nsafeB ${pr.offsetHeight} zoom ${document.documentElement.style.zoom} fxb ${getComputedStyle(document.documentElement).getPropertyValue('--fxb')} probe ${document.getElementById('fxProbe')?.offsetHeight}\nstandalone ${navigator.standalone || matchMedia('(display-mode:standalone)').matches}\nsheetBottom ${r ? Math.round(r.bottom) : '-'} scrollY ${Math.round(scrollY)}`; }, 400);
}
const svg = (id, cls='') => `<svg class="${cls}"><use href="#${id}"/></svg>`;
const low = s => String(s).trim().toLowerCase();
const FUND = -1;
/* cách vừa bấm: chạm tay → ô nhập nổi trên bàn phím (như mobile); chuột → nhập thẳng trong card (desktop) */
let lastPtr = '';
document.addEventListener('pointerdown', e => { lastPtr = e.pointerType || ''; }, true);
const touchNow = () => lastPtr ? lastPtr !== 'mouse' : COARSE;
const isSp = id => typeof id === 'string' && id.startsWith('sp:'), spNm = x => (x.name || '').trim() || 'Khác';   // POD 25/11: khoản góp ngoài quỹ làm người ứng tiền, id 'sp:<tên>'
const itPays = it => Array.isArray(it.pays) && it.pays.length ? it.pays : [{ id: it.payer ?? FUND, amt: Number(it.cost) || 0 }];   // POD 25/11: đồ có thể nhiều người ứng tiền (it.pays [{id, amt}]); it.payer = người đầu, cho dữ liệu cũ
const spItems = (g, n, exceptIt) => (g.items || []).reduce((t, it) => t + (it.id === exceptIt ? 0 : itPays(it).reduce((u, p) => u + (p.id === 'sp:' + n ? Number(p.amt) || 0 : 0), 0)), 0);   // đồ mua bằng tiền góp ngoài quỹ: tiền ra ngay lúc mua
const spBack = (g, L, n) => L.reduce((t, e) => t + useFlows(g, e).reduce((u, f) => u + (f.id === 'sp:' + n ? Number(f.amt) || 0 : 0), 0), 0);   // người tham gia trả lại phần đồ (mua bằng tiền góp ngoài) đã dùng
const spLeft = (g, n, except, exceptIt) => spons(g.fund).filter(x => spNm(x) === n).reduce(addAmt, 0) - spItems(g, n, exceptIt) + spBack(g, g.exps.filter(e => e.id !== except), n) - g.exps.reduce((t, e) => t + (e.id === except ? 0 : e.flows.reduce((u, f) => u + (f.id === 'sp:' + n && f.role === 'pay' ? Number(f.amt) || 0 : 0), 0)), 0);
const nm = id => id === FUND ? 'Quỹ chung' : isSp(id) ? id.slice(3) : G.members.find(m => m.id === id)?.name || '?';
const ROLE_RANK = { pay: 0, donate: 1, fixed: 2 };   // khung ứng tiền luôn nằm trên tài trợ, trên đóng cố định
const toast = msg => { const t = $('#toast'); t.textContent = msg; t.classList.remove('act'); t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 2200); };
const toastAct = (msg, label, fn, ms = 5000) => { const t = $('#toast'); t.innerHTML = `<span>${esc(msg)}</span><button type="button" class="tact">${esc(label)}</button>`; t.classList.add('on', 'act');   // thông báo kèm nút (Hoàn tác)
  t.querySelector('.tact').onclick = ev => { ev.stopPropagation(); clearTimeout(toast.h); t.classList.remove('on', 'act'); fn(); };
  clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on', 'act'), ms); };
const p2 = n => String(n).padStart(2, '0');
const isoDay = t => { const d = new Date(t); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`; };
const byDate = a => [...a].sort((x, y) => (x.at || 0) - (y.at || 0) || x.id - y.id);
