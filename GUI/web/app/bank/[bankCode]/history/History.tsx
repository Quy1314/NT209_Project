'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Search, ExternalLink, CheckCircle, Clock, XCircle, Trash2, AlertCircle } from 'lucide-react';
import { getBankByCode, BankUser } from '@/config/banks';
import { formatAddress } from '@/lib/blockchain';
import { formatVND } from '@/config/blockchain';
import { getTransactionsByUser, deleteTransactionsByUser, deleteTransaction } from '@/lib/storage';
import { Transaction, TransactionType, TransactionStatus } from '@/types/transaction';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function History() {
  const params = useParams();
  const bankCode = params.bankCode as string;

  const [user, setUser] = useState<BankUser | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<{ from: string; to: string }>({
    from: '',
    to: '',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    const bank = getBankByCode(bankCode);
    if (!bank) return;

    const savedUserId = localStorage.getItem('interbank_selected_user');
    const selectedUser = bank.users.find((u) => u.id === savedUserId) || bank.users[0];
    setUser(selectedUser);

    if (selectedUser) {
      const userTransactions = getTransactionsByUser(bankCode, selectedUser.address);
      setTransactions(userTransactions);
      setFilteredTransactions(userTransactions);
    }
  }, [bankCode]);

  useEffect(() => {
    let filtered = [...transactions];

    if (searchTerm) {
      filtered = filtered.filter(
        (tx) =>
          tx.referenceCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.from.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((tx) => tx.type === typeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((tx) => tx.status === statusFilter);
    }

    if (dateFilter.from) {
      const fromDate = new Date(dateFilter.from);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((tx) => tx.timestamp >= fromDate);
    }
    if (dateFilter.to) {
      const toDate = new Date(dateFilter.to);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((tx) => tx.timestamp <= toDate);
    }

    setFilteredTransactions(filtered);
  }, [searchTerm, typeFilter, statusFilter, dateFilter, transactions]);

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
      case 'processing':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: TransactionStatus): string => {
    switch (status) {
      case 'completed':
        return 'Hoàn tất';
      case 'pending':
        return 'Chờ xử lý';
      case 'processing':
        return 'Đang xử lý';
      case 'failed':
        return 'Thất bại';
      default:
        return status;
    }
  };

  const handleDeleteAll = () => {
    if (user) {
      deleteTransactionsByUser(bankCode, user.address);
      setTransactions([]);
      setFilteredTransactions([]);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  const handleDeleteTransaction = (transactionId: string) => {
    if (user) {
      deleteTransaction(bankCode, user.address, transactionId);
      const updated = getTransactionsByUser(bankCode, user.address);
      setTransactions(updated);
      setFilteredTransactions(updated);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  const confirmDelete = (target: 'all' | string) => {
    setDeleteTarget(target);
    setShowDeleteConfirm(true);
  };

  if (!user) {
    return <div className="text-gray-600">Đang tải...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Lịch sử giao dịch</h2>
        {transactions.length > 0 && (
          <button
            onClick={() => confirmDelete('all')}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="h-5 w-5" />
            <span>Xóa tất cả</span>
          </button>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa</h3>
            </div>
            <p className="text-gray-600 mb-6">
              {deleteTarget === 'all'
                ? 'Bạn có chắc chắn muốn xóa tất cả lịch sử giao dịch? Hành động này không thể hoàn tác.'
                : 'Bạn có chắc chắn muốn xóa giao dịch này?'}
            </p>
            <div className="flex space-x-4 justify-end">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteTarget(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (deleteTarget === 'all') {
                    handleDeleteAll();
                  } else if (deleteTarget) {
                    handleDeleteTransaction(deleteTarget);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TransactionType | 'all')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tất cả loại</option>
            <option value="transfer">Chuyển tiền</option>
            <option value="withdrawal">Rút tiền</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TransactionStatus | 'all')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="completed">Hoàn tất</option>
            <option value="pending">Chờ xử lý</option>
            <option value="processing">Đang xử lý</option>
            <option value="failed">Thất bại</option>
          </select>

          <div className="flex space-x-2">
            <input
              type="date"
              value={dateFilter.from}
              onChange={(e) => setDateFilter({ ...dateFilter, from: e.target.value })}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="date"
              value={dateFilter.to}
              onChange={(e) => setDateFilter({ ...dateFilter, to: e.target.value })}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Không tìm thấy giao dịch nào</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTransactions.map((tx) => (
              <div key={tx.id} className="p-6 hover:bg-gray-50 transition-colors group">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(tx.status)}
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            tx.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : tx.status === 'pending' || tx.status === 'processing'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {getStatusText(tx.status)}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            tx.type === 'transfer'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {tx.type === 'transfer' ? 'Chuyển tiền' : 'Rút tiền'}
                        </span>
                      </div>
                      <button
                        onClick={() => confirmDelete(tx.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Xóa giao dịch"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-500">Mã tham chiếu</p>
                        <p className="font-medium text-gray-900">{tx.referenceCode}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Thời gian</p>
                        <p className="font-medium text-gray-900">
                          {format(tx.timestamp, 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </p>
                      </div>
                      {tx.type === 'transfer' && (
                        <>
                          <div>
                            <p className="text-sm text-gray-500">Người nhận</p>
                            <p className="font-medium text-gray-900">{formatAddress(tx.to)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Nội dung</p>
                            <p className="font-medium text-gray-900">
                              {tx.description || 'Không có'}
                            </p>
                          </div>
                        </>
                      )}
                      {tx.blockNumber && (
                        <div>
                          <p className="text-sm text-gray-500">Block Number</p>
                          <p className="font-medium text-gray-900">{tx.blockNumber}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p
                      className={`text-2xl font-bold mb-2 ${
                        tx.type === 'transfer' ? 'text-red-600' : 'text-blue-600'
                      }`}
                    >
                      {tx.type === 'transfer' ? '-' : '+'}
                      {formatVND(tx.amount)}
                    </p>
                    {tx.txHash && (
                      <a
                        href="#"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                      >
                        <span>Xem trên blockchain</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

