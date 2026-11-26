# Ghi chú cho Claude

- Không push lên `main` (sẽ tự deploy) trừ khi người dùng nói rõ "deploy". Làm việc trên nhánh `dev`.
- Đọc `docs/BAN-GIAO.md` trước khi làm: hạ tầng, cách deploy, bản đồ code, quy ước thiết kế đã chốt.
- Trả lời chủ dự án (POD) bằng tiếng Việt. "deloy" = "deploy".
- App: `public/index.html` (khung trang) + `public/css/app.css` + `public/js/*.js` (theo chức năng, bản đồ ở mục 6 của `docs/BAN-GIAO.md`). Chạy thử bằng `node tools/serve.js` + `node tools/smoke.js`; sửa mà không định đổi hành vi thì so `node tools/regress.js` trước/sau.
