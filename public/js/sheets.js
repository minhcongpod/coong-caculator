/* ================= bảng đáy (sheet) và hộp xác nhận ================= */
function shareSheet(){
  if (!R || !R.grand) { toast('Chưa có khoản chi nào'); return; }
  openSheet(`<h3>Chia sẻ bill</h3>
    <p>Ai mở link này chỉ xem được trang tổng kết của nhóm “${esc(G.name)}”, không ghi thêm khoản chi được.</p>
    <input class="linkbox" id="billLinkBox" readonly value="${esc(billLink(G))}" aria-label="Link bill" style="margin-top:16px">
    <p id="billWarn" hidden style="color:var(--yellow);margin-top:12px">Chưa lưu online được nên link có thể chưa mở được. Kiểm tra mạng rồi bấm Chia sẻ lại.</p>
    <div class="acts" style="margin-top:16px"><button class="btn" id="billShot">${svg('i-img')}Xuất ảnh</button><button class="btn yel" id="billCopy">${svg('i-copy')}Copy link</button></div>`);
  if (onWeb) { clearTimeout(pushT); pushT = null; push().then(() => { const w = $('#billWarn'); if (w && syncState === 'err') w.hidden = false; }); }   // đẩy dữ liệu mới nhất lên trước để link mở ra đúng
}
function expRoSheet(d){   // Figma 535-5584: 3 thẻ #141414 trên nền đen (tên + Số tiền + người ứng tiền / người tham gia / đồ trong kho), không nút đóng (chạm nền để đóng), chữ chốt sổ bên dưới
  const [, mo, dd] = d.day.split('-').map(Number), e = G.exps.find(x => x.id === d.edit), fl = expFlows(d).filter(f => f.id === FUND || Number(f.amt));
  const pr = f => { const r = f.id === FUND || isSp(f.id) ? null : AROLE[f.role] || AROLE.pay, c = f.id === FUND ? 'var(--red)' : isSp(f.id) ? 'var(--pink)' : r[1];   // góp ngoài quỹ: không ghi Ứng tiền, số hồng (POD 25/11)
    return `<div class="erow"><div class="xtx"><b>${f.id === FUND ? 'Rút quỹ' : esc(nm(f.id))}</b>${r ? `<small style="color:${c}">${r[0]}${svg('i-chev')}</small>` : ''}</div><b class="eamt${f.role === 'fixed' ? ' big' : ''}" style="color:${c}">${fmt(Math.abs(Number(f.amt) || 0))}</b></div>`; };
  const who = G.members.filter(m => d.who.includes(m.id)), uses = (G.items || []).filter(it => d.use[it.id] > 0);   // một người ứng cả khoản: chỉ hiện chip tên (POD 25/11)
  openSheet(`<div class="ecard"><div class="vhd"><span class="xbd"><b>${dd}</b><span>Th ${mo}</span></span><b>${esc(d.name || 'Khoản chi')}</b><button class="circ kx" data-close aria-label="Đóng">${svg('i-x')}</button></div>
      <div class="esum${fl.length ? '' : ' nob'}"><b>Số tiền</b><b class="eamt big" style="color:var(--red)">${fmt(Number(d.tot) || settleExp(G, tmpExp(d)).total || 0)}</b></div>
      ${fl.length === 1 && fl[0].id !== FUND && (fl[0].role || 'pay') === 'pay' ? `<p class="el">Người ứng tiền</p><div class="echips"><span class="chip sel">${esc(nm(fl[0].id))}</span></div>` : fl.length ? `<p class="el">Người ứng tiền</p><div class="erows">${fl.map(pr).join('')}</div>` : ''}</div>
    ${who.length ? `<div class="ecard"><p class="el">Người tham gia</p><div class="echips">${who.map(m => `<span class="chip sel">${esc(m.name)}</span>`).join('')}</div></div>` : ''}
    ${uses.length ? `<div class="ecard g16"><p class="el">Đồ trong kho</p><div class="erows">${uses.map(it => `<div class="erow use"><div class="xtx"><b>${esc(it.name)}</b><small style="color:var(--red)">${fmt(d.use[it.id] * unitCost(it))}</small></div><b class="eamt big">${fmt(d.use[it.id])}</b></div>`).join('')}</div></div>` : ''}
    <p class="vro">${roNote(e)}</p>`);
  $('#sheetBody').classList.add('vsheet', 'tro', 'ero');
}
function topRoSheet(a){   // Figma 532-4392: thẻ #141414 trên nền đen: ô ngày + "Góp quỹ" + nút đóng, mỗi người góp một dòng (avatar, tên, số xanh), góp ngoài quỹ, Tổng góp quỹ; chữ chốt sổ bên dưới
  if (!a) return; const x = new Date(a.at || a.ct || Date.now());
  const ps = tps(a).filter(p => Number(p.amt) > 0 && G.members.some(m => m.id === p.id)), ou = spons(G.fund).filter(s => s.add === a.id && Number(s.amt) > 0);
  const row = (av, name, v) => `<div class="vrow">${av}<b class="vnm">${esc(name)}</b><b class="vamt">${fmt(v)}</b></div>`;
  openSheet(`<div class="vcard"><div class="vhd"><span class="xbd"><b>${x.getDate()}</b><span>Th ${x.getMonth() + 1}</span></span><b>Góp quỹ</b><button class="circ kx" data-close aria-label="Đóng">${svg('i-x')}</button></div>
    <div class="vlist">${ps.map(p => row(`<span class="vav">${svg('i-user')}</span>`, nm(p.id), Number(p.amt))).join('')}${ou.map(s => row('', s.name || 'Khác', Number(s.amt))).join('')}<div class="vsum"><b>Tổng góp quỹ</b><b class="vamt">${fmt(ps.reduce((t, p) => t + Number(p.amt), 0) + ou.reduce((t, x) => t + Number(x.amt), 0))}</b></div></div></div><p class="vro">${topNote(a)}</p>`);
  $('#sheetBody').classList.add('vsheet', 'tro');
}
function advSheet(mid, P){   // Figma 535-4877: danh sách khoản chi một người đã ứng tiền trong đợt, chỉ xem (không bấm vào được)
  const D = settle(G).detail;
  const list = byDate(P.exps).map(e => ({ e, v: (D[e.id]?.pays || []).filter(f => f.id === mid).reduce(addAmt, 0) })).filter(x => x.v > 0);
  const tot = list.reduce((t, x) => t + x.v, 0), bd = t => { const x = new Date(t || Date.now()); return `<span class="vbd"><b>${x.getDate()}</b><span>Th ${x.getMonth() + 1}</span></span>`; };
  openSheet(`<div class="vcard"><div class="vhd"><b>${esc(nm(mid))} đã ứng</b><button class="circ kx" data-close aria-label="Đóng">${svg('i-x')}</button></div>
    <div class="vlist">${list.map(({ e, v }) => `<div class="vrow">${bd(e.at)}<b class="vnm">${esc(e.name || 'Khoản chi')}</b><b class="vamt">${fmt(v)}</b></div>`).join('')}<div class="vsum"><b>Tổng đã ứng</b><b class="vamt">${fmt(tot)}</b></div></div></div>`);
  $('#sheetBody').classList.add('vsheet');
}
function openSheet(html, cls = ''){ const b = $('#sheetBody'); b.innerHTML = html; b.classList.remove('ksheet', 'iro', 'asheet', 'aro', 'rsheet', 'vsheet', 'tro', 'ero'); b.classList.toggle('av2', cls === 'av2'); $('#sheet').hidden = false; }
function closeSheet(){
  $('#avPick')?.remove();
  if ($('#sheet').hidden) return; $('#sheet').hidden = true;
  if (['group', 'cal', 'kho'].includes(view)) rerender();
}
function confirmDlg(title, body, okAttr, okText = 'Xóa'){
  closeDlg();
  const el = document.createElement('div'); el.className = 'dlg'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
  el.innerHTML = `<div class="dbox"><h3>${title}</h3><p>${body}</p><div class="acts"><button class="btn quiet" data-dlgclose>Thôi</button><button class="btn danger" ${okAttr}>${okText}</button></div></div>`;
  el.addEventListener('click', e => { if (e.target === el) closeDlg(); });
  document.body.appendChild(el);
}
function closeDlg(){ document.querySelectorAll('.dlg').forEach(x => x.remove()); }
function unlift(){ document.querySelectorAll('.dim,.lacts').forEach(x => x.remove()); document.querySelectorAll('.lift').forEach(x => x.classList.remove('lift')); }
