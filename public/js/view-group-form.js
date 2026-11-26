function formView(){
  const ro = formRO();
  return `<section class="view fv">
    <header class="ahd"><button class="circ back c44" id="formBack" aria-label="Quay lại">${svg('i-back')}</button><h1>${draft.id ? 'Chỉnh sửa nhóm' : 'Tạo nhóm mới'}</h1><button class="circ c44 okb" id="saveGroup" aria-label="${draft.id ? 'Lưu nhóm' : 'Tạo nhóm'}">${svg('i-check')}</button></header>
    ${ro ? `<div class="avpick">${avHTML(draft.avatar, 'big')}</div>` : `<button class="avpick" id="avBtn" aria-label="Đổi ảnh nhóm">${avHTML(draft.avatar, 'big')}<span class="avpen">${svg('i-pen')}</span></button>`}
    <input class="uline gname" id="gName" placeholder="Tên nhóm" value="${esc(draft.name)}" autocomplete="off" enterkeyhint="next" aria-label="Tên nhóm" ${ro ? 'readonly tabindex="-1"' : ''}>${(g => g?.by ? `<p class="gbyf">Tạo bởi ${esc(byName(g.by, g.byName, g))}</p>` : '')(draft.id && root.groups.find(x => x.id === draft.id))}
    <div class="fstack"><div class="mcard">
      <div class="mrow"><input class="mline" id="fName" placeholder="Thêm tên hoặc @tên" autocomplete="off" enterkeyhint="done" aria-label="Tên thành viên">
        <button class="circ yadd" id="fAdd" aria-label="Thêm thành viên">${svg('i-plus')}</button></div>
      <div id="atHint"></div>
      <p class="lbl">${draft.members.length} thành viên</p>
      ${draft.members.length ? `<div class="chips">${draft.members.map(m => (ro && (draft.orig || []).includes(m.id)) || isCreatorM(m) ? `<span class="chip ${m.uid ? 'lk' : ''} fixm">${m.uid ? avHTML(m.avatar, 'cav', 'i-user') : ''}${esc(m.name)}</span>` : `<button class="chip ${m.uid ? 'lk' : ''}" data-fdel="${m.id}" aria-label="Bỏ ${esc(m.name)}${m.handle ? ' @' + esc(m.handle) : ''}">${m.uid ? avHTML(m.avatar, 'cav', 'i-user') : ''}${esc(m.name)}${svg('i-x','x')}</button>`).join('')}</div>` : ''}
    </div>
    ${draft.id ? '' : fundForm()}   <!-- POD 25/11: sau khi tạo nhóm, góp quỹ chỉ thêm ở Góp quỹ (nút +), không sửa ở Chỉnh sửa nhóm -->
    ${draft.id ? (canDelG(root.groups.find(g => g.id === draft.id)) ? '<button class="xdel" id="delGroup">Xóa nhóm</button>' : '<button class="xdel" id="leaveGroup">Rời nhóm</button>') : '<button class="xdel" id="formBack">Xóa nhóm</button>'}
  </section>`;
}
document.addEventListener('click', e => { const l = e.target.closest?.('[data-eqfor]'); if (l) { e.preventDefault(); document.getElementById(l.dataset.eqfor)?.click(); } });   // bấm chữ "Góp đều nhau" cũng bật/tắt ô tích
const eqBtn = (id, on) => `<button type="button" class="eqb ${on ? 'on' : ''}" id="${id}" aria-pressed="${!!on}" aria-label="Góp đều nhau"><i>${svg('i-check')}</i></button>`;
function fundForm(){
  const f = draft.fund || { contrib: {} }; if (f.eq) { const v = Math.max(0, ...draft.members.map(m => Number(f.contrib[m.id]) || 0)); draft.members.forEach(m => { f.contrib[m.id] = v; }); }   // góp đều: thành viên mới thêm cũng góp cùng số
  const tot = fundTot(), open = !!f.open;   // f.open chỉ là trạng thái giao diện, không lưu vào nhóm
  const head = `<button class="fhead" id="fundTgl" aria-expanded="${open}">${svg('i-up', 'fcar')}<span>Góp quỹ chung</span></button>`;   // Figma 08/09: mũi tên đứng trước tiêu đề
  return `<div class="fcard ${formRO() ? 'ro' : ''} ${open ? 'open' : ''}">${head}${open ? `<div class="flist">${draft.members.length > 1 ? `<div class="frow feqr">${eqBtn('fEq', f.eq)}<b data-eqfor="fEq">Góp đều nhau</b>${f.eq ? `<input inputmode="numeric" data-fc="eq" value="${f.contrib[draft.members[0].id] ? fmt(f.contrib[draft.members[0].id]) : ''}" placeholder="Nhập" aria-label="Mỗi người góp">` : ''}</div>` : ''}${(f.eq && draft.members.length > 1 ? [] : draft.members).map(m => `<label class="frow">${rowAv(m)}<b>${esc(m.name)}</b><input inputmode="numeric" data-fc="${m.id}" value="${f.contrib[m.id] ? fmt(f.contrib[m.id]) : ''}" placeholder="Nhập" aria-label="${esc(m.name)} góp quỹ"></label>`).join('')}<div class="frow"><button class="circ sbtn add" id="sAdd" aria-label="Thêm khoản góp quỹ khác">${svg('i-plus')}</button><input class="bname" id="sNewName" value="${esc(f.newS?.name || '')}" placeholder="Khác" autocomplete="off" enterkeyhint="done" aria-label="Tên khoản góp quỹ khác"><input inputmode="numeric" data-fc="new" value="${f.newS?.amt ? fmt(f.newS.amt) : ''}" placeholder="Nhập" aria-label="Số tiền góp quỹ khác"></div>${spons(f).map((x, k) => `<div class="frow"><button class="circ sbtn del" data-sdel="${k}" aria-label="Bỏ khoản góp ngoài quỹ">${svg('i-minus')}</button><input class="bname" data-sname="${k}" value="${esc(x.name || '')}" placeholder="Khác" autocomplete="off" enterkeyhint="next" aria-label="Tên khoản góp quỹ khác"><input inputmode="numeric" data-fc="s${k}" value="${x.amt ? fmt(x.amt) : ''}" placeholder="Nhập" aria-label="Số tiền góp ngoài quỹ"></div>`).join('')}
    <div class="ftot"><span>Tổng quỹ</span><b id="fundTot">${fmt(tot)}</b></div></div>` : ''}</div>`;
}
function spons(f){ if (!f) return []; if (Array.isArray(f.sponsors)) return f.sponsors; return Number(f.base) ? [{ name: f.baseName || '', amt: Number(f.base) }] : []; }
function fundTot(){ const f = draft.fund || { contrib: {} }; return spons(f).reduce((a, x) => a + (Number(x.amt) || 0), 0) + (Number(f.newS?.amt) || 0) + draft.members.reduce((a, m) => a + (Number(f.contrib[m.id]) || 0), 0);
}
let fundOpen = false, itDraft = null, useLogT = null, kAdd = false, kEdit = null;
const dayToAt = (iso, base) => { const [y, m, d] = iso.split('-').map(Number), o = base ? new Date(base) : new Date(); return new Date(y, m - 1, d, o.getHours(), o.getMinutes()).getTime(); };
const itWho = it => { const ps = itPays(it); if (ps.length > 1) return `<b>${esc(ps.map(p => p.id === FUND ? 'Rút quỹ' : nm(p.id)).join(', '))}</b>`; const w = ps[0].id; return w === FUND ? '<b>Rút quỹ</b>' : `<b>${esc(nm(w))} <span class="gq">ứng tiền</span></b>`; };
function khoCard(it){   // thẻ "10 x Quả cầu lông" trong dòng thời gian: ngày mua, tên, tiền; mở ra thấy ai trả
  const tot = Number(it.cost) || 0, d = it.at ? new Date(it.at) : null;
  const who = itWho(it);
  const cal = `<label class="cal" aria-label="Ngày mua">${d ? `<b>${d.getDate()}</b><span>Th ${d.getMonth() + 1}</span>` : `<b>–</b><span>Ngày</span>`}<input type="date" data-kdate="${it.id}" value="${d ? isoDay(it.at) : ''}"></label>`;
  return `<article class="exp kcard" data-kho="${it.id}">
    <div class="eh">${cal}<button class="ename" data-item="${it.id}" aria-label="Sửa kho đồ ${esc(it.name)}">${fmt(it.qty)} ${esc(it.name)}</button>${it.fold ? `<b class="ftot2">${fmt(tot)}</b>` : ''}<button class="fold" data-foldkho="${it.id}" aria-expanded="${!it.fold}" aria-label="${it.fold ? 'Mở kho đồ' : 'Thu gọn kho đồ'}">${svg('i-up')}</button></div>
    ${it.fold ? '' : `<div class="flow krow"><span class="who">${who}</span><b class="amt">${fmt(tot)}</b></div>`}
  </article>`;
}
function askDelItem(id){
  const it = itemOf(G, id); if (!it) return;
  if (!canItem(it)) { toast(closedItem(it) ? 'Đã chốt sổ nên không thể chỉnh sửa' : 'Chỉ người tạo đồ này xóa được'); return; }
  const used = itemUsed(G, id), n = G.exps.filter(e => (e.use || []).some(u => u.item === id)).length;
  confirmDlg(`Xóa ${esc(it.name)} khỏi kho đồ?`, used ? `Đã dùng ${fmt(used)} ở ${n} khoản chi. Xóa thì các khoản đó không còn tính phần này, không hoàn tác được.` : 'Không hoàn tác được.', `data-dodelitem="${id}"`);
}
function itFields(withName){   // phần nhập đồ dùng chung cho bảng Sửa đồ và card Thêm đồ trong trang Kho
  const pc = (v, label) => `<button class="chip ${itDraft.payer === v ? 'sel' : 'dark'}" data-itpay="${esc(v)}">${esc(label)}</button>`, [, mo, dd] = itDraft.atDay.split('-');
  return `<div class="icard"><p class="klab">${itDraft.ro ? 'Người ứng tiền' : 'Chọn người ứng tiền'}</p><div class="chips kpay">${spItChips(pc, false)}${pc(FUND, 'Rút quỹ')}${G.members.filter(m => !m.left).map(m => pc(m.id, m.name)).join('')}</div><p class="warn xspw" id="itSpW"${itSpOver() ? '' : ' hidden'}>Chọn thêm người ứng tiền</p></div>
    <div class="icard krows">
      ${withName ? `<label class="krow"><span>Tên đồ</span><input class="knm" id="itName" value="${esc(itDraft.name)}" placeholder="Vd: Quả cầu lông" autocomplete="off" enterkeyhint="next" aria-label="Tên đồ"></label>
      <label class="krow kdt"><span>Ngày mua</span><b>${dd}/${mo}</b><input type="date" data-itdate value="${itDraft.atDay}"></label>` : ''}
      <div class="krow"><span>Số lượng</span><span class="step"><button class="stb" id="itMinus" aria-label="Bớt một" ${itDraft.qty > 0 ? '' : 'disabled'}>${svg('i-minus')}</button><input id="itQty" inputmode="numeric" enterkeyhint="done" value="${itDraft.qty ? fmt(itDraft.qty) : ''}" placeholder="0" autocomplete="off" aria-label="Số lượng"><button class="stb" id="itPlus" aria-label="Thêm một">${svg('i-plus')}</button></span></div>
      <label class="krow"><span>Giá tiền</span><input id="itCost" inputmode="numeric" enterkeyhint="next" value="${itDraft.cost ? fmt(itDraft.cost) : ''}" placeholder="0" autocomplete="off" aria-label="Giá tiền"></label>
    </div>`;
}
function itemSheet(id){   // bấm card đồ (lịch / kho): bảng đáy theo Figma 532:3371 — thẻ ngày + tên, Giá tiền, Số lượng, Người ứng tiền, Lưu lại; người không sửa được chỉ xem (nút X, chỉ chip người ứng)
  const it = id ? itemOf(G, id) : null; if (id && !it) return;
  itDraft = it ? { ...it, payer: it.payer ?? FUND, pl: itPays(it).map(p => ({ ...p })), atDay: isoDay(it.at || Date.now()) } : { id: 0, name: '', qty: 0, cost: 0, payer: null, pl: [], atDay: todayISO() };
  const ro = !!it && !canItem(it); itDraft.ro = ro;   // không phải người tạo đồ / đợt đã đóng: chỉ xem
  if (!it) itDraft.qty = 1;
  openSheet(`${kForm(it, ro)}${ro ? `<p class="xro">${BILL ? '' : closedItem(it) ? 'Đã chốt sổ nên không thể chỉnh sửa' : 'Chỉ người tạo đồ mới sửa được'}</p>` : ''}`);
  const sb = $('#sheetBody'); sb.classList.add('ksheet'); sb.classList.toggle('iro', ro);
  if (ro) sb.querySelectorAll('input').forEach(i => { i.readOnly = true; i.tabIndex = -1; });
  fitRows();
}
function kAddCard(){   // Thêm đồ: card ngay trong trang Kho (ngày bấm vào lịch chọn được)
  const [, mo, dd] = itDraft.atDay.split('-');
  return `<div class="kadd" id="kAddCard"><div class="icard"><div class="xt"><label class="xbd" aria-label="Ngày mua"><b>${+dd}</b><span>Th ${+mo}</span><input type="date" data-itdate value="${itDraft.atDay}"></label><input class="xnm" id="itName" placeholder="Nhập tên đồ" value="${esc(itDraft.name)}" autocomplete="off" enterkeyhint="next" aria-label="Tên đồ"></div></div>
    ${itFields(false)}
    <div class="kacts"><button class="btn" id="itCancel">Hủy</button><button class="btn yel" id="itSave">Lưu</button></div></div>`;
}
function saveItem(){ if (itDraft?.ro) return;   // lưu đồ: bảng Sửa đồ, thẻ Thêm đồ và sửa tại chỗ trong trang Kho
    const n = itDraft; n.name = (n.name || '').trim() || 'Đồ vật';
    n.qty = Math.max(1, Number(n.qty) || 1);   // số lượng ít nhất là 1
    if (!(n.cost > 0)) { toast('Nhập tổng tiền mua'); $('#itCost').focus(); return; }
    const fl = itFlows(n); if (!fl.length) { toast('Chọn người ứng tiền'); return; } if (!itPayOk(n) || itSpOver()) return;
    n.payer = fl[0].id; const pays = fl.length > 1 ? fl.map(f => ({ id: f.id, amt: f.amt })) : null;
    G.items ||= [];
    if (n.id) { const i = G.items.findIndex(x => x.id === n.id); if (i >= 0) { G.items[i] = { ...G.items[i], name: n.name, qty: n.qty, cost: n.cost, payer: n.payer, pays, at: isoDay(G.items[i].at || Date.now()) === n.atDay ? G.items[i].at : dayToAt(n.atDay, G.items[i].at) }; if (!pays) delete G.items[i].pays; } logAct(G, 'fund', `Sửa kho đồ \"${n.name}\"`, { go: 'kho' }); }
    else { G.items.push({ id: newId(), name: n.name, qty: n.qty, cost: n.cost, payer: n.payer, ...(pays ? { pays } : {}), by: myUid(), byName: root.acct?.name || '', at: n.atDay === todayISO() ? Date.now() : dayToAt(n.atDay) }); logAct(G, 'fund', `Thêm kho đồ \"${n.name}\": ${fmt(n.qty)} giá ${fmt(n.cost)}`, { go: 'kho' }); }
    save(); if (kAdd || kEdit) { kAdd = false; kEdit = null; itDraft = null; rerender(); } else closeSheet();
}
function kPayHTML(ro){   // POD 25/11: chọn nhiều người ứng tiền như khoản chi; từ 2 người: người đầu (góp ngoài quỹ → Rút quỹ → thành viên) tự nhận phần còn lại
  const on = v => (itDraft.pl || []).some(p => p.id === v), pc = (v, label) => `<button class="chip ${on(v) ? 'sel' : 'dark'}" data-itpay="${esc(v)}">${esc(label)}</button>`;
  const fl = itFlows(itDraft), au = fl.length > 1 ? fl[0] : null;
  const autoB = f => `<b class="xamt ${f.id === FUND || isSp(f.id) || f.amt < 0 ? 'neg' : 'pos'}" id="itAuto">${f.amt < 0 ? '−' : ''}${fmt(Math.abs(f.amt))}</b>`;
  const rows = fl.length > 1 ? fl.map(f => `<div class="xrow ${f.id === FUND || isSp(f.id) ? 'xfund' : ''}"><b>${f.id === FUND ? 'Rút quỹ' : esc(nm(f.id))}</b>${f === au || ro ? (f === au ? autoB(f) : `<b class="xamt pos">${fmt(f.amt)}</b>`) : `<input class="xamt pos" inputmode="numeric" data-itamt="${esc(f.id)}" value="${f.amt ? fmt(f.amt) : ''}" placeholder="0" autocomplete="off" aria-label="Số tiền ${esc(nm(f.id))}">`}</div>`).join('') : '';
  return `<p class="xl">Người ứng tiền</p><div class="xr rowf" data-rowf="k:pay" data-rows="2">${spItChips(pc, ro)}${(() => { const back = itDraft.id ? itPays(itemOf(G, itDraft.id) || { cost: 0 }).reduce((t, p) => t + (p.id === FUND ? Number(p.amt) || 0 : 0), 0) : 0; return (ro ? !on(FUND) : !on(FUND) && fundLeftV(back) <= 0) ? '' : pc(FUND, 'Rút quỹ').replace('</button>', `<small>${fundLeftK(back)}</small></button>`); })()}${G.members.filter(m => !m.left && (!ro || on(m.id))).map(m => pc(m.id, m.name)).join('')}<button class="chip rtg" data-rowtgl="k:pay" aria-label="Xem tất cả / thu gọn" aria-expanded="false" hidden>${svg('i-up')}</button></div>${rows ? `<div class="xrows kprows">${rows}</div>` : ''}${ro ? '' : `<p class="warn xspw" id="itSpW"${itSpOver() ? '' : ' hidden'}>Chọn thêm người ứng tiền</p>`}`;
}
const itRank = id => isSp(id) ? -2 : id === FUND ? -1 : 0;
function itFlows(d){ const fl = (d.pl || []).map(p => ({ id: p.id, amt: Number(p.amt) || 0 })).filter(p => p.id === FUND || isSp(p.id) || G.members.some(m => m.id === p.id)).sort((a, b) => itRank(a.id) - itRank(b.id));
  const c = Number(d.cost) || 0; if (fl.length === 1) fl[0].amt = c; else if (fl.length) fl[0].amt = c - fl.slice(1).reduce((t, f) => t + f.amt, 0); return fl; }
