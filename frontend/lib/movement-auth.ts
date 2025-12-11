import { AptosAccount, AptosClient } from 'aptos';
import { ethers } from 'ethers';
import type { ConnectedWallet } from '@privy-io/react-auth';

const MOVEMENT_RPC = 'https://aptos.testnet.porto.movementlabs.xyz/v1';
const movementClient = new AptosClient(MOVEMENT_RPC);

/**
 * Convert Privy's Ethereum wallet to Aptos account for Movement
 * 
 * HOW IT WORKS:
 * 1. Get user's Ethereum private key from Privy wallet
 * 2. Use that as seed to generate Aptos account
 * 3. Now user can sign Movement transactions
 */
export async function getMovementAccountFromPrivy(
  privyWallet: ConnectedWallet & {
    getEthereumProvider: () => Promise<ethers.Eip1193Provider>;
  }
): Promise<AptosAccount> {
  try {
    // Get Ethereum provider from Privy and wrap it with ethers
    const eip1193Provider = await privyWallet.getEthereumProvider();
    const provider = new ethers.BrowserProvider(
      eip1193Provider as unknown as ethers.Eip1193Provider
    );
    const signer = await provider.getSigner();

    // Sign a deterministic message to get consistent private key
    // This ensures same wallet always generates same Aptos account
    const message = 'FitSocial Movement Account';
    const signature = await signer.signMessage(message);

    // Use signature as seed for Aptos account
    // Remove '0x' prefix and convert to Uint8Array
    const seed = signature.slice(2);
    const seedBytes = new Uint8Array(
      seed.match(/.{1,2}/g)!.map((byte: string) => parseInt(byte, 16))
    );

    // Create Aptos account from seed
    const aptosAccount = new AptosAccount(seedBytes.slice(0, 32));

    return aptosAccount;
  } catch (error) {
    console.error('Error converting Privy wallet to Movement account:', error);
    throw error;
  }
}

/**
 * Get user's Movement address (without creating full account)
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function getMovementAddress(privyWallet: any): Promise<string> {
    const account = await getMovementAccountFromPrivy(privyWallet);
    return account.address().hex();
  }
  
  /**
   * Check if user's Movement account is funded
   * If not, you'll need to fund it from your gas sponsor wallet
   */
  export async function isAccountFunded(address: string): Promise<boolean> {
    try {
      const account = await movementClient.getAccount(address);
      return true; // Account exists
    } catch (error) {
      return false; // Account doesn't exist on chain
    }
  }
  
  /**
   * Fund user's account from your gas sponsor wallet
   * Call this when user first signs in
   */
  export async function fundNewAccount(userAddress: string): Promise<void> {
    try {
      // Call your backend to sponsor gas
      const response = await fetch('/api/sponsor-gas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: userAddress }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to fund account');
      }
    } catch (error) {
      console.error('Error funding account:', error);
      throw error;
    }
  }
  
  /**
   * Complete user onboarding flow
   * 1. Convert Privy wallet to Movement account
   * 2. Check if funded
   * 3. Fund if needed
   */
  export async function onboardUserToMovement(
    privyWallet: any
  ): Promise<{ account: AptosAccount; address: string; isFunded: boolean }> {
    // Get Movement account
    const account = await getMovementAccountFromPrivy(privyWallet);
    const address = account.address().hex();
  
    // Check if funded
    let isFunded = await isAccountFunded(address);
  
    // Fund if needed
    if (!isFunded) {
      console.log('New account detected, funding with gas...');
      await fundNewAccount(address);
      isFunded = true;
    }
  
    return { account, address, isFunded };
  }
