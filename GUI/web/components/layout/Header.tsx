'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BankConfig, BANKS } from '@/config/banks';
import { Building2 } from 'lucide-react';

interface HeaderProps {
  bank?: BankConfig;
}

export default function Header({ bank }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Interbank System</span>
            </Link>
            {bank && (
              <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-300">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: bank.color }}
                />
                <span className="font-semibold text-gray-700">{bank.name}</span>
              </div>
            )}
          </div>
          <nav className="flex space-x-4">
            {BANKS.map((b) => (
              <Link
                key={b.code}
                href={`/bank/${b.code.toLowerCase()}/dashboard`}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname?.includes(b.code.toLowerCase())
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {b.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}

