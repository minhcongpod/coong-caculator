/* ================= trang Tổng kết ================= */
const pRange = P => { const ts = [...P.exps.map(e => e.at), ...P.adds.map(a => a.at || a.ct)].filter(Boolean).map(t => new Date(t)).sort((a, b) => a - b); if (!ts.length) return 'Đợt mới';
  const a = ts[0], b = ts[ts.length - 1], d = x => x.getDate(), m = x => x.getMonth() + 1;
  return d(a) === d(b) && m(a) === m(b) ? `${d(a)}/${m(a)}` : m(a) === m(b) ? `${d(a)}-${d(b)}/${m(b)}` : `${d(a)}/${m(a)}-${d(b)}/${m(b)}`; };
const sumOpen = new Set();   // các đợt cũ đang mở xem (đợt hiện tại luôn mở, không có mũi tên)
function sumView(){
  const head = `<header class="ghead shead">${BILL ? '' : `<button class="circ back" id="sBack" aria-label="Quay lại nhập">${svg('i-back')}</button>`}<div class="ttl3"><div class="r1"><h1>Tổng kết</h1><svg class="wm" viewBox="0 0 135 27" role="img" aria-label="Coong Nợ"><use href="#i-logo"/></svg></div><span class="sub">${esc(G.name)}</span></div></header>`;   // chữ Tổng kết + tên nhóm căn trái, logo bên phải
  if (!R.grand) return `<section class="view">${head}<p class="note">${BILL ? 'Bill này chưa có khoản chi nào.' : 'Chưa có khoản chi nào. Quay lại, thêm khoản chi và chọn người chi tiền.'}</p></section>`;
  const fundBox = sumCards(R);   // Figma 24: Quỹ chung luôn mở + thẻ Còn trong kho (mỗi đồ còn/tổng + thanh)
  const warns = R.warns.map(w => `<p class="note" style="color:var(--yellow);padding:16px 20px;text-align:left;font-size:14px;line-height:18px">${esc(w)}</p>`).join('');
  const meM = myMember(G), isMine = t => !!meM && (t.from === meM.id || t.to === meM.id);
  /* POD 25/11 (tối): mỗi đợt một card Ai chuyển cho ai ngay dưới bảng chi tiết thu chi của đợt; đợt đã chốt sổ vẫn giữ card (các dòng đã chuyển, chỉ xem) */
  const txsFor = (P, cur) => {
  const order = [...(cur ? R.txs : []).map(t => ({ ...t, key: txKey(t), done: false })), ...P.pays.map(p => ({ from: p.from, to: p.to, amount: p.amt, key: 'p:' + p.id, done: true }))].sort((a, b) => (isMine(b) - isMine(a)) || (a.done - b.done) || b.amount - a.amount);
  if (cur) { const pk = t => t.from + '>' + t.to; if (!txPin) txPin = { gid: G.id, v: 'sum', ord: order.map(pk) }; else { const ix = t => { const i = txPin.ord.indexOf(pk(t)); return i < 0 ? 1e9 : i; }; order.sort((a, b) => ix(a) - ix(b)); order.forEach(t => { if (!txPin.ord.includes(pk(t))) txPin.ord.push(pk(t)); }); } }   // khoản của mình lên trên cùng, rồi chưa chuyển trước, đã chuyển (g.pays) xuống dưới
  const txn = id => meM && id === meM.id ? 'Bạn' : nm(id);
  return order.length ? `<div class="txcard"><h2>Ai chuyển cho ai?</h2><div class="txs">${order.map(t => {
    const done = t.done, can = !BILL && (!(P.cut && done) || cur) && (   /* POD 26/11: dòng đã tích ở đợt đã chốt chỉ bỏ được ở đợt vừa chốt (chưa có khoản mới) */!meM || isMine(t) || canDelG(G));   // tích được khoản liên quan tới mình; người tạo nhóm tích được mọi khoản (POD 25/11)
    const inner = `<span class="ck">${svg('i-check')}</span><span class="w"><span class="pair"><span>${esc(txn(t.from))}</span>${svg('i-arrow')}<span>${esc(txn(t.to))}</span></span></span>
      <span class="amt">${fmt(t.amount)}</span>`;
    if (can && !done && t.from === FUND && t.amount > R.fund.left + 500) return `<button class="tx short" data-txshort="${fmt(Math.max(0, Math.round(R.fund.left / 1000) * 1000))}" aria-disabled="true">${inner}</button>`;   // POD 26/11: quỹ không đủ tiền thì dòng Quỹ chung → thành viên vẫn hiện nhưng không tích được
    return can ? `<button class="tx ${done ? 'done' : ''}" data-tx="${esc(t.key)}" aria-pressed="${done}">${inner}</button>` : `<div class="tx other ${done ? 'done' : ''}" aria-disabled="true">${inner}</div>`;
  }).join('')}</div></div>` : '';
  };
  /* Bảng sao kê: cột đầu = khoản mục (dính trái), mỗi cột sau = một thành viên (vuốt ngang). Số tính theo nghìn đồng. */
  const K = n => { const a = Math.abs(n) >= 1e6 ? Math.round(Math.abs(n) / 1000) : Math.round(Math.abs(n) / 100) / 10;   // từ 1 triệu: bỏ phần lẻ cho vừa ô
    if (!a) return '-'; const [i, f] = String(a).split('.'); return (n < 0 ? '−' : '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (f ? ',' + f : '') + 'K'; };   // nghìn đồng: 112500 → 112,5K, 1234500 → 1.235K
  const memAll = meM ? [meM, ...G.members.filter(m => m !== meM)] : G.members;   /* tài khoản của mình luôn ở cột đầu (cột 2 của bảng), nền vàng nhạt (POD 22/11) */
  const dd = t => { if (!t) return ''; const x = new Date(t); return `${x.getDate()}/${x.getMonth() + 1}`; };
  const big = n => Math.abs(n) >= 1e7 ? ' style="font-size:12px"' : '';   // từ 10 triệu: chữ nhỏ lại cho vừa ô 72px
  const cell = (n, cls) => `<td class="${n ? cls : 'c-m'}"${big(n)}>${K(n)}</td>`;
  let meCol = false; const ins = (a, sp) => meCol ? [a[0], ...sp, ...a.slice(1)] : [...sp, ...a];   // POD 25/11: cột góp ngoài quỹ đứng ngay sau cột của mình
  const spAll = [], spName = x => (x.name || '').trim() || 'Khác';
  const row = (label, sub, vals, cls, tr = '', sp = []) => `<tr class="${tr}"><td><span class="rl">${label}</span>${sub ? `<small>${sub}</small>` : ''}</td>${ins(vals.map(v => cell(v, cls)), sp).join('')}</tr>`;
  const PS = periods(G), pKey = P => P.cut ? String(P.cut.id) : 'open';
  const table = (P, i) => {
    const key = pKey(P), cur = i === PS.length - 1, hd = `${cur ? '' : svg('i-chev', 'pchv')}<span>${pRange(P)}</span>`;   // POD 25/11: đợt trước có mũi tên hiện/ẩn, đợt hiện tại không
    if (!cur && !sumOpen.has(key)) return `<button class="pcard" data-sper="${key}" aria-expanded="false">${hd}</button>`;
    const S = settle(subG(G, [P], i === 0)), C = R.fund.used ? (c => c.fund.used ? c : null)(settle(subG(G, PS.slice(0, i + 1), true, true))) : null;
    const mem = memAll.filter(m => { const id = m.id; return S.fund.contribs?.[id] > 0 || P.adds.some(a => tps(a).some(x => x.id === id && Number(x.amt) > 0)) || P.pays.some(x => x.from === id || x.to === id)
      || ((C || S).nets.find(x => x.id === id) || {}).net || P.exps.some(e => { const d = S.detail[e.id]; return d && d.total > 0 && (d.pays.some(f => f.id === id) || d.fixed.some(f => f.id === id) || d.sharers.includes(id)); }); });   // POD 25/11: ai không có khoản thu chi nào trong đợt thì không hiện cột
    meCol = !!meM && mem[0] === meM;   // POD 25/11: đợt chưa có góp quỹ / chi bằng quỹ (tính tới hết đợt đó) thì như nhóm không quỹ: dòng cuối là Còn lại
    const rows = [], aIds = L => new Set(L.flatMap(x => x.adds.map(a => String(a.id)))), inP = aIds([P]), upto = aIds(PS.slice(0, i + 1));
    const spN = [...new Set(spAll.filter(x => upto.has(String(x.add))).map(spName))], z = spN.map(() => cell(0, 'c-m'));   // mỗi tên góp ngoài quỹ một cột
    const spUse = (L, n) => L.flatMap(x => x.exps).reduce((t, e) => t + e.flows.reduce((u, f) => u + (f.id === 'sp:' + n && f.role === 'pay' ? Number(f.amt) || 0 : 0), 0), 0), spUx = n => stList.reduce((t, e) => t + S.detail[e.id].pays.reduce((u, f) => u + (f.id === 'sp:' + n && !f.item ? Number(f.amt) || 0 : 0), 0), 0);
    const spSum = (ids, n, add) => spAll.filter(x => spName(x) === n && (add != null ? String(x.add) === String(add) : ids.has(String(x.add)))).reduce((t, x) => t + Number(x.amt), 0);
    const stList = byDate(P.exps).filter(e => S.detail[e.id].total > 0);
    const bear = stList.map(e => { const d = S.detail[e.id]; return { e, v: mem.map(m => { const f = d.fixed.find(x => x.id === m.id); return { n: (f ? Number(f.amt) * d.k : 0) + (d.sharers.includes(m.id) ? d.per : 0), pink: !!f && f.role === 'fixed' }; }) }; });   // mỗi khoản chi một dòng, tính cả phần dùng kho đồ (POD chốt 18/11)
    /* màu theo ý nghĩa: được cộng (góp, ứng, góp ngoài quỹ) xanh; bị trừ (phần phải chịu của từng khoản, Tổng) đỏ */
    const hasC = mem.some(m => S.fund.contribs?.[m.id] > 0);
    if (hasC) rows.push(row('Góp quỹ', '', mem.map(m => S.fund.contribs?.[m.id] || 0), 'c-g', '', z));
    byDate(P.adds.map(a => ({ ...a, at: a.at || a.ct }))).forEach(a => { const ps = tps(a), v = mem.map(m => Number(ps.find(x => x.id === m.id)?.amt) || 0), sv = spN.map(n => spSum(null, n, a.id)); if (!v.some(Boolean) && !sv.some(Boolean)) return;   // POD 25/11: mỗi lần góp quỹ một dòng, ngày ở dưới; bấm mở bảng chi tiết
      rows.push(`<tr><td><button class="rlb" data-cent="top:${a.id}"><span class="rl">Góp quỹ</span>${a.at ? `<small>${dd(a.at)}</small>` : ''}</button></td>${ins(v.map(n => cell(n, 'c-g')), sv.map(n => cell(n, 'c-g'))).join('')}</tr>`); });
    const spU = spN.map(spUx);
    const adv = mem.map(m => stList.reduce((t, e) => t + S.detail[e.id].pays.filter(f => f.id === m.id).reduce((u, f) => u + Number(f.amt), 0), 0));
    const lab = id => { if (!P.pays.some(x => x.from === id || x.to === id)) return '';   // POD 25/11 (5B): chỉ hiện khi người đó đã tích hết các khoản của mình trong đợt
      if (!P.cut && R.txs.some(t => t.from === id || t.to === id)) { const o = P.pays.reduce((t, x) => t + (x.from === id ? Number(x.amt) || 0 : 0), 0), i = P.pays.reduce((t, x) => t + (x.to === id ? Number(x.amt) || 0 : 0), 0); return o ? `Đã trả ${K(o)}` : i ? `Đã nhận ${K(i)}` : ''; }   // POD 25/11: mới trả một phần (đã trả rồi lại có khoản chi mới) thì ghi số đã trả dưới số còn lại
      return P.pays.some(x => x.from === id) ? 'Đã trả' : 'Đã nhận'; };
    const onAdv = id => false && R.fund.used &&   /* POD 25/11 (sau): chữ trạng thái luôn nằm ở dòng Quỹ còn, kèm số tiền */ adv[mem.findIndex(m => m.id === id)] > 0 && lab(id) === 'Đã nhận';   // POD 25/11: quỹ chung trả lại tiền đã ứng → chữ Đã nhận nằm dưới số Đã ứng
    if (adv.some(Boolean)) rows.push(`<tr><td><span class="rl">Đã ứng</span></td>${ins(adv.map((n, i) => n ? `<td class="c-g"${big(n)}><button class="advb" data-adv="${mem[i].id}:${key}">${K(n)}</button>${onAdv(mem[i].id) ? '<small class="pdone">Đã nhận</small>' : ''}</td>` : cell(0, 'c-g')), z).join('')}</tr>`);   // POD 25/11: bấm số đã ứng → các khoản chi người đó ứng
    bear.forEach(({ e, v }) => rows.push(`<tr><td><button class="rlb" data-cent="exp:${e.id}"><span class="rl">${esc(e.name || 'Khoản chi')}</span><small class="ta">${K(S.detail[e.id].total)}${e.at ? `<span class="td"> • ${dd(e.at)}</span>` : ''}</small></button></td>${ins(v.map(c => cell(c.n, c.pink ? 'c-p' : 'c-r')), spN.map(n => cell(S.detail[e.id].pays.reduce((t, f) => t + (f.id === 'sp:' + n && !f.item ? Number(f.amt) || 0 : 0), 0), 'c-p'))).join('')}</tr>`));   // POD 25/11: tiền góp ngoài quỹ dùng ở khoản nào hiện ở dòng khoản đó, màu hồng
    rows.push(row('Tổng', '', mem.map((m, i) => bear.reduce((t, b) => t + b.v[i].n, 0)), 'c-r', 'sum', spU.map(n => cell(n, 'c-p'))));
    const netP = id => ((C || S).nets.find(x => x.id === id) || { net: 0 }).net;
    rows.push(`<tr class="fin"><td><span class="rl">Còn lại</span></td>${ins(mem.map(m => { const l0 = onAdv(m.id) ? '' : lab(m.id), l = l0,   /* POD 25/11 (tối): đã nhận từ Quỹ chung thì hiện Đã nhận */ n = netP(m.id) + (l0 && C ? P.pays.reduce((t, x) => t + (x.to === m.id ? Number(x.amt) || 0 : 0) - (x.from === m.id ? Number(x.amt) || 0 : 0), 0) : 0); return `<td class="${n > 0 ? 'c-g' : n < 0 ? 'c-r' : 'c-m'}"${big(n)}>${n > 0 ? '+' : ''}${K(n)}${l ? `<small class="pdone">${l}</small>` : ''}</td>`; }), spN.map(n => { const v = spSum(C ? upto : inP, n) - spUse(C ? PS.slice(0, i + 1) : [P], n) - spItems(G, n) + spBack(G, (C ? PS.slice(0, i + 1) : [P]).flatMap(x => x.exps), n); return `<td class="${v > 0 ? 'c-g' : 'c-m'}"${big(v)}>${v > 0 ? '+' : ''}${K(v)}</td>`; })).join('')}</tr>`);   // POD 25/11: đã trả / đã nhận vẫn hiện số tiền của đợt (trước khi chuyển), không ghi "-"
    return `<div class="pgrp"><div class="tblw"><table class="tbl${meCol ? ' mefirst' : ''}"><thead><tr><th class="pth">${cur ? `<span class="phd">${hd}</span>` : `<button class="phd" data-sper="${key}" aria-expanded="true">${hd}</button>`}</th>${ins(mem.map(m => `<th><span>${esc(m.name)}</span></th>`), spN.map(n => `<th><span>${esc(n)}</span></th>`)).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div></div>${txsFor(P, cur)}`;
  };
  const people = PS.map(table).join('');
  return `<section class="view sumv">${head}<div class="stack">${fundBox}${warns}${people}</div>
  </section>`;
}
function sumCards(S){   // trang Tổng kết (Figma 24): Quỹ chung hiện hết chi tiết, Còn trong kho liệt kê từng đồ còn bao nhiêu
  const f = S.fund, donut = fundDonut(f);
  const fund = !f.put && !f.left ? '' : `<div class="sfund ${f.left < 0 ? 'neg' : ''}"><div class="qh"><span class="qt"><small>Quỹ chung</small><b data-fv="${Math.round(f.left)}">${f.left < 0 ? '−' : ''}${fmt(Math.abs(f.left))}</b></span>${donut}</div><div class="fls">${fundLines(S)}</div></div>`;
  const its = [...(G.items || [])].sort((a, b) => (a.at || 0) - (b.at || 0));
  if (!its.length) return fund;
  const val = its.reduce((t, it) => t + Math.max(0, Number(it.qty) - itemUsed(G, it.id)) * unitCost(it), 0);
  const live = its.filter(it => Number(it.qty) - itemUsed(G, it.id) > 1e-9);   // POD 25/11: đồ đã hết thì ẩn, tiêu đề hiện tổng tiền đồ còn trong kho
  if (!live.length) return fund;
  const rows = live.map(it => { const tot = Number(it.qty) || 0, left = tot - itemUsed(G, it.id), w = tot ? Math.max(0, Math.min(1, left / tot)) : 0;
    return `<div class="ski"><div class="skr"><span>${esc(it.name)}</span><b class="${left > 0 ? '' : 'out'}">${fmt(left)}<i>/${fmt(tot)}</i></b></div><span class="skb"><i style="width:${(w * 100).toFixed(1)}%"></i></span></div>`; }).join('');
  return `${fund}<div class="skho"><div class="skh"><b>Kho đồ</b><small>${fmt(Math.round(val))}</small></div>${rows}</div>`;   // Figma 24: tiêu đề xám, mỗi đồ một dòng: tên · còn/tổng · thanh 70px
}
