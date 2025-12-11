// lib/movement.ts - Movement Protocol SDK Integration
import { AptosClient, AptosAccount, Types, TxnBuilderTypes, BCS } from 'aptos';

// Movement Testnet Configuration
const MOVEMENT_TESTNET_URL = 'https://aptos.testnet.porto.movementlabs.xyz/v1';
const MODULE_ADDRESS = process.env.NEXT_PUBLIC_MODULE_ADDRESS!; // Your deployed contract address

// Initialize Aptos client for Movement
export const movementClient = new AptosClient(MOVEMENT_TESTNET_URL);

// Type definitions
export interface Challenge {
  id: number;
  creator: string;
  name: string;
  description: string;
  entryFee: number;
  startTime: number;
  endTime: number;
  totalPool: number;
  participantCount: number;
  isActive: boolean;
}

interface CoinStoreData {
  coin: {
    value: string;
  };
}

export interface Submission {
  proofUri: string;
  timestamp: number;
  votesFor: number;
  votesAgainst: number;
  isVerified: boolean;
}

// ============================================
// VIEW FUNCTIONS (Read blockchain state)
// ============================================

/**
 * Get challenge details by ID
 */
export async function getChallengeDetails(
  challengeId: number
): Promise<Challenge> {
  try {
    const payload: Types.ViewRequest = {
      function: `${MODULE_ADDRESS}::challenge::get_challenge_details`,
      type_arguments: [],
      arguments: [challengeId.toString()],
    };

    const result = await movementClient.view(payload);
    
    return {
      id: challengeId,
      creator: result[0] as string,
      name: Buffer.from(result[1] as string, 'hex').toString('utf8'),
      description: Buffer.from(result[2] as string, 'hex').toString('utf8'),
      entryFee: parseInt(result[3] as string),
      startTime: parseInt(result[4] as string),
      endTime: parseInt(result[5] as string),
      totalPool: parseInt(result[6] as string),
      participantCount: 0, // Get from separate call
      isActive: result[7] as boolean,
    };
  } catch (error) {
    console.error('Error fetching challenge:', error);
    throw error;
  }
}

/**
 * Get all challenges (by querying events)
 */
export async function getAllChallenges(): Promise<Challenge[]> {
  try {
    // In production, you'd query events or maintain an indexer
    // For MVP, we'll query challenge IDs 0-99
    const challenges: Challenge[] = [];
    
    for (let i = 0; i < 100; i++) {
      try {
        const challenge = await getChallengeDetails(i);
        if (challenge.isActive) {
          challenges.push(challenge);
        }
      } catch {
        // Challenge doesn't exist, stop querying
        break;
      }
    }
    
    return challenges;
  } catch (error) {
    console.error('Error fetching all challenges:', error);
    return [];
  }
}

/**
 * Check if user is a participant in a challenge
 */
export async function isParticipant(
  challengeId: number,
  userAddress: string
): Promise<boolean> {
  try {
    const payload: Types.ViewRequest = {
      function: `${MODULE_ADDRESS}::challenge::is_participant`,
      type_arguments: [],
      arguments: [challengeId.toString(), userAddress],
    };

    const result = await movementClient.view(payload);
    return result[0] as boolean;
  } catch (error) {
    console.error('Error checking participant:', error);
    return false;
  }
}

/**
 * Check if user has submitted proof
 */
export async function hasSubmitted(
  challengeId: number,
  userAddress: string
): Promise<boolean> {
  try {
    const payload: Types.ViewRequest = {
      function: `${MODULE_ADDRESS}::challenge::has_submitted`,
      type_arguments: [],
      arguments: [challengeId.toString(), userAddress],
    };

    const result = await movementClient.view(payload);
    return result[0] as boolean;
  } catch (error) {
    console.error('Error checking submission:', error);
    return false;
  }
}

/**
 * Get submission votes for a participant
 */
export async function getSubmissionVotes(
  challengeId: number,
  participantAddress: string
): Promise<{ votesFor: number; votesAgainst: number; isVerified: boolean }> {
  try {
    const payload: Types.ViewRequest = {
      function: `${MODULE_ADDRESS}::challenge::get_submission_votes`,
      type_arguments: [],
      arguments: [challengeId.toString(), participantAddress],
    };

    const result = await movementClient.view(payload);
    
    return {
      votesFor: parseInt(result[0] as string),
      votesAgainst: parseInt(result[1] as string),
      isVerified: result[2] as boolean,
    };
  } catch (error) {
    console.error('Error fetching submission votes:', error);
    throw error;
  }
}

/**
 * Get escrow balance for a challenge
 */
export async function getChallengeEscrowBalance(
  challengeId: number
): Promise<number> {
  try {
    const payload: Types.ViewRequest = {
      function: `${MODULE_ADDRESS}::escrow::get_challenge_balance`,
      type_arguments: [],
      arguments: [challengeId.toString()],
    };

    const result = await movementClient.view(payload);
    return parseInt(result[0] as string);
  } catch (error) {
    console.error('Error fetching escrow balance:', error);
    return 0;
  }
}

// ============================================
// WRITE FUNCTIONS (Execute transactions)
// ============================================

/**
 * Create a new challenge
 */
