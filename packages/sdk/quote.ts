import { BridgeQuote } from '../types'; // 或改成 '@types' 如果 alias 有設定好

export async function getMockBridgeQuotes(
  fromChain: string,
  toChain: string,
  amount: number
): Promise<BridgeQuote[]> {
  console.log(`📥 Mock quote request: ${amount} USDT from ${fromChain} → ${toChain}`);
  
  return [
    {
      bridge: 'Stargate',
      cost: 0.95,
      slippage: 0.1,
      latency: 3.2,
      riskScore: 2
    },
    {
      bridge: 'LayerZero',
      cost: 1.1,
      slippage: 0.05,
      latency: 4.0,
      riskScore: 3
    },
    {
      bridge: 'Wormhole',
      cost: 1.2,
      slippage: 0.2,
      latency: 2.8,
      riskScore: 4
    }
  ];
}
