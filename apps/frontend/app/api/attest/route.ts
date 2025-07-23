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

    // 驗證 Ethereum 地址格式
    if (!tokenAddress.startsWith('0x') || tokenAddress.length !== 42) {
      return NextResponse.json(
        { 
          error: 'Invalid token address format', 
          message: 'Ethereum address must be 42 characters long and start with 0x (e.g., 0x1234...abcd)' 
        },
        { status: 400 }
      );
    }

    // 檢查是否為有效的十六進制字符
    const hexPattern = /^0x[0-9a-fA-F]{40}$/;
    if (!hexPattern.test(tokenAddress)) {
      return NextResponse.json(
        { 
          error: 'Invalid token address format', 
          message: 'Token address contains invalid characters. Only hexadecimal characters (0-9, a-f, A-F) are allowed.' 
        },
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
        status: 'success',
        wrappedTokenAddress: wrapped,
        message: 'Token already attested and wrapped successfully',
        alreadyWrapped: true
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
    
    // 檢查是否已經有 wrapped token（如果有的話，立即返回）
    try {
      const existingWrapped = await tbDest.getWrappedAsset(token);
      console.log('✅ Token already wrapped, returning immediately');
      return NextResponse.json({
        attestTxHash: txid,
        wrappedTokenAddress: existingWrapped,
        status: 'success',
        message: 'Transaction submitted, token already wrapped'
      });
    } catch {
      console.log('🔄 Token not wrapped yet, proceeding with full attestation process');
    }

    // 解析交易以獲取 Wormhole 訊息
    console.log('📋 Parsing transaction to get Wormhole message...');
    const msgs = await srcChain.parseTransaction(txid);
    console.log('Parsed Messages:', msgs);

    if (!msgs || msgs.length === 0) {
      throw new Error('No Wormhole messages found in transaction');
    }

    // 等待 Guardian 網絡生成 VAA
    console.log('⏳ Waiting for Guardian network to generate VAA...');
    const timeout = 25 * 60 * 1000; // 25 分鐘超時
    const vaa = await wh.getVaa(msgs[0]!, 'TokenBridge:AttestMeta', timeout);
    
    if (!vaa) {
      throw new Error('VAA not found after timeout. Guardian network processing may be delayed.');
    }

    console.log('✅ VAA received! Token Address:', vaa.payload.token.address);

    // 在目標鏈提交 attestation
    console.log('🔗 Submitting attestation on destination chain...');
    const subAttestation = tbDest.submitAttestation(
      vaa,
      Wormhole.parseAddress(destSigner.chain(), destSigner.address())
    );

    const destTxids = await signSendWait(destChain, subAttestation, destSigner);
    console.log('🎯 Destination chain transaction:', destTxids);

    // 輪詢等待包裝資產生成
    console.log('🔄 Polling for wrapped asset creation...');
    let attempts = 0;
    const maxAttempts = 30; // 最多嘗試 30 次，每次間隔 2 秒

    while (attempts < maxAttempts) {
      try {
        const wrapped = await tbDest.getWrappedAsset(token);
        console.log('🎉 Wrapped asset created successfully:', wrapped);
        
        return NextResponse.json({
          attestTxHash: txid,
          wrappedTokenAddress: wrapped,
          status: 'success',
          message: 'Token attestation completed successfully',
        });
      } catch {
        attempts++;
        console.log(`⏳ Wrapped asset not ready yet (attempt ${attempts}/${maxAttempts}), waiting...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // 如果經過所有嘗試仍未成功，返回中間狀態
    throw new Error('Wrapped asset creation timed out after maximum attempts');

  } catch (e: any) {
    console.error('🔥 Attestation failed:', e);
    return NextResponse.json(
      { error: 'Attestation failed', message: e.message || 'unknown error' },
      { status: 500 }
    );
  }
}
