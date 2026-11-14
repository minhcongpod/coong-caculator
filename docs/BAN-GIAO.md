# Coong Nợ — Tài liệu bàn giao

Cập nhật: 14/11/2026. Viết để một tài khoản Claude mới (hoặc người mới) mở repo này là làm tiếp được ngay, không cần hỏi lại.

## 1. App là gì

**Coong Nợ** là app chia tiền nhóm (đi chơi, cầu lông, nhậu…), chạy trên web: **https://coongno.web.app**.
Người dùng tạo nhóm, thêm thành viên, (tuỳ chọn) bật quỹ chung, ghi các khoản chi, rồi xem trang **Tổng kết**: ai còn dư, ai thiếu, ai chuyển cho ai, xuất ảnh để gửi vào nhóm chat.

- Chủ dự án: **POD** (GitHub `minhcongpod`). Trao đổi bằng **tiếng Việt**.
- POD hay viết "deloy" = "deploy".

## 2. Quy tắc làm việc (bắt buộc)

1. **Chỉ làm trên nhánh `dev`.** Đẩy lên `main` là tự deploy lên coongno.web.app.
2. **Chỉ đẩy lên `main` khi POD nói rõ "deploy"/"deloy"** cho đúng lần đó. Đồng ý lần trước không dùng cho thay đổi sau.
3. Cách deploy (giữ lịch sử `main` gọn, nội dung y hệt `dev`):
   ```sh
   git fetch -q origin main dev && git diff --quiet HEAD origin/dev && \
   c=$(git commit-tree origin/dev^{tree} -p origin/main -m "Deploy: <tóm tắt>") && \
   git push -q origin $c:refs/heads/main
   gh run list --branch main -L 1     # rồi gh run watch <id> để chờ xong
   ```
4. Thiết kế: **nền đen, vàng `#fc0`, font Space Grotesk**, làm **đúng Figma** (xem mục 7).
5. Trước khi báo xong: chạy thử bằng `tools/smoke.js` (mục 8) và xem ảnh chụp.

## 3. Cấu trúc repo

| Đường dẫn | Nội dung |
|---|---|
| `public/index.html` | **Toàn bộ app** (HTML + CSS + JS trong một file, ~1250 dòng, không build). |
| `public/manifest.webmanifest`, `icon-*.png`, `favicon*`, `icon.svg` | Icon và manifest (link có `?v=4` để phá cache; đổi icon thì tăng số). |
| `firebase.json` | Hosting, site `coongno`, mọi đường dẫn rewrite về `index.html`, HTML không cache. |
| `firestore.rules` | Luật Firestore (bản đang chạy đã được dán tay trên Firebase console). |
| `.github/workflows/deploy.yml` | Đẩy lên `main` → deploy coongno.web.app. |
| `.github/workflows/preview.yml` | Đẩy lên `dev` → link test riêng (kênh preview `dev`, hết hạn 30 ngày). |
| `tools/serve.js`, `tools/smoke.js` | Chạy thử trên máy (mục 8). |
| `docs/BAN-GIAO.md` | File này. |

## 4. Hạ tầng

- **Firebase project:** `quanlyquy-f5fce` (tên hiển thị trên console có thể là "coongno"). Gói **Spark (miễn phí)** — đừng bấm Upgrade.
- **Hosting site:** `coongno` → https://coongno.web.app. Link test nhánh dev: https://coongno--dev-78z2ehyb.web.app (có thể đổi mỗi lần tạo lại kênh).
  POD định xoá site cũ `quanlyquy` (quanlyquy.web.app); app không còn chuyển hướng từ đó.
- **GitHub Actions** dùng secret `FIREBASE_SERVICE_ACCOUNT` (JSON khoá service account) trong repo.
- **Firestore:** database `(default)`, vùng `asia-southeast1`, **mới bật ngày 14/11/2026** — trước đó lưu online chưa từng chạy, mỗi máy chỉ có dữ liệu riêng. Rules hiện tại = `firestore.rules`.
- **API key web** nằm thẳng trong `index.html` (`FS_KEY`) — bình thường với Firebase web, an toàn nhờ rules.
- Thư viện ngoài: Google Fonts (Space Grotesk), `html2canvas@1.4.1` từ cdnjs (xuất ảnh).

## 5. Dữ liệu và đồng bộ

- Lưu ở `localStorage` key `coong_calc_v4` (hoặc `coong_calc_v4_<slug>`), dạng `{ groups: [...], updatedAt }`.
- Mỗi "sổ" có mã 20–40 ký tự `[A-Za-z0-9]`, lưu ở `localStorage.coong_book`, hiện trên URL dạng `/s/<mã>`.
- Đồng bộ qua **Firestore REST**: `books/<mã>` có 2 trường `data` (JSON chuỗi `{v:4, root}`) và `updatedAt`.
  Mở app / quay lại app thì `syncNow()`: bản nào có `updatedAt` mới hơn thắng (tải về hoặc đẩy lên).
- **Đường dẫn bất kỳ `/ten-gi-do`** = một quỹ riêng, dữ liệu mới hoàn toàn, mở ra là trang xin chào. Mã sổ suy ra từ slug (`slugCode`), nên ai mở cùng link là cùng sổ.
- iPhone: app "Thêm vào màn hình chính" có bộ nhớ riêng, tách khỏi Safari → chỉ khớp nhau nhờ Firestore.
- App tự kiểm tra bản mới khi quay lại (`checkUpdate`) và tải lại trang nếu `index.html` đổi.

