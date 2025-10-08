# API Reference - Contract Deployment Endpoints

Base URL: `http://localhost:3001`

## Endpoints

### 1. Deploy ERC20TokenHome

Deploy the ERC20TokenHome contract to a specified blockchain.

**Endpoint:** `PUT /deploy/erc20-token-home`

**Request Body:**
```json
{
  "rpcUrl": "string (required) - The RPC URL of the target blockchain",
  "constructorArgs": "array (optional) - Constructor arguments for the contract",
  "gasLimit": "number (optional) - Gas limit for deployment (default: 5000000)"
}
```

**Example Request:**
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

**Response (Success):**
```json
{
  "success": true,
  "contractAddress": "0x...",
  "transactionHash": "0x...",
  "deployerAddress": "0x...",
  "chainRpcUrl": "https://api.avax-test.network/ext/bc/C/rpc",
  "gasUsed": "1234567",
  "timestamp": "2025-10-08T12:34:56.789Z"
}
```

---

### 2. Deploy ERC20TokenRemote

Deploy the ERC20TokenRemote contract to a specified blockchain.

**Endpoint:** `PUT /deploy/erc20-token-remote`

**Request Body:**
```json
{
  "rpcUrl": "string (required)",
  "constructorArgs": "array (optional)",
  "gasLimit": "number (optional)"
}
```

**Example Request:**
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
    ]
  }'
```

---

### 3. Deploy TeleporterMessenger

Deploy the TeleporterMessenger contract to a specified blockchain.

**Endpoint:** `PUT /deploy/teleporter-messenger`

**Request Body:**
```json
{
  "rpcUrl": "string (required)",
  "constructorArgs": "array (optional)",
  "gasLimit": "number (optional)"
}
```

**Example Request:**
```bash
curl -X PUT http://localhost:3001/deploy/teleporter-messenger \
  -H "Content-Type: application/json" \
  -d '{
    "rpcUrl": "https://api.avax-test.network/ext/bc/C/rpc",
    "constructorArgs": [],
    "gasLimit": 8000000
  }'
```

---

### 4. Deploy TeleporterRegistry

Deploy the TeleporterRegistry contract to a specified blockchain.

**Endpoint:** `PUT /deploy/teleporter-registry`

**Request Body:**
```json
{
  "rpcUrl": "string (required)",
  "constructorArgs": "array (optional)",
  "gasLimit": "number (optional)"
}
```

**Example Request:**
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
    ]
  }'
```

---

### 5. Get Wallet Info

Get information about the deployer wallet, including address and balance.

**Endpoint:** `GET /deploy/wallet-info`

**Query Parameters:**
- `rpcUrl` (optional): RPC URL to check balance on specific chain

**Example Request:**
```bash
curl "http://localhost:3001/deploy/wallet-info?rpcUrl=https://api.avax-test.network/ext/bc/C/rpc"
```

**Response:**
```json
{
  "success": true,
  "address": "0x...",
  "balance": "10.5 native tokens"
}
```

---

### 6. Get Contract Artifacts

Get the ABI and bytecode for a specific contract.

**Endpoint:** `GET /deploy/artifacts/:contractName`

**Path Parameters:**
- `contractName`: Name of the contract
  - `erc20-token-home` or `erc20tokenhome`
  - `erc20-token-remote` or `erc20tokenremote`
  - `teleporter-messenger` or `teleportermessenger`
  - `teleporter-registry` or `teleporterregistry`

**Example Request:**
```bash
curl "http://localhost:3001/deploy/artifacts/erc20-token-home"
```

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

---

## Error Responses

All endpoints may return error responses in the following format:

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Invalid RPC URL format"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": "Deployment failed: Insufficient balance for deployment"
}
```

**404 Not Found (for artifacts endpoint):**
```json
{
  "success": false,
  "error": "Contract not found. Available contracts: erc20-token-home, erc20-token-remote, teleporter-messenger, teleporter-registry"
}
```

---

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid RPC URL format` | RPC URL doesn't start with http:// or https:// | Use proper URL format |
| `RPC URL is required` | Missing rpcUrl in request | Include rpcUrl in request body |
| `Insufficient balance for deployment` | Wallet has no funds | Fund the deployer wallet |
| `Gas limit must be positive` | Gas limit is 0 or negative | Provide valid gas limit |
| `Provider not found for wallet` | Failed to connect to RPC | Check RPC URL is correct and accessible |

---

## Response Fields

### Deployment Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether deployment was successful |
| `contractAddress` | string | Address of deployed contract (if successful) |
| `transactionHash` | string | Transaction hash (if successful) |
| `deployerAddress` | string | Address of the deployer wallet |
| `chainRpcUrl` | string | RPC URL of the chain |
| `gasUsed` | string | Amount of gas used (if successful) |
| `error` | string | Error message (if failed) |
| `timestamp` | string | ISO timestamp of deployment |

---

## Rate Limits

Currently, there are no rate limits implemented. Consider implementing rate limiting for production use.

---

## Authentication

Currently, no authentication is required. For production use, implement proper authentication and authorization.

---

## Best Practices

1. **Always test on testnet first** before deploying to mainnet
2. **Verify constructor arguments** match the contract requirements
3. **Check wallet balance** before attempting deployment
4. **Save deployment results** including contract address and transaction hash
5. **Use appropriate gas limits** for each contract type
6. **Monitor deployment transactions** on block explorers
7. **Verify contracts** on block explorers after deployment

---

## Constructor Arguments by Contract

### ERC20TokenHome
Typical constructor arguments:
1. `address` - Teleporter Registry Address
2. `address` - Registered Remote Address
3. `address` - Token Address
4. `uint8` - Token Decimals

### ERC20TokenRemote
Typical constructor arguments:
1. `address` - Teleporter Registry Address
2. `address` - Teleporter Manager Address
3. `bytes32` - Source Blockchain ID
4. `address` - Token Home Address
5. `uint256` - Initial Reserve Imbalance
6. `uint8` - Token Decimals
7. `string` - Token Name
8. `string` - Token Symbol

### TeleporterMessenger
No constructor arguments required (empty array or omit).

### TeleporterRegistry
Typical constructor arguments:
1. `array` - Array of protocol entries:
   ```json
   [
     {
       "version": 1,
       "protocolAddress": "0x..."
     }
   ]
   ```

---

## Testing with Different Tools

### cURL
```bash
curl -X PUT http://localhost:3001/deploy/teleporter-messenger \
  -H "Content-Type: application/json" \
  -d '{"rpcUrl":"https://api.avax-test.network/ext/bc/C/rpc"}'
```

### Postman
1. Method: PUT
2. URL: `http://localhost:3001/deploy/teleporter-messenger`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON): `{"rpcUrl":"https://api.avax-test.network/ext/bc/C/rpc"}`

### JavaScript (fetch)
```javascript
const response = await fetch('http://localhost:3001/deploy/teleporter-messenger', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    gasLimit: 8000000
  })
});
const result = await response.json();
```

### Python (requests)
```python
import requests

response = requests.put(
    'http://localhost:3001/deploy/teleporter-messenger',
    json={
        'rpcUrl': 'https://api.avax-test.network/ext/bc/C/rpc',
        'gasLimit': 8000000
    }
)
result = response.json()
```

---

## Support

For issues or questions:
1. Check the logs in the terminal where the server is running
2. Verify your `.env` configuration
3. Ensure wallet has sufficient balance
4. Check RPC URL is accessible
5. Review constructor arguments match contract requirements

