// lib/hooks/useChallenges.ts - React Query Hooks for Movement Integration
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";
import { AptosAccount } from "aptos";
import * as movement from "@/lib/movement";
import { toast } from "sonner";

// ============================================
// QUERY KEYS
// ============================================
export const challengeKeys = {
  all: ["challenges"] as const,
  lists: () => [...challengeKeys.all, "list"] as const,
  list: (filters: string) => [...challengeKeys.lists(), { filters }] as const,
  details: () => [...challengeKeys.all, "detail"] as const,
  detail: (id: number) => [...challengeKeys.details(), id] as const,
  participants: (id: number) =>
    [...challengeKeys.detail(id), "participants"] as const,
  submissions: (id: number) =>
    [...challengeKeys.detail(id), "submissions"] as const,
  userChallenges: (address: string) =>
    [...challengeKeys.all, "user", address] as const,
};

// ============================================
// QUERY HOOKS (Read Data)
// ============================================

/**
 * Fetch all active challenges
 */
export function useChallenges() {
  return useQuery({
    queryKey: challengeKeys.lists(),
    queryFn: async () => {
      const challenges = await movement.getAllChallenges();
      return challenges;
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}

/**
 * Fetch single challenge details
 */
export function useChallenge(challengeId: number) {
  return useQuery({
    queryKey: challengeKeys.detail(challengeId),
    queryFn: async () => {
      const challenge = await movement.getChallengeDetails(challengeId);
      const escrowBalance = await movement.getChallengeEscrowBalance(
        challengeId
      );
      return { ...challenge, escrowBalance };
    },
    enabled: challengeId !== undefined,
    staleTime: 10000, // 10 seconds
  });
}

/**
 * Check if current user is participant
 */
export function useIsParticipant(challengeId: number) {
  const { user } = usePrivy();
  const userAddress = user?.wallet?.address;

  return useQuery({
    queryKey: [
      ...challengeKeys.detail(challengeId),
      "isParticipant",
      userAddress,
    ],
    queryFn: async () => {
      if (!userAddress) return false;
      return await movement.isParticipant(challengeId, userAddress);
    },
    enabled: !!userAddress && challengeId !== undefined,
  });
}

/**
 * Check if user has submitted proof
 */
export function useHasSubmitted(challengeId: number) {
  const { user } = usePrivy();
  const userAddress = user?.wallet?.address;

  return useQuery({
    queryKey: [
      ...challengeKeys.detail(challengeId),
      "hasSubmitted",
      userAddress,
    ],
    queryFn: async () => {
      if (!userAddress) return false;
      return await movement.hasSubmitted(challengeId, userAddress);
    },
    enabled: !!userAddress && challengeId !== undefined,
  });
}

/**
 * Get submission votes for a participant
 */
export function useSubmissionVotes(
  challengeId: number,
  participantAddress: string
) {
  return useQuery({
    queryKey: [
      ...challengeKeys.detail(challengeId),
      "votes",
      participantAddress,
    ],
    queryFn: async () => {
      return await movement.getSubmissionVotes(challengeId, participantAddress);
    },
    enabled: !!participantAddress,
    refetchInterval: 5000, // Refetch every 5 seconds for live voting
  });
}

/**
 * Get user's USDC balance (AptosCoin balance on Movement)
 */
export function useUSDCBalance() {
  // For Aptos wallets, we need to get the address from the Aptos wallet adapter
  // For now, we'll need to pass the address manually or get it from window.aptos
  const userAddress =
    typeof window !== "undefined"
      ? (window as Window & { aptos?: { account?: { address?: string } } })
          .aptos?.account?.address
      : undefined;

  return useQuery({
    queryKey: ["usdc-balance", userAddress],
    queryFn: async () => {
      if (!userAddress) return 0;
      return await movement.getUSDCBalance(userAddress);
    },
    enabled: !!userAddress,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

// ============================================
// MUTATION HOOKS (Write Data)
// ============================================

/**
 * Create a new challenge
 * Requires an Aptos wallet (Petra, Martian, Pontem, etc.)
 */
export function useCreateChallenge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      description,
      entryFee,
      durationDays,
      account,
    }: {
      name: string;
      description: string;
      entryFee: number;
      durationDays: number;
      account: AptosAccount;
    }) => {
      if (!account) {
        throw new Error(
          "Aptos wallet not connected. Please connect an Aptos wallet (Petra, Martian, or Pontem)."
        );
      }

      // Create challenge on Movement
      const txHash = await movement.createChallenge(
        account,
        name,
        description,
        movement.parseUSDC(entryFee),
        durationDays
      );

      return { txHash };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: challengeKeys.lists() });
      toast.success("Challenge created!", {
        description: "Your challenge is now live.",
        action: {
          label: "View Transaction",
          onClick: () =>
            window.open(movement.getExplorerUrl(data.txHash), "_blank"),
        },
      });
    },
    onError: (error) => {
      toast.error("Failed to create challenge", {
        description: error.message,
      });
    },
  });
}

/**
 * Join a challenge (payment handled directly on-chain via Movement smart contract)
 * Requires an Aptos wallet (Petra, Martian, Pontem, etc.)
 */
export function useJoinChallenge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      challengeId,
      account,
    }: {
      challengeId: number;
      account: AptosAccount;
    }) => {
      if (!account) {
        throw new Error(
          "Aptos wallet not connected. Please connect an Aptos wallet (Petra, Martian, or Pontem)."
        );
      }

      // Join challenge directly on Movement blockchain
      // The join_challenge function handles payment automatically via the smart contract
      const txHash = await movement.joinChallenge(account, challengeId);

      return { txHash, challengeId };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: challengeKeys.detail(variables.challengeId),
      });
      queryClient.invalidateQueries({ queryKey: ["usdc-balance"] });
      toast.success("Joined challenge!", {
        description: "Entry fee paid and you are now a participant.",
        action: {
          label: "View Transaction",
          onClick: () =>
            window.open(movement.getExplorerUrl(data.txHash), "_blank"),
        },
      });
    },
    onError: (error) => {
      toast.error("Failed to join challenge", {
        description: error.message,
      });
    },
  });
}

/**
 * Submit proof of completion
 * Requires an Aptos wallet (Petra, Martian, Pontem, etc.)
 */
export function useSubmitProof() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      challengeId,
      ipfsHash,
      account,
    }: {
      challengeId: number;
      ipfsHash: string;
      account: AptosAccount;
    }) => {
      if (!account) {
        throw new Error(
          "Aptos wallet not connected. Please connect an Aptos wallet (Petra, Martian, or Pontem)."
        );
      }

      const txHash = await movement.submitProof(account, challengeId, ipfsHash);
      return { txHash };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: challengeKeys.detail(variables.challengeId),
      });
      toast.success("Proof submitted!", {
        description: "Your submission is now under review.",
        action: {
          label: "View Transaction",
          onClick: () =>
            window.open(movement.getExplorerUrl(data.txHash), "_blank"),
        },
      });
    },
    onError: (error) => {
      toast.error("Failed to submit proof", {
        description: error.message,
      });
    },
  });
}

/**
 * Vote on a submission
 * Requires an Aptos wallet (Petra, Martian, Pontem, etc.)
 */
export function useVoteOnSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      challengeId,
      participantAddress,
      approve,
      account,
    }: {
      challengeId: number;
      participantAddress: string;
      approve: boolean;
      account: AptosAccount;
    }) => {
      if (!account) {
        throw new Error(
          "Aptos wallet not connected. Please connect an Aptos wallet (Petra, Martian, or Pontem)."
        );
      }

      const txHash = await movement.voteOnSubmission(
        account,
        challengeId,
        participantAddress,
        approve
      );
      return { txHash };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...challengeKeys.detail(variables.challengeId), "votes"],
      });
      toast.success("Vote recorded!", {
        description: variables.approve
          ? "You approved this submission"
          : "You rejected this submission",
      });
    },
    onError: (error) => {
      toast.error("Failed to vote", {
        description: error.message,
      });
    },
  });
}

/**
 * Distribute rewards
 * Requires an Aptos wallet (Petra, Martian, Pontem, etc.)
 */
export function useDistributeRewards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      challengeId,
      account,
    }: {
      challengeId: number;
      account: AptosAccount;
    }) => {
      if (!account) {
        throw new Error(
          "Aptos wallet not connected. Please connect an Aptos wallet (Petra, Martian, or Pontem)."
        );
      }

      const txHash = await movement.distributeRewards(account, challengeId);
      return { txHash };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: challengeKeys.detail(variables.challengeId),
      });
      queryClient.invalidateQueries({ queryKey: ["usdc-balance"] });
      toast.success("Rewards distributed!", {
        description: "Winners have received their USDC.",
        action: {
          label: "View Transaction",
          onClick: () =>
            window.open(movement.getExplorerUrl(data.txHash), "_blank"),
        },
      });
    },
    onError: (error) => {
      toast.error("Failed to distribute rewards", {
        description: error.message,
      });
    },
  });
}

// ============================================
// EXAMPLE COMPONENT USAGE
// ============================================
/*
'use client';
import { useChallenges, useJoinChallenge } from '@/hooks/useChallenges';
import { AptosAccount } from 'aptos';
import { useState, useEffect } from 'react';
import * as movement from '@/lib/movement';

export function ChallengeList() {
  const { data: challenges, isLoading, error } = useChallenges();
  const joinChallenge = useJoinChallenge();
  const [aptosAccount, setAptosAccount] = useState<AptosAccount | null>(null);

  // Get Aptos wallet connection
  useEffect(() => {
    async function connectAptosWallet() {
      if (typeof window !== 'undefined' && (window as Window & { aptos?: any }).aptos) {
        try {
          const aptosWallet = (window as Window & { aptos?: any }).aptos;
          const account = await aptosWallet.connect();
          // Create AptosAccount from wallet connection
          // Note: You'll need to use the wallet's signer, not extract private key
          // This is a simplified example - actual implementation depends on wallet adapter
        } catch (err) {
          console.error('Failed to connect Aptos wallet:', err);
        }
      }
    }
    connectAptosWallet();
  }, []);

  if (isLoading) return <div>Loading challenges...</div>;
  if (error) return <div>Error loading challenges</div>;

  return (
    <div className="grid gap-4">
      {challenges?.map((challenge) => (
        <div key={challenge.id} className="border p-4 rounded">
          <h3>{challenge.name}</h3>
          <p>{challenge.description}</p>
          <p>Entry: ${movement.formatUSDC(challenge.entryFee)} USDC</p>
          <p>Pool: ${movement.formatUSDC(challenge.totalPool)} USDC</p>
          <button
            onClick={() => {
              if (!aptosAccount) {
                alert('Please connect an Aptos wallet (Petra, Martian, or Pontem)');
                return;
              }
              joinChallenge.mutate({
                challengeId: challenge.id,
                account: aptosAccount,
              });
            }}
            disabled={joinChallenge.isPending || !aptosAccount}
          >
            {joinChallenge.isPending ? 'Joining...' : 'Join Challenge'}
          </button>
        </div>
      ))}
    </div>
  );
}
*/
