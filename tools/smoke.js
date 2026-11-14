// Chạy thử toàn bộ luồng chính bằng Playwright (Chromium), chụp ảnh vào tools/out/.
//   npm i -D playwright && npx playwright install chromium   (một lần)
//   node tools/serve.js &   rồi   node tools/smoke.js [độ rộng màn hình=375]
// Font: nếu có thư mục tools/.fonts (giải nén gói npm @fontsource/space-grotesk@5.0.18 vào đó) thì dùng font thật,
// không thì để trình duyệt tự tải Google Fonts. Firestore bị chặn trong lúc test để không ghi dữ liệu thật.
const { chromium } = require('playwright'), fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
const W = +process.argv[2] || 375, URL = 'http://localhost:8123/smoke' + Date.now();
async function localFonts(ctx){
  const D = path.join(__dirname, '.fonts'); if (!fs.existsSync(D)) return;
  let css = ''; for (const sub of ['latin', 'latin-ext', 'vietnamese']) for (const w of [400, 500, 600, 700]) { const f = path.join(D, `${sub}-${w}.css`); if (fs.existsSync(f)) css += fs.readFileSync(f, 'utf8'); }
  css = css.replace(/url\(\.\/files\/([^)]+)\)/g, 'url(https://fonts.gstatic.com/x/$1)');
  await ctx.route(/fonts\.googleapis\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: css }));
  await ctx.route(/fonts\.gstatic\.com\/x\//, r => { const n = r.request().url().split('/x/')[1]; r.fulfill({ status: 200, body: fs.readFileSync(path.join(D, 'files', n)) }); });
}
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: W, height: 812 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  await ctx.route(/firestore\.googleapis/, r => r.fulfill({ status: 404, body: '{}' }));
  await localFonts(ctx);
  const H2C = path.join(__dirname, '.html2canvas.min.js');   // tuỳ chọn: bản html2canvas cục bộ nếu máy không vào được cdnjs
  if (fs.existsSync(H2C)) await ctx.route(/html2canvas/, r => r.fulfill({ status: 200, contentType: 'application/javascript', path: H2C }));
  const p = await ctx.newPage(), errs = []; let dn = 0;
  p.on('pageerror', e => errs.push(e.message)); p.on('download', d => d.saveAs(path.join(OUT, `export-${dn++}.png`)));
  const blur = () => p.evaluate(() => document.activeElement?.blur()), shot = n => p.screenshot({ path: path.join(OUT, n + '.png') });
  await p.goto(URL); await p.waitForTimeout(1200); await shot('1-xin-chao');
  await p.click('#newGroup'); await p.waitForTimeout(400); await p.fill('#gName', 'Cầu Lông');
  for (const n of ['Coong', 'Quân', 'Linh']) { await p.fill('#fName', n); await p.keyboard.press('Enter'); }
  await blur(); await p.click('#fundTgl'); await p.waitForTimeout(300);
  await p.click('[data-fc="new"]'); await p.keyboard.type('900000'); await p.click('#sAdd'); await p.waitForTimeout(300); await blur();
  await shot('2-tao-nhom'); await p.click('#saveGroup'); await p.waitForTimeout(1200);
  await p.fill('[data-ename]', 'Sân'); await p.keyboard.press('Enter'); await p.waitForTimeout(200); await blur();
  await p.click('[data-all]'); await p.waitForTimeout(300);
  await p.locator('[data-amt]').first().click(); await p.keyboard.type('300000'); await blur(); await p.waitForTimeout(300);
  // Thêm khoản chi + giả lập bàn phím cao 330px: nút "Thêm khoản chi" phải nằm ngay trên bàn phím
  await p.click('#addExp'); await p.waitForTimeout(100);
  await p.evaluate(() => { const v = visualViewport; Object.defineProperty(v, 'height', { get: () => innerHeight - 330 }); v.dispatchEvent(new Event('resize')); });
  await p.waitForTimeout(1300);
  const kb = await p.evaluate(() => ({ kbTop: innerHeight - 330, btnBottom: Math.round(document.querySelector('#addExp').getBoundingClientRect().bottom) }));
  console.log('Bàn phím:', kb, kb.btnBottom <= kb.kbTop && kb.btnBottom > kb.kbTop - 40 ? 'OK' : 'LỆCH');
  await shot('3-them-khoan-chi'); await blur(); await p.waitForTimeout(400);
  await p.reload(); await p.waitForTimeout(1000);   // bỏ giả lập bàn phím; dữ liệu vẫn còn trong localStorage
  await p.click('[data-open]'); await p.waitForTimeout(1000); await blur(); await p.waitForTimeout(300);   // nhóm tự focus ô tên khoản chi trống, trên màn cảm ứng sẽ ẩn nút Tổng kết
  await p.click('#toSum'); await p.waitForTimeout(1500); await shot('4-tong-ket');
  console.log('Tổng kết:', await p.evaluate(() => [...document.querySelectorAll('.prow summary')].map(x => x.textContent.trim())));
  await p.click('#shotAll'); await p.waitForTimeout(4000);
  console.log(errs.length ? 'LỖI JS: ' + errs.join(' | ') : 'Không có lỗi JS', '— ảnh trong', OUT);
  await b.close();
})();
