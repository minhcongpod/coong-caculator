/* ================= settlement ================= */
/* Kho đồ (kho): g.items = [{ id, name, qty, cost, payer, at, fold }] (payer = FUND hoặc id thành viên đã mua); khoản chi ghi e.use = [{ item, qty }].
   Mỗi lần dùng = số lượng × giá một đơn vị, tính như một khoản "ứng tiền" của người đã mua (hoặc rút từ quỹ chung), nên chia đều cho người tham gia buổi đó. */
const itemOf = (g, id) => (g.items || []).find(x => x.id === id);
const itemUsed = (g, id) => g.exps.reduce((t, e) => t + (e.use || []).reduce((a, u) => a + (u.item === id ? Number(u.qty) || 0 : 0), 0), 0);
const unitCost = it => it && Number(it.qty) > 0 ? (Number(it.cost) || 0) / Number(it.qty) : 0;
function useFlows(g, e){
  const out = [];
  (e.use || []).forEach(u => {
    const it = itemOf(g, u.item), q = Number(u.qty) || 0; if (!it || q <= 0) return;
    const c = Number(it.cost) || 0;
    itPays(it).forEach(p => { const who = p.id; if (who !== FUND && !isSp(who) && !g.members.some(m => m.id === who)) return; const r = c > 0 ? (Number(p.amt) || 0) / c : 0; if (r > 0) out.push({ id: who, role: 'pay', amt: q * unitCost(it) * r, item: it.id }); });
  });
  return out;
}
function settleExp(g, e){
  const has = id => g.members.some(m => m.id === id);
  const flows = e.flows.filter(f => f.id === FUND || isSp(f.id) ? f.role === 'pay' : has(f.id));   // Rút quỹ (nhóm nào cũng có quỹ chung, mặc định 0) + người ứng tiền / đóng cố định của thành viên
  const pays = [...flows.filter(f => f.role === 'pay'), ...useFlows(g, e)], fixed = flows.filter(f => f.role !== 'pay');   // kho đồ: mỗi lần dùng là một khoản ứng tiền ảo của người đã mua (useFlows)
  const total = pays.reduce(addAmt, 0);
  const F = fixed.reduce(addAmt, 0);
  const fixedIds = new Set(fixed.map(f => f.id));
  const parts = e.parts.filter(has);
  let sharers = parts.filter(id => !fixedIds.has(id)), warn = '';
  const spB = pays.reduce((a, f) => a + (isSp(f.id) && !f.item ? Number(f.amt) || 0 : 0), 0);   // phần dùng đồ trong kho mua bằng tiền góp ngoài quỹ không tính vào đây (POD 25/11): người tham gia chia như đồ thường, tiền đó trả lại cho khoản góp ngoài   // POD 25/11: tiền góp ngoài quỹ dùng cho khoản chi tự chịu phần đó (như đóng cố định), phần còn lại mới chia
  const rest = total - F - spB;
  if (rest < -0.5) warn = 'Tiền đóng cố định đang lớn hơn tiền ứng.';
  else if (!sharers.length && rest > 0.5) {
    if (parts.length) { sharers = parts; warn = `Còn ${fmt(rest)} chưa ai chịu nên đang chia đều cho mọi người tham gia.`; }   // ai cũng đóng cố định mà vẫn còn dư
    else { sharers = pays.map(f => f.id).filter(id => id !== FUND && !isSp(id)); warn = 'Chọn người tham gia'; }
  }
  const per = sharers.length ? Math.max(rest, 0) / sharers.length : 0;   // chia chính xác; chỉ số dư cuối cùng mới làm tròn 1.000
  const k = rest < -0.5 && F > 0 ? total / F : 1;   // đóng cố định + tài trợ vượt tổng chi: thu theo tỉ lệ cho vừa đúng hoá đơn, không ai trả quá số tiền thật đã chi
  return { total, pays, fixed, F, spB, rest, sharers, per, k, warn };
}
/* POD 25/11 (cách A): tích "đã chuyển" = ghi một khoản thanh toán thật g.pays [{id, from, to, amt, at}]. Nó trừ thẳng vào số dư, nên nhóm tạo thêm khoản chi sau đó thì
   tổng kết chỉ còn phần mới phải trả (A chuyển 100k rồi, khoản mới đẩy nợ lên 150k → chỉ còn 50k). Dấu tích cũ g.done (khoá "từ>đến:tiền") đổi sang g.pays nếu còn khớp một dòng hiện có, còn lại bỏ. */
