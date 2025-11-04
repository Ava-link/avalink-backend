# Prisma ORM - Quick Start

Prisma ORM has been successfully added to your Avalink Backend! 🎉

## What's Been Set Up

✅ Prisma and Prisma Client installed  
✅ Database schema created with example models (Deployment, Bridge)  
✅ Database configuration updated to use Prisma  
✅ Scripts added to package.json  
✅ Example service created demonstrating Prisma usage  
✅ Seed file template created  

## Quick Start

### 1. Set up your DATABASE_URL

Add this to your `.env` file:

```env
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
```

You can construct it from your existing DB credentials:
```
postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public
```

### 2. Push the schema to your database

```bash
pnpm db:push
```

This will create the tables in your database without creating migration files.

### 3. (Optional) Seed your database

```bash
pnpm prisma:seed
```

### 4. View your data with Prisma Studio

```bash
pnpm prisma:studio
```

This opens a visual database browser at http://localhost:5555

## Using Prisma in Your Code

### Import the Prisma Client

```typescript
import { prisma } from './config/database';
```

### Example: Create a deployment

```typescript
const deployment = await prisma.deployment.create({
  data: {
    contractType: 'ERC20TokenHome',
    contractAddress: '0x123...',
    chainId: '43114',
    transactionHash: '0xabc...',
    deployerAddress: '0x456...',
    status: 'completed',
  },
});
```

### Example: Query deployments

```typescript
// Get all deployments
const allDeployments = await prisma.deployment.findMany();

// Get deployments with filters
const completedDeployments = await prisma.deployment.findMany({
  where: {
    status: 'completed',
    chainId: '43114',
  },
  orderBy: {
    createdAt: 'desc',
  },
  take: 10,
});

// Get a single deployment
const deployment = await prisma.deployment.findUnique({
  where: { id: 'some-uuid' },
});
```

### Example: Update a deployment

```typescript
const updated = await prisma.deployment.update({
  where: { id: 'some-uuid' },
  data: { status: 'completed' },
});
```

### Example: Use the example service

```typescript
import { deploymentPrismaService } from './services/deployment.prisma.service';

// Create a deployment
const deployment = await deploymentPrismaService.createDeployment({
  contractType: 'ERC20TokenHome',
  contractAddress: '0x123...',
  chainId: '43114',
  transactionHash: '0xabc...',
  deployerAddress: '0x456...',
});

// Get all deployments for a chain
const deployments = await deploymentPrismaService.getDeployments({
  chainId: '43114',
});

// Get deployment stats
const stats = await deploymentPrismaService.getDeploymentStats();
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm prisma:generate` | Generate Prisma Client (run after schema changes) |
| `pnpm prisma:migrate` | Create and apply a new migration |
| `pnpm prisma:migrate:deploy` | Apply migrations (for production) |
| `pnpm prisma:studio` | Open Prisma Studio database browser |
| `pnpm prisma:seed` | Run the seed script |
| `pnpm db:push` | Push schema to database (no migrations) |
| `pnpm db:reset` | Reset database and reapply all migrations |

## Schema Models

### Deployment Model
Tracks contract deployments across chains.

Fields:
- `id` - UUID (auto-generated)
- `contractType` - Type of contract (e.g., ERC20TokenHome)
- `contractAddress` - Deployed contract address
- `chainId` - Chain ID where deployed
- `transactionHash` - Deployment transaction hash
- `deployerAddress` - Address that deployed the contract
- `status` - Deployment status (default: "pending")
- `createdAt` - Auto-generated timestamp
- `updatedAt` - Auto-updated timestamp

### Bridge Model
Tracks bridge configurations between chains.

Fields:
- `id` - UUID (auto-generated)
- `sourceChainId` - Source chain ID
- `destChainId` - Destination chain ID
- `tokenAddress` - Token contract address
- `bridgeType` - Type of bridge (e.g., ERC20)
- `isActive` - Whether bridge is active (default: true)
- `createdAt` - Auto-generated timestamp
- `updatedAt` - Auto-updated timestamp

## Workflow for Schema Changes

1. Edit `prisma/schema.prisma`
2. Run `pnpm prisma:generate` to update the client
3. Run `pnpm prisma:migrate` to create and apply migration
4. Prisma Client is now updated with new types!

## Migration vs Push

- **`db:push`** - Quick prototyping, no migration history (good for development)
- **`prisma:migrate`** - Creates migration files, tracks history (good for production)

## Type Safety

Prisma provides full TypeScript type safety:

```typescript
// ✅ TypeScript knows all fields
const deployment = await prisma.deployment.findUnique({
  where: { id: 'uuid' },
});

// deployment.contractType - ✅ Autocomplete works!
// deployment.unknownField - ❌ TypeScript error!
```

## Need Help?

- 📚 See `docs/PRISMA_SETUP.md` for detailed documentation
- 🔍 Check `src/services/deployment.prisma.service.ts` for more examples
- 🌐 Visit [Prisma Docs](https://www.prisma.io/docs)

## Backward Compatibility

The old `pg` Pool connection is still available and works alongside Prisma. You can gradually migrate your queries from raw SQL to Prisma ORM.

```typescript
// Old way (still works)
import pool from './config/database';
const result = await pool.query('SELECT * FROM deployments');

// New way (recommended)
import { prisma } from './config/database';
const deployments = await prisma.deployment.findMany();
```

---

Happy coding with Prisma! 🚀

