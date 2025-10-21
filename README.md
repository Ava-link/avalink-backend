# Avalink Backend

A comprehensive Express backend with PostgreSQL database support and blockchain contract deployment capabilities.

## Features

- Express.js server
- PostgreSQL database connection (AWS RDS)
- Health check endpoint
- **Unified Cross-Chain Bridge Deployment** 🆕
- Smart contract deployment to any EVM-compatible blockchain
- TypeScript support
- Environment variable validation with Zod
- Centralized configuration management
- CORS enabled
- Layered architecture (Routes → Controllers → Services)

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database (AWS RDS)
- Yarn or npm
- **Funded wallet for contract deployments** (for blockchain features)
- RPC endpoints for target blockchains

## Installation

```bash
# Install dependencies
yarn install
# or
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update the `.env` file with your AWS RDS PostgreSQL credentials and blockchain config:
```env
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=your-rds-instance.region.rds.amazonaws.com
DB_PORT=5432
DB_NAME=avalink
DB_USER=your_username
DB_PASSWORD=your_password
DB_SSL=true

# Blockchain Configuration (for contract deployment)
DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
DEFAULT_GAS_LIMIT=5000000
```

⚠️ **Security Warning:** Never commit your private key to version control!

## Running the Server

### Development Mode
```bash
yarn dev
# or
npm run dev
```

### Production Build
```bash
# Build
yarn build
# or
npm run build

# Start
yarn start
# or
npm start
```

## API Endpoints

### Health Check
- **Endpoint:** `GET /health`
- **Description:** Returns server health status and database connectivity
- **Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-06T...",
  "uptime": 123.45,
  "database": {
    "status": "healthy",
    "timestamp": "2025-10-06T..."
  },
  "environment": "development"
}
```

### Unified Bridge Deployment 🆕
- **Endpoint:** `PUT /deploy/bridge`
- **Description:** Deploy complete cross-chain token bridge with a single API call
- **Features:**
  - Deploys or uses existing TeleporterMessenger on both chains
  - Deploys or uses existing TeleporterRegistry on both chains
  - Deploys ERC20TokenHome on home chain
  - Deploys ERC20TokenRemote on remote chain
  - Handles all dependencies automatically
- **Documentation:** See [UNIFIED_BRIDGE_API.md](./docs/UNIFIED_BRIDGE_API.md)
- **Examples:** See [UNIFIED_BRIDGE_EXAMPLES.json](./docs/UNIFIED_BRIDGE_EXAMPLES.json)

**Quick Example:**
```bash
curl -X PUT http://localhost:3001/deploy/bridge \
  -H "Content-Type: application/json" \
  -d '{
    "homeChain": {
      "rpcUrl": "https://api.avax-test.network/ext/bc/C/rpc",
      "blockchainId": "0x7fc93d85c6d62c5b2ac0b519c87010ea5294012d1e407030d6acd0021cac10d5",
      "tokenAddress": "0x5425890298aed601595a70AB815c96711a31Bc65",
      "tokenDecimals": 18,
      "teleporterMessenger": { "deploy": true },
      "teleporterRegistry": { "deploy": true }
    },
    "remoteChain": {
      "rpcUrl": "https://subnets.avax.network/mysubnet/rpc",
      "blockchainId": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "teleporterManagerAddress": "0x1234567890123456789012345678901234567890",
      "tokenName": "Wrapped Token",
      "tokenSymbol": "WTKN",
      "tokenDecimals": 18,
      "initialReserveImbalance": 0,
      "teleporterMessenger": { "deploy": true },
      "teleporterRegistry": { "deploy": true }
    }
  }'
```

### Individual Contract Deployment
For deploying contracts individually, see [DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md):
- `PUT /deploy/erc20-token-home` - Deploy ERC20TokenHome
- `PUT /deploy/erc20-token-remote` - Deploy ERC20TokenRemote
- `PUT /deploy/teleporter-messenger` - Deploy TeleporterMessenger
- `PUT /deploy/teleporter-registry` - Deploy TeleporterRegistry
- `GET /deploy/wallet-info` - Get deployer wallet info
- `GET /deploy/artifacts/:contractName` - Get contract ABI & bytecode

## Project Structure

