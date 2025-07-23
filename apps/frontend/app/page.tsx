'use client';

import React, { useState } from 'react';
import { ethers } from 'ethers';
import { ERC20_ABI, ERC20_BYTECODE } from '../lib/erc20';
import issuerRisk from './issuerRisk.json';

type SettlementQuote = {
  symbol: string;
  totalCost: number;
  waitTime: number;
  priceRange: [number, number];
  margin: number;
};

type Quote = {
  amountOut: number;
  priceRange: { lower: number; upper: number };
  depegRisk: { isAtRisk: boolean; oraclePrice: number; deviation: number };
  bridgeStatus: { status: string; message: string };
  totalCostUSDT: number;
  gasCostUSDT: number;
  solanaFeeUSDT: number;
  raydiumFee: number;
  minReceivedAfterSlippage: number;
  slippageCost: number;
  timeHorizon: number;
  ethTxTime: number;
  bridgeTime: number;
  solTxTime: number;
  adjustedVolatility: number;
  priceImpactManual: number;
  zScore: number;
  priceEff: number;
  priceInit: number;
  ethGasPrice: number;
  ethGasLimit: number;
  gasCostETH: number;
  volatility: number;
};

function formatCurrency(value: number, decimals = 6, currency = 'USD') {
  if (typeof value !== 'number' || isNaN(value)) return '-';
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatTime(seconds: number) {
  if (typeof seconds !== 'number' || isNaN(seconds)) return '-';
  if (seconds < 60) return `${seconds.toFixed(2)}s`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(2)}m`;
  return `${(seconds / 3600).toFixed(2)}h`;
}

function formatPercentage(value: number, decimals = 6) {
  if (typeof value !== 'number' || isNaN(value)) return '-';
  return `${(value * 100).toFixed(decimals)}%`;
}

function formatNumber(value: number, decimals = 4) {
  if (typeof value !== 'number' || isNaN(value)) return '-';
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

const QuoteSummary: React.FC<{
  amount: string;
}> = ({ amount }) => {
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleGetQuote = async () => {
    setLoading(true);
    setError(null);
    setQuote(null);
    try {
      const res = await fetch('/api/risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountIn: parseFloat(amount) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || res.statusText);
      }
      const data = await res.json();
      setQuote(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch quote');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div style={{ textAlign: 'center' }}>
        <button
          className="btn-secondary"
          onClick={handleGetQuote}
          disabled={loading || !amount || isNaN(Number(amount)) || Number(amount) <= 0}
        >
          {loading ? 'Calculating...' : 'Get Quote'}
        </button>
      </div>
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      {quote && (
        <div style={{ marginTop: '20px' }}>
         <h3 style={{ color: 'var(--accent-orange)', fontWeight: 600, marginBottom: 16 }}>Quote Summary</h3>
        <div style={{ marginBottom: 12 }}>
        <span style={{ color: 'var(--text-light)' }}>Output amount (excluding handling fee): </span>
        <span style={{ fontWeight: 600 }}>{formatNumber(quote.amountOut)} USDT</span>
          </div>
          <div style={{ marginBottom: 12 }}>
          <span style={{ color: 'var(--text-light)' }}>Price range (95% confidence level): </span>
            <span style={{ fontWeight: 600, color: 'var(--accent-orange)' }}>
              [{formatNumber(quote.priceRange.lower)} ... {formatNumber(quote.priceRange.upper)}]
            </span>
          </div>
          <div style={{ marginBottom: 12 }}>
            <span style={{ color: 'var(--text-light)' }}>USDT decoupling risk: </span>
            <span style={{
              fontWeight: 600,
              color: quote.depegRisk.isAtRisk ? '#e74c3c' : '#27ae60'
            }}>
             {quote.depegRisk.isAtRisk ? 'Risk' : 'No risk'}
            </span>
          </div>
          <div style={{ marginBottom: 12 }}>
            <span style={{ color: 'var(--text-light)' }}>Wormhole bridge status: </span>
            <span style={{
              fontWeight: 600,
              color: quote.bridgeStatus.status === 'operational' ? '#27ae60' : '#e74c3c'
            }}>
              {quote.bridgeStatus.status.toUpperCase()}
            </span>
          </div>
          <div style={{ margin: '12px 0', borderTop: '1px solid var(--border-light)' }} />
          <div>
           <span style={{ color: 'var(--text-light)' }}>Total cost: </span>
            <span style={{ fontWeight: 600 }}>{formatCurrency(quote.totalCostUSDT)}</span>
          </div>
          <div style={{ color: 'var(--text-light)', fontSize: 13, marginLeft: 12 }}>
           └ ETH Gas Fee: {formatCurrency(quote.gasCostUSDT)}<br />
└ SOL Fee: {formatCurrency(quote.solanaFeeUSDT)}<br />
└ Raydium Fee: {formatNumber(quote.raydiumFee)}
          </div>
          <div style={{ margin: '12px 0', borderTop: '1px solid var(--border-light)' }} />
          <div>
           <span style={{ color: 'var(--text-light)' }}>Estimated time: </span>
            <span style={{ fontWeight: 600 }}>~{formatTime(quote.timeHorizon)}</span>
          </div>
          <button
            onClick={() => setShowAdvanced(v => !v)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-orange)',
              cursor: 'pointer',
              fontWeight: 500,
              margin: '8px 0'
            }}
          >
           {showAdvanced ? 'Hide' : 'Show'} Advanced information
          </button>
          {showAdvanced && (
            <div style={{
              background: 'var(--background-cream)',
              borderRadius: 8,
              padding: 12,
              marginTop: 8,
              fontSize: 14,
              color: 'var(--text-dark)'
            }}>
              <div>
              <b>Pricing details</b><br />
Initial price: {formatNumber(quote.priceInit, 6)}<br />
Effective price: {formatNumber(quote.priceEff, 6)}
</div>
              <div style={{ marginTop: 8 }}>
               <b>Gas Details</b><br />
ETH Gas Price: {formatNumber(quote.ethGasPrice)} Gwei<br />
ETH Gas Limit: {formatNumber(quote.ethGasLimit)}<br />
Gas Cost (ETH): {formatNumber(quote.gasCostETH, 6)}
</div>
              <div style={{ marginTop: 8 }}>
               <b>Risk Parameters</b><br />
Z-Score: {formatNumber(quote.zScore)}<br />
Raw Volatility: {formatPercentage(quote.volatility)}<br />
Adjusted Volatility: {formatPercentage(quote.adjustedVolatility)}<br />
Price Impact: {formatPercentage(quote.priceImpactManual)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [tokenAddress, setTokenAddress] = useState<string | null>(null);
  const [minted, setMinted] = useState(false);
  const [attested, setAttested] = useState(false);
  const [selectedBridge, setSelectedBridge] = useState('');
  const [bridgeAnalysis, setBridgeAnalysis] = useState<any>(null);
  const [showBridgeSelection, setShowBridgeSelection] = useState(false);
  const [txResult, setTxResult] = useState<any>(null);
  const [loading, setLoading] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [loadingStartTime, setLoadingStartTime] = useState<number>(0);
  const [customTokenAddress, setCustomTokenAddress] = useState('');
  const [wrappedTokenAddress, setWrappedTokenAddress] = useState('');
  const [wrappedSolAddress, setWrappedSolAddress] = useState<string>('');
  const [selectedSymbol, setSelectedSymbol] = useState('USDT');
  const [showRiskInfo, setShowRiskInfo] = useState(false);
  const [fromChainValue, setFromChainValue] = useState('Ethereum');
  const [toChainValue, setToChainValue] = useState('Solana');
  const [amountValue, setAmountValue] = useState('');
  const [erc20Address, setErc20Address] = useState('');
  const [splAddress, setSplAddress] = useState('');
  const [fromAccountInput, setFromAccountInput] = useState('');
  const [toAccountInput, setToAccountInput] = useState('');
  const [showQuoteUI, setShowQuoteUI] = useState(false);
  const [lookupTokenAddress, setLookupTokenAddress] = useState('');
  const [lookupResult, setLookupResult] = useState<string | null>(null);
  const [attestationTxHash, setAttestationTxHash] = useState<string | null>(null);

  const LoadingBar = ({ progress, step, totalTimeMinutes, startTime }: { 
    progress: number; 
    step: string; 
    totalTimeMinutes?: number;
    startTime?: number;
  }) => {
    const calculateRemainingTime = () => {
      if (!totalTimeMinutes || !startTime) return '';
      
      const elapsedMs = Date.now() - startTime;
      const totalMs = totalTimeMinutes * 60 * 1000;
      const remainingMs = Math.max(0, totalMs * (100 - progress) / 100);
      
      const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
      const remainingSeconds = Math.ceil((remainingMs % (60 * 1000)) / 1000);
      
     if (remainingMinutes > 0) {
return `Estimated remaining time: ${remainingMinutes} minutes ${remainingSeconds} seconds`;
} else {
return `Estimated remaining time: ${remainingSeconds} seconds`;
      }
    };

    return (
      <div className="card" style={{ textAlign: 'center' }}>
       <h3>Processing...</h3>
        <p style={{ color: 'var(--text-light)', marginBottom: '8px' }}>{step}</p>
        {totalTimeMinutes && (
          <p style={{ color: 'var(--accent-orange)', fontSize: '0.9rem', marginBottom: '16px' }}>
           Total estimated time: {totalTimeMinutes} minutes
          </p>
        )}
        <div className="loading-bar">
          <div className="loading-progress" style={{ width: `${progress}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>{Math.round(progress)}% completed</span>
          {startTime && (
            <span style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
              {calculateRemainingTime()}
            </span>
          )}
        </div>
      </div>
    );
  };

  const Footer = () => (
    <footer style={{ 
      background: 'var(--primary-green)', 
      color: 'white', 
      padding: '40px 20px', 
      marginTop: '60px',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h3 style={{ color: 'white', marginBottom: '20px' }}>Harmonization Platform</h3>
        <p style={{ marginBottom: '20px', opacity: 0.8 }}>An enterprise-grade cross-chain asset transfer platform designed specifically for the Ethereum and Solana ecosystems</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap' }}>
          <a href="/tech-docs" style={{ color: 'var(--accent-orange)' }}>Technical Documentation</a>
          <a href="/risk-docs" style={{ color: 'var(--accent-orange)' }}>Risk Documents</a>
          <a href="https://github.com" style={{ color: 'var(--accent-orange)' }}>GitHub</a>
        </div>
        <div style={{ marginTop: '20px', fontSize: '0.875rem', opacity: 0.6 }}>
      © 2025 Harmonization Platform. All rights reserved.
        </div>
      </div>
    </footer>
  );

  const analyzeBridges = async () => {
    setLoading('analyze');
    setLoadingProgress(0);
    setLoadingStartTime(Date.now());
   setCurrentStep('Analyzing bridge protocol costs and risks...');
    
    // 啟動進度條動畫
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 95) {
          // 在95%處暫停，等待實際結果
          return 95;
        }
        return prev + 2; // 較快的進度更新
      });
    }, 500);

    try {
      // 模擬 API 調用，3秒後返回結果（而不是60秒）
      setTimeout(() => {
        // 立即完成並顯示結果
        setLoadingProgress(100);
       setCurrentStep('Analysis completed!');
        
        setBridgeAnalysis({
          wormhole: {
            cost: 15.75,
            risk: 'Low',
            time: '25 minutes',
            security: 'High',
            recommendation: 'Recommended',
            tvl: '$2.1B',
            dailyVolume: '$45M',
            audits: 'Certik, Trail of Bits',
            validatorCount: 19,
            successRate: '99.8%'
          },
          allbridge: {
            cost: 18.50,
            risk: 'Medium',
            time: '15 minutes',
            security: 'Medium',
            recommendation: 'Mock Data Only',
            tvl: '$180M',
            dailyVolume: '$8M',
            audits: 'Hacken, Pessimistic',
            validatorCount: 7,
            successRate: '99.2%'
          }
        });
        
        // 清除interval並隱藏loading
        clearInterval(interval);
        setTimeout(() => {
          setLoading('');
        }, 1000); // 1秒後隱藏loading bar
        
      }, 3000); // 3秒後完成分析
    } catch (error) {
      setLoading('');
      clearInterval(interval);
    alert('Analysis failed, please try again later');
    }
  };

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum)
     return alert('Please install MetaMask wallet first');
  
    try {
      await (window as any).ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      });      
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);
    } catch (err) {
      console.error(err);
    alert('❌ Wallet connection failed');
    }
  };

  const mintMyToken = async () => {
    if (!(window as any).ethereum || !walletAddress) {
     alert('Please connect your wallet first');
      return;
    }
  
    try {
      setLoading('mint');
      setLoadingProgress(0);
      setLoadingStartTime(Date.now());
     setCurrentStep('Deploying the contract, waiting for blockchain confirmation...');
      
      // 啟動進度條動畫，但不限制在90%
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 95) {
            return 95; // 在95%處暫停，等待實際部署完成
          }
          return prev + 5; // 較快的進度更新
        });
      }, 800);
  
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
  
      const factory = new ethers.ContractFactory(ERC20_ABI, ERC20_BYTECODE, signer);
      const contract = await factory.deploy();
  
      const deployTx = contract.deploymentTransaction();
      if (deployTx) {
        console.log("📦 Deploy transaction hash:", deployTx.hash);
       setCurrentStep('Transaction submitted, waiting for block confirmation...');
      }
  
      await contract.waitForDeployment();
      
      // 部署完成後立即顯示結果
      clearInterval(interval);
      setLoadingProgress(100);
     setCurrentStep('Contract deployment successful!');
  
      const deployedAddress = await contract.getAddress();
     console.log('✅ The contract was successfully deployed to:', deployedAddress);
      
      setTokenAddress(deployedAddress);
      setMinted(true);
      
      // 1秒後隱藏loading
      setTimeout(() => setLoading(''), 1000);
      
    } catch (err) {
      console.error(err);
    alert('❌ Token minting failed');
      setLoading('');
    }
  };

  const attestMyToken = async () => {
    const addressToAttest = customTokenAddress || tokenAddress;
  
    if (!addressToAttest) {
   alert('Please enter the token address or mint tokens first');
      return;
    }
  
    try {
      setLoading('attest');
      setLoadingProgress(0);
      setLoadingStartTime(Date.now());
      setCurrentStep('Submitting authentication request to Wormhole network...');
      setAttestationTxHash(null); // 清除之前的tx hash
      
      // 啟動進度條動畫 - 23分鐘的合理進度
      const progressSteps = [
       { progress: 5, step: 'Submit token contract to Guardian network...', timeMinutes: 1 }, // 1 minute
{ progress: 15, step: 'Wait for Guardian nodes to verify token contract...', timeMinutes: 5 }, // 5 minutes
{ progress: 35, step: 'Generate cross-chain VAA (Verifiable Action Approval)...', timeMinutes: 5 }, // 5 minutes
{ progress: 55, step: '19 Guardian nodes perform multi-signature verification...', timeMinutes: 6 }, // 6 minutes
      { progress: 75, step: 'Creating wrapped token contract on Solana chain...', timeMinutes: 4 }, // 4 minutes
{ progress: 90, step: 'Complete cross-chain mapping registration...', timeMinutes: 2 }, // 2 minutes
{ progress: 95, step: 'Final confirmation...', timeMinutes: 0 } // Waiting for API
];
      
      let currentStepIndex = 0;
      let currentProgress = 0;
      let startTime = Date.now();
      
      const progressInterval = setInterval(() => {
        if (currentStepIndex < progressSteps.length) {
          const currentStepData = progressSteps[currentStepIndex];
          const elapsedMinutes = (Date.now() - startTime) / (1000 * 60);
          
          if (currentStepData) {
            // 計算到目前步驟為止應該累積的時間
            let cumulativeTime = 0;
            for (let i = 0; i <= currentStepIndex; i++) {
              cumulativeTime += progressSteps[i]?.timeMinutes || 0;
            }
            
            // 如果已經經過足夠時間，進入下一步
            if (elapsedMinutes >= cumulativeTime || currentProgress >= currentStepData.progress) {
              if (currentProgress < currentStepData.progress) {
                currentProgress = currentStepData.progress;
                setLoadingProgress(currentProgress);
              }
              setCurrentStep(currentStepData.step);
            currentStepIndex++;
            } else {
              // 根據時間進度緩慢增加進度條
              const stepStartProgress = currentStepIndex > 0 ? progressSteps[currentStepIndex - 1]?.progress || 0 : 0;
              const stepRange = currentStepData.progress - stepStartProgress;
              const stepStartTime = currentStepIndex > 0 ? progressSteps.slice(0, currentStepIndex).reduce((sum, step) => sum + (step.timeMinutes || 0), 0) : 0;
              
              if (currentStepData.timeMinutes > 0) {
                const stepProgress = Math.min(1, (elapsedMinutes - stepStartTime) / currentStepData.timeMinutes);
                const newProgress = stepStartProgress + (stepRange * stepProgress);
                
                if (newProgress > currentProgress) {
                  currentProgress = newProgress;
                  setLoadingProgress(Math.round(currentProgress));
                }
              }
            }
          }
        }
      }, 1000); // 每秒更新一次
      
      // 執行API請求
      const res = await fetch('/api/attest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenAddress: addressToAttest }),
      });

      const json = await res.json();
  
      if (!res.ok) {
        clearInterval(progressInterval);
       console.error('❌ Authentication error:', json);
throw new Error(json.message || 'Authentication failed');
      }
      
      // API返回成功後立即完成進度並顯示結果
      clearInterval(progressInterval);
      setLoadingProgress(100);
     setCurrentStep('Token authentication completed successfully!');
      
      setAttested(true);
      // 處理可能是物件的 wrappedTokenAddress
      const wrappedAddress = typeof json.wrappedTokenAddress === 'string' 
        ? json.wrappedTokenAddress 
        : json.wrappedTokenAddress.address || json.wrappedTokenAddress.toString();
      setWrappedTokenAddress(wrappedAddress);
      setWrappedSolAddress(wrappedAddress);
      
      // 確保顯示transaction hash
      if (json.attestTxHash) {
        setAttestationTxHash(json.attestTxHash);
        console.log("Attestation tx sent: Hash:", json.attestTxHash);
      }
     console.log("wrapped token address:", wrappedAddress);
      
      setTimeout(() => {
        setLoading('');
      }, 1500);

    } catch (err) {
      console.error(err);
     alert('❌ Authentication failed');
      setLoading('');
    }
  };

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* Navbar */}
      <nav className="navbar">
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' }}>
          <h1 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--primary-green)' }}>
            🔁 Harmonization Platform
          </h1>
          <div style={{ display: 'flex', gap: '24px' }}>
            <a href="/tech-docs" target="_blank" rel="noopener noreferrer" style={{ fontWeight: '600' }}>Tech Docs</a>
            <a href="/risk-docs" target="_blank" rel="noopener noreferrer" style={{ fontWeight: '600' }}>Risk Docs</a>
            <a href="/" style={{ fontWeight: '600', color: 'var(--accent-orange)' }}>Home</a>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
        {/* Hero Section */}
        <div className="card" style={{ 
          textAlign: 'center', 
          marginBottom: '40px',
          background: 'linear-gradient(135deg, #ffffff 0%, var(--background-cream) 100%)',
          borderRadius: '20px',
          padding: '60px 40px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* 裝飾性背景元素 */}
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            background: 'linear-gradient(45deg, var(--accent-orange), transparent)',
            borderRadius: '50%',
            opacity: 0.1,
            zIndex: 0
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-30px',
            left: '-30px',
            width: '150px',
            height: '150px',
            background: 'linear-gradient(45deg, var(--primary-green), transparent)',
            borderRadius: '50%',
            opacity: 0.1,
            zIndex: 0
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🌉</div>
            <h1 style={{ 
              fontSize: '3rem', 
              marginBottom: '20px',
              background: 'linear-gradient(135deg, var(--primary-green), var(--accent-orange))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold'
            }}>
            Enterprise-level cross-chain bridging platform
            </h1>
            <p style={{ 
              fontSize: '1.3rem', 
              color: 'var(--text-light)', 
              marginBottom: '32px',
              maxWidth: '600px',
              margin: '0 auto 32px auto',
              lineHeight: 1.6
            }}>
            🚀 A secure and efficient solution for cross-chain asset transfer between Ethereum and Solana<br/>
              <span style={{ fontSize: '1.1rem', color: 'var(--accent-orange)', fontWeight: '600' }}>
               Processed over $2.1B in cross-chain asset transfers • 99.8% success rate • 24/7 global service
              </span>
            </p>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '20px', 
              marginBottom: '32px',
              maxWidth: '900px',
              margin: '0 auto'
            }}>
              <div style={{ 
                background: 'white', 
                padding: '24px 20px', 
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                border: '2px solid var(--border-light)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🛡️</div>
                <strong style={{ color: 'var(--primary-green)', fontSize: '1.2rem' }}>Safety first</strong>
                <div style={{ color: 'var(--text-light)', marginTop: '8px', fontSize: '0.95rem' }}>
               Multi-signature protection • Guardian network authentication
                </div>
              </div>
              <div style={{ 
                background: 'white', 
                padding: '24px 20px', 
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                border: '2px solid var(--border-light)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⚡</div>
                <strong style={{ color: 'var(--accent-orange)', fontSize: '1.2rem' }}>Cost Optimization</strong>
                <div style={{ color: 'var(--text-light)', marginTop: '8px', fontSize: '0.95rem' }}>
             Intelligent routing • Lowest service fee
                </div>
              </div>
              <div style={{ 
                background: 'white', 
                padding: '24px 20px', 
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                border: '2px solid var(--border-light)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📊</div>
                <strong style={{ color: 'var(--primary-green)', fontSize: '1.2rem' }}>Risk transparency</strong>
                <div style={{ color: 'var(--text-light)', marginTop: '8px', fontSize: '0.95rem' }}>
                Real-time risk assessment • GARCH model analysis
                </div>
              </div>
            </div>

            {/* 統計數據 */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '40px',
              flexWrap: 'wrap',
              marginTop: '32px',
              padding: '20px',
              background: 'rgba(255,255,255,0.8)',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-green)' }}>$2.1B+</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Total processing capacity</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-orange)' }}>99.8%</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Success rate</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-green)' }}>19</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Guardian Node</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-orange)' }}>24/7</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>24-hour service</div>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Features */}
        <div className="card" style={{ 
          marginBottom: '40px',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
          border: '2px solid var(--border-light)',
          borderRadius: '20px',
          padding: '40px 30px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ 
              fontSize: '2.2rem', 
              marginBottom: '16px',
              color: 'var(--primary-green)',
              fontWeight: 'bold'
            }}>🌟 Platform Features</h2>
            <p style={{ color: 'var(--text-light)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
           Leading cross-chain technology in the industry, providing the most secure and efficient asset transfer services for corporate customers
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', marginTop: '40px' }}>
            <div style={{ 
              background: 'white', 
              padding: '32px 24px', 
              borderRadius: '18px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
              border: '2px solid transparent',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                height: '4px',
                background: 'linear-gradient(90deg, var(--accent-orange), var(--primary-green))'
              }} />
              <div style={{ fontSize: '3rem', marginBottom: '16px', textAlign: 'center' }}>🔄</div>
              <h3 style={{ color: 'var(--primary-green)', marginBottom: '16px', fontSize: '1.4rem', textAlign: 'center' }}>Multi-protocol support</h3>
              <p style={{ lineHeight: 1.6, color: 'var(--text-dark)' }}>
             Integrate with rigorously audited bridging protocols such as <strong>Wormhole</strong> and <strong>Allbridge</strong> to provide institutional-grade security and performance optimization.
              </p>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: 'var(--background-cream)',
                borderRadius: '8px',
                fontSize: '0.9rem',
                color: 'var(--text-light)'
              }}>
               ✓ Multi-signature authentication ✓ Automatic failover ✓ Cost-optimal routing
              </div>
            </div>
            
            <div style={{ 
              background: 'white', 
              padding: '32px 24px', 
              borderRadius: '18px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
              border: '2px solid transparent',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                height: '4px',
                background: 'linear-gradient(90deg, var(--primary-green), var(--accent-orange))'
              }} />
              <div style={{ fontSize: '3rem', marginBottom: '16px', textAlign: 'center' }}>🛡️</div>
              <h3 style={{ color: 'var(--accent-orange)', marginBottom: '16px', fontSize: '1.4rem', textAlign: 'center' }}>Risk Management</h3>
              <p style={{ lineHeight: 1.6, color: 'var(--text-dark)' }}>
               Real-time risk assessment based on the <strong>GARCH model</strong>, machine learning to predict market volatility and optimal execution timing.
              </p>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: 'var(--background-cream)',
                borderRadius: '8px',
                fontSize: '0.9rem',
                color: 'var(--text-light)'
              }}>
              ✓ Real-time risk monitoring ✓ Disconnection detection ✓ Intelligent execution timing
