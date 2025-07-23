'use client';

import React from 'react';

export default function TechDocs() {
  return (
    <div style={{ minHeight: '100vh', padding: '40px 20px' }}>
      {/* Navbar */}
      <nav className="navbar">
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>
            <a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              🔁 Harmonization Platform
            </a>
          </h1>
          <div style={{ display: 'flex', gap: '24px' }}>
            <a href="/tech-docs" style={{ fontWeight: '600', color: 'var(--accent-orange)' }}>Tech Docs</a>
            <a href="/risk-docs" style={{ fontWeight: '600' }}>Risk Docs</a>
            <a href="/" style={{ fontWeight: '600' }}>Home</a>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '800px', margin: '40px auto 0' }}>
        <div className="card">
          <h1>Technical report</h1>
          
          <section style={{ marginBottom: '32px' }}>
            <h2>Project in brief</h2>
            <p style={{ marginBottom: '16px' }}>
              Harmonization Platform is an enterprise-grade cross-chain asset transfer platform specifically designed for secure token transfers between the Ethereum and Solana ecosystems.
              We integrate highly audited bridging protocols, including Wormhole and Allbridge, to provide institutional-grade security and performance optimization.
            </p>
            
            <h3>Core Value</h3>
            <ul style={{ marginBottom: '16px' }}>
              <li><strong>Security First:</strong> Ensures asset safety through multi-signature, real-time monitoring, and smart contract audits</li>
              <li><strong>Cost Optimization:</strong> Uses dynamic routing algorithms to select the most economical cross-chain path</li>
              <li><strong>Risk Transparency:</strong> Real-time risk assessment and visualization based on GARCH models</li>
              <li><strong>Developer-Friendly:</strong> Full support for RESTful APIs and SDKs</li>

            </ul>

            <h3>Highlight</h3>
            <div style={{ background: 'var(--background-cream)', padding: '16px', borderRadius: '8px' }}>
              <ul>
                <li>🔒 <strong>Zero-Knowledge Proof Verification:</strong> Ensures transaction privacy</li>
                <li>⚡ <strong>Parallel Processing Architecture:</strong> Supports simultaneous processing of multiple cross-chain transactions</li>
                <li>📊 <strong>Machine Learning Risk Models:</strong> Predicts market volatility and optimal execution timing</li>
                <li>🔄 <strong>Automatic Retry Mechanism:</strong> Intelligently handles network congestion and temporary failures</li>
                <li>💎 <strong>MEV Protection:</strong> Prevents front-running and sandwich attacks</li>

              </ul>
            </div>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2>System Architechture</h2>
            
            <div style={{ marginBottom: '24px' }}>
              <h3>System flow</h3>
              <div style={{ 
                background: 'var(--background-cream)', 
                padding: '24px', 
                borderRadius: '12px',
                textAlign: 'center',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '14px', color: 'var(--text-light)' }}>
                  [Frontend] ↔ [API Gateway] ↔ [Risk Engine] ↔ [Bridge Orchestrator] ↔ [Blockchain Nodes]
                </div>
              </div>
            </div>

            <h3>Tech stack</h3>
            <div style={{ background: 'var(--background-cream)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
              <ul>
                <li><strong>Next.js 14</strong> – A modern React framework using the App Router, supporting SSR and SSG</li>
                <li><strong>TypeScript 5.8+</strong> – Strict type checking to reduce runtime errors</li>
                <li><strong>Ethers.js 6.x</strong> – A modern Ethereum interaction library supporting EIP-1193</li>
                <li><strong>Turbopack</strong> – A blazing-fast build tool, 10x faster than Webpack</li>
                <li><strong>CSS Variables</strong> – Enables dynamic theming and responsive design</li>
                <li><strong>Web3Modal</strong> – Multi-wallet connection support (MetaMask, WalletConnect, etc.)</li>

              </ul>
            </div>

            <h3>Backend Architecture</h3>
<div style={{ background: 'var(--background-cream)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
  <ul>
    <li><strong>Node.js 18+ LTS</strong> – High-performance JavaScript runtime environment</li>
    <li><strong>Express.js</strong> – Lightweight web framework with middleware support</li>
    <li><strong>TypeScript</strong> – Full-stack type safety</li>
    <li><strong>Redis</strong> – High-performance caching and session management</li>
    <li><strong>PostgreSQL</strong> – Reliable relational database for storing transaction records</li>
    <li><strong>Bull Queue</strong> – Distributed task queue for handling long-running bridge operations</li>
    <li><strong>Winston</strong> – Structured logging system</li>
  </ul>
</div>

            <h3>Blockchain Integration Layer</h3>
<div style={{ background: 'var(--background-cream)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
  <h4>Ethereum Integration</h4>
  <ul style={{ marginBottom: '12px' }}>
    <li><strong>Alchemy/Infura RPC</strong> – Enterprise-grade node service</li>
    <li><strong>Sepolia Testnet</strong> – Stable testing environment</li>
    <li><strong>EIP-1559</strong> – Smart gas fee calculation</li>
    <li><strong>Multicall</strong> – Optimized batch contract calls</li>
  </ul>
  
  <h4>Solana Integration</h4>
  <ul>
    <li><strong>Solana Web3.js</strong> – Official JavaScript SDK</li>
    <li><strong>Devnet/Testnet</strong> – High-speed test environments</li>
    <li><strong>SPL Token Program</strong> – Token standard support</li>
    <li><strong>Priority Fees</strong> – Dynamic fee optimization</li>
  </ul>
</div>

            <h3>Bridge Protocol Integration</h3>
<div style={{ background: 'var(--background-cream)', padding: '16px', borderRadius: '8px' }}>
  <h4>Wormhole V2</h4>
  <ul style={{ marginBottom: '12px' }}>
    <li><strong>Guardian Network</strong> – Secure network of 19 validator nodes</li>
    <li><strong>VAA (Verifiable Action Approval)</strong> – Verifiable cross-chain messages</li>
    <li><strong>Automatic Relayer</strong> – Automated transaction fulfillment</li>
  </ul>
              
              <h4>Allbridge Core</h4>
              <ul>
                <li><strong>Liquidity Pools</strong> - Decentralize liquidity provider</li>
                <li><strong>Gasless Transfers</strong> - Decrease gas fee burden</li>
                <li><strong>Price Oracle</strong> - Ontime price</li>
              </ul>
            </div>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2>API Endpoint</h2>
            <p style={{ marginBottom: '24px' }}>
              
Our RESTful API adopts the OpenAPI 3.0 specification and supports requests and responses in JSON format. All endpoints require proper authentication and rate limiting protection.
            </p>
            
            <div style={{ background: 'var(--background-cream)', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
              <h3>🔗 POST /api/attest</h3>
              <p><strong>Function:</strong> Register and certify tokens on the Wormhole bridge and establish cross-chain mapping relationships</p>
              <p><strong>Verification:</strong>Requires a valid API Key or wallet signature</p>
              <p><strong>Restrict:</strong> Up to 10 requests per minute</p>
              
              <h4>Request Parameter:</h4>
              <pre style={{ background: 'white', padding: '12px', borderRadius: '4px', overflow: 'auto' }}>
{`{
  "tokenAddress": "0x...",           
  "sourceChain": "ethereum",     
  "targetChain": "solana",         
  "attestationType": "standard"    
}`}
              </pre>
              
              <h4>Respond Format</h4>
              <pre style={{ background: 'white', padding: '12px', borderRadius: '4px', overflow: 'auto' }}>
{`{
  "success": true,
  "wrappedTokenAddress": {
    "address": "7xKXtg2CW87...",
    "chain": "solana",
    "decimals": 6
  },
  "attestationId": "0x456...",
  "estimatedTime": 1500,            
  "transactionHash": "0x789..."
}`}
              </pre>
            </div>

            <div style={{ background: 'var(--background-cream)', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
              <h3>🚀 POST /api/manual-transfer</h3>
              <p><strong>Function:</strong> Perform cross-chain token transfer and support multiple bridging protocols</p>
              <p><strong>Authentication:</strong> Wallet signature verification required</p>
              <p><strong>Limits:</strong> Maximum 100 requests per hour</p>
              
              <h4>Request parameters:</h4>
              <pre style={{ background: 'white', padding: '12px', borderRadius: '4px', overflow: 'auto' }}>
{`{
  "tokenID": "0x...", // Token contract address
  "amt": "1000.50", // Transfer quantity (string format to avoid precision issues)
  "fromChain": "ethereum", // source chain
  "toChain": "solana", // target chain
  "fromAccount": "0x123...", // Sender's address
  "toAccount": "7xKXtg2CW...", // Receiver address
  "bridge": "wormhole", // Bridge protocol selection
  "slippageTolerance": 0.005, // Slippage tolerance (optional)
  "deadline": 1640995200 // Transaction deadline (optional)
}`}
              </pre>
              
             <h4>Response format:</h4>
              <pre style={{ background: 'white', padding: '12px', borderRadius: '4px', overflow: 'auto' }}>
{`{
  "success": true,
  "transferId": "tx_456789",
  "srcTxids": ["0xabc...", "0xdef..."],
  "destTxids": ["5Kj7Nt..."],
  "status": "completed",
  "totalCost": {
    "gasCostUSDT": 12.50,
    "bridgeFeeUSDT": 2.00,
    "totalUSDT": 14.50
  },
  "executionTime": 1432, // Actual execution time (seconds)
  "confirmations": {
    "source": 12,
    "destination": 32
  }
}`}
              </pre>
            </div>

           <div style={{ background: 'var(--background-cream)', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
              <h3>📊 POST /api/risk</h3>
              <p><strong>Features:</strong> Real-time risk assessment and cost analysis based on GARCH model</p>
              <p><strong>Authentication:</strong> Requires API Key</p>
              <p><strong>Limit:</strong> Maximum 60 requests per minute</p>
              
              <h4>Request parameters:</h4>
              <pre style={{ background: 'white', padding: '12px', borderRadius: '4px', overflow: 'auto' }}>
{`{
  "amountIn": 1000, // Enter the amount
  "tokenSymbol": "USDT", // Token symbol
  "sourceChain": "ethereum", // source chain
  "targetChain": "solana", // target chain
  "timeHorizon": 24, // Risk assessment time range (hours)
  "confidenceLevel": 0.95 // Confidence level
}`}
              </pre>
              
              <h4>Response format:</h4>
              <pre style={{ background: 'white', padding: '12px', borderRadius: '4px', overflow: 'auto' }}>
{`{
  "success": true,
  "riskAnalysis": {
    "volatilityRisk": {
      "currentVolatility": 0.0235,
      "adjustedVolatility": 0.0289,
      "zScore": 1.23,
      "priceRange": [0.9945, 1.0055]
    },
    "liquidityRisk": {
      "slippageCost": 0.50,
      "marketImpact": 0.0012,
      "availableLiquidity": 2500000
    },
    "bridgeRisk": {
      "protocolStatus": "operational",
      "historicalFailureRate": 0.001,
      "averageTransferTime": 1425
    }
  },
  "costEstimate": {
    "totalCostUSDT": 15.75,
    "breakdown": {
      "ethGasCost": 8.25,
      "solanaFee": 0.01,
      "bridgeFee": 2.00,
      "slippageCost": 5.49
    }
  },
  "recommendation": {
    "action": "proceed", // proceed/wait/decline
    "optimalTiming": "immediate", // immediate/wait_1h/wait_24h
    "reason": "Market conditions are good, it is recommended to execute immediately"
  }
}`}
              </pre>
            </div>

            <div style={{ background: 'var(--background-cream)', padding: '20px', borderRadius: '8px' }}>
              <h3>📈 GET /api/status/[transferId]</h3>
              <p><strong>Function:</strong> Query the real-time status of a specific transfer transaction</p>
              
              <h4>Response format:</h4>
              <pre style={{ background: 'white', padding: '12px', borderRadius: '4px', overflow: 'auto' }}>
{`{
  "transferId": "tx_456789",
  "status": "in_progress", // pending/in_progress/completed/failed
  "currentStep": "bridging", // initiated/attested/bridging/completing
  "progress": 75, // completion percentage
  "estimatedCompletion": 300, // Estimated remaining time (seconds)
  "transactionHashes": {
    "source": "0xabc...",
    "bridge": "0xdef...",
    "destination": null
  }
}`}
              </pre>
            </div>
          </section>

         <section style={{ marginBottom: '32px' }}>
            <h2>Security Features</h2>
            <ul>
              <li><strong>Multi-signature verification</strong> - ensuring transaction security</li>
              <li><strong>Real-time risk assessment</strong> - dynamic analysis of market risks</li>
              <li><strong>Gas Fee Optimization</strong> - Intelligent calculation of the best handling fee</li>
              <li><strong>Cross-chain status synchronization</strong> - ensuring transaction consistency</li>
              <li><strong>Error handling mechanism</strong> - complete exception handling process</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2>Development Guide</h2>
            
            <h3>Environment settings</h3>
            <div style={{ background: 'var(--background-cream)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
              <code>
                {`# Install dependencies
npm install

# Start development server
npm rundev

# Build production version
npm run build

#Perform type checking
npm run check-types`}
              </code>
            </div>

           <h3>Environment variables</h3>
            <div style={{ background: 'var(--background-cream)', padding: '16px', borderRadius: '8px' }}>
              <code>
                {`# .env.local
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
PRIVATE_KEY=your_private_key
SOLANA_PRIVATE_KEY=your_solana_key`}
              </code>
            </div>
          </section>

          <section>
            <h2>Deployment instructions</h2>
            <p>
              This project uses Turborepo monolithic architecture to support unified management and deployment of front-end and back-end.
              It is recommended to use Vercel for front-end deployment, and back-end services can be deployed to AWS or GCP.
            </p>
            
           <h3>Deployment steps</h3>
            <ol>
              <li>Ensure all environment variables are configured correctly</li>
              <li>Execute complete test suite</li>
              <li>Build production version</li>
              <li>Deploy to target environment</li>
              <li>Verify that all API endpoints are functioning properly</li>
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}