```
avalink-backend/
├── src/
│   ├── config/
│   │   ├── env.ts                           # Environment validation with Zod
│   │   ├── database.ts                      # Database configuration
│   │   └── wallet.ts                        # Global wallet module 🆕
│   ├── controllers/
│   │   ├── health.controller.ts             # Health check controller
│   │   └── deployment.controller.ts         # Contract deployment controllers 🆕
│   ├── services/
│   │   ├── health.service.ts                # Health check business logic
│   │   └── deployment/                      # Contract deployment services 🆕
│   │       ├── base.deployment.service.ts
│   │       ├── erc20TokenHome.deployment.service.ts
│   │       ├── erc20TokenRemote.deployment.service.ts
│   │       ├── teleporterMessenger.deployment.service.ts
│   │       ├── teleporterRegistry.deployment.service.ts
│   │       ├── unified.deployment.service.ts    # 🌟 Unified bridge deployment
│   │       └── index.ts
│   ├── routes/
│   │   ├── health.ts                        # Health check routes
│   │   └── deployment.ts                    # Contract deployment routes 🆕
│   ├── abi/                                 # Contract ABIs & bytecode 🆕
│   │   ├── ERC20TokenHome.json
│   │   ├── ERC20TokenRemote.json
│   │   ├── TeleporterMessenger.json
│   │   └── TeleporterRegistry.json
│   └── index.ts                             # Main application entry
├── docs/                                    # Documentation 🆕
│   ├── API_REFERENCE.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── UNIFIED_BRIDGE_API.md                # 🌟 Unified bridge docs
│   └── UNIFIED_BRIDGE_EXAMPLES.json         # 🌟 Example requests
├── .env.example                             # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Architecture

The project follows a layered architecture:

- **Routes Layer** (`/routes`): Defines API endpoints and maps them to controllers
- **Controllers Layer** (`/controllers`): Handles HTTP requests/responses and calls services
- **Services Layer** (`/services`): Contains business logic and data operations
- **Config Layer** (`/config`): Application configuration with validated environment variables

### Environment Variable Management

All environment variables are centrally managed in `src/config/env.ts` and validated using Zod:

- ✅ **Type-safe**: Full TypeScript support with inferred types
- ✅ **Validated**: All required variables are checked at startup
- ✅ **Centralized**: Single source of truth for all configuration
- ✅ **Developer-friendly**: Clear error messages if validation fails

All other files import configuration from `env.ts`, ensuring consistency throughout the application.

**Example Usage:**

```typescript
// Instead of this:
const port = process.env.PORT || 3001;
const dbHost = process.env.DB_HOST;

// Do this:
import { env } from './config/env';
const port = env.PORT;        // Type: number (validated)
const dbHost = env.DB_HOST;   // Type: string (validated)
```

If any required environment variable is missing or invalid, the application will fail to start with a clear error message:

```
✗ Environment validation failed:
  - DB_HOST: String must contain at least 1 character(s)
  - DB_PASSWORD: String must contain at least 1 character(s)

Please check your .env file and ensure all required variables are set.
```

## Unified Bridge Deployment

The unified bridge deployment feature allows you to deploy a complete cross-chain token bridge with a **single API call**.

### Key Features

✅ **One-Click Deployment** - Deploy entire bridge infrastructure with one request  
✅ **Flexible Configuration** - Choose to deploy new Teleporter contracts or use existing ones  
✅ **Automatic Dependencies** - All contract dependencies handled automatically  
✅ **Cross-Chain Support** - Works with any two EVM-compatible chains  
✅ **Comprehensive Validation** - All inputs validated before deployment  
✅ **Detailed Logging** - Step-by-step deployment progress tracking  

### What Gets Deployed

The unified endpoint orchestrates deployment across **two chains**:

**Home Chain (Source):**
- TeleporterMessenger (optional)
- TeleporterRegistry (optional)
- ERC20TokenHome (always deployed)

**Remote Chain (Destination):**
- TeleporterMessenger (optional)
- TeleporterRegistry (optional)
- ERC20TokenRemote (always deployed)

### Quick Start

1. **Fund your deployer wallet** on both chains
2. **Prepare your request** with all required parameters
3. **Send the request** to `PUT /deploy/bridge`
4. **Get all contract addresses** in the response

### Example Deployment

```bash
# Check wallet has funds
curl "http://localhost:3001/deploy/wallet-info?rpcUrl=https://api.avax-test.network/ext/bc/C/rpc"

# Deploy complete bridge
curl -X PUT http://localhost:3001/deploy/bridge \
  -H "Content-Type: application/json" \
  -d @bridge-config.json
```

### Documentation

- 📘 **[Unified Bridge API Documentation](./docs/UNIFIED_BRIDGE_API.md)** - Complete API reference
- 📝 **[Example Requests](./docs/UNIFIED_BRIDGE_EXAMPLES.json)** - Ready-to-use examples
- 📖 **[Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)** - Individual contract deployment
- 📋 **[API Reference](./docs/API_REFERENCE.md)** - All API endpoints

### Supported Networks

Works with any EVM-compatible blockchain:
- ✅ Avalanche (C-Chain, Subnets)
- ✅ Ethereum (Mainnet, Testnets)
- ✅ Polygon
- ✅ Base
- ✅ Arbitrum
- ✅ Optimism
- ✅ Any EVM chain with RPC endpoint

## License

ISC

