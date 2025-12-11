// lib/x402.ts - x402 Payment Protocol Integration
import { ethers } from 'ethers';

// ============================================
// x402 PROTOCOL EXPLANATION
// ============================================
/*
x402 is a payment protocol that uses HTTP 402 "Payment Required" status code.

HOW IT WORKS:
1. Client requests protected resource (e.g., join challenge)
2. Server responds with 402 + payment requirements in response body
3. Client creates payment on blockchain
4. Client retries request with X-PAYMENT header containing payment proof
5. Server verifies payment and grants access

FLOW:
  Request → 402 Response → Pay on-chain → Retry with proof → 200 Success

KEY CONCEPTS:
- No accounts or API keys needed
- Payment happens in HTTP headers
- Works with any blockchain (we use Movement/Base)
- Instant settlement with USDC
*/

// ============================================
// TYPES
// ============================================

export interface PaymentRequirement {
  scheme: 'exact'; // exact amount payment
  network: string; // e.g., 'base-sepolia' or 'movement-testnet'
  amount: string; // Amount in USDC (e.g., "0.01")
  asset: string; // USDC contract address
  destination: string; // Recipient wallet address
}

export interface X402Response {
  x402Version: string;
  accepts: Array<{
    paymentRequirements: PaymentRequirement;
  }>;
  message?: string;
}

export interface PaymentPayload {
  x402Version: string;
  scheme: 'exact';
  network: string;
  payload: {
    txHash: string;
    from: string;
    to: string;
    amount: string;
    timestamp: number;
  };
}

// ============================================
// CONFIGURATION
// ============================================

const X402_VERSION = '0.7.0';
const FACILITATOR_URL = process.env.NEXT_PUBLIC_X402_FACILITATOR_URL || 
  'https://x402-facilitator.coinbase.com'; // CDP facilitator (fee-free!)

// Movement/Base testnet USDC address
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS!;

// Your platform's receiving wallet
const PLATFORM_WALLET = process.env.NEXT_PUBLIC_PLATFORM_WALLET!;

// ============================================
// CLIENT-SIDE PAYMENT FUNCTIONS
// ============================================

/**
 * Step 1: Make initial request to protected endpoint
 * Returns 402 response with payment requirements
 */