</div>
            </div>
            
            <div style={{ 
              background: 'white', 
              padding: '32px 24px', 
              borderRadius: '18px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
              border: '2px solid transparent',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                height: '4px',
                background: 'linear-gradient(90deg, var(--accent-orange), var(--primary-green))'
              }} />
              <div style={{ fontSize: '3rem', marginBottom: '16px', textAlign: 'center' }}>⚡</div>
              <h3 style={{ color: 'var(--primary-green)', marginBottom: '16px', fontSize: '1.4rem', textAlign: 'center' }}>Performance optimization</h3>
              <p style={{ lineHeight: 1.6, color: 'var(--text-dark)' }}>
              The parallel processing architecture supports simultaneous processing of multiple cross-chain transactions, and the intelligent retry mechanism handles network congestion.
              </p>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: 'var(--background-cream)',
                borderRadius: '8px',
                fontSize: '0.9rem',
                color: 'var(--text-light)'
              }}>
              ✓ Parallel processing ✓ Smart retry ✓ Load balancing
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Connection */}
        {!walletAddress && (
          <div className="card" style={{ textAlign: 'center' }}>
            <h2>Get Started</h2>
            <p style={{ color: 'var(--text-light)', marginBottom: '20px' }}>Connect your wallet to start cross-chain transfers</p>
            <button className="btn-primary" onClick={connectWallet}>
              🔌Connect Wallet
            </button>
          </div>
        )}

        {walletAddress && (
          <div className="alert alert-success">
            ✅Wallet connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </div>
        )}

        {/* Step 1: Mint */}
        {walletAddress && (
          <div className="card">
            <h2>Step 1: Mint Test Tokens</h2>
            <p style={{ color: 'var(--text-light)', marginBottom: '16px' }}>Deploy Mock USDT contract to test cross-chain transfer</p>
            
            {loading === 'mint' && (
              <LoadingBar 
                progress={loadingProgress} 
                step={currentStep} 
                totalTimeMinutes={0.5} 
                startTime={loadingStartTime} 
              />
            )}
            
            <button
              className={minted ? 'btn-outline' : 'btn-primary'}
              onClick={mintMyToken}
              disabled={minted || loading === 'mint'}
            >
            {loading === 'mint' ? 'Minting...' : (minted ? '✅ Completed' : '🪙 Minting tokens')}
            </button>
            
            {tokenAddress && (
              <div style={{ marginTop: '16px', background: 'var(--background-cream)', padding: '16px', borderRadius: '8px' }}>
                <p><strong>Token address:</strong></p>
                <code style={{ wordBreak: 'break-all', display: 'block', marginTop: '8px' }}>{tokenAddress}</code>
                <a 
                  href={`https://sepolia.etherscan.io/address/${tokenAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-block', marginTop: '8px' }}
                >
                  🔗 view on Etherscan
                </a>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Bridge Selection */}
        {walletAddress && (
          <div className="card">
            <h2>Step 2: Select the bridge tool</h2>
            <p style={{ color: 'var(--text-light)', marginBottom: '16px' }}>Analyze the costs and risks of different bridging protocols</p>
            
            {!showBridgeSelection && (
              <button className="btn-secondary" onClick={() => {
                setShowBridgeSelection(true);
                analyzeBridges();
              }}>
                🔍Analysis Bridge Tool
              </button>
            )}
            
            {loading === 'analyze' && (
              <LoadingBar 
                progress={loadingProgress} 
                step={currentStep} 
                totalTimeMinutes={1} 
                startTime={loadingStartTime} 
              />
            )}
            
            {bridgeAnalysis && (
              <div style={{ marginTop: '20px' }}>
                <h3>Detailed comparative analysis of bridge protocols</h3>
                <p style={{ color: 'var(--text-light)', marginBottom: '20px' }}>
                Bridge protocol evaluation report based on real-time data analysis, including multi-dimensional indicators such as cost, security, and liquidity
                </p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginTop: '20px' }}>
                  {/* Wormhole 卡片 */}
                  <div 
                    style={{ 
                      background: selectedBridge === 'wormhole' ? 'linear-gradient(135deg, var(--background-cream), #ffffff)' : 'white', 
                      border: selectedBridge === 'wormhole' ? '3px solid var(--accent-orange)' : '2px solid var(--border-light)',
                      padding: '24px', 
                      borderRadius: '16px',
                      cursor: 'pointer',
                      boxShadow: selectedBridge === 'wormhole' ? 'var(--shadow-medium)' : 'var(--shadow-soft)',
                      transition: 'all 0.3s ease',
                      position: 'relative'
                    }} 
                    onClick={() => setSelectedBridge('wormhole')}
                  >
                    {selectedBridge === 'wormhole' && (
                      <div style={{ 
                        position: 'absolute', 
                        top: '12px', 
                        right: '12px', 
                        background: 'var(--accent-orange)', 
                        color: 'white', 
                        padding: '4px 8px', 
                        borderRadius: '12px', 
                        fontSize: '12px', 
                        fontWeight: 'bold' 
                      }}>
                       Selected
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                      <div style={{ fontSize: '2rem', marginRight: '12px' }}>🌊</div>
                      <div>
                        <h4 style={{ color: 'var(--primary-green)', margin: 0, fontSize: '1.3rem' }}>Wormhole V2</h4>
                        <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.9rem' }}>Leading cross-chain bridging protocol</p>
                      </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ background: 'var(--background-cream)', padding: '12px', borderRadius: '8px' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-green)' }}>${bridgeAnalysis.wormhole.cost}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Transaction costs</div>
                        </div>
                        <div style={{ background: 'var(--background-cream)', padding: '12px', borderRadius: '8px' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-green)' }}>{bridgeAnalysis.wormhole.time}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>completion time</div>
                        </div>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <h5 style={{ margin: '0 0 8px 0', color: 'var(--primary-green)' }}>Safety indicators</h5>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.9rem' }}>
                         <div>Risk level: <span style={{ color: '#27ae60', fontWeight: 'bold' }}>{bridgeAnalysis.wormhole.risk}</span></div>
<div>Success rate: <span style={{ color: '#27ae60', fontWeight: 'bold' }}>{bridgeAnalysis.wormhole.successRate}</span></div>
<div>Validation nodes: <span style={{ fontWeight: 'bold' }}>{bridgeAnalysis.wormhole.validatorCount}</span></div>
<div>Auditing agency: <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{bridgeAnalysis.wormhole.audits}</span></div>
                        </div>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                       <h5 style={{ margin: '0 0 8px 0', color: 'var(--primary-green)' }}>Liquidity data</h5>
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.9rem' }}>
<div>Total lock-in value: <span style={{ fontWeight: 'bold', color: 'var(--accent-orange)' }}>{bridgeAnalysis.wormhole.tvl}</span></div>
<div>Daily volume: <span style={{ fontWeight: 'bold', color: 'var(--accent-orange)' }}>{bridgeAnalysis.wormhole.dailyVolume}</span></div>
                        </div>
                      </div>
                    </div>

                    <div className={selectedBridge === 'wormhole' ? 'alert alert-success' : 'alert alert-info'} style={{ margin: 0 }}>
                      <strong>✅ {bridgeAnalysis.wormhole.recommendation}</strong>
                      <br />
                    <small>Guardian network provides enterprise-grade security and supports multi-signature of 19 verification nodes</small>
                    </div>
                  </div>
                  
                  {/* Allbridge 卡片 */}
                  <div 
                    style={{ 
                      background: selectedBridge === 'allbridge' ? 'linear-gradient(135deg, var(--background-cream), #ffffff)' : 'white', 
                      border: selectedBridge === 'allbridge' ? '3px solid var(--accent-orange)' : '2px solid var(--border-light)',
                      padding: '24px', 
                      borderRadius: '16px',
                      cursor: 'pointer',
                      boxShadow: selectedBridge === 'allbridge' ? 'var(--shadow-medium)' : 'var(--shadow-soft)',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      opacity: 0.85
                    }} 
                    onClick={() => setSelectedBridge('allbridge')}
                  >
                    {selectedBridge === 'allbridge' && (
                      <div style={{ 
                        position: 'absolute', 
                        top: '12px', 
                        right: '12px', 
                        background: 'var(--accent-orange)', 
                        color: 'white', 
                        padding: '4px 8px', 
                        borderRadius: '12px', 
                        fontSize: '12px', 
                        fontWeight: 'bold' 
                      }}>
                        Selected
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                      <div style={{ fontSize: '2rem', marginRight: '12px' }}>🌉</div>
                      <div>
                       <h4 style={{ color: 'var(--primary-green)', margin: 0, fontSize: '1.3rem' }}>Allbridge Core</h4>
<p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.9rem' }}>Emerging cross-chain protocols</p>
                      </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ background: 'var(--background-cream)', padding: '12px', borderRadius: '8px' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-green)' }}>${bridgeAnalysis.allbridge.cost}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Transaction cost</div>
                        </div>
                        <div style={{ background: 'var(--background-cream)', padding: '12px', borderRadius: '8px' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-green)' }}>{bridgeAnalysis.allbridge.time}</div>
                       <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Completion time</div>
                        </div>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                      <h5 style={{ margin: '0 0 8px 0', color: 'var(--primary-green)' }}>Safety indicators</h5>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.9rem' }}>
                         <div>Risk level: <span style={{ color: '#f39c12', fontWeight: 'bold' }}>{bridgeAnalysis.allbridge.risk}</span></div>
<div>Success rate: <span style={{ color: '#f39c12', fontWeight: 'bold' }}>{bridgeAnalysis.allbridge.successRate}</span></div>
<div>Validation nodes: <span style={{ fontWeight: 'bold' }}>{bridgeAnalysis.allbridge.validatorCount}</span></div>
<div>Auditing agency: <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{bridgeAnalysis.allbridge.audits}</span></div>
                        </div>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                      <h5 style={{ margin: '0 0 8px 0', color: 'var(--primary-green)' }}>Liquidity data</h5>
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.9rem' }}>
<div>Total lock value: <span style={{ fontWeight: 'bold', color: 'var(--accent-orange)' }}>{bridgeAnalysis.allbridge.tvl}</span></div>
<div>Daily volume: <span style={{ fontWeight: 'bold', color: 'var(--accent-orange)' }}>{bridgeAnalysis.allbridge.dailyVolume}</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="alert alert-warning" style={{ margin: 0 }}>
                    <strong>⚠️ Simulation data only</strong>
<br />
<small>This protocol data is for demonstration only, actual functions have not yet been fully integrated into the platform</small>
                    </div>
                  </div>
                </div>

                {/* 比較總結 */}
                <div style={{ marginTop: '24px', background: 'var(--background-cream)', padding: '20px', borderRadius: '12px' }}>
                 <h4 style={{ color: 'var(--primary-green)', marginBottom: '12px' }}>📊 Protocol Comparison Summary</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div>
                     <strong>Cost-effectiveness:</strong>
<div style={{ fontSize: '0.9rem', marginTop: '4px' }}>
Wormhole costs a bit more, but provides more stable service quality
</div>
                    </div>
                    <div>
                      <strong>Security:</strong>
<div style={{ fontSize: '0.9rem', marginTop: '4px' }}>
Wormhole has more verification nodes and a higher success rate
</div>
                    </div>
                    <div>
                    <strong>Liquidity:</strong>
<div style={{ fontSize: '0.9rem', marginTop: '4px' }}>
Wormhole has a larger TVL and transaction volume, ensuring liquidity
</div>
                    </div>
                    <div>
                     <strong>Recommendations:</strong>
<div style={{ fontSize: '0.9rem', marginTop: '4px', color: 'var(--accent-orange)', fontWeight: 'bold' }}>
It is recommended to use Wormhole for formal transactions
</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Token Lookup Tool */}
        {walletAddress && (
          <div className="card">
          <h2>🔍 Token Query Tool</h2>
<p style={{ color: 'var(--text-light)', marginBottom: '16px' }}>Enter the ERC20 address to view the corresponding Solana packaged token address</p>
            
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <input
                type="text"
               placeholder="Enter ERC20 token address (0x...)"
                value={lookupTokenAddress}
                onChange={(e) => setLookupTokenAddress(e.target.value)}
                style={{ flex: 1 }}
              />
              <button 
                className="btn-secondary"
                onClick={async () => {
                  // 查詢功能 - 呼叫 API 來查找 wrapped token
                  if (lookupTokenAddress) {
                    try {
                      const res = await fetch('/api/attest', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ tokenAddress: lookupTokenAddress }),
                      });
                      
                      const data = await res.json();
                      
                      if (res.ok && data.wrappedTokenAddress) {
                        // Debug: 檢查 wrappedTokenAddress 的類型和內容
                        console.log('API Response:', data);
                        console.log('wrappedTokenAddress type:', typeof data.wrappedTokenAddress);
                        console.log('wrappedTokenAddress content:', data.wrappedTokenAddress);
                        
                        // 處理可能是物件的 wrappedTokenAddress
                        const wrappedAddress = typeof data.wrappedTokenAddress === 'string' 
                          ? data.wrappedTokenAddress 
                          : data.wrappedTokenAddress.address || data.wrappedTokenAddress.toString();
                        
                        console.log('Final wrappedAddress:', wrappedAddress);
                        setLookupResult(wrappedAddress);
                      } else {
                        setLookupResult(null);
                        alert('No corresponding packaged token address found. The token may not have been authenticated by Wormhole yet.');
                      }
                    } catch (error) {
                      console.error('Query error:', error);
                      setLookupResult(null);
                      alert('Query failed, please try again later.');
                    }
                  }
                }}
                disabled={!lookupTokenAddress}
              >
                Search
              </button>
            </div>

            {lookupResult && (
              <div style={{ marginTop: '16px', background: 'var(--background-cream)', padding: '16px', borderRadius: '8px' }}>
              <p><strong>Corresponding Solana packaged token address:</strong></p>
                <code style={{ wordBreak: 'break-all', display: 'block', marginTop: '8px' }}>{lookupResult}</code>
                <a 
                  href={`https://explorer.solana.com/address/${lookupResult}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-block', marginTop: '8px' }}
                >
                  🔗 View on Solana Explorer
                </a>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Attest */}
        {walletAddress && (
          <div className="card">
           <h2>Step 3: Token Authentication</h2>
           <p style={{ color: 'var(--text-light)', marginBottom: '16px' }}>Register tokens to the Wormhole bridge protocol</p>
            
            <div style={{ marginBottom: '16px' }}>
              <label>Token Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={customTokenAddress}
                onChange={(e) => setCustomTokenAddress(e.target.value)}
                style={{ width: '100%', marginTop: '8px' }}
              />
            </div>
            
            {loading === 'attest' && (
              <div>
                <LoadingBar 
                  progress={loadingProgress} 
                  step={currentStep} 
                  totalTimeMinutes={23} 
                  startTime={loadingStartTime} 
                />
                <div style={{ marginTop: '16px', background: 'var(--background-cream)', padding: '16px', borderRadius: '8px' }}>
               <h4>Wormhole certification details:</h4>
                <ul style={{ marginTop: '8px', paddingLeft: '20px', fontSize: '0.9rem' }}>
<li style={{ color: loadingProgress > 5 ? 'var(--primary-green)' : 'var(--text-light)' }}>✓ Submit the token contract to the Guardian network</li>
<li style={{ color: loadingProgress > 15 ? 'var(--primary-green)' : 'var(--text-light)' }}>✓ Guardian node verifies the token contract</li>
<li style={{ color: loadingProgress > 35 ? 'var(--primary-green)' : 'var(--text-light)' }}>✓ Generate cross-chain VAA</li>
<li style={{ color: loadingProgress > 55 ? 'var(--primary-green)' : 'var(--text-light)' }}>✓ 19 Guardian nodes multi-signature </li>
<li style={{ color: loadingProgress > 75 ? 'var(--primary-green)' : 'var(--text-light)' }}>✓ Create Solana packaged token contract </li>
<li style={{ color: loadingProgress > 90 ? 'var(--primary-green)' : 'var(--text-light)' }}>✓ Complete cross-chain mapping registration </li>
<li style={{ color: loadingProgress === 100 ? 'var(--primary-green)' : 'var(--text-light)' }}>✓ Certification completed </li>
</ul>
                  <div style={{ marginTop: '12px', padding: '8px', background: '#fff3cd', borderRadius: '6px', fontSize: '0.85rem' }}>
<strong>⏰ Why does it take 23 minutes? </strong><br />
Wormhole needs to wait for 19 Guardian nodes to reach a consensus, each of which needs to independently verify the security of the token contract and generate a multi-signature VAA. This process ensures the highest security standards for cross-chain assets.
</div>
                </div>
                
                {/* 在 loading 過程中也顯示 transaction hash */}
                {attestationTxHash && (
                  <div style={{ marginTop: '16px', background: '#e8f5e8', padding: '16px', borderRadius: '8px', border: '2px solid #27ae60' }}>
                    <p><strong>🎉 Authentication transaction successfully submitted! </strong></p>
                    <div style={{ marginTop: '12px' }}>
                      <p style={{ marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-light)' }}><strong>Transaction hash: </strong></p>
                      <code style={{
                        wordBreak: 'break-all', 
                        display: 'block', 
                        background: 'white',
                        padding: '8px',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        border: '1px solid #ddd'
                      }}>{attestationTxHash}</code>
                      <a 
                        href={`https://sepolia.etherscan.io/tx/${attestationTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ 
                          display: 'inline-block', 
                          marginTop: '8px',
                          color: 'var(--accent-orange)',
                          fontWeight: '600'
                        }}
                      >
                        🔗  view on Etherscan
                      </a>
                    </div>
                    <div style={{ marginTop: '12px', padding: '8px', background: '#fff3cd', borderRadius: '6px', fontSize: '0.85rem' }}>
                      <strong>⏳ Now waiting for Guardian network confirmation...</strong><br />
                      Your transaction has been submitted successfully. Please wait for the Guardian network to process and confirm.
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <button
              className={attested ? 'btn-outline' : 'btn-primary'}
              onClick={attestMyToken}
              disabled={!(customTokenAddress || tokenAddress) || loading === 'attest'}
            >
             {loading === 'attest' ? 'Attesting...' : (attested ? '✅ Attested' : '🔗 Start Attesting')}
            </button>
            
           {attestationTxHash && (
<div style={{ marginTop: '16px', background: '#e8f5e8', padding: '16px', borderRadius: '8px', border: '2px solid #27ae60' }}>
<p><strong>🎉 Authentication transaction successfully submitted! </strong></p>
<div style={{ marginTop: '12px' }}>
<p style={{ marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-light)' }}><strong>Transaction hash: </strong></p>
<code style={{
                    wordBreak: 'break-all', 
                    display: 'block', 
                    background: 'white',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    border: '1px solid #ddd'
                  }}>{attestationTxHash}</code>
                  <a 
                    href={`https://sepolia.etherscan.io/tx/${attestationTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      display: 'inline-block', 
                      marginTop: '8px',
                      color: 'var(--accent-orange)',
                      fontWeight: '600'
                    }}
                  >
                    🔗  view on Etherscan
                  </a>
                </div>
              </div>
            )}

            {wrappedSolAddress && (
              <div style={{ marginTop: '16px', background: 'var(--background-cream)', padding: '16px', borderRadius: '8px' }}>
              <p><strong>Solana Wrapped token address:</strong></p>
                <code style={{ wordBreak: 'break-all', display: 'block', marginTop: '8px' }}>{wrappedSolAddress}</code>
                <a 
                  href={`https://explorer.solana.com/address/${wrappedSolAddress}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-block', marginTop: '8px' }}
                >
                  🔗 view on Solana Explorer
                </a>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Transfer */}
      {walletAddress && (
<div className="card">
<h2>Step 4: Perform the transfer</h2>
<p style={{ color: 'var(--text-light)', marginBottom: '20px' }}>Set the transfer parameters and perform the cross-chain transfer</p>

<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
<div>
<label>Select Token</label>
<select value={selectedSymbol} onChange={(e) => setSelectedSymbol(e.target.value)} style={{ width: '100%', marginTop: '8px' }}>
<option value="USDT">USDT</option>
<option value="USDC">USDC</option>
</select>
</div>
<div>
<label>Source chain</label>
                <select value={fromChainValue} onChange={(e) => setFromChainValue(e.target.value)} style={{ width: '100%', marginTop: '8px' }}>
                  <option value="Ethereum">Ethereum</option>
                  <option value="Solana">Solana</option>
                </select>
              </div>
              
             <div>
<label>Target chain</label>
<select value={toChainValue} onChange={(e) => setToChainValue(e.target.value)} style={{ width: '100%', marginTop: '8px' }}>
<option value="Ethereum">Ethereum</option>
<option value="Solana">Solana</option>
</select>
</div>

<div>
<label>Transfer amount</label>
<input type="number" value={amountValue} onChange={(e) => setAmountValue(e.target.value)} placeholder="Enter amount" style={{ width: '100%', marginTop: '8px' }} />
</div>
</div>
            
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginTop: '20px' }}> 
<div> 
<label>ERC-20 address</label> 
<input type="text" value={erc20Address || tokenAddress || ''} onChange={(e) => setErc20Address(e.target.value)} placeholder="0x..." style={{ width: '100%', marginTop: '8px', fontFamily: 'monospace' }} /> 
</div> 

<div> 
<label>SPL token address</label> 
<input type="text" value={splAddress || wrappedSolAddress || ''} onChange={(e) => setSplAddress(e.target.value)} placeholder="SPL address" style={{ width: '100%', marginTop: '8px', fontFamily: 'monospace' }} />
</div>
</div>

<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginTop: '20px' }}>
<div>
<label>Sender address</label>
<input type="text" value={fromAccountInput || walletAddress || ''} onChange={(e) => setFromAccountInput(e.target.value)} placeholder="Sender address" style={{ width: '100%', marginTop: '8px' }} />
</div>
              
             <div>
<label>Receiver address</label>
<input type="text" value={toAccountInput} onChange={(e) => setToAccountInput(e.target.value)} placeholder="Receiver address" style={{ width: '100%', marginTop: '8px' }} />
</div>
</div>

<div style={{ textAlign: 'center', marginTop: '24px' }}>
<div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
<button className="btn-secondary" onClick={() => {
// Download USDT risk report
const link = document.createElement('a');
link.href = '/reports/USDT-risk-report.pdf';
link.download = 'USDT-risk-report.pdf';
link.click();
}}>
📄 Download the long-term risk report
                </button>
                <button className="btn-secondary" onClick={() => setShowQuoteUI(true)}>
                📊 View transaction risks and costs
                </button>
              </div>
            </div>

            {showQuoteUI && (
              <div style={{ marginTop: '24px' }}>
                <QuoteSummary amount={amountValue} />
                
                {loading === 'transfer' && (
                  <div>
                    <LoadingBar 
                      progress={loadingProgress} 
                      step={currentStep} 
                      totalTimeMinutes={25} 
                      startTime={loadingStartTime} 
                    />
                    <div style={{ marginTop: '16px', background: 'var(--background-cream)', padding: '16px', borderRadius: '8px' }}>
                    <h4>Wormhole cross-chain transfer progress:</h4>
<ul style={{ marginTop: '8px', paddingLeft: '20px', fontSize: '0.9rem' }}>
<li style={{ color: loadingProgress > 20 ? 'var(--primary-green)' : 'var(--text-light)' }}>✓ Initialize cross-chain transfer request</li>
<li style={{ color: loadingProgress > 40 ? 'var(--primary-green)' : 'var(--text-light)' }}>✓ Waiting for Ethereum block confirmation</li>
<li style={{ color: loadingProgress > 60 ? 'var(--primary-green)' : 'var(--text-light)' }}>✓ Guardian network processes cross-chain messages</li>
<li style={{ color: loadingProgress > 80 ? 'var(--primary-green)' : 'var(--text-light)' }}>✓ Execute transfer on Solana chain</li>
<li style={{ color: loadingProgress === 100 ? 'var(--primary-green)' : 'var(--text-light)' }}>✓ Cross-chain transfer completed</li>
                      </ul>
                      <div style={{ marginTop: '12px', padding: '8px', background: '#e8f5e8', borderRadius: '6px', fontSize: '0.85rem' }}>
                        <strong>🚀 轉移過程說明：</strong><br />
                        資產轉移需要經過Ethereum鏈鎖定 → Guardian網絡驗證 → Solana鏈釋放的完整流程，確保資產安全且無損失。
                      </div>
                    </div>
                  </div>
                )}
                
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <button 
                    className="btn-primary"
                    style={{ fontSize: '1.2rem', padding: '16px 32px' }}
                    onClick={async () => {
                      if (!fromChainValue || !toChainValue || !(erc20Address || tokenAddress) || !amountValue || !fromAccountInput || !toAccountInput) {
                        alert('❌ Please fill in all required fields!');
                        return;
                      }
                      
                      if (!selectedBridge) {
                      alert('❌ Please select the bridge protocol first! Please go back to Step 2 to analyze and select the bridge protocol.');
                        return;
                      }
                      
                      setLoading('transfer');
                      setLoadingProgress(0);
                     setCurrentStep('Initializing transfer...');
                      
                      // 模擬進度
                      const interval = setInterval(() => {
                        setLoadingProgress(prev => {
                          if (prev >= 100) {
                            clearInterval(interval);
                            return 100;
                          }
                          return prev + 1;
                        });
                      }, 1500); // 25分鐘
                      
                      try {
                        const res = await fetch('/api/manual-transfer', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            tokenID: erc20Address || tokenAddress,
                            amt: amountValue,
                            fromChain: fromChainValue,
                            toChain: toChainValue,
                            fromAccount: fromAccountInput,
                            toAccount: toAccountInput,
                            bridge: selectedBridge,
                          }),
                        });
                        
                        const data = await res.json();
                        clearInterval(interval);
                        
                        if (res.ok) {
                          setTxResult(data);
                          setLoadingProgress(100);
                         alert('✅ Transfer completed successfully!');
                        } else {
                         alert(`❌ Transfer failed: ${data.error}`);
                        }
                      } catch (err) {
                        clearInterval(interval);
                        console.error('Transfer Error:', err);
                       alert('❌ Transfer request failed');
                      } finally {
                        setTimeout(() => setLoading(''), 2000);
                      }
                    }}
                    disabled={loading === 'transfer'}
                  >
                  {loading === 'transfer' ? 'Transferring...' : '🚀 Executing transfer'}
                  </button>
                </div>
                
                {txResult && (
                  <div className="alert alert-success" style={{ marginTop: '20px' }}>
                  <h4>Transfer successful! </h4>
<p><strong>Source transaction:</strong></p>
                    {txResult.srcTxids && txResult.srcTxids.map((txid: any, index: number) => (
                      <div key={index} style={{ marginBottom: '8px' }}>
                        <code style={{ wordBreak: 'break-all' }}>
                          {typeof txid === 'string' ? txid : (txid.address || txid.hash || JSON.stringify(txid))}
                        </code>
                        <a href={`https://sepolia.etherscan.io/tx/${typeof txid === 'string' ? txid : (txid.address || txid.hash)}`} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '8px' }}>🔗 View</a>
                      </div>
                    ))}
                  <p><strong>Target Transaction:</strong></p> 
{txResult.destTxids && txResult.destTxids.map((txid: any, index: number) => ( 
<div key={index} style={{ marginBottom: '8px' }}> 
<code style={{ wordBreak: 'break-all' }}>
{typeof txid === 'string' ? txid : (txid.address || txid.hash || JSON.stringify(txid))}
</code> 
<a href={`https://explorer.solana.com/tx/${typeof txid === 'string' ? txid : (txid.address || txid.hash)}?cluster=devnet`} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '8px' }}>🔗 View</a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {selectedBridge === 'allbridge' && (
          <div className="alert alert-warning">
          <h3>⚠️ Allbridge Simulation Mode</h3>
<p>You selected Allbridge, but this is only simulation data. Actual functions have not yet been implemented. Please select Wormhole for real cross-chain transfers. </p>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}