function migrateDone(g){
  const dn = g.done || {}; if (!Object.keys(dn).length) return;
  g.done = {}; const S0 = settle(g); g.pays = g.pays || [];
  S0.txs.forEach(t => { if (dn[txKey(t)]) g.pays.push({ id: Date.now() + g.pays.length, from: t.from, to: t.to, amt: t.amount, at: Date.now() }); });
}
/* POD 25/11 (7A): bỏ góp quỹ ban đầu trong Chỉnh sửa nhóm. Nhóm cũ có g.fund.contrib → đổi thành một lần Góp quỹ vào ngày tạo nhóm (id cố định theo nhóm để các máy đổi giống nhau, không nhân đôi) */
function migContrib(g){
  const f = g.fund, c = f?.contrib; if (!c || !Object.keys(c).length) return;
  const ps = Object.entries(c).map(([id, amt]) => ({ id: +id, amt: Number(amt) || 0 })).filter(p => p.amt > 0); f.contrib = {};
  if (!ps.length) return; let id = g.id + 7; f.adds = f.adds || []; const ex = f.adds.find(a => a.id === id);
  if (ex && !tps(ex).length) { setTps(ex, ps); return; } if (ex) id = newId();   // id g.id+7 đã bị chiếm: không làm mất tiền góp lúc tạo nhóm
  const at = g.at || Math.min(...g.exps.map(e => e.at || Infinity), Date.now());
  f.adds.unshift({ id, at, ps, by: g.by || '', byName: g.byName || '', ct: at });
}
/* Góp ngoài quỹ luôn thuộc một lần góp quỹ (x.add): xoá lần góp thì mất theo. Dữ liệu cũ: khoản mồ côi (lần góp đã xoá) bỏ đi;
   khoản từ lúc tạo nhóm (chưa có x.add) gắn vào lần Góp quỹ ngày tạo nhóm (id = g.id + 7, tạo mới nếu chưa có) */
/* POD 25/11: lần góp quỹ trước đây lấy id = uid++ nên có thể trùng nhau / trùng g.id+7 (lần góp lúc tạo nhóm) → mở sửa ra nhầm lần góp khác (không thấy ai góp bao nhiêu).
   Lần góp mới dùng newId(); lần góp bị trùng id thì đổi id mới cho lần sau (góp ngoài quỹ vẫn gắn với lần đầu). */
