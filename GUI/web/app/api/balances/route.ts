import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Default balances data (used as fallback)
const DEFAULT_BALANCES = [
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

export async function GET() {
  try {
    // Try multiple paths for flexibility in different deployment environments
    const possiblePaths = [
      path.join(process.cwd(), 'public', 'user_balances.json'),
      path.join(process.cwd(), 'user_balances.json'),
      path.join(__dirname, '..', '..', '..', 'public', 'user_balances.json'),
    ];
    
    for (const filePath of possiblePaths) {
      try {
        if (fs.existsSync(filePath)) {
          const fileContents = fs.readFileSync(filePath, 'utf8');
          const balances = JSON.parse(fileContents);
          return NextResponse.json(balances);
        }
      } catch (fsError) {
        // Continue to next path
        console.log(`Failed to read from ${filePath}:`, fsError);
      }
    }
    
    // If all file reads failed, return default balances
    console.warn('Could not read user_balances.json from any path, using default balances');
    return NextResponse.json(DEFAULT_BALANCES);
  } catch (error: any) {
    console.error('Error loading balances:', error);
    // Return default balances as fallback
    return NextResponse.json(DEFAULT_BALANCES);
  }
}

