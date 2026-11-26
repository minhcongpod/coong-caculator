/* ================= trang chủ: danh sách nhóm ================= */
function homeView(){
  const head = `<header class="logo"><svg class="wm" viewBox="0 0 135 27" role="img" aria-label="Coong Nợ"><use href="#i-logo"/></svg></header>`;
  return `<section class="view home0">${head}<div class="welcome">
    <div class="ill" aria-hidden="true">
      <div class="c1"><p class="r">Quỹ chung còn<em>620.000</em></p><p class="fb"><i></i></p>
        <div class="ls"><p class="r"><span>Góp quỹ <small>· 7 người</small></span><em>+1.400.000</em></p><p class="r"><span>Đã chi <small>· 8 khoản</small></span><em class="n">−780.000</em></p></div></div>
      <div class="c2"><p class="h"><span class="cal">11<small>Th 11</small></span><span>Nhậu</span><em>3.000.000</em></p></div>
      <div class="c3"><p class="h"><span class="cal">31<small>Th 12</small></span><span>Bún chả</span><em>200.000</em></p>
        <p class="inp"><b>An<small>Ứng tiền</small></b><em>200.000</em></p>
        <p class="r">04 người, mỗi người<em>50.000</em></p></div>
    </div>
    <div class="hello"><h1>Coong Nợ xin chào,</h1><h2>Chia tiền nhóm trong tictac!</h2>
      <div class="steps"><span><b>1</b>Tạo nhóm</span>${svg('i-sep')}<span><b>2</b>Ghi khoản chi</span>${svg('i-sep')}<span><b>3</b>Tổng kết</span></div></div>
  </div></section>`;
}

/* --- v2 (Figma 398-2128): Trang chủ danh sách nhóm, Lịch nhóm, Kho đồ --- */
let listTab = 'all', calDay = null;
const todayISO = () => isoDay(Date.now());
const ICO_SRCH = '<svg class="srch" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.9-3.9"/></svg>';
const ICO_OUT = '<svg class="dir" viewBox="0 0 20 20" fill="none" stroke="#FF383C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5.83 5.83h8.34v8.34M5.83 14.17l8.34-8.34"/></svg>';
const ICO_IN = '<svg class="dir" viewBox="0 0 20 20" fill="none" stroke="#34C759" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.17 5.83 5.83 14.17M14.17 14.17H5.83V5.83"/></svg>';
const ICO_BELL = '<svg viewBox="0 0 24 24"><path d="M20.39 17.2c-.02-.02-1.9-2.33-1.9-5.02V8.79C18.5 5.32 15.58 2.5 12 2.5S5.5 5.32 5.5 8.79v3.39c0 2.69-1.87 5-1.89 5.02a.55.55 0 0 0 .39.8h16c.19 0 .37-.1.45-.27a.5.5 0 0 0-.06-.53z" fill="#fff"/><path d="M15 20a.72.72 0 0 0 0-.7.73.73 0 0 0-.6-.34H9.6a.73.73 0 0 0-.6.34.72.72 0 0 0 0 .7A3.18 3.18 0 0 0 12 21.73 3.18 3.18 0 0 0 15 20z" fill="#fff"/></svg>';
const myMember = g => g.members.find(x => x.uid && x.uid === myUid()) || g.members.find(x => x.name === root.acct?.name) || null;
const myStat = g => {   // số dư của tôi trong nhóm g: >0 nhận lại, <0 chưa trả, 0 cân bằng; null nếu tôi không có trong danh sách thành viên
  const S = settle(g), m = g.members.find(x => x.uid && x.uid === myUid()) || g.members.find(x => x.name === root.acct?.name);
  const mine = m ? S.txs.filter(t => t.from === m.id || t.to === m.id) : [];   // các khoản chuyển liên quan tới tôi ở card "Ai chuyển cho ai?"
  return { left: S.fund.left, net: m ? (S.nets.find(n => n.id === m.id)?.net || 0) : null, paid: !!m && !mine.length && (g.pays || []).some(p => p.from === m.id || p.to === m.id) };
};
function listView(){
  const head = `<header class="lhead"><svg class="wm" viewBox="0 0 135 27" role="img" aria-label="Coong Nợ"><use href="#i-logo"/></svg><div class="lbtns"><button class="circ c44 nbell" id="lBell" aria-label="Thông báo">${ICO_BELL}${(n => n ? `<em class="nbadge">${n > 9 ? '9+' : n}</em>` : '')(notiUnread())}</button><button class="circ c44" id="lAcct" aria-label="Tài khoản ${esc(root.acct?.name || '')}">${avHTML(root.acct?.avatar, 'me', 'i-user')}</button></div></header>`;
  const rows = root.groups.map(g => ({ g, s: myStat(g) }));
  const oweR = rows.filter(r => r.s.net < 0 && !r.s.paid), getR = rows.filter(r => r.s.net > 0 && !r.s.paid);   // Figma 397:783: Còn nợ N nhóm (đỏ) và Đã ứng N nhóm (xanh)
  const debtTot = oweR.reduce((a, r) => a - r.s.net, 0), getTot = getR.reduce((a, r) => a + r.s.net, 0);
  const cards = `<div class="tcards"><div class="tcard"><small>Còn nợ ${oweR.length} nhóm</small><b class="neg">${fmt(debtTot)}</b></div><div class="tcard"><small>Đã ứng ${getR.length} nhóm</small><b class="pos">${fmt(getTot)}</b></div></div>`;
  if (!rows.length) return `<section class="view lview">${head}${cards}<div class="lempty"><div class="lemp1"><span class="circ">${svg('i-broken')}</span><p>Cô đơn à? Chả thấy nhóm nào...</p></div><button class="btn pill" id="newGroup">Tạo nhóm đầu tiên</button></div></section>`;
  const st = s => s.net === null ? '' : s.paid || s.net === 0 ? 'done' : s.net > 0 ? 'get' : 'owe';   // eq (cân bằng): dòng không hiện số hay chữ; paid: đã tích "đã chuyển" hết ở card Ai chuyển cho ai?
  const TABS = [['all', 'Tất cả'], ['owe', 'Còn nợ'], ['get', 'Đã ứng'], ['done', 'Hết nợ']];
  const list = rows.filter(r => listTab === 'all' || st(r.s) === listTab).map(({ g, s }) => {
    const k = st(s), cr = g.by ? byName(g.by, g.byName, g) : '', who = cr ? ` · Tạo bởi ${cr === 'tôi' ? 'tôi' : esc(cr)}` : '';
    const right = k === 'get' ? `<span class="gst pos"><small>Đã ứng</small><b>+${fmt(s.net)}</b></span>` : k === 'owe' ? `<span class="gst neg"><small>Còn nợ</small><b>−${fmt(-s.net)}</b></span>` : k === 'done' ? `<span class="gst eq">Hết nợ</span>` : '';
    return `<button class="grow" data-gopen="${g.id}">${avHTML(g.avatar, 'gav')}<span class="gtx"><b>${esc(g.name || 'Nhóm')}</b><small>${g.members.length} người${who}</small></span>${right}${svg('i-up', 'gchv')}</button>`;
  }).join('') || `<p class="lnone">Không có nhóm nào ở mục này</p>`;
  return `<section class="view lview">${head}${cards}<div class="ltabs" role="tablist">${TABS.map(([k, l]) => `<button class="ltab ${listTab === k ? 'on' : ''}" role="tab" aria-selected="${listTab === k}" data-ltab="${k}">${l}</button>`).join('')}</div><div class="glist">${list}</div></section>`;
}
