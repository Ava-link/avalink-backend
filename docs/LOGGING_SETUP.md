# Logging and Ray-ID Setup

This document explains the Winston logger and Ray-ID tracing system implemented in the Avalink backend.

## Overview

The backend now includes:
1. **Winston Logger** - Structured logging with multiple transports
2. **Ray-ID Tracing** - Unique request identifiers for end-to-end tracing
3. **Function Entry Logging** - Automatic logging when functions are called

## Components

### 1. Winston Logger (`src/config/logger.ts`)

The logger provides structured logging with different severity levels:
- `error` - Error messages
- `warn` - Warning messages
- `info` - Informational messages
- `http` - HTTP request/response logs
- `debug` - Debug messages

#### Log Transports

- **Console**: Colored, formatted output for development
- **File (error.log)**: Error-level logs only
- **File (combined.log)**: All logs
- **File (exceptions.log)**: Unhandled exceptions
- **File (rejections.log)**: Unhandled promise rejections

### 2. Ray-ID Middleware (`src/middleware/rayId.ts`)

Automatically generates a unique UUID for each request and:
- Attaches it to `req.rayId`
- Adds it to response headers as `X-Ray-ID`
- Logs the endpoint with the Ray-ID

### 3. Type Extensions (`src/types/express.d.ts`)

Extends Express Request type to include the `rayId` property.

## Usage

### Basic Logging

```typescript
import logger from '../config/logger';

// Simple logging
logger.info('Server started');
logger.error('Database connection failed', { error: err.message });

// Logging with Ray-ID
logger.info('Processing deployment', { rayId: req.rayId, contractAddress: '0x...' });
```

### Function Entry Logging

```typescript
import { logFunctionEntry } from '../config/logger';

export async function myControllerFunction(req: Request, res: Response) {
  // This logs: "Entering function [myControllerFunction] [Ray-ID: xxx]"
  logFunctionEntry('myControllerFunction', req.rayId);
  
  // ... rest of function
}
```

### Endpoint Logging

Endpoint logging is automatic via the Ray-ID middleware. Each request logs:
```
2025-10-31 10:30:15 [http] [Ray-ID: 123e4567-e89b-12d3-a456-426614174000] [PUT /deploy/bridge]: PUT /deploy/bridge
```

### Ray-ID in Responses

All API responses now include the `rayId` field for client-side tracing:

```json
{
  "success": true,
  "data": { ... },
  "rayId": "123e4567-e89b-12d3-a456-426614174000"
}
```

### Using Ray-ID in Service Layer

To trace requests through the service layer, pass the `rayId` parameter:

```typescript
import logger from '../config/logger';

export async function deployContract(params: DeployParams, rayId?: string) {
  logger.info('Starting contract deployment', { 
    rayId, 
    functionName: 'deployContract',
    contractType: params.contractType 
  });
  
  try {
    // ... deployment logic
    logger.info('Contract deployed successfully', { 
      rayId,
      functionName: 'deployContract',
      address: deployedAddress 
    });
  } catch (error) {
    logger.error('Deployment failed', { 
      rayId,
      functionName: 'deployContract',
      error: error.message 
    });
    throw error;
  }
}
```

## Log Format

### Console Output
```
2025-10-31 10:30:15 [info] [Ray-ID: 123e4567...] [myFunction]: Processing request
```

### File Output (JSON)
```json
{
  "timestamp": "2025-10-31 10:30:15",
  "level": "info",
  "message": "Processing request",
  "rayId": "123e4567-e89b-12d3-a456-426614174000",
  "functionName": "myFunction",
  "metadata": { ... }
}
```

## Log Files Location

All log files are stored in the `logs/` directory:
- `logs/error.log` - Error logs only
- `logs/combined.log` - All logs
- `logs/exceptions.log` - Unhandled exceptions
- `logs/rejections.log` - Unhandled promise rejections

**Note**: Log files are gitignored and won't be committed to the repository.

## Tracing a Request

To trace a specific request through the system:

1. **Find the Ray-ID** from the API response or `X-Ray-ID` header
2. **Search logs** for that Ray-ID:
   ```bash
   grep "123e4567-e89b-12d3-a456-426614174000" logs/combined.log
   ```
3. **View the complete flow** of that request across all functions and services

## Best Practices

1. **Always include Ray-ID** in service layer functions by accepting it as a parameter
2. **Log function entry** for all controller functions
3. **Log important state changes** with context
4. **Include relevant metadata** in log messages
5. **Use appropriate log levels**:
   - `debug` - Detailed debugging info
   - `info` - General informational messages
   - `warn` - Warning messages (non-critical)
   - `error` - Error messages
6. **Don't log sensitive data** (passwords, private keys, etc.)

## Migrating from console.log

To replace `console.log` with the logger:

```typescript
// Before
console.log('Processing request');
console.error('Error:', error);

// After
logger.info('Processing request', { rayId: req.rayId });
logger.error('Error occurred', { rayId: req.rayId, error: error.message });
```

## Environment Configuration

The logger automatically adjusts based on `NODE_ENV`:
- **Development**: Logs debug and above, colorized console output
- **Production**: Logs info and above, JSON file output

## Example: Complete Request Flow

```
[http] [Ray-ID: abc123] [PUT /deploy/bridge]: PUT /deploy/bridge
[info] [Ray-ID: abc123] [deployUnifiedBridgeController]: Entering function
[info] [Ray-ID: abc123] [deployUnifiedBridgeController]: Deploying unified bridge
[info] [Ray-ID: abc123] [deployUnifiedBridge]: Starting unified deployment
[info] [Ray-ID: abc123] [deployTeleporterMessenger]: Deploying TeleporterMessenger
[info] [Ray-ID: abc123] [deployTeleporterRegistry]: Deploying TeleporterRegistry
[info] [Ray-ID: abc123] [deployERC20TokenHome]: Deploying ERC20TokenHome
[info] [Ray-ID: abc123] [deployUnifiedBridge]: All contracts deployed successfully
[info] [Ray-ID: abc123] [deployUnifiedBridgeController]: Unified bridge deployment completed
```

## Troubleshooting

### Ray-ID not appearing in logs
- Ensure the Ray-ID middleware is registered before route handlers
- Check that `req.rayId` is being passed to logging functions

### Logs not being written to files
- Ensure the `logs/` directory exists
- Check file permissions
- Verify Winston transports are configured correctly

### Can't find log files
- Log files are created automatically when the server starts
- Location: `<project-root>/logs/`

