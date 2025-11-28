// Transaction types and interfaces

export type TransactionType = 'transfer' | 'withdrawal';
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  from: string;
  to: string;
  amount: number; // in VND
  amountWei: string; // in wei
  fee: number; // in VND
  description?: string;
  referenceCode: string;
  timestamp: Date;
  blockNumber?: number;
  txHash?: string;
  fromBank: string;
  toBank?: string;
}

export interface TransferForm {
  toAddress: string;
  toBank: string;
  amount: number;
  description: string;
}

export interface WithdrawalForm {
  amount: number;
  method: 'atm' | 'branch';
  accountNumber?: string;
  branchAddress?: string;
}

export interface StatementPeriod {
  startDate: Date;
  endDate: Date;
  format: 'pdf' | 'csv';
}

