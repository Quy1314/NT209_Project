# Interbank GUI - Hệ thống Liên ngân hàng

Giao diện web quản lý giao dịch liên ngân hàng trên blockchain Hyperledger Besu.

## Tính năng

### 1. Dashboard
- Hiển thị số dư tài khoản
- Thống kê giao dịch
- Lịch sử giao dịch gần đây

### 2. Chuyển tiền
- Chuyển tiền liên ngân hàng
- Xác nhận OTP
- Theo dõi trạng thái giao dịch

### 3. Rút tiền
- Rút tiền tại ATM hoặc chi nhánh
- Xác nhận OTP
- Mã nhận tiền

### 4. Lịch sử giao dịch
- Xem tất cả giao dịch
- Lọc theo loại, trạng thái, ngày
- Tìm kiếm giao dịch

### 5. Sao kê
- Xuất sao kê theo tháng/quý/tùy chọn
- Tải xuống PDF hoặc CSV
- Tổng hợp số liệu

## Ngân hàng hỗ trợ

- **Vietcombank** (VCB)
- **VietinBank** (VTB)
- **BIDV**

Mỗi ngân hàng có 2 tài khoản người dùng để test.

## Cài đặt và chạy

### Yêu cầu
- Node.js 18+
- npm hoặc yarn
- Blockchain network đang chạy tại `http://localhost:8545`

### Cài đặt dependencies

```bash
npm install
```

### Chạy development server

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) trong trình duyệt.

### Build production

```bash
npm run build
npm start
```

## Cấu trúc project

```
web/
├── app/                          # Next.js App Router
│   ├── bank/[bankCode]/         # Routes cho từng ngân hàng
│   │   ├── dashboard/           # Dashboard
│   │   ├── transfer/            # Chuyển tiền
│   │   ├── withdraw/            # Rút tiền
│   │   ├── history/             # Lịch sử
│   │   └── statement/           # Sao kê
│   └── layout.tsx               # Root layout
├── components/                   # React components
│   ├── layout/                  # Header, Sidebar
│   └── UserSelector.tsx         # User selector
├── config/                      # Configuration
│   ├── banks.ts                 # Bank và user config
│   └── blockchain.ts            # Blockchain RPC config
├── lib/                         # Utilities
│   ├── blockchain.ts            # Blockchain functions
│   └── storage.ts               # LocalStorage utilities
└── types/                       # TypeScript types
    └── transaction.ts           # Transaction types
```

## Kết nối Blockchain

GUI kết nối với Hyperledger Besu qua RPC endpoint:
- **HTTP RPC**: `http://localhost:8545`
- **WebSocket RPC**: `ws://localhost:8546`
- **Chain ID**: 1337

Đảm bảo blockchain network đang chạy trước khi sử dụng GUI.

## User Accounts

Mỗi ngân hàng có 2 tài khoản test (mỗi tài khoản có 100,000 ETH trong genesis):

### Vietcombank
- `vietcombank_user1`: `0x422b10ce2c930d45814992742e36383684946b14`
- `vietcombank_user2`: `0xe8023765dbfad4f5b39e4d958e7f77c841c92070`

### VietinBank
- `vietinbank_user1`: `0xf9a6995806e630b216f65ba5577088c9032a8051`
- `vietinbank_user2`: `0xffe77b3af2e19001b08c1a5b2d6f81af8b3081fd`

### BIDV
- `bidv_user1`: `0x9ce2b1c73dfe760d7413f5034709133d14bde60a`
- `bidv_user2`: `0xfe4c08e2839b216d82635d9b4e5bb14d0b7cbd33`

## Lưu ý

- Đây là ứng dụng demo cho môi trường test
- Private keys được lưu trong code chỉ để test
- Trong production, cần tích hợp ví an toàn và backend API
- OTP là mock - trong production cần tích hợp SMS/Email service

## Tech Stack

- **Next.js 14+** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Ethers.js** - Blockchain interaction
- **date-fns** - Date formatting
- **lucide-react** - Icons
