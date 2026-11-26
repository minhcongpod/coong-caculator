/* ================= trang Kho đồ + bảng Thêm / Sửa đồ =================
   Đồ: g.items = [{ id, name, qty, cost, payer, pays?, at }]; tính tiền đồ đã dùng nằm ở calc.js. */
let itDraft = null, kAdd = false, kEdit = null;   // bản nháp đồ đang thêm/sửa; kAdd: thẻ Thêm đồ đang mở; kEdit: id đồ đang sửa tại chỗ
const itDraftOf = it => ({ ...it, payer: it.payer ?? FUND, pl: itPays(it).map(p => ({ ...p })), atDay: isoDay(it.at || Date.now()) });   // bản nháp để sửa một đồ trong kho
const newItDraft = () => ({ id: 0, name: '', qty: 1, cost: 0, payer: null, pl: [], atDay: todayISO() });   // số lượng ít nhất là 1; chưa chọn sẵn người ứng tiền
function askDelItem(id){
  const it = itemOf(G, id); if (!it) return;
  if (!canItem(it)) { toast(closedItem(it) ? 'Đã chốt sổ nên không thể chỉnh sửa' : 'Chỉ người tạo đồ này xóa được'); return; }
  const used = itemUsed(G, id), n = G.exps.filter(e => (e.use || []).some(u => u.item === id)).length;
  confirmDlg(`Xóa ${esc(it.name)} khỏi kho đồ?`, used ? `Đã dùng ${fmt(used)} ở ${n} khoản chi. Xóa thì các khoản đó không còn tính phần này, không hoàn tác được.` : 'Không hoàn tác được.', `data-dodelitem="${id}"`);
}
function itemSheet(id){   // bấm card đồ (lịch / kho): bảng đáy theo Figma 532:3371 — thẻ ngày + tên, Giá tiền, Số lượng, Người ứng tiền, Lưu lại; người không sửa được chỉ xem (nút X, chỉ chip người ứng)
  const it = id ? itemOf(G, id) : null; if (id && !it) return;
  itDraft = it ? itDraftOf(it) : { id: 0, name: '', qty: 0, cost: 0, payer: null, pl: [], atDay: todayISO() };
  const ro = !!it && !canItem(it); itDraft.ro = ro;   // không phải người tạo đồ / đợt đã đóng: chỉ xem
  if (!it) itDraft.qty = 1;
  openSheet(`${kForm(it, ro)}${ro ? `<p class="xro">${BILL ? '' : closedItem(it) ? 'Đã chốt sổ nên không thể chỉnh sửa' : 'Chỉ người tạo đồ mới sửa được'}</p>` : ''}`);
  const sb = $('#sheetBody'); sb.classList.add('ksheet'); sb.classList.toggle('iro', ro);
  if (ro) sb.querySelectorAll('input').forEach(i => { i.readOnly = true; i.tabIndex = -1; });
  fitRows();
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
  return `<p class="xl">Người ứng tiền</p><div class="xr rowf" data-rowf="k:pay" data-rows="2">${(() => { const back = itDraft.id ? itPays(itemOf(G, itDraft.id) || { cost: 0 }).reduce((t, p) => t + (p.id === FUND ? Number(p.amt) || 0 : 0), 0) : 0; return (ro ? !on(FUND) : !on(FUND) && fundLeftV(back) <= 0) ? '' : pc(FUND, 'Rút quỹ').replace('</button>', `<small>${fundLeftK(back)}</small></button>`); })()}${G.members.filter(m => !m.left && (!ro || on(m.id))).map(m => pc(m.id, m.name)).join('')}<button class="chip rtg" data-rowtgl="k:pay" aria-label="Xem tất cả / thu gọn" aria-expanded="false" hidden>${svg('i-up')}</button></div>${rows ? `<div class="xrows kprows">${rows}</div>` : ''}${ro ? '' : `<p class="warn xspw" id="itSpW"${itSpOver() ? '' : ' hidden'}>Chọn thêm người ứng tiền</p>`}`;
}
const itRank = id => isSp(id) ? -2 : id === FUND ? -1 : 0;
function itFlows(d){ const fl = (d.pl || []).map(p => ({ id: p.id, amt: Number(p.amt) || 0 })).filter(p => p.id === FUND || isSp(p.id) || G.members.some(m => m.id === p.id)).sort((a, b) => itRank(a.id) - itRank(b.id));
  const c = Number(d.cost) || 0; if (fl.length === 1) fl[0].amt = c; else if (fl.length) fl[0].amt = c - fl.slice(1).reduce((t, f) => t + f.amt, 0); return fl; }