function dedupAdds(g){ const seen = new Set(); (g.fund?.adds || []).forEach(a => { if (seen.has(a.id)) a.id = newId() + seen.size; seen.add(a.id); }); }
function fixSpons(g){
  const f = g.fund; if (!f || !Array.isArray(f.sponsors) || !f.sponsors.length) return;
  const ids = new Set((f.adds || []).map(a => a.id)); f.sponsors = f.sponsors.filter(x => !x.add || ids.has(x.add));
  const loose = f.sponsors.filter(x => !x.add); if (!loose.length) return;
  const id = g.id + 7; if (!ids.has(id)) { const at = g.at || Math.min(...g.exps.map(e => e.at || Infinity), Date.now()); (f.adds ||= []).unshift({ id, at, ps: [], by: g.by || '', byName: g.byName || '', ct: at }); }
  loose.forEach(x => { x.add = id; });
}
function migSp(g){   // POD 25/11 (khuya): bỏ Góp ngoài quỹ làm người ứng tiền → các khoản đã chọn chuyển thành Rút quỹ
  const merge = L => { const out = []; L.forEach(f => { const id = isSp(f.id) ? FUND : f.id, o = out.find(x => x.id === id && id === FUND); if (o) o.amt = (Number(o.amt) || 0) + (Number(f.amt) || 0); else out.push(id === f.id ? f : { ...f, id, role: 'pay' }); }); return out; };
  g.exps.forEach(e => { if (e.flows?.some(f => isSp(f.id))) e.flows = merge(e.flows).map(({ man, ...f }) => f); });
  (g.items || []).forEach(it => { if (isSp(it.payer)) it.payer = FUND; if (it.pays?.some(p => isSp(p.id))) { it.pays = merge(it.pays); if (it.pays.length < 2) delete it.pays; } });
}
const fundPaidIn = g => (g.pays || []).reduce((t, p) => t + (p.to === FUND ? Number(p.amt) || 0 : 0) - (p.from === FUND ? Number(p.amt) || 0 : 0), 0);   // tiền đã chuyển vào quỹ trừ tiền quỹ đã trả ra (các dòng đã tích)
function settle(g){
  dedupAdds(g); migContrib(g); fixSpons(g); migSp(g);
  migrateDone(g);
  const cost = {}, paid = {}, detail = {}, warns = [];
  g.members.forEach(m => { cost[m.id] = 0; paid[m.id] = 0; });
  let grand = 0, spent = 0; const spUsed = {}, gift = {}; g.members.forEach(m => { gift[m.id] = 0; });
  g.exps.forEach(e => {
    const d = settleExp(g, e); detail[e.id] = d;
    if (d.total <= 0) return;
    grand += d.total;
    if (d.warn) warns.push(`${e.name || 'Khoản chi'}: ${d.warn}`);
    d.pays.forEach(f => { const v = Number(f.amt) || 0; if (f.id === FUND) spent += v; else if (isSp(f.id)) { spent += v; if (!f.item) { spUsed[f.id.slice(3)] = (spUsed[f.id.slice(3)] || 0) + v; } } else paid[f.id] += v; });

    d.fixed.forEach(f => cost[f.id] += (Number(f.amt) || 0) * d.k);
    d.sharers.forEach(id => cost[id] += d.per);
  });
  const own = { ...paid }, contrib = {}; let put = 0; g.members.forEach(m => { paid[m.id] += gift[m.id]; });
  const base = spons(g.fund).reduce(addAmt, 0), share = {};
  const adds = {}; g.members.forEach(m => adds[m.id] = 0); let addN = 0;   // góp thêm vào quỹ về sau (g.fund.adds)
  (g.fund?.adds || []).forEach(a => { let any = 0; tps(a).forEach(p => { const v = Number(p.amt) || 0; if (v > 0 && p.id in adds) { adds[p.id] += v; any = 1; } }); addN += any; });
  g.members.forEach(m => { contrib[m.id] = Number(g.fund?.contrib?.[m.id]) || 0; put += contrib[m.id] + adds[m.id]; });
  put += base; const baseShare = 0;   // POD 26/11: dòng Khác (quỹ được cho, quỹ tồn tháng trước...) chỉ là tiền vào quỹ, không chia cho ai. Trước đó (25/11 khuya) chia đều cho mọi người
  g.members.forEach(m => { share[m.id] = contrib[m.id] + adds[m.id] + baseShare; paid[m.id] += share[m.id]; });
  (g.items || []).forEach(it => { const u = itemUsed(g, it.id); if (u > Number(it.qty) + 1e-9) warns.push(`Kho đồ "${it.name}": đã dùng ${fmt(u)}, nhiều hơn ${fmt(it.qty)} đã mua.`); });   // dữ liệu cũ lỡ dùng quá số đã mua
  /* Kho đồ mua bằng Rút quỹ: tiền ra khỏi quỹ ngay lúc mua (POD chốt 18/11). Phần đồ chưa dùng (stock) vẫn trừ vào Quỹ chung,
     còn từng người chỉ chịu phần đã dùng ở buổi mình tham gia (useFlows), nên tổng số dư = quỹ còn + giá trị đồ còn trong kho. */
  let stock = 0, nFI = 0;
  (g.items || []).forEach(it => { const c = Number(it.cost) || 0, fp = itPays(it).reduce((t, p) => t + (p.id === FUND || isSp(p.id) ? Number(p.amt) || 0 : 0), 0); if (!(c > 0) || !(fp > 0)) return; nFI++; stock += Math.max(0, c - itemUsed(g, it.id) * unitCost(it)) * fp / c; });   // phần đồ mua bằng quỹ / góp ngoài quỹ
  spent += stock;
  /* POD 25/11: bỏ card cảnh báo vàng "Quỹ chung đã chi vượt..."; Quỹ còn âm đã thể hiện việc này */
  const fund = { used: put > 0 || spent > 0, put, base, contribs: contrib, adds, addN, addTot: Object.values(adds).reduce((a, b) => a + b, 0), sponsors: spons(g.fund).filter(x => Number(x.amt)), contrib: put - base, spent, stock, nFI, left: put - spent, spUsed };   // used: quỹ đã có tiền vào hoặc đã rút → chia nợ qua Quỹ chung; chưa dùng → chia thẳng giữa mọi người
  const nets = g.members.map(m => ({ id: m.id, name: m.name, own: own[m.id], contrib: contrib[m.id], share: share[m.id], paid: paid[m.id], cost: cost[m.id], net: paid[m.id] - cost[m.id] }));
  round1000(nets);
  (g.pays || []).forEach(p => { const a = nets.find(n => n.id === p.from), b = nets.find(n => n.id === p.to), v = Number(p.amt) || 0; if (a) a.net += v; if (b) b.net -= v; });   // khoản đã chuyển: người chuyển bớt nợ, người nhận bớt được nhận
  /* ai chuyển cho ai: ghép người nợ nhiều nhất với người được nhận nhiều nhất cho tới hết. Quỹ đã dùng (fund.used): người âm nộp thêm vào quỹ, người dương nhận từ quỹ nên không có lệnh chuyển giữa người với người. Quỹ chưa dùng: chuyển thẳng như nhóm không quỹ trước đây. Tổng số dư luôn bằng quỹ còn ở cả hai kiểu. */
  /* POD 26/11: quỹ chung còn 0 thì chuyển thẳng cho nhau (tiền ai đã nộp vào quỹ thì Quỹ chung trả ra) */
  const direct = fund.used && Math.abs(fund.left) < 1000, fp = direct ? fundPaidIn(g) : 0;
  const parties = !fund.used ? nets : direct ? [...nets, ...(Math.round(fp) ? [{ id: FUND, net: -Math.round(fp) }] : [])] : [];
  const debt = parties.filter(n => n.net < 0).map(n => ({ id: n.id, a: -n.net })).sort((a, b) => b.a - a.a);
  const cred = parties.filter(n => n.net > 0).map(n => ({ id: n.id, a: n.net })).sort((a, b) => b.a - a.a);
  const txs = []; let i = 0, j = 0;
  while (i < debt.length && j < cred.length) {
    const p = Math.min(debt[i].a, cred[j].a);
    if (p > 0) txs.push({ from: debt[i].id, to: cred[j].id, amount: p });
    debt[i].a -= p; cred[j].a -= p;
    if (debt[i].a === 0) i++; if (cred[j].a === 0) j++;
  }
  if (fund.used && !direct) nets.filter(n => n.net < 0).sort((a, b) => a.net - b.net).forEach(n => txs.push({ from: n.id, to: FUND, amount: -n.net }));
  if (fund.used && !direct) nets.filter(n => n.net > 0).sort((a, b) => b.net - a.net).forEach(n => txs.push({ from: FUND, to: n.id, amount: n.net }));   // POD 26/11: Quỹ chung trả hết phần Còn lại dương cho từng người (trước đó 3B: chỉ trả phần đã ứng tiền hộ trong đợt đang mở)
  /* POD 26/11: tiền đã tích nộp vào Quỹ chung (hoặc Quỹ chung đã trả ra) thì quỹ tăng / giảm theo */
  fund.paidIn = fundPaidIn(g); fund.left += fund.paidIn;
  return { grand, nets, txs, detail, warns, fund };
}
/* Làm tròn số dư từng người về 1.000 mà tổng vẫn đúng (không quỹ: tổng 0, ai trả = ai nhận; có quỹ: tổng = quỹ còn).
   Người phải trả làm tròn lên nghìn chẵn (ai cùng hoàn cảnh thì trả bằng nhau), phần dư dồn cho người được nhận
   (phần lẻ lớn nhất trước), đúng quy ước "phần làm tròn thuộc về người ứng tiền". */
