# Coong Nợ — Design system (tham chiếu nhanh)

Mục đích: đọc file này thay vì đọc lại `public/index.html` / Figma. Giá trị lấy từ CSS thực tế (`public/index.html`, khối `<style>` dòng ~27–461, biến ở `:root`). Nếu code đổi, sửa file này cùng lúc. Cập nhật: 19/11/2026.

- Figma gốc: file key `zPMuqeH5Ps1noce052zdpf` (trang chủ final `254-1745`, thêm thành viên `264-1612`, menu trái + tài khoản `318-1303`, khoản chi có dòng chia tiền `262-3105`, form góp quỹ `351-757`, card quỹ `348-1793`, menu + `338-1307`, danh sách chip thu gọn trên máy tính `338-1461`, dòng dùng kho đồ `338-1565`, tạo quỹ chung `262-1921`, trang đặt tên `331-619`).
- Phong cách: nền đen, vàng `#fc0`, font Space Grotesk, khung điện thoại 390px (nội dung rộng 342, lề 24), zoom theo `fitZoom()`.

## 1. Màu

Biến `:root`:

| Biến | Giá trị | Dùng cho |
|---|---|---|
| `--ink` | `#000` | nền trang, chữ trên nền sáng |
| `--paper` | `#fff` | chữ chính, nút trắng, chip chọn |
| `--card` | `#1c1c1c` | nền card, sheet, nút tròn |
| `--chip` | `#2c2c2c` | chip phụ (`.dark`) |
| `--deep` | `#141414` | dòng người trong card, ô lịch |
| `--sheet` | `#1c1c1c` | bottom sheet |
| `--mute` | `rgba(255,255,255,.55)` | chữ phụ |
| `--faint` | `rgba(255,255,255,.3)` | placeholder |
| `--line` | `rgba(255,255,255,.1)` | đường kẻ |
| `--yellow` | `#fc0` | nhấn chính: nút `+`, ngày trên ô lịch, tổng tiền trong bảng, thanh tiến độ quỹ |
| `--green` | `#34c759` | tiền được cộng: **Góp quỹ, Góp thêm, Ứng tiền**, tổng quỹ |
| `--red` | `#ff383c` | tiền bị trừ: **Rút quỹ, khoản chi (tổng)**, số âm; nền nguy hiểm `--red-bg` `rgba(255,56,60,.18)` |
| `--pink` | `#cb30e0` | **Đóng cố định** (đã đổi từ hồng `#ff6eb4` sang tím-hồng `#CB30E0`; tên biến giữ `--pink`) |
| `--cyan` | `#00c0e8` | **Khoản góp ngoài quỹ / tài trợ** |

Quy tắc màu theo ý nghĩa: xanh lá = nhận/cộng, đỏ = chi/trừ, `#CB30E0` = đóng cố định, xanh dương = tài trợ, vàng = nhấn/hành động. Số 0 mặc định trong ô tiền sáng theo màu loại để gợi bấm.

Màu khác hay gặp: nút xám khoá `#3a3a3a`/chữ `#8a8a8a`; chip khoá `#232323`/`#5c5c5c`; dòng "Chung cuộc" bảng `#2e2e2e`; nền nút xoá `#3d0f10`; menu `+` `#3e3e3e`; placeholder đậm hơn `#484848`; tay nắm sheet `#555`; lớp phủ sheet `rgba(0,0,0,.55)`, hộp thoại `.8`, dim `.72`.

Avatar (`AV_COL`, 6 màu, chọn trong form): `#FF453A #FF9F0A #FFD60A #30D158 #0A84FF #BF5AF2`. Avatar kiểu `ic:<icon>:<màu>`: nền = màu pha 22% với `--card`, icon = màu đó (`.av.ic`). 12 icon con vật Phosphor (MIT) nhúng sẵn.

## 2. Chữ

Font `'Space Grotesk'` 400/500/600/700, fallback `ui-sans-serif, system-ui`. Số dùng `font-variant-numeric: tabular-nums`. Gần như mọi chữ đậm là **700**.

| Dùng cho | Cỡ / cao dòng / đậm |
|---|---|
| Thân trang | 16 / 1.35 |
| Tên nhóm / tiêu đề Tổng kết (`.ghead h1`, `.shead h1`) | 20–24 / 26 / 700 |
| Tên khoản chi (`.ename`) | 19 / 36 / 700 |
| Tiêu đề card quỹ (`.fund .top small`) | 18 / 23 / 700 |
| Tổng quỹ (`.fund .top b`, `.ftot b`) | 24 / 31 / 700, xanh |
| Số tiền trong dòng người (`.flow input`) | 22 / 700 |
| Số tiền dòng góp (`.frow input`) | 18 / 20 / 700 (chưa nhập: 16, 500, trắng 30%) |
| Tên người trong dòng (`.flow .who b`) | 15 / 18 / 700 |
| Vai trò (Ứng tiền…) `.role` | 14 / 18 / 400 |
| Chip | 15 / 700 (form 16) |
| Nút `.btn` | 17 / 700 |
| Dòng phụ card quỹ (`.fund .fl`) | 14 / 18 / 500 xám |
| Ghi chú, nhãn `.lbl` | 13–14 / 18 / 500, xám |
| Ô nhập tên (`.oname`) | 24 / 31 / 700 |
| Tiêu đề sheet `h3` | 24 / 700 (hộp thoại 20 / 28) |
| Bảng tổng kết `.tbl` | 14 / 20 / 700 (cột tên 15; chú thích 12 / 16) |

