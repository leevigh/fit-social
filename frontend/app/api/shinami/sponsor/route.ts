import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/shinami/sponsor
 * 
 * Server-side endpoint to sponsor Movement transactions via Shinami.
 * This endpoint:
 * 1. Accepts a signed raw transaction from the client
 * 2. Calls Shinami API to sponsor gas fees
 * 3. Submits the sponsored transaction to the Movement network
 * 4. Returns the transaction hash
 * 
 * Security: SHINAMI_API_KEY is kept server-side only
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
interface SponsorRequest {
  rawTxn: any; // Raw transaction object from Aptos SDK
  senderAddress: string;
  userPublicKey: string;
  userSignature: string;
  network?: string;
  chainId?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Validate required environment variables
    const shinamiApiKey = process.env.SHINAMI_API_KEY;
    const shinamiApiUrl = process.env.SHINAMI_API_URL || 'https://api.shinami.com';

    if (!shinamiApiKey) {
      console.error('❌ SHINAMI_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Gas sponsorship service is not configured' },
        { status: 500 }
      );
    }

    // Parse and validate request body
    const body: SponsorRequest = await request.json();
    const { rawTxn, senderAddress, userPublicKey, userSignature, network, chainId } = body;

    if (!rawTxn || !senderAddress || !userPublicKey || !userSignature) {
      return NextResponse.json(
        { error: 'Missing required fields: rawTxn, senderAddress, userPublicKey, userSignature' },
        { status: 400 }
      );
    }

    console.log('[Shinami Sponsor] Received sponsorship request:', {
      senderAddress,
      network: network || 'unknown',
      chainId,
      hasRawTxn: !!rawTxn,
    });

    // TODO: Adapt this to Shinami's actual API contract
    // Based on typical gas sponsorship APIs, this is a generalized implementation
    // You may need to adjust the payload structure based on Shinami's documentation
    
    // Convert rawTxn to the format Shinami expects
    // This might need adjustment based on Shinami's actual API requirements
    const sponsorPayload = {
      transaction: rawTxn,
      sender: senderAddress,
      publicKey: userPublicKey,
      signature: userSignature,
      network: network || 'movement-testnet',
      chainId: chainId,
    };

    // Call Shinami API to sponsor the transaction
    const shinamiResponse = await fetch(`${shinamiApiUrl}/sponsor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${shinamiApiKey}`,
        // Some APIs use X-API-Key header instead:
        // 'X-API-Key': shinamiApiKey,
      },
      body: JSON.stringify(sponsorPayload),
    });

    if (!shinamiResponse.ok) {
      const errorText = await shinamiResponse.text();
      console.error('[Shinami Sponsor] API error:', {
        status: shinamiResponse.status,
        statusText: shinamiResponse.statusText,
        error: errorText,
      });

      return NextResponse.json(
        {
          error: 'Failed to sponsor transaction',
          details: errorText || shinamiResponse.statusText,
        },
        { status: shinamiResponse.status || 500 }
      );
    }

    const sponsorResult = await shinamiResponse.json();

    // Handle different response formats from Shinami
    // Some APIs return { transactionHash }, others return { hash }, etc.
    const transactionHash = 
      sponsorResult.transactionHash ||
      sponsorResult.hash ||
      sponsorResult.txHash ||
      sponsorResult.tx_hash;

    if (!transactionHash) {
      console.error('[Shinami Sponsor] Unexpected response format:', sponsorResult);
      return NextResponse.json(
        { error: 'Invalid response from sponsorship service' },
        { status: 500 }
      );
    }

    console.log('[Shinami Sponsor] Transaction sponsored successfully:', transactionHash);

    return NextResponse.json({
      success: true,
      transactionHash,
      sponsored: true,
    });
  } catch (error) {
    console.error('[Shinami Sponsor] Unexpected error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

