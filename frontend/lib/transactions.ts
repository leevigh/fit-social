import {
    generateSigningMessageForTransaction,
    SimpleTransaction,
  } from '@aptos-labs/ts-sdk';
  import { aptos, CONTRACT_ADDRESS, toHex, MOVEMENT_CONFIGS, CURRENT_NETWORK } from './aptos';
  
  export type CounterAction = 'increment' | 'decrement';
  
  export interface CounterTransaction {
    action: CounterAction;
    amount: number;
  }
  
  export interface SignRawHashFunction {
    (params: { address: string; chainType: 'aptos'; hash: `0x${string}` }): Promise<{
      signature: string;
    }>;
  }
  
  /**
   * Get the contract function name for a counter action
   */
  export const getCounterFunction = (action: CounterAction): `${string}::${string}::${string}` => {
    const functionName = action === 'increment' ? 'add_counter' : 'subtract_counter';
    return `${CONTRACT_ADDRESS}::counter::${functionName}` as `${string}::${string}::${string}`;
  };
  
  /**
   * Helper function to post signed transaction to sponsorship API
   */
  async function postToSponsorshipAPI({
    rawTxn,
    senderAddress,
    userPublicKey,
    userSignature,
    chainId,
  }: {
    rawTxn: SimpleTransaction;
    senderAddress: string;
    userPublicKey: string;
    userSignature: string;
    chainId?: number;
  }): Promise<string> {
    const response = await fetch('/api/shinami/sponsor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rawTxn,
        senderAddress,
        userPublicKey,
        userSignature,
        network: CURRENT_NETWORK === 'testnet' ? 'movement-testnet' : 'movement-mainnet',
        chainId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Sponsorship API error: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.transactionHash) {
      throw new Error('No transaction hash returned from sponsorship API');
    }

    return result.transactionHash;
  }

  /**
   * Build and submit a single counter transaction with gas sponsorship via Shinami
   * Uses Privy-managed wallet and server-side gas sponsorship
   */
  export const submitCounterTransaction = async (
    action: CounterAction,
    amount: number,
    walletAddress: string,
    publicKeyHex: string,
    signRawHash: SignRawHashFunction
  ): Promise<string> => {
    try {
      console.log(`[Privy Transaction] Starting ${action} transaction with gas sponsorship:`, { 
        action, 
        amount, 
        walletAddress, 
        publicKeyLength: publicKeyHex?.length 
      });
  
      // Build the raw transaction
      const rawTxn = await aptos.transaction.build.simple({
        sender: walletAddress,
        data: {
          function: getCounterFunction(action),
          typeArguments: [],
          functionArguments: [amount],
        },
      });
  
      console.log('[Privy Transaction] Transaction built successfully');
  
      // Generate signing message
      const message = generateSigningMessageForTransaction(rawTxn);
      console.log('[Privy Transaction] Signing message generated');
  
      // Sign with Privy wallet using signRawHash
      const { signature: rawSignature } = await signRawHash({
        address: walletAddress,
        chainType: 'aptos',
        hash: `0x${toHex(message)}`,
      });
  
      console.log('[Privy Transaction] Transaction signed successfully');
  
      // Get chainId from Movement config
      const chainId = MOVEMENT_CONFIGS[CURRENT_NETWORK].chainId;
  
      // Post to sponsorship API instead of submitting directly
      console.log('[Privy Transaction] Requesting gas sponsorship from server');
      const transactionHash = await postToSponsorshipAPI({
        rawTxn,
        senderAddress: walletAddress,
        userPublicKey: publicKeyHex,
        userSignature: rawSignature,
        chainId,
      });
  
      console.log('[Privy Transaction] Transaction sponsored and submitted:', transactionHash);
  
      // Wait for confirmation
      const executed = await aptos.waitForTransaction({
        transactionHash,
      });
  
      if (!executed.success) {
        throw new Error('Transaction failed');
      }
  
      console.log('[Privy Transaction] Transaction confirmed successfully');
  
      return transactionHash;
    } catch (error) {
      console.error(`Error submitting ${action} transaction:`, error);
      throw error;
    }
  };
  
  /**
   * @deprecated Native wallet transaction submission has been removed.
   * All transactions now use Privy-managed wallets with gas sponsorship via Shinami.
   * Use submitCounterTransaction instead.
   */
  
  /**
   * Fetch current counter value from blockchain
   */
  export const fetchCounterValue = async (address: string): Promise<number | null> => {
    try {
      const result = await aptos.view({
        payload: {
          function: `${CONTRACT_ADDRESS}::counter::get_counter`,
          typeArguments: [],
          functionArguments: [address],
        },
      });
  
      return Number(result[0]);
    } catch (error) {
      console.error('Error fetching counter value:', error);
      return null;
    }
  };
  