/* --- v2: trang Thêm / Sửa khoản chi và Góp thêm (toàn trang, Figma 421:1216) --- */
let asd = null;
const atFor = day => day === todayISO() ? Date.now() : new Date(day + 'T12:00:00').getTime();
const itemLeftX = (it, eid) => Number(it.qty) - itemUsed(G, it.id) + (((G.exps.find(x => x.id === eid)?.use || []).find(u => u.item === it.id)?.qty) || 0);
function addSheet(tab, edit){
  const mem = G.members.filter(m => !m.left), day0 = (view === 'cal' && calDay) || todayISO();
  asd = { tab, edit: null, name: '', day: day0, who: tab === 'exp' && !edit ? mem.map(m => m.id) : [], fl: [], tot: 0, use: {}, amt: {}, out: [], nw: { name: '', amt: 0 } };
  if (edit && tab === 'exp') { const e = G.exps.find(x => x.id === edit); if (!e) { asd = null; return; }
    Object.assign(asd, { edit: e.id, name: e.name || '', day: isoDay(e.at), who: e.parts.filter(id => mem.some(m => m.id === id)), fl: e.flows.filter(f => f.id === FUND || isSp(f.id) || mem.some(m => m.id === f.id)).map(f => ({ ...f, ...(isSp(f.id) ? { man: true } : {}) })) });
    asd.tot = asd.fl.filter(f => f.role === 'pay').reduce((t, f) => t + (Number(f.amt) || 0), 0);
    (e.use || []).forEach(u => { asd.use[u.item] = Number(u.qty) || 0; }); asd.ro = !canExp(e); }   // không phải người tạo: chỉ xem (POD 25/11)
  if (edit && tab === 'top') { const a = (G.fund?.adds || []).find(x => x.id === edit); if (!a) { asd = null; return; }
    asd.edit = a.id; asd.ro = !canTop(a); asd.day = isoDay(a.at || Date.now()); tps(a).forEach(p => { asd.who.push(p.id); asd.amt[p.id] = Number(p.amt) || 0; }); asd.eq = asd.who.length > 1 && new Set(asd.who.map(w => asd.amt[w])).size === 1;   // mọi người góp bằng nhau: mở lại vẫn ở chế độ Góp đều nhau
    asd.out = spons(G.fund).filter(x => x.add === a.id).map(x => ({ name: x.name || '', amt: Number(x.amt) || 0 })); }
  drawAdd(); }
/* Figma 510:7947: nhập Số tiền một lần. 1 người ứng: người đó ứng cả số tiền. Từ 2 người: dòng ứng tiền đầu tiên (Rút quỹ nếu có) tự nhận phần còn lại */
const flRank = f => isSp(f.id) ? -2 : f.id === FUND ? -1 : ROLE_RANK[f.role];
function expFlows(d){
  const mem = G.members.filter(m => !m.left), fl = d.fl.filter(f => f.id === FUND || isSp(f.id) || mem.some(m => m.id === f.id)).map(f => ({ ...f, amt: Number(f.amt) || 0 })).sort((a, b) => flRank(a) - flRank(b));
  /* POD 25/11: góp ngoài quỹ như một khoản đóng cố định (số hồng, nhập được): chưa nhập thì tự lấy min(số tiền chi, số còn lại); phần còn thiếu dồn cho Rút quỹ / người ứng chọn đầu tiên */
  let left = Number(d.tot) || 0; const sp = fl.filter(f => isSp(f.id)), rest = fl.filter(f => !isSp(f.id));
  sp.forEach(f => { f.role = 'pay'; if (!f.man) f.amt = Math.max(0, Math.min(left, spLeft(G, f.id.slice(3), d.edit))); left -= f.amt; });
  if (rest.length === 1) { rest[0].role = 'pay'; rest[0].amt = left; return fl; }
  const a = rest.find(f => f.role === 'pay');
  if (a) a.amt = left - rest.filter(f => f !== a && f.role === 'pay').reduce((t, f) => t + f.amt, 0);
  return fl;
}
const expAuto = d => { const fl = expFlows(d), rest = fl.filter(f => !isSp(f.id)); return fl.length > 1 && rest.length ? rest.find(f => f.role === 'pay') || null : null; };
const spMsg = d => { const fl = expFlows(d), tot = Number(d.tot) || 0, o = fl.find(f => isSp(f.id) && f.amt > spLeft(G, f.id.slice(3), d.edit) + 0.5);
  if (o) return `${nm(o.id)} chỉ còn ${fmt(Math.max(0, spLeft(G, o.id.slice(3), d.edit)))}`;
  if (fl.length && fl.every(f => isSp(f.id)) && fl.reduce((t, f) => t + f.amt, 0) < tot - 0.5) return 'Chọn thêm người ứng tiền';
  return ''; };
