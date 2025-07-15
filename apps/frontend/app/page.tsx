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

function IssuerRiskSection({ symbol }: { symbol: string }) {
  const risk = issuerRisk.find(r => r.symbol === symbol);

  if (!risk) return <div>Couldn't find the risk information for {symbol}</div>;

  return (
    <div>
      <h2>{risk.symbol} Risk Level: {risk.level}</h2>
      <p>Risk Score: {risk.score}</p>
      <a href={risk.reportUrl} download>
        <button>Download Risk Report</button>
      </a>
    </div>
  );
}

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
  const [showQuoteUI, setShowQuoteUI] = useState(false);
  const symbols = issuerRisk.map(r => r.symbol);
  
  



  
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
            onClick={async () =>
            {
              console.log('👆 Clicked Fetch');
              try {
                await fetchQuotes();
                setShowQuoteUI(true); // ✅ 成功才設定顯示 UI
              } catch (err) {
                console.error('❌ fetchQuotes failed', err);
                alert('❌ Failed to fetch quotes');
              }
            }}
            disabled={ loading === 'quote'}
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
        </div>

        {showQuoteUI && (
        <main className="p-6 max-w-xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">🔁 Harmonization Quote</h1>

          <div className="mb-4">
            <label htmlFor="symbol-select" className="mr-2">Select a stablecoin:</label>
            <select
              id="symbol-select"
              value={selectedSymbol}
              onChange={e => {
                setSelectedSymbol(e.target.value);
                setShowSettlement(false);
                setShowBridge(false);
                setSelectedBridge('');
                setQuotes([]);
                setTxResult(null);
              }}
            >
              <option value="">Select a stablecoin</option>
              {symbols.map(symbol => (
                <option key={symbol} value={symbol}>{symbol}</option>
              ))}
            </select>
          </div>

          {selectedSymbol && <IssuerRiskSection symbol={selectedSymbol} />}

          {selectedSymbol && !showSettlement && (
            <button
              className="bg-green-600 text-white px-4 py-2 rounded mt-4"
              onClick={() => setShowSettlement(true)}
            >
              Continue Settlement
            </button>
          )}

          {showSettlement && (
            <>
              <SettlementQuoteSection
                quote={{
                  symbol: selectedSymbol,
                  totalCost: 0.15,
                  waitTime: 32,
                  priceRange: [0.995, 1.005],
                  margin: 0.02,
                }}
              />
              {!showBridge && (
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
                  onClick={() => {
                    fetchQuotes();
                    setShowBridge(true);
                  }}
                >
                  Get Bridge Quotes
                </button>
              )}
            </>
          )}

          {showBridge && (
            <>
              <ul className="mt-6 space-y-3">
                {quotes.map((q: any, i) => (
                  <li
                    key={i}
                    className={`p-4 border rounded cursor-pointer ${
                      selectedBridge === q.bridge ? 'bg-blue-100 border-blue-500' : ''
                    }`}
                    onClick={() => setSelectedBridge(q.bridge)}
                  >
                    <strong>{q.bridge}</strong><br />
                    Cost: {q.cost} | Slippage: {q.slippage} | Risk Score: {q.riskScore}
                  </li>
                ))}
              </ul>

              {selectedBridge && (
                <div className="mt-4">
                  <button
                    onClick={executeTransfer}
                    className="bg-green-600 text-white px-4 py-2 rounded"
                  >
                    Execute {selectedBridge} Settlement
                  </button>
                </div>
              )}

              {txResult && (
                <div className="mt-6 p-4 bg-gray-100 border rounded">
                  <p>✅ Settlement Successful!</p>
                  <p>Bridge: {txResult.bridge}</p>
                  <p>Transaction Hash: <code>{txResult.txHash}</code></p>
                </div>
              )}
            </>
          )}
        </main>
      )}

      </div>
    </div>
  );
}
