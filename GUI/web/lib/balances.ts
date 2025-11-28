// Load user balances from API or JSON file
import { BankUser } from '@/config/banks';
import { getStoredBalance } from './storage';

export interface UserBalance {
  bank: string;
  user: string;
  address: string;
  balance_vnd: number;
}

let cachedBalances: UserBalance[] | null = null;

export const loadBalances = async (): Promise<UserBalance[]> => {
  if (cachedBalances) {
    return cachedBalances;
  }

  // Try to load from API (with timeout and better error handling)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch('/api/balances', {
      signal: controller.signal,
      cache: 'no-cache',
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      cachedBalances = await response.json();
      if (Array.isArray(cachedBalances) && cachedBalances.length > 0) {
        return cachedBalances;
      }
    }
  } catch (error: any) {
    // Silently fail and try next option
    if (error.name !== 'AbortError') {
      console.warn('Could not load balances from API, trying file fallback...');
    }
  }

  // Fallback: load from public file (with timeout and better error handling)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch('/user_balances.json', {
      signal: controller.signal,
      cache: 'no-cache',
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      cachedBalances = await response.json();
      if (Array.isArray(cachedBalances) && cachedBalances.length > 0) {
        return cachedBalances;
      }
    }
  } catch (error: any) {
    // Silently fail and return default
    if (error.name !== 'AbortError') {
      console.warn('Could not load balances from file, using default balances...');
    }
  }

  // Last resort: return default balances
  console.warn('Using default balances as fallback');
  return getDefaultBalances();
};

// Default balances fallback
const getDefaultBalances = (): UserBalance[] => {
  return [
    {
      bank: "Vietcombank",
      user: "vietcombank_user1",
      address: "0x422b10ce2c930d45814992742e36383684946b14",
      balance_vnd: 100000000
    },
    {
      bank: "Vietcombank",
      user: "vietcombank_user2",
      address: "0xe8023765dbfad4f5b39e4d958e7f77c841c92070",
      balance_vnd: 100000000
    },
    {
      bank: "VietinBank",
      user: "vietinbank_user1",
      address: "0xf9a6995806e630b216f65ba5577088c9032a8051",
      balance_vnd: 100000000
    },
    {
      bank: "VietinBank",
      user: "vietinbank_user2",
      address: "0xffe77b3af2e19001b08c1a5b2d6f81af8b3081fd",
      balance_vnd: 100000000
    },
    {
      bank: "BIDV",
      user: "bidv_user1",
      address: "0x9ce2b1c73dfe760d7413f5034709133d14bde60a",
      balance_vnd: 100000000
    },
    {
      bank: "BIDV",
      user: "bidv_user2",
      address: "0xfe4c08e2839b216d82635d9b4e5bb14d0b7cbd33",
      balance_vnd: 100000000
    }
  ];
};

export const getBalanceForUser = async (userAddress: string): Promise<number | null> => {
  try {
    // 1. Ưu tiên: Kiểm tra xem có số dư mới nhất trong LocalStorage không (do vừa chuyển tiền xong)
    const storedBalance = getStoredBalance(userAddress);
    if (storedBalance !== null) {
      return storedBalance;
    }

    // 2. Nếu không có, mới load từ cache/file/api
    const balances = await loadBalances();
    if (Array.isArray(balances) && balances.length > 0) {
      const userBalance = balances.find(
        (b) => b.address.toLowerCase() === userAddress.toLowerCase()
      );
      return userBalance?.balance_vnd || null;
    }
  } catch (error: any) {
    console.error('Error in getBalanceForUser:', error);
    // Return null on error - let caller handle fallback
  }

  return null;
};

export const updateUserBalance = (userAddress: string, newBalance: number): void => {
  if (cachedBalances) {
    const index = cachedBalances.findIndex(
      (b) => b.address.toLowerCase() === userAddress.toLowerCase()
    );
    if (index !== -1) {
      cachedBalances[index].balance_vnd = newBalance;
    }
  }
};

export const getInitialBalanceForUser = (userAddress: string): number => {
  // This is a sync version for initial config
  // Returns default balance if not found
  return 100000000; // Default balance from genesis
};

