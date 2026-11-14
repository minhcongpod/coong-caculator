# Coong Nợ

App quản lý quỹ, chạy tại https://coongno.web.app

- Mã nguồn: `public/index.html`
- Mỗi lần đẩy code lên nhánh `main`, GitHub Actions tự deploy lên Firebase Hosting (site `coongno`, project `quanlyquy-f5fce`).
- Muốn deploy lại bằng tay: tab **Actions** → **Deploy lên Firebase Hosting** → **Run workflow**.

## Quy tắc deploy

- Đẩy lên `main` = deploy lên coongno.web.app. **Chỉ đẩy lên `main` khi chủ dự án nói "deploy".**
- Mọi thay đổi làm trên nhánh `dev` (không tự deploy), gửi bản xem thử trước.

## Bàn giao

Xem [docs/BAN-GIAO.md](docs/BAN-GIAO.md): hạ tầng, đồng bộ dữ liệu, bản đồ code, quy ước thiết kế và cách chạy thử.
