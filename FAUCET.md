# Faucet System

A complete token faucet implementation with rate limiting and balance validation.

## Features

- ✅ **Rate Limiting**: 60-minute cooldown per wallet address (configurable)
- ✅ **Balance Validation**: Checks deployer wallet has >1000 tokens before sending
- ✅ **Decimal-Aware**: Automatically handles token decimals for accurate transfers
- ✅ **Database Persistence**: Rate limits survive server restarts
- ✅ **Comprehensive Logging**: Full request/response tracking with Ray IDs

## Environment Variables

Add these variables to your `.env` file:

```env
# Required
# (None - token address and RPC URL are provided per-request by frontend)

# Optional (with defaults)
FAUCET_AMOUNT=2                   # Amount to send per request
FAUCET_MIN_BALANCE=1000           # Minimum deployer balance required
FAUCET_RATE_LIMIT_MINUTES=60      # Cooldown period in minutes
```

> [!NOTE]
> **Multi-Chain Support**: The faucet supports multiple tokens across multiple chains. The frontend specifies the `tokenAddress` and `rpcUrl` for each request, allowing the same faucet to serve different tokens on different chains.

## API Endpoints

### POST /faucet
Request tokens from the faucet

**Request Body:**
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "tokenAddress": "0x5425890298aed601595a70AB815c96711a31Bc65",  // Required
  "rpcUrl": "https://api.avax-test.network/ext/bc/C/rpc"      // Required
}
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Successfully sent 2 USDC to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "data": {
    "txHash": "0x...",
    "recipient": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "amount": 2
  },
  "rayId": "abc123"
}
```

**Rate Limited Response (429):**
```json
{
  "status": "error",
  "message": "Rate limit exceeded. Please try again in 45 minutes.",
  "data": {
    "rateLimitedUntil": "2025-12-07T11:45:00.000Z",
    "remainingMinutes": 45
  },
  "rayId": "abc123"
}
```

**Error Response (400):**
```json
{
  "status": "error",
  "message": "Faucet has insufficient balance. Current: 500, Required: 1000",
  "rayId": "abc123"
}
```

### GET /faucet/status
Get faucet operational status for a specific token

**Query Parameters:**
- `tokenAddress` - ERC20 token contract address (required)
- `rpcUrl` - Blockchain RPC endpoint (required)

**Example:**
```
GET /faucet/status?tokenAddress=0x5425890298aed601595a70AB815c96711a31Bc65&rpcUrl=https://api.avax-test.network/ext/bc/C/rpc
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "isOperational": true,
    "tokenInfo": {
      "symbol": "USDC",
      "name": "USD Coin",
      "decimals": 6
    },
    "balance": {
      "current": "5000.0",
      "required": 1000,
      "hasEnough": true
    },
    "config": {
      "amountPerRequest": 2,
      "rateLimitMinutes": 60
    }
  },
  "rayId": "abc123"
}
```

## Database Schema

The faucet uses a `faucet_requests` table to track requests:

```sql
CREATE TABLE faucet_requests (
  id UUID PRIMARY KEY,
  wallet_address VARCHAR(42),
  token_address VARCHAR(42),
  amount DECIMAL(78, 18),
  tx_hash VARCHAR(66),
  created_at TIMESTAMP
);
```

## Testing

### Using curl

**Request tokens:**
```bash
curl -X POST http://localhost:3001/faucet \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "tokenAddress": "0x5425890298aed601595a70AB815c96711a31Bc65",
    "rpcUrl": "https://api.avax-test.network/ext/bc/C/rpc"
  }'
```

**Check status:**
```bash
curl "http://localhost:3001/faucet/status?tokenAddress=0x5425890298aed601595a70AB815c96711a31Bc65&rpcUrl=https://api.avax-test.network/ext/bc/C/rpc"
```

**Test rate limiting (make second immediate request):**
```bash
curl -X POST http://localhost:3001/faucet \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "tokenAddress": "0x5425890298aed601595a70AB815c96711a31Bc65",
    "rpcUrl": "https://api.avax-test.network/ext/bc/C/rpc"
  }'
```

**Test with different chain (e.g., Base):**
```bash
curl -X POST http://localhost:3001/faucet \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "tokenAddress": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "rpcUrl": "https://mainnet.base.org"
  }'
```

### Manual Verification

**Prerequisites:**
1. Deployer wallet should have test tokens on the desired chains
2. Ensure deployer wallet has native tokens for gas

**Steps:**
1. Run the server with `npm run dev`
2. Make a POST request to `/faucet` endpoint with desired token/chain
3. Verify transaction on block explorer
4. Check that rate limiting prevents immediate second request
5. Verify balance check works when deployer has insufficient balance
6. Test with different tokens and chainstion

## How It Works

1. **Request Validation**: Validates wallet address format using Zod
2. **Rate Limit Check**: Queries database for recent requests from the wallet
3. **Balance Check**: Reads ERC20 token balance of deployer wallet
4. **Token Transfer**: Calls ERC20 `transfer()` with decimal-adjusted amount
5. **Database Recording**: Stores request details for future rate limiting
6. **Response**: Returns transaction hash and confirmation

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /faucet
       ▼
┌─────────────────┐
│   Controller    │  ← Validates input with Zod
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Service      │  ← Business logic
│  - Rate limit   │
│  - Balance check│
│  - Transfer     │
└────────┬────────┘
         │
    ┌────┴─────┬─────────────┐
    ▼          ▼             ▼
┌────────┐  ┌─────────┐  ┌────────┐
│Prisma  │  │ Ethers  │  │Wallet  │
│  DB    │  │   JS    │  │ Config │
└────────┘  └─────────┘  └────────┘
```

## Files Created

- `prisma/schema.prisma` - Added FaucetRequest model
- `src/config/env.ts` - Added faucet configuration
- `src/services/faucet.service.ts` - Core faucet logic
- `src/controllers/faucet.controller.ts` - Request handling
- `src/routes/faucet.ts` - Route definitions
- `src/index.ts` - Registered faucet router

## Error Handling

The faucet handles these scenarios:
- ✅ Invalid wallet address format
- ✅ Rate limit exceeded (returns 429 with retry time)
- ✅ Insufficient deployer balance
- ✅ Insufficient gas for transaction
- ✅ Network errors
- ✅ Database connection issues