const spOver = d => !!spMsg(d);
const expPayOk = d => { const fl = expFlows(d), tot = Number(d.tot) || 0; if (!tot) return true; if (fl.length && fl.every(f => isSp(f.id))) return true; const a = fl.find(f => !isSp(f.id) && f.role === 'pay'); return !!a && a.amt >= 0; };
const tmpExp = d => ({ id: -1, parts: d.who, flows: expFlows(d), use: Object.entries(d.use).filter(([, q]) => q > 0).map(([item, qty]) => ({ item: +item, qty })) });
const addOk = () => asd && (asd.tab === 'exp' ? asd.name.trim() && asd.who.length && (Number(asd.tot) > 0 || Object.values(asd.use).some(q => q > 0)) && expPayOk(asd) && !spOver(asd) : asd.who.some(id => Number(asd.amt[id]) > 0) || asd.out.some(x => x.amt > 0) || Number(asd.nw.amt) > 0);
const AROLE = { pay: ['Ứng tiền', 'var(--green)'], donate: ['Tài trợ', 'var(--green)'], fixed: ['Đóng cố định', 'var(--pink)'] };
const kTho = n => { const a = Math.round(n / 100) / 10, [i, f] = String(a).split('.'); return i.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (f ? ',' + f : '') + 'K'; };   // 1125000 → 1.125K
const fundLeftV = (back = 0) => Math.round((settle(G).fund.left + back) / 1000) * 1000, fundLeftK = (back = 0) => { const v = fundLeftV(back); return v ? (v < 0 ? '−' : '') + kTho(Math.abs(v)) : '0'; };   // POD 26/11: số quỹ còn trong chip Rút quỹ (1.200K / 0 / 99K)
function drawAdd(){
  const d = asd, mem = G.members.filter(m => !m.left), isE = d.tab === 'exp', [, mo, dd] = d.day.split('-').map(Number);
  const chip = (attr, v, label, on, extra = '') => `<button class="chip ${on ? 'sel' : 'dark'}" ${attr}="${v}">${esc(label)}${extra}</button>`;
  const rtg = k => `<button class="chip rtg" data-rowtgl="${k}" aria-label="Xem tất cả / thu gọn" aria-expanded="false" hidden>${svg('i-up')}</button>`;   // Figma 17/18: hàng chip xuống dòng, chip mũi tên ở cuối để xổ / thu gọn
  const ed = !!d.edit;
  const head = `<div class="xhd"><button class="circ c44 rback" data-close aria-label="Quay lại">${svg('i-back')}</button>${ed ? `<h1>${d.ro ? (isE ? 'Chi tiết khoản chi' : 'Chi tiết góp quỹ') : isE ? 'Sửa khoản chi' : 'Sửa góp quỹ'}</h1>` : `<div class="seg" role="tablist"><button role="tab" class="${isE ? 'on' : ''}" data-atab="exp">Khoản chi</button><button role="tab" class="${isE ? '' : 'on'}" data-atab="top">Góp quỹ</button></div>`}${ed ? '<span class="hsp"></span>' : ''}</div>`;
  const nmIn = `<div class="xt"><label class="xbd" aria-label="Ngày"><b>${dd}</b><span>Th ${+mo}</span><input type="date" data-adate value="${d.day}"></label>${isE ? `<input class="xnm" id="aName2" placeholder="Nhập tên khoản chi" value="${esc(d.name)}" autocomplete="off" enterkeyhint="next" aria-label="Tên khoản chi">` : '<b class="xnm fixed">Góp quỹ</b>'}</div>`;
  const whoR = `<div class="xr rowf" data-rowf="a:who" data-rows="2">${chip('data-awall', 1, 'Tất cả', d.who.length === mem.length && mem.length > 0, d.who.length ? `<small>${d.who.length}</small>` : `<small>${mem.length}</small>`)}${mem.map(m => chip('data-awho', m.id, m.name, d.who.includes(m.id))).join('')}${rtg('a:who')}</div>`;
  let c1 = `<div class="xc">${nmIn}${whoR}</div>`, c2 = '';
  if (isE) {   // Figma 510:7947: [tên, Số tiền, người ứng tiền + từng người] → [người tham gia] → [kho đồ]
    const fl = expFlows(d), auto = expAuto(d);
    const amtIn = f => `<input class="xamt ${f.role === 'fixed' ? 'fix' : 'pos'}" inputmode="numeric" data-aamt="${esc(f.id)}" value="${f.amt ? fmt(f.amt) : ''}" placeholder="0" autocomplete="off" aria-label="Số tiền ${esc(nm(f.id))}">`;
    const autoB = f => `<b class="xamt ${f.id === FUND || isSp(f.id) || f.amt < 0 ? 'neg' : 'pos'}" id="aAuto">${f.amt < 0 ? '−' : ''}${fmt(Math.abs(f.amt))}</b>`;
    const rows = fl.length > 1 || fl.some(f => isSp(f.id)) ? fl.map(f => isSp(f.id) ? `<div class="xrow xfund"><b>${esc(nm(f.id))}</b>${amtIn({ ...f, role: 'fixed' })}</div>` : f.id === FUND ? `<div class="xrow xfund"><b>Rút quỹ</b>${auto && f.id === auto.id ? autoB(f) : amtIn(f)}</div>`
      : `<div class="xrow"><div class="xtx"><b>${esc(nm(f.id))}</b><button class="xrl" data-arole="${f.id}" style="color:${AROLE[f.role][1]}">${AROLE[f.role][0]}${svg('i-chev')}</button></div>${auto && f.id === auto.id ? autoB(f) : amtIn(f)}</div>`).join('') : '';
    const items = (G.items || []).filter(it => itemLeftX(it, d.edit) > 0 || d.use[it.id] > 0);
    const useRows = items.filter(it => d.use[it.id] > 0).map(it => { const q = d.use[it.id], left = itemLeftX(it, d.edit);
      return `<div class="xrow xuse"><div class="xtx"><b>${esc(it.name)}</b><small>${fmt(q * unitCost(it))}</small></div><span class="xstep"><button class="stb" data-astep="${it.id}:-1" aria-label="Bớt một">${svg('i-minus')}</button><b>${fmt(q)}</b><button class="stb" data-astep="${it.id}:1" aria-label="Thêm một" ${q >= left ? 'disabled' : ''}>${svg('i-plus')}</button></span></div>`; }).join('');
    const spChips = [...new Set([].filter(x => Number(x.amt) > 0).map(spNm))].map(n => ({ n, left: spLeft(G, n, d.edit), on: d.fl.some(f => f.id === 'sp:' + n) })).filter(x => x.left > 0 || x.on)
      .map(x => chip('data-apay', esc('sp:' + x.n), x.n, x.on, `<small>${kTho(x.left)}</small>`)).join('');   // POD 25/11: chip góp ngoài quỹ (tên + số còn lại) đứng đầu, trước Rút quỹ
    const tmp = tmpExp(d), calc = calcRows(tmp, settleExp(G, tmp)), calcH = calc ? `<div class="xcalc" id="aCalc">${calc}</div>` : '';
    c1 = `<div class="xc">${nmIn}<div class="kfs xsum"><label class="kf"><span>Số tiền</span><input id="aSum" inputmode="numeric" value="${d.tot ? fmt(d.tot) : ''}" placeholder="0" autocomplete="off" aria-label="Số tiền"></label><i class="kdv"></i></div>
      ${d.ro && !d.fl.length ? '' : `<div class="xs"><p class="xl">Người ứng tiền</p><div class="xr rowf" data-rowf="a:pay" data-rows="2">${spChips}${(() => { const on = d.fl.some(f => f.id === FUND), back = d.edit ? (G.exps.find(x => x.id === d.edit)?.flows || []).reduce((t, f) => t + (f.id === FUND ? Number(f.amt) || 0 : 0), 0) : 0; return on || fundLeftV(back) > 0 ? chip('data-apay', FUND, 'Rút quỹ', on, `<small>${fundLeftK(back)}</small>`) : ''; })()}${mem.map(m => chip('data-apay', m.id, m.name, d.fl.some(f => f.id === m.id))).join('')}${rtg('a:pay')}</div></div>`}${rows ? `<div class="xrows">${rows}</div>` : ''}<p class="warn xspw" id="aSpW"${spOver(d) ? '' : ' hidden'}>${esc(spMsg(d))}</p></div>`;
    c2 = `<div class="xc"><p class="xl">Người tham gia</p>${whoR}${items.length ? '' : calcH}</div>
      ${items.length && !(d.ro && !items.some(it => d.use[it.id] > 0)) ? `<div class="xc xc2"><div class="xs"><p class="xl">${d.ro ? 'Đồ trong kho' : 'Chọn đồ trong kho'}</p><div class="xr rowf xswipe" data-rowf="a:use">${items.map(it => chip('data-ause', it.id, it.name, d.use[it.id] > 0, `<small>${fmt(itemLeftX(it, d.edit))}</small>`)).join('')}${rtg('a:use')}</div></div>${useRows ? `<div class="xrows xuses">${useRows}</div>` : ''}${calcH}</div>` : ''}`;
  } else if (!isE) {
    const sel = mem.filter(m => d.who.includes(m.id)); if (d.eq) { const v = Math.max(0, ...sel.map(m => Number(d.amt[m.id]) || 0)); sel.forEach(m => { d.amt[m.id] = v; }); }   // góp đều: mọi người cùng số lớn nhất đang nhập
    const tot = sel.reduce((t, m) => t + (Number(d.amt[m.id]) || 0), 0) + d.out.reduce((t, x) => t + (Number(x.amt) || 0), 0) + (Number(d.nw.amt) || 0);
    const fr = (ic, nameHTML, amtHTML, top = true) => `<div class="xfr ${top ? 'tp' : ''}">${ic}${nameHTML}${amtHTML}</div>`;
    const av = `<span class="xrav">${svg('i-user')}</span>`;
    c2 = `<div class="xc xc3"><p class="xl">Nhập số tiền góp quỹ</p><div class="xfl">${sel.length > 1 ? fr(eqBtn('aEq', d.eq), `<b class="xn" data-eqfor="aEq">Góp đều nhau</b>`, d.eq ? `<input class="xamt pos t" inputmode="numeric" data-aeq value="${d.amt[sel[0].id] ? fmt(d.amt[sel[0].id]) : ''}" placeholder="Nhập" autocomplete="off" aria-label="Mỗi người góp">` : '<span></span>', false).replace('class="xfr', 'class="xfr xeq') : ''}${(d.eq && sel.length > 1 ? [] : sel).map((m, i) => fr(av, `<b class="xn">${esc(m.name)}</b>`, `<input class="xamt pos t" inputmode="numeric" data-aamt="${m.id}" value="${d.amt[m.id] ? fmt(d.amt[m.id]) : ''}" placeholder="Nhập" autocomplete="off" aria-label="Số tiền ${esc(m.name)}">`, i > 0 || sel.length > 1)).join('')}
      ${d.out.map((x, i) => fr(`<button class="xrav xminus" data-aoutdel="${i}" aria-label="Xóa">${svg('i-minus')}</button>`, `<b class="xn">${esc(x.name || 'Khác')}</b>`, `<b class="xamt pos t">${fmt(x.amt)}</b>`)).join('')}
      ${fr(`<button class="xrav xplus" id="aOutAdd" aria-label="Thêm khoản góp quỹ khác">${svg('i-plus')}</button>`, `<input class="xn xnin" id="aOutName" value="${esc(d.nw.name)}" placeholder="Khác" autocomplete="off" aria-label="Tên khoản góp quỹ khác" enterkeyhint="next">`, `<input class="xamt pos t" id="aOutAmt" inputmode="numeric" value="${d.nw.amt ? fmt(d.nw.amt) : ''}" placeholder="Nhập" autocomplete="off" aria-label="Số tiền góp quỹ khác">`, sel.length > 0)}
      <div class="xtot"><b>Tổng góp quỹ</b><b id="aTot">${fmt(tot)}</b></div></div></div>`;
  }
  const akey = el => el.className.split(' ')[0] + ':' + (el.querySelector('input,b,p')?.getAttribute('aria-label') || el.querySelector('b,p')?.textContent || '');
  const wasOpen = !$('#sheet').hidden && $('#sheetBody').classList.contains('asheet'), prev = new Set([...document.querySelectorAll('.asheet .xc, .asheet .xrow, .asheet .xfr')].map(akey));
  /* chỉ xem (Figma 532:4783): bảng đáy nổi — thẻ [ngày + tên + X, người tham gia] → [người ứng tiền / số tiền] → [đồ trong kho]; không có thanh tiêu đề trang */
  if (d.ro && isE) { expRoSheet(d); return; }   // POD 25/11 (Figma 535-5439): bảng chỉ xem khoản chi
  if (d.ro && !isE) { topRoSheet((G.fund?.adds || []).find(x => x.id === d.edit)); return; }   // POD 25/11 (Figma 532-4247): bảng chỉ xem lần góp quỹ
  const roCards = !d.ro ? '' : (() => { const x = nmIn.replace(/<\/div>$/, `<button class="circ c44 kx" data-close aria-label="Đóng">${svg('i-x')}</button></div>`), k = c2.indexOf('<div class="xc xc2">');
    return `<div class="xc">${x}${whoR}</div>` + (isE ? c1.replace(nmIn, '') + (k >= 0 ? c2.slice(k) : '') : c2.replace('Nhập số tiền góp quỹ', 'Số tiền góp quỹ')); })();
  openSheet(d.ro ? `<div class="xcards">${roCards}</div><p class="xro">${d.edit && d.tab === 'exp' ? roNote(G.exps.find(x => x.id === d.edit)) : topNote((G.fund?.adds || []).find(x => x.id === d.edit))}</p>`
    : `${head}<div class="xcards">${c1}${c2}</div>${ed ? `<button class="xdel" data-adel="1">${isE ? 'Xóa khoản chi' : 'Xóa khoản góp'}</button>` : ''}<div class="xfoot"><button class="btn" id="aOk" ${addOk() ? '' : 'disabled'}>Lưu lại</button></div>`);
  $('#sheetBody').classList.add('asheet'); $('#sheetBody').classList.toggle('aro', !!d.ro); $('#sheetBody').classList.toggle('rsheet', !!d.ro);
  if (d.ro) $('#sheetBody').querySelectorAll('.xcards input').forEach(i => { i.readOnly = true; i.tabIndex = -1; });
  if (!wasOpen && !d.edit && isE) $('#aName2')?.focus({ preventScroll: true });
  if (!RMO && Element.prototype.animate) { let k = 0;   // mở trang Thêm khoản chi / Góp quỹ: các thẻ hiện dần; chọn thêm người / đồ: dòng mới nảy lên
    document.querySelectorAll(wasOpen ? '.asheet .xrow, .asheet .xfr, .asheet .xc' : '.asheet .xc').forEach(el => { if (wasOpen && prev.has(akey(el))) return; if (wasOpen && el.matches('.xc') && el.querySelector('.xrow,.xfr') && [...el.querySelectorAll('.xrow,.xfr')].some(r => prev.has(akey(r)))) return; pop(el, wasOpen ? 0 : 80 + k++ * 60); }); }
}
function commitOut(){ const n = asd.nw; if (Number(n.amt) > 0) { asd.out.push({ name: (n.name || '').trim(), amt: Number(n.amt) }); asd.nw = { name: '', amt: 0 }; return true; } return false; }
function saveAdd(){ if (asd?.ro) return;
  const d = asd; if (!addOk()) return; const at = atFor(d.day);
  if (d.tab === 'exp') {
    const name = d.name.trim(), parts = [...d.who], flows = expFlows(d).map(({ man, ...f }) => f), use = Object.entries(d.use).filter(([, q]) => q > 0).map(([item, qty]) => ({ item: +item, qty }));
    if (d.edit) { const e = G.exps.find(x => x.id === d.edit); if (e) { const same = isoDay(e.at) === d.day, sh0 = shareMap(G, e); Object.assign(e, { name, parts, flows, at: same ? e.at : at }); if (use.length) e.use = use; else delete e.use; logAct(G, 'exp', `Sửa khoản chi "${name}"`, { n: 'e', nm: name, day: isoDay(e.at), a: sh0, b: shareMap(G, e) }); } }
    else { const ex = { id: newId(), at, name, parts, flows, by: myUid(), byName: root.acct?.name || '' }; if (use.length) ex.use = use; G.exps.push(ex); logAct(G, 'exp', `Thêm khoản chi "${name}"`, { day: d.day }); flows.forEach(f => { if (f.amt) logAct(G, f.id === FUND || isSp(f.id) ? 'out' : 'pay', f.id === FUND ? `Rút quỹ ${fmt(f.amt)} cho "${name}"` : `${nm(f.id)} ứng ${fmt(f.amt)} cho "${name}"`, { day: d.day }); }); }
  } else {
    commitOut(); G.fund = { sponsors: [], contrib: {}, ...(G.fund || {}), on: true }; G.fund.sponsors = spons(G.fund);
    const ps = d.who.filter(id => Number(d.amt[id]) > 0).map(id => ({ id, amt: Number(d.amt[id]) }));
    let a = d.edit ? (G.fund.adds || []).find(x => x.id === d.edit) : null;
    if (a) { a.at = isoDay(a.at || Date.now()) === d.day ? a.at : at; setTps(a, ps); } else { a = { id: newId(), at, ps, by: myUid(), byName: root.acct?.name || '', ct: Date.now() }; (G.fund.adds ||= []).push(a); }
    G.fund.sponsors = G.fund.sponsors.filter(x => x.add !== a.id).concat(d.out.map(x => ({ name: x.name, amt: x.amt, add: a.id })));
    logAct(G, 'fund', `${d.edit ? 'Sửa' : 'Thêm'} lần góp thêm quỹ ${fmt(ps.reduce((t, p) => t + p.amt, 0) + d.out.reduce((t, x) => t + x.amt, 0))}`, { day: d.day });
  }
  const wasEdit = !!d.edit; save(); asd = null; $('#sheet').hidden = true; if (view === 'cal') calDay = d.day; rerender(); toast(wasEdit ? 'Đã lưu' : 'Đã thêm');
}
function aRefresh(){ if (!asd) return; const ok = $('#aOk'); if (ok) ok.disabled = !addOk(); const sw = $('#aSpW'); if (sw) { const m = asd.tab === 'exp' ? spMsg(asd) : ''; sw.hidden = !m; sw.textContent = m; } if (asd.tab === 'exp') expFlows(asd).forEach(f => { if (isSp(f.id) && !f.man) { const i = document.querySelector(`[data-aamt="${CSS.escape(f.id)}"]`); if (i && i !== document.activeElement) i.value = f.amt ? fmt(f.amt) : ''; } }); const au = $('#aAuto'), af = asd.tab === 'exp' && expAuto(asd); if (au && af) { au.textContent = (af.amt < 0 ? '−' : '') + fmt(Math.abs(af.amt)); au.className = `xamt ${af.id === FUND || isSp(af.id) || af.amt < 0 ? 'neg' : 'pos'}`; } const c = $('#aCalc'); if (c && asd.tab === 'exp') { const t = tmpExp(asd); c.innerHTML = calcRows(t, settleExp(G, t)); } }
document.addEventListener('input', e => { const t = e.target; if (!asd || !t.closest?.('.asheet')) return;
  if (t.id === 'aName2') asd.name = t.value;
  else if (t.id === 'aSum') { const v = Number(t.value.replace(/\D/g, '')) || 0; asd.tot = v; t.value = v ? fmt(v) : ''; }
  else if (t.id === 'aOutName') asd.nw.name = t.value;
  else if (t.id === 'aOutAmt') { const v = Number(t.value.replace(/\D/g, '')) || 0; asd.nw.amt = v; t.value = v ? fmt(v) : ''; }
  else if (t.dataset.aeq !== undefined) { const v = Number(t.value.replace(/\D/g, '')) || 0; t.value = v ? fmt(v) : ''; asd.who.forEach(w => { asd.amt[w] = v; }); }
  else if (t.dataset.aamt !== undefined) { const v = Number(t.value.replace(/\D/g, '')) || 0, id = isSp(t.dataset.aamt) ? t.dataset.aamt : +t.dataset.aamt; t.value = v ? fmt(v) : '';
    if (asd.tab === 'exp') { const f = asd.fl.find(x => x.id === id); if (f) { f.amt = v; if (isSp(id)) f.man = true; } } else { asd.amt[id] = v; if (asd.eq) asd.who.forEach(w => { asd.amt[w] = v; const o = document.querySelector(`[data-aamt="${w}"]`); if (o && o !== t) o.value = v ? fmt(v) : ''; }); } }
  if (asd.tab === 'top') { const tot = $('#aTot'); if (tot) { tot.textContent = fmt(asd.who.reduce((s, id) => s + (Number(asd.amt[id]) || 0), 0) + asd.out.reduce((s, x) => s + x.amt, 0) + (Number(asd.nw.amt) || 0)); } }
  aRefresh(); });
