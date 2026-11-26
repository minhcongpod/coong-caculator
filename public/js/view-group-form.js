/* ================= trang Tạo / Sửa nhóm: tên, ảnh, thành viên, góp quỹ ban đầu ================= */
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
function fundTot(){ const f = draft.fund || { contrib: {} }; return spons(f).reduce(addAmt, 0) + (Number(f.newS?.amt) || 0) + draft.members.reduce((a, m) => a + (Number(f.contrib[m.id]) || 0), 0);
}
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
