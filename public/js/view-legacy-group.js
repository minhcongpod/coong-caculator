/* --- Nhóm: nhập khoản chi --- */
function groupView(){
  return `<section class="view">
    <header class="ghead gh"><button class="circ back" id="gBack" aria-label="Quay lại">${svg('i-back')}</button><h1>${esc(G.name)}</h1><div class="pill2"><button id="gLog" aria-label="Lịch sử hoạt động">${svg('i-history')}</button><button data-edit="${G.id}" aria-label="Chỉnh sửa nhóm">${svg('i-pen')}</button></div></header>
    ${dayF ? `<div class="dayf"><span>Ngày ${dayF.slice(8)}/${dayF.slice(5, 7)}</span><button data-dayall>Xem tất cả</button></div>` : ''}
    <div class="view" id="exps" style="gap:12px">${fundCard()}${timeline()}</div>
  </section>`;
}
const p2 = n => String(n).padStart(2, '0');
const isoDay = t => { const d = new Date(t); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`; };
const byDate = a => [...a].sort((x, y) => (x.at || 0) - (y.at || 0) || x.id - y.id);
function timeline(){   // góp thêm quỹ, kho đồ và khoản chi xen kẽ theo thứ tự thời gian (cũ trên, mới dưới)
  const rows = [...(G.fund?.adds || []).map(x => ({ k: 0, x })), ...(G.items || []).map(x => ({ k: 1, x })), ...G.exps.map(x => ({ k: 2, x }))];
  return rows.filter(o => !dayF || (o.x.at && isoDay(o.x.at) === dayF)).sort((a, b) => (a.x.at || 0) - (b.x.at || 0) || a.k - b.k || a.x.id - b.x.id).map(o => [topCard, khoCard, expCard][o.k](o.x)).join('');
}
function ehHTML(e){
  const cal = `<label class="cal" aria-label="Ngày chi">${e.at ? `<b>${new Date(e.at).getDate()}</b><span>Th ${new Date(e.at).getMonth() + 1}</span>` : `<b>–</b><span>Ngày</span>`}<input type="date" data-edate="${e.id}" value="${e.at ? isoDay(e.at) : ''}" ${canExp(e) ? '' : 'disabled'}></label>`;
  return cal + nameHTML(e) + tailHTML(e);
}
function tailHTML(e){ const t = e.fold ? settleExp(G, e).total : 0; return `${t ? `<b class="ftot2">${fmt(t)}</b>` : ''}<button class="fold" data-fold="${e.id}" aria-expanded="${!e.fold}" aria-label="${e.fold ? 'Mở khoản chi' : 'Thu gọn khoản chi'}">${svg('i-up')}</button>`; }
function nameHTML(e){
  return (editing === e.id
    ? `<input class="nm" id="en-${e.id}" data-ename="${e.id}" value="${esc(e.name)}" placeholder="Nhập tên khoản chi" enterkeyhint="done" autocomplete="off" aria-label="Tên khoản chi">`
    : `<button class="ename ${e.name ? '' : 'ph'}" data-editname="${e.id}">${esc(e.name || 'Nhập tên khoản chi')}</button>`);
}
function startEdit(id){ const e = G.exps.find(x => x.id === id), h = document.querySelector(`[data-exp="${id}"] .eh`); if (!e || !h) return; editing = id; h.querySelector('.ename,.nm').outerHTML = nameHTML(e); const i = $('#en-' + id); i.focus(); i.setSelectionRange?.(i.value.length, i.value.length); }
function endEdit(id){ if (editing !== id) return; editing = null; const e = G.exps.find(x => x.id === id), h = document.querySelector(`[data-exp="${id}"] .eh`); if (e) { e.name = e.name.trim(); save(); } if (e && h) { h.querySelector('.ename,.nm').outerHTML = nameHTML(e); } }
function expCard(e){
  const d = settleExp(G, e), ro = !canExp(e);
  const allIn = G.members.length && G.members.every(m => e.parts.includes(m.id)), inMembers = G.members.filter(m => e.parts.includes(m.id));
  const flowRow = f => {
    const cls = f.id === FUND ? 'fundw' : f.role === 'pay' ? '' : f.role;
    return `<div class="flow ${cls}"><span class="who"><b>${f.id === FUND ? 'Rút quỹ' : esc(nm(f.id))}</b>${f.id === FUND ? '' : `<button class="role" data-role="${e.id}:${f.id}">${ROLE[f.role][0]} ${svg('i-chev')}</button>`}</span>
      <input inputmode="numeric" id="amt-${e.id}-${f.id}" data-amt="${e.id}:${f.id}" value="${f.amt ? fmt(f.amt) : ''}" placeholder="0" ${COARSE || ro ? 'readonly' : ''} ${ro ? 'data-ro' : ''} aria-label="${f.id === FUND ? 'Số tiền rút quỹ' : 'Số tiền của ' + esc(nm(f.id))}">${f.note ? `<span class="fnote2 fln">${esc(f.note)}</span>` : ''}</div>`;
  };
  const rank = f => f.id === FUND ? -1 : ROLE_RANK[f.role];   // Rút quỹ luôn nằm trên cùng, rồi ứng tiền, tài trợ, đóng cố định
  const payers = [`<button class="chip ${e.flows.some(f => f.id === FUND) ? 'sel' : 'dark'}" data-flow="${e.id}:${FUND}">Rút quỹ</button>`,   // chip Rút quỹ luôn đứng đầu (quỹ chung nhóm nào cũng có)
    ...inMembers.map(m => `<button class="chip ${e.flows.some(f => f.id === m.id) ? 'sel' : 'dark'}" data-flow="${e.id}:${m.id}">${esc(m.name)}</button>`)].join('');
  const itemLeft = it => Number(it.qty) - itemUsed(G, it.id);
  const useRow = u => { const it = itemOf(G, u.item), q = Number(u.qty) || 0; if (!it) return '';
    return `<div class="flow usew"><span class="who"><b>${esc(it.name)}</b><span class="fnote2">${fmt(q * unitCost(it))}</span></span><span class="step"><button class="stb" data-ustep="${e.id}:${it.id}:-1" aria-label="Bớt một" ${q > 0 ? '' : 'disabled'}>${svg('i-minus')}</button><b>${fmt(q)}</b><button class="stb" data-ustep="${e.id}:${it.id}:1" aria-label="Thêm một" ${itemLeft(it) > 0 ? '' : 'disabled'}>${svg('i-plus')}</button></span></div>`; };
  /* chọn người ứng tiền ↔ kho đồ thì tự đổi qua lại (không khoá) */
  const shown = (G.items || []).filter(it => itemLeft(it) > 0 || (e.use || []).some(u => u.item === it.id));   // món hết kho thì ẩn, trừ món đang chọn ở khoản chi này (để còn sửa được); hết tất cả thì ẩn luôn nhãn
  const useSec = shown.length ? `<p class="sub">Chọn đồ trong kho</p>
    <div class="scroll rowf" data-rowf="${e.id}:k">${shown.map(it => `<button class="chip ${(e.use || []).some(u => u.item === it.id) ? 'sel' : 'dark'}" data-useitem="${e.id}:${it.id}">${esc(it.name)}<span class="cnt">${fmt(itemLeft(it))}</span></button>`).join('')}<button class="chip rtg" data-rowtgl="${e.id}:k" aria-label="Xem tất cả / thu gọn" aria-expanded="false" hidden>${svg('i-up')}</button></div>
    ${(e.use || []).map(useRow).join('')}` : '';
  const calc = d.total > 0 || d.fixed.length ? `<div class="calc" id="calc-${e.id}">${calcRows(e, d)}</div>` : `<div class="calc" id="calc-${e.id}"></div>`;
  return `<article class="exp" data-exp="${e.id}">
    <div class="eh">${ehHTML(e)}</div>
    ${e.fold ? '' : `<div class="scroll rowf" data-rowf="${e.id}:p"><button class="chip ${allIn ? 'sel' : 'dark'}" data-all="${e.id}">Tất cả${inMembers.length ? `<span class="cnt">${inMembers.length}</span>` : ''}</button>${G.members.map(m => `<button class="chip ${e.parts.includes(m.id) ? 'sel' : 'dark'}" data-part="${e.id}:${m.id}">${esc(m.name)}</button>`).join('')}<button class="chip rtg" data-rowtgl="${e.id}:p" aria-label="Xem tất cả / thu gọn" aria-expanded="false" hidden>${svg('i-up')}</button></div>
    ${inMembers.length ? `<hr>
    <p class="sub">Chọn người ứng tiền</p>
    <div class="scroll rowf" data-rowf="${e.id}:y">${payers}<button class="chip rtg" data-rowtgl="${e.id}:y" aria-label="Xem tất cả / thu gọn" aria-expanded="false" hidden>${svg('i-up')}</button></div>
    ${e.flows.filter(f => f.id === FUND || G.members.some(m => m.id === f.id)).sort((a, b) => rank(a) - rank(b)).map(flowRow).join('')}
    ${useSec}
    ${calc}` : ''}`}
  </article>`;
}
/* Góp thêm vào quỹ chung về sau: mỗi lần góp là một card ngay dưới card Quỹ (ngày nào, những ai góp, mỗi người bao nhiêu).
   a.ps = [{ id, amt }]; bản cũ lưu một người a.who / a.amt nên đọc qua tps() để tương thích. */
function tps(a){ return a.ps || (a.who ? [{ id: a.who, amt: Number(a.amt) || 0 }] : []); }
function setTps(a, ps){ a.ps = ps; delete a.who; delete a.amt; }
function topCard(a){
  const ps = tps(a), sel = G.members.filter(m => ps.some(p => p.id === m.id)), allIn = G.members.length && sel.length === G.members.length, tot = ps.reduce((t, p) => t + (G.members.some(m => m.id === p.id) ? Number(p.amt) || 0 : 0), 0);
  const cal = `<label class="cal" aria-label="Ngày góp">${a.at ? `<b>${new Date(a.at).getDate()}</b><span>Th ${new Date(a.at).getMonth() + 1}</span>` : `<b>–</b><span>Ngày</span>`}<input type="date" data-tdate="${a.id}" value="${a.at ? isoDay(a.at) : ''}"></label>`;
  const tail = `${a.fold && tot ? `<b class="ftot2">${fmt(tot)}</b>` : ''}<button class="fold" data-foldtop="${a.id}" aria-expanded="${!a.fold}" aria-label="${a.fold ? 'Mở khoản góp' : 'Thu gọn khoản góp'}">${svg('i-up')}</button>`;   // thu gọn thì hiện tổng tiền góp (xanh: tiền vào quỹ)
  return `<article class="exp tcard" data-top="${a.id}">
    <div class="eh">${cal}<b class="ename">Góp quỹ</b>${tail}</div>
    ${a.fold ? '' : `<div class="scroll"><button class="chip ${allIn ? 'sel' : 'dark'}" data-tall="${a.id}">Tất cả${sel.length ? `<span class="cnt">${sel.length}</span>` : ''}</button>${G.members.map(m => `<button class="chip ${sel.includes(m) ? 'sel' : 'dark'}" data-tpw="${a.id}:${m.id}">${esc(m.name)}</button>`).join('')}</div>
    <div class="tfl">${sel.map(m => { const p = ps.find(x => x.id === m.id); return `<div class="flow topf">${rowAv(m)}<span class="who"><b>${esc(m.name)}</b></span><input inputmode="numeric" id="tamt-${a.id}-${m.id}" data-tamt="${a.id}:${m.id}" value="${p.amt ? fmt(p.amt) : ''}" placeholder="Nhập" ${COARSE ? 'readonly' : ''} aria-label="Số tiền ${esc(m.name)} góp thêm"></div>`; }).join('')}</div>`}
  </article>`;
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
function refreshCalc(e){ const el = document.getElementById('calc-' + e.id); if (el) el.innerHTML = calcRows(e, settleExp(G, e)); }

/* role sheet */
let pickPending = null;   // người vừa chọn đang chờ chọn vai trò: đóng bảng mà không chọn = huỷ lựa chọn đó
function roleSheet(eid, mid, pick){
  const e = G.exps.find(x => x.id === eid), f = e.flows.find(x => x.id === mid);
  if (pick) { const o = k => `<button class="opt" data-pickrole="${eid}:${mid}:${k}" role="radio" aria-checked="false"><span><b>${ROLE[k][0]}</b>${ROLE[k][1] ? `<small>${ROLE[k][1]}</small>` : ''}</span><i class="rd"></i></button>`;
    openSheet(`<div class="rhead"><h3>${esc(nm(mid))}</h3></div><div class="ropts">${o('pay')}${o('fixed')}</div>`); return; }   // chọn lần đầu: chỉ 2 lựa chọn, chạm là xong và sang nhập số tiền
  const box = `<label class="amtbox"><input class="note" id="sNote" data-snote="${eid}:${mid}" value="${esc(f.note || '')}" placeholder="Nhập ghi chú" autocomplete="off" enterkeyhint="done" aria-label="Ghi chú (không bắt buộc)"></label>`;
  const opt = k => `<button class="opt ${f.role === k ? 'on' : ''}" data-setrole="${eid}:${mid}:${k}" role="radio" aria-checked="${f.role === k}"><span><b>${ROLE[k][0]}</b>${ROLE[k][1] ? `<small>${ROLE[k][1]}</small>` : ''}</span><i class="rd"></i></button>`;
  openSheet(`<div class="rhead"><h3>${esc(nm(mid))}</h3><button class="circ rok" data-close aria-label="Xong">${svg('i-check')}</button></div><div class="ropts">${opt('pay')}${f.role === 'donate' ? opt('donate') : ''}${opt('fixed')}</div>${box}`);
}

/* long-press sheet */
function pressSheet(eid, el){
  unlift();
  const card = el || document.querySelector(`[data-exp="${eid}"]`); if (!card) return;
  document.activeElement?.blur?.();
  const dim = document.createElement('div'); dim.className = 'dim'; dim.addEventListener('click', unlift); document.body.appendChild(dim);
  card.classList.add('lift');
  card.insertAdjacentHTML('afterend', el ? `<div class="lacts"><button class="btn" data-shotcard>Xuất ảnh</button></div>` : `<div class="lacts">${(ex => canExp(ex) ? `<button class="btn danger" data-delexp="${eid}">Xoá</button>` : `<button class="btn lockby" disabled>${svg('i-lock')}${esc(byName(ex.by, ex.byName))} tạo</button>`)(G.exps.find(x => x.id === eid))}<button class="btn" data-shot="${eid}">Xuất ảnh</button></div>`);
  const r = card.getBoundingClientRect(), bar = document.querySelector('.bar'), need = r.bottom + 76 - (innerHeight - (bar ? bar.offsetHeight : 16));
  if (r.top < 16) window.scrollBy({ top: r.top - 16, behavior: 'smooth' }); else if (need > 0) window.scrollBy({ top: Math.min(need, r.top - 16), behavior: 'smooth' });
}
function pressTop(aid, kind = 'top'){   // nhấn giữ card Góp thêm quỹ / Kho đồ: Xoá / Xuất ảnh
  unlift();
  const card = document.querySelector(`[data-${kind}="${aid}"]`); if (!card) return;
  document.activeElement?.blur?.();
  const dim = document.createElement('div'); dim.className = 'dim'; dim.addEventListener('click', unlift); document.body.appendChild(dim);
  card.classList.add('lift');
  card.insertAdjacentHTML('afterend', `<div class="lacts"><button class="btn danger" data-del${kind}="${aid}">Xoá</button><button class="btn" data-shot${kind}="${aid}">Xuất ảnh</button></div>`);
  const r = card.getBoundingClientRect(), bar = document.querySelector('.bar'), need = r.bottom + 76 - (innerHeight - (bar ? bar.offsetHeight : 16));
  if (r.top < 16) window.scrollBy({ top: r.top - 16, behavior: 'smooth' }); else if (need > 0) window.scrollBy({ top: Math.min(need, r.top - 16), behavior: 'smooth' });
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
async function screenshot(eid, el){
  const tcd = !!(el?.classList?.contains('tcard') || el?.classList?.contains('kcard')), card = el || document.querySelector(`[data-exp="${eid}"]`), e = tcd ? { name: el.classList.contains('kcard') ? 'Kho-do' : 'Gop-them-quy' } : el ? { name: `Tong-ket-${G.name || ''}` } : G.exps.find(x => x.id === eid);
  if (!card || !window.html2canvas) { unlift(); toast('Không xuất được ảnh, thử lại khi có mạng'); return; }
  toast('Đang xuất ảnh…');
  let url = '';
  try {
    const TXT = 'input:not([type=date]):not([type=file]):not([type=checkbox])';
    const ins = [...card.querySelectorAll(TXT)].map(i => { const cs = getComputedStyle(i); return { v: i.value || i.placeholder, c: cs.color, fs: cs.fontSize, fw: cs.fontWeight, ff: cs.fontFamily, fl: cs.flex, w: i.offsetWidth }; });
    card.setAttribute('data-shotroot', '');
    const tw = el && !tcd ? Math.max(0, ...[...card.querySelectorAll('.tbl')].map(t => t.scrollWidth)) : 0, nc = el && !tcd ? Math.max(0, (card.querySelector('.tbl')?.rows[0]?.cells.length || 1) - 1) : 0, cw = el && !tcd ? Math.max(card.offsetWidth, 136 + nc * (136 + nc * 81 <= card.offsetWidth ? 81 : 64)) + 32 : Math.max(card.offsetWidth, tw + 32);   // ảnh tổng kết rộng bằng trang: giữ nguyên cỡ chữ như trên máy, bảng nhiều người thì tách thành nhiều bảng (POD 22/11)
    const y0 = scrollY; window.scrollTo(0, 0);   // iPhone: trang đang cuộn thì ảnh bị trống một khoảng lớn phía trên
    const c = await html2canvas(card, { backgroundColor: '#000', scale: 3, logging: false, width: cw, windowWidth: Math.max(innerWidth, cw), onclone: d => { d.documentElement.style.zoom = ''; const sr = d.querySelector('[data-shotroot]'); if (sr) { sr.style.width = cw + 'px'; sr.style.boxSizing = 'border-box'; }
      d.querySelectorAll('.lift').forEach(x => x.classList.remove('lift')); d.querySelectorAll('[data-shotroot] .ghead:not(.shead)').forEach(x => x.style.display = 'none'); d.querySelectorAll('[data-shotroot] .shead .back').forEach(x => x.remove()); d.querySelectorAll('[data-shotroot] :is(.tbl .phd, .pcard) .pchv').forEach(x => x.remove()); d.querySelectorAll('[data-shotroot] .tbl .advb').forEach(x => x.style.textDecoration = 'none'); d.querySelectorAll('[data-shotroot] .txcard h2').forEach(x => x.style.cssText = 'font-size:14px;line-height:18px;font-weight:700;color:var(--text);letter-spacing:0;margin:0');   /* ảnh: bỏ mũi tên đợt cũ, bỏ gạch chân Đã ứng, tiêu đề Ai chuyển cho ai cùng cỡ chữ ngày đợt (POD 25/11) */   /* ảnh: bỏ mũi tên cạnh ngày đợt, ảnh không mở/đóng được (POD 25/11) */ const rt = d.querySelector('section[data-shotroot]'); if (rt) rt.style.padding = '28px 16px 16px';
      d.querySelectorAll('[data-shotroot] .tblw').forEach(w => { w.style.overflow = 'visible'; w.style.width = 'max-content'; w.style.minWidth = '100%'; });
      const st = d.createElement('style'); st.textContent = '.tbl tr > :first-child{position:static!important}*{font-variant-numeric:normal!important;transition:none!important;animation:none!important}'; d.head.appendChild(st);
      d.querySelectorAll('[data-shotroot] ' + TXT).forEach((i, k) => { const o = ins[k]; if (!o) return; const sp = d.createElement('span');
        sp.textContent = o.v; sp.style.cssText = `display:block;flex:${o.fl};width:${o.w}px;min-width:0;color:${o.c};font-size:${o.fs};font-weight:${o.fw};font-family:${o.ff};text-align:right;white-space:nowrap;align-self:center`; i.replaceWith(sp); });
      d.querySelectorAll('[data-shotroot] svg use').forEach(u => { const sym = d.querySelector((u.getAttribute('href') || '').trim()); const sv = u.parentNode; if (!sym || !sv) return;
        const cs = d.defaultView.getComputedStyle(sv), vb = sym.getAttribute('viewBox') || '0 0 24 24', [, , vw, vh] = vb.split(/\s+/).map(Number), flip = /^matrix\(-1, 0, 0, -1/.test(cs.transform);
        sv.setAttribute('viewBox', vb); sv.innerHTML = (flip ? `<g transform="rotate(180 ${vw / 2} ${vh / 2})">` : '') + sym.innerHTML.replace(/currentColor/g, cs.color) + (flip ? '</g>' : ''); sv.querySelectorAll('[style]').forEach(x => x.removeAttribute('style')); if (flip) sv.style.transform = 'none'; });
      if (el && !tcd) {   // ảnh tổng kết: tiêu đề = tên nhóm, dòng dưới = lúc xuất ảnh; bảng tách theo cột cho vừa bề ngang trang
        const h1 = d.querySelector('[data-shotroot] .shead h1'), sb = d.querySelector('[data-shotroot] .shead .sub'), t = new Date(), p2 = n => String(n).padStart(2, '0');
        const when = `${p2(t.getHours())}:${p2(t.getMinutes())} ${p2(t.getDate())}/${p2(t.getMonth() + 1)}/${t.getFullYear()}`; if (h1) h1.textContent = G.name || 'Tổng kết'; if (sb) sb.textContent = when;
        const inner = cw - 32;
        const root = d.querySelector('[data-shotroot]'), solo = root?.matches('.tblw');   // nhấn giữ riêng bảng thu chi → ảnh chỉ có bảng
        (solo ? [root] : [...d.querySelectorAll('[data-shotroot] .tblw')]).forEach(w => { const tb = w.querySelector('.tbl'); if (!tb || !tb.rows.length) return;
          tb.classList.remove('mefirst'); tb.querySelectorAll('.me').forEach(c => c.classList.remove('me'));   // ảnh gửi cho cả nhóm: bỏ nền/tên vàng của cột mình (POD 25/11)
          if (solo) { const inner0 = w.cloneNode(true); inner0.removeAttribute('data-shotroot'); w.replaceChildren(inner0); w.style.cssText += `;overflow:visible;background:#000;border-radius:0;padding:16px;display:flex;flex-direction:column;gap:16px;width:${cw}px;box-sizing:border-box`;
            const hd = d.createElement('div'); hd.innerHTML = `<b style="display:block;font-size:18px;line-height:24px;font-weight:700;color:#fff">${esc(G.name || '')}</b><span style="display:block;font-size:14px;line-height:18px;color:var(--text-2)">${when}</span>`; w.prepend(hd); w = inner0; }
          const n = tb.rows[0].cells.length - 1, cwid = Math.max(64, Math.floor((inner - 136) / Math.max(1, n))) + 'px';   // 136 = cột tên (đổi từ 100 ngày 25/11, quên đổi ở đây nên cột cuối lòi ra ngoài card)   // một bảng duy nhất (POD 22/11): đông người thì cột hẹp lại 64px, ảnh rộng thêm
          w.style.width = '100%'; tb.querySelectorAll('th,td').forEach(c => { if (c.cellIndex > 0) c.style.width = c.style.minWidth = c.style.maxWidth = cwid; }); });
      }
      d.querySelectorAll('[data-shotroot] .tbl th span').forEach(x => { if (x.scrollWidth <= x.clientWidth + 1) return; const t = x.textContent; let n = t.length; while (n > 1 && (x.textContent = t.slice(0, n - 1).trimEnd() + '…', x.scrollWidth > x.clientWidth + 1)) n--; });   /* ảnh: html2canvas không vẽ dấu … nên tự cắt tên dài (POD 25/11 5B) */ 
    } }).finally(() => { card.removeAttribute('data-shotroot'); window.scrollTo(0, y0); });
    url = c.toDataURL('image/png');
    const blob = await new Promise(r => c.toBlob(r, 'image/png'));
    const name = `${(e?.name || 'khoan-chi').replace(/[^\p{L}\p{N}]+/gu, '-')}.png`, file = new File([blob], name, { type: 'image/png' });
    unlift();
    if (!touchNow()) {   // máy tính (bấm chuột): lưu thẳng thành tệp, không mở bảng chia sẻ
      const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); toast('Đã lưu ảnh vào thư mục Tải về'); return;
    }
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file] }); return; } catch(err) { if (err.name === 'AbortError') return; }
    } else if (!/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); toast('Đã lưu ảnh'); return;
    }
    openSheet(`<h3>Lưu ảnh</h3><p>Giữ vào ảnh rồi chọn “Lưu vào Ảnh”.</p><img class="shot" alt="Ảnh khoản chi" src="${url}"><button class="btn" data-close style="margin-top:8px">Xong</button>`);
  } catch(err) { unlift(); toast('Không xuất được ảnh'); }
}
