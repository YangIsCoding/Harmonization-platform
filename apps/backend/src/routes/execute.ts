// apps/backend/src/routes/execute.ts
import { wormhole, amount, Wormhole } from '@wormhole-foundation/sdk';
import solana from '@wormhole-foundation/sdk/solana';
import evm from '@wormhole-foundation/sdk/evm';
import { getSigner, getTokenDecimals } from '../../../../apps/blockchain/token-bridge/helper';
import type { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    // 可根據實際需求動態設定（或從 req.body 接收）
    const tokenAddress = '0x6fc891097e0049d160c82614c069688cdef81378';
    const fromChainName = 'Sepolia';
    const toChainName = 'Solana';
    const amountStr = '10';

    // Init Wormhole
    const wh = await wormhole('Testnet', [solana, evm]);
    const sendChain = wh.getChain(fromChainName);
    const rcvChain = wh.getChain(toChainName);

    // Load Signers
    const source = await getSigner(sendChain);
    const destination = await getSigner(rcvChain);

    // Setup token & amount
    const tokenId = Wormhole.tokenId(sendChain.chain, tokenAddress);
    const decimals = await getTokenDecimals(wh, tokenId, sendChain);
    const transferAmount = amount.units(amount.parse(amountStr, decimals));

    const automatic = false;
    const nativeGas = automatic ? amount.units(amount.parse('0.0', 6)) : 0n;

    // Construct transfer
    const xfer = await wh.tokenTransfer(
      tokenId,
      transferAmount,
      source.address,
      destination.address,
      automatic,
      undefined,
      nativeGas
    );

    console.log('🚀 Starting Transfer');
    const srcTxids = await xfer.initiateTransfer(source.signer);

    console.log('🕒 Fetching Attestation');
    const timeout = 5 * 60 * 1000;
    await xfer.fetchAttestation(timeout);

    console.log('✅ Completing Transfer');
    const destTxids = await xfer.completeTransfer(destination.signer);

    return res.json({
      success: true,
      bridge: 'Wormhole',
      txHash: srcTxids[0],            // source chain tx hash
      redeemTxHash: destTxids[0],     // destination chain tx hash
    });

  } catch (err: any) {
    console.error('❌ Transfer error:', err);
    return res.status(500).json({ error: err.message || 'Transfer Failed' });
  }
}
