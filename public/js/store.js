/* ================= storage & model =================
   group   = { id, name, avatar, by, at, members:[{ id, name, uid?, handle?, avatar? }], exps:[expense], fund?, sid?, bill? }
   expense = { id, at, name, by, parts:[memberId], flows:[{ id: memberId | FUND, role: 'pay'|'donate'|'fixed', amt, note? }] }
   - Ứng tiền (pay): trả trước số tiền đó và vẫn chia đều như mọi người.
   - Tài trợ (donate, chỉ còn ở dữ liệu cũ) / Đóng cố định (fixed): chỉ chịu đúng số đó, không chia đều.
   Tổng chi = tổng tiền ứng. Phần còn lại sau khi trừ tài trợ + cố định chia đều cho những người tham gia còn lại.
   Mỗi đường link ngắn (coongno.web.app/1, /abc…) là một quỹ độc lập, công khai: ai mở link cũng xem được. */
const PATH = (() => { try { return decodeURIComponent(location.pathname); } catch(e) { return ''; } })().normalize('NFC');
const SLUG = ((PATH.match(/^\/((?:new-user\/\d{1,12})|[\p{L}\p{N}_-]{1,40})\/?$/u) || [])[1] || '').toLowerCase().replace(/^s$/, '');
/* Link bill chỉ-xem: /<quỹ>/bill/<tên-nhóm>, /s/<mã>/bill/<tên-nhóm>, /new-user/<số>/bill/<tên-nhóm> — chỉ hiện trang Tổng kết, không ghi gì xuống máy hay lên máy chủ. */
const BILLM = PATH.match(/^\/(?:s\/([A-Za-z0-9]{20,40})|(new-user\/\d{1,12})|([\p{L}\p{N}_-]{1,40}))\/bill\/([a-z0-9-]{1,60})\/?$/u);
const BILLN = PATH.match(/^\/bills\/(\d{4,12})\/?$/);   // link bill mới: /bills/<số ngẫu nhiên>
const BILL = BILLN ? { bid: BILLN[1], st: 'load' } : BILLM ? { code: BILLM[1] || null, owner: (BILLM[2] || BILLM[3] || '').toLowerCase(), g: BILLM[4], st: 'load' } : null;
const KEY = BILL ? 'coong_bill_view' : SLUG ? 'coong_calc_v4_' + SLUG : 'coong_calc_v4';
const store = {
  get(k){ try { return JSON.parse(localStorage.getItem(k)); } catch(e){ return null; } },
  set(k,v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
};
/* Mốc reset: đổi EPOCH (và xoá collection books trên Firestore) thì mọi máy mở bản mới sẽ xoá sạch dữ liệu của app trên máy đó đúng một lần.
   Không có bước này, máy cũ còn dữ liệu sẽ đẩy ngược dữ liệu cũ lên máy chủ vừa được xoá. */
const EPOCH = 'launch-2026-11';
try { if (localStorage.getItem('coong_epoch') !== EPOCH) { Object.keys(localStorage).filter(k => k.startsWith('coong_')).forEach(k => localStorage.removeItem(k)); localStorage.setItem('coong_epoch', EPOCH); } } catch(e) {}
let uid = 1;
const mem = n => ({ id: uid++, name: n });
/* bring over cuộc vui from the previous version once */
function fromV3(old = store.get('coong_calc_v3')){
  if (!old || !Array.isArray(old.events)) return null;
  return old.events.filter(e => !e.sample && e.members?.length).map(e => {
    const exps = (e.stages || []).filter(s => Number(s.total) > 0).map(s => {
      const pays = (s.payers || []).filter(x => e.members.some(m => m.id === x.id));
      return { id: s.id, name: s.name || '', parts: (s.parts || []).slice(),
        flows: pays.map(x => ({ id: x.id, role: 'pay', amt: pays.length === 1 ? Number(s.total) : Number(x.amt) || 0 })) };
    });
    e.members.forEach(m => {               // old per-outing donate / fixed → first expense they joined
      const amt = m.role === 'donate' ? m.donate : m.role === 'custom' ? m.amount : 0;
      const ex = amt && exps.find(x => x.parts.includes(m.id));
      if (ex && !ex.flows.some(f => f.id === m.id)) ex.flows.push({ id: m.id, role: m.role === 'donate' ? 'donate' : 'fixed', amt });
    });
    return { id: e.id, name: e.name || 'Cuộc vui', members: e.members.map(m => ({ id: m.id, name: m.name })), exps, round: e.round !== false, done: {} };
  });
}
function spons(f){ if (!f) return []; if (Array.isArray(f.sponsors)) return f.sponsors; return Number(f.base) ? [{ name: f.baseName || '', amt: Number(f.base) }] : []; }
