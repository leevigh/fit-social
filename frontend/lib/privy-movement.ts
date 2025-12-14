/**
 * Utility functions for creating and managing Movement wallets with Privy
 */

import type { Wallet, User, LinkedAccountWithMetadata } from '@privy-io/react-auth';

export interface CreateWalletFunction {
    (params: { chainType: 'aptos' }): Promise<Wallet>;
  }
  
  /**
   * Create a Movement wallet for a Privy user
   * @param user - The Privy user object
   * @param createWallet - The createWallet function from useCreateWallet hook
   * @returns The created wallet object with address
   */
  export async function createMovementWallet(
    user: User,
    createWallet: CreateWalletFunction
  ): Promise<Wallet> {
    try {
      // Check if user already has an Aptos/Movement wallet
      const existingWallet = user?.linkedAccounts?.find(
        (account: LinkedAccountWithMetadata) => account.type === 'wallet' && 'chainType' in account && account.chainType === 'aptos'
      ) as Wallet | undefined;
  
      if (existingWallet) {
        console.log('Movement wallet already exists:', existingWallet.address);
        return existingWallet;
      }
  
      // Create a new Aptos/Movement wallet
      console.log('Creating new Movement wallet for user...');
      const wallet = await createWallet({ chainType: 'aptos' });
      
      console.log('Movement wallet created successfully:', wallet.address);
      return wallet;
    } catch (error) {
      console.error('Error creating Movement wallet:', error);
      throw error;
    }
  }
  