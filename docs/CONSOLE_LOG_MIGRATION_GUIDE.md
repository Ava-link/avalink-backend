# Console.log to Winston Logger Migration Guide

This guide provides patterns for replacing `console.log`, `console.error`, `console.warn`, and `console.info` with the Winston logger.

## Quick Reference

### Import Statement

```typescript
import logger from '../config/logger';
// or for controller functions
import logger, { logFunctionEntry } from '../config/logger';
```

## Common Patterns

### 1. Simple Console.log Replacement

**Before:**
```typescript
console.log('Server started');
console.log('Processing request');
```

**After:**
```typescript
logger.info('Server started');
logger.info('Processing request');
```

### 2. Console.log with Variables

**Before:**
```typescript
console.log('User ID:', userId, 'Status:', status);
console.log(`Deploying contract to ${rpcUrl}`);
```

**After:**
```typescript
logger.info('User data', { userId, status });
logger.info(`Deploying contract to ${rpcUrl}`);
// or
logger.info('Deploying contract', { rpcUrl });
```

### 3. Console.error Replacement

**Before:**
```typescript
console.error('Error:', error);
console.error('Failed to connect:', error.message);
```

**After:**
```typescript
logger.error('Error occurred', { error: error.message, stack: error.stack });
logger.error('Failed to connect', { error: error.message });
```

### 4. Console.warn Replacement

**Before:**
```typescript
console.warn('Deprecated feature used');
console.warn('Rate limit approaching');
```

**After:**
```typescript
logger.warn('Deprecated feature used');
logger.warn('Rate limit approaching');
```

### 5. Debug Information

**Before:**
```typescript
console.log('[DEBUG] Variable value:', value);
```

**After:**
```typescript
logger.debug('Variable value', { value });
```

## Controller Function Patterns

### Pattern 1: Controller with Ray-ID

**Before:**
```typescript
export async function myController(req: Request, res: Response) {
  try {
    console.log('Processing request');
    const result = await myService(req.body);
    console.log('Request processed successfully');
    return res.json(result);
  } catch (error) {
    console.error('Error in myController:', error);
    return res.status(500).json({ error: error.message });
  }
}
```

**After:**
```typescript
export async function myController(req: Request, res: Response) {
  logFunctionEntry('myController', req.rayId);
  try {
    logger.info('Processing request', { rayId: req.rayId, functionName: 'myController' });
    const result = await myService(req.body);
    logger.info('Request processed successfully', { rayId: req.rayId, functionName: 'myController' });
    return res.json({ ...result, rayId: req.rayId });
  } catch (error) {
    logger.error('Error in myController', { 
      rayId: req.rayId, 
      functionName: 'myController',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      rayId: req.rayId 
    });
  }
}
```

### Pattern 2: Controller with Validation

**Before:**
```typescript
export async function myController(req: Request, res: Response) {
  const { param1, param2 } = req.body;
  
  if (!param1) {
    console.log('Validation failed: param1 is required');
    return res.status(400).json({ error: 'param1 is required' });
  }
  
  console.log('Validation passed, processing...');
  // ... rest of logic
}
```

**After:**
```typescript
export async function myController(req: Request, res: Response) {
  logFunctionEntry('myController', req.rayId);
  const { param1, param2 } = req.body;
  
  if (!param1) {
    logger.warn('Validation failed', { 
      rayId: req.rayId, 
      functionName: 'myController',
      error: 'param1 is required' 
    });
    return res.status(400).json({ 
      error: 'param1 is required',
      rayId: req.rayId 
    });
  }
  
  logger.info('Validation passed, processing', { rayId: req.rayId, functionName: 'myController' });
  // ... rest of logic
}
```

## Service Function Patterns

### Pattern 1: Service Function with Ray-ID Parameter

**Before:**
```typescript
export async function deployContract(params: DeployParams) {
  console.log('Starting deployment...');
  console.log('Params:', params);
  
  try {
    const result = await deploy(params);
    console.log('Deployment successful:', result.address);
    return result;
  } catch (error) {
    console.error('Deployment failed:', error);
    throw error;
  }
}
```

**After:**
```typescript
export async function deployContract(params: DeployParams, rayId?: string) {
  logger.info('Starting deployment', { rayId, functionName: 'deployContract', params });
  
  try {
    const result = await deploy(params);
    logger.info('Deployment successful', { 
      rayId, 
      functionName: 'deployContract',
      address: result.address 
    });
    return result;
  } catch (error) {
    logger.error('Deployment failed', { 
      rayId, 
      functionName: 'deployContract',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}
```

