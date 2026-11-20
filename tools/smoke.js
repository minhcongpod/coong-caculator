// Chạy thử toàn bộ luồng chính bằng Playwright (Chromium), chụp ảnh vào tools/out/.
//   npm i -D playwright && npx playwright install chromium   (một lần)
//   node tools/serve.js &   rồi   node tools/smoke.js [độ rộng màn hình=375]
// Font: nếu có thư mục tools/.fonts (giải nén gói npm @fontsource/space-grotesk@5.0.18 vào đó) thì dùng font thật,
// không thì để trình duyệt tự tải Google Fonts. Firestore bị chặn trong lúc test để không ghi dữ liệu thật.
const { chromium } = require('playwright'), fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
const W = +process.argv[2] || 375, URL = 'http://localhost:8123/';   // trang gốc, như người dùng thật vào coongno.web.app/
async function localFonts(ctx){
  const D = path.join(__dirname, '.fonts'); if (!fs.existsSync(D)) return;
  let css = ''; for (const sub of ['latin', 'latin-ext', 'vietnamese']) for (const w of [400, 500, 600, 700]) { const f = path.join(D, `${sub}-${w}.css`); if (fs.existsSync(f)) css += fs.readFileSync(f, 'utf8'); }
  css = css.replace(/url\(\.\/files\/([^)]+)\)/g, 'url(https://fonts.gstatic.com/x/$1)');
  await ctx.route(/fonts\.googleapis\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: css }));
  await ctx.route(/fonts\.gstatic\.com\/x\//, r => { const n = r.request().url().split('/x/')[1]; r.fulfill({ status: 200, body: fs.readFileSync(path.join(D, 'files', n)) }); });
}
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: W, height: 812 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  // Firestore giả: đọc luôn "chưa có gì" (404), ghi luôn thành công (200), không chạm dữ liệu thật
  await ctx.route(/firestore\.googleapis/, r => r.request().method() === 'PATCH' ? r.fulfill({ status: 200, contentType: 'application/json', body: '{"updateTime":"2026-01-01T00:00:00Z"}' }) : r.fulfill({ status: 404, body: '{}' }));
  await localFonts(ctx);
  const H2C = path.join(__dirname, '.html2canvas.min.js');   // tuỳ chọn: bản html2canvas cục bộ nếu máy không vào được cdnjs
  if (fs.existsSync(H2C)) await ctx.route(/html2canvas/, r => r.fulfill({ status: 200, contentType: 'application/javascript', path: H2C }));
  const p = await ctx.newPage(), errs = []; let dn = 0;
  p.on('pageerror', e => errs.push(e.message)); p.on('download', d => d.saveAs(path.join(OUT, `export-${dn++}.png`)));
  const blur = () => p.evaluate(() => document.activeElement?.blur()), shot = n => p.screenshot({ path: path.join(OUT, n + '.png') });
  await p.goto(URL); await p.waitForTimeout(1200); await shot('1-xin-chao');
  await p.click('#startBtn'); await p.waitForTimeout(400); await p.fill('#aName', 'Coong'); await p.waitForTimeout(600); await shot('1b-dat-ten');   // trang đặt tên lần đầu
  await p.click('#onbGo'); await p.waitForTimeout(1200); await p.fill('#gName', 'Cầu Lông');
  for (const n of ['Quân', 'Linh'])   // Coong (người tạo) đã có sẵn trong nhóm
    { await p.fill('#fName', n); await p.keyboard.press('Enter'); }
  await blur(); await p.click('#fundTgl'); await p.waitForTimeout(300);   // mở mục Góp quỹ chung
  await p.click('[data-fc="new"]'); await p.keyboard.type('900000'); await p.click('#sAdd'); await p.waitForTimeout(300); await blur();
  await shot('2-tao-nhom'); await p.click('#saveGroup'); await p.waitForTimeout(1200);
  await p.fill('[data-ename]', 'Sân'); await p.keyboard.press('Enter'); await p.waitForTimeout(200); await blur();
  await p.click('[data-all]'); await p.waitForTimeout(300);
  // Nhập số tiền: trên màn cảm ứng thanh nhập nổi ngay trên bàn phím (giả lập bàn phím cao 330px)
  const fakeKb = () => p.evaluate(() => { const v = visualViewport; Object.defineProperty(v, 'height', { get: () => innerHeight - 330, configurable: true }); v.dispatchEvent(new Event('resize')); });
  await p.locator('[data-flow$=":-1"]').first().tap(); await p.waitForTimeout(100); await fakeKb();   // nhóm có quỹ: bấm chip Rút quỹ thì ô nhập số tiền nổi lên await p.waitForTimeout(500);
  const am = await p.evaluate(() => ({ kbTop: innerHeight - 330, barBottom: Math.round(document.querySelector('#amp .ampc').getBoundingClientRect().bottom), focus: document.activeElement.id }));
  console.log('Ô nhập số tiền:', am, am.focus === 'ampInput' && am.barBottom <= am.kbTop && am.barBottom > am.kbTop - 40 ? 'OK' : 'LỆCH');
  await p.keyboard.type('300000'); await p.keyboard.press('Enter'); await p.waitForTimeout(500);
  await p.evaluate(() => delete visualViewport.height); await p.waitForTimeout(200);
  // v2: Thêm khoản chi dạng sheet (Figma E2): tab, tên, chọn người ứng tiền, nhập số tiền, ✓ vàng
  await p.click('#fabAdd'); await p.waitForTimeout(150); await p.click('#addExp'); await p.waitForTimeout(300); await shot('3-them-khoan-chi');
  await p.fill('#aName2', 'Nước'); await p.click('[data-apay="-1"]'); await p.fill('[data-aamt="-1"]', '60000'); await p.waitForTimeout(150); await shot('3b-sheet-khoan-chi');
  await p.click('#aOk'); await p.waitForTimeout(500);
  await p.click('#fabAdd'); await p.waitForTimeout(150); await p.click('#addTop'); await p.waitForTimeout(300); await p.click('[data-atab="top"]').catch(() => {}); await p.fill('[data-aamt]', '100000'); await shot('3c-sheet-gop-quy'); await p.click('#aOk'); await p.waitForTimeout(500);
  await p.click('#fabAdd'); await p.waitForTimeout(150); await p.click('#addItem'); await p.waitForTimeout(300); await shot('3d-sheet-them-do'); await p.click('[data-close]'); await p.waitForTimeout(300);
  await p.goto(URL); await p.waitForTimeout(1000);   // mở lại trang gốc (bỏ giả lập bàn phím); dữ liệu vẫn còn trong localStorage, app về đúng tài khoản + nhóm
  await p.waitForTimeout(600); await blur(); await p.waitForTimeout(300);   // tải lại thì app mở thẳng nhóm gần nhất; nhóm tự focus ô tên khoản chi trống, trên màn cảm ứng sẽ ẩn nút Tổng kết
  await shot('4a-trang-chu'); await p.click('.grow'); await p.waitForTimeout(600); await shot('4b-lich-nhom');   // v2: mở lại là danh sách nhóm → chọn nhóm → lịch
  await p.click('[data-ctoday]'); await p.waitForTimeout(400); await shot('4c-lich-hom-nay'); await p.click('#kOpen'); await p.waitForTimeout(400); await shot('4d-kho-do'); await p.click('#kBack'); await p.waitForTimeout(300);
  await p.click('#toSum'); await p.waitForTimeout(1500); await shot('4-tong-ket');
  console.log('Tổng kết:', await p.evaluate(() => [...document.querySelectorAll('.tbl tr')].map(r => [...r.cells].map(c => c.innerText.replace(/\n/g, ' ')).join(' | '))));
  await p.click('#dlImg'); await p.waitForTimeout(4000);
  console.log(errs.length ? 'LỖI JS: ' + errs.join(' | ') : 'Không có lỗi JS', '— ảnh trong', OUT);
  await b.close();
})();
