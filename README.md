# Coong Nợ

App quản lý quỹ, chạy tại https://quanlyquy.web.app

- Mã nguồn: `public/index.html`
- Mỗi lần đẩy code lên nhánh `main`, GitHub Actions tự deploy lên Firebase Hosting (site `quanlyquy`, project `quanlyquy-f5fce`).
- Muốn deploy lại bằng tay: tab **Actions** → **Deploy lên Firebase Hosting** → **Run workflow**.

## Quy tắc deploy

- Đẩy lên `main` = deploy lên quanlyquy.web.app. **Chỉ đẩy lên `main` khi chủ dự án nói "deploy".**
- Mọi thay đổi làm trên nhánh `dev` (không tự deploy), gửi bản xem thử trước.