const itPayOk = d => { const fl = itFlows(d); return fl.length > 0 && fl[0].amt >= 0; };
function kPayRefresh(){ const fl = itFlows(itDraft), a = $('#itAuto'); if (a && fl.length > 1) { const f = fl[0]; a.textContent = (f.amt < 0 ? '−' : '') + fmt(Math.abs(f.amt)); a.className = `xamt ${f.id === FUND || isSp(f.id) || f.amt < 0 ? 'neg' : 'pos'}`; } document.querySelectorAll('.kok,#itSave').forEach(b => b.classList.toggle('off', !itOk())); }
function kForm(it, ro){   // Figma 21/22: thẻ gồm ngày + tên + mũi tên thu gọn → Giá tiền, Số lượng → chọn người ứng tiền → [Xóa] Lưu lại
  const [, mo, dd] = itDraft.atDay.split('-');
  return `<div class="kform" id="kAddCard"><div class="xt"><label class="xbd" aria-label="Ngày mua"><b>${+dd}</b><span>Th ${+mo}</span><input type="date" data-itdate value="${itDraft.atDay}"></label><input class="xnm" id="itName" placeholder="Vd: Hộp cầu lông" value="${esc(itDraft.name)}" autocomplete="off" enterkeyhint="next" aria-label="Tên đồ">${ro ? `<button class="circ c44 kx" data-close aria-label="Đóng">${svg('i-x')}</button>` : `<button class="kfold" id="kFold" aria-label="Thu gọn">${svg('i-up')}</button>`}</div>
    <div class="kfs"><label class="kf"><span>Giá tiền</span><input id="itCost" inputmode="numeric" enterkeyhint="next" value="${itDraft.cost ? fmt(itDraft.cost) : ''}" placeholder="0" autocomplete="off" aria-label="Giá tiền"></label><i class="kdv"></i>
      <div class="kf"><span>Số lượng</span><span class="step"><button class="stb" id="itMinus" aria-label="Bớt một" ${itDraft.qty > 1 ? '' : 'disabled'}>${svg('i-minus')}</button><input id="itQty" inputmode="numeric" enterkeyhint="done" value="${fmt(Math.max(1, itDraft.qty || 1))}" autocomplete="off" aria-label="Số lượng"><button class="stb" id="itPlus" aria-label="Thêm một">${svg('i-plus')}</button></span></div></div>
    <div class="xs" id="kPaySec">${kPayHTML(ro)}</div>
    ${ro ? '' : `<div class="kbtns">${it && canItem(it) ? `<button class="btn kdelb" data-kdel="${it.id}">Xóa</button>` : ''}<button class="btn yel kok ${itOk() ? '' : 'off'}" id="itSave">Lưu lại</button></div>`}</div>`;
}
const itSpOver = () => !!itDraft && itFlows(itDraft).some(f => isSp(f.id) && f.amt > spLeft(G, f.id.slice(3), null, itDraft.id) + 0.5);   // POD 25/11: giá đồ vượt số tiền góp ngoài quỹ còn lại
const itOk = () => { const o = itSpOver(), w = document.getElementById('itSpW'); if (w) w.hidden = !o; return !!(itDraft && (itDraft.name || '').trim() && itDraft.cost > 0 && (itDraft.pl || []).length) && itPayOk(itDraft) && !o; };   // đủ tên, giá và người ứng tiền thì nút Lưu lại sáng
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
document.addEventListener('keydown', e => { const nx = { itName: '#itCost', itCost: '#itQty' }[e.target.id]; if (e.key === 'Enter' && nx && $(nx)) { e.preventDefault(); $(nx).focus(); $(nx).select?.(); } else if (e.key === 'Enter' && e.target.id === 'itQty') { e.preventDefault(); e.target.blur(); } });   // thêm đồ: Enter đi lần lượt tên → giá → số lượng
