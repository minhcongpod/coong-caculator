/* ================= ảnh nhóm / ảnh đại diện =================
   Ảnh là chuỗi "ic:<icon>:<màu>" (icon + màu chọn trong bảng), emoji cũ, hoặc ảnh tải lên (data:). */
const AV_IC = [['beer','Bia'],['mic','Karaoke'],['cake','Sinh nhật'],['plane','Du lịch'],['shuttle','Cầu lông'],['ball','Bóng đá'],
  ['food','Ăn uống'],['coffee','Cà phê'],['game','Chơi game'],['gift','Quà'],['home','Nhà'],['cart','Mua sắm']];
const AV_COL = ['#FF453A','#FF9F0A','#FFD60A','#30D158','#0A84FF','#BF5AF2','#8D8D8D'];   // 5 = tím (chỉ còn cho avatar cũ), 6 = xám mặc định
const AV_SHOW = [6,0,2,1,3,4];
const GR_PICK = [['people','Mặc định'], ...AV_IC.slice(1)];   // bảng ảnh nhóm: ô đầu là icon nhóm mặc định thay cho bia (Figma 437:2406)   // thứ tự màu hiện ở bảng chọn avatar tài khoản (Figma 410:544): xám mặc định, đỏ, vàng, cam, xanh lá, xanh dương
const icParse = av => { const [, k0, c] = av.split(':'), k = /^[a-z-]+$/.test(k0) ? k0 : 'people'; const col = AV_COL[+c] || AV_COL[2]; return { k, c: +c || 0, col, fg: col === '#FFD60A' ? '#000' : '#fff' }; };   // chỉ nhận tên icon hợp lệ: ảnh đại diện có thể đến từ hồ sơ người khác
const rowAv = m => m && m.avatar ? avHTML(m.avatar, 'cav', 'i-user') : `<span class="rav">${svg('i-user')}</span>`;   /* avatar thật của thành viên (nếu có) ở dòng góp quỹ; chưa có thì icon người xám (POD 18/11: icon trong design chính là avatar) */
const avHTML = (av, cls = '', none = 'i-people') => av && av.startsWith('ic:') ? (({ k, col, fg }) => `<span class="av ic ${k === 'people' || k === 'user' ? 'u ' : ''}${cls}" style="--c:${col};--fg:${fg}">${svg(k === 'people' || k === 'user' ? 'i-' + k : k.startsWith('an-') ? k : 'ic-' + k)}</span>`)(icParse(av))
  : av && !av.startsWith('data:') ? `<span class="av emo ${cls}">${esc(av)}</span>` : `<span class="av ${cls}">${svg(none)}</span>`;   // ảnh tải lên (bản cũ) không dùng nữa: hiện icon mặc định
/* Tài khoản: tên + ảnh đại diện (ảnh tải lên hoặc 12 con vật dạng đặc + màu), chỉ lưu trên máy này, không nằm trong sổ chia sẻ */
const AN_IC = [['an-cat','Mèo'],['an-dog','Chó'],['an-rabbit','Thỏ'],['an-bird','Chim'],['an-fish','Cá'],['an-butterfly','Bướm'],
  ['an-cow','Bò'],['an-horse','Ngựa'],['an-shrimp','Tôm'],['an-bug-beetle','Bọ cánh cứng'],['an-bug','Bọ'],['an-paw-print','Dấu chân']];
const AN_PICK = [['user','Mặc định'], ...AN_IC.slice(1)];   // ô đầu là người mặc định, thay cho mèo (Figma 410:544)
const anSvg = k => svg(k === 'user' ? 'i-user' : k);
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
