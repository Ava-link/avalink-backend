# Quick Start Guide - Unified Bridge Deployment

## Overview

This guide will help you deploy a complete cross-chain token bridge in **5 minutes**.

## Step 1: Prerequisites

### Required Information

Before you start, gather the following:

#### Home Chain (Source Chain)
- ✅ RPC URL (e.g., `https://api.avax-test.network/ext/bc/C/rpc`)
- ✅ Blockchain ID (bytes32 format with 0x prefix)
- ✅ Existing ERC20 token address to bridge
- ✅ Token decimals
- ✅ Funded wallet with native tokens

#### Remote Chain (Destination Chain)
- ✅ RPC URL
- ✅ Blockchain ID (bytes32 format with 0x prefix)
- ✅ Teleporter manager address
- ✅ Desired token name and symbol for wrapped token
- ✅ Funded wallet with native tokens

### Wallet Setup

1. **Create/Use a Wallet**
   ```bash
   # Get your wallet address
   curl "http://localhost:3001/deploy/wallet-info"
   ```

2. **Fund the Wallet**
   - Send native tokens (AVAX, ETH, etc.) to your deployer wallet on **both chains**
   - Recommended: At least 5-10 tokens per chain for safe deployment
   
3. **Verify Balance**
   ```bash
   # Check home chain balance
   curl "http://localhost:3001/deploy/wallet-info?rpcUrl=https://api.avax-test.network/ext/bc/C/rpc"
   
   # Check remote chain balance
   curl "http://localhost:3001/deploy/wallet-info?rpcUrl=https://subnets.avax.network/mysubnet/rpc"
   ```

## Step 2: Prepare Configuration

### Option A: Deploy Everything Fresh

Create a file `bridge-config.json`:

```json
{
  "homeChain": {
    "rpcUrl": "https://api.avax-test.network/ext/bc/C/rpc",
    "blockchainId": "0x7fc93d85c6d62c5b2ac0b519c87010ea5294012d1e407030d6acd0021cac10d5",
    "tokenAddress": "0xYOUR_TOKEN_ADDRESS_HERE",
    "tokenDecimals": 18,
    "teleporterMessenger": {
      "deploy": true
    },
    "teleporterRegistry": {
      "deploy": true
    }
  },
  "remoteChain": {
    "rpcUrl": "https://subnets.avax.network/mysubnet/rpc",
    "blockchainId": "0xYOUR_REMOTE_BLOCKCHAIN_ID_HERE",
    "teleporterManagerAddress": "0xYOUR_MANAGER_ADDRESS_HERE",
    "tokenName": "Wrapped My Token",
    "tokenSymbol": "WMT",
    "tokenDecimals": 18,
    "initialReserveImbalance": 0,
    "teleporterMessenger": {
      "deploy": true
    },
    "teleporterRegistry": {
      "deploy": true
    }
  }
}
```

### Option B: Use Existing Teleporter Contracts

If Teleporter infrastructure already exists on your chains:

```json
{
  "homeChain": {
    "rpcUrl": "https://api.avax-test.network/ext/bc/C/rpc",
    "blockchainId": "0x7fc93d85c6d62c5b2ac0b519c87010ea5294012d1e407030d6acd0021cac10d5",
    "tokenAddress": "0xYOUR_TOKEN_ADDRESS_HERE",
    "tokenDecimals": 18,
    "teleporterMessenger": {
      "deploy": false,
      "contractAddress": "0xEXISTING_MESSENGER_ADDRESS"
    },
    "teleporterRegistry": {
      "deploy": false,
      "contractAddress": "0xEXISTING_REGISTRY_ADDRESS"
    }
  },
  "remoteChain": {
    "rpcUrl": "https://subnets.avax.network/mysubnet/rpc",
    "blockchainId": "0xYOUR_REMOTE_BLOCKCHAIN_ID_HERE",
    "teleporterManagerAddress": "0xYOUR_MANAGER_ADDRESS_HERE",
    "tokenName": "Wrapped My Token",
    "tokenSymbol": "WMT",
    "tokenDecimals": 18,
    "initialReserveImbalance": 0,
    "teleporterMessenger": {
      "deploy": false,
      "contractAddress": "0xEXISTING_MESSENGER_ADDRESS"
    },
    "teleporterRegistry": {
      "deploy": false,
      "contractAddress": "0xEXISTING_REGISTRY_ADDRESS"
    }
  }
}
```

