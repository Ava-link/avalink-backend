# Contract Deployment Guide

This backend provides comprehensive services for deploying smart contracts to any EVM-compatible blockchain. Currently supports 4 contracts from the Avalanche Interchain Token Transfer (ICTT) and Teleporter ecosystem.

## Available Contracts

1. **ERC20TokenHome** - Home chain token contract
2. **ERC20TokenRemote** - Remote chain token contract
3. **TeleporterMessenger** - Cross-chain messaging contract
4. **TeleporterRegistry** - Registry for Teleporter contracts

## Setup

### 1. Install Dependencies

```bash
yarn install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

**Important:** Set your `DEPLOYER_PRIVATE_KEY` with a funded wallet:

```env
DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
DEFAULT_GAS_LIMIT=5000000
```

⚠️ **Security Warning:** Never commit your private key to version control!

### 3. Start the Server

```bash
yarn dev
```

The server will start on port 3001 (configurable via `PORT` env variable).

## API Endpoints

### 1. Deploy ERC20TokenHome

**Endpoint:** `PUT http://localhost:3001/deploy/erc20-token-home`

**Request Body:**
```json
{
  "rpcUrl": "https://api.avax-test.network/ext/bc/C/rpc",
  "constructorArgs": [
    "0xTeleporterRegistryAddress",
    "0xRegisteredRemoteAddress",
    "0xTokenAddress",
    18
  ],
  "gasLimit": 5000000
}
```

**Response:**
```json
{
  "success": true,
  "contractAddress": "0x...",
  "transactionHash": "0x...",
  "deployerAddress": "0x...",
  "chainRpcUrl": "https://api.avax-test.network/ext/bc/C/rpc",
  "gasUsed": "1234567",
  "timestamp": "2025-10-08T..."
}
```

### 2. Deploy ERC20TokenRemote

**Endpoint:** `PUT http://localhost:3001/deploy/erc20-token-remote`

**Request Body:**
```json
{
  "rpcUrl": "https://subnets.avax.network/mysubnet/rpc",
  "constructorArgs": [
    "0xTeleporterRegistryAddress",
    "0xTeleporterManagerAddress",
    "sourceBlockchainID (bytes32)",
    "0xTokenHomeAddress",
    "initialReserveImbalance",
    18,
    "Token Name",
    "TOKEN"
  ],
  "gasLimit": 5000000
}
```

### 3. Deploy TeleporterMessenger

**Endpoint:** `PUT http://localhost:3001/deploy/teleporter-messenger`

**Request Body:**
```json
{
  "rpcUrl": "https://api.avax-test.network/ext/bc/C/rpc",
  "constructorArgs": [],
  "gasLimit": 8000000
}
```

### 4. Deploy TeleporterRegistry

**Endpoint:** `PUT http://localhost:3001/deploy/teleporter-registry`

**Request Body:**
```json
{
  "rpcUrl": "https://api.avax-test.network/ext/bc/C/rpc",
  "constructorArgs": [
    [
      {
        "version": 1,
        "protocolAddress": "0xTeleporterMessengerAddress"
      }
    ]
  ],
  "gasLimit": 3000000
}
```

### 5. Get Wallet Info

**Endpoint:** `GET http://localhost:3001/deploy/wallet-info?rpcUrl=https://api.avax-test.network/ext/bc/C/rpc`

**Response:**
```json
{
  "success": true,
  "address": "0x...",
  "balance": "10.5 native tokens"
}
```

### 6. Get Contract Artifacts

**Endpoint:** `GET http://localhost:3001/deploy/artifacts/:contractName`

Available contract names:
- `erc20-token-home`
- `erc20-token-remote`
- `teleporter-messenger`
- `teleporter-registry`

**Example:** `GET http://localhost:3001/deploy/artifacts/erc20-token-home`

**Response:**
```json
{
  "success": true,
  "contractName": "erc20-token-home",
  "artifacts": {
    "abi": [...],
    "bytecode": "0x..."
  }
}
```

## Example Usage with cURL

### Deploy to Avalanche Fuji Testnet

