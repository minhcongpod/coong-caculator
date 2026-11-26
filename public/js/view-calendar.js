/* ================= trang nhóm: lịch, thẻ Quỹ chung + Kho đồ, tìm kiếm ================= */
let fundOpen = false;   // thẻ Quỹ chung trên lịch đang xổ chi tiết
/* Lịch nhóm: quỹ chung + kho đồ + lịch tháng; chọn ngày thì thu về 1 tuần và liệt kê các khoản trong ngày */
function dayItems(S){
  const out = [];
  const me = myMember(G)?.id;
  G.exps.forEach(e => { const d = S.detail[e.id]; if (!d || d.total <= 0) return; const ps = e.parts.filter(id => G.members.some(m => m.id === id)), n = ps.length, withMe = me != null && ps.includes(me);   // đếm mọi người tham gia (kể cả người đóng cố định)
    out.push({ k: 'exp', id: e.id, at: e.at, dir: 'out', title: e.name || 'Khoản chi', sub: n && n >= G.members.length ? 'Tất cả nhóm' : withMe ? (n > 1 ? `Bạn và ${n - 1} người khác` : 'Bạn') : n ? `${n} người` : '', amt: d.total }); });   // Figma 15: "Bạn và 2 người khác"
  (G.fund?.adds || []).forEach(a => { const ps = tps(a).filter(p => Number(p.amt) > 0), ou = spons(G.fund).filter(x => x.add === a.id && Number(x.amt) > 0), amt = ps.reduce((t, p) => t + Number(p.amt), 0) + ou.reduce((t, x) => t + Number(x.amt), 0);
    const n = ps.length, withMe = me != null && ps.some(p => p.id === me);   // "Bạn" / "Bạn và N người khác" / "N người"; chỉ có góp ngoài quỹ thì hiện tên người góp ngoài
    const sub = n ? (withMe ? (n > 1 ? `Bạn và ${n - 1} người khác` : 'Bạn') : `${n} người`) : ou.length ? esc(ou.map(x => (x.name || '').trim() || 'Khác').join(', ')) : 'Chưa nhập';
    out.push({ k: 'top', id: a.id, at: a.at, dir: 'in', title: 'Góp quỹ', sub, amt }); });
  (G.items || []).forEach(it => out.push({ k: 'kho', id: it.id, at: it.at, dir: 'out', title: `${fmt(it.qty)} ${it.name}`, sub: 'Kho đồ', amt: Number(it.cost) || 0 }));
  return out.sort((a, b) => (a.at || 0) - (b.at || 0));
}
function fundLines(S){   // Figma 395:4101: góp quỹ + góp thêm gộp một dòng, không ghi chú "n người / n lần / n khoản"
  const f = S.fund, ln = (a, v, c) => `<div class="fl"><span><b>${a}</b></span><b class="${c}">${v}</b></div>`;
  return [...Object.entries(f.sponsors.reduce((o, x) => { const n = spNm(x); o[n] = (o[n] || 0) + (Number(x.amt) || 0); return o; }, {})).map(([n, v]) => ln(esc(n), '+' + fmt(v), 'pos')),   // POD 25/11: góp ngoài quỹ cùng tên gộp một dòng
    ...(f.contrib > 0 ? [ln('Góp quỹ', '+' + fmt(f.contrib), 'pos')] : []),
    ...(Math.round(f.paidIn) ? [f.paidIn > 0 ? ln('Đã nộp vào quỹ', '+' + fmt(f.paidIn), 'pos') : ln('Quỹ đã trả lại', '−' + fmt(-f.paidIn), 'neg')] : []),   // POD 26/11: tiền đã tích chuyển vào / ra Quỹ chung
    ln('Đã chi', (f.spent ? '−' : '') + fmt(f.spent), 'neg')].join('');
}
/* Lịch kiểu iPhone: cuộn dọc (3 tháng trước → hết năm); bấm ngày thì tuần đó trượt lên dưới hàng thứ và hiện các khoản trong ngày; vuốt ngang ở hàng tuần để sang tuần khác */
let calST = null, calGo = null;
const addDays = (iso, n) => { const [y, m, d] = iso.split('-').map(Number), t = new Date(y, m - 1, d + n); return isoDay(t); };
const monLabel = (y, m) => `Tháng ${m + 1}${y !== new Date().getFullYear() ? ' ' + y : ''}`;
const CAL_BACK = 2, CAL_FWD = 2;   // lịch tháng / tuần: không giới hạn (POD 22/11). Vẽ sẵn vài tháng quanh hôm nay, cuộn tới mép thì nạp thêm 12 tháng
let calB = CAL_BACK, calF = CAL_FWD, calOff = 0;
const monIdx = iso => { const [y, m] = iso.split('-').map(Number); const n = new Date(); return (y - n.getFullYear()) * 12 + (m - 1 - n.getMonth()); };
function calFit(iso){ const k = monIdx(iso); if (-k > calB) calB = -k + 1; if (k > calF) calF = k + 1; }   // đảm bảo tháng của ngày iso nằm trong lịch tháng
function calMonths(){ const n = new Date(), out = []; for (let k = -calB; k <= calF; k++) { const d = new Date(n.getFullYear(), n.getMonth() + k, 1); out.push({ y: d.getFullYear(), m: d.getMonth() }); } return out; }
const CAL_WEEK = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(x => `<span>${x}</span>`).join('');   // hàng tên thứ trên lịch tháng / tuần
function fundDonut(f){   // vòng tròn vàng = phần quỹ còn lại / tổng đã góp (thẻ Quỹ chung ở trang lịch và trang Tổng kết)
  const pct = f.put ? Math.max(0, Math.min(1, f.left / f.put)) : 0, C = 2 * Math.PI * 18.15;
  return `<svg class="dn" viewBox="0 0 44 44"><circle cx="22" cy="22" r="18.15" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="7.7"/><circle cx="22" cy="22" r="18.15" fill="none" stroke="#fc0" stroke-width="7.7" stroke-linecap="round" stroke-dasharray="${(pct * C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 22 22)"/></svg>`;
}
function topCards(S){   // thẻ Quỹ chung (vòng tròn, bấm xổ chi tiết) + thẻ Kho đồ: trang nhóm và trang Tổng kết (Figma 13, 24)
  const f = S.fund, donut = fundDonut(f);
  const kc = `<span class="ki">${svg('i-box')}${(G.items || []).length ? `<em>${G.items.length}</em>` : ''}</span><b>Kho đồ</b>`;
  return `<div class="ctop"><div class="qcard ${fundOpen ? 'open' : ''} ${f.left < 0 ? 'neg' : ''}"><button class="qh" data-fundopen2 aria-expanded="${fundOpen}">${donut}<span class="qt"><small>Quỹ chung</small><b data-fv="${Math.round(f.left)}">${f.left < 0 ? '−' : ''}${fmt(Math.abs(f.left))}</b></span>${svg('i-up', 'fcar')}</button>${fundOpen ? `<div class="qls fund"><div class="fls">${fundLines(S)}</div></div>` : ''}</div>
      ${BILL ? `<div class="kcard2">${kc}</div>` : `<button class="kcard2" id="kOpen" aria-label="Kho đồ">${kc}</button>`}</div>`;
}
/* ngày không có khoản nào: icon tròn + câu vui như trang chủ trống; mỗi ngày một câu cố định (không đổi khi vẽ lại) — POD 22/11 */
const CAL_EMPTY = [['i-takeoff', 'Tiêu bớt tiền thôi...']];   // POD 23/11: chỉ một câu cho ngày trống
const calEmpty = iso => { const n = [...String(iso || '')].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7), [ic, t] = CAL_EMPTY[n % CAL_EMPTY.length];
  return `<div class="cempty"><span class="circ">${svg(ic)}</span><p>${t}</p></div>`; };
