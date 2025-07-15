# Short-Term Risk Platform

Risk modeling and quoting engine for cross-chain swaps (ETH ↔ SOL, USDC, Wormhole bridge).

## Structure

- `backend/`
  - `api/` — Quote, volatility, price, pool, bridge, gas, and transaction time APIs.
  - `utils/` — Utility scripts (e.g., GARCH volatility in Python).
  - `server.js` — Main backend entrypoint.
- `frontend/`
  - `index.html`, `script.js` — Simple web UI for quote/risk display.
- `instruction.md` — Detailed methodology and risk model documentation.

## Features

- **Liquidity Risk:** Slippage and price impact estimation using AMM math.
- **Volatility Risk:** Historical and GARCH(1,1) volatility modeling.
- **Depeg Risk:** Stablecoin peg monitoring via oracle.
- **Network Risk:** Gas, mempool congestion, and transaction time estimation.
- **Integrated Quote:** Combines all risk/cost models for a comprehensive quote.
- **Margin & Settlement:** Margin requirements and guaranteed execution logic.

## Quickstart

### General Environment Variables
create a `.env` in project root, paste the following variables:
```bash
ETHERSCAN_API_KEY=<YOUR_ETHERSCAN_API_KEY>
COINGECKO_API_KEY=<YOUR_COINGECKO_API_KEY>
ALCHEMY_API_KEY=<YOUR_ALCHEMY_API_KEY>
ETHERSCAN_BASE_URL=https://api.etherscan.io/v2/api
COINGECKO_BASE_URL=https://api.coingecko.com/api/v3
WORMHOLESCAN_VAAS_URL=https://api.wormholescan.io/api/v1/vaas
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
RAYDIUM_TRADE_API_BASE_URL=https://transaction-v1.raydium.io
RAYDIUM_API_BASE_URL=https://api-v3.raydium.io
ALCHEMY_BASE_URL=https://eth-mainnet.g.alchemy.com/v2
BASE_VAULT_ADDRESS=4Mn3Kdqy1wBy2t4wpgU21mnasAi3oagrr28Ln5bNfF6n
QUOTE_VAULT_ADDRESS=5C6fNbM5AgqzXZVDrWqzVH8AupQqnZzQwEbsiUG5hyJS
USDCET_MINT=A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM
USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
WORMHOLE_TOKEN_BRIDGE=0x3ee18B2214AFF97000D974cf647E7C347E8fa585
USDC_CONTRACT=0xA0b86a33E6441951f0d98f0b5C2F7b6b66B6B7B6
```
### Python Environment (for GARCH)
```bash
cd backend/utils
python3 -m venv .venv
source .venv/bin/activate
pip install numpy arch
```

### Node Dependencies
```bash
npm install
```

### Run the App
```bash
npm start 
```

## API Overview

- `/api/quote` — Get full quote with slippage, volatility, gas, bridge, and price range. (this is the only api endpoint)
- `/api/volatility` — Volatility analytics.
- `/api/price` — Price feeds.
- `/api/pool` — Pool data.
- `/api/bridge` — Bridge status.
- `/api/gas` — Gas and network data.
- `/api/txTime` — Transaction time estimation.

## Methodology

See [`instruction.md`](./instruction.md) for:
- Model formulas
- Risk definitions
- Margin and settlement logic
- Example calculation flows

## Requirements

- Node.js 18+
- Python 3.x (for GARCH volatility utility)
