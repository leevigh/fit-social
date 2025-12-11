import { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { AptosAccount } from 'aptos';
import { onboardUserToMovement } from '@/lib/movement-auth';

export function useMovementAuth() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();

  const [movementAccount, setMovementAccount] = useState<AptosAccount | null>(null);
  const [movementAddress, setMovementAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-onboard user when they log in with Privy
  useEffect(() => {
    async function setupMovement() {
      if (!authenticated || !wallets[0]) return;

      setIsLoading(true);
      setError(null);

      try {
        // Convert Privy wallet to Movement account
        const { account, address, isFunded } = await onboardUserToMovement(wallets[0]);

        setMovementAccount(account);
        setMovementAddress(address);

        console.log('✅ Movement account ready:', address);
      } catch (err) {
        console.error('Failed to setup Movement account:', err);
        setError('Failed to connect to Movement blockchain');
      } finally {
        setIsLoading(false);
      }
    }

    setupMovement();
  }, [authenticated, wallets]);

  return {
    // Privy state
    ready,
    authenticated,
    user,
    
    // Movement state
    movementAccount,
    movementAddress,
    isLoading,
    error,

    // Actions
    login,
    logout,
  };
}