const itPayOk = d => { const fl = itFlows(d); return fl.length > 0 && fl[0].amt >= 0; };
function kPayRefresh(){ const fl = itFlows(itDraft), a = $('#itAuto'); if (a && fl.length > 1) { const f = fl[0]; a.textContent = (f.amt < 0 ? '−' : '') + fmt(Math.abs(f.amt)); a.className = `xamt ${f.id === FUND || isSp(f.id) || f.amt < 0 ? 'neg' : 'pos'}`; } document.querySelectorAll('.kok,#itSave').forEach(b => b.classList.toggle('off', !itOk())); }
function kForm(it, ro){   // Figma 21/22: thẻ gồm ngày + tên + mũi tên thu gọn → Giá tiền, Số lượng → chọn người ứng tiền → [Xóa] Lưu lại
  const [, mo, dd] = itDraft.atDay.split('-'), pc = (v, label) => `<button class="chip ${itDraft.payer === v ? 'sel' : 'dark'}" data-itpay="${esc(v)}">${esc(label)}</button>`;
  return `<div class="kform" id="kAddCard"><div class="xt"><label class="xbd" aria-label="Ngày mua"><b>${+dd}</b><span>Th ${+mo}</span><input type="date" data-itdate value="${itDraft.atDay}"></label><input class="xnm" id="itName" placeholder="Vd: Hộp cầu lông" value="${esc(itDraft.name)}" autocomplete="off" enterkeyhint="next" aria-label="Tên đồ">${ro ? `<button class="circ c44 kx" data-close aria-label="Đóng">${svg('i-x')}</button>` : `<button class="kfold" id="kFold" aria-label="Thu gọn">${svg('i-up')}</button>`}</div>
    <div class="kfs"><label class="kf"><span>Giá tiền</span><input id="itCost" inputmode="numeric" enterkeyhint="next" value="${itDraft.cost ? fmt(itDraft.cost) : ''}" placeholder="0" autocomplete="off" aria-label="Giá tiền"></label><i class="kdv"></i>
      <div class="kf"><span>Số lượng</span><span class="step"><button class="stb" id="itMinus" aria-label="Bớt một" ${itDraft.qty > 1 ? '' : 'disabled'}>${svg('i-minus')}</button><input id="itQty" inputmode="numeric" enterkeyhint="done" value="${fmt(Math.max(1, itDraft.qty || 1))}" autocomplete="off" aria-label="Số lượng"><button class="stb" id="itPlus" aria-label="Thêm một">${svg('i-plus')}</button></span></div></div>
    <div class="xs" id="kPaySec">${kPayHTML(ro)}</div>
    ${ro ? '' : `<div class="kbtns">${it && canItem(it) ? `<button class="btn kdelb" data-kdel="${it.id}">Xóa</button>` : ''}<button class="btn yel kok ${itOk() ? '' : 'off'}" id="itSave">Lưu lại</button></div>`}</div>`;
}
const itSpOver = () => !!itDraft && itFlows(itDraft).some(f => isSp(f.id) && f.amt > spLeft(G, f.id.slice(3), null, itDraft.id) + 0.5);   // POD 25/11: giá đồ vượt số tiền góp ngoài quỹ còn lại
const spItChips = (pc, ro) => [...new Set([].filter(x => Number(x.amt) > 0).map(spNm))].map(n => ({ n, left: spLeft(G, n, null, itDraft.id), on: (itDraft.pl || []).some(p => p.id === 'sp:' + n) || itDraft.payer === 'sp:' + n })).filter(x => ro ? x.on : x.left > 0 || x.on)
  .map(x => pc('sp:' + x.n, x.n).replace('</button>', `<small>${kTho(Math.max(0, x.left))}</small></button>`)).join('');   // chip góp ngoài quỹ đứng đầu, trước Rút quỹ