document.addEventListener('keydown', e => { const nx = { itName: '#itCost', itCost: '#itQty' }[e.target.id]; if (e.key === 'Enter' && nx && $(nx)) { e.preventDefault(); $(nx).focus(); $(nx).select?.(); } else if (e.key === 'Enter' && e.target.id === 'itQty') { e.preventDefault(); e.target.blur(); } });   // thêm đồ: Enter đi lần lượt tên → giá → số lượng
document.addEventListener('keydown', e => { if (asd && e.key === 'Enter' && e.target.id === 'aName2') { e.preventDefault(); $('#aSum')?.focus(); } });   // nhập tên xong bấm Enter: sang ô Số tiền
document.addEventListener('keydown', e => { if (asd && e.key === 'Enter' && e.target.id === 'aOutAmt') { e.preventDefault(); if (commitOut()) drawAdd(); } });
document.addEventListener('change', e => { const t = e.target; if (asd && t.matches?.('[data-adate]') && t.value) { asd.day = t.value; const [, mo, dd] = t.value.split('-'), lb = t.closest('label'); lb.querySelector('b').textContent = +dd; lb.querySelector('span').textContent = 'Th ' + +mo; } });   // chỉ đổi chữ ngày, không vẽ lại trang: vẽ lại làm lịch iPhone đóng ngay khi chạm một ngày (POD 25/11)
const newItDraft = () => ({ id: 0, name: '', qty: 1, cost: 0, payer: null, pl: [], atDay: todayISO() });   // số lượng ít nhất là 1; chưa chọn sẵn người ứng tiền
function kvView(){
  const its = [...(G.items || [])].sort((a, b) => (a.at || 0) - (b.at || 0));
  if (!its.length && !kAdd && !BILL) { kAdd = true; kEdit = null; itDraft = newItDraft(); }   // Figma 21: kho trống thì mở sẵn thẻ thêm đồ
  return `<section class="view kview"><header class="ghead"><button class="circ back" id="kBack" aria-label="Quay lại">${svg('i-back')}</button><h1>Kho đồ</h1><span class="hsp"></span></header>
    <div class="klist">${its.map(it => { const d = it.at ? new Date(it.at) : null;
      const me = myMember(G)?.id, ps = itPays(it), sub = ps.length > 1 ? esc(ps.map(p => p.id === FUND ? 'Rút quỹ' : p.id === me ? 'Bạn' : nm(p.id)).join(', ')) : (ps[0].id === FUND ? 'Rút quỹ' : ps[0].id === me ? 'Bạn ứng tiền' : `${esc(nm(ps[0].id))} ứng tiền`);   // Figma 22
      if (kEdit === it.id && itDraft) return kForm(it);   // Figma 22: bấm / nhấn giữ đồ → mở thẻ sửa ngay tại chỗ (Xóa + Lưu lại trong thẻ)
      return `<button class="krow2" data-kedit="${it.id}"><span class="xbd">${d ? `<b>${d.getDate()}</b><span>Th ${d.getMonth() + 1}</span>` : '<b>–</b>'}</span><span class="ktx"><b class="kn">${fmt(it.qty)} ${esc(it.name)}</b><small>${sub}</small></span><span class="kc">${fmt(it.cost)}</span>${svg('i-up', 'gchv')}</button>`; }).join('')}${kAdd && itDraft ? kForm() : ''}
    <button class="addk" id="addItem">${svg('i-plus')}Thêm đồ</button></div></section>`;   // Figma 21/22: đồ xếp theo thời gian (cũ trên, mới dưới), thẻ thêm đồ nằm cuối danh sách, nút Thêm đồ dưới cùng
}
function calcRows(e, d){
  if (!e.flows.some(f => Number(f.amt) > 0) && !(e.use || []).some(u => Number(u.qty) > 0)) return '';   // chưa nhập số tiền nào: không hiện gì dưới ô nhập
  if (!e.parts.length) return `<p class="warn">Chọn người tham gia</p>`;
  if (!d.total) return `<p class="warn">Nhập số tiền đã ứng trước</p>`;   // mới nhập đóng cố định / tài trợ, chưa nhập số tiền ứng
  const rows = [];   // (dòng "Tổng chi" cũ không bao giờ hiện: có người ứng thì ẩn, chỉ Rút quỹ thì dòng Rút quỹ đã ghi số tiền)
  if (d.per > 0 && d.sharers.length) { const ns = G.members.filter(m => d.sharers.includes(m.id)).map(m => esc(m.name)); rows.push(`<p class="share">${ns.length === 1 ? `${ns[0]} ${fmt(d.per)}` : `${ns.join(', ')}. Mỗi người ${fmt(d.per)}`}</p>`); }   // một người chịu: "Linh 100.000"; nhiều người: "A, B. Mỗi người …"   // ai phải chịu phần chia đều, mỗi người bao nhiêu
  if (d.warn) rows.push(`<p class="warn">${esc(d.warn)}</p>`);
  return rows.join('');
}
