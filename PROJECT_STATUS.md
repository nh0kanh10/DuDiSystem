# Trạng Thái Dự Án (Project Status)

Tài liệu này ghi nhận tiến độ thực hiện các tính năng trên hệ thống quản lý DuDiSystem.

## Các tính năng đã hoàn thành (Logical Milestones)

### 1. Thay thế Hộp thoại window.confirm mặc định
- Đã phát triển thành phần UI dùng chung [ConfirmModal.tsx](file:///c:/Users/ADMIN/Desktop/DuDiSystem/frontend/app/components/ui/ConfirmModal.tsx).
- Thay thế hoàn toàn hộp thoại `window.confirm` trên toàn bộ 5 module lớn của hệ thống: Chấm công, Duyệt đơn, Quản lý Nhân sự, Dự án, Công việc và Tài khoản.
- Đã chạy thử nghiệm và kiểm tra thành công, đồng bộ hóa phong cách thiết kế với tông màu đỏ thương hiệu `#C62828`.

### 2. Thiết kế Màu sắc thương hiệu & Nút bấm
- Đổi màu mặc định của tiêu đề hộp thoại cảnh báo `AlertDialogTitle` và `DialogTitle` sang màu chữ đỏ đậm thương hiệu.
- Đưa các nút bấm "+ Tạo tài khoản" và "+ Tạo vai trò" lên dải Header đỏ trên cùng để có trải nghiệm giao diện đồng bộ.

### 3. Phân quyền tùy chỉnh riêng cho từng Tài khoản (Custom Account Permissions)
- **Backend**:
  - Cập nhật [user.service.js](file:///c:/Users/ADMIN/Desktop/DuDiSystem/backend/src/services/user.service.js) cho phép thêm và cập nhật trường `permissions` trong cơ sở dữ liệu `users.json`.
  - Cập nhật [auth.service.js](file:///c:/Users/ADMIN/Desktop/DuDiSystem/backend/src/services/auth.service.js) đưa mảng quyền tùy chọn `permissions` vào Payload mã hóa của JWT Token.
- **Frontend**:
  - Cấu trúc [App.tsx](file:///c:/Users/ADMIN/Desktop/DuDiSystem/frontend/app/App.tsx) ưu tiên lấy quyền tùy chỉnh của tài khoản trước khi lấy quyền mặc định của vai trò.
  - Form thêm/sửa tài khoản: Thêm công tắc gạt **"Tùy chỉnh quyền trực tiếp"**, khi bật sẽ hiển thị khung checklist các quyền ở cột bên phải. Tự động nạp trước quyền mặc định của vai trò để làm mốc tùy biến.
  - Tab Phân quyền: Thêm danh sách **"Tài khoản có quyền riêng"** (Custom Accounts). Hỗ trợ nút Radio chọn nhanh, ô chọn **Phòng ban** để lọc và ô nhập tìm kiếm theo **Tên/Email/Mã nhân viên** vô cùng tiện lợi.
  - Cung cấp nút xóa (Thùng rác) bên cạnh mỗi tài khoản có quyền riêng để dễ dàng reset (khôi phục) quyền của tài khoản đó về quyền mặc định theo vai trò gốc.
  - Tự động bảo vệ (Safety Lock): Khóa cứng không cho phép gỡ quyền `phan-quyen` của tất cả các tài khoản Admin (bao gồm cả tài khoản tùy chỉnh).

### 4. Tách biệt Tab Phân quyền & Hỗ trợ phân loại vai trò (Quản lý vs Nhân viên)
- Phân tách ma trận phân quyền thành **2 Tab trực quan**:
  - **Quyền Quản lý / Admin**: Hiển thị các quyền điều hành như Bảng điều khiển, Nhân sự, Chấm công, Duyệt đơn, Báo cáo...
  - **Quyền Nhân viên / Staff**: Hiển thị các quyền truy cập cổng cá nhân như Hồ sơ cá nhân, Đăng ký nghỉ phép, Chat nội bộ...
- Bổ sung công cụ phân loại vai trò khi tạo vai trò mới:
  - **Quản lý / Admin (Management)**: Chọn phạm vi dữ liệu mặc định (Chi nhánh hoặc Toàn công ty).
  - **Nhân viên / Staff (Staff)**: Khóa cứng phạm vi dữ liệu là cá nhân (`self`).
- Tự động chuyển luồng giao diện sang Cổng nhân viên (`UserPortalApp`) cho bất kỳ tài khoản nào được phân loại là Staff (nhờ biến `isStaffRole`).
- Cho phép người dùng tùy chọn lưu chính xác quyền Nhân viên thay vì tự động điền đầy lại như trước.

### 5. Áp dụng Portal cho các thông báo Toast toàn hệ thống
- Toàn bộ các thông báo Toast thành công/thất bại ở các tệp tin quản lý chính ([AccountManagement.tsx](file:///c:/Users/ADMIN/Desktop/DuDiSystem/frontend/app/components/account/AccountManagement.tsx), [TaskManagement.tsx](file:///c:/Users/ADMIN/Desktop/DuDiSystem/frontend/app/components/cong-viec/TaskManagement.tsx), [ApprovalManagement.tsx](file:///c:/Users/ADMIN/Desktop/DuDiSystem/frontend/app/components/duyet-don/ApprovalManagement.tsx), và [IPManagement.tsx](file:///c:/Users/ADMIN/Desktop/DuDiSystem/frontend/app/components/IPManagement.tsx)) đều được bao bọc trong **React Portal (`createPortal`)** gắn vào `document.body`.
- Chỉnh sửa tọa độ đồng bộ về `bottom-6` và đặt độ ưu tiên hiển thị cao nhất `z-[9999]`. Khắc phục triệt để lỗi Toast bị lệch vị trí do hiệu ứng CSS chuyển trang của container cha.

### 6. Đồng bộ Live Real-time Sync & Bảo vệ tài khoản Quản trị viên
- **Live Real-time Sync**: Bổ sung endpoint `/auth/me` ở backend và lắng nghe sự kiện `dudi_permissions_updated` ở frontend giúp đồng bộ hóa lập tức quyền hạn thay đổi của người dùng đăng nhập hiện tại mà không yêu cầu thoát và đăng nhập lại.
- **Vai trò ẩn hệ thống (role-super-admin)**: Tạo vai trò ẩn `role-super-admin` (Quản trị hệ thống cấp cao) cho 3 tài khoản Admin gốc, được cấu hình toàn quyền bằng mã `"all"` và ẩn hoàn toàn khỏi giao diện quản lý vai trò/phân quyền.
- **Bảo vệ tài khoản Quản trị viên gốc**: Khóa cứng, ẩn hoàn toàn 3 tài khoản Admin gốc khỏi bảng quản lý tài khoản chính ở frontend. Chỉ cho phép cấu hình thông qua tiện ích **"Quản lý admin"** chuyên dụng.
- **Tiện ích Quản lý Admin**: Tích hợp hộp thoại cấu hình dành riêng trong phần **"Các tiện ích quản trị khác"** ở trang Tiện ích. Cho phép thay đổi mật khẩu của 3 tài khoản quản trị hệ thống (`0000000000`, `1111111111`, `2222222222`), đồng thời khóa cứng Mã đăng nhập (Mã nhân viên) để đảm bảo tính toàn vẹn dữ liệu.
- **Mã đăng nhập số hóa**: Thiết lập 3 tài khoản quản trị hệ thống generic có mã nhân viên và mã đăng nhập đồng bộ bằng chuỗi số:
  - **Admin 1**: `0000000000` (Quản Trị Viên)
  - **Admin 2**: `1111111111` (Quản Trị Viên 2)
  - **Admin 3**: `2222222222` (Quản Trị Viên 3)

## Kết quả kiểm tra (Verification)
- Toàn bộ source code frontend đã được kiểm thử biên dịch thành công, không phát sinh lỗi kiểu hoặc cú pháp.
