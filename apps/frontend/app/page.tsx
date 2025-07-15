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
  const [fromChainValue, setFromChainValue] = useState('Ethereum');
  const [toChainValue, setToChainValue] = useState('Solana');
  const [amountValue, setAmountValue] = useState('');
  const [erc20Address, setErc20Address] = useState('');
  const [splAddress, setSplAddress] = useState('');
  const [fromAccountInput, setFromAccountInput] = useState('');
  const [toAccountInput, setToAccountInput] = useState('');

 
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
<hr style={{ margin: '40px 0', border: 'none', borderTop: '1px solid #ccc' }} />

<div
  style={{
    background: '#fff',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
    marginBottom: '24px',
  }}
>
  <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Step 3: Transfer</h2>

  {/* Select Coin */}
  <div style={{ marginBottom: '12px' }}>
    <label style={{ fontWeight: 'bold' }}>Select Coin</label>
    <select
      value={selectedSymbol}
      onChange={(e) => setSelectedSymbol(e.target.value)}
      style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc', marginTop: '4px' }}
    >
      <option value="USDT">USDT</option>
      <option value="USDC">USDC</option>
    </select>
  </div>

  {/* From Chain */}
  <div style={{ marginBottom: '12px' }}>
  <label style={{ fontWeight: 'bold' }}>From Chain</label>
  <select
    value={fromChainValue}
    onChange={(e) => setFromChainValue(e.target.value)}
    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc', marginTop: '4px' }}
  >
    <option value="Ethereum">Ethereum</option>
    <option value="Solana">Solana</option>
  </select>
</div>
  {/* To Chain */}
  <div style={{ marginBottom: '12px' }}>
    <label style={{ fontWeight: 'bold' }}>To Chain</label>
            <select
             value={toChainValue}
             onChange={(e) => setToChainValue(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc', marginTop: '4px' }}
            >
      <option value="Ethereum">Ethereum</option>
      <option value="Solana">Solana</option>
    </select>
  </div>

  {/* Amount */}
  <div style={{ marginBottom: '12px' }}>
    <label style={{ fontWeight: 'bold' }}>Amount</label>
    <input
              type="number"
              value={amountValue}
              onChange={(e) => setAmountValue(e.target.value)}
      placeholder="Enter amount"
      style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc', marginTop: '4px' }}
    />
  </div>

  {/* ERC20 Address */}
  <div style={{ marginBottom: '12px' }}>
    <label style={{ fontWeight: 'bold' }}>ERC-20 Address</label>
    <input
              type="text"
              value={erc20Address}
              onChange={(e) => setErc20Address(e.target.value)}
      placeholder="0x..."
      style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc', marginTop: '4px', fontFamily: 'monospace' }}
    />
  </div>

  {/* SPL Address */}
  <div style={{ marginBottom: '12px' }}>
    <label style={{ fontWeight: 'bold' }}>SPL Token Address</label>
    <input
      type="text"
      value={splAddress}
      onChange={(e) => setSplAddress(e.target.value)}
      placeholder="Enter SPL Address"
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

  {/* From Account */}
  <div style={{ marginBottom: '12px' }}>
    <label style={{ fontWeight: 'bold' }}>From Account</label>
    <input
              type="text"
              value={fromAccountInput}
              onChange={(e) => setFromAccountInput(e.target.value)}
      placeholder="Enter source account"
      style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc', marginTop: '4px' }}
    />
  </div>

  {/* To Account */}
  <div style={{ marginBottom: '12px' }}>
    <label style={{ fontWeight: 'bold' }}>To Account</label>
    <input
              type="text"
              value={toAccountInput}
              onChange={(e) => setToAccountInput(e.target.value)}
      placeholder="Enter destination account"
      style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc', marginTop: '4px' }}
    />
  </div>

  {/* Bridge Selection */}
  <div style={{ marginBottom: '12px' }}>
    <label style={{ fontWeight: 'bold' }}>Select Bridge</label>
    <select
      value={selectedBridge}
      onChange={(e) => setSelectedBridge(e.target.value)}
      style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc', marginTop: '4px' }}
    >
      <option value="">-- Select Bridge --</option>
      <option value="wormhole">Wormhole</option>
    </select>
  </div>

  {/* See Long Term Risk and Short Term Risk */}
<div style={{ textAlign: 'center', marginTop: '24px' }}>
  {/* 長期風險 */}
  <button
    onClick={() => setShowRiskInfo(true)}
    style={{
      padding: '10px 20px',
      backgroundColor: '#ff7b00',
      color: 'white',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      marginRight: '12px',
    }}
  >
    📉 Download long term risk report
  </button>

  {/* 短期風險 */}
  <button
    onClick={() => setShowQuoteUI(true)}
    style={{
      padding: '10px 20px',
      backgroundColor: '#ff7b00',
      color: 'white',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
    }}
  >
    📉 See risk and cost of this transaction 
  </button>
</div>

{/* 顯示短期風險與 Execute 按鈕 */}
{showQuoteUI && (
  <div style={{ textAlign: 'center', marginTop: '16px' }}>
    <p style={{ fontSize: '1rem', color: '#333' }}>⚠️ This is short term risk</p>
    <button
      

         
        
      onClick={async () => {
        if (
          !fromChainValue ||
          !toChainValue ||
          !erc20Address ||
          !amountValue ||
          !fromAccountInput ||
          !toAccountInput ||
          !selectedBridge
        ) {
          alert('❌ 請填寫所有欄位！');
          return;
        }
      
        setLoading('transfer');
        try {
          const res = await fetch('/api/manual-transfer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fromChain: fromChainValue,
              toChain: toChainValue,
              tokenAddress: erc20Address,
              amount: amountValue,
              fromAccount: fromAccountInput,
              toAccount: toAccountInput,
              bridge: selectedBridge,
            }),
          });
      
          const data = await res.json();
          if (res.ok) {
            console.log('Transfer Done:', data);
            setTxResult(data);
            alert('✅ Transfer succeeded!');
          } else {
            alert(`❌ Transfer failed: ${data.message}`);
          }
        } catch (err) {
          console.error('Transfer Error:', err);
          alert('❌ Transfer request failed');
        } finally {
          setLoading('');
        }
      }}
      
      style={{
        padding: '10px 20px',
        backgroundColor: '#007bff',
        color: 'white',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        marginTop: '10px',
      }}
              >
                
      🚀 Execute
    </button>
  </div>
)}



</div>

        
        

      </div>
    </div>
  );
}
