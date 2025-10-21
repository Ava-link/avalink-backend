# Unified Bridge Deployment API

## Overview

The unified bridge deployment endpoint provides a **single API call** to deploy a complete cross-chain token bridge infrastructure. This endpoint handles all the complexity of deploying contracts on both home and remote chains in the correct order.

## Endpoint

**`PUT /deploy/bridge`**

Deploy a complete cross-chain token bridge with a single API call.

## What Gets Deployed

The unified endpoint orchestrates the following deployments:

1. **Home Chain:**
   - TeleporterMessenger (deploy new OR use existing)
   - TeleporterRegistry (deploy new OR use existing)
   - ERC20TokenHome (always deployed)

2. **Remote Chain:**
   - TeleporterMessenger (deploy new OR use existing)
   - TeleporterRegistry (deploy new OR use existing)
   - ERC20TokenRemote (always deployed)

## Request Body Structure

```json
{
  "homeChain": {
    "rpcUrl": "string (required)",
    "blockchainId": "string (required, bytes32 hex)",
    "tokenAddress": "string (required, existing ERC20 token address)",
    "tokenDecimals": "number (required)",
    "teleporterMessenger": {
      "deploy": "boolean (required)",
      "contractAddress": "string (required if deploy is false)"
    },
    "teleporterRegistry": {
      "deploy": "boolean (required)",
      "contractAddress": "string (required if deploy is false)"
    },
    "registeredRemoteAddress": "string (optional, defaults to zero address)",
    "gasLimit": "number (optional, default: 5000000)"
  },
  "remoteChain": {
    "rpcUrl": "string (required)",
    "blockchainId": "string (required, bytes32 hex)",
    "teleporterManagerAddress": "string (required)",
    "tokenName": "string (required)",
    "tokenSymbol": "string (required)",
    "tokenDecimals": "number (required)",
    "initialReserveImbalance": "number (required)",
    "teleporterMessenger": {
      "deploy": "boolean (required)",
      "contractAddress": "string (required if deploy is false)"
    },
    "teleporterRegistry": {
      "deploy": "boolean (required)",
      "contractAddress": "string (required if deploy is false)"
    },
    "gasLimit": "number (optional, default: 5000000)"
  }
}
```

## Request Examples

### Example 1: Deploy Everything Fresh

Deploy all contracts on both chains from scratch:

```json
{
  "homeChain": {
    "rpcUrl": "https://api.avax-test.network/ext/bc/C/rpc",
    "blockchainId": "0x7fc93d85c6d62c5b2ac0b519c87010ea5294012d1e407030d6acd0021cac10d5",
    "tokenAddress": "0x5425890298aed601595a70AB815c96711a31Bc65",
    "tokenDecimals": 18,
    "teleporterMessenger": {
      "deploy": true
    },
    "teleporterRegistry": {
      "deploy": true
    },
    "gasLimit": 8000000
  },
  "remoteChain": {
    "rpcUrl": "https://subnets.avax.network/mysubnet/rpc",
    "blockchainId": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "teleporterManagerAddress": "0x1234567890123456789012345678901234567890",
    "tokenName": "My Wrapped Token",
    "tokenSymbol": "MWRAP",
    "tokenDecimals": 18,
    "initialReserveImbalance": 0,
    "teleporterMessenger": {
      "deploy": true
    },
    "teleporterRegistry": {
      "deploy": true
    },
    "gasLimit": 8000000
  }
}
```

### Example 2: Use Existing Teleporter Contracts

Deploy tokens but use existing Teleporter infrastructure:

```json
{
  "homeChain": {
    "rpcUrl": "https://api.avax-test.network/ext/bc/C/rpc",
    "blockchainId": "0x7fc93d85c6d62c5b2ac0b519c87010ea5294012d1e407030d6acd0021cac10d5",
    "tokenAddress": "0x5425890298aed601595a70AB815c96711a31Bc65",
    "tokenDecimals": 18,
    "teleporterMessenger": {
      "deploy": false,
      "contractAddress": "0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf"
    },
    "teleporterRegistry": {
      "deploy": false,
      "contractAddress": "0xa1b2c3d4e5f6789012345678901234567890abcd"
    }
  },
  "remoteChain": {
    "rpcUrl": "https://subnets.avax.network/mysubnet/rpc",
    "blockchainId": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "teleporterManagerAddress": "0x1234567890123456789012345678901234567890",
    "tokenName": "My Wrapped Token",
    "tokenSymbol": "MWRAP",
    "tokenDecimals": 18,
    "initialReserveImbalance": 0,
    "teleporterMessenger": {
      "deploy": false,
      "contractAddress": "0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf"
    },
    "teleporterRegistry": {
      "deploy": false,
      "contractAddress": "0xfedcba09876543210fedcba09876543210fedcba"
    }
  }
}
```

### Example 3: Mixed (Deploy on Home, Use Existing on Remote)

