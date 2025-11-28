'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CreditCard, Loader2, CheckCircle, XCircle, MapPin, Banknote } from 'lucide-react';
import { getBankByCode, BankUser } from '@/config/banks';
import { formatVND, MOCK_MODE } from '@/config/blockchain';
import { formatAddress, getBalanceVND } from '@/lib/blockchain';
import { getBalanceForUser } from '@/lib/balances';
import { saveTransaction, generateReferenceCode, updateTransactionStatus, saveUserBalance, getStoredBalance } from '@/lib/storage';
import { Transaction } from '@/types/transaction';

export default function Withdraw() {
  const params = useParams();
  const router = useRouter();
  const bankCode = params.bankCode as string;

  const [user, setUser] = useState<BankUser | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'atm' | 'branch'>('atm');
  const [accountNumber, setAccountNumber] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [referenceCode, setReferenceCode] = useState('');
  const [balance, setBalance] = useState<number | null>(null); // Start with null, load real balance
  const [isRealBalance, setIsRealBalance] = useState(false); // Track if balance is from blockchain (real) or file (fallback)

  useEffect(() => {
    const bank = getBankByCode(bankCode);
    if (!bank) return;

    const savedUserId = localStorage.getItem('interbank_selected_user');
    const selectedUser = bank.users.find((u) => u.id === savedUserId) || bank.users[0];
    setUser(selectedUser);
    
    if (selectedUser) {
      loadBalance(selectedUser.address);
    }
  }, [bankCode]);

  const loadBalance = async (address: string) => {
    setIsRealBalance(false); // Reset trước khi load

    // 1. Ưu tiên: Kiểm tra LocalStorage (số dư mới nhất sau giao dịch)
    try {
      const storedBalance = getStoredBalance(address);
      if (storedBalance !== null) {
        setBalance(storedBalance);
        // Nếu là từ LocalStorage (sau giao dịch), coi như "ảo" để phù hợp với logic hiện tại
        // Nhưng cho phép giao dịch nếu MOCK_MODE bật
        setIsRealBalance(MOCK_MODE);
        return;
      }
    } catch (error) {
      console.error('Error loading balance from storage:', error);
    }

    // 2. Thử lấy từ Blockchain trước (số dư thật)
    try {
      const blockchainBalance = await getBalanceVND(address);
      if (blockchainBalance !== null && blockchainBalance >= 0) {
        setBalance(blockchainBalance);
        setIsRealBalance(true); // Đánh dấu đây là số dư thật từ blockchain
        return;
      }
    } catch (error) {
      console.error('Error loading balance from blockchain:', error);
    }
    
    // 3. Nếu Blockchain lỗi, lấy từ File chỉ để HIỂN THỊ (không dùng để validate)
    try {
      const fileBalance = await getBalanceForUser(address);
      if (fileBalance !== null && fileBalance >= 0) {
        setBalance(fileBalance);
        setIsRealBalance(false); // Đánh dấu đây là số dư tham khảo (ảo) từ file
        return;
      }
    } catch (error) {
      console.error('Error loading balance from file:', error);
    }
    
    // Last resort: set to 0 if nothing works (coi 0 là số dư thật để chặn giao dịch)
    setBalance(0);
    setIsRealBalance(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setMessage({ type: 'error', text: 'Vui lòng chọn người dùng' });
      return;
    }

    if (!amount) {
      setMessage({ type: 'error', text: 'Vui lòng nhập số tiền' });
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setMessage({ type: 'error', text: 'Số tiền không hợp lệ' });
      return;
    }

    // BLOCK GIAO DỊCH NẾU SỐ DƯ LÀ ẢO (từ file, không phải blockchain)
    // Trừ khi đang ở MOCK_MODE (cho phép test/demo)
    if (!isRealBalance && !MOCK_MODE) {
      setMessage({
        type: 'error',
        text: 'Đang hiển thị số dư ngoại tuyến. Không thể thực hiện giao dịch lúc này. Vui lòng thử lại sau.',
      });
      // Thử load lại số dư thật từ blockchain
      if (user) {
        loadBalance(user.address);
      }
      return;
    }
    
    // Cảnh báo nếu đang dùng MOCK_MODE
    if (MOCK_MODE && !isRealBalance) {
      console.warn('⚠️ MOCK_MODE: Cho phép rút tiền với số dư ngoại tuyến');
    }

    // Check balance is loaded
    if (balance === null) {
      setMessage({
        type: 'error',
        text: 'Chưa tải được số dư. Vui lòng đợi một chút và thử lại.',
      });
      // Try reload balance
      if (user) {
        loadBalance(user.address);
      }
      return;
    }

    if (balance >= 0 && amountNum > balance) {
      setMessage({
        type: 'error',
        text: `Số dư không đủ. Số dư hiện tại: ${formatVND(balance)}, Số tiền cần: ${formatVND(amountNum)}`,
      });
      return;
    }

    if (method === 'branch' && !branchAddress) {
      setMessage({ type: 'error', text: 'Vui lòng nhập địa chỉ chi nhánh' });
      return;
    }

    if (!showOtp) {
      // Generate OTP (mock)
      const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setShowOtp(true);
      setMessage({ type: 'success', text: `Mã OTP: ${mockOtp} (Mock - dùng mã này để xác nhận)` });
      return;
    }

    if (otp.length !== 6) {
      setMessage({ type: 'error', text: 'Mã OTP không hợp lệ' });
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      const refCode = generateReferenceCode();
      setReferenceCode(refCode);

      // Create withdrawal transaction record
      const transaction: Transaction = {
        id: refCode,
        type: 'withdrawal',
        status: 'processing',
        from: user.address,
        to: user.address,
        amount: amountNum,
        amountWei: '0',
        fee: 0,
        description: `Rút tiền ${method === 'atm' ? 'tại ATM' : `tại chi nhánh: ${branchAddress}`}`,
        referenceCode: refCode,
        timestamp: new Date(),
        fromBank: user.id.split('_')[0],
      };

      saveTransaction(transaction, bankCode, user.address);

      // Simulate processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      transaction.status = 'completed';
      updateTransactionStatus(bankCode, user.address, refCode, 'completed');

      // Cập nhật số dư sau khi rút tiền thành công
      if (user && balance !== null) {
        const newBalance = Math.max(0, balance - amountNum); // Đảm bảo không âm
        saveUserBalance(user.address, newBalance); // Lưu vào LocalStorage
        setBalance(newBalance); // Cập nhật state ngay lập tức
      }

      setMessage({
        type: 'success',
        text: `Rút tiền thành công! Mã nhận tiền: ${refCode}. ${method === 'atm' ? 'Vui lòng đến ATM với mã này để nhận tiền.' : 'Vui lòng đến chi nhánh với mã này để nhận tiền.'}`,
      });

      // Reset form
      setAmount('');
      setAccountNumber('');
      setBranchAddress('');
      setOtp('');
      setShowOtp(false);

      setTimeout(() => {
        router.push(`/bank/${bankCode}/history`);
      }, 3000);
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Có lỗi xảy ra khi rút tiền',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) {
    return <div className="text-gray-600">Đang tải...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Rút tiền</h2>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <XCircle className="h-5 w-5" />
          )}
          <p>{message.text}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tài khoản
          </label>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-600">{formatAddress(user.address)}</p>
            <p className="text-sm text-gray-600 mt-1">
              Số dư: {balance !== null ? formatVND(balance) : 'Đang tải...'}
              {!isRealBalance && balance !== null && (
                <span className="ml-2 text-xs text-yellow-600">(Ngoại tuyến)</span>
              )}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Số tiền (VND)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Nhập số tiền cần rút"
            min="0"
            step="1000"
            max={balance || undefined}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phương thức nhận tiền
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setMethod('atm')}
              className={`p-4 border-2 rounded-lg transition-colors flex flex-col items-center space-y-2 ${
                method === 'atm'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Banknote className="h-8 w-8 text-blue-600" />
              <span className="font-medium">ATM</span>
            </button>
            <button
              type="button"
              onClick={() => setMethod('branch')}
              className={`p-4 border-2 rounded-lg transition-colors flex flex-col items-center space-y-2 ${
                method === 'branch'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <MapPin className="h-8 w-8 text-blue-600" />
              <span className="font-medium">Chi nhánh</span>
            </button>
          </div>
        </div>

        {method === 'branch' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Địa chỉ chi nhánh
            </label>
            <input
              type="text"
              value={branchAddress}
              onChange={(e) => setBranchAddress(e.target.value)}
              placeholder="Nhập địa chỉ chi nhánh"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required={method === 'branch'}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Số tài khoản nhận tiền (tùy chọn)
          </label>
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="Nhập số tài khoản"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {showOtp && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mã OTP
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Nhập mã OTP 6 chữ số"
              maxLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        )}

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isProcessing}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5" />
                <span>{showOtp ? 'Xác nhận rút tiền' : 'Tiếp tục'}</span>
              </>
            )}
          </button>
          {showOtp && (
            <button
              type="button"
              onClick={() => {
                setShowOtp(false);
                setOtp('');
                setMessage(null);
              }}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

