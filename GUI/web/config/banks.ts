// Bank configuration with user accounts
export interface BankUser {
  id: string;
  name: string;
  address: string;
  privateKey: string;
  password: string;
  balanceVND?: number; // Optional, will be loaded from balances.json
}

export interface BankConfig {
  name: string;
  code: string;
  color: string;
  users: BankUser[];
}

export const BANKS: BankConfig[] = [
  {
    name: 'Vietcombank',
    code: 'VCB',
    color: '#0066CC',
    users: [
      {
        id: 'vietcombank_user1',
        name: 'Vietcombank User 1',
        address: '0x422b10ce2c930d45814992742e36383684946b14',
        privateKey: '0x67e14b41e88fa8dd79cbd302134c17c2ff611248ed88efae528d6db8a1386596',
        password: 'Vietcombank:User:1',
      },
      {
        id: 'vietcombank_user2',
        name: 'Vietcombank User 2',
        address: '0xe8023765dbfad4f5b39e4d958e7f77c841c92070',
        privateKey: '0x57acc05c004fe40f4cb76207542bfefaa8804df2896645634c7f44ae51932f5f',
        password: 'Vietcombank:User:2',
      },
    ],
  },
  {
    name: 'VietinBank',
    code: 'VTB',
    color: '#E60012',
    users: [
      {
        id: 'vietinbank_user1',
        name: 'VietinBank User 1',
        address: '0xf9a6995806e630b216f65ba5577088c9032a8051',
        privateKey: '0xac07a9f152fe78a5ad89946a4794260818b05c7898b669666c0369304b5d4ab0',
        password: 'VietinBank:User:1',
      },
      {
        id: 'vietinbank_user2',
        name: 'VietinBank User 2',
        address: '0xffe77b3af2e19001b08c1a5b2d6f81af8b3081fd',
        privateKey: '0x5758fa2ccfc934d34a52728d9d968d93405eee22dd92328b31e8e9dca27251e3',
        password: 'VietinBank:User:2',
      },
    ],
  },
  {
    name: 'BIDV',
    code: 'BIDV',
    color: '#1E88E5',
    users: [
      {
        id: 'bidv_user1',
        name: 'BIDV User 1',
        address: '0x9ce2b1c73dfe760d7413f5034709133d14bde60a',
        privateKey: '0x7581b1943d30d3354c5b63e4aed6759aa61430fae5ca965a7e3ec5c18597e3a1',
        password: 'BIDV:User:1',
      },
      {
        id: 'bidv_user2',
        name: 'BIDV User 2',
        address: '0xfe4c08e2839b216d82635d9b4e5bb14d0b7cbd33',
        privateKey: '0x5d88bec4d4783e2038f452ff6b371ab30774941503be01ea9c6296a7d8638d01',
        password: 'BIDV:User:2',
      },
    ],
  },
];

export const getBankByCode = (code: string): BankConfig | undefined => {
  return BANKS.find((bank) => bank.code.toLowerCase() === code.toLowerCase());
};

export const getAllUsers = (): BankUser[] => {
  return BANKS.flatMap((bank) => bank.users);
};

