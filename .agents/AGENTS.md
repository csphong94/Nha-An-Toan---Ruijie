# Hướng dẫn Kiểm tra và Đối chiếu Mã nguồn (Code Verification & Validation Rules)

Quy tắc này bắt buộc Antigravity phải áp dụng quy trình kiểm tra, đối chiếu nhiều bước trước khi hoàn thành bất kỳ chỉnh sửa mã nguồn nào để tránh lỗi cú pháp, lỗi logic hoặc xung đột.

## Quy trình Kiểm tra Bắt buộc (Mandatory Verification Protocol)

1. **Kiểm tra tĩnh (Linting Check):**
   - Sau khi sửa đổi các tệp JS/JSX, phải chạy `npx oxlint` hoặc `npm run lint` để quét các lỗi cú pháp, biến chưa định nghĩa, hoặc import thừa/thiếu.

2. **Kiểm tra Biên dịch (Build Check):**
   - Phải chạy `npm run build` để kiểm tra quá trình đóng gói của Vite. Lỗi biên dịch React sẽ được phát hiện ngay lập tức tại bước này.

3. **Đối chiếu thay đổi (Diff Review):**
   - Luôn sử dụng Git Diff hoặc đọc lại phần code cũ để đối chiếu, đảm bảo không xóa nhầm các comment quan trọng hoặc logic nghiệp vụ hiện có của ứng dụng.

4. **Kiểm tra API Backend:**
   - Nếu thay đổi các API liên quan đến MoMo, Ruijie Cloud hay xác thực, phải chạy các script test có sẵn trong thư mục gốc (`test_momo.mjs`, `test_voucher.mjs`, v.v.) để chắc chắn API vẫn phản hồi đúng định dạng JSON mong muốn.
