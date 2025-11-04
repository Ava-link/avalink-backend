# Prisma ORM Setup Guide

## Overview

Prisma ORM has been successfully integrated into the Avalink Backend project. This guide will help you understand how to use Prisma in your development workflow.

## Installation

Prisma has already been installed with the following packages:
- `prisma` - CLI tool for database migrations and schema management
- `@prisma/client` - Type-safe database client

## Configuration

### Environment Variables

Add the following to your `.env` file:

```env
# Prisma Database URL (required)
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"

# Legacy individual fields (still required for pg pool)
DB_HOST=your_host
DB_PORT=5432
DB_NAME=your_database
DB_USER=your_user
DB_PASSWORD=your_password
```

**Important:** The `DATABASE_URL` follows the PostgreSQL connection string format and is required for Prisma to work.

## Database Schema

The Prisma schema is located at `prisma/schema.prisma`. Two example models have been created:

### Deployment Model
Tracks contract deployments across different chains.

```prisma
model Deployment {
  id              String   @id @default(uuid())
  contractType    String
  contractAddress String
  chainId         String
  transactionHash String
  deployerAddress String
  status          String   @default("pending")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Bridge Model
Tracks bridge configurations between chains.

```prisma
model Bridge {
  id              String   @id @default(uuid())
  sourceChainId   String
  destChainId     String
  tokenAddress    String
  bridgeType      String
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

## Available Scripts

### Generate Prisma Client
After modifying the schema, generate the TypeScript client:

```bash
pnpm prisma:generate
# or
pnpm run prisma:generate
```

### Create a Migration
Create and apply a new migration in development:

```bash
pnpm prisma:migrate
# or
pnpm run prisma:migrate
```

This will:
1. Create a new migration file
2. Apply it to your database
3. Generate the Prisma Client

### Deploy Migrations (Production)
Apply migrations in production without prompts:

```bash
pnpm prisma:migrate:deploy
# or
pnpm run prisma:migrate:deploy
```

### Push Schema to Database
Push schema changes without creating migrations (useful for prototyping):

```bash
pnpm db:push
# or
pnpm run db:push
```

### Reset Database
Reset database and reapply all migrations:

```bash
pnpm db:reset
# or
pnpm run db:reset
```

### Prisma Studio
Open Prisma Studio to view and edit data in your database:

```bash
pnpm prisma:studio
# or
pnpm run prisma:studio
```

### Seed Database
Run the seed script to populate your database with sample data:

```bash
pnpm prisma:seed
# or
pnpm run prisma:seed
```

## Usage in Code

### Importing Prisma Client

```typescript
import { prisma } from './config/database';
```

### Creating Records

```typescript
// Create a new deployment
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

### Reading Records

```typescript
// Find all deployments
const deployments = await prisma.deployment.findMany();

// Find by ID
const deployment = await prisma.deployment.findUnique({
  where: { id: 'some-uuid' },
});

// Find with filters
const activeDeployments = await prisma.deployment.findMany({
  where: {
    status: 'completed',
    chainId: '43114',
  },
  orderBy: {
    createdAt: 'desc',
  },
  take: 10, // Limit to 10 results
});
```

### Updating Records

```typescript
// Update a deployment
const updated = await prisma.deployment.update({
  where: { id: 'some-uuid' },
  data: {
    status: 'completed',
  },
});
```

### Deleting Records

```typescript
// Delete a deployment
await prisma.deployment.delete({
  where: { id: 'some-uuid' },
});

// Delete many
await prisma.deployment.deleteMany({
  where: {
    status: 'failed',
  },
});
```

### Transactions

```typescript
// Execute multiple operations in a transaction
const result = await prisma.$transaction(async (tx) => {
  const deployment = await tx.deployment.create({
    data: { /* ... */ },
  });
  
  const bridge = await tx.bridge.create({
    data: { /* ... */ },
  });
  
  return { deployment, bridge };
});
```

## Migration Workflow

### Development

1. Modify `prisma/schema.prisma`
2. Run `pnpm prisma:migrate` to create and apply migration
3. Prisma Client is automatically regenerated

### Production

1. Ensure all migrations are committed to git
2. Deploy your code
3. Run `pnpm prisma:migrate:deploy` to apply migrations

## Best Practices

1. **Always use transactions** for operations that need to be atomic
2. **Use indexes** for fields you frequently query (already added in schema)
3. **Handle errors** gracefully with try-catch blocks
4. **Close connections** on application shutdown (already configured)
5. **Use Prisma Studio** for quick data inspection during development
6. **Version control** your migrations in the `prisma/migrations/` directory
7. **Test migrations** in a staging environment before production

## Backward Compatibility

The legacy `pg` Pool connection is still available and exported from `database.ts` for backward compatibility. However, it's recommended to migrate to Prisma for all database operations.

```typescript
// Legacy Pool (still works)
import pool from './config/database';
const result = await pool.query('SELECT * FROM deployments');

// Prisma (recommended)
import { prisma } from './config/database';
const deployments = await prisma.deployment.findMany();
```

## Troubleshooting

### Connection Issues

If you encounter connection issues:

1. Verify your `DATABASE_URL` is correct
2. Check database credentials
3. Ensure database server is running
4. Check firewall/network settings

### Type Errors

If you get type errors after schema changes:

```bash
pnpm prisma:generate
```

### Migration Conflicts

If migrations are out of sync:

```bash
pnpm db:reset  # Careful: This drops all data!
```

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)