## Step 3: Deploy the Bridge

### Deploy

```bash
curl -X PUT http://localhost:3001/deploy/bridge \
  -H "Content-Type: application/json" \
  -d @bridge-config.json
```

### Monitor Progress

Watch your terminal for deployment progress:

```
========================================
🚀 UNIFIED BRIDGE DEPLOYMENT STARTED
========================================

📍 STEP 1/6: Setting up TeleporterMessenger on Home Chain
✅ Home chain TeleporterMessenger deployed at: 0xabc...

📍 STEP 2/6: Setting up TeleporterRegistry on Home Chain
✅ Home chain TeleporterRegistry deployed at: 0xdef...

📍 STEP 3/6: Setting up TeleporterMessenger on Remote Chain
✅ Remote chain TeleporterMessenger deployed at: 0xghi...

📍 STEP 4/6: Setting up TeleporterRegistry on Remote Chain
✅ Remote chain TeleporterRegistry deployed at: 0xjkl...

📍 STEP 5/6: Deploying ERC20TokenHome on Home Chain
✅ ERC20TokenHome deployed at: 0xmno...

📍 STEP 6/6: Deploying ERC20TokenRemote on Remote Chain
✅ ERC20TokenRemote deployed at: 0xpqr...

========================================
✅ UNIFIED BRIDGE DEPLOYMENT COMPLETE
========================================
```

## Step 4: Save Deployment Results

### Successful Response

```json
{
  "success": true,
  "timestamp": "2025-10-20T12:34:56.789Z",
  "homeChain": {
    "rpcUrl": "https://api.avax-test.network/ext/bc/C/rpc",
    "blockchainId": "0x7fc93d85c6d62c5b2ac0b519c87010ea5294012d1e407030d6acd0021cac10d5",
    "teleporterMessenger": {
      "deployed": true,
      "address": "0xabc123...",
      "transactionHash": "0xdef456...",
      "gasUsed": "1234567"
    },
    "teleporterRegistry": {
      "deployed": true,
      "address": "0x789ghi...",
      "transactionHash": "0xjkl012...",
      "gasUsed": "987654"
    },
    "tokenHome": {
      "address": "0xmno345...",
      "transactionHash": "0xpqr678...",
      "gasUsed": "2345678"
    }
  },
  "remoteChain": {
    "rpcUrl": "https://subnets.avax.network/mysubnet/rpc",
    "blockchainId": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "teleporterMessenger": {
      "deployed": true,
      "address": "0xstu901...",
      "transactionHash": "0xvwx234...",
      "gasUsed": "1111111"
    },
    "teleporterRegistry": {
      "deployed": true,
      "address": "0xyza567...",
      "transactionHash": "0xbcd890...",
      "gasUsed": "999999"
    },
    "tokenRemote": {
      "address": "0xefg123...",
      "transactionHash": "0xhij456...",
      "gasUsed": "2222222"
    }
  },
  "deployerAddress": "0x1234567890123456789012345678901234567890"
}
```

### Important: Save These Addresses

📝 **Create a deployment record file:**

```
DEPLOYMENT RECORD
=================
Date: 2025-10-20

HOME CHAIN (Avalanche Fuji):
- TeleporterMessenger: 0xabc123...
- TeleporterRegistry: 0x789ghi...
- ERC20TokenHome: 0xmno345...

REMOTE CHAIN (My Subnet):
- TeleporterMessenger: 0xstu901...
- TeleporterRegistry: 0xyza567...
- ERC20TokenRemote: 0xefg123...

Deployer Address: 0x1234567890123456789012345678901234567890
```

## Step 5: Post-Deployment

### Verify Contracts

