/* ================= events ================= */
function addFormMember(){
  const inp = $('#fName');
  if (inp.value.trim().startsWith('@')) { addAt(inp.value).then(ok => { if (ok) { draft.name = $('#gName').value; render(); $('#fName').focus(); } }); return; }
  if (addTo(draft.members, inp.value)) { draft.name = $('#gName').value; render(); $('#fName').focus(); }
}
/* @tên: tìm hồ sơ người dùng, thêm làm thành viên có liên kết (nhóm sẽ hiện trong app của họ) */
async function addAt(raw, quiet){
  const h = toHandle(String(raw).trim().replace(/^@/, '')); if (!h) return false;
  let u; try { u = await getUser(h); } catch(_) { toast('Chưa tìm được, kiểm tra mạng'); return false; }
  if (!u) { if (!quiet) toast(`Không có ai là @${h}`); return false; }
  const o = u.data;
  const was = draft.members.find(m => m.uid === o.uid);
  if (was?.left) { delete was.left; return true; }   // người đã rời nhóm, được mời lại
  if (was) { toast(`${o.name} đã có trong nhóm`); return false; }
  draft.members.push({ id: uid++, name: o.name, uid: o.uid, handle: o.handle, avatar: o.avatar || '' });
  return true;
}
let atT = null;
function atHint(v){
  clearTimeout(atT); const box = $('#atHint'); if (!box) return;
  const h = v.trim().startsWith('@') ? toHandle(v.trim().slice(1)) : '';
  if (!h || !onWeb) { box.innerHTML = ''; return; }
  atT = setTimeout(async () => { let u = null; try { u = await getUser(h); } catch(_) {} const b = $('#atHint'); if (!b || toHandle($('#fName')?.value.trim().slice(1)) !== h) return;
    b.innerHTML = u ? `<button class="athint" id="fAdd2" aria-label="Thêm ${esc(u.data.name)} @${esc(u.data.handle)}">${avHTML(u.data.avatar, 'cav', 'i-user')}<span>${esc(u.data.name)}</span>${svg('i-plus')}</button>` : `<p class="athint none">Không có ai là @${esc(h)}</p>`; }, 250);
}
/* nút +/- ở giới hạn (ít nhất / hết số trong kho): không tắt hẳn mà rung nhẹ để báo đã tới giới hạn */
new MutationObserver(() => document.querySelectorAll('.stb[disabled]').forEach(b => { b.disabled = false; b.classList.add('lim'); })).observe(document.body, { childList: true, subtree: true });
document.addEventListener('click', e => { const b = e.target.closest?.('.stb.lim'); if (!b) return; e.stopImmediatePropagation(); e.preventDefault();
  const s = b.closest('.step, .xstep') || b; if (!RMO && s.animate) s.animate([{ translate: '0 0' }, { translate: '-6px 0' }, { translate: '5px 0' }, { translate: '-3px 0' }, { translate: '0 0' }], { duration: 300 }); try { navigator.vibrate?.(20); } catch(_) {} }, true);   // chạm ra ngoài thì đóng menu
const DESK = matchMedia('(hover:hover) and (pointer:fine)').matches;   // chỉ máy tính dùng chuột
if (DESK) document.documentElement.classList.add('desk');
const rowOpen = new Set();   // hàng chip nào đang xổ hết (khoá "mã khoản chi:p|y|k")
function fitRows(){
  document.querySelectorAll(DESK ? '.rowf' : '.asheet .rowf, .kform .rowf').forEach(r => {   // trang Thêm/Sửa: cả điện thoại (Figma 17/18)
    const tg = r.querySelector('.rtg'), chips = [...r.children].filter(c => c !== tg); if (!tg || !chips.length) return;
    if (r.closest('.aro')) { chips.forEach(c => { c.hidden = false; }); tg.hidden = true; return; }   // chỉ xem: hiện hết người / đồ được chọn, không thu gọn
    if (!DESK && r.classList.contains('xswipe')) { chips.forEach(c => { c.hidden = false; }); tg.hidden = true; return; }   // điện thoại: hàng đồ trong kho lướt ngang, không mũi tên (POD 22/11)
    chips.forEach(c => { c.hidden = false; }); tg.hidden = true;
    const R = +r.dataset.rows || 1;   // số dòng chip hiện khi thu gọn (kho đồ: 2 dòng, Figma 469:5488)
    if (new Set(chips.map(c => Math.round(c.offsetTop / 8))).size <= R) return;   // vừa số dòng cho phép: không cần mũi tên
    const open = rowOpen.has(r.dataset.rowf);
    tg.hidden = false; tg.classList.toggle('open', open); tg.setAttribute('aria-expanded', open);
    if (open) return;   // xổ hết: các chip xuống nhiều dòng, mũi tên ở cuối
    const W = r.clientWidth, tw = tg.offsetWidth; let line = 1, used = 0, keep = 0;
    for (const c of chips) {
      let need = (used ? used + 8 : 0) + c.offsetWidth;
      if (need > W && used) { line++; used = 0; need = c.offsetWidth; }
      if (line > R || (line === R && need + 8 + tw > W)) break;   // dòng cuối chừa chỗ cho mũi tên
      used = need; keep++;
    }
    chips.forEach((c, i) => { c.hidden = i >= keep; });
  });
}
{ let q = 0; const again = () => { cancelAnimationFrame(q); q = requestAnimationFrame(fitRows); };
  new MutationObserver(again).observe(document.body, { childList: true, subtree: true });   // chỉ nghe thêm/bớt phần tử (fitRows chỉ đổi thuộc tính nên không lặp)
  addEventListener('resize', again); document.fonts?.ready.then(again); again(); }
