'use client';

import Link from 'next/link';
import { BANKS } from '@/config/banks';
import { Building2, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Building2 className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Hệ thống Liên ngân hàng
          </h1>
          <p className="text-xl text-gray-600">
            Quản lý giao dịch liên ngân hàng trên blockchain
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {BANKS.map((bank) => (
            <Link
              key={bank.code}
              href={`/bank/${bank.code.toLowerCase()}/dashboard`}
              className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow group"
            >
              <div className="flex items-center justify-between mb-6">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: bank.color }}
                >
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{bank.name}</h2>
              <p className="text-gray-600 mb-4">
                {bank.users.length} tài khoản người dùng
              </p>
              <div className="flex items-center text-blue-600 font-medium">
                Truy cập
                <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Các chức năng chính</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Chuyển tiền</h3>
              <p className="text-sm text-gray-600">
                Chuyển tiền liên ngân hàng an toàn và nhanh chóng
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Rút tiền</h3>
              <p className="text-sm text-gray-600">
                Rút tiền tại ATM hoặc chi nhánh
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Lịch sử</h3>
              <p className="text-sm text-gray-600">
                Xem lịch sử giao dịch chi tiết
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Sao kê</h3>
              <p className="text-sm text-gray-600">
                Tải sao kê PDF/CSV
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
