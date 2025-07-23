// File: apps/frontend/app/api/execute/route.ts
import { NextResponse } from 'next/server';
import { wormhole, amount, Wormhole } from '@wormhole-foundation/sdk';
import solana from '@wormhole-foundation/sdk/solana';
import evm from '@wormhole-foundation/sdk/evm';
import { getSigner, getTokenDecimals } from '../../../../blockchain/token-bridge/helper';

export async function POST(req: Request) {
  try {
    // 從請求中獲取參數
    const body = await req.json();
    const { tokenID, amt, fromChain, toChain, bridge } = body;

    // 驗證必要參數
    if (!tokenID || !amt) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少必要參數: tokenID 和 amt' 
      }, { status: 400 });
    }

    const wh = await wormhole('Testnet', [solana, evm]);

    const sendChain = wh.getChain('Sepolia');
    const rcvChain = wh.getChain('Solana');

    const source = await getSigner(sendChain);
    const destination = await getSigner(rcvChain);

    // 使用從前端傳遞的參數
    const tokenId = Wormhole.tokenId(sendChain.chain, tokenID);
    const decimals = await getTokenDecimals(wh, tokenId, sendChain);
    const transferAmount = amount.units(amount.parse(amt.toString(), decimals));

    const automatic = false;
    const nativeGas = automatic ? amount.units(amount.parse('0.0', 6)) : 0n;

    const xfer = await wh.tokenTransfer(
      tokenId,
      transferAmount,
      source.address,
      destination.address,
      automatic,
      undefined,
      nativeGas
    );

    console.log('Starting Transfer');
    const srcTxids = await xfer.initiateTransfer(source.signer);
    console.log('Fetching Attestation');
    await xfer.fetchAttestation(25 * 60 * 1000); // 5 minutes
    console.log('Completing Transfer');
    const destTxids = await xfer.completeTransfer(destination.signer);

    return NextResponse.json({ success: true, srcTxids, destTxids });
  } catch (err) {
    console.error('❌ Error executing transfer:', err);
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : err }, { status: 500 });
  }
}