```bash
# First, check your wallet balance
curl "http://localhost:3001/deploy/wallet-info?rpcUrl=https://api.avax-test.network/ext/bc/C/rpc"

# Deploy TeleporterMessenger
curl -X PUT http://localhost:3001/deploy/teleporter-messenger \
  -H "Content-Type: application/json" \
  -d '{
    "rpcUrl": "https://api.avax-test.network/ext/bc/C/rpc",
    "constructorArgs": [],
    "gasLimit": 8000000
  }'
```

### Deploy to Custom Subnet

```bash
# Deploy ERC20TokenHome to your subnet
curl -X PUT http://localhost:3001/deploy/erc20-token-home \
  -H "Content-Type: application/json" \
  -d '{
    "rpcUrl": "https://subnets.avax.network/mysubnet/rpc",
    "constructorArgs": [
      "0xTeleporterRegistryAddress",
      "0xRegisteredRemoteAddress",
      "0xTokenAddress",
      18
    ],
    "gasLimit": 5000000
  }'
```

## Common RPC URLs

### Avalanche Networks

- **Avalanche C-Chain Mainnet:** `https://api.avax.network/ext/bc/C/rpc`
- **Avalanche Fuji Testnet:** `https://api.avax-test.network/ext/bc/C/rpc`

### Other Networks

- **Ethereum Mainnet:** `https://eth.llamarpc.com`
- **Ethereum Sepolia:** `https://rpc.sepolia.org`
- **Polygon Mainnet:** `https://polygon-rpc.com`
- **Base Mainnet:** `https://mainnet.base.org`

## Architecture

### Project Structure

```
src/
├── config/
│   ├── env.ts           # Environment configuration
│   └── wallet.ts        # Global wallet module
├── services/
│   └── deployment/
│       ├── base.deployment.service.ts              # Base deployment logic
│       ├── erc20TokenHome.deployment.service.ts    # ERC20TokenHome deployment
│       ├── erc20TokenRemote.deployment.service.ts  # ERC20TokenRemote deployment
│       ├── teleporterMessenger.deployment.service.ts # TeleporterMessenger deployment
│       ├── teleporterRegistry.deployment.service.ts  # TeleporterRegistry deployment
│       └── index.ts     # Service exports
├── controllers/
│   └── deployment.controller.ts  # Deployment request handlers
├── routes/
│   └── deployment.ts    # Deployment routes
└── abi/
    ├── ERC20TokenHome.json
    ├── ERC20TokenRemote.json
    ├── TeleporterMessenger.json
    └── TeleporterRegistry.json
```

### Key Features

1. **Global Wallet Module** - Reusable wallet/signer for all deployments
2. **Separate Services** - Each contract has its own deployment service
3. **Chain-Agnostic** - Deploy to any EVM chain by providing RPC URL
4. **Type-Safe** - Full TypeScript support with proper types
5. **Error Handling** - Comprehensive error handling and logging
6. **Validation** - Input validation for all deployment parameters

## Troubleshooting

### Common Issues

**1. Insufficient Balance Error**

```
Error: Insufficient balance for deployment. Please fund the deployer wallet.
```

**Solution:** Fund your deployer wallet address with native tokens (AVAX, ETH, etc.)

**2. Invalid RPC URL**

```
Error: Invalid RPC URL format
```

**Solution:** Ensure RPC URL starts with `http://` or `https://`

**3. Gas Estimation Failed**

```
Error: execution reverted
```

**Solution:** Check constructor arguments are correct for the contract

**4. Private Key Error**

```
Error: Deployer private key is required
```

**Solution:** Set `DEPLOYER_PRIVATE_KEY` in your `.env` file

### Getting Test Tokens

- **Avalanche Fuji Testnet:** https://faucet.avax.network/
- **Ethereum Sepolia:** https://sepoliafaucet.com/
- **Polygon Mumbai:** https://faucet.polygon.technology/

## Security Best Practices

1. ✅ Never commit `.env` file to version control
2. ✅ Use separate wallets for testnet and mainnet
3. ✅ Keep private keys secure and encrypted
4. ✅ Verify contract addresses after deployment
5. ✅ Test on testnet before mainnet deployment
6. ✅ Use hardware wallets for production deployments

## Additional Resources

- [Avalanche Documentation](https://docs.avax.network/)
- [Teleporter Documentation](https://docs.avax.network/cross-chain/teleporter/overview)
- [Ethers.js Documentation](https://docs.ethers.org/)

## Support

For issues or questions, please open an issue in the repository.