### Pattern 2: Service Function with Progress Logging

**Before:**
```typescript
export async function processData(data: any[]) {
  console.log(`Processing ${data.length} items...`);
  
  for (let i = 0; i < data.length; i++) {
    console.log(`Processing item ${i + 1}/${data.length}`);
    await processItem(data[i]);
  }
  
  console.log('All items processed');
}
```

**After:**
```typescript
export async function processData(data: any[], rayId?: string) {
  logger.info('Processing items', { 
    rayId, 
    functionName: 'processData',
    count: data.length 
  });
  
  for (let i = 0; i < data.length; i++) {
    logger.debug('Processing item', { 
      rayId, 
      functionName: 'processData',
      progress: `${i + 1}/${data.length}` 
    });
    await processItem(data[i]);
  }
  
  logger.info('All items processed', { 
    rayId, 
    functionName: 'processData',
    count: data.length 
  });
}
```

## Middleware Patterns

**Before:**
```typescript
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

**After:**
```typescript
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.http(`${req.method} ${req.path}`, { rayId: req.rayId });
  next();
});
```

## Conditional Logging

**Before:**
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', debugData);
}
```

**After:**
```typescript
logger.debug('Debug info', { debugData });
// Logger automatically adjusts level based on NODE_ENV
```

## Object Inspection

**Before:**
```typescript
console.log('Config:', JSON.stringify(config, null, 2));
console.log('Object:', config);
```

**After:**
```typescript
logger.info('Config', { config });
// Winston automatically formats objects in file output
// Console output will show formatted objects
```

## Error Logging with Stack Traces

**Before:**
```typescript
try {
  // ... code
} catch (error) {
  console.error('Error:', error);
  console.error('Stack:', error.stack);
}
```

**After:**
```typescript
try {
  // ... code
} catch (error) {
  logger.error('Error occurred', { 
    rayId,
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined
  });
}
```

## Startup/Shutdown Logs

**Before:**
```typescript
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
  });
});
```

**After:**
```typescript
app.listen(PORT, () => {
  logger.info('Server started', { port: PORT, environment: NODE_ENV });
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
  });
});
```

## Testing/Development Logs

**Before:**
```typescript
console.log('='.repeat(50));
console.log('TEST: Running test case');
console.log('='.repeat(50));
```

**After:**
```typescript
logger.debug('='.repeat(50));
logger.debug('TEST: Running test case');
logger.debug('='.repeat(50));
```

## Performance Timing

**Before:**
```typescript
console.time('operation');
// ... operation
console.timeEnd('operation');
```

**After:**
```typescript
const startTime = Date.now();
// ... operation
const duration = Date.now() - startTime;
logger.info('Operation completed', { rayId, functionName, duration: `${duration}ms` });
```

## Best Practices Summary

1. **Always include `rayId`** when available (in controllers and services)
2. **Always include `functionName`** for better tracing
3. **Use appropriate log levels**:
   - `debug` - Development/troubleshooting info
   - `info` - General informational messages
   - `http` - HTTP request/response logs
   - `warn` - Warning conditions
   - `error` - Error conditions
4. **Include context in metadata object** rather than in the message string
5. **Don't log sensitive data** (passwords, keys, tokens, etc.)
6. **Add Ray-ID to all response objects** in controllers

## Search and Replace Patterns

### Using grep to find console statements

```bash
# Find all console.log statements
grep -r "console\.log" src/

# Find all console statements
grep -r "console\." src/

# Count console statements
grep -r "console\." src/ | wc -l
```

### Bulk replacement (be careful!)

```bash
# Dry run - see what would be replaced
find src/ -name "*.ts" -exec grep -l "console.log" {} \;

# For simple cases, you can use sed (but verify each change!)
# This is just an example - manual replacement is safer
```

## Verification

After migrating, verify:
1. ✅ No more `console.log`, `console.error`, `console.warn`, `console.info` in code
2. ✅ All controllers use `logFunctionEntry()`
3. ✅ All controllers include `rayId` in responses
4. ✅ Service functions accept optional `rayId` parameter
5. ✅ Appropriate log levels used
6. ✅ No sensitive data in logs

## Example Complete Migration

See `/src/controllers/deployment.controller.ts` for a complete example of properly migrated controller code with full Ray-ID and Winston logger integration.