const itOk = () => { const o = itSpOver(), w = document.getElementById('itSpW'); if (w) w.hidden = !o; return !!(itDraft && (itDraft.name || '').trim() && itDraft.cost > 0 && (itDraft.pl || []).length) && itPayOk(itDraft) && !o; };   // đủ tên, giá và người ứng tiền thì nút Lưu lại sáng
function logUse(g, eid, iid){
  clearTimeout(useLogT);
  useLogT = setTimeout(() => { const ex = g.exps.find(x => x.id === eid), u = ex?.use?.find(x => x.item === iid), it = itemOf(g, iid); if (u && it) { logAct(g, 'exp', `Dùng ${fmt(u.qty)} ${it.name} ở ${gnm(ex)}`, { day: isoDay(ex.at) }); save(); } }, 1500);
}
function fundCard(r){
  const S = r || settle(G), f = S.fund;
  const left = f.left, pct = f.put ? Math.max(0, Math.min(1, left / f.put)) : 0;
  const lines = fundLines(S);
  const open = r ? true : fundOpen;   // trang tổng kết: luôn xổ, không thu gọn
  return `<div class="fund ${open ? 'open' : ''} ${left < 0 ? 'neg' : ''}" ${r ? '' : 'id="fundCard"'}>${r ? '<div class="top">' : `<button class="top" data-fundopen aria-expanded="${open}">`}<small>Quỹ chung</small><b class="${left < 0 ? 'neg' : ''}">${left < 0 ? '−' : ''}${fmt(Math.abs(left))}</b>${r ? '</div>' : `${svg('i-up', 'fcar')}</button>`}${open ? `<div class="fls">${lines}</div>` : ''}<div class="fbar"><i style="width:${pct * 100}%"></i></div>${(G.items || []).some(it => Number(it.qty) - itemUsed(G, it.id) > 0) ? `<div class="fks">${G.items.filter(it => Number(it.qty) - itemUsed(G, it.id) > 0).map(it => { const l = Number(it.qty) - itemUsed(G, it.id); return `<div class="fk"><span>${esc(it.name)}</span><b class="${l < 0 ? 'neg' : ''}">${l < 0 ? '−' : ''}${fmt(Math.abs(l))}/${fmt(it.qty)}</b></div>`; }).join('')}</div>` : ''}</div>`;
}
function avPut(html){   // chọn ảnh nhóm / ảnh đại diện: mở ngay dưới ảnh trong trang (bảng nổi bị lệch khi lưu app ra màn hình iPhone)
  const btn = $(isAcct() ? '#acAvBtn' : '#avBtn'); if (!btn) return; let p = $('#avPick'); const fresh = !p;
  if (!p) { p = document.createElement('div'); p.id = 'avPick'; p.className = 'avpk sp av2'; btn.after(p); }
  p.innerHTML = html; if (fresh && !RMO && p.animate) { p.animate([{ opacity: 0, translate: '0 -8px' }, { opacity: 1, translate: '0 0' }], { duration: 220, easing: 'ease-out' }); p.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
}
function avSheet(){
  const A = isAcct(), o = A ? adraft : draft;
  const cur = o.avatar?.startsWith('ic:') ? icParse(o.avatar) : { k: A ? 'user' : 'people', c: 6 }, col = AV_COL[cur.c], fg = col === '#FFD60A' ? '#000' : '#fff';   // Figma 437:2406: ảnh nhóm có ô mặc định (icon nhóm, màu xám) như ảnh đại diện
  avPut(`<div class="emogrid v2" style="--c:${col};--fg:${fg}">${(A ? AN_PICK : GR_PICK).map(([k, n]) => `<button class="ico ${k === cur.k ? 'on' : ''}" data-avic="${k}" aria-label="${n}">${A ? anSvg(k) : svg(k === 'people' ? 'i-people' : 'ic-' + k)}</button>`).join('')}</div>
    <div class="swrow">${AV_SHOW.map(i => `<button class="sw ${i === cur.c ? 'on' : ''} ${i === 6 ? 'def' : ''}" style="--c:${AV_COL[i]}" data-avcol="${i}" aria-label="Màu ${i + 1}"></button>`).join('')}</div>
    <div class="acts"><button class="btn yel" ${o.avatar?.startsWith('ic:') ? `data-av="${esc(o.avatar)}"` : 'data-close'}>Lưu lại</button></div>`, 'av2');
}
function setAvatar(av){ if (isAcct()) { adraft.name = $('#aName')?.value ?? adraft.name; adraft.avatar = av; } else { draft.name = $('#gName')?.value ?? draft.name; draft.avatar = av; } closeSheet(); render(); }
function fundOut(){ const f = draft.fund; if (!f) return { on: true, sponsors: [], contrib: {} }; const c = {}; draft.members.forEach(m => { if (f.contrib[m.id]) c[m.id] = f.contrib[m.id]; }); const sp = [...spons(f), ...(f.newS && (f.newS.name?.trim() || f.newS.amt) ? [f.newS] : [])].map(x => ({ name: (x.name || '').trim(), amt: Number(x.amt) || 0 })).filter(x => x.name || x.amt); return { on: true, sponsors: sp, contrib: c }; }   // on: true luôn được ghi để bản app cũ còn chạy trên máy khác vẫn hiện quỹ
/* tiền một thành viên đang có trong nhóm (ứng, đóng cố định, góp quỹ, góp thêm): bỏ người đó ra thì số này mất khỏi tổng kết */
function memberMoney(id){
  const g = draft?.id && root.groups.find(x => x.id === draft.id); let t = Number(draft.fund?.contrib?.[id]) || 0;
  if (g) { g.exps.forEach(e => e.flows.forEach(f => { if (f.id === id) t += Number(f.amt) || 0; })); (g.fund?.adds || []).forEach(a => tps(a).forEach(p => { if (p.id === id) t += Number(p.amt) || 0; })); g.exps.forEach(e => useFlows(g, e).forEach(f => { if (f.id === id) t += f.amt; })); }
  return t;
}
function addTo(list, name){
  name = String(name).trim().replace(/\s+/g, ' '); if (!name) return false;
  if (list.some(m => low(m.name) === low(name))) { toast(`${name} đã có trong nhóm`); return false; }
  list.push(mem(name)); return true;
}
