'use client';

import React from 'react';

export default function RiskDocs() {
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
            <a href="/tech-docs" style={{ fontWeight: '600' }}>Tech Docs</a>
            <a href="/risk-docs" style={{ fontWeight: '600', color: 'var(--accent-orange)' }}>Risk Docs</a>
            <a href="/" style={{ fontWeight: '600' }}>Home</a>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '800px', margin: '40px auto 0' }}>
        <div className="card">
          <h1>Risk Management Documentation</h1>
          
          <section style={{ marginBottom: '32px' }}>
            <h2>Risk Assessment Overview</h2>
            <p>
              The Harmonization Platform adopts a multi-layered risk assessment mechanism that covers market risk, technical risk, and liquidity risk, providing users with comprehensive risk analysis and cost evaluation.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2>Risk Type Analysis</h2>
            
            <h3>1. Short-Term Trading Risks</h3>
            <div style={{ background: 'var(--background-cream)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
              <h4>Price Volatility Risk</h4>
              <ul>
                <li><strong>GARCH Model Prediction</strong> - Predicts short-term price movement based on historical volatility</li>
                <li><strong>95% Confidence Interval</strong> - Provides price range prediction</li>
                <li><strong>Z-Score Analysis</strong> - Evaluates how far current prices deviate from normal levels</li>
              </ul>
              
              <h4>Liquidity Risk</h4>
              <ul>
                <li><strong>Slippage Cost Calculation</strong> - Estimates impact of 50 bps slippage</li>
                <li><strong>Market Depth Analysis</strong> - Evaluates the impact of large trades on the market</li>
                <li><strong>AMM Pool Monitoring</strong> - Real-time liquidity status of DEXs like Raydium</li>
              </ul>
            </div>

            <h3>2. Bridge Protocol Risks</h3>
            <div style={{ background: 'var(--background-cream)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
              <h4>Wormhole Risk Assessment</h4>
              <ul>
                <li><strong>Security Level:</strong> High (Mature protocol audited multiple times)</li>
                <li><strong>TVL:</strong> Over $2B, indicating strong market trust</li>
                <li><strong>Historical Events:</strong> Attacked in 2022 but fully patched</li>
                <li><strong>Monitoring Metrics:</strong> Real-time bridge status, validator network health</li>
              </ul>
              
              <h4>Allbridge Risk Assessment</h4>
              <ul>
                <li><strong>Security Level:</strong> Medium (Newer protocol with limited audit coverage)</li>
                <li><strong>TVL:</strong> Around $50M, relatively small market size</li>
                <li><strong>Technical Risk:</strong> Higher smart contract complexity</li>
                <li><strong>Recommendation:</strong> Use only for small test transactions</li>
              </ul>
            </div>

            <h3>3. Long-Term Holding Risks</h3>
            <div style={{ background: 'var(--background-cream)', padding: '16px', borderRadius: '8px' }}>
              <h4>Issuer Risk</h4>
              <ul>
                <li><strong>USDT Risk Level:</strong> Medium (Higher degree of centralization)</li>
                <li><strong>USDC Risk Level:</strong> Low (Better regulatory compliance)</li>
                <li><strong>Monitoring Metrics:</strong> Reserve transparency, regulatory compliance status</li>
              </ul>
              
              <h4>Depeg Risk</h4>
              <ul>
                <li><strong>Monitoring Threshold:</strong> Warning triggered if deviation exceeds 0.5% from $1.00</li>
                <li><strong>Alert System:</strong> Real-time monitoring of price deviation across exchanges</li>
                <li><strong>Countermeasures:</strong> Auto-suggest delay or alternative routes</li>
              </ul>
            </div>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2>Cost Analysis Framework</h2>
            
            <h3>Gas Fee Estimation</h3>
            <div style={{ background: 'var(--background-cream)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
              <h4>Ethereum Gas Fees</h4>
              <ul>
                <li><strong>Real-Time Gas Price:</strong> Retrieved via Alchemy API</li>
                <li><strong>Gas Limit Estimation:</strong> Accurate calculation based on transaction type</li>
                <li><strong>Optimization Suggestions:</strong> Recommends optimal timing based on network congestion</li>
              </ul>
              
              <h4>Solana Transaction Fees</h4>
              <ul>
                <li><strong>Fixed Fee Structure:</strong> Approx. 0.000005 SOL per transaction</li>
                <li><strong>Priority Fee:</strong> Additional fee during congestion</li>
                <li><strong>Cost Forecast:</strong> Precise fee estimation in USDT</li>
              </ul>
            </div>

            <h3>Bridge Fees</h3>
            <div style={{ background: 'var(--background-cream)', padding: '16px', borderRadius: '8px' }}>
              <ul>
                <li><strong>Wormhole Fees:</strong> Dynamically adjusted bridge fees</li>
                <li><strong>DEX Trading Fees:</strong> Standard 0.1% fee on Raydium</li>
                <li><strong>Total Cost Calculation:</strong> Full cost breakdown across all intermediate steps</li>
              </ul>
            </div>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2>Risk Monitoring System</h2>
            
            <h3>Real-Time Monitoring Metrics</h3>
            <ul>
              <li><strong>Price Deviation Monitoring:</strong> Price comparison across exchanges</li>
              <li><strong>Liquidity Monitoring:</strong> AMM pool tracking</li>
              <li><strong>Network Health:</strong> Blockchain network status monitoring</li>
              <li><strong>Bridge Status:</strong> Cross-chain bridge operation status</li>
            </ul>

            <h3>Risk Scoring System</h3>
            <div style={{ background: 'var(--background-cream)', padding: '16px', borderRadius: '8px' }}>
              <ul>
                <li><strong>Low Risk (1–3):</strong> Normal market conditions, trade recommended</li>
                <li><strong>Medium Risk (4–6):</strong> Higher volatility, trade cautiously</li>
                <li><strong>High Risk (7–10):</strong> Abnormal market, delay trade</li>
              </ul>
            </div>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2>Risk Reports</h2>
            
            <h3>Downloadable Reports</h3>
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
              <a 
                href="/reports/USDT-risk-report.pdf" 
                download
                className="btn-secondary"
                style={{ textDecoration: 'none' }}
              >
                📄 USDT Risk Assessment Report
              </a>
            </div>

            <h3>Report Contents Include</h3>
            <ul>
              <li>Detailed risk analysis methodology</li>
              <li>Historical backtesting results</li>
              <li>Risk assessment under various market scenarios</li>
              <li>Portfolio risk management recommendations</li>
              <li>Regulatory compliance analysis</li>
            </ul>
          </section>

          <section>
            <h2>Recommendations and Best Practices</h2>
            
            <h3>Pre-Trade Checklist</h3>
            <ol>
              <li>Check depeg risk of the target token</li>
              <li>Assess current market volatility</li>
              <li>Confirm bridge protocol operational status</li>
              <li>Calculate total trading cost and compare with expected return</li>
              <li>Set a reasonable slippage tolerance</li>
            </ol>

            <h3>Risk Management Strategies</h3>
            <ul>
              <li><strong>Trade in Batches:</strong> Split large transactions into multiple smaller ones</li>
              <li><strong>Time Diversification:</strong> Avoid trading during high volatility periods</li>
              <li><strong>Post-Trade Monitoring:</strong> Continue monitoring asset status after trade</li>
              <li><strong>Backup Plans:</strong> Prepare multiple bridging options in case of emergencies</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