```json
{
  "homeChain": {
    "rpcUrl": "https://api.avax-test.network/ext/bc/C/rpc",
    "blockchainId": "0x7fc93d85c6d62c5b2ac0b519c87010ea5294012d1e407030d6acd0021cac10d5",
    "tokenAddress": "0x5425890298aed601595a70AB815c96711a31Bc65",
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
    "blockchainId": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "teleporterManagerAddress": "0x1234567890123456789012345678901234567890",
    "tokenName": "My Wrapped Token",
    "tokenSymbol": "MWRAP",
    "tokenDecimals": 18,
    "initialReserveImbalance": 0,
    "teleporterMessenger": {
      "deploy": false,
      "contractAddress": "0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf"
    },
    "teleporterRegistry": {
      "deploy": false,
      "contractAddress": "0xfedcba09876543210fedcba09876543210fedcba"
    }
  }
}
```

## Response Structure

### Success Response (200 OK)

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

### Error Response (400 Bad Request)

```json
{
  "success": false,
  "error": "Home chain: Invalid TeleporterMessenger address"
}
```

### Error Response (500 Internal Server Error)

```json
{
  "success": false,
  "error": "Remote chain TeleporterMessenger deployment failed: Insufficient balance"
}
```

## Deployment Flow

The endpoint executes deployments in this order:

```
┌─────────────────────────────────────────────────────┐
│  STEP 1: Setup TeleporterMessenger (Home Chain)    │
│  • Deploy new OR use existing                      │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  STEP 2: Setup TeleporterRegistry (Home Chain)     │
│  • Deploy new (with Messenger address)             │
│    OR use existing                                 │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  STEP 3: Setup TeleporterMessenger (Remote Chain)  │
│  • Deploy new OR use existing                      │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  STEP 4: Setup TeleporterRegistry (Remote Chain)   │
│  • Deploy new (with Messenger address)             │
│    OR use existing                                 │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  STEP 5: Deploy ERC20TokenHome (Home Chain)        │
│  • Uses home chain TeleporterRegistry              │
│  • Locks/manages the original ERC20 token          │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  STEP 6: Deploy ERC20TokenRemote (Remote Chain)    │
│  • Uses remote chain TeleporterRegistry            │
│  • References TokenHome address                    │
│  • Creates wrapped token on remote chain           │
└─────────────────────────────────────────────────────┘
```

## cURL Example

```bash
curl -X PUT http://localhost:3001/deploy/bridge \
  -H "Content-Type: application/json" \
  -d '{
    "homeChain": {
      "rpcUrl": "https://api.avax-test.network/ext/bc/C/rpc",
      "blockchainId": "0x7fc93d85c6d62c5b2ac0b519c87010ea5294012d1e407030d6acd0021cac10d5",
      "tokenAddress": "0x5425890298aed601595a70AB815c96711a31Bc65",
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
      "blockchainId": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "teleporterManagerAddress": "0x1234567890123456789012345678901234567890",
      "tokenName": "My Wrapped Token",
      "tokenSymbol": "MWRAP",
      "tokenDecimals": 18,
      "initialReserveImbalance": 0,
      "teleporterMessenger": {
        "deploy": true
      },
      "teleporterRegistry": {
        "deploy": true
      }
    }
  }'
```

## Field Descriptions

### Home Chain Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `rpcUrl` | string | Yes | RPC endpoint for the home chain |
| `blockchainId` | string | Yes | Blockchain ID in bytes32 hex format (with 0x prefix) |
| `tokenAddress` | string | Yes | Address of existing ERC20 token to bridge |
| `tokenDecimals` | number | Yes | Decimals of the token (typically 18) |
| `teleporterMessenger.deploy` | boolean | Yes | Whether to deploy new TeleporterMessenger |
| `teleporterMessenger.contractAddress` | string | Conditional | Required if deploy=false, existing contract address |
| `teleporterRegistry.deploy` | boolean | Yes | Whether to deploy new TeleporterRegistry |
| `teleporterRegistry.contractAddress` | string | Conditional | Required if deploy=false, existing contract address |
| `registeredRemoteAddress` | string | No | Pre-registered remote address (defaults to zero address) |
| `gasLimit` | number | No | Gas limit for deployments (default: 5000000) |

### Remote Chain Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `rpcUrl` | string | Yes | RPC endpoint for the remote chain |
| `blockchainId` | string | Yes | Blockchain ID in bytes32 hex format (with 0x prefix) |
| `teleporterManagerAddress` | string | Yes | Address that manages the Teleporter |
| `tokenName` | string | Yes | Name for the wrapped token on remote chain |
| `tokenSymbol` | string | Yes | Symbol for the wrapped token on remote chain |
| `tokenDecimals` | number | Yes | Decimals for the wrapped token (should match home token) |
| `initialReserveImbalance` | number | Yes | Initial reserve imbalance (typically 0) |
| `teleporterMessenger.deploy` | boolean | Yes | Whether to deploy new TeleporterMessenger |
| `teleporterMessenger.contractAddress` | string | Conditional | Required if deploy=false, existing contract address |
| `teleporterRegistry.deploy` | boolean | Yes | Whether to deploy new TeleporterRegistry |
| `teleporterRegistry.contractAddress` | string | Conditional | Required if deploy=false, existing contract address |
| `gasLimit` | number | No | Gas limit for deployments (default: 5000000) |

