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

```bash
npm install
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