## 3. Khoảng cách và bo góc

- Khung nội dung `.app`: rộng tối đa **342px**, lề ngang **24px**, trên 32px, dưới 120px. `.view` gap **16px**; `.stack`/`.fstack`/`.lgs` gap **12px**.
- Trong card: padding **16px** (card khoản chi, card quỹ chung `16px 24px`, form `.mcard` 12px); gap giữa khối **12–16px**; dòng người trong card gap **4px 12px**; dòng liền kề cách `8px` (margin −8px).
- Bo góc: **card 32px**; dòng người `.flow` 24px; ô nhập `.mline` 24px; ô lịch 10px; chip / nút / avatar tròn **100px / 50%**; hộp `.note` 28px; sheet 32px trên; thanh kéo 44×5.
- Đường kẻ: 1px `--line`; dòng danh sách `rgba(255,255,255,.06)`; trên tổng `2px rgba(255,255,255,.1)`.
- Bóng: chỉ ô nhập nổi `0 -8px 40px rgba(0,0,0,.6)` và minh hoạ chào. Còn lại phẳng.

## 4. Kích thước thành phần

| Thành phần | Kích thước |
|---|---|
| Nút `.btn` | cao **52**, bo 40, trắng chữ đen; `.yel` vàng; `.quiet` `#333`; `.danger` nền đỏ nhạt |
| Nút tròn (`.back`, `.circ`, `.yadd`, `.pill2 button`) | **52×52** |
| Nút `+` nổi `.fab` | **52** tròn vàng, icon 32 |
| Thanh dưới `.bar` | cố định đáy, gap 16, đệm trên 40 có gradient đen |
| Chip | cao **40**, đệm ngang 16, gap 8; chip trong card khoản chi **28**; chip trong card góp thêm 28 |
| Chip chọn | nền trắng, chữ đen (`.sel`) |
| Avatar `.av` | **50** (lớn 80, nhỏ `.sm` 32, chip `.cav` 28, dòng góp `.rav` 28, menu `.dme` 50) |
| Icon thường | 20–24 (nút), 18–20 (mũi tên thu gọn), 32 (fab) |
| Ô lịch `.cal` | **36×36**, bo 10, nền `--deep`, số 15/700 + tháng 10/700 vàng |
| Dòng người `.flow` | cao tối thiểu **56**, nền `--deep`, bo 24, đệm `10 16` |
| Dòng góp `.frow` | cao **52**, đệm dọc 12, kẻ trên 1px |
| Dòng kho đồ `.krow` | cao **52**, bo 24; `.flow.krow` 48 |
| Nút +/− `.stb` | **32** tròn, nền trắng 10% |
| Menu `+` (`.fabmenu`) | nền `#3e3e3e`, bo 32, đệm 8, dòng cao 52, icon 24 (Kho đồ 28), cách icon–chữ 12 |
| Ô nhập `.mline` / `.amtbox` | cao **52** / **56**, nền `rgba(0,0,0,.3)` |
| Lựa chọn `.opt` | cao tối thiểu 62, bo 32; đang chọn nền trắng |
| Ô cột bảng `.tbl` | cột tên **108**, cột người **72**, đệm `12 4` |
| Thanh tiến độ `.fbar` | cao 6, bo 6, vàng |
| Toast | trắng chữ đen, bo 100, cách đáy 100 |
| Logo `.wm` | 152×30.4 (header), 115×23 (Tổng kết) |

## 5. Component (class chính, hàm tạo)

