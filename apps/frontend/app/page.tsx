'use client';

import { useState } from 'react';
import issuerRisk from './issuerRisk.json';

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
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [showSettlement, setShowSettlement] = useState(false);
  const [showBridge, setShowBridge] = useState(false);

  // Bridge quote/settlement original state
  const [quotes, setQuotes] = useState([]);
  const [selectedBridge, setSelectedBridge] = useState('');
  const [txResult, setTxResult] = useState<any>(null);

  // Bridge quote/settlement original logic
  const fetchQuotes = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromChain: 'Ethereum',
          toChain: 'Solana',
          amount: 100,
        }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();
      setQuotes(data);
      setTxResult(null);
    } catch (err) {
      alert('Failed to get quotes. Please check if the backend is running.');
    }
  };

  const executeTransfer = async () => {
    if (!selectedBridge) return alert('Please select a bridge!');

    try {
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
      alert(`✅ Settlement Successful! TxHash: ${data.txHash}`);
    } catch (err) {
      alert('Settlement execution failed');
    }
  };

  // Get all symbols from issuerRisk.json
  const symbols = issuerRisk.map(r => r.symbol);

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🔁 Harmonization Quote</h1>

      {/* 1. Stablecoin selection */}
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

      {/* 2. Issuer risk section */}
      {selectedSymbol && <IssuerRiskSection symbol={selectedSymbol} />}

      {/* 3. Continue Settlement button */}
      {selectedSymbol && !showSettlement && (
        <button
          className="bg-green-600 text-white px-4 py-2 rounded mt-4"
          onClick={() => setShowSettlement(true)}
        >
          Continue Settlement
        </button>
      )}

      {/* 4. Settlement quote section */}
      {showSettlement && (
        <>
          <SettlementQuoteSection
            quote={{
              symbol: selectedSymbol,
              totalCost: 0.15, // Example data
              waitTime: 32, // Example data
              priceRange: [0.995, 1.005], // Example data
              margin: 0.02 // Example data
            }}
          />
          {/* 5. Get Bridge Quotes button (only one place) */}
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

      {/* 6. Bridge quote/settlement original UI */}
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
  );
}