1. **Home Chain Explorer**
   - Verify TeleporterMessenger: `https://testnet.snowtrace.io/address/0xabc123...`
   - Verify TeleporterRegistry: `https://testnet.snowtrace.io/address/0x789ghi...`
   - Verify ERC20TokenHome: `https://testnet.snowtrace.io/address/0xmno345...`

2. **Remote Chain Explorer**
   - Verify all contracts on your remote chain explorer

### Test the Bridge

Test a small cross-chain transfer to ensure everything works:

1. **Approve tokens** on ERC20TokenHome
2. **Send tokens** via Teleporter
3. **Receive wrapped tokens** on remote chain
4. **Verify balances** on both chains

## Common Blockchain IDs

### Avalanche
- **Fuji C-Chain**: `0x7fc93d85c6d62c5b2ac0b519c87010ea5294012d1e407030d6acd0021cac10d5`
- **Mainnet C-Chain**: `0x9f3be606497285d0ffbb5ac9ba24aa60346a9b1812479ed66cb329f394a4b1c7`

### Getting Custom Blockchain IDs

For custom subnets, you can get the blockchain ID:

```bash
# Using avalanche-cli
avalanche subnet describe mysubnet

# Or via RPC
curl -X POST --data '{
    "jsonrpc":"2.0",
    "id"     :1,
    "method" :"eth_chainId",
    "params" :[]
}' -H 'content-type:application/json;' https://your-subnet-rpc
```

## Troubleshooting

### Error: Insufficient Balance

**Problem:** `Insufficient balance for deployment`

**Solution:**
1. Check wallet balance: `curl "http://localhost:3001/deploy/wallet-info?rpcUrl=YOUR_RPC"`
2. Fund your wallet on the chain
3. Retry deployment

### Error: Invalid Address

**Problem:** `Invalid TeleporterMessenger address`

**Solution:**
1. Ensure all addresses have `0x` prefix
2. Verify addresses are valid Ethereum addresses (42 characters)
3. Check for typos

### Error: Deployment Failed

**Problem:** Contract deployment transaction failed

**Solution:**
1. Check RPC URL is accessible
2. Verify blockchain ID is correct
3. Ensure wallet has enough gas
4. Check constructor arguments are correct

### Error: RPC Connection Issues

**Problem:** Cannot connect to RPC endpoint

**Solution:**
1. Verify RPC URL is correct
2. Check network is accessible
3. Try different RPC endpoint
4. Ensure firewall isn't blocking connections

## Tips for Success

1. ✅ **Always test on testnet first** before mainnet deployment
2. ✅ **Double-check all addresses** before deployment
3. ✅ **Save all deployment results** immediately
4. ✅ **Verify contracts** on block explorers
5. ✅ **Test with small amounts** first
6. ✅ **Keep deployment records** organized
7. ✅ **Monitor gas prices** on mainnet deployments

## Next Steps

After successful deployment:

1. ✅ **Verify all contracts** on block explorers
2. ✅ **Test token transfers** with small amounts
3. ✅ **Configure access controls** if needed
4. ✅ **Monitor events** for Teleporter messages
5. ✅ **Document your setup** for team reference
6. ✅ **Set up monitoring** for production bridges

## Getting Help

- 📘 [Full API Documentation](./UNIFIED_BRIDGE_API.md)
- 📝 [Example Requests](./UNIFIED_BRIDGE_EXAMPLES.json)
- 📖 [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- 📋 [API Reference](./API_REFERENCE.md)

## Example: Complete Flow

```bash
# 1. Check wallet
curl "http://localhost:3001/deploy/wallet-info?rpcUrl=https://api.avax-test.network/ext/bc/C/rpc"

# 2. Create config
cat > bridge.json << 'EOF'
{
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
}
EOF

# 3. Deploy
curl -X PUT http://localhost:3001/deploy/bridge \
  -H "Content-Type: application/json" \
  -d @bridge.json > deployment-result.json

# 4. View results
cat deployment-result.json | jq .

# 5. Save important addresses
jq -r '.homeChain.tokenHome.address' deployment-result.json
jq -r '.remoteChain.tokenRemote.address' deployment-result.json
```

## Success! 🎉

Your cross-chain token bridge is now deployed and ready to use!

