import { NextRequest, NextResponse } from 'next/server';
import { Wormhole, signSendWait, wormhole } from '@wormhole-foundation/sdk';
import evm from '@wormhole-foundation/sdk/evm';
import solana from '@wormhole-foundation/sdk/solana';
import sui from '@wormhole-foundation/sdk/sui';
import { getSigner } from '../../../../blockchain/token-bridge/helper'; // 確保這路徑正確

export async function POST(req: NextRequest) {
  try {
    const { tokenAddress } = await req.json();
    console.log('🔗 Token address from frontend:', tokenAddress);

    if (!tokenAddress) {
      return NextResponse.json(
        { error: 'Missing tokenAddress' },
        { status: 400 }
      );
    }

    const wh = await wormhole('Testnet', [evm, solana, sui]);
    const srcChain = wh.getChain('Sepolia');
    const destChain = wh.getChain('Solana');
    const token = Wormhole.tokenId(srcChain.chain, tokenAddress);
    const gasLimit = BigInt(2_500_000);

    // Get signer for Solana
    const { signer: destSigner } = await getSigner(destChain, gasLimit);
    const tbDest = await destChain.getTokenBridge();

    try {
        const wrapped = await tbDest.getWrappedAsset( token );
        
      console.log(`✅ Token already wrapped on ${destChain.chain}:`, wrapped);
      return NextResponse.json({
        status: 'alreadyWrapped',
        wrappedTokenAddress: wrapped,
      });
    } catch {
      console.log(`🔄 No wrapped token found on ${destChain.chain}. Attesting...`);
    }

    // Get signer for Sepolia
    const { signer: origSigner } = await getSigner(srcChain);
    const tbOrig = await srcChain.getTokenBridge();

    // Create attestation tx
    const attestTxns = tbOrig.createAttestation(
      token.address,
      Wormhole.parseAddress(origSigner.chain(), origSigner.address())
    );

    const txids = await signSendWait(srcChain, attestTxns, origSigner);
    const txid = txids[0]!.txid;
    console.log('📦 Attestation tx sent. Hash:', txid);
    
    // 立即返回 transaction hash，讓前端可以顯示
    // 但仍需要繼續等待 VAA 生成
    console.log('🚀 Returning immediate tx hash to frontend:', txid);

    const msgs = await srcChain.parseTransaction(txid);
    const vaa = await wh.getVaa(msgs[0]!, 'TokenBridge:AttestMeta', 25 * 60 * 1000);
    if (!vaa) throw new Error('❌ VAA not found after waiting');

    const subAttestation = tbDest.submitAttestation(
      vaa,
      Wormhole.parseAddress(destSigner.chain(), destSigner.address())
    );

    const tsx = await signSendWait(destChain, subAttestation, destSigner);
    console.log('✅ Attestation on Solana done. Tx:', tsx);

    // ✅ 再次取得 wrapped token address
    const wrapped = await tbDest.getWrappedAsset(token);

    return NextResponse.json({
      attestTxHash: txid,  // Ethereum attestation tx hash
      solanaSubmissionHash: tsx[0]?.txid || 'unknown',  // Solana submission tx hash
      wrappedTokenAddress: wrapped,
      status: 'success',
    });

  } catch (e: any) {
    console.error('🔥 Attestation failed:', e);
    return NextResponse.json(
      { error: 'Attestation failed', message: e.message || 'unknown error' },
      { status: 500 }
    );
  }
}