function round1000(nets){
  const U = 1000, raw = nets.map(n => Math.round(n.net)), want = Math.round(nets.reduce((a, n) => a + n.net, 0) / U + 1e-9) * U;
  const base = raw.map(v => v < 0 ? -Math.ceil(-v / U) * U : Math.floor(v / U) * U);
  let k = Math.round((want - base.reduce((a, b) => a + b, 0)) / U);
  const byRem = ix => ix.sort((a, b) => (raw[b] - base[b]) - (raw[a] - base[a]) || a - b);
  const pool = byRem(raw.map((v, i) => i).filter(i => raw[i] > 0));   // không ai được nhận (quỹ chi vượt, ai cũng nộp thêm): phần dư làm tròn nằm lại trong quỹ
  for (let j = 0; k > 0 && pool.length; j++, k--) base[pool[j % pool.length]] += U;
  nets.forEach((n, i) => { n.net = base[i] || 0; });   // || 0: bỏ -0
}
window.coongSettle = settle;   // để chạy thử / kiểm tra từ console


/* Đợt tính tiền (POD 25/11, Figma 532:2236): bảng sao kê tách thành từng card theo đợt. Đợt tự đóng khi mọi dòng "Ai chuyển cho ai?" đã tích hết;
   g.cuts = [{ id, at, ex: [id khoản chi], ad: [id lần góp thêm], py: [id khoản đã chuyển] }]. Thứ chưa nằm trong đợt nào thuộc đợt đang mở (cuối cùng).
   Số dư từng đợt tính riêng (chưa trừ khoản đã chuyển), riêng có quỹ thì "Quỹ còn" cộng dồn tới hết đợt đó. Ai chuyển cho ai vẫn tính trên toàn bộ (cách A). */
