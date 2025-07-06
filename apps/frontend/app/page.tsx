'use client';

import { useState } from 'react';

export default function Home() {
  const [quotes, setQuotes] = useState([]);
  const [selectedBridge, setSelectedBridge] = useState('');
  const [txResult, setTxResult] = useState<any>(null);

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
      console.log('🎯 quote data:', data);
      setQuotes(data);
      setTxResult(null);
    } catch (err) {
      console.error('❌ fetchQuotes error:', err);
      alert('獲取報價失敗，請確認後端是否啟動');
    }
  };

  const executeTransfer = async () => {
    if (!selectedBridge) return alert('請選擇一個橋！');

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
      alert(`✅ 執行成功！TxHash: ${data.txHash}`);
    } catch (err) {
      console.error('❌ executeTransfer error:', err);
      alert('執行清算失敗');
    }
  };

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🔁 Harmonization Quote</h1>

      <button
        onClick={fetchQuotes}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        查詢報價
      </button>

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
            成本: {q.cost} | 滑價: {q.slippage} | 風險分數: {q.riskScore}
          </li>
        ))}
      </ul>

      {selectedBridge && (
        <div className="mt-4">
          <button
            onClick={executeTransfer}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            執行 {selectedBridge} 清算
          </button>
        </div>
      )}

      {txResult && (
        <div className="mt-6 p-4 bg-gray-100 border rounded">
          <p>✅ 清算成功！</p>
          <p>橋接方案：{txResult.bridge}</p>
          <p>交易哈希：<code>{txResult.txHash}</code></p>
        </div>
      )}
    </main>
  );
}