## 6. Bản đồ code trong `public/index.html`

- **Đầu file:** meta/icon, CSS (biến màu ở `:root`), symbol SVG icon (`i-logo`, `i-up`, `i-img`…).
- **Zoom theo khung 390px** giống app Coong cafe: `fitZoom()` — điện thoại `zoom = rộng/390`, máy tính `min(rộng/390, cao/700)`; `--vh` = chiều cao thật đã chia zoom.
- **Đồng bộ:** `SLUG`, `slugCode`, `setBook`, `push`, `pull`, `syncNow`, `checkUpdate`.
- **Tính tiền:** `settleExp(g, e)` (từng khoản: người ứng, đóng cố định, tài trợ, phần chia đều) và `settle(g)` (tổng: số dư từng người, quỹ chung, danh sách chuyển khoản). Vai trò: `ROLE = { pay: Ứng tiền, donate: Tài trợ, fixed: Đóng cố định }`, quỹ chung có id `FUND = -1`.
- **Màn hình:** `homeView` (trang chủ / xin chào, `fitWelcome` để không phải cuộn), `formView` (tạo/sửa nhóm, quỹ chung, khoản góp ngoài quỹ), `groupView` + `expCard` (khoản chi), `sumView` (tổng kết; người có cùng các dòng được gộp một dòng), `roleSheet` (chọn vai trò + ghi chú).
- **Điều hướng/hiệu ứng:** `go(view)` → `render()`; `animIn` = hiệu ứng vào trang lần lượt từ trên xuống và "nảy" phần tử mới thêm (thông số như Coong cafe). Vuốt phải để quay lại.
- **Bàn phím:** `kbPlace` — khi nhập tên khoản chi, cuộn để card (và nút Thêm khoản chi) nằm ngay trên bàn phím.
- **Xuất ảnh:** `screenshot()` dùng html2canvas; trong `onclone` bỏ zoom, cố định chiều rộng theo app, vẽ lại icon SVG.

## 7. Thiết kế

- Figma: file key `zPMuqeH5Ps1noce052zdpf` (trang chủ final node `254-1745`, card thêm thành viên `264-1612`).
- Màu: nền `#000`, card `#1c1c1c`, chip `#2c2c2c`, vàng `#fc0`, xanh lá `#34c759`, đỏ `#ff383c`, xanh dương `#00c0e8` (tài trợ), hồng `#ff2d92` (đóng cố định).
- Quy ước đã chốt với POD (đừng đổi lại):
  - Số 0 mặc định trong ô tiền: **sáng màu** (vàng / xanh / hồng) để người dùng biết bấm vào.
  - Tổng kết: dấu **+** cho góp quỹ, nhận từ khoản góp ngoài quỹ, ứng tiền; **−** cho phần phải chịu, đóng cố định, tài trợ. Mũi tên bên trái; mở sẵn người đầu và khoản chi đầu; mô tả cách nhau 4px.
  - "Nhà tài trợ" đã đổi thành **"Khoản góp ngoài quỹ"**; dòng từng người ghi "Nhận từ khoản góp ngoài quỹ".
  - Không có khoản chi thì bấm Tổng kết chỉ hiện snackbar "Chưa có khoản chi nào".
  - Kích thước giống app Coong cafe (repo `minhcongpod/coong`).

## 8. Chạy thử

```sh
npm i -D playwright && npx playwright install chromium   # một lần
node tools/serve.js &                                     # http://localhost:8123
node tools/smoke.js 375                                   # 375 = iPhone 13 mini; thử thêm 390, 430
```
Script đi hết luồng: xin chào → tạo nhóm có quỹ → thêm khoản chi (giả lập bàn phím, kiểm tra nút nằm trên bàn phím) → tổng kết → xuất ảnh. Ảnh ở `tools/out/`. Muốn đúng font khi không có mạng: giải nén gói npm `@fontsource/space-grotesk@5.0.18` vào `tools/.fonts/`.
Firestore bị chặn trong lúc test nên không ghi dữ liệu thật.

Lưu ý khi viết test: màn cảm ứng đang focus ô nhập thì nút dưới cùng bị ẩn (`body.kb`), nên `blur()` trước khi bấm `#toSum`/`#saveGroup`.

## 9. Việc còn mở

- POD cần xoá site `quanlyquy` trên Firebase Hosting (nếu chưa) và thêm lại app ra màn hình chính iPhone từ coongno.web.app.
- Kiểm tra trên iPhone thật: nút Thêm khoản chi nằm trên bàn phím (bản 14/11 tối).
- Câu hỏi cũ chưa chốt: tên tiêu đề hai card, và có thêm mật khẩu sửa sổ hay không.

## 10. Chuyển sang tài khoản Claude khác

1. Trên tài khoản mới, kết nối **cùng tài khoản GitHub `minhcongpod`** (hoặc mời tài khoản GitHub mới làm collaborator của repo `minhcongpod/coong-caculator`).
2. Tạo project mới, gắn repo này, dán vào hướng dẫn project: *"Đọc `docs/BAN-GIAO.md` và `CLAUDE.md` trước khi làm."*
3. Firebase và GitHub Actions không phụ thuộc tài khoản Claude, nên không cần đổi gì. Chỉ cần tài khoản Google sở hữu project `quanlyquy-f5fce` nếu muốn vào console.
4. File `coong-no-ban-giao.zip` (nếu có) là bản sao toàn bộ repo tại thời điểm bàn giao, dùng để dự phòng.
