/* ================= xuất ảnh (html2canvas) ================= */
/* nhấn giữ một thẻ ở trang Tổng kết (Quỹ chung, bảng thu chi, Ai chuyển cho ai): nhấc thẻ lên, hiện nút Xuất ảnh */
function pressSumCard(card){
  unlift();
  document.activeElement?.blur?.();
  const dim = document.createElement('div'); dim.className = 'dim'; dim.addEventListener('click', unlift); document.body.appendChild(dim);
  card.classList.add('lift');
  card.insertAdjacentHTML('afterend', `<div class="lacts"><button class="btn" data-shotcard>Xuất ảnh</button></div>`);
  const r = card.getBoundingClientRect(), bar = document.querySelector('.bar'), need = r.bottom + 76 - (innerHeight - (bar ? bar.offsetHeight : 16));
  if (r.top < 16) window.scrollBy({ top: r.top - 16, behavior: 'smooth' }); else if (need > 0) window.scrollBy({ top: Math.min(need, r.top - 16), behavior: 'smooth' });
}
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
    const c = await window.html2canvas(card, { backgroundColor: '#000', scale: 3, logging: false, width: cw, windowWidth: Math.max(innerWidth, cw), onclone: d => { d.documentElement.style.zoom = ''; const sr = d.querySelector('[data-shotroot]'); if (sr) { sr.style.width = cw + 'px'; sr.style.boxSizing = 'border-box'; }
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
