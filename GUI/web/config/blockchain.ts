// Blockchain RPC configuration
// Note: If rpcnode container is running, use port 8545
// Otherwise, use port 21001 (sbv container)
// You can check which ports are available with: docker ps --filter "publish=8545"
export const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'http://localhost:21001';
export const WS_ENDPOINT = process.env.NEXT_PUBLIC_WS_ENDPOINT || 'ws://localhost:8546';

// Chain ID for the private network (from genesis)
export const CHAIN_ID = 1337;

// Gas configuration
export const GAS_LIMIT = 21000;
export const GAS_PRICE = '0x0'; // Free gas for test network

// Mock Mode: Set to true to enable mock transactions when blockchain balance is insufficient
// Useful for demo/testing without real blockchain setup
// WARNING: This will simulate successful transactions even with 0 balance!
export const MOCK_MODE = true;

// VND to Wei conversion
// Genesis balance: 100,000 ETH = 100,000,000 VND (100 triệu)
// So: 1 ETH = 1,000 VND for display purposes
export const WEI_TO_ETH = BigInt(10 ** 18);
export const ETH_TO_VND_RATE = 1000; // 1 ETH = 1000 VND
export const INITIAL_ETH_BALANCE = 100000; // 100,000 ETH from genesis
export const INITIAL_VND_BALANCE = 100000000; // 100,000,000 VND (100 triệu)

export const vndToWei = (vnd: number): bigint => {
  // Convert VND to ETH: 100M VND = 100K ETH, so 1 VND = 0.001 ETH = 10^15 wei
  const ethValue = (Number(vnd) / INITIAL_VND_BALANCE) * INITIAL_ETH_BALANCE;
  return BigInt(Math.floor(ethValue * Number(WEI_TO_ETH)));
};

export const weiToVnd = (wei: bigint): number => {
  // Convert ETH to VND: 100K ETH = 100M VND
  // Rate: 1 ETH = 1,000 VND for display
  const ethValue = Number(wei) / Number(WEI_TO_ETH);
  return Math.floor(ethValue * ETH_TO_VND_RATE);
};

export const formatVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};
