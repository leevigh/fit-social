import { NextRequest, NextResponse } from 'next/server';
import { AptosAccount, AptosClient, Types } from 'aptos';

const MOVEMENT_RPC = 'https://aptos.testnet.porto.movementlabs.xyz/v1';
const movementClient = new AptosClient(MOVEMENT_RPC);

// Your gas sponsor wallet (load from secure env var)
const GAS_SPONSOR_PRIVATE_KEY = process.env.GAS_SPONSOR_PRIVATE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }

    // Create sponsor account from private key
    const sponsor = new AptosAccount(
      new Uint8Array(Buffer.from(GAS_SPONSOR_PRIVATE_KEY, 'hex'))
    );

    // Send 0.01 APT to fund the account (enough for ~100 transactions)
    const payload: Types.TransactionPayload = {
      type: 'entry_function_payload',
      function: '0x1::coin::transfer',
      type_arguments: ['0x1::aptos_coin::AptosCoin'],
      arguments: [
        address,
        '10000', // 0.0001 APT (adjust as needed)
      ],
    };

    const rawTxn = await movementClient.generateTransaction(
      sponsor.address(),
      payload
    );

    const signedTxn = await movementClient.signTransaction(sponsor, rawTxn);
    const txResult = await movementClient.submitTransaction(signedTxn);

    await movementClient.waitForTransaction(txResult.hash);

    console.log(`✅ Funded account ${address} with gas`);

    return NextResponse.json({
      success: true,
      txHash: txResult.hash,
      message: 'Account funded successfully',
    });
  } catch (error) {
    console.error('Error funding account:', error);
    return NextResponse.json(
      { error: 'Failed to fund account' },
      { status: 500 }
    );
  }
}