/* tìm kiếm trong lịch (Figma 527:2809): bấm kính lúp cạnh Hôm nay → ô Tìm kiếm; gõ chữ thì lịch ẩn, hiện các khoản khớp (mới nhất trước) */
let calQ = null;
const fold = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
function calRes(q){
  const k = fold(q).trim(); if (!k) return '';
  const S = settle(G), rows = dayItems(S).filter(x => fold(x.title).includes(k)).reverse();
  if (!rows.length) return `<div class="cempty"><span class="circ">${ICO_SRCH}</span><p>Không tìm thấy khoản nào</p></div>`;
  return rows.map(x => { const t = new Date(x.at || 0), dt = x.at ? `${p2(t.getDate())}/${p2(t.getMonth() + 1)}/${t.getFullYear()}` : '';
    return `<div class="crow"><button class="cent" data-cent="${x.k}:${x.id}">${x.dir === 'in' ? ICO_IN : ICO_OUT}<span class="cx"><b>${esc(x.title)}</b><small>${[dt, x.sub].filter(Boolean).join(' · ')}</small></span><span class="ca ${x.dir === 'in' ? 'pos' : 'neg'}">${fmt(x.amt)}</span>${svg('i-up', 'gchv')}</button></div>`; }).join('');
}
document.addEventListener('input', e => { const t = e.target; if (t.id !== 'calQ') return; calQ = t.value; const r = $('#cRes'); if (r) r.innerHTML = calRes(calQ); t.closest('.mcal')?.classList.toggle('q', !!calQ.trim()); const x = $('[data-cqx]'); if (x) x.hidden = !calQ; });
document.addEventListener('pointerdown', e => { if (e.target.closest?.('[data-cqx]')) e.preventDefault(); });   // bấm nút x: giữ bàn phím, không làm ô tìm mất focus
document.addEventListener('focusout', e => { const t = e.target; if (t.id !== 'calQ' || t.value.trim()) return; setTimeout(() => { if (calQ != null && !calQ.trim() && document.activeElement?.id !== 'calQ' && view === 'cal') { calQ = null; rerender(); } }, 150); });   // ô tìm trống mà rời ô → về lại tiêu đề tháng
document.addEventListener('keydown', e => { if (e.target.id !== 'calQ') return; if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') { calQ = null; rerender(); } });
function calView(){
  const S = settle(G), all = dayItems(S), now = new Date(), td = todayISO(), sel = calDay;
  if (sel) calFit(sel);
  const mark = {}; all.forEach(x => { if (!x.at) return; (mark[isoDay(x.at)] ||= {})[x.dir] = 1; });
  const cell = (iso, d) => `<button class="cd ${iso === sel ? 'sel' : ''} ${iso === td ? 'today' : ''}" data-cday="${iso}" aria-label="Ngày ${d} tháng ${+iso.slice(5, 7)}"><b>${d}</b><i>${mark[iso]?.out ? '<u class="o"></u>' : ''}${mark[iso]?.in ? '<u class="g"></u>' : ''}</i></button>`;
  let title, body;
  if (!sel) {
    title = `<span class="cmn" id="cmTitle">${monLabel(now.getFullYear(), now.getMonth())}</span>`;
    body = `<div class="cwk">${CAL_WEEK}</div>
      <div class="cscroll" id="cScroll">${calMonths().map(({ y, m }) => {
        const lead = (new Date(y, m, 1).getDay() + 6) % 7, dim = new Date(y, m + 1, 0).getDate(), cells = Array(lead).fill(0).concat(Array.from({ length: dim }, (_, i) => i + 1)); while (cells.length % 7) cells.push(0);
        const wk = []; for (let i = 0; i < cells.length; i += 7) wk.push(cells.slice(i, i + 7));
        return `<section class="cmon" data-mon="${y}-${m}"><h3>${monLabel(y, m)}</h3>${wk.map(w => `<div class="cweek">${w.map(d => d ? cell(`${y}-${p2(m + 1)}-${p2(d)}`, d) : '<span class="cd none"></span>').join('')}</div>`).join('')}</section>`;
      }).join('')}</div>`;
  } else {
    const [sy, sm, sd] = sel.split('-').map(Number), dow = (new Date(sy, sm - 1, sd).getDay() + 6) % 7, mon = addDays(sel, -dow);
    title = `<button class="cmn cmb" data-cfull aria-label="Xem cả tháng">${svg('i-back')}${monLabel(sy, sm - 1)}</button>`;   // Figma 15: mũi tên ‹ trước tên tháng, bấm để về cả tháng
    const rows = all.filter(x => x.at && isoDay(x.at) === sel);
    body = `<div class="cwk">${CAL_WEEK}</div>
      <div class="cgrid cswipe"><div class="cweek">${[0, 1, 2, 3, 4, 5, 6].map(i => { const iso = addDays(mon, i); return cell(iso, +iso.slice(8)); }).join('')}</div></div>
      <div class="cscroll ctl">${rows.length ? rows.map(x => { const t = new Date(x.at);
        return `<div class="crow"><span class="ct">${p2(t.getHours())}:${p2(t.getMinutes())}</span><button class="cent" data-cent="${x.k}:${x.id}">${x.dir === 'in' ? ICO_IN : ICO_OUT}<span class="cx"><b>${esc(x.title)}</b>${x.sub ? `<small>${x.sub}</small>` : ''}</span><span class="ca ${x.dir === 'in' ? 'pos' : 'neg'}">${fmt(x.amt)}</span>${svg('i-up', 'gchv')}</button></div>`; }).join('') : calEmpty(sel)}</div>`;
  }
  const cr = G.by ? byName(G.by, G.byName, G) : '';
  return `<section class="view cview">
    <header class="ghead gh"><button class="circ back" id="gBack" aria-label="Quay lại">${svg('i-back')}</button><div class="ttl"><h1>${esc(G.name)}</h1><small>${G.members.length} người${cr ? ` · Tạo bởi ${esc(cr)}` : ''}</small></div><div class="pill2"><button id="gLog" aria-label="Lịch sử hoạt động">${svg('i-history')}</button><button data-edit="${G.id}" aria-label="Chỉnh sửa nhóm">${svg('i-pen')}</button></div></header>
    ${topCards(S)}
    <div class="mcal ${calQ != null && calQ.trim() ? 'q' : ''}">${calQ != null ? `<div class="cmh csq">${ICO_SRCH}<input id="calQ" type="search" value="${esc(calQ)}" placeholder="Tìm kiếm" autocomplete="off" enterkeyhint="search" aria-label="Tìm kiếm khoản chi, góp quỹ"><button class="cqx" data-cqx aria-label="Xoá chữ tìm kiếm" ${calQ ? '' : 'hidden'}>${svg('i-x')}</button></div>` : `<div class="cmh"><span class="cmt">${title}</span><span class="cmr"><button class="ctoday" data-ctoday>Hôm nay</button><i class="cvl"></i><button class="csb" data-csearch aria-label="Tìm kiếm">${ICO_SRCH}</button></span></div>`}${body}${calQ != null ? `<div class="cscroll ctl cres" id="cRes">${calRes(calQ)}</div>` : ''}</div>
  </section>`;
}
function calAfter(){   // sau khi vẽ lịch: đặt vị trí cuộn của lịch tháng (mặc định tháng hiện tại, 2 tháng trước nằm phía trên)
  const sc = $('#cScroll'); if (!sc) return;
  const blk = k => sc.querySelector(`[data-mon="${k}"]`), n = new Date(), cur = blk(`${n.getFullYear()}-${n.getMonth()}`);
  if (calGo && blk(calGo)) { sc.scrollTop = blk(calGo).offsetTop + calOff; calGo = null; calOff = 0; }
  else if (calST != null) sc.scrollTop = calST;
  else if (cur) sc.scrollTop = cur.offsetTop;
  calTitle(sc);
}
function calTitle(sc){ const t = $('#cmTitle'); if (!t) return; let pick = null; sc.querySelectorAll('.cmon').forEach(b => { if (!pick && b.offsetTop + b.offsetHeight > sc.scrollTop + 40) pick = b; }); if (pick) { const [y, m] = pick.dataset.mon.split('-').map(Number); t.textContent = monLabel(y, m); } }
document.addEventListener('wheel', e => { const sc = e.target.closest?.('.cscroll'); if (!sc || e.ctrlKey || sc.scrollHeight <= sc.clientHeight) return; e.preventDefault(); sc.scrollTop += e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY; }, { passive: false });   // chuột/trackpad cuộn được lịch và danh sách khoản trong ngày
let calMore = false;
document.addEventListener('scroll', e => { const s = e.target; if (s?.id === 'cScroll') { calST = s.scrollTop; calTitle(s); calExtend(s); } }, true);
function calExtend(sc){   // cuộn gần mép trên / dưới lịch tháng: nạp thêm 12 tháng, giữ nguyên chỗ đang xem
  if (calMore) return; const up = sc.scrollTop < 300, dn = sc.scrollTop + sc.clientHeight > sc.scrollHeight - 300; if (!up && !dn) return;
  const first = [...sc.querySelectorAll('.cmon')].find(b => b.offsetTop + b.offsetHeight > sc.scrollTop); if (!first) return;
  calMore = true; requestAnimationFrame(() => {
    calGo = first.dataset.mon; calOff = sc.scrollTop - first.offsetTop; calST = null;
    if (up) calB += 12; if (dn) calF += 12; rerender(); calMore = false; });
}
function calSlide(dir){   // vuốt ngang ở hàng tuần: dir = +1 tuần sau, -1 tuần trước (ngày đang chọn dời đúng 7 ngày)
  if (!calDay) return; const nd = addDays(calDay, 7 * dir);   // không giới hạn tuần (POD 22/11); lịch tháng tự nới ra để chứa ngày này
  calFit(nd); calDay = nd; rerender();
  if (RMO) return; const w = $('.cgrid .cweek'); w?.animate([{ transform: `translateX(${dir * 60}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 280, easing: 'cubic-bezier(.2,.8,.2,1)' });
  $('.ctl')?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240 });
}
(() => { let sx = 0, sy = 0, on = false;
  document.addEventListener('pointerdown', e => { on = !!(view === 'cal' && calDay && e.target.closest?.('.cswipe')); sx = e.clientX; sy = e.clientY; });
  document.addEventListener('pointerup', e => { if (!on) return; on = false; const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) calSlide(dx < 0 ? 1 : -1); });
  document.addEventListener('pointercancel', () => { on = false; }); })();
