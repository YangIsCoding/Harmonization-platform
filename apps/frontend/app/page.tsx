'use client';

import { useState } from 'react';
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

function SettlementQuoteSection({ quote }: { quote: SettlementQuote }) {
  return (
    <div className="mt-4 border p-4 rounded">
      <h3>{quote.symbol} Settlement Quote</h3>
      <ul>
        <li>Total Cost: {quote.totalCost}</li>
        <li>Wait Time: {quote.waitTime} seconds</li>
        <li>Price Range: {quote.priceRange[0]} ~ {quote.priceRange[1]}</li>
        <li>Margin: {quote.margin}</li>
      </ul>
    </div>
  );
}

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [tokenAddress, setTokenAddress] = useState<string | null>(null);
  const [minted, setMinted] = useState(false);
  const [attested, setAttested] = useState(false);
  const [quotes, setQuotes] = useState([]);
  const [selectedBridge, setSelectedBridge] = useState('');
  const [txResult, setTxResult] = useState<any>(null);
  const [loading, setLoading] = useState('');
  const [ customTokenAddress, setCustomTokenAddress ] = useState( '' );
  const [ wrappedTokenAddress, setWrappedTokenAddress ] = useState( '' );
  const [ wrappedSolAddress, setWrappedSolAddress ] = useState<string>( '' );
  const [selectedSymbol, setSelectedSymbol] = useState('USDT'); // 預設用 USDT
  const [showRiskInfo, setShowRiskInfo] = useState(false);
  const [ showSettlementInfo, setShowSettlementInfo ] = useState( false );
 
  const [showSettlement, setShowSettlement] = useState(false);
  const [ showBridge, setShowBridge ] = useState( false );
  
  



  
  const connectWallet = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum)
      return alert('Please Install MetaMask First');
  
    try
    {
      await (window as any).ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      });      
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);
      alert(`✅ Connected to wallet：${address}`);
    } catch (err) {
      console.error(err);
      alert('❌ failed to connect wallet');
    }
  };
  

  const mintMyToken = async () => {
    if (!(window as any).ethereum || !walletAddress) {
      alert('please connect your wallet first');
      return;
    }
  
    try {
      setLoading('mint');
  
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
  
      const factory = new ethers.ContractFactory(ERC20_ABI, ERC20_BYTECODE, signer);
  
      // ✅ 無參數 constructor，直接部署
      const contract = await factory.deploy();
  
      const deployTx = contract.deploymentTransaction();
      if (deployTx) {
        console.log("📦 deploy transaction Hash：", deployTx.hash);
      } else {
        console.warn("⚠️ Cannot get deploy transaction");
      }
  
      await contract.waitForDeployment();
  
      const deployedAddress = await contract.getAddress();
      console.log('✅ contract successfully deploy at:', deployedAddress);
      alert(`✅ Deployed Mock USDT！\ncontract address: ${deployedAddress}`);
      
      setTokenAddress(deployedAddress);
      setMinted(true);
    } catch (err) {
      console.error(err);
      alert('❌ failed to mint tokens');
    } finally {
      setLoading('');
    }
  };
  
  
  
  

  const attestMyToken = async () => {
    const addressToAttest = customTokenAddress || tokenAddress;
  
    if (!addressToAttest) {
      alert('Enter token address or Mint deployed token');
      return;
    }
  
    try {
      setLoading('attest');
  
      const res = await fetch('/api/attest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenAddress: addressToAttest }),
      });
  
      const json = await res.json();
  
      if (!res.ok) {
        console.error('❌ Attestation Error:', json);
        throw new Error(json.message || 'Attestation failed');
      }
  
      // 不論是否首次 attested，只要有 wrappedTokenAddress 都設為成功
      setAttested(true);
      setWrappedTokenAddress(json.wrappedTokenAddress);
      setWrappedSolAddress(json.wrappedTokenAddress.address); // ✅ 顯示用
      alert(`✅ Attest succeeded!\nSolana wrapped token address: ${json.wrappedTokenAddress.address}`);
      console.log("wrappedTokenAddress payload:", json.wrappedTokenAddress.address);

    } catch (err) {
      console.error(err);
      alert('❌ Attest failed');
    } finally {
      setLoading('');
    }
  };
  

  const fetchQuotes = async () => {
    try {
      setLoading('quote');
      
      const res = await fetch('http://localhost:3001/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromChain: 'Ethereum',
          toChain: 'Solana',
          amount: 100,
        }),
      });
  
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Backend responded with error:', errorText);
        throw new Error(`Fetch failed with status ${res.status}`);
      }
  
      const data = await res.json();
      console.log('✅ Quotes received:', data);
  
      setQuotes(data);
      setTxResult(null);
      setShowRiskInfo(true);
      setShowSettlementInfo(true);
    } catch (err) {
      console.error('❌ Error while fetching quotes:', err);
      alert('❌ failed to fetch quotes — see console');
    } finally {
      setLoading('');
    }
  };
  
  
  

  const executeTransfer = async () => {
    try {
      setLoading('transfer');
      const res = await fetch('http://localhost:3001/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bridge: selectedBridge,
          fromChain: 'Ethereum',
          toChain: 'Solana',
          amount: 100,
        }),
      });
      const data = await res.json();
      setTxResult(data);
    } catch {
      alert('❌ failed to execute transfer');
    } finally {
      setLoading('');
    }
  };

  return (
    <div style={{ backgroundColor: '#f0f4ff', minHeight: '100vh', padding: '40px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '2rem' }}>
          🔁 Harmonization Platform
        </h1>

        {!walletAddress && (
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <button
              onClick={connectWallet}
              style={{
                padding: '10px 20px',
                backgroundColor: '#ffbf00',
                color: '#000',
                borderRadius: '8px',
                fontWeight: 'bold',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              🔌 Connect Wallet
            </button>
          </div>
        )}

        {/* Step 1: Mint */}
        <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Step 1: Mint Mock USDT</h2>
          <button
            onClick={mintMyToken}
            disabled={minted || loading === 'mint'}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4f8ef7',
              color: 'white',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              opacity: minted || loading === 'mint' ? 0.5 : 1,
            }}
          >
            {loading === 'mint' ? 'Processing...' : 'Mint'}
          </button>
          {tokenAddress && (
            <p style={{ marginTop: '12px', fontSize: '0.875rem', color: '#333' }}>
              🎉 Token Address: <code>{tokenAddress}</code>
            </p>
          )}
        </div>

        {/* Step 2: Attest */}
<div
  style={{
    background: '#fff',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
    marginBottom: '24px',
  }}
>
  <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Step 2: Attest to Bridge</h2>

  <div style={{ marginBottom: '12px' }}>
    <label htmlFor="customTokenInput" style={{ fontSize: '0.9rem' }}>
      🔍  Token Address
    </label>
    <input
      id="customTokenInput"
      type="text"
      placeholder="0x..."
      value={customTokenAddress}
      onChange={(e) => setCustomTokenAddress(e.target.value)}
      style={{
        width: '100%',
        padding: '8px',
        borderRadius: '8px',
        border: '1px solid #ccc',
        marginTop: '4px',
        fontFamily: 'monospace',
      }}
    />
  </div>

  <button
    onClick={attestMyToken}
    disabled={!(customTokenAddress || minted) || loading === 'attest'}
    style={{
      padding: '10px 20px',
      backgroundColor: '#2bbecf',
      color: 'white',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      opacity: !minted || attested || loading === 'attest' ? 0.5 : 1,
    }}
  >
    {loading === 'attest' ? 'Attesting...' : 'Attest'}
  </button>

  {wrappedSolAddress && (
    <div style={{ marginTop: '16px', fontSize: '0.9rem' }}>
      🪙 <strong>Wrapped Token Address on Solana:</strong>
      <div
        style={{
          marginTop: '6px',
          wordBreak: 'break-all',
          backgroundColor: '#f4f4f4',
          padding: '8px',
          borderRadius: '6px',
          fontFamily: 'monospace',
        }}
      >
        {wrappedSolAddress}
      </div>
      <a
        href={`https://explorer.solana.com/address/${wrappedSolAddress}?cluster=devnet`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          marginTop: '6px',
          display: 'inline-block',
          color: '#2bbecf',
          textDecoration: 'underline',
        }}
      >
        🔗 View on Solana Explorer
      </a>
    </div>
  )}
</div>

        {/* Step 3: Transfer */}
        
<div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.06)' }}>
  <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Step 3: Transfer Through Bridge</h2>
  <button
    onClick={fetchQuotes}
    disabled={!attested || loading === 'quote'}
    style={{
      padding: '10px 20px',
      backgroundColor: '#6b5cd6',
      color: 'white',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      opacity: !attested || loading === 'quote' ? 0.5 : 1,
      marginBottom: '16px',
    }}
  >
    {loading === 'quote' ? 'Loading...' : 'Fetch Quotes'}
  </button>

  {/* 📉 Issuer Risk Section */}
  {quotes.length > 0 && (() => {
    const issuer = 'USDT'; // 或根據 tokenAddress 對應出 symbol
    const risk = issuerRisk.find(r => r.symbol === issuer);
    return risk ? (
      <div style={{ background: '#f9f9f9', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
        <h3>📉 {risk.symbol} Issuer Risk</h3>
        <p>Risk Level: <strong>{risk.level}</strong></p>
        <p>Score: {risk.score}</p>
        <a href={risk.reportUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2bbecf', textDecoration: 'underline' }}>
          📄 Download Risk Report
        </a>
      </div>
    ) : <p style={{ color: 'gray' }}>No issuer risk info found.</p>;
  })()}

  {/* 💰 Settlement Quote Section (Mock) */}
  {quotes.length > 0 && (
    <div style={{ background: '#f4f4f4', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
      <h3>💰 Settlement Quote (Mock)</h3>
      <ul style={{ paddingLeft: '20px' }}>
        <li>Total Cost: 0.15</li>
        <li>Wait Time: 32 seconds</li>
        <li>Price Range: 0.995 ~ 1.005</li>
        <li>Margin: 0.02</li>
      </ul>
    </div>
  )}

  {/* 🔁 Bridge Quotes */}
  <div>
    {quotes.map((q: any, i) => (
      <div
        key={i}
        onClick={() => setSelectedBridge(q.bridge)}
        style={{
          padding: '12px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          marginBottom: '8px',
          backgroundColor: selectedBridge === q.bridge ? '#e5edff' : '#fafafa',
          cursor: 'pointer',
        }}
      >
        <strong>{q.bridge}</strong>
        <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>
          cost: {q.cost} | slippage: {q.slippage} | risk: {q.riskScore}
        </p>
      </div>
    ))}
  </div>

  {selectedBridge && (
    <button
      onClick={executeTransfer}
      disabled={loading === 'transfer'}
      style={{
        marginTop: '12px',
        padding: '10px 20px',
        backgroundColor: '#27ae60',
        color: 'white',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        opacity: loading === 'transfer' ? 0.5 : 1,
      }}
    >
      {loading === 'transfer' ? 'Transferring...' : `Transfer via ${selectedBridge}`}
    </button>
  )}

  {txResult && (
    <div style={{ marginTop: '12px', fontSize: '0.9rem', color: 'green' }}>
      ✅ clearing successed！Tx Hash: <code>{txResult.txHash}</code>
    </div>
  )}
</div>

      </div>
    </div>
  );
}
