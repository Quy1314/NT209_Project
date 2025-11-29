# 🚀 Runbook - Hướng dẫn chạy hệ thống từ đầu

Runbook này hướng dẫn chi tiết cách khởi động hệ thống từ đầu: từ blockchain, deploy contract, đến chạy web dev.

## 📋 Mục lục

1. [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
2. [Bước 1: Khởi động Blockchain](#bước-1-khởi-động-blockchain)
3. [Bước 2: Kiểm tra Blockchain](#bước-2-kiểm-tra-blockchain)
4. [Bước 3: Deploy Smart Contract](#bước-3-deploy-smart-contract)
5. [Bước 4: Khởi động Web GUI](#bước-4-khởi-động-web-gui)
6. [Troubleshooting](#troubleshooting)
7. [Quick Start (Tóm tắt nhanh)](#quick-start-tóm-tắt-nhanh)

---

## Yêu cầu hệ thống

### Phần mềm cần thiết:
- **Docker** và **Docker Compose** (để chạy blockchain network)
- **Node.js 18+** (để chạy scripts và web GUI)
- **npm** hoặc **yarn** (package manager)

### Kiểm tra:
```bash
docker --version          # Docker 20.10+
docker-compose --version  # Docker Compose 2.0+
node --version            # Node.js 18.0+
npm --version             # npm 8.0+
```

---

## Bước 1: Khởi động Blockchain

### 1.1. Di chuyển đến thư mục blockchain

```bash
cd Besu-hyperledger
```

### 1.2. Khởi động blockchain network

Chạy script `run.sh` để khởi động tất cả các containers:

```bash
./run.sh
```

**Script này sẽ:**
- Tạo các thư mục logs cần thiết
- Build và chạy tất cả Docker containers (Besu nodes, RPC node, monitoring tools)
- Hiển thị danh sách services và endpoints

**Thời gian chờ:** Khoảng 1-2 phút để tất cả containers khởi động.

### 1.3. Kiểm tra containers đang chạy

```bash
docker ps
```

Bạn sẽ thấy các containers:
- `besu-hyperledger-sbv-1` - SBV node (port 21001)
- `besu-hyperledger-vietcombank-1` - Vietcombank node (port 21002)
- `besu-hyperledger-vietinbank-1` - Vietinbank node (port 21003)
- `besu-hyperledger-bidv-1` - BIDV node (port 21004)
- `besu-hyperledger-member1besu-1`, `member2besu-1`, `member3besu-1` - Member nodes
- `besu-hyperledger-prometheus-1` - Prometheus monitoring
- `besu-hyperledger-grafana-1` - Grafana dashboard (port 3001)

---

## Bước 2: Kiểm tra Blockchain

### 2.1. Kiểm tra blockchain đã sẵn sàng

Kiểm tra RPC endpoint có phản hồi không:

```bash
curl -X POST http://localhost:21001 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

**Kết quả mong đợi:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x..."
}
```

Nếu nhận được response, blockchain đã sẵn sàng! ✅

### 2.2. Kiểm tra block số hiện tại

```bash
curl -X POST http://localhost:21001 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  | python3 -c "import sys, json; print('Block number:', int(json.load(sys.stdin)['result'], 16))"
```

### 2.3. Kiểm tra consensus đang hoạt động

Kiểm tra validators:

```bash
curl -X POST http://localhost:21001 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"qbft_getValidatorsByBlockNumber","params":["latest"],"id":1}' \
  | python3 -m json.tool
```

Bạn sẽ thấy danh sách 4 validators.

---

## Bước 3: Deploy Smart Contract

### 3.1. Di chuyển đến thư mục smart contracts

```bash
cd smart_contracts
```

### 3.2. Cài đặt dependencies (nếu chưa có)

```bash
npm install
```

### 3.3. Compile Smart Contract

```bash
node scripts/public/compile.js
```

Hoặc nếu có Hardhat:

```bash
npx hardhat compile
```

### 3.4. Deploy và Initialize Contract

Có 2 cách:

#### Cách 1: Sử dụng script tự động (Khuyên dùng)

Script này sẽ deploy contract và init số dư cho tất cả users:

```bash
node scripts/public/deploy_and_init.js
```

**Script này sẽ:**
1. Deploy `InterbankTransfer` contract lên blockchain
2. Authorize tất cả bank addresses
3. Deposit 100 ETH cho mỗi user vào contract
4. Tự động cập nhật contract address trong GUI config

**Kết quả mong đợi:**
```
🚀 Bắt đầu deploy contract và khởi tạo...

============================================================
BƯỚC 1: DEPLOY CONTRACT
============================================================
✅ Contract deployed at: 0x...

============================================================
BƯỚC 2: KHỞI TẠO CONTRACT (Authorize + Deposit)
============================================================
✅ Depositing 100.0 ETH to 0x... (vietcombank)
✅ Depositing 100.0 ETH to 0x... (vietinbank)
...

============================================================
BƯỚC 3: CẬP NHẬT GUI CONFIG
============================================================
✅ GUI Config đã được cập nhật

✅ HOÀN TẤT! Contract đã được deploy và khởi tạo thành công!
```

#### Cách 2: Deploy và Init riêng biệt

Nếu muốn deploy và init riêng:

```bash
# Deploy contract
node scripts/public/deploy_interbank.js

# Ghi lại contract address, sau đó:
# Export contract address
export CONTRACT_ADDRESS=0x...

# Initialize contract (authorize + deposit)
node scripts/public/init_contract.js

# Hoặc deposit cho user cụ thể
node scripts/public/deposit_user.js
```

### 3.5. Kiểm tra contract đã deploy

Kiểm tra contract address trong GUI config:

```bash
cat ../../GUI/web/config/contracts.ts | grep INTERBANK_TRANSFER_ADDRESS
```

Hoặc kiểm tra trực tiếp trên blockchain:

```bash
# Thay CONTRACT_ADDRESS bằng address thực tế
curl -X POST http://localhost:21001 \
  -H "Content-Type: application/json" \
  --data '{
    "jsonrpc":"2.0",
    "method":"eth_getCode",
    "params":["CONTRACT_ADDRESS", "latest"],
    "id":1
  }'
```

Nếu có code (không phải "0x"), contract đã được deploy! ✅

---

## Bước 4: Khởi động Web GUI

### 4.1. Di chuyển đến thư mục GUI

```bash
cd ../../GUI/web
```

Hoặc từ project root:

```bash
cd GUI/web
```

### 4.2. Cài đặt dependencies (nếu chưa có)

```bash
npm install
```

### 4.3. Kiểm tra cấu hình

Đảm bảo RPC endpoint đúng trong `config/blockchain.ts`:

```typescript
export const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'http://localhost:21001';
```

Đảm bảo contract address đúng trong `config/contracts.ts`:

```typescript
export const INTERBANK_TRANSFER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x...';
```

### 4.4. Chạy development server

```bash
npm run dev
```

**Kết quả mong đợi:**
```
   ▲ Next.js 16.0.5
   - Local:        http://localhost:3000
   - Network:      http://192.168.x.x:3000

 ✓ Ready in X.Xs
```

### 4.5. Mở trình duyệt

Truy cập: **http://localhost:3000**

Bạn sẽ thấy:
- Dashboard với số dư tài khoản
- Menu điều hướng: Dashboard, Chuyển tiền, Rút tiền, Lịch sử, Sao kê

### 4.6. Chọn ngân hàng và user

1. Chọn ngân hàng từ dropdown (Vietcombank, Vietinbank, BIDV)
2. Chọn user (User 1 hoặc User 2)
3. Kiểm tra số dư hiển thị đúng (100,000,000 VND = 100 ETH)

---

## Troubleshooting

### ❌ Blockchain không khởi động

**Lỗi:** `docker-compose up` fails

**Giải pháp:**
```bash
# Kiểm tra ports có bị chiếm không
netstat -tuln | grep -E '21001|21002|21003|21004'

# Dừng và xóa containers cũ
cd Besu-hyperledger
docker-compose down -v

# Xóa images cũ (nếu cần)
docker-compose down --rmi all

# Chạy lại
./run.sh
```

### ❌ RPC endpoint không phản hồi

**Lỗi:** `curl: (7) Failed to connect to localhost:21001`

**Giải pháp:**
```bash
# Kiểm tra container có đang chạy không
docker ps | grep sbv

# Xem logs của container
docker logs besu-hyperledger-sbv-1

# Đợi thêm vài phút để blockchain khởi động hoàn toàn
sleep 60
curl -X POST http://localhost:21001 ...
```

### ❌ Contract deploy thất bại

**Lỗi:** `transaction execution reverted` hoặc `insufficient funds`

**Giải pháp:**
```bash
# Kiểm tra blockchain đã sẵn sàng
curl -X POST http://localhost:21001 ... | grep result

# Kiểm tra account có ETH không (trong genesis)
# Nếu không, cần thêm vào genesis.json

# Deploy lại với gas limit cao hơn
# Sửa gasLimit trong deploy_interbank.js: 15000000
```

### ❌ Web GUI không kết nối được blockchain

**Lỗi:** Balance = 0 hoặc "Network error"

**Giải pháp:**
1. Kiểm tra RPC endpoint trong `config/blockchain.ts`
2. Kiểm tra contract address trong `config/contracts.ts`
3. Kiểm tra CORS (nếu có)
4. Xem console log trong browser (F12)

### ❌ Mock Mode đang bật

**Triệu chứng:** Transactions không thực sự lên blockchain

**Giải pháp:**
Kiểm tra và tắt Mock Mode trong `config/blockchain.ts`:

```typescript
export const MOCK_MODE = false; // Đổi từ true thành false
```

Sau đó restart web dev server.

---

## Quick Start (Tóm tắt nhanh)

Copy-paste các lệnh sau để chạy nhanh:

```bash
# 1. Khởi động blockchain
cd Besu-hyperledger
./run.sh

# Đợi 1-2 phút, sau đó kiểm tra:
curl -X POST http://localhost:21001 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# 2. Deploy contract
cd smart_contracts
npm install  # Chỉ cần chạy 1 lần
node scripts/public/deploy_and_init.js

# 3. Chạy web GUI
cd ../../GUI/web
npm install  # Chỉ cần chạy 1 lần
npm run dev

# 4. Mở browser: http://localhost:3000
```

---

## 📝 Lưu ý quan trọng

1. **Thứ tự thực hiện:** Phải chạy theo thứ tự: Blockchain → Deploy Contract → Web GUI
2. **Thời gian chờ:** Blockchain cần 1-2 phút để khởi động hoàn toàn
3. **Contract address:** Mỗi lần deploy sẽ có address mới, script sẽ tự động cập nhật GUI config
4. **Reset blockchain:** Nếu reset blockchain (xóa volumes), phải deploy lại contract

---

## 🔗 Tài liệu liên quan

- [Quick Reset Guide](./QUICK_RESET_GUIDE.md) - Hướng dẫn reset blockchain nhanh
- [Deployment Guide](../deployment/BLOCKCHAIN_SETUP.md) - Chi tiết setup blockchain
- [Architecture](../architecture/ARCHITECTURE.md) - Kiến trúc hệ thống

---

**Chúc bạn thành công! 🎉**