document.addEventListener('click', e => {
  if (suppressClick) { suppressClick = false; e.preventDefault(); return; }
  const t = e.target.closest('button');
  if (!t) { if (e.target.closest('.sb')) closeSheet(); return; }
  const d = t.dataset;
  if (d.rowtgl) { const k = d.rowtgl; rowOpen.has(k) ? rowOpen.delete(k) : rowOpen.add(k); fitRows(); return; }
  // home
  if (t.id === 'fabAdd') { addSheet('exp'); return; }
  if (t.id === 'lBell') { if (!notifs().length) { toast('Chưa có thông báo'); return; } go('noti'); return; }   // chưa có thông báo nào: chỉ hiện snack bar
  if (t.id === 'notiBack') { go('list'); return; }
  if (d.nopen) { const [gid, to] = d.nopen.split('|'), g = root.groups.find(x => x.id === +gid); if (!g) return; G = g; fundOpen = false; lgGo(to || 'cal'); return; }
  if (d.lgo) { lgGo(d.lgo); return; }   // bấm thông báo: mở nhóm đúng ngày
  if (t.id === 'lAcct') { adraft = { from: 'list', name: root.acct?.name || '', avatar: root.acct?.avatar || '' }; acSt = { h: root.acct?.handle || '', st: 'ok' }; go('acct'); return; }
  if (d.ltab) { listTab = d.ltab; render(); return; }
  if (d.gopen) { G = root.groups.find(g => g.id === +d.gopen); if (!G) return; calDay = null; calST = null; calGo = null; calQ = null; fundOpen = false; go('cal'); return; }
  if (t.id === 'gBack') { go('list'); return; }
  if (t.id === 'kBack') { kAdd = false; kEdit = null; go('cal'); return; }
  if (t.id === 'kOpen') { go('kho'); if (kAdd && !kEdit) $('#itName')?.focus({ preventScroll: true }); return; }
  if (d.fundopen2 !== undefined) { fundOpen = !fundOpen; rerender(); return; }
  if (d.cday) { const wasMonth = !calDay; const r0 = wasMonth ? t.closest('.cweek')?.getBoundingClientRect().top : null;
    calDay = d.cday; rerender();   // bấm ngày ở lịch tháng: tuần đó trượt lên dưới hàng thứ, các khoản trong ngày hiện ra
    if (wasMonth && r0 != null && !RMO) { const w = $('.cgrid .cweek'); if (w) w.animate([{ transform: `translateY(${r0 - w.getBoundingClientRect().top}px)` }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
      $('.ctl')?.animate([{ opacity: 0, transform: 'translateY(28px)' }, { opacity: 1, transform: 'none' }], { duration: 340, delay: 140, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }); }
    return; }
  if (d.cfull !== undefined) { const was = calDay, w0 = $('.cgrid .cweek'), r0 = w0?.getBoundingClientRect().top;   // bấm "‹ Tháng 11": ngược với bấm ngày — tuần đang chọn trượt xuống về chỗ cũ trong lịch tháng, các tuần khác hiện dần
    $('.ctl')?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120 });
    if (was) calGo = `${+was.slice(0, 4)}-${+was.slice(5, 7) - 1}`; calDay = null; rerender();
    if (was && r0 != null && !RMO) { const sc = $('#cScroll'), c = sc?.querySelector(`[data-cday="${was}"]`), w = c?.closest('.cweek');
      if (w) { const r1 = w.getBoundingClientRect().top; if (r1 > sc.getBoundingClientRect().bottom - w.offsetHeight) { sc.scrollTop += r1 - sc.getBoundingClientRect().top - 120; }   // tuần nằm khuất dưới thì cuộn lên cho thấy
        const dy = r0 - w.getBoundingClientRect().top;
        w.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
        sc.querySelectorAll('.cweek, .cmon h3').forEach(x => { if (x !== w) x.animate([{ opacity: 0, transform: `translateY(${x.compareDocumentPosition(w) & 4 ? -16 : 16}px)` }, { opacity: 1, transform: 'none' }], { duration: 340, delay: 120, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }); }); } }
    return; }
  if (d.cqx !== undefined) { const q = $('#calQ'); if (q) { q.value = ''; q.dispatchEvent(new Event('input', { bubbles: true })); q.focus(); } return; }
  if (d.csearch !== undefined) { calQ = ''; calDay = null; rerender(); const q = $('#calQ'); q?.focus(); return; }
  if (d.ctoday !== undefined) { const n = new Date(); if (calDay) { calDay = todayISO(); rerender(); } else { const sc = $('#cScroll'), b = sc?.querySelector(`[data-mon="${n.getFullYear()}-${n.getMonth()}"]`); if (b) sc.scrollTo({ top: b.offsetTop, behavior: 'smooth' }); } return; }
  if (d.cent) { const [k, id] = d.cent.split(':'); if (k === 'kho') { itemSheet(+id); return; } addSheet(k === 'top' ? 'top' : 'exp', +id); return; }
  if (asd && d.atab) { if (asd.tab !== d.atab) { const keep = { name: asd.name, day: asd.day, who: asd.who }; asd = { ...asd, tab: d.atab, ...keep, edit: null }; drawAdd(); } return; }
  if (asd && d.awall !== undefined) { const mem = G.members.filter(m => !m.left); asd.who = asd.who.length === mem.length ? [] : mem.map(m => m.id); drawAdd(); return; }
  if (asd && d.awho) { const id = +d.awho; asd.who = asd.who.includes(id) ? asd.who.filter(x => x !== id) : [...asd.who, id]; drawAdd(); return; }
  if (asd && d.apay) { const id = isSp(d.apay) ? d.apay : +d.apay, i = asd.fl.findIndex(f => f.id === id); if (i >= 0) asd.fl.splice(i, 1); else asd.fl.push({ id, role: 'pay', amt: 0 }); drawAdd(); return; }
  if (asd && d.arole) { const f = asd.fl.find(x => x.id === +d.arole); if (f) { f.role = f.role === 'fixed' ? 'pay' : 'fixed'; drawAdd(); } return; }
  if (asd && d.ause) { const id = +d.ause, it = itemOf(G, id); if (asd.use[id] > 0) delete asd.use[id]; else if (it && itemLeftX(it, asd.edit) > 0) asd.use[id] = 1; drawAdd(); return; }
  if (asd && d.astep) { const [id, dl] = d.astep.split(':').map(Number), it = itemOf(G, id), q = (asd.use[id] || 0) + dl; if (it && q >= 0 && q <= itemLeftX(it, asd.edit)) { if (q === 0) delete asd.use[id]; else asd.use[id] = q; drawAdd(); } return; }
  if (asd && t.id === 'aEq') { asd.eq = !asd.eq; drawAdd(); if (asd.eq) $('[data-aeq]')?.focus({ preventScroll: true }); return; }
  if (asd && t.id === 'aOutAdd') { if (commitOut()) drawAdd(); else $('#aOutAmt')?.focus(); return; }
  if (asd && d.aoutdel !== undefined) { asd.out.splice(+d.aoutdel, 1); drawAdd(); return; }
  if (asd && d.adel) { const id = asd.edit, isE = asd.tab === 'exp'; asd = null; $('#sheet').hidden = true; if (isE) confirmDlg(`Xóa khoản chi ${esc(G.exps.find(x => x.id === id)?.name || 'này')}?`, 'Số tiền và người chi của khoản này sẽ mất, không hoàn tác được.', `data-dodelexp="${id}"`); else confirmDlg('Xóa khoản góp thêm quỹ?', 'Số tiền góp thêm của lần này sẽ mất, không hoàn tác được.', `data-dodeltop="${id}"`); return; }
  if (t.id === 'aOk') { if (!t.disabled) saveAdd(); return; }
  if (t.id === 'acBack') { go(adraft.from || 'home'); return; }
  if (t.id === 'acAvBtn') { adraft.name = $('#aName').value; avSheet(); return; }
  if (t.id === 'saveAcct') { if (!t.disabled) saveAcct(t); return; }
  if (t.id === 'startBtn') {   // chưa có tài khoản: sang trang đặt tên (ô tên bật ngay, gọi focus ngay trong lúc bấm thì iPhone mới bật bàn phím); có rồi: vào thẳng tạo nhóm
    if (root.acct?.uid) { draft = newDraft(view); go('form'); $('#gName')?.focus({ preventScroll: true }); return; }
    adraft = { from: 'home', name: '', avatar: '' }; onbSt = { h: '', st: 'empty' }; go('onb'); $('#aName').focus(); return; }
  if (t.id === 'onbGo') { kbHold(); if (!t.disabled) onbCreate(t); return; }
  if (t.id === 'lGo') { kbHold(); if (!t.disabled) loginGo(t); return; }
  if (t.id === 'toCreate') { adraft = { from: 'home', name: '', avatar: '' }; onbSt = { h: '', st: 'empty' }; go('onb'); return; }
  if (t.id === 'toLogin') { adraft = { from: 'home', name: '', avatar: '' }; lgErr = ''; go('login'); return; }
  if (t.id === 'chPin') { auth = { mode: 'change', step: 'set', err: '', had: true }; go('pin'); return; }
  if (t.id === 'logout') { confirmDlg('Đăng xuất?', 'Dữ liệu vẫn lưu trên máy chủ. Muốn dùng lại thì đăng nhập bằng @tên và mã PIN.', 'id="doLogout"', 'Đăng xuất'); return; }
  if (t.id === 'doLogout') { closeDlg(); logout(t); return; }
  if (t.id === 'pinOther') { auth = null; lgErr = ''; adraft = { from: 'home', name: '', avatar: '' }; go('login'); return; }   // POD 25/11
  if (t.id === 'pinBack') { const a = auth; auth = null; if (a?.mode === 'change') go('acct'); else if (a?.mode === 'create') go('onb'); else { lgErr = ''; go('login'); } return; }
  if (t.id === 'newGroup') { draft = newDraft(view); go('form'); $('#gName')?.focus({ preventScroll: true }); return; }
  if (d.edit) { const g = root.groups.find(x => x.id === +d.edit); draft = { id: g.id, from: view, name: g.name, avatar: g.avatar || '', members: g.members.map(m => ({ ...m })), orig: g.members.map(m => m.id), fund: { sponsors: spons(g.fund).map(x => ({ ...x })), contrib: { ...(g.fund?.contrib || {}) } } }; draft.fund.open = draft.fund.sponsors.length > 0 || Object.values(draft.fund.contrib).some(v => Number(v) > 0); { const cs = draft.members.map(m => Number(draft.fund.contrib[m.id]) || 0); draft.fund.eq = cs.length > 1 && cs[0] > 0 && cs.every(v => v === cs[0]); } go('form'); return; }   // mọi người đang góp bằng nhau: tích sẵn Góp đều nhau   // mục Góp quỹ chung mở sẵn nếu đã có tiền góp
  if (t.id === 'sAdd') { const n = draft.fund.newS; if (!n || !(n.name?.trim() || n.amt)) { $('#sNewName').focus(); return; } draft.fund.sponsors = [...spons(draft.fund), n]; draft.fund.newS = null; render(); setTimeout(() => $('#sNewName')?.focus(), 30); return; }
  if (d.sdel) { draft.fund.sponsors = spons(draft.fund).filter((_, k) => k !== +d.sdel); render(); return; }
  if (t.id === 'fEq') { const f = draft.fund; draft.name = $('#gName')?.value ?? draft.name; f.eq = !f.eq; if (f.eq) { const v = Math.max(0, ...draft.members.map(m => Number(f.contrib[m.id]) || 0)); draft.members.forEach(m => { f.contrib[m.id] = v; }); } render(); if (f.eq) $('[data-fc="eq"]')?.focus({ preventScroll: true }); return; }   // góp đều: lấy số lớn nhất đang có cho mọi người, chỉ còn một ô nhập
  if (t.id === 'fundTgl') { draft.name = $('#gName').value; draft.fund ||= { sponsors: [], contrib: {} }; draft.fund.sponsors = spons(draft.fund); draft.fund.open = !draft.fund.open; render(); return; }   // mở / thu gọn mục Góp quỹ chung (sửa nhóm đã tạo cũng bấm được)
  // form
  if (t.id === 'formBack') { go(['sum', 'cal'].includes(draft.from) ? draft.from : 'home'); return; }
  if (t.id === 'fAdd' || t.id === 'fAdd2') return addFormMember();
  if (t.id === 'avBtn') { draft.name = $('#gName').value; avSheet(); return; }
  if (d.av !== undefined) { setAvatar(d.av); return; }
  if (d.avic || d.avcol) { const A = isAcct(), o = A ? adraft : draft, cur = o.avatar?.startsWith('ic:') ? icParse(o.avatar) : { k: A ? 'user' : 'people', c: A ? 6 : 2 };
    o.avatar = `ic:${d.avic || cur.k}:${d.avcol ?? cur.c}`; const b = $(A ? '#acAvBtn' : '#avBtn'); if (b) b.firstElementChild.outerHTML = avHTML(o.avatar, 'big', A ? 'i-user' : 'i-people'); if (A && $('#avInl')) $('#avInl').outerHTML = avInline(); else avSheet(); return; }
  if (d.fdel && formRO() && (draft.orig || []).includes(+d.fdel)) return;
  if (d.fdel || d.dofdel) { const id = +(d.fdel || d.dofdel), m = draft.members.find(x => x.id === id); if (m && isCreatorM(m)) return; draft.name = $('#gName')?.value ?? draft.name;
    const money = d.fdel ? memberMoney(id) : 0;
    if (money) { confirmDlg(`Bỏ ${esc(m?.name || 'thành viên')} khỏi nhóm?`, `${esc(m?.name || 'Người này')} đang có ${fmt(money)} trong các khoản chi / quỹ. Bỏ ra thì số tiền này không còn được tính trong tổng kết.`, `data-dofdel="${id}"`, 'Bỏ ra'); return; }
    closeDlg(); draft.members = draft.members.filter(x => x.id !== id); render(); return; }
  if (t.id === 'saveGroup') {
    draft.name = $('#gName').value.trim();
    if ($('#fName').value.trim().startsWith('@')) {   // còn @tên trong ô: có người đó thì thêm vào, không có thì bỏ qua; rồi vẫn lưu nhóm như thường
      const v = $('#fName').value; $('#fName').value = ''; if ($('#atHint')) $('#atHint').innerHTML = ''; t.disabled = true;
      addAt(v, true).finally(() => { t.disabled = false; t.click(); }); return; }
    if ($('#fName').value.trim()) addTo(draft.members, $('#fName').value);
    if (!draft.name) { $('#gName').focus(); toast('Tên nhóm đâu???'); return; }
    if (draft.id) {
      const g = root.groups.find(x => x.id === draft.id), ids = new Set(draft.members.map(m => m.id));
      const added = draft.members.filter(m => !g.members.some(x => x.id === m.id));
      const ro = !canDelG(g); if (ro) { draft.name = g.name; draft.avatar = g.avatar || ''; draft.members = [...g.members, ...added]; }   // không phải người tạo: giữ tên, ảnh, quỹ, thành viên cũ; chỉ thêm người mới
      const was = { name: g.name, av: g.avatar || '', fund: JSON.stringify([g.fund?.contrib || {}, spons(g.fund)]), gone: g.members.filter(m => !ids.has(m.id)) };
      g.name = draft.name; g.avatar = draft.avatar || ''; g.members = draft.members; g.fund = ro ? g.fund : { ...fundOut(), adds: (g.fund?.adds || []).flatMap(a => { const ps = tps(a), keep = ps.filter(p => draft.members.some(m => m.id === p.id)); if (ps.length && !keep.length) return []; const b = { ...a }; setTps(b, keep); return [b]; }) };
      g.exps.forEach(ex => { ex.parts = ex.parts.filter(id => ids.has(id));   /* POD 25/11: người mới không tự vào các khoản chi trước đó */ ex.flows = ex.flows.filter(f => ids.has(f.id) || f.id === FUND || isSp(f.id)); });
      if (g.name !== was.name) logAct(g, 'group', `Đổi tên nhóm từ "${was.name}" thành "${g.name}"`);
      if ((g.avatar || '') !== was.av) logAct(g, 'group', 'Đổi ảnh nhóm');
      if (added.length) logAct(g, 'member', `Thêm thành viên ${added.map(m => m.name).join(', ')}`, { n: 'm', ids: added.map(m => m.id) });
      if (!ro && was.gone.length) logAct(g, 'member', `Bỏ thành viên ${was.gone.map(m => m.name).join(', ')}`);
      if (!ro && JSON.stringify([g.fund?.contrib || {}, spons(g.fund)]) !== was.fund) logAct(g, 'fund', 'Cập nhật quỹ chung');
      g.uat = Date.now(); if (g.sid) markShared(g); save(); shareGroup(g); toast('Đã lưu nhóm'); if (['sum', 'cal'].includes(draft.from)) { G = g; go(draft.from); } else go('home');
    } else {
      G = { id: newId(), uat: Date.now(), by: myUid(), byName: root.acct?.name || '', at: Date.now(), name: draft.name, avatar: draft.avatar || '', members: draft.members, fund: fundOut(), exps: [], round: true, done: {} };
      { const f = G.fund || {}, ps = Object.entries(f.contrib || {}).map(([id, amt]) => ({ id: +id, amt: Number(amt) || 0 })).filter(p => p.amt > 0);   // POD 25/11: góp quỹ lúc tạo nhóm = một lần Góp quỹ vào ngày tạo nhóm
        if (ps.length) { (f.adds ||= []).push({ id: G.id + 7, at: G.at, ps, by: myUid(), byName: root.acct?.name || '', ct: G.at }); f.contrib = {}; } }
      logAct(G, 'group', `Tạo nhóm "${G.name}"`); root.groups.unshift(G); save(); shareGroup(G);
      calDay = null; calST = null; calGo = null; calQ = null; fundOpen = false; go('cal');   // v2 (Figma 410:635): tạo xong vào thẳng trang chi tiết nhóm (lịch tháng), chưa có khoản chi nào
    }
    return;
  }
  if (t.id === 'delGroup' || t.id === 'doDelGroup') { if (!canDelG(root.groups.find(g => g.id === draft?.id))) { closeDlg(); toast('Chỉ người tạo nhóm mới xóa được'); return; } }
  if (t.id === 'leaveGroup') { confirmDlg(`Rời nhóm ${esc(draft.name || 'này')}?`, 'Nhóm sẽ biến mất khỏi app của bạn. Các khoản chi trong nhóm vẫn giữ nguyên cho mọi người.', 'id="doLeave"', 'Rời nhóm'); return; }
  if (t.id === 'doLeave') { closeDlg(); const g = root.groups.find(x => x.id === draft.id), me = root.acct || {}; if (!g) return;
    if (g.sid && me.uid) { g.members.forEach(m => { if (m.uid === me.uid) m.left = true; }); g.own = (g.own || []).filter(u => u !== me.uid); g.uids = (g.uids || []).filter(u => u !== me.uid); markShared(g);
      editInbox(me.handle, me.uid, gs => gs.includes(g.sid) ? gs.filter(x => x !== g.sid) : null).catch(() => {}); }
    root.groups = root.groups.filter(x => x !== g); markDel(g.id); if (G === g) G = null; save(); pushShared(); go('home'); toast('Đã rời nhóm'); return; }
  if (t.id === 'delGroup') {
    if (!draft.id) { go('home'); return; }
    confirmDlg(`Xóa nhóm ${esc(draft.name || 'này')}?`, 'Toàn bộ khoản chi của nhóm này sẽ mất, không hoàn tác được.', 'id="doDelGroup"'); return;
  }
  if (t.id === 'doDelGroup') { closeDlg(); const dg = root.groups.find(g => g.id === draft.id); if (dg?.sid && root.acct?.uid) editInbox(root.acct.handle, root.acct.uid, gs => gs.includes(dg.sid) ? gs.filter(x => x !== dg.sid) : null).catch(() => {});
    root.groups = root.groups.filter(g => g.id !== draft.id); markDel(draft.id); save(); $('#sheet').hidden = true; go('home'); toast('Đã xóa nhóm'); return; }
  if (d.kdel) { $('.kdel')?.remove(); askDelItem(+d.kdel); return; }
  if (d.kedit) { const it = itemOf(G, +d.kedit); if (!it) return; if (!canItem(it)) { itemSheet(it.id); return; } /* đồ của người khác: mở bảng chỉ xem */ kAdd = false; kEdit = it.id; itDraft = itDraftOf(it); rerender(); return; }
  if (t.id === 'kFold' && !kAdd && kEdit == null) { itDraft = null; closeSheet(); return; }
  if (t.id === 'kFold') { kAdd = false; kEdit = null; itDraft = null; rerender(); return; }   // thu gọn = bỏ thay đổi (lưu bằng nút Lưu lại)
  if (t.id === 'addItem') { if (view === 'kho' && kAdd && itDraft && !kEdit) { if (itOk()) { saveItem(); } else { $('#itName')?.focus({ preventScroll: true }); $('#kAddCard')?.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; } }
    kEdit = null; itDraft = newItDraft(); kAdd = true; rerender(); $('#itName')?.focus({ preventScroll: true }); $('#kAddCard')?.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
  if (t.id === 'itCancel') { kAdd = false; itDraft = null; rerender(); return; }
  if (d.item) { itemSheet(+d.item); return; }
  if (d.itpay) { const id = isSp(d.itpay) ? d.itpay : +d.itpay, pl = itDraft.pl ||= [], i = pl.findIndex(p => p.id === id); if (i >= 0) pl.splice(i, 1); else pl.push({ id, amt: 0 }); itDraft.payer = pl[0]?.id ?? null;
    const sec = $('#kPaySec'); if (sec) { sec.innerHTML = kPayHTML(!!itDraft.ro); fitRows(); } else t.parentElement.querySelectorAll('.chip').forEach(c => c.classList.toggle('sel', pl.some(p => String(p.id) === c.dataset.itpay))); kPayRefresh(); return; }
  if (t.id === 'itPlus' || t.id === 'itMinus') { itDraft.qty = Math.max(1, (Number(itDraft.qty) || 1) + (t.id === 'itPlus' ? 1 : -1)); $('#itQty').value = fmt(itDraft.qty); $('#itMinus').classList.toggle('lim', !(itDraft.qty > 1)); return; }   // ít nhất 1
  if (t.id === 'itSave') { saveItem(); return; }
  if (d.dodelitem) { closeDlg(); const id = +d.dodelitem, it = itemOf(G, id); G.items = (G.items || []).filter(x => x.id !== id); G.exps.forEach(e => { if (e.use) { e.use = e.use.filter(u => u.item !== id); if (!e.use.length) delete e.use; } }); if (it) logAct(G, 'rm', `Xóa kho đồ \"${it.name}\"`, { go: 'kho' }); kEdit = null; itDraft = null; save(); rerender(); toast('Đã xóa khỏi kho đồ'); return; }
  if (d.foldkho) { const it = itemOf(G, +d.foldkho); if (it) { it.fold = !it.fold; save(); rerender(); } return; }
  if (t.matches('[data-fundopen]')) { fundOpen = !fundOpen; t.closest('.fund').outerHTML = fundCard(); return; }   // chỉ trang nhóm có nút thu/mở quỹ
  if (t.id === 'tryNew') { location.href = '/'; return; }   // người xem bill: vào trang chào, tự đặt tên rồi tạo nhóm của mình
  if (t.id === 'shareBill') {   // copy link bill luôn, hiện snackbar; không copy được thì mở sheet để chọn tay
    if (!R || !R.grand) { toast('Chưa có khoản chi nào'); return; }
    if (onWeb && !G.bill) { ensureBill(G).then(() => shareSheet()); return; }
    const l = billLink(G);
    if (onWeb) { clearTimeout(pushT); pushT = null; push().then(() => { if (syncState === 'err') toast('Chưa lưu online được, link có thể chưa mở được'); }); }
    try { navigator.clipboard.writeText(l).then(() => toast('Đã copy link vào bộ nhớ tạm'), shareSheet); } catch(_) { shareSheet(); } return; }
  if (t.id === 'billShot') { closeSheet(); setTimeout(() => { const st = $('.sumv'); if (st) screenshot(0, st); }, 60); return; }
  if (t.id === 'billCopy') { const l = $('#billLinkBox').value, sel = () => { const i = $('#billLinkBox'); i.focus(); i.select(); toast('Chọn link rồi bấm Sao chép'); };
    try { navigator.clipboard.writeText(l).then(() => toast('Đã copy link'), sel); } catch(_) { sel(); } return; }
  if (t.id === 'dlImg') { const st = $('.sumv'); if (st) screenshot(0, st); else toast('Chưa có gì để xuất'); return; }
  if (t.matches('[data-shotcard]')) { screenshot(0, document.querySelector('.scard.lift')); return; }
  if (t.id === 'toSum') { if (!settle(G).grand) { toast('Chưa có khoản chi nào'); return; } sumEnter = true; go('sum'); return; }
  // summary
  if (t.id === 'sBack' || t.id === 'logBack') { go('cal'); return; }
  if (t.id === 'gLog') { go('log'); return; }
  if (d.adv) { const [mid, key] = d.adv.split(':'), P = periods(G).find(x => (x.cut ? String(x.cut.id) : 'open') === key); if (P) advSheet(+mid, P); return; }
  if (d.sper) { if (sumOpen.has(d.sper)) sumOpen.delete(d.sper); else sumOpen.add(d.sper); rerender(); return; }
  if (d.txshort) { toast(`Quỹ chung chỉ còn ${d.txshort}, chưa đủ để trả`); return; }
  if (d.tx) { if (BILL) return; const mm = myMember(G), was = d.tx.startsWith('p:'), pay = was ? (G.pays || []).find(x => 'p:' + x.id === d.tx) : null;
    const [pr, am] = was ? [`${pay?.from}>${pay?.to}`, pay?.amt] : d.tx.split(':'), [fr, to] = pr.split('>').map(Number);
    if (was && !pay) return;
    if (was) { const cs = G.cuts || [], ci = cs.findIndex(c => (c.py || []).map(String).includes(String(pay.id))); if (ci >= 0 && !(ci === cs.length - 1 && periods(G).slice(-1)[0].cut)) { toast('Đã chốt sổ nên không thể chỉnh sửa'); return; } }   // POD 26/11: chỉ mở lại được đợt vừa chốt khi chưa có khoản mới
    if (mm && fr !== mm.id && to !== mm.id && !canDelG(G)) { toast('Chỉ tích được khoản của bạn'); return; }
    logAct(G, was ? 'untx' : 'tx', was ? `Bỏ đánh dấu: ${nm(fr)} chưa chuyển cho ${nm(to)} ${fmt(+am)}` : `${nm(fr)} đã chuyển cho ${nm(to)} ${fmt(+am)}`, was ? null : { n: 't', fr, frn: nm(fr), to, amt: +am });
    G.pays = G.pays || []; if (was) { G.pays = G.pays.filter(x => x !== pay); const cs = G.cuts || [], ci = cs.findIndex(c => (c.py || []).map(String).includes(String(pay.id)));   // POD 25/11 (tối): bỏ tích ở đợt đã chốt: đợt cuối (chưa có đợt mới) thì mở lại, đợt cũ hơn thì chỉ bỏ khoản đó
      if (ci >= 0) { const op = periods(G).slice(-1)[0]; if (ci === cs.length - 1 && op.cut) G.cuts = cs.filter((c, k) => k !== ci); else cs[ci].py = cs[ci].py.filter(x => String(x) !== String(pay.id)); } } else G.pays.push({ id: Date.now(), from: fr, to, amt: +am, at: Date.now() });
    save(); rerender();
    if (!was && !R.txs.length) { const gid = G.id, pid = G.pays[G.pays.length - 1]?.id; cutPeriod(G); const cid = G.cuts?.[G.cuts.length - 1]?.id; save(); rerender();
      /* POD 25/11: nhóm chung đồng bộ có thể thay object nhóm sau khi lưu → tìm lại nhóm theo id, bỏ đúng lần chốt sổ và lần tích cuối */
      toastAct('Xong hết rồi, đã chốt sổ!', 'Hoàn tác', () => { const g = root.groups.find(x => x.id === gid); if (!g) return; g.cuts = (g.cuts || []).filter(c => c.id !== cid); g.pays = (g.pays || []).filter(x => x.id !== pid); g.uat = Date.now(); if (G?.id === gid) G = g; logAct(g, 'untx', 'Hoàn tác chốt sổ'); markShared(g); save(); rerender(); }); } return; }   // POD 26/11: có lại nút Hoàn tác (5 giây)
  if (d.close !== undefined) { closeSheet(); return; }
});
document.addEventListener('input', e => {
  const el = e.target, d = el.dataset;
  if (el.id === 'gName') { draft.name = el.value; return; }
  if (el.id === 'fName') { atHint(el.value); return; }
  if (el.id === 'pinIn') { const v = el.value.replace(/\D/g, '').slice(0, 4); el.value = v; if (auth?.err && v) { auth.err = ''; const e = $('#pinErr'); if (e) e.textContent = e.closest('.pinv2') ? (auth.step === 'confirm' ? 'Nhập lại mã PIN' : 'Nhập mã PIN') : ''; } pinDraw(v); if (v.length === 4) setTimeout(() => pinSubmit(v), 120); return; }
  if (el.id === 'aName') { const cv = capName(el.value); if (cv !== el.value) el.value = cv; if (view === 'login') { adraft.name = el.value; fitOname(); setLink(el.value); lgLook(el.value); if (lgErr) { lgErr = ''; const m = $('#aHandle'); if (m) m.textContent = ''; } return; } if (view === 'onb') { onbCheck(el.value); return; } acctCheck(el.value); return; }
  if (el.id === 'itName') { itDraft.name = el.value; $('.kok')?.classList.toggle('off', !itOk()); return; }
  if (d.itamt !== undefined) { const v = parseMoney(el.value), id = isSp(d.itamt) ? d.itamt : +d.itamt; el.value = v ? fmt(v) : ''; const f = (itDraft.pl || []).find(p => p.id === id); if (f) f.amt = v; kPayRefresh(); return; }
  if (el.id === 'itQty' || el.id === 'itCost') { const v = parseMoney(el.value); el.value = v ? fmt(v) : ''; itDraft[el.id === 'itQty' ? 'qty' : 'cost'] = v; const mn = $('#itMinus'); if (mn) mn.classList.toggle('lim', !(itDraft.qty > 1)); kPayRefresh(); return; }
  if (el.id === 'sNewName') { (draft.fund.newS ||= { name: '', amt: 0 }).name = el.value; return; }
  if (d.sname) { draft.fund.sponsors[+d.sname].name = el.value; return; }
  if (d.fc) { const v = parseMoney(el.value); el.value = v ? fmt(v) : ''; if (d.fc === 'eq') draft.members.forEach(m => { draft.fund.contrib[m.id] = v; }); else if (d.fc === 'new') (draft.fund.newS ||= { name: '', amt: 0 }).amt = v; else if (d.fc[0] === 's') draft.fund.sponsors[+d.fc.slice(1)].amt = v; else { draft.fund.contrib[d.fc] = v; if (draft.fund.eq) draft.members.forEach(m => { draft.fund.contrib[m.id] = v; const o = document.querySelector(`[data-fc="${m.id}"]`); if (o && o !== el) { o.value = v ? fmt(v) : ''; sizeAmt(o); } }); }
    const t = $('#fundTot'); if (t) t.textContent = fmt(fundTot()); return; }
  if (d.itdate !== undefined) { if (!el.value || !itDraft) return; itDraft.atDay = el.value; const [, mo, dd] = el.value.split('-'), lb = el.closest('label'), bb = lb.querySelector('b'); if (lb.classList.contains('xbd')) { bb.textContent = +dd; lb.querySelector('span').textContent = 'Th ' + +mo; } else bb.textContent = `${dd}/${mo}`; return; }
  if (d.kdate) { const it = itemOf(G, +d.kdate), [y, m, dd] = el.value.split('-').map(Number); if (!it || !y) return;
    const old = it.at ? new Date(it.at) : new Date(); it.at = new Date(y, m - 1, dd, old.getHours(), old.getMinutes()).getTime(); save(); rerender(); return; }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeSheet(); closeDlg(); }
  if (e.key !== 'Enter') return;
  if (e.target.id === 'fName') { e.preventDefault(); addFormMember(); }
  if (e.target.id === 'gName') { e.preventDefault(); $('#fName').focus(); }
  if (e.target.id === 'aName' && view === 'onb') { e.preventDefault(); $('#onbGo').click(); }
  if (e.target.id === 'aName' && view === 'login') { e.preventDefault(); $('#lGo').click(); }
  if (e.target.id === 'sNewName') { e.preventDefault(); $('[data-fc="new"]').focus(); }
  if (e.target.dataset.fc === 'new') { e.preventDefault(); $('#sAdd').click(); }
});
/* Bàn phím ảo: thanh nút nổi ngay trên bàn phím (bám theo visualViewport) */
function cmpPlace(){
  const vv = window.visualViewport, Z = parseFloat(document.documentElement.style.zoom) || 1;
  const kb = vv ? Math.max(0, innerHeight - vv.height - vv.offsetTop) : 0;
  document.querySelectorAll('body.kbbar .bar').forEach(c => c.style.setProperty('--kb', (kb / Z) + 'px'));   // .bar chỉ nổi lên trên bàn phím ở các trang nhập
  document.body.style.setProperty('--kbpad', (kb / Z) + 'px');   // chừa chỗ cuối trang bằng chiều cao bàn phím để ô nào cũng cuộn lên được trên thanh nút
  if (view === 'onb' && vv && vv.offsetTop > 1) window.scrollTo(0, 0);   // trang đặt tên không cuộn: iPhone tự đẩy trang lên khi mở bàn phím thì kéo về, để nút không lệch
}
/* ô đang gõ không được nằm dưới thanh nút nổi: cuộn thêm cho nó hiện trên thanh nút */
function keepAboveBar(){
  if (view !== 'acct') return;
  const a = document.activeElement, btn = $('#bar .btn'); if (!a?.matches?.('input,textarea') || !btn) return;
  const over = a.getBoundingClientRect().bottom - (btn.getBoundingClientRect().top - 12);
  if (over > 0) window.scrollBy({ top: over, behavior: 'smooth' });
}
/* iPhone báo kích thước vùng nhìn thấy lệch từng nhịp (thanh địa chỉ, thanh phụ của bàn phím hiện sau): trong lúc gõ, đo lại liên tục để nút luôn sát bàn phím */
let kbPoll = null;
const kbWatch = on => { clearInterval(kbPoll); kbPoll = on ? setInterval(() => { if (!document.body.classList.contains('kb')) return kbWatch(false); cmpPlace(); }, 150) : null; };
window.visualViewport?.addEventListener('resize', () => { cmpPlace(); keepAboveBar(); }); window.visualViewport?.addEventListener('scroll', cmpPlace);
/* Ô số tiền và tên khoản chi: nhớ giá trị lúc bắt đầu gõ, gõ xong (rời ô) mới ghi lịch sử một dòng nếu có đổi */
document.addEventListener('focusin', e => { if (e.target.matches?.('input:not([type=checkbox]):not([type=file]):not([type=date]),textarea') && !e.target.closest('.sheet')) { document.body.classList.add('kb'); if (document.body.classList.contains('kbbar')) { kbWatch(true); setTimeout(keepAboveBar, 350); } } });
/* iPhone: ô đang gõ bị xoá khỏi trang (chuyển trang) thì không có focusout → body.kb kẹt lại và thanh nút dưới bị ẩn mãi (lỗi mất nút khi lưu app ra màn hình). Kiểm tra lại mỗi lần vẽ trang / quay lại app. */
function kbSync(){ const a = document.activeElement, typing = a && a.isConnected && a.id !== 'kbHold' && a.matches?.('input:not([type=checkbox]):not([type=file]):not([type=date]),textarea') && !a.closest('.sheet'); if (!typing) { document.body.classList.remove('kb'); try { kbWatch(false); } catch(_) {} } if (view !== 'pin') $('#kbHold')?.remove(); }
function vpFix(){ const max = Math.max(0, document.documentElement.scrollHeight - innerHeight); if (scrollY > max) scrollTo(0, max); }   // bàn phím đóng mà trang còn bị đẩy lên: kéo về đúng chỗ
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { kbSync(); vpFix(); } });
window.visualViewport?.addEventListener('resize', () => { if (!document.activeElement?.matches?.('input,textarea')) { kbSync(); setTimeout(vpFix, 50); } });
document.addEventListener('focusout', () => setTimeout(() => { const a = document.activeElement; if (!a?.matches?.('input,textarea')) { document.body.classList.remove('kb'); kbWatch(false); cmpPlace(); setTimeout(vpFix, 250); [400, 900, 1600].forEach(t => setTimeout(refit, t)); } }, 60));   // bàn phím đóng xong mới đo lại đáy khung
['gesturestart','gesturechange'].forEach(t => document.addEventListener(t, e => e.preventDefault(), { passive: false }));
document.addEventListener('touchmove', e => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
/* vuốt: ở trang nhóm vuốt trái → phải để mở menu trái (menu chạy theo ngón tay), menu đang mở thì vuốt phải → trái để đóng;
   các trang khác vuốt sang phải để quay lại */
(() => {   // trang Khoản chi / Góp quỹ / Sửa: vuốt sang phải để quay lại, cùng kiểu với các trang khác (trang lùi theo tay 60%, mờ dần, quá 80px thì quay lại)
  let x0 = 0, y0 = 0, act = false, lk = null, dxx = 0;
  const sp = () => !$('#sheet').hidden && $('#sheetBody.asheet') ? $('#sheetBody') : null;
  document.addEventListener('touchstart', e => { act = false; lk = null; dxx = 0; if (!sp() || e.touches.length !== 1 || $('.dlg') || e.target.closest('input, textarea, .xswipe')) return; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; act = true; }, { passive: true });
  document.addEventListener('touchcancel', () => { if (!act) return; act = false; document.body.classList.remove('sheetdrag'); const p = sp(); if (p) { p.style.transition = ''; p.style.transform = ''; p.style.opacity = ''; } }, { passive: true });   // cử chỉ hệ thống cướp mất lần chạm: đừng để trang sau / thanh nút bị ẩn mãi
  document.addEventListener('touchmove', e => { if (!act) return; const x = e.touches[0].clientX - x0, y = e.touches[0].clientY - y0;
    if (lk === null && (Math.abs(x) > 10 || Math.abs(y) > 10)) lk = Math.abs(x) > Math.abs(y) * 1.5 && x > 0 ? 'x' : 'y';
    if (lk !== 'x') return; dxx = Math.max(0, x); const p = sp(); if (p) { document.body.classList.add('sheetdrag'); p.style.transition = 'none'; p.style.transform = `translateX(${dxx * .6}px)`; p.style.opacity = String(1 - Math.min(dxx / 600, .4)); } }, { passive: true });
  document.addEventListener('touchend', () => { if (!act) return; act = false; const p = sp(); if (!p) return; p.style.transition = 'transform .2s var(--ease), opacity .2s'; p.style.transform = ''; p.style.opacity = '';
    const goBack = lk === 'x' && dxx > 80; setTimeout(() => { p.style.transition = ''; document.body.classList.remove('sheetdrag'); }, 220); if (goBack) { document.body.classList.remove('sheetdrag'); $('#sheet .rback')?.click(); } });
})();
(() => {   // POD 25/11: bảng đáy (khoản chi / góp quỹ chỉ xem, đồ trong kho, thêm đồ, đã ứng...) vuốt xuống để đóng: bảng chạy theo tay, quá 80px thì đóng
  let y0 = 0, x0 = 0, act = false, lk = null, dy = 0;
  const sp = () => { const b = $('#sheetBody'); return !$('#sheet').hidden && b && !(b.classList.contains('asheet') && !b.classList.contains('rsheet')) ? b : null; };
  document.addEventListener('touchstart', e => { act = false; lk = null; dy = 0; const p = sp(); if (!p || e.touches.length !== 1 || $('.dlg') || e.target.closest('input, textarea, .xswipe, .tblw') || p.scrollTop > 0) return; y0 = e.touches[0].clientY; x0 = e.touches[0].clientX; act = true; }, { passive: true });
  document.addEventListener('touchmove', e => { if (!act) return; const y = e.touches[0].clientY - y0, x = e.touches[0].clientX - x0;
    if (lk === null && (Math.abs(x) > 10 || Math.abs(y) > 10)) lk = y > 0 && y > Math.abs(x) * 1.2 ? 'y' : 'n';
    if (lk !== 'y') return; dy = Math.max(0, y); const p = sp(); if (p) { p.style.transition = 'none'; p.style.transform = `translateY(${dy}px)`; } }, { passive: true });
  const end = () => { if (!act) return; act = false; const p = sp(); if (!p || lk !== 'y') return;
    if (dy > 80) { p.style.transition = 'transform .2s var(--ease)'; p.style.transform = 'translateY(110%)'; setTimeout(() => { p.style.transition = ''; p.style.transform = ''; closeSheet(); }, 200); }
    else { p.style.transition = 'transform .2s var(--ease)'; p.style.transform = ''; setTimeout(() => { p.style.transition = ''; }, 220); } };
  document.addEventListener('touchend', end, { passive: true }); document.addEventListener('touchcancel', end, { passive: true });
})();
(() => {   // vuốt từ trái sang phải = bấm nút quay lại của trang
  let sx = 0, sy = 0, on = false, dx = 0, lock = null;
  const backBtn = () => $('#pinBack') || $('#notiBack') || $('#formBack') || $('#sBack') || $('#acBack') || $('#logBack') || $('#gBack') || $('#kBack');
  const app = () => $('#app');
  document.addEventListener('touchstart', e => {
    on = false; lock = null; dx = 0;
    if (e.touches.length !== 1 || document.querySelector('#sheet:not([hidden]), .lacts, .dlg')) return;
    if (e.target.closest('.scroll, .tblw, input, textarea, .sheet, .cswipe') || !backBtn()) return;
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; on = true;
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    if (!on) return;
    const x = e.touches[0].clientX - sx, y = e.touches[0].clientY - sy;
    if (lock === null && (Math.abs(x) > 10 || Math.abs(y) > 10)) lock = Math.abs(x) > Math.abs(y) * 1.5 && x > 0 ? 'x' : 'y';
    if (lock !== 'x') return;
    dx = Math.max(0, x); const a = app(); a.style.transition = 'none'; a.style.transform = `translateX(${dx * .6}px)`; a.style.opacity = String(1 - Math.min(dx / 600, .4));
  }, { passive: true });
  const end = () => {
    if (!on) return; on = false;
    const a = app(); a.style.transition = 'transform .2s var(--ease), opacity .2s'; a.style.transform = ''; a.style.opacity = '';
    if (lock === 'x' && dx > 80) { const b = backBtn(); setTimeout(() => { a.style.transition = ''; }, 220); b && b.click(); }
  };
  document.addEventListener('touchend', end, { passive: true });
  document.addEventListener('touchcancel', end, { passive: true });
})();

/* Kho đồ: nhấn giữ card đồ → hiện nút Xóa đồ ngay dưới card đó (chỉ người tạo đồ xóa được) */
let lpT = null, lpFired = false, lpX = 0, lpY = 0;
document.addEventListener('pointerdown', e => {
  $('.kdel') && !e.target.closest('.kdel') && ($('.kdel').remove());
  const row = e.target.closest?.('.krow2'); if (!row) return; const rid = row.dataset.kedit || row.dataset.item; lpX = e.clientX; lpY = e.clientY; clearTimeout(lpT);
  lpT = setTimeout(() => { const it = itemOf(G, +rid); if (!it) return; lpFired = true; setTimeout(() => { lpFired = false; }, 700); navigator.vibrate?.(10);
    kAdd = false; kEdit = it.id; itDraft = itDraftOf(it); rerender(); }, 450);   // Figma 23: nhấn giữ = mở sửa tại chỗ kèm nút Xóa đồ
}, true);
['pointerup', 'pointercancel'].forEach(t => document.addEventListener(t, () => clearTimeout(lpT), true));
document.addEventListener('pointermove', e => { if (lpT && Math.hypot(e.clientX - lpX, e.clientY - lpY) > 8) clearTimeout(lpT); }, true);
document.addEventListener('contextmenu', e => { if (e.target.closest?.('.krow2')) e.preventDefault(); });
document.addEventListener('click', e => { if (lpFired && e.target.closest?.('.krow2')) { lpFired = false; e.stopPropagation(); e.preventDefault(); } }, true);
document.addEventListener('click', e => { const i = e.target.closest('.cal, .xbd, .kdt')?.querySelector('input[type=date]'); if (!i) return; try { i.showPicker(); e.preventDefault(); } catch(_) {} });
window.addEventListener('resize', () => { if (view === 'home') fitWelcome(); });
document.fonts?.ready.then(() => { if (view === 'home') fitWelcome(); }); addEventListener('load', () => { if (view === 'home') fitWelcome(); });

/* nhấn giữ thẻ ở trang Tổng kết → nút Xuất ảnh */
let pressT = null, pressEl = null, startXY = null, suppressClick = false;
document.addEventListener('pointerdown', e => {
  const card = e.target.closest('.sumv .stack > :is(.fund,.txcard,.tblw)'); if (!card || e.target.closest('input') || (e.target.closest('button') && !e.target.closest('.tx'))) return;
  card.classList.add('scard');
  pressEl = card; startXY = [e.clientX, e.clientY]; card.classList.add('press');
  pressT = setTimeout(() => { card.classList.remove('press'); suppressClick = true; setTimeout(() => suppressClick = false, 600); pressSumCard(card); pressT = null; }, 500);
});
const cancelPress = () => { clearTimeout(pressT); pressT = null; pressEl?.classList.remove('press'); pressEl = null; };
document.addEventListener('pointerup', cancelPress);
document.addEventListener('pointercancel', cancelPress);
document.addEventListener('pointermove', e => { if (pressT && startXY && Math.hypot(e.clientX - startXY[0], e.clientY - startXY[1]) > 10) cancelPress(); });
document.addEventListener('contextmenu', e => { if (e.target.closest('.sumv .stack > *')) e.preventDefault(); });
