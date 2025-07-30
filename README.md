# Harmonization Platform

A comprehensive cross-chain bridge risk assessment and token transfer platform that provides real-time risk analysis, cost estimation, and secure token bridging between Ethereum and Solana networks.

## Overview

The Harmonization Platform consists of three main components:
- **Frontend**: Next.js application with real-time risk assessment UI
- **Backend**: Express.js API with risk calculation services
- **Blockchain**: Token bridge implementation using Wormhole SDK

## Features

- Real-time cross-chain bridge risk assessment
- GARCH volatility modeling for price prediction
- Gas cost estimation for Ethereum and Solana
- Bridge status monitoring and health checks
- Token attestation and transfer capabilities
- Depeg risk analysis for stablecoins
- Price impact and slippage calculations

## Architecture
```bash
├── apps/
│ ├── frontend/ # Next.js UI application
│ ├── backend/ # Express.js API server
│ └── blockchain/ # Wormhole bridge implementation
├── packages/
│ ├── sdk/ # Shared SDK utilities
│ ├── types/ # TypeScript type definitions
│ └── ui/ # Shared UI components

```

## Prerequisites

- Node.js 18+ and npm
- Python 3.8+ (for GARCH calculations)
- Solana CLI tools
- Ethereum wallet with testnet funds

## Installation

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd Harmonization-platform
npm install
```

### 2. Environment Configuration

Create a `.env` file in the `frontend` folder:

```bash
# API Keys
ETHERSCAN_API_KEY=<your_etherscan_api_key>
COINGECKO_API_KEY=<your_coingecko_api_key>
ALCHEMY_API_KEY=<your_alchemy_api_key>

# Blockchain Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
WORMHOLE_TOKEN_BRIDGE=0x3ee18B2214AFF97000D974cf647E7C347E8fa585
USDC_CONTRACT=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
USDT_CONTRACT=0xdAC17F958D2ee523a2206206994597C13D831ec7

# Vault Addresses
USDCET_VAULT_ADDRESS=4Mn3Kdqy1wBy2t4wpgU21mnasAi3oagrr28Ln5bNfF6n
USDC_VAULT_ADDRESS=5C6fNbM5AgqzXZVDrWqzVH8AupQqnZzQwEbsiUG5hyJS
USDTET_VAULT_ADDRESS=9ByfhTggEb1khEbsHDNVtCJWuCWBT8CrCc5byisQGuo
USDT_VAULT_ADDRESS=kw72kAQhxqQiJRg3NPAyR9qpPZgBXvQS5QhK5akCZhR

# Token Mints
USDCET_MINT=A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM
USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
USDTET_MINT=Dn4noZ5jgGfkntzcQSUZ8czkreiZ1ForXYoV2H8Dm7S1
USDT_MINT=Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB

# API Endpoints
ETHERSCAN_BASE_URL=https://api.etherscan.io/v2/api
COINGECKO_BASE_URL=https://api.coingecko.com/api/v3
WORMHOLESCAN_VAAS_URL=https://api.wormholescan.io/api/v1/vaas
RAYDIUM_TRADE_API_BASE_URL=https://transaction-v1.raydium.io
RAYDIUM_API_BASE_URL=https://api-v3.raydium.io
ALCHEMY_BASE_URL=https://eth-mainnet.g.alchemy.com/v2

```

### 3. Python Environment Setup

```bash
cd apps/backend/src/risk_utils
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install numpy arch
```

## Development

### Start Development Servers

```bash
# Start frontend (Next.js)
cd apps/frontend
npm run dev

# Start backend (Express.js)
cd apps/backend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### API Endpoints

- `POST /api/risk` - Risk assessment for token transfers
- `POST /api/quote` - Get bridge quotes
- `POST /api/attest` - Token attestation
- `POST /api/manual-transfer` - Execute token transfers

## Risk Assessment Features

### Volatility Modeling
- GARCH(1,1) model for price volatility prediction
- Time horizon adjustment for cross-chain transfers
- Confidence interval calculations

### Cost Analysis
- Real-time gas price estimation
- Bridge fees calculation
- Slippage impact assessment
- Total cost breakdown in USD

### Bridge Monitoring
- Wormhole bridge status checking
- VAA (Valid Attestation Authority) tracking
- Transaction confirmation monitoring

## Token Bridge Operations

### Attestation Process
1. Submit token for attestation on source chain
2. Wait for Guardian network VAA generation
3. Complete attestation on destination chain
4. Verify wrapped token creation

### Transfer Process
1. Initiate transfer on source chain
2. Wait for attestation completion
3. Complete transfer on destination chain
4. Verify token receipt

## Testing

```bash
# Run all tests
npm test

# Run specific app tests
cd apps/frontend && npm test
cd apps/backend && npm test
```

## Deployment

### Frontend Deployment
```bash
cd apps/frontend
npm run build
npm start
```

### Backend Deployment
```bash
cd apps/backend
npm run build
npm start
```