- **Card khoản chi** — `<article class="exp" data-exp>`, `expCard(e)`. Đầu: ô lịch + tên + nút thu gọn (`.fold`) / tổng đỏ khi thu gọn (`.ftot2`). Thân: nhãn "Chọn người ứng tiền", chip người (`.scroll` ngang) với chip **Rút quỹ** luôn đầu (`FUND = -1`), rồi các `.flow` (`.fundw` Rút quỹ: đỏ; `.fixed` Đóng cố định: `--pink`; `.donate`: cyan; mặc định Ứng tiền: xanh), cuối `.calc` (dòng "Mỗi người …", cảnh báo vàng). Giữ lâu → Xoá / Xuất ảnh.
- **Card Quỹ chung** — `.fund`, `fundCard(r)`. Tiêu đề 18 + tổng 24 xanh + mũi tên; thu/mở; `.fls` dòng Góp quỹ / Góp thêm / Đã chi (14 xám, số xanh `.pos` / đỏ `.neg`); thanh `.fbar`. Quỹ âm: `.neg` đỏ.
- **Card Góp thêm quỹ** — `.exp.tcard` (`data-top`), `topCard(a)`. Chip người góp (28) + `.tfl` danh sách `.flow.topf` (cao 52, số xanh 18). Thu gọn: tổng xanh 19. Giữ lâu → Xoá (`data-deltop`) / Xuất ảnh (`Gop-them-quy.png`).
- **Card Kho đồ** — `.exp.kcard`, `.krow`, `.step` (nút +/−), số tiền `#itCost` đỏ.
- **Form tạo/sửa nhóm** — `.mcard` (thành viên, nền card, bo 32, đệm 12), `.fcard` (Góp quỹ chung, mở/thu, `.frow` + `.ftot`), `.emogrid` 6 cột icon, `.swrow` 6 màu (`.sw` 36).
- **Chip** — `.chip` (`.sel` trắng, `.dark` `#2c2c2c`, `.off` khoá, `.lk` có avatar, `.fixm` không ✕), gợi ý `@` `.athint`.
- **Bảng tổng kết** — `.tblw > .tbl` (card cuộn ngang, cột đầu dính `position:sticky`). Hàng `.sum` kẻ trên 25%, hàng `.fin` "Chung cuộc" nền `#2e2e2e`. Màu ô: `.c-g` xanh, `.c-r` đỏ, `.c-p` `#cb30e0`, `.c-m` mờ. Dấu **+** cho góp quỹ / nhận ngoài quỹ / ứng tiền; **−** cho phần chịu, đóng cố định, tài trợ. Tiêu đề `.shead` dính trên cùng. Card "Ai chuyển cho ai?" `.txcard` / `.tx` (số tiền vàng, xong → xanh).
- **Ô lịch** — `.cal` (xem kích thước ở bảng 4; `<input type=date>` trong suốt phủ lên).
- **Sheet** — `.sheet > .sp` (bottom, bo 32 trên, đệm `36 24 24`, tối đa 90% cao): chọn vai trò (`.ropts .opt`), chọn ảnh/màu. **Hộp thoại** `.dlg > .dbox` (bo 32, nút cạnh nhau, gap 8). **Ô nhập nổi** `#cmp` / `#amp` (bám bàn phím qua `--kb`).
- **Menu trái** `.drw` (rộng 300, trượt, nền đen, mục `.ditem` cao 32, `.av.sm`) và **Lịch sử hoạt động** (`.lgcard`, `.lg` dòng thời gian, `.lgb` icon tròn 40 pha màu `--c` 18%).
- **Thanh dưới** `.bar` + `.fab` + `.btn` (Tổng kết).

Icon (symbol SVG trong file, dùng `<use href="#i-…">`): `logo, minus, plus, x, back, lock, pen, check, people, menu, user, up, arrow, history, receipt, money, coin, walletf, box, wallet, swap, trash, chev, img, share, copy, sep`.

## 6. Hiệu ứng

Easing `--ease: cubic-bezier(.22,1,.36,1)`. Nhấn nút `scale(.95–.97)`, card nhấn giữ `scale(.98)`. Sheet trượt lên, dim fade 0.18–0.25s, ô nhập nổi 0.32s, hiệu ứng vào trang `animIn` (từ trên xuống, phần tử mới "nảy"). Tôn trọng `prefers-reduced-motion` (tắt hết).

## 7. Quy ước đặt tên

- CSS: class ngắn viết thường, mô tả vai trò (`exp`, `fund`, `flow`, `frow`, `tcard`, `krow`, `tbl`, `lgcard`). Biến thể bằng class thứ hai (`.flow.fixed`, `.flow.fundw`, `.chip.sel`). Trạng thái: `.open`, `.on`, `.sel`, `.neg`, `.off`, `.press`, `.lift`. Màu theo nghĩa: `.pos` xanh, `.neg` đỏ, `.c-g/.c-r/.c-p/.c-m` trong bảng.
- Dữ liệu gắn vào DOM bằng `data-*` (`data-exp`, `data-top`, `data-kho`, `data-fundopen`, `data-foldtop`, `data-deltop`, `data-avcol`, `data-pickrole`). Id nút: `#addExp`, `#addItem`, `#fabMenu`, `#toSum`, `#saveGroup`, `#cmp`, `#amp`.
- Hàm dựng giao diện: `xxxView()` cho màn hình (`groupView`, `sumView`, `formView`, `acctView`, `onbView`), `xxxCard()` cho card (`expCard`, `topCard`, `fundCard`).
- Icon: id `i-<tên>`. Avatar: `ic:<icon>:<màu>`.
- Chữ hiển thị: tiếng Việt, tiền kiểu `112.500` (dấu chấm), làm tròn số dư cuối 1.000đ.
- Quyết định đã chốt (đừng đổi): xem mục 7 của `docs/BAN-GIAO.md`. Lưu ý mục đó còn ghi "đóng cố định = đỏ"; **bản code hiện tại dùng `#CB30E0` cho Đóng cố định**, đỏ chỉ cho Rút quỹ / chi / số âm.
