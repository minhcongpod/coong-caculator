// Kiểm tra hồi quy khi sửa / dọn code: ghi lại kết quả tính tiền, HTML và style tính ra của các màn hình chính vào một thư mục,
// chạy trước và sau khi sửa rồi so hai thư mục (diff -r). Không có khác biệt = hành vi, giao diện, cách tính giữ nguyên.
//   node tools/serve.js &   rồi   node tools/regress.js /tmp/truoc   (sửa code)   node tools/regress.js /tmp/sau   &&   diff -r /tmp/truoc /tmp/sau
// Firestore bị chặn (đọc trả 404, ghi trả 200) nên không chạm dữ liệu thật.
const { chromium } = require('playwright'), fs = require('fs'), path = require('path');
const OUT = path.resolve(process.argv[2] || path.join(__dirname, 'out', 'regress')); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://localhost:8123/';
const norm = s => s.replace(/\d{10,}/g, 'N')   // id / thời điểm tạo
  .replace(/stroke-dasharray="[^"]*"/g, 'stroke-dasharray=""');
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  await ctx.route(/firestore\.googleapis/, r => r.request().method() === 'PATCH' ? r.fulfill({ status: 200, contentType: 'application/json', body: '{"updateTime":"2026-01-01T00:00:00Z"}' }) : r.fulfill({ status: 404, body: '{}' }));
  await ctx.route(/fonts\.(googleapis|gstatic)\.com|gstatic\.com\/firebasejs|cdnjs/, r => r.abort());
  const p = await ctx.newPage(), errs = []; let n = 0;
  p.on('pageerror', e => errs.push(e.message));
  const wait = ms => p.waitForTimeout(ms);
  const dump = async name => {
    const html = await p.evaluate(() => { const s = document.getElementById('sheet'); return document.getElementById('app').innerHTML + '\n<!--SHEET-->\n' + (s && !s.hidden ? s.innerHTML : ''); });
    const css = await p.evaluate(() => {   // style tính ra của mọi phần tử (tắt chuyển động cho ổn định): bắt được thay đổi CSS
      if (!document.getElementById('noanim')) { const st = document.createElement('style'); st.id = 'noanim'; st.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}'; document.head.append(st); }
      return [...document.querySelectorAll('body *')].map(e => { const c = getComputedStyle(e); return e.tagName + ' ' + (typeof e.className === 'string' ? e.className : '') + ' | ' + [...c].filter(k => !/^(transform|opacity|translate|scale)$/.test(k)).sort().map(k => k + ':' + c.getPropertyValue(k)).join(';'); }).join('\n');
    });
    const f = `${String(++n).padStart(2, '0')}-${name}`;
    fs.writeFileSync(path.join(OUT, f + '.html'), norm(html).replace(/></g, '>\n<'));
    fs.writeFileSync(path.join(OUT, f + '.css.txt'), norm(css));
  };
  const click = async (sel, ms = 500) => { await p.locator(sel).first().click(); await wait(ms); };
  const closeSheet = async () => { if (await p.locator('#sheet:not([hidden]) [data-close]').count()) await click('#sheet [data-close]', 400); else { await p.keyboard.press('Escape'); await wait(400); } };

  // tài khoản
  await p.goto(URL); await wait(1200); await click('#toCreate', 400); await p.fill('#aName', 'Tester'); await wait(600);
  await click('#onbGo', 600); await p.keyboard.type('1234'); await wait(400); await p.keyboard.type('1234'); await wait(1500);
  await dump('trang-chu-trong');

  // số liệu tính tiền của các nhóm mẫu
  for (const q of ['', 'kho']) { await p.goto(URL + '?demo' + (q ? '=' + q : '')); await wait(1500); }
  await dump('danh-sach-nhom');
  const calc = await p.evaluate(() => { return JSON.parse(localStorage.getItem('coong_calc_v4')).groups.filter(g => g.id >= 777000001 && g.id <= 777000002).map(g => ({ id: g.id, s: window.coongSettle(g) })); });
  fs.writeFileSync(path.join(OUT, '00-settle.json'), norm(JSON.stringify(calc, null, 1)));

  for (const name of ['Cẩu Lông', 'Kho mua']) {
    const tag = name === 'Kho mua' ? 'kho' : 'demo';
    await p.goto(URL); await wait(1200); if (await p.locator('#gBack, .back').count() && !(await p.locator('.grow').count())) { await click('.back', 600); }
    await p.locator('.grow', { hasText: name }).first().click(); await wait(900);
    await dump(tag + '-lich');
    await click('[data-fundopen2]', 400); await dump(tag + '-quy-mo'); await click('[data-fundopen2]', 400);
    await click('#kOpen', 600); await dump(tag + '-kho'); await click('#kBack', 400);
    const ents = await p.locator('[data-cent]').count();
    for (let i = 0; i < Math.min(ents, 3); i++) { await p.locator('[data-cent]').nth(i).click(); await wait(600); await dump(`${tag}-chi-tiet-${i}`); await closeSheet(); }
    await click('#fabAdd', 500); await dump(tag + '-them-chi'); await click('[data-atab="top"]', 400); await dump(tag + '-them-gop'); await p.keyboard.press('Escape'); await wait(300);
    await p.goto(URL); await wait(1200); await p.locator('.grow', { hasText: name }).first().click(); await wait(900);
    await click('#toSum', 1200); await dump(tag + '-tong-ket');
    const pc = await p.locator('[data-sper]').count(); for (let i = 0; i < pc; i++) { await p.locator('[data-sper]').nth(i).click(); await wait(300); } if (pc) await dump(tag + '-tong-ket-dot-cu');
    for (let i = 0; i < 2 && await p.locator('[data-tx]:not(.done)').count(); i++) { await click('[data-tx]:not(.done)', 1200); await dump(`${tag}-tich-${i}`); }
    if (await p.locator('[data-txshort]').count()) { await p.evaluate(() => document.querySelector('[data-txshort]').click()); await wait(300); await dump(tag + '-quy-khong-du'); }
    const ok = await p.evaluate(() => [...document.querySelectorAll('.tbl')].length);
    fs.appendFileSync(path.join(OUT, '00-log.txt'), `${tag}: ${ok} bảng\n`);
  }
  fs.appendFileSync(path.join(OUT, '00-log.txt'), errs.length ? 'LỖI JS: ' + errs.join(' | ') + '\n' : 'Không có lỗi JS\n');
  console.log(errs.length ? 'LỖI JS: ' + errs.join(' | ') : 'Không có lỗi JS', '—', n, 'màn hình trong', OUT);
  await b.close();
})();
