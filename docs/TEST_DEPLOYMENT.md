# Testing the Deployment Services

## Quick Test Guide

### Prerequisites

1. Set up your `.env` file with a funded wallet
2. Start the server: `yarn dev`

### Test Endpoints

#### 1. Check Wallet Info

```bash
# Get wallet address and balance
curl "http://localhost:3001/deploy/wallet-info?rpcUrl=https://api.avax-test.network/ext/bc/C/rpc"
```

Expected response:
```json
{
  "success": true,
  "address": "0xYourWalletAddress",
  "balance": "X.XX native tokens"
}
```

#### 2. Get Contract Artifacts

```bash
# Get ERC20TokenHome ABI and bytecode
curl "http://localhost:3001/deploy/artifacts/erc20-token-home"
```

Expected response:
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

#### 3. Test Deployment (Example with TeleporterMessenger)

```bash
# Deploy TeleporterMessenger to Fuji testnet
curl -X PUT http://localhost:3001/deploy/teleporter-messenger \
  -H "Content-Type: application/json" \
  -d '{
    "rpcUrl": "https://api.avax-test.network/ext/bc/C/rpc",
    "constructorArgs": [],
    "gasLimit": 8000000
  }'
```

Expected response on success:
```json
{
  "success": true,
  "contractAddress": "0x...",
  "transactionHash": "0x...",
  "deployerAddress": "0x...",
  "chainRpcUrl": "https://api.avax-test.network/ext/bc/C/rpc",
  "gasUsed": "...",
  "timestamp": "2025-10-08T..."
}
```

### Testing Different Contracts

#### ERC20TokenHome (requires constructor args)

```bash
curl -X PUT http://localhost:3001/deploy/erc20-token-home \
  -H "Content-Type: application/json" \
  -d '{
    "rpcUrl": "https://api.avax-test.network/ext/bc/C/rpc",
    "constructorArgs": [
      "0x1234567890123456789012345678901234567890",
      "0x1234567890123456789012345678901234567890",
      "0x1234567890123456789012345678901234567890",
      18
    ],
    "gasLimit": 5000000
  }'
```

#### ERC20TokenRemote (requires constructor args)

```bash
curl -X PUT http://localhost:3001/deploy/erc20-token-remote \
  -H "Content-Type: application/json" \
  -d '{
    "rpcUrl": "https://api.avax-test.network/ext/bc/C/rpc",
    "constructorArgs": [
      "0x1234567890123456789012345678901234567890",
      "0x1234567890123456789012345678901234567890",
      "0x0000000000000000000000000000000000000000000000000000000000000001",
      "0x1234567890123456789012345678901234567890",
      0,
      18,
      "Test Token",
      "TEST"
    ],
    "gasLimit": 5000000
  }'
```

#### TeleporterRegistry (requires constructor args)

```bash
curl -X PUT http://localhost:3001/deploy/teleporter-registry \
  -H "Content-Type: application/json" \
  -d '{
    "rpcUrl": "https://api.avax-test.network/ext/bc/C/rpc",
    "constructorArgs": [
      [
        {
          "version": 1,
          "protocolAddress": "0x1234567890123456789012345678901234567890"
        }
      ]
    ],
    "gasLimit": 3000000
  }'
```

### Verify Deployments

After deployment, you can verify the contract on:

- **Avalanche Fuji Testnet Explorer:** https://testnet.snowtrace.io/
- **Avalanche C-Chain Mainnet Explorer:** https://snowtrace.io/

Just search for the `contractAddress` returned in the deployment response.

### Error Testing

#### Test with insufficient balance
```bash
# Should return error if wallet has no funds
curl -X PUT http://localhost:3001/deploy/teleporter-messenger \
  -H "Content-Type: application/json" \
  -d '{
    "rpcUrl": "https://api.avax-test.network/ext/bc/C/rpc",
    "constructorArgs": [],
    "gasLimit": 8000000
  }'
```

#### Test with invalid RPC URL
```bash
# Should return validation error
curl -X PUT http://localhost:3001/deploy/teleporter-messenger \
  -H "Content-Type: application/json" \
  -d '{
    "rpcUrl": "invalid-url",
    "constructorArgs": [],
    "gasLimit": 8000000
  }'
```

Expected error response:
```json
{
  "success": false,
  "error": "Invalid RPC URL format"
}
```

### Using Postman/Insomnia

Import the following collection:

**Collection Name:** Avalink Deployment API

**Base URL:** `http://localhost:3001`

**Endpoints:**

1. GET `/deploy/wallet-info?rpcUrl={{rpcUrl}}`
2. GET `/deploy/artifacts/erc20-token-home`
3. PUT `/deploy/erc20-token-home`
4. PUT `/deploy/erc20-token-remote`
5. PUT `/deploy/teleporter-messenger`
6. PUT `/deploy/teleporter-registry`

### Environment Variables for Testing

Create a Postman/Insomnia environment with:

```json
{
  "rpcUrl": "https://api.avax-test.network/ext/bc/C/rpc",
  "gasLimit": 5000000
}
```

## Monitoring Deployments

While deploying, watch the server logs for detailed information:

```bash
yarn dev
```

You'll see:
- Deployer address
- Chain RPC URL
- Deployer balance
- Transaction hash
- Gas limit
- Deployment confirmation
- Contract address
- Gas used

Example log output:
```
Deploying contract from address: 0x...
Chain RPC: https://api.avax-test.network/ext/bc/C/rpc
Deployer balance: 10.5 native tokens
Deploying with gas limit: 8000000
Transaction sent: 0x...
Waiting for confirmation...
Contract deployed successfully at: 0x...
Gas used: 1234567
```

## Next Steps

After successful deployment:

1. ✅ Save the contract address
2. ✅ Verify the contract on block explorer
3. ✅ Test contract interactions
4. ✅ Update your frontend/integration with the new address
5. ✅ Document the deployment in your project

## Troubleshooting

If deployment fails:

1. Check wallet has sufficient balance
2. Verify RPC URL is correct and accessible
3. Ensure constructor arguments match contract requirements
4. Check gas limit is sufficient
5. Verify network is not congested
6. Try increasing gas limit if needed

