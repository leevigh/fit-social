// app/api/challenges/[id]/join/route.ts - Example x402 API Route
import { NextRequest, NextResponse } from 'next/server';
import {
  createPaymentRequirement,
  create402Response,
  parsePaymentHeader,
  verifyPayment,
} from '@/lib/x402';
import { movementClient, getChallengeDetails } from '@/lib/movement';

/**
 * POST /api/challenges/[id]/join
 * 
 * This endpoint requires payment via x402 protocol
 * 
 * FLOW:
 * 1. First request (no X-PAYMENT header) → Return 402 with payment requirements
 * 2. Client pays on-chain
 * 3. Second request (with X-PAYMENT header) → Verify payment → Execute join
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const challengeId = parseInt(params.id);

  try {
    // Get challenge details to determine entry fee
    const challenge = await getChallengeDetails(challengeId);

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    if (!challenge.isActive) {
      return NextResponse.json(
        { error: 'Challenge is not active' },
        { status: 400 }
      );
    }

    // Check if payment header exists
    const paymentHeader = request.headers.get('X-PAYMENT');

    // CASE 1: No payment provided → Return 402
    if (!paymentHeader) {
      const entryFeeUSDC = challenge.entryFee / 1_000_000; // Convert from smallest unit

      const paymentRequirement = createPaymentRequirement(
        entryFeeUSDC,
        'base-sepolia' // or 'movement-testnet'
      );

      const response402 = create402Response(
        paymentRequirement,
        `Payment of $${entryFeeUSDC} USDC required to join this challenge`
      );

      return NextResponse.json(response402, {
        status: 402,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // CASE 2: Payment provided → Verify and process
    const paymentPayload = parsePaymentHeader(paymentHeader);

    if (!paymentPayload) {
      return NextResponse.json(
        { error: 'Invalid payment format' },
        { status: 400 }
      );
    }

    // Verify payment with facilitator
    const entryFeeUSDC = challenge.entryFee / 1_000_000;
    const paymentRequirement = createPaymentRequirement(entryFeeUSDC, 'base-sepolia');

    const isValid = await verifyPayment(paymentPayload, paymentRequirement);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 402 }
      );
    }

    // Payment verified! Now execute join_challenge on Movement
    // In production, you'd use a backend wallet to submit the transaction
    // For now, we'll just return success and let the frontend handle it

    return NextResponse.json({
      success: true,
      message: 'Payment verified. You can now join the challenge.',
      challengeId,
      paymentVerified: true,
      txHash: paymentPayload.payload.txHash,
    });

  } catch (error) {
    console.error('Error in join challenge:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// COMPLETE EXAMPLE WITH DATABASE
// ============================================
/*
import { prisma } from '@/lib/db'; // Example with Prisma

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const challengeId = parseInt(params.id);
  const paymentHeader = request.headers.get('X-PAYMENT');

  try {
    // Get challenge from database
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // If no payment, return 402
    if (!paymentHeader) {
      const paymentRequirement = createPaymentRequirement(
        challenge.entryFee,
        'base-sepolia'
      );
      const response402 = create402Response(paymentRequirement);
      return NextResponse.json(response402, { status: 402 });
    }

    // Verify payment
    const paymentPayload = parsePaymentHeader(paymentHeader);
    if (!paymentPayload) {
      return NextResponse.json({ error: 'Invalid payment' }, { status: 400 });
    }

    const paymentRequirement = createPaymentRequirement(challenge.entryFee, 'base-sepolia');
    const isValid = await verifyPayment(paymentPayload, paymentRequirement);

    if (!isValid) {
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 402 });
    }

    // Add participant to database
    await prisma.participant.create({
      data: {
        challengeId,
        userAddress: paymentPayload.payload.from,
        entryFeePaid: challenge.entryFee,
        paymentTxHash: paymentPayload.payload.txHash,
        joinedAt: new Date(),
      },
    });

    // Update challenge pool
    await prisma.challenge.update({
      where: { id: challengeId },
      data: {
        totalPool: { increment: challenge.entryFee },
        participantCount: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully joined challenge',
      challengeId,
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
*/