export async function createChallenge(
  account: AptosAccount,
  name: string,
  description: string,
  entryFee: number,
  durationDays: number
): Promise<string> {
  try {
    const payload: Types.TransactionPayload = {
      type: 'entry_function_payload',
      function: `${MODULE_ADDRESS}::challenge::create_challenge`,
      type_arguments: [],
      arguments: [
        Buffer.from(name).toString('hex'),
        Buffer.from(description).toString('hex'),
        entryFee.toString(),
        durationDays.toString(),
      ],
    };

    const txnRequest = await movementClient.generateTransaction(
      account.address(),
      payload
    );
    const signedTxn = await movementClient.signTransaction(account, txnRequest);
    const txnResult = await movementClient.submitTransaction(signedTxn);

    await movementClient.waitForTransaction(txnResult.hash);
    return txnResult.hash;
  } catch (error) {
    console.error('Error creating challenge:', error);
    throw error;
  }
}

/**
 * Join a challenge (with payment)
 */
export async function joinChallenge(
  account: AptosAccount,
  challengeId: number
): Promise<string> {
  try {
    const payload: Types.TransactionPayload = {
      type: 'entry_function_payload',
      function: `${MODULE_ADDRESS}::challenge::join_challenge`,
      type_arguments: [],
      arguments: [challengeId.toString()],
    };

    const txnRequest = await movementClient.generateTransaction(
      account.address(),
      payload
    );
    const signedTxn = await movementClient.signTransaction(account, txnRequest);
    const txnResult = await movementClient.submitTransaction(signedTxn);

    await movementClient.waitForTransaction(txnResult.hash);
    return txnResult.hash;
  } catch (error) {
    console.error('Error joining challenge:', error);
    throw error;
  }
}

/**
 * Submit proof of completion
 */
export async function submitProof(
  account: AptosAccount,
  challengeId: number,
  proofUri: string
): Promise<string> {
  try {
    const payload: Types.TransactionPayload = {
      type: 'entry_function_payload',
      function: `${MODULE_ADDRESS}::challenge::submit_proof`,
      type_arguments: [],
      arguments: [
        challengeId.toString(),
        Buffer.from(proofUri).toString('hex'),
      ],
    };

    const txnRequest = await movementClient.generateTransaction(
      account.address(),
      payload
    );
    const signedTxn = await movementClient.signTransaction(account, txnRequest);
    const txnResult = await movementClient.submitTransaction(signedTxn);

    await movementClient.waitForTransaction(txnResult.hash);
    return txnResult.hash;
  } catch (error) {
    console.error('Error submitting proof:', error);
    throw error;
  }
}

/**
 * Vote on a submission
 */
export async function voteOnSubmission(
  account: AptosAccount,
  challengeId: number,
  participantAddress: string,
  approve: boolean
): Promise<string> {
  try {
    const payload: Types.TransactionPayload = {
      type: 'entry_function_payload',
      function: `${MODULE_ADDRESS}::challenge::vote`,
      type_arguments: [],
      arguments: [
        challengeId.toString(),
        participantAddress,
        approve.toString(),
      ],
    };

    const txnRequest = await movementClient.generateTransaction(
      account.address(),
      payload
    );
    const signedTxn = await movementClient.signTransaction(account, txnRequest);
    const txnResult = await movementClient.submitTransaction(signedTxn);

    await movementClient.waitForTransaction(txnResult.hash);
    return txnResult.hash;
  } catch (error) {
    console.error('Error voting:', error);
    throw error;
  }
}

/**
 * Distribute rewards after challenge ends
 */
export async function distributeRewards(
  account: AptosAccount,
  challengeId: number
): Promise<string> {
  try {
    const payload: Types.TransactionPayload = {
      type: 'entry_function_payload',
      function: `${MODULE_ADDRESS}::challenge::distribute_rewards`,
      type_arguments: [],
      arguments: [challengeId.toString()],
    };

    const txnRequest = await movementClient.generateTransaction(
      account.address(),
      payload
    );
    const signedTxn = await movementClient.signTransaction(account, txnRequest);
    const txnResult = await movementClient.submitTransaction(signedTxn);

    await movementClient.waitForTransaction(txnResult.hash);
    return txnResult.hash;
  } catch (error) {
    console.error('Error distributing rewards:', error);
    throw error;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get user's USDC balance
 */
export async function getUSDCBalance(address: string): Promise<number> {
  try {
    // Replace with actual USDC token address on Movement
    const USDC_ADDRESS = '0x1::aptos_coin::AptosCoin'; // Placeholder
    
    const resource = await movementClient.getAccountResource(
      address,
      `0x1::coin::CoinStore<${USDC_ADDRESS}>`
    );

    const balance = (resource.data as CoinStoreData).coin.value;
    return parseInt(balance);
  } catch (error) {
    console.error('Error fetching USDC balance:', error);
    return 0;
  }
}

/**
 * Format USDC amount (6 decimals)
 */
export function formatUSDC(amount: number): string {
  return (amount / 1_000_000).toFixed(2);
}

/**
 * Parse USDC amount to smallest unit
 */
export function parseUSDC(amount: number): number {
  return Math.floor(amount * 1_000_000);
}

/**
 * Get transaction explorer URL
 */
export function getExplorerUrl(txHash: string): string {
  return `https://explorer.testnet.porto.movementlabs.xyz/txn/${txHash}`;
}