export async function requestWithPayment(
  endpoint: string,
  method: string = 'POST',
  body?: unknown
): Promise<Response> {
  const response = await fetch(endpoint, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // If 402, payment is required
  if (response.status === 402) {
    const paymentInfo: X402Response = await response.json();
    return response; // Return to trigger payment flow
  }

  return response;
}

/**
 * Step 2: Create USDC payment on blockchain
 * User signs transaction with their wallet (Privy)
 */
export async function createPayment(
  signer: ethers.Signer,
  paymentRequirement: PaymentRequirement
): Promise<PaymentPayload> {
  try {
    const { amount, asset, destination, network } = paymentRequirement;

    // USDC is an ERC-20 token, we need to call transfer()
    const usdcContract = new ethers.Contract(
      asset,
      [
        'function transfer(address to, uint256 amount) returns (bool)',
        'function decimals() view returns (uint8)',
      ],
      signer
    );

    // Convert amount to wei (USDC has 6 decimals)
    const decimals = await usdcContract.decimals();
    const amountInSmallestUnit = ethers.parseUnits(amount, decimals);

    // Execute transfer
    const tx = await usdcContract.transfer(destination, amountInSmallestUnit);
    const receipt = await tx.wait();

    // Get sender address
    const from = await signer.getAddress();

    // Create payment payload for x402
    const payload: PaymentPayload = {
      x402Version: X402_VERSION,
      scheme: 'exact',
      network,
      payload: {
        txHash: receipt.hash,
        from,
        to: destination,
        amount,
        timestamp: Math.floor(Date.now() / 1000),
      },
    };

    return payload;
  } catch (error) {
    console.error('Error creating payment:', error);
    throw new Error('Payment failed. Please try again.');
  }
}

/**
 * Step 3: Retry request with payment proof in X-PAYMENT header
 */
export async function retryWithPaymentProof(
  endpoint: string,
  method: string,
  paymentPayload: PaymentPayload,
  body?: unknown
): Promise<Response> {
  // Encode payment payload as base64
  const paymentHeader = btoa(JSON.stringify(paymentPayload));

  const response = await fetch(endpoint, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-PAYMENT': paymentHeader,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return response;
}

/**
 * Complete payment flow: Request → Pay → Retry
 * This is the main function your frontend will call
 */
export async function makePaymentAndRequest(
  endpoint: string,
  signer: ethers.Signer,
  method: string = 'POST',
  body?: unknown
): Promise<unknown> {
  try {
    // Step 1: Initial request
    const initialResponse = await requestWithPayment(endpoint, method, body);

    // If not 402, return response
    if (initialResponse.status !== 402) {
      return await initialResponse.json();
    }

    // Step 2: Parse payment requirements
    const paymentInfo: X402Response = await initialResponse.json();
    const paymentRequirement = paymentInfo.accepts[0].paymentRequirements;

    // Step 3: Execute payment on blockchain
    const paymentPayload = await createPayment(signer, paymentRequirement);

    // Step 4: Retry with payment proof
    const finalResponse = await retryWithPaymentProof(
      endpoint,
      method,
      paymentPayload,
      body
    );

    if (!finalResponse.ok) {
      throw new Error('Payment verification failed');
    }

    return await finalResponse.json();
  } catch (error) {
    console.error('Payment flow error:', error);
    throw error;
  }
}

// ============================================
// SERVER-SIDE VERIFICATION (for API routes)
// ============================================

/**
 * Verify payment on server side using facilitator
 * Called in Next.js API routes
 */
export async function verifyPayment(
  paymentPayload: PaymentPayload,
  paymentRequirement: PaymentRequirement
): Promise<boolean> {
  try {
    const response = await fetch(`${FACILITATOR_URL}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentPayload,
        paymentRequirements: paymentRequirement,
      }),
    });

    const result = await response.json();
    return result.valid === true;
  } catch (error) {
    console.error('Payment verification error:', error);
    return false;
  }
}

/**
 * Settle payment (finalize on blockchain)
 * CDP facilitator handles this automatically for USDC on Base
 */
export async function settlePayment(
  paymentPayload: PaymentPayload,
  paymentRequirement: PaymentRequirement
): Promise<{ settled: boolean; txHash?: string }> {
  try {
    const response = await fetch(`${FACILITATOR_URL}/settle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentPayload,
        paymentRequirements: paymentRequirement,
      }),
    });

    const result = await response.json();
    return {
      settled: result.success === true,
      txHash: result.txHash,
    };
  } catch (error) {
    console.error('Payment settlement error:', error);
    return { settled: false };
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Create payment requirement object for 402 response
 * Use this in your API routes when requiring payment
 */
export function createPaymentRequirement(
  amountUSDC: number,
  network: string = 'base-sepolia'
): PaymentRequirement {
  return {
    scheme: 'exact',
    network,
    amount: amountUSDC.toFixed(2),
    asset: USDC_ADDRESS,
    destination: PLATFORM_WALLET,
  };
}

/**
 * Create 402 response body
 */
export function create402Response(
  paymentRequirement: PaymentRequirement,
  message?: string
): X402Response {
  return {
    x402Version: X402_VERSION,
    accepts: [{ paymentRequirements: paymentRequirement }],
    message: message || 'Payment required to access this resource',
  };
}

/**
 * Parse X-PAYMENT header from request
 */
export function parsePaymentHeader(header: string): PaymentPayload | null {
  try {
    const decoded = atob(header);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Invalid payment header:', error);
    return null;
  }
}

// ============================================
// EXAMPLE USAGE IN FRONTEND COMPONENT
// ============================================
/*
import { makePaymentAndRequest } from '@/lib/x402';
import { useWallets } from '@privy-io/react-auth';

function JoinChallengeButton({ challengeId, entryFee }) {
  const { wallets } = useWallets();
  const [loading, setLoading] = useState(false);

  async function handleJoinChallenge() {
    setLoading(true);
    try {
      // Get ethers signer from Privy wallet
      const provider = await wallets[0].getEthersProvider();
      const signer = provider.getSigner();

      // Make payment and join challenge
      const result = await makePaymentAndRequest(
        `/api/challenges/${challengeId}/join`,
        signer,
        'POST',
        { challengeId }
      );

      toast.success(`Joined challenge! Paid $${entryFee} USDC`);
    } catch (error) {
      toast.error('Failed to join challenge');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleJoinChallenge} disabled={loading}>
      {loading ? 'Processing...' : `Join for $${entryFee} USDC`}
    </button>
  );
}
*/