function periods(g){
  const cuts = g.cuts || [], inCut = new Set(cuts.flatMap(c => [...(c.ex || []), ...(c.ad || []), ...(c.py || [])].map(String)));
  const adds = g.fund?.adds || [], pays = g.pays || [];
  const P = cuts.map(c => { const ex = new Set((c.ex || []).map(String)), ad = new Set((c.ad || []).map(String)), py = new Set((c.py || []).map(String));
    return { cut: c, exps: g.exps.filter(e => ex.has(String(e.id))), adds: adds.filter(a => ad.has(String(a.id))), pays: pays.filter(x => py.has(String(x.id))) }; });
  const open = { cut: null, exps: g.exps.filter(e => !inCut.has(String(e.id))), adds: adds.filter(a => !inCut.has(String(a.id))), pays: pays.filter(x => !inCut.has(String(x.id))) };
  if (open.exps.length || open.adds.length || open.pays.length || !P.length) P.push(open);
  return P.filter((x, i) => x.exps.length || x.adds.length || i === 0 || !x.cut);
}
function cutPeriod(g){   // mọi dòng đã chuyển xong: đóng đợt đang mở
  const P = periods(g), open = P[P.length - 1]; if (open.cut || !open.exps.length) return;
  (g.cuts = g.cuts || []).push({ id: Date.now(), at: Date.now(), ex: open.exps.map(e => e.id), ad: open.adds.map(a => a.id), py: open.pays.map(x => x.id) });
}
const subG = (g, L, first, upto) => {
  return { ...g, done: {}, exps: L.flatMap(x => x.exps), pays: upto ? L.flatMap(x => x.pays) : [], fund: { ...(g.fund || {}), adds: L.flatMap(x => x.adds), sponsors: spons(g.fund).filter(x => x.add == null ? first : L.some(P => P.adds.some(a => a.id === x.add))), ...(first ? {} : { contrib: {}, base: 0 }) } }; };
/* người góp của một lần góp quỹ (dữ liệu cũ: một người who/amt) */
function tps(a){ return a.ps || (a.who ? [{ id: a.who, amt: Number(a.amt) || 0 }] : []); }
function setTps(a, ps){ a.ps = ps; delete a.who; delete a.amt; }
