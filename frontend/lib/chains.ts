// lib/chains.ts - Chain configurations for Privy provider
import { defineChain } from 'viem';

/**
 * Movement Mainnet Chain Configuration
 * 
 * Movement has EVM compatibility. This configuration uses the mainnet EVM RPC endpoint.
 * Note: Movement has transitioned from testnet to mainnet beta as of December 2024.
 */
export const movementTestnet = defineChain({
  id: 20240, // Movement chain ID
  name: 'Movement Mainnet',
  network: 'movement-mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Movement',
    symbol: 'MOVE',
  },
  rpcUrls: {
    default: {
      http: ['https://mainnet.movementnetwork.xyz/v1'],
    },
    public: {
      http: ['https://mainnet.movementnetwork.xyz/v1'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Movement Explorer',
      url: 'https://explorer.movementnetwork.xyz',
    },
  },
  testnet: false,
});

// Export for convenience - you can add more chains here
export const supportedChains = [movementTestnet];

