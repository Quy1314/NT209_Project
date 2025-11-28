# Interbank GUI Design

Thiết kế giao diện người dùng cho prototype được phân tách theo đúng kiến trúc đa tầng trong báo cáo tiến độ *Ứng dụng Zero Knowledge Proofs và thuật toán hậu lượng tử vào mạng blockchain liên ngân hàng*. Các lớp (layer) và luồng tương tác được mô tả như sau:

## 1. User App (Frontend GUI)

* **Vai trò**: Ứng dụng di động/web mà khách hàng sử dụng để nhập yêu cầu (chuyển tiền, rút tiền, xem lịch sử, sao kê).  
* **Luồng chính**:
  1. Người dùng A nhập số tiền, tài khoản nhận, ghi chú.  
  2. App ký yêu cầu (hoặc đính kèm chữ ký PQC/KYC khi tích hợp Track A).  
  3. Gửi request tới Bank Node A thông qua API bảo mật (HTTPS/mTLS).  
* **Thành phần UI**:
  - Form “Chuyển tiền”.
  - Form “Rút tiền”.
  - Tab “Lịch sử giao dịch”.
  - Tab “Sao kê” (xuất PDF/CSV).

## 2. Bank Validator (Private Node của ngân hàng A)

* **Vai trò**: Xử lý nghiệp vụ nội bộ và bảo vệ tài sản khách hàng, phù hợp các mục tiêu bảo mật ở Mục 2–4 của báo cáo [[NT219_BaoCaoTienDo-2.pdf](file:///home/quy/project/NT209_Project/NT219_BaoCaoTienDo-2.pdf)].  
* **Luồng**:
  1. Nhận request từ User App → kiểm tra số dư, hạn mức, trạng thái KYC.  
  2. Nếu hợp lệ → tạo transaction EVM, ký (ECDSA/PQC) → gửi lên Interbank Layer.  
  3. Phản hồi “đang xử lý” cho User App kèm mã tham chiếu.

## 3. Interbank Layer (Shared Blockchain – Hyperledger Besu/Quorum)

* **Vai trò**: Mạng consortium (IBFT/QBFT) chạy smart contract liên ngân hàng để ghi nhận giao dịch, bảo đảm toàn vẹn và phi tập trung theo kiến trúc Track C.  
* **Thành phần**:
  - Smart contract quản lý số dư liên ngân hàng, trạng thái giao dịch, sự kiện thông báo.
  - Các validator (SBV, Vietcombank, VietinBank, BIDV) cùng xác thực giao dịch.
* **Luồng**:
  1. Nhận transaction do Bank A ký.  
  2. Validator đồng thuận, ghi giao dịch vào block.  
  3. Phát sự kiện cho các bank liên quan (ví dụ Bank B).

## 4. Bank B Node (Validator/Service của ngân hàng nhận)

* **Vai trò**: Theo dõi các sự kiện liên quan đến khách hàng của mình, cập nhật số dư và thông báo cho User B.  
* **Luồng**:
  1. Lắng nghe event từ smart contract khi giao dịch của Bank B được xác nhận.  
  2. Ghi nhận số dư mới trong core banking, lưu lịch sử.  
  3. Gửi notification về User App B (push/email/SMS).

---

## Chức năng GUI chính

| Chức năng | Mô tả UI | Luồng backend |
|-----------|----------|---------------|
| **Chuyển tiền** | Form nhập người nhận, số tiền, mô tả; hiển thị phí & mã tham chiếu. | Gửi API `POST /transfers`, Bank A validator xử lý → Interbank → Bank B. |
| **Rút tiền** | Form lựa chọn tài khoản nguồn, phương thức nhận (ATM/chi nhánh); OTP xác nhận. | Gửi API `POST /withdrawals`, Bank A cập nhật số dư và ghi record lên blockchain (nếu cần) để đối soát. |
| **Lịch sử giao dịch** | Danh sách filter theo ngày/trạng thái; mỗi item cho phép xem chi tiết. | Gọi API `GET /transactions?from=&to=`, dữ liệu lấy từ Bank A + cross-check với event trên Interbank layer. |
| **Sao kê** | UI chọn khoảng thời gian, định dạng (PDF/CSV), nút tải xuống. | API `GET /statements?period=` tổng hợp dữ liệu đã xác thực, kèm hash/Proof để đảm bảo tính toàn vẹn. |

> *Ghi chú*: Khi tích hợp ZKP/PQC đầy đủ, User App và Bank Validator sẽ đính kèm chữ ký Dilithium và bằng chứng zk-STARK theo mô tả Track A/B trong báo cáo để tăng cường kháng lượng tử và bảo mật quyền riêng tư [[NT219_BaoCaoTienDo-2.pdf](file:///home/quy/project/NT209_Project/NT219_BaoCaoTienDo-2.pdf)].

---

### Mock Navigation Flow

```
Dashboard
 ├─ Chuyển tiền
 │   └─ Xác nhận OTP → trạng thái “Đang xử lý” → thông báo “Hoàn tất”
 ├─ Rút tiền
 │   └─ Chọn phương thức → OTP → hiển thị mã nhận tiền
 ├─ Lịch sử giao dịch
 │   └─ Bộ lọc theo loại (Transfer/Withdraw) + trạng thái
 └─ Sao kê
     └─ Chọn kỳ (tháng/quý) → Tải PDF/CSV
```

Thiết kế này đảm bảo người dùng cuối chỉ thấy 4 entry point rõ ràng trong GUI, trong khi backend vẫn tuân thủ kiến trúc đa lớp của mạng liên ngân hàng mô tả trong báo cáo tiến độ.

