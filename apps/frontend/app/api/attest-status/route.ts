import { NextRequest, NextResponse } from 'next/server';
import { Wormhole, wormhole } from '@wormhole-foundation/sdk';
import evm from '@wormhole-foundation/sdk/evm';
import solana from '@wormhole-foundation/sdk/solana';
import sui from '@wormhole-foundation/sdk/sui';
import { getSigner } from '../../../../blockchain/token-bridge/helper';

export async function POST(req: NextRequest) {
  try {
    const { tokenAddress, txHash } = await req.json();
    console.log('🔍 Checking attestation status for:', tokenAddress, 'tx:', txHash);

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

    // 檢查是否已經有 wrapped token
    try {
      const wrapped = await tbDest.getWrappedAsset(token);
      console.log(`✅ Wrapped token found:`, wrapped);
      
      return NextResponse.json({
        status: 'completed',
        wrappedTokenAddress: wrapped,
        attestTxHash: txHash,
        message: 'Token attestation completed successfully'
      });
    } catch {
      console.log(`🔄 Wrapped token not found yet for ${tokenAddress}`);
      
      // 嘗試檢查交易狀態以提供更詳細的資訊
      let detailedMessage = 'Attestation is still being processed by Guardian network';
      let processingStage = 'guardian_processing';
      
      try {
        if (txHash) {
          // 檢查交易是否已確認
          const txReceipt = await srcChain.getTransaction(txHash);
          if (txReceipt) {
            console.log('📋 Transaction confirmed, checking for VAA...');
            
            // 嘗試解析交易訊息
            try {
              const msgs = await srcChain.parseTransaction(txHash);
              if (msgs && msgs.length > 0) {
                console.log('📨 Wormhole messages found, VAA should be available soon');
                detailedMessage = 'Transaction confirmed. Guardian network is generating VAA...';
                processingStage = 'vaa_generation';
                
                // 嘗試獲取 VAA（不等待，只檢查是否已可用）
                try {
                  const wh = await wormhole('Testnet', [evm, solana, sui]);
                  const vaa = await wh.getVaa(msgs[0]!, 'TokenBridge:AttestMeta', 1000); // 1秒超時
                  if (vaa) {
                    console.log('✅ VAA is available, attestation should complete soon');
                    detailedMessage = 'VAA generated. Creating wrapped token on destination chain...';
                    processingStage = 'creating_wrapped_token';
                  }
                } catch {
                  // VAA 還未準備好
                }
              }
            } catch {
              console.log('📋 Could not parse transaction messages yet');
            }
          }
        }
      } catch (e) {
        console.log('⚠️ Could not check transaction details:', e);
      }
      
      return NextResponse.json({
        status: 'processing',
        message: detailedMessage,
        processingStage: processingStage,
        attestTxHash: txHash,
      });
    }

  } catch (e: any) {
    console.error('🔥 Status check failed:', e);
    return NextResponse.json(
      { error: 'Status check failed', message: e.message || 'unknown error' },
      { status: 500 }
    );
  }
}