## Getting Blockchain IDs

### Avalanche Fuji C-Chain
```
0x7fc93d85c6d62c5b2ac0b519c87010ea5294012d1e407030d6acd0021cac10d5
```

### Avalanche Mainnet C-Chain
```
0x9f3be606497285d0ffbb5ac9ba24aa60346a9b1812479ed66cb329f394a4b1c7
```

### For Custom Subnets
You can get the blockchain ID by querying the chain's info API or checking the subnet documentation.

## Common Errors

| Error Message | Cause | Solution |
|--------------|-------|----------|
| `Home chain RPC URL is required` | Missing home chain RPC | Provide valid RPC URL |
| `Invalid home chain token address` | Invalid or missing token address | Provide valid ERC20 token address |
| `Home chain: TeleporterMessenger address required when deploy is false` | deploy=false but no address provided | Either set deploy=true or provide contractAddress |
| `Invalid TeleporterMessenger address` | Address format is invalid | Ensure address is valid Ethereum address (0x...) |
| `Insufficient balance for deployment` | Deployer wallet has no funds | Fund the deployer wallet with native tokens |
| `Home chain TeleporterMessenger deployment failed` | Deployment transaction failed | Check gas, balance, and constructor args |

## Important Notes

1. **Deployment Order Matters**: The endpoint handles deployment order automatically. Don't worry about dependencies.

2. **Blockchain IDs**: Must be in bytes32 hex format (66 characters including '0x' prefix).

3. **Token Decimals**: Should match between home and remote chains for proper token bridging.

4. **Zero Address Warning**: If `registeredRemoteAddress` is not provided, TokenHome will be deployed with zero address as the registered remote. You may need to register the TokenRemote address afterward.

5. **Gas Limits**: Different contracts require different gas limits:
   - TeleporterMessenger: ~8,000,000
   - TeleporterRegistry: ~3,000,000
   - ERC20TokenHome: ~5,000,000
   - ERC20TokenRemote: ~5,000,000

6. **Wallet Funding**: Ensure your deployer wallet has sufficient native tokens on **both chains** before deploying.

7. **Transaction Time**: Complete deployment can take several minutes depending on network congestion.

## Best Practices

1. ✅ **Test on Testnet First**: Always test deployments on testnet before mainnet
2. ✅ **Save Deployment Results**: Store all contract addresses and transaction hashes
3. ✅ **Verify Contracts**: Verify all deployed contracts on block explorers
4. ✅ **Check Balances**: Ensure deployer wallet has sufficient balance on both chains
5. ✅ **Use Existing Infrastructure**: Reuse existing Teleporter contracts when possible
6. ✅ **Document Deployments**: Keep records of all deployment parameters and results
7. ✅ **Monitor Transactions**: Watch deployment transactions on block explorers

## Post-Deployment Steps

After successful deployment:

1. **Verify All Contracts**: Verify source code on block explorers
2. **Test Token Transfer**: Test a small cross-chain transfer
3. **Register Remote Address**: If using zero address initially, register the actual TokenRemote address
4. **Configure Permissions**: Set up proper access controls
5. **Monitor Events**: Watch for Teleporter events to ensure proper communication
6. **Document Everything**: Save all addresses, IDs, and transaction hashes

## Support

For issues or questions:
- Check server logs for detailed deployment progress
- Verify `.env` configuration
- Ensure wallet has sufficient balance on both chains
- Verify RPC URLs are accessible
- Check blockchain IDs are correct

## Example Success Logs

```
========================================
🚀 UNIFIED BRIDGE DEPLOYMENT STARTED
========================================

Home Chain: https://api.avax-test.network/ext/bc/C/rpc
Remote Chain: https://subnets.avax.network/mysubnet/rpc

📍 STEP 1/6: Setting up TeleporterMessenger on Home Chain
Deploying new TeleporterMessenger on home chain...
✅ Home chain TeleporterMessenger deployed at: 0xabc123...

📍 STEP 2/6: Setting up TeleporterRegistry on Home Chain
Deploying new TeleporterRegistry on home chain...
✅ Home chain TeleporterRegistry deployed at: 0xdef456...

📍 STEP 3/6: Setting up TeleporterMessenger on Remote Chain
Deploying new TeleporterMessenger on remote chain...
✅ Remote chain TeleporterMessenger deployed at: 0xghi789...

📍 STEP 4/6: Setting up TeleporterRegistry on Remote Chain
Deploying new TeleporterRegistry on remote chain...
✅ Remote chain TeleporterRegistry deployed at: 0xjkl012...

📍 STEP 5/6: Deploying ERC20TokenHome on Home Chain
✅ ERC20TokenHome deployed at: 0xmno345...

📍 STEP 6/6: Deploying ERC20TokenRemote on Remote Chain
✅ ERC20TokenRemote deployed at: 0xpqr678...

========================================
✅ UNIFIED BRIDGE DEPLOYMENT COMPLETE
========================================
```

