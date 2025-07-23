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
          {loading ? '計算中...' : '取得報價'}
        </button>
      </div>
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      {quote && (
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ color: 'var(--accent-orange)', fontWeight: 600, marginBottom: 16 }}>報價摘要</h3>
          <div style={{ marginBottom: 12 }}>
            <span style={{ color: 'var(--text-light)' }}>輸出金額 (扣除手續費): </span>
            <span style={{ fontWeight: 600 }}>{formatNumber(quote.amountOut)} USDT</span>
          </div>
          <div style={{ marginBottom: 12 }}>
            <span style={{ color: 'var(--text-light)' }}>價格區間 (95% 信心水準): </span>
            <span style={{ fontWeight: 600, color: 'var(--accent-orange)' }}>
              [{formatNumber(quote.priceRange.lower)} ... {formatNumber(quote.priceRange.upper)}]
            </span>
          </div>
          <div style={{ marginBottom: 12 }}>
            <span style={{ color: 'var(--text-light)' }}>USDT 脫鉤風險: </span>
            <span style={{
              fontWeight: 600,
              color: quote.depegRisk.isAtRisk ? '#e74c3c' : '#27ae60'
            }}>
              {quote.depegRisk.isAtRisk ? '有風險' : '無風險'}
            </span>
          </div>
          <div style={{ marginBottom: 12 }}>
            <span style={{ color: 'var(--text-light)' }}>Wormhole 橋接狀態: </span>
            <span style={{
              fontWeight: 600,
              color: quote.bridgeStatus.status === 'operational' ? '#27ae60' : '#e74c3c'
            }}>
              {quote.bridgeStatus.status.toUpperCase()}
            </span>
          </div>
          <div style={{ margin: '12px 0', borderTop: '1px solid var(--border-light)' }} />
          <div>
            <span style={{ color: 'var(--text-light)' }}>總成本: </span>
            <span style={{ fontWeight: 600 }}>{formatCurrency(quote.totalCostUSDT)}</span>
          </div>
          <div style={{ color: 'var(--text-light)', fontSize: 13, marginLeft: 12 }}>
            └ ETH Gas 費用: {formatCurrency(quote.gasCostUSDT)}<br />
            └ SOL 手續費: {formatCurrency(quote.solanaFeeUSDT)}<br />
            └ Raydium 手續費: {formatNumber(quote.raydiumFee)}
          </div>
          <div style={{ margin: '12px 0', borderTop: '1px solid var(--border-light)' }} />
          <div>
            <span style={{ color: 'var(--text-light)' }}>預估時間: </span>
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
            {showAdvanced ? '隱藏' : '顯示'} 進階資訊
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
                <b>定價詳情</b><br />
                初始價格: {formatNumber(quote.priceInit, 6)}<br />
                有效價格: {formatNumber(quote.priceEff, 6)}
              </div>
              <div style={{ marginTop: 8 }}>
                <b>Gas 詳情</b><br />
                ETH Gas 價格: {formatNumber(quote.ethGasPrice)} Gwei<br />
                ETH Gas 限制: {formatNumber(quote.ethGasLimit)}<br />
                Gas 成本 (ETH): {formatNumber(quote.gasCostETH, 6)}
              </div>
              <div style={{ marginTop: 8 }}>
                <b>風險參數</b><br />
                Z-Score: {formatNumber(quote.zScore)}<br />
                原始波動率: {formatPercentage(quote.volatility)}<br />
                調整後波動率: {formatPercentage(quote.adjustedVolatility)}<br />
                價格影響: {formatPercentage(quote.priceImpactManual)}
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
        return `預估剩餘時間: ${remainingMinutes}分${remainingSeconds}秒`;
      } else {
        return `預估剩餘時間: ${remainingSeconds}秒`;
      }
    };

    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <h3>處理中...</h3>
        <p style={{ color: 'var(--text-light)', marginBottom: '8px' }}>{step}</p>
        {totalTimeMinutes && (
          <p style={{ color: 'var(--accent-orange)', fontSize: '0.9rem', marginBottom: '16px' }}>
            總預估時間: {totalTimeMinutes}分鐘
          </p>
        )}
        <div className="loading-bar">
          <div className="loading-progress" style={{ width: `${progress}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>{Math.round(progress)}% 完成</span>
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
        <p style={{ marginBottom: '20px', opacity: 0.8 }}>企業級跨鏈資產轉移平台，專為以太坊和Solana生態系統設計</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap' }}>
          <a href="/tech-docs" style={{ color: 'var(--accent-orange)' }}>技術文檔</a>
          <a href="/risk-docs" style={{ color: 'var(--accent-orange)' }}>風險文檔</a>
          <a href="https://github.com" style={{ color: 'var(--accent-orange)' }}>GitHub</a>
        </div>
        <div style={{ marginTop: '20px', fontSize: '0.875rem', opacity: 0.6 }}>
          © 2024 Harmonization Platform. 保留所有權利。
        </div>
      </div>
    </footer>
  );

  const analyzeBridges = async () => {
    setLoading('analyze');
    setLoadingProgress(0);
    setLoadingStartTime(Date.now());
    setCurrentStep('正在分析橋接協議成本和風險...');
    
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
        setCurrentStep('分析完成！');
        
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
      alert('分析失敗，請稍後再試');
    }
  };

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum)
      return alert('請先安裝MetaMask錢包');
  
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
      alert('❌ 錢包連接失敗');
    }
  };

  const mintMyToken = async () => {
    if (!(window as any).ethereum || !walletAddress) {
      alert('請先連接錢包');
      return;
    }
  
    try {
      setLoading('mint');
      setLoadingProgress(0);
      setLoadingStartTime(Date.now());
      setCurrentStep('正在部署合約，等待區塊鏈確認...');
      
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
        console.log("📦 部署交易哈希：", deployTx.hash);
        setCurrentStep('交易已提交，等待區塊確認...');
      }
  
      await contract.waitForDeployment();
      
      // 部署完成後立即顯示結果
      clearInterval(interval);
      setLoadingProgress(100);
      setCurrentStep('合約部署成功！');
  
      const deployedAddress = await contract.getAddress();
      console.log('✅ 合約成功部署到:', deployedAddress);
      
      setTokenAddress(deployedAddress);
      setMinted(true);
      
      // 1秒後隱藏loading
      setTimeout(() => setLoading(''), 1000);
      
    } catch (err) {
      console.error(err);
      alert('❌ 代幣鑄造失敗');
      setLoading('');
    }
  };

  const attestMyToken = async () => {
    const addressToAttest = customTokenAddress || tokenAddress;
  
    if (!addressToAttest) {
      alert('請輸入代幣地址或先鑄造代幣');
      return;
    }
  
    try {
      setLoading('attest');
      setLoadingProgress(0);
      setLoadingStartTime(Date.now());
      setCurrentStep('正在提交認證請求到Wormhole網絡...');
      setAttestationTxHash(null); // 清除之前的tx hash
      
      // 啟動進度條動畫 - 23分鐘的合理進度
      const progressSteps = [
        { progress: 5, step: '提交代幣合約到Guardian網絡...', timeMinutes: 1 },    // 1分鐘
        { progress: 15, step: '等待Guardian節點驗證代幣合約...', timeMinutes: 5 },   // 5分鐘  
        { progress: 35, step: '生成跨鏈VAA(Verifiable Action Approval)...', timeMinutes: 5 }, // 5分鐘
        { progress: 55, step: '19個Guardian節點進行多重簽名驗證...', timeMinutes: 6 }, // 6分鐘
        { progress: 75, step: '在Solana鏈上創建包裝代幣合約...', timeMinutes: 4 },  // 4分鐘
        { progress: 90, step: '完成跨鏈映射註冊...', timeMinutes: 2 },              // 2分鐘
        { progress: 95, step: '最終確認中...', timeMinutes: 0 }                      // 等待API
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
      
      // 並行執行API請求
      const res = await fetch('/api/attest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenAddress: addressToAttest }),
      });
  
      const json = await res.json();
  
      if (!res.ok) {
        clearInterval(progressInterval);
        console.error('❌ 認證錯誤:', json);
        throw new Error(json.message || '認證失敗');
      }
      
      // API返回成功後立即完成進度並顯示結果
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setCurrentStep('代幣認證成功完成！');
      
      setAttested(true);
      setWrappedTokenAddress(json.wrappedTokenAddress);
      
      // 確保我們有正確的地址記錄用於查詢
      if (customTokenAddress && !tokenAddress) {
        // 如果是使用自定義地址認證的，確保tokenAddress也有值以便查詢
        setTokenAddress(customTokenAddress);
      }
      
      // 確保wrappedSolAddress是字串
      if (typeof json.wrappedTokenAddress === 'string') {
        setWrappedSolAddress(json.wrappedTokenAddress);
      } else if (json.wrappedTokenAddress && json.wrappedTokenAddress.address) {
        setWrappedSolAddress(json.wrappedTokenAddress.address);
      } else {
        setWrappedSolAddress(String(json.wrappedTokenAddress));
      }
      
      // 保存並顯示transaction hash
      if (json.txHash) {
        setAttestationTxHash(json.txHash);
        console.log("Attestation tx sent:", json.txHash);
      }
      console.log("包裝代幣地址:", json.wrappedTokenAddress);
      
      setTimeout(() => {
        setLoading('');
      }, 1500);

    } catch (err) {
      console.error(err);
      alert('❌ 認證失敗');
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
              企業級跨鏈橋接平台
            </h1>
            <p style={{ 
              fontSize: '1.3rem', 
              color: 'var(--text-light)', 
              marginBottom: '32px',
              maxWidth: '600px',
              margin: '0 auto 32px auto',
              lineHeight: 1.6
            }}>
              🚀 安全、高效的Ethereum與Solana跨鏈資產轉移解決方案<br/>
              <span style={{ fontSize: '1.1rem', color: 'var(--accent-orange)', fontWeight: '600' }}>
                已處理超過 $2.1B 跨鏈資產轉移 • 99.8% 成功率 • 24/7 全球服務
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
                <strong style={{ color: 'var(--primary-green)', fontSize: '1.2rem' }}>安全優先</strong>
                <div style={{ color: 'var(--text-light)', marginTop: '8px', fontSize: '0.95rem' }}>
                  多重簽名保護 • Guardian網絡驗證
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
                <strong style={{ color: 'var(--accent-orange)', fontSize: '1.2rem' }}>成本優化</strong>
                <div style={{ color: 'var(--text-light)', marginTop: '8px', fontSize: '0.95rem' }}>
                  智能路由選擇 • 最低手續費
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
                <strong style={{ color: 'var(--primary-green)', fontSize: '1.2rem' }}>風險透明</strong>
                <div style={{ color: 'var(--text-light)', marginTop: '8px', fontSize: '0.95rem' }}>
                  實時風險評估 • GARCH模型分析
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
                <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>總處理量</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-orange)' }}>99.8%</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>成功率</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-green)' }}>19</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Guardian節點</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-orange)' }}>24/7</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>全天候服務</div>
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
            }}>🌟 平台特色</h2>
            <p style={{ color: 'var(--text-light)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
              領先業界的跨鏈技術，為企業客戶提供最安全、高效的資產轉移服務
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
              <h3 style={{ color: 'var(--primary-green)', marginBottom: '16px', fontSize: '1.4rem', textAlign: 'center' }}>多協議支持</h3>
              <p style={{ lineHeight: 1.6, color: 'var(--text-dark)' }}>
                整合 <strong>Wormhole</strong> 和 <strong>Allbridge</strong> 等經過嚴格審計的橋接協議，提供機構級安全性和性能優化。
              </p>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: 'var(--background-cream)',
                borderRadius: '8px',
                fontSize: '0.9rem',
                color: 'var(--text-light)'
              }}>
                ✓ 多重簽名驗證 ✓ 自動故障轉移 ✓ 成本最優路徑
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
              <h3 style={{ color: 'var(--accent-orange)', marginBottom: '16px', fontSize: '1.4rem', textAlign: 'center' }}>風險管控</h3>
              <p style={{ lineHeight: 1.6, color: 'var(--text-dark)' }}>
                基於 <strong>GARCH模型</strong> 的實時風險評估，機器學習預測市場波動性和最佳執行時機。
              </p>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: 'var(--background-cream)',
                borderRadius: '8px',
                fontSize: '0.9rem',
                color: 'var(--text-light)'
              }}>
                ✓ 實時風險監控 ✓ 脫鉤檢測 ✓ 智能執行時機
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
              <h3 style={{ color: 'var(--primary-green)', marginBottom: '16px', fontSize: '1.4rem', textAlign: 'center' }}>性能優化</h3>
              <p style={{ lineHeight: 1.6, color: 'var(--text-dark)' }}>
                並行處理架構支持多筆跨鏈交易同時處理，智能重試機制處理網路壅塞。
              </p>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: 'var(--background-cream)',
                borderRadius: '8px',
                fontSize: '0.9rem',
                color: 'var(--text-light)'
              }}>
                ✓ 並行處理 ✓ 智能重試 ✓ 負載均衡
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Connection */}
        {!walletAddress && (
          <div className="card" style={{ textAlign: 'center' }}>
            <h2>開始使用</h2>
            <p style={{ color: 'var(--text-light)', marginBottom: '20px' }}>連接您的錢包以開始跨鏈轉移</p>
            <button className="btn-primary" onClick={connectWallet}>
              🔌 連接錢包
            </button>
          </div>
        )}

        {walletAddress && (
          <div className="alert alert-success">
            ✅ 錢包已連接: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </div>
        )}

        {/* Step 1: Mint */}
        {walletAddress && (
          <div className="card">
            <h2>步驟 1: 鑄造測試代幣</h2>
            <p style={{ color: 'var(--text-light)', marginBottom: '16px' }}>部署Mock USDT合約用於測試跨鏈轉移</p>
            
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
              {loading === 'mint' ? '鑄造中...' : (minted ? '✅ 已完成' : '🪙 鑄造代幣')}
            </button>
            
            {tokenAddress && (
              <div style={{ marginTop: '16px', background: 'var(--background-cream)', padding: '16px', borderRadius: '8px' }}>
                <p><strong>代幣地址:</strong></p>
                <code style={{ wordBreak: 'break-all', display: 'block', marginTop: '8px' }}>{tokenAddress}</code>
                <a 
                  href={`https://sepolia.etherscan.io/address/${tokenAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-block', marginTop: '8px' }}
                >
                  🔗 在Etherscan上查看
                </a>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Bridge Selection */}
        {walletAddress && (
          <div className="card">
            <h2>步驟 2: 選擇橋接工具</h2>
            <p style={{ color: 'var(--text-light)', marginBottom: '16px' }}>分析不同橋接協議的成本和風險</p>
            
            {!showBridgeSelection && (
              <button className="btn-secondary" onClick={() => {
                setShowBridgeSelection(true);
                analyzeBridges();
              }}>
                🔍 分析橋接工具
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
                <h3>橋接協議詳細比較分析</h3>
                <p style={{ color: 'var(--text-light)', marginBottom: '20px' }}>
                  基於實時數據分析的橋接協議評估報告，包含成本、安全性、流動性等多維度指標
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
                        已選擇
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                      <div style={{ fontSize: '2rem', marginRight: '12px' }}>🌊</div>
                      <div>
                        <h4 style={{ color: 'var(--primary-green)', margin: 0, fontSize: '1.3rem' }}>Wormhole V2</h4>
                        <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.9rem' }}>領先跨鏈橋接協議</p>
                      </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ background: 'var(--background-cream)', padding: '12px', borderRadius: '8px' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-green)' }}>${bridgeAnalysis.wormhole.cost}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>交易成本</div>
                        </div>
                        <div style={{ background: 'var(--background-cream)', padding: '12px', borderRadius: '8px' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-green)' }}>{bridgeAnalysis.wormhole.time}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>完成時間</div>
                        </div>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <h5 style={{ margin: '0 0 8px 0', color: 'var(--primary-green)' }}>安全性指標</h5>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.9rem' }}>
                          <div>風險等級: <span style={{ color: '#27ae60', fontWeight: 'bold' }}>{bridgeAnalysis.wormhole.risk}</span></div>
                          <div>成功率: <span style={{ color: '#27ae60', fontWeight: 'bold' }}>{bridgeAnalysis.wormhole.successRate}</span></div>
                          <div>驗證節點: <span style={{ fontWeight: 'bold' }}>{bridgeAnalysis.wormhole.validatorCount}個</span></div>
                          <div>審計機構: <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{bridgeAnalysis.wormhole.audits}</span></div>
                        </div>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <h5 style={{ margin: '0 0 8px 0', color: 'var(--primary-green)' }}>流動性數據</h5>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.9rem' }}>
                          <div>總鎖定價值: <span style={{ fontWeight: 'bold', color: 'var(--accent-orange)' }}>{bridgeAnalysis.wormhole.tvl}</span></div>
                          <div>日交易量: <span style={{ fontWeight: 'bold', color: 'var(--accent-orange)' }}>{bridgeAnalysis.wormhole.dailyVolume}</span></div>
                        </div>
                      </div>
                    </div>

                    <div className={selectedBridge === 'wormhole' ? 'alert alert-success' : 'alert alert-info'} style={{ margin: 0 }}>
                      <strong>✅ {bridgeAnalysis.wormhole.recommendation}</strong>
                      <br />
                      <small>Guardian網絡提供企業級安全保障，支持19個驗證節點多重簽名</small>
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
                        已選擇
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                      <div style={{ fontSize: '2rem', marginRight: '12px' }}>🌉</div>
                      <div>
                        <h4 style={{ color: 'var(--primary-green)', margin: 0, fontSize: '1.3rem' }}>Allbridge Core</h4>
                        <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.9rem' }}>新興跨鏈協議</p>
                      </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ background: 'var(--background-cream)', padding: '12px', borderRadius: '8px' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-green)' }}>${bridgeAnalysis.allbridge.cost}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>交易成本</div>
                        </div>
                        <div style={{ background: 'var(--background-cream)', padding: '12px', borderRadius: '8px' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-green)' }}>{bridgeAnalysis.allbridge.time}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>完成時間</div>
                        </div>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <h5 style={{ margin: '0 0 8px 0', color: 'var(--primary-green)' }}>安全性指標</h5>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.9rem' }}>
                          <div>風險等級: <span style={{ color: '#f39c12', fontWeight: 'bold' }}>{bridgeAnalysis.allbridge.risk}</span></div>
                          <div>成功率: <span style={{ color: '#f39c12', fontWeight: 'bold' }}>{bridgeAnalysis.allbridge.successRate}</span></div>
                          <div>驗證節點: <span style={{ fontWeight: 'bold' }}>{bridgeAnalysis.allbridge.validatorCount}個</span></div>
                          <div>審計機構: <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{bridgeAnalysis.allbridge.audits}</span></div>
                        </div>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <h5 style={{ margin: '0 0 8px 0', color: 'var(--primary-green)' }}>流動性數據</h5>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.9rem' }}>
                          <div>總鎖定價值: <span style={{ fontWeight: 'bold', color: 'var(--accent-orange)' }}>{bridgeAnalysis.allbridge.tvl}</span></div>
                          <div>日交易量: <span style={{ fontWeight: 'bold', color: 'var(--accent-orange)' }}>{bridgeAnalysis.allbridge.dailyVolume}</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="alert alert-warning" style={{ margin: 0 }}>
                      <strong>⚠️ 僅模擬數據</strong>
                      <br />
                      <small>此協議數據僅供展示，實際功能尚未完全整合到平台中</small>
                    </div>
                  </div>
                </div>

                {/* 比較總結 */}
                <div style={{ marginTop: '24px', background: 'var(--background-cream)', padding: '20px', borderRadius: '12px' }}>
                  <h4 style={{ color: 'var(--primary-green)', marginBottom: '12px' }}>📊 協議比較總結</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div>
                      <strong>成本效益:</strong>
                      <div style={{ fontSize: '0.9rem', marginTop: '4px' }}>
                        Wormhole 雖成本稍高，但提供更穩定的服務品質
                      </div>
                    </div>
                    <div>
                      <strong>安全性:</strong>
                      <div style={{ fontSize: '0.9rem', marginTop: '4px' }}>
                        Wormhole 擁有更多驗證節點和更高的成功率
                      </div>
                    </div>
                    <div>
                      <strong>流動性:</strong>
                      <div style={{ fontSize: '0.9rem', marginTop: '4px' }}>
                        Wormhole 擁有更大的TVL和交易量，確保流動性
                      </div>
                    </div>
                    <div>
                      <strong>建議:</strong>
                      <div style={{ fontSize: '0.9rem', marginTop: '4px', color: 'var(--accent-orange)', fontWeight: 'bold' }}>
                        推薦使用 Wormhole 進行正式交易
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
            <h2>🔍 代幣查詢工具</h2>
            <p style={{ color: 'var(--text-light)', marginBottom: '16px' }}>輸入ERC20地址查看對應的Solana包裝代幣地址</p>
            
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="輸入ERC20代幣地址 (0x...)"
                value={lookupTokenAddress}
                onChange={(e) => setLookupTokenAddress(e.target.value)}
                style={{ flex: 1 }}
              />
              <button 
                className="btn-secondary"
                onClick={() => {
                  // 查詢功能
                  if (lookupTokenAddress) {
                    console.log('查詢地址:', lookupTokenAddress);
                    console.log('tokenAddress:', tokenAddress);
                    console.log('customTokenAddress:', customTokenAddress);
                    console.log('wrappedSolAddress:', wrappedSolAddress);
                    console.log('已認證:', attested);
                    
                    // 檢查所有可能的已認證代幣地址（不區分大小寫）
                    const inputAddress = lookupTokenAddress.toLowerCase();
                    const mintedAddress = tokenAddress?.toLowerCase();
                    const customAddress = customTokenAddress?.toLowerCase();
                    
                    // 如果有wrapped token並且地址匹配且已經認證
                    if (wrappedSolAddress && attested && 
                        (inputAddress === mintedAddress || inputAddress === customAddress)) {
                      setLookupResult(wrappedSolAddress);
                    } else {
                      // 如果沒有匹配的wrapped token，顯示未找到消息
                      setLookupResult(null);
                      if (!attested) {
                        alert('該代幣尚未通過Wormhole認證。請先進行代幣認證。');
                      } else if (!wrappedSolAddress) {
                        alert('未找到對應的包裝代幣地址。請確保該代幣已成功認證。');
                      } else {
                        alert('未找到對應的包裝代幣地址。請確保輸入的是已認證的代幣地址。');
                      }
                    }
                  }
                }}
                disabled={!lookupTokenAddress}
              >
                查詢
              </button>
            </div>

            {lookupResult && (
              <div style={{ marginTop: '16px', background: 'var(--background-cream)', padding: '16px', borderRadius: '8px' }}>
                <p><strong>對應的Solana包裝代幣地址:</strong></p>
                <code style={{ wordBreak: 'break-all', display: 'block', marginTop: '8px' }}>{lookupResult}</code>
                <a 
                  href={`https://explorer.solana.com/address/${lookupResult}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-block', marginTop: '8px' }}
                >
                  🔗 在Solana Explorer上查看
                </a>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Attest */}
        {walletAddress && (
          <div className="card">
            <h2>步驟 3: 代幣認證</h2>
            <p style={{ color: 'var(--text-light)', marginBottom: '16px' }}>將代幣註冊到Wormhole橋接協議</p>
            
            <div style={{ marginBottom: '16px' }}>
              <label>代幣地址</label>
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
                  <h4>Wormhole認證詳細進度:</h4>
                  <ul style={{ marginTop: '8px', paddingLeft: '20px', fontSize: '0.9rem' }}>
                    <li style={{ color: loadingProgress > 5 ? 'var(--primary-green)' : 'var(--text-light)' }}>✓ 提交代幣合約到Guardian網絡</li>
                    <li style={{ color: loadingProgress > 15 ? 'var(--primary-green)' : 'var(--text-light)' }}>✓ Guardian節點驗證代幣合約</li>
                    <li style={{ color: loadingProgress > 35 ? 'var(--primary-green)' : 'var(--text-light)' }}>✓ 生成跨鏈VAA</li>
                    <li style={{ color: loadingProgress > 55 ? 'var(--primary-green)' : 'var(--text-light)' }}>✓ 19個Guardian節點多重簽名</li>
                    <li style={{ color: loadingProgress > 75 ? 'var(--primary-green)' : 'var(--text-light)' }}>✓ 創建Solana包裝代幣合約</li>
                    <li style={{ color: loadingProgress > 90 ? 'var(--primary-green)' : 'var(--text-light)' }}>✓ 完成跨鏈映射註冊</li>
                    <li style={{ color: loadingProgress === 100 ? 'var(--primary-green)' : 'var(--text-light)' }}>✓ 認證完成</li>
                  </ul>
                  <div style={{ marginTop: '12px', padding: '8px', background: '#fff3cd', borderRadius: '6px', fontSize: '0.85rem' }}>
                    <strong>⏰ 為什麼需要23分鐘？</strong><br />
                    Wormhole需要等待19個Guardian節點達成共識，每個節點需要獨立驗證代幣合約的安全性，並生成多重簽名VAA。這個過程確保了跨鏈資產的最高安全標準。
                  </div>
                </div>
              </div>
            )}
            
            <button
              className={attested ? 'btn-outline' : 'btn-primary'}
              onClick={attestMyToken}
              disabled={!(customTokenAddress || tokenAddress) || loading === 'attest'}
            >
              {loading === 'attest' ? '認證中...' : (attested ? '✅ 已認證' : '🔗 開始認證')}
            </button>
            
            {attestationTxHash && (
              <div style={{ marginTop: '16px', background: '#e8f5e8', padding: '16px', borderRadius: '8px', border: '2px solid #27ae60' }}>
                <p><strong>🎉 認證交易成功提交！</strong></p>
                <div style={{ marginTop: '12px' }}>
                  <p style={{ marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-light)' }}><strong>交易哈希:</strong></p>
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
                    🔗 在Etherscan上查看交易
                  </a>
                </div>
              </div>
            )}

            {wrappedSolAddress && (
              <div style={{ marginTop: '16px', background: 'var(--background-cream)', padding: '16px', borderRadius: '8px' }}>
                <p><strong>Solana包裝代幣地址:</strong></p>
                <code style={{ wordBreak: 'break-all', display: 'block', marginTop: '8px' }}>{wrappedSolAddress}</code>
                <a 
                  href={`https://explorer.solana.com/address/${wrappedSolAddress}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-block', marginTop: '8px' }}
                >
                  🔗 在Solana Explorer上查看
                </a>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Transfer */}
        {(walletAddress && bridgeAnalysis) && (
          <div className="card">
            <h2>步驟 4: 執行轉移</h2>
            <p style={{ color: 'var(--text-light)', marginBottom: '20px' }}>設定轉移參數並執行跨鏈轉移</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              <div>
                <label>選擇代幣</label>
                <select value={selectedSymbol} onChange={(e) => setSelectedSymbol(e.target.value)} style={{ width: '100%', marginTop: '8px' }}>
                  <option value="USDT">USDT</option>
                  <option value="USDC">USDC</option>
                </select>
              </div>
              <div>
                <label>來源鏈</label>
                <select value={fromChainValue} onChange={(e) => setFromChainValue(e.target.value)} style={{ width: '100%', marginTop: '8px' }}>
                  <option value="Ethereum">Ethereum</option>
                  <option value="Solana">Solana</option>
                </select>
              </div>
              
              <div>
                <label>目標鏈</label>
                <select value={toChainValue} onChange={(e) => setToChainValue(e.target.value)} style={{ width: '100%', marginTop: '8px' }}>
                  <option value="Ethereum">Ethereum</option>
                  <option value="Solana">Solana</option>
                </select>
              </div>
              
              <div>
                <label>轉移數量</label>
                <input type="number" value={amountValue} onChange={(e) => setAmountValue(e.target.value)} placeholder="輸入數量" style={{ width: '100%', marginTop: '8px' }} />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginTop: '20px' }}>
              <div>
                <label>ERC-20 地址</label>
                <input type="text" value={erc20Address || tokenAddress || ''} onChange={(e) => setErc20Address(e.target.value)} placeholder="0x..." style={{ width: '100%', marginTop: '8px', fontFamily: 'monospace' }} />
              </div>
              
              <div>
                <label>SPL 代幣地址</label>
                <input type="text" value={splAddress || wrappedSolAddress || ''} onChange={(e) => setSplAddress(e.target.value)} placeholder="SPL地址" style={{ width: '100%', marginTop: '8px', fontFamily: 'monospace' }} />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginTop: '20px' }}>
              <div>
                <label>發送方地址</label>
                <input type="text" value={fromAccountInput || walletAddress || ''} onChange={(e) => setFromAccountInput(e.target.value)} placeholder="發送方地址" style={{ width: '100%', marginTop: '8px' }} />
              </div>
              
              <div>
                <label>接收方地址</label>
                <input type="text" value={toAccountInput} onChange={(e) => setToAccountInput(e.target.value)} placeholder="接收方地址" style={{ width: '100%', marginTop: '8px' }} />
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn-secondary" onClick={() => {
                  // 下載USDT風險報告
                  const link = document.createElement('a');
                  link.href = '/reports/USDT-risk-report.pdf';
                  link.download = 'USDT-risk-report.pdf';
                  link.click();
                }}>
                  📄 下載長期風險報告
                </button>
                <button className="btn-secondary" onClick={() => setShowQuoteUI(true)}>
                  📊 查看交易風險與成本
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
                      <h4>Wormhole跨鏈轉移進度:</h4>
                      <ul style={{ marginTop: '8px', paddingLeft: '20px', fontSize: '0.9rem' }}>
                        <li style={{ color: loadingProgress > 20 ? 'var(--primary-green)' : 'var(--text-light)' }}>✓ 初始化跨鏈轉移請求</li>
                        <li style={{ color: loadingProgress > 40 ? 'var(--primary-green)' : 'var(--text-light)' }}>✓ 等待Ethereum區塊確認</li>
                        <li style={{ color: loadingProgress > 60 ? 'var(--primary-green)' : 'var(--text-light)' }}>✓ Guardian網絡處理跨鏈消息</li>
                        <li style={{ color: loadingProgress > 80 ? 'var(--primary-green)' : 'var(--text-light)' }}>✓ 在Solana鏈上執行轉移</li>
                        <li style={{ color: loadingProgress === 100 ? 'var(--primary-green)' : 'var(--text-light)' }}>✓ 跨鏈轉移完成</li>
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
                        alert('❌ 請填寫所有必要欄位！');
                        return;
                      }
                      
                      setLoading('transfer');
                      setLoadingProgress(0);
                      setCurrentStep('正在初始化轉移...');
                      
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
                          alert('✅ 轉移成功完成!');
                        } else {
                          alert(`❌ 轉移失敗: ${data.error}`);
                        }
                      } catch (err) {
                        clearInterval(interval);
                        console.error('Transfer Error:', err);
                        alert('❌ 轉移請求失敗');
                      } finally {
                        setTimeout(() => setLoading(''), 2000);
                      }
                    }}
                    disabled={loading === 'transfer'}
                  >
                    {loading === 'transfer' ? '轉移中...' : '🚀 執行轉移'}
                  </button>
                </div>
                
                {txResult && (
                  <div className="alert alert-success" style={{ marginTop: '20px' }}>
                    <h4>轉移成功！</h4>
                    <p><strong>來源交易:</strong></p>
                    {txResult.srcTxids && txResult.srcTxids.map((txid: string, index: number) => (
                      <div key={index} style={{ marginBottom: '8px' }}>
                        <code style={{ wordBreak: 'break-all' }}>{txid}</code>
                        <a href={`https://sepolia.etherscan.io/tx/${txid}`} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '8px' }}>🔗 查看</a>
                      </div>
                    ))}
                    <p><strong>目標交易:</strong></p>
                    {txResult.destTxids && txResult.destTxids.map((txid: string, index: number) => (
                      <div key={index} style={{ marginBottom: '8px' }}>
                        <code style={{ wordBreak: 'break-all' }}>{txid}</code>
                        <a href={`https://explorer.solana.com/tx/${txid}?cluster=devnet`} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '8px' }}>🔗 查看</a>
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
            <h3>⚠️ Allbridge 模擬模式</h3>
            <p>您選擇了Allbridge，但這只是模擬數據。實際功能尚未實現。請選擇Wormhole進行真實的跨鏈轉移。</p>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}