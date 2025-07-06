export interface QuoteRequest {
    fromChain: string;
    toChain: string;
    amount: number;
  }
  
  export interface BridgeQuote {
    bridge: 'Stargate' | 'LayerZero' | 'Wormhole';
    cost: number;
    slippage: number;
    latency: number;
    riskScore: number;
  }
  