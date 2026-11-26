/* --- Tổng kết --- */
/* Trang Lịch sử hoạt động: mỗi dòng = icon màu theo loại việc + câu mô tả (tên khoản chi và số tiền được tô nổi) + "bởi <người làm> · giờ"; đường nối dạng dòng thời gian; không có bộ lọc */
const LGK = { group: ['i-people', 'cyan', 'nhom'], member: ['i-people', 'cyan', 'nhom'], fund: ['i-wallet', 'yellow', 'tien'], exp: ['i-receipt', 'yellow', 'chi'], del: ['i-trash', 'red', 'chi'], rm: ['i-trash', 'red', 'tien'], pay: ['i-money', 'green', 'tien'], out: ['i-wallet', 'red', 'tien'], role: ['i-swap', 'cyan', 'tien'], tx: ['i-check', 'green', 'tien'], untx: ['i-x', 'mute', 'tien'] };
const lgMark = m => esc(String(m).replace(/"([^"]*)"/g, '“$1”')).replace(/“([^”]*)”/g, '<em>“$1”</em>').replace(/\b\d{1,3}(?:\.\d{3})+\b/g, '<b class="lga">$&</b>');
/* --- Thông báo (Figma 25–27): việc người khác làm có liên quan tới tôi, 30 ngày gần nhất. Tính từ dữ liệu nhóm + lịch sử (g.log có trường n). Đã đọc: lưu mốc thời gian trên máy này --- */
const NSEEN = 'coong_nseen';
const shareMap = (g, e) => { const S = settleExp(g, e), o = {}; if (!(S.total > 0)) return o;
  S.fixed.forEach(f => { if (Number(f.amt) > 0) o[f.id] = Math.round(Number(f.amt)); });
  S.sharers.forEach(id => { o[id] = Math.round((o[id] || 0) + (S.per || 0)); }); return o; };   // phần mỗi người chịu ở một khoản chi
function notifs(){
  const me = myUid(); if (!me || BILL) return [];
  const lim = Date.now() - 30 * 864e5, out = [];
  for (const g of root.groups) { const mm = myMember(g); if (!mm) continue; const mid = mm.id, who = (by, fb) => byName(by, fb, g);
    const addedLater = (g.log || []).some(x => x.n === 'm' && (x.ids || []).includes(mid));
    if (g.by && g.by !== me && !addedLater && (g.at || 0) > lim) out.push({ g, at: g.at, ic: 'i-people', c: 'cyan', who: who(g.by, g.byName), html: `thêm bạn vào nhóm <em>“${esc(g.name)}”</em>` });
    (g.exps || []).forEach(e => { if (!e.by || e.by === me) return; const t = Math.floor(e.id / 1000); if (t < lim || t > Date.now() + 864e5) return;
      const pay = (e.flows || []).filter(f => f.id === mid && f.role === 'pay').reduce(addAmt, 0), sh = shareMap(g, e)[mid] || 0; if (!pay && !sh) return;
      const n = `<em>“${esc(e.name || 'Khoản chi')}”</em>`;
      out.push({ g, at: t, day: isoDay(e.at), ic: 'i-receipt', c: 'yellow', who: who(e.by, e.byName), html: pay ? `ghi bạn ứng <b class="ng">${fmt(pay)}</b> cho ${n}${sh ? ` · bạn chịu <b class="nr">${fmt(sh)}</b>` : ''}` : `thêm khoản chi ${n} · bạn chịu <b class="nr">${fmt(sh)}</b>` }); });
    (g.fund?.adds || []).forEach(a => { if (!a.by || a.by === me || !(a.ct > lim)) return; const p = tps(a).find(x => x.id === mid); if (!p || !(Number(p.amt) > 0)) return;
      out.push({ g, at: a.ct, day: isoDay(a.at || a.ct), ic: 'i-wallet', c: 'yellow', who: who(a.by, a.byName), html: `thêm lần góp quỹ · bạn góp <b class="ny">${fmt(p.amt)}</b>` }); });
    (g.log || []).forEach(x => { if (!x.n || !x.by || x.by === me || x.at < lim) return; const w = who(x.by, x.who), n = `<em>“${esc(x.nm || '')}”</em>`;
      if (x.n === 'e') { const a = x.a?.[mid] || 0, b = x.b?.[mid] || 0; if (!a && !b) return; out.push({ g, at: x.at, day: x.day, ic: 'i-pen', c: 'text-3', who: w, html: `sửa khoản chi ${n} · bạn chịu <b class="nr">${a !== b ? `${fmt(a)} → ${fmt(b)}` : fmt(b)}</b>` }); }
      else if (x.n === 'd') { const a = x.a?.[mid] || 0; if (!a) return; out.push({ g, at: x.at, ic: 'i-x', c: 'red', who: w, html: `xóa khoản chi ${n} · bạn chịu <b class="nm">${fmt(a)}</b>` }); }
      else if (x.n === 't') { if (x.to !== mid || !(g.pays || []).some(p => p.from === x.fr && p.to === x.to && p.amt === x.amt)) return; out.push({ g, at: x.at, ic: 'i-check', c: 'green', who: esc(x.frn || nm(x.fr)), html: `đã chuyển cho bạn <b class="ng">${fmt(x.amt)}</b>`, raw: 1, to: 'sum' }); }
      else if (x.n === 'm') { if (!(x.ids || []).includes(mid)) return; out.push({ g, at: x.at, ic: 'i-people', c: 'cyan', who: w, html: `thêm bạn vào nhóm <em>“${esc(g.name)}”</em>` }); } }); }
  return out.sort((a, b) => b.at - a.at);
}
const notiSeenAt = () => Number(store.get(NSEEN + '_' + myUid())) || 0;
const notiUnread = () => { const s = notiSeenAt(); return notifs().filter(x => x.at > s).length; };
const notiSeen = () => store.set(NSEEN + '_' + myUid(), Date.now());   // mở trang Thông báo = đã đọc hết (chấm vàng vẫn hiện trong lần xem này)
/* Thông báo và Lịch sử hoạt động: các dòng gom theo ngày (Hôm nay, Hôm qua, Thứ hai, 24/11…), mỗi ngày một thẻ */
const WEEKDAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
const hm = t => { const d = new Date(t); return `${p2(d.getHours())}:${p2(d.getMinutes())}`; };
function lgDayLabel(k, withYear){   // withYear: thêm năm khi khác năm nay
  const now = new Date(); if (k === isoDay(now)) return 'Hôm nay'; if (k === isoDay(now.getTime() - 864e5)) return 'Hôm qua';
  const d = new Date(k + 'T00:00'); return `${WEEKDAYS[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}${withYear && d.getFullYear() !== now.getFullYear() ? '/' + d.getFullYear() : ''}`;
}
function lgDays(head, list, row, withYear){
  const days = new Map(); list.forEach(x => { const k = isoDay(x.at); if (!days.has(k)) days.set(k, []); days.get(k).push(x); });
  return `<section class="view">${head}<div class="lgs">${[...days].map(([k, xs]) => `<div class="lgcard"><h2>${lgDayLabel(k, withYear)}</h2><div class="lgl">${xs.map(row).join('')}</div></div>`).join('')}</div></section>`;
}
function notiView(){
  const head = `<header class="ghead shead lgh"><button class="circ back" id="notiBack" aria-label="Quay lại">${svg('i-back')}</button><div class="ttl3"><div class="r1"><h1>Thông báo</h1></div></div></header>`;
  const all = notifs(), seen = notiSeenAt();
  if (!all.length) return `<section class="view">${head}<div class="lgempty"><span class="lgb big" style="--c:var(--text-3)">${ICO_BELL}</span><b>Chưa có thông báo</b><p>Khi có người thêm khoản chi, góp quỹ hay chuyển tiền liên quan đến bạn, thông báo sẽ hiện ở đây.</p></div></section>`;   // Figma 27
  const row = x => `<button class="lg nt ${x.at > seen ? 'new' : ''}" style="--c:var(--${x.c})" data-nopen="${x.g.id}|${x.to || (x.day ? 'cal:' + x.day : 'cal')}"><div class="lgi"><span class="lgb">${svg(x.ic)}</span></div><div class="lgt"><p>${x.raw ? x.who : esc(x.who === 'tôi' ? 'Bạn' : x.who)} ${x.html}</p><small>${esc(x.g.name)} · ${hm(x.at)}</small></div>${x.at > seen ? '<i class="ndot"></i>' : ''}</button>`;
  return lgDays(head, all, row, false);   // Figma 26
}
function lgTarget(g, x){   // bấm một dòng lịch sử / thông báo: mở đúng trang có thay đổi đó (Tổng kết / Kho đồ / ngày trên lịch)
  if (x.go) return x.go; if (x.k === 'tx' || x.k === 'untx' || x.n === 't') return 'sum';
  if (/kho đồ/i.test(x.msg || '')) return 'kho';
  if (x.day) return 'cal:' + x.day;
  const nmq = (String(x.msg || '').match(/"([^"]+)"/) || [])[1], e = nmq && (g.exps || []).find(e => e.name === nmq);   // bản ghi cũ: tìm khoản chi theo tên trong ngoặc kép
  if (e?.at) return 'cal:' + isoDay(e.at);
  if (x.k === 'fund' || x.k === 'group' || x.k === 'member') return 'cal';
  return 'cal:' + isoDay(x.at);
}
function lgGo(t){ if (t === 'sum') { go('sum'); return; } if (t === 'kho') { kAdd = false; kEdit = null; itDraft = null; go('kho'); return; }
  calST = null; calGo = null; calQ = null; calDay = t.startsWith('cal:') ? t.slice(4) : null; go('cal'); }
function logView(){
  const head = `<header class="ghead shead lgh"><button class="circ back" id="logBack" aria-label="Quay lại">${svg('i-back')}</button><div class="ttl3"><div class="r1"><h1>Lịch sử hoạt động</h1></div><span class="sub">${esc(G.name)}</span></div></header>`;
  const all = [...(G.log || [])].sort((a, b) => b.at - a.at || b.id - a.id);
  if (!all.length) return `<section class="view">${head}<div class="lgempty"><span class="lgb big" style="--c:var(--mute)">${svg('i-history')}</span><b>Chưa có hoạt động nào</b><p>Mọi thao tác trong nhóm sẽ được ghi lại ở đây: ai thêm khoản chi, ai ứng tiền, ai đã chuyển khoản…</p></div><p class="lgnote">${svg('i-lock')}<span>Lịch sử được ghi tự động và không ai xóa được.</span></p></section>`;
  const row = x => { const [ic, col] = LGK[x.k] || ['i-history', 'mute'];
    return `<button class="lg lgo" style="--c:var(--${col})" data-lgo="${lgTarget(G, x)}"><div class="lgi"><span class="lgb">${svg(ic)}</span></div><div class="lgt"><p>${x.k ? lgMark(x.msg) : `<b>${esc(x.who || 'Ai đó')}</b> ${lgMark(x.msg)}`}</p><small>${x.k ? `bởi ${esc(x.who || 'Ai đó')} · ` : ''}${hm(x.at)}</small></div></button>`; };   // bấm: mở đúng trang có thay đổi
  return lgDays(head, all, row, true);   // Figma 16: bỏ số hoạt động và dòng ghi chú; chỉ đọc, không có nút xoá/sửa
}
