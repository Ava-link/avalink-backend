import { PrismaClient } from '@prisma/client';
import logger from '../config/logger';

const prisma = new PrismaClient();

export interface ChainCreateInput {
  chainId: string;
  blockchainId: string;
  name: string;
  rpcUrl: string;
  explorerUrl?: string;
  nativeTokenName: string;
  nativeTokenSymbol: string;
  nativeTokenAddress?: string;
  nativeTokenDecimals: number;
  nativeTokenLogoUrl?: string;
  teleporterAddress?: string;
  teleporterRegistryAddress?: string;
  hasIcmEnabled: boolean;
  hasInHouseIcm: boolean;
  isActive: boolean;
  isTestnet: boolean;
  logoUrl?: string;
  websiteUrl?: string;
  description?: string;
}

/**
 * Find or create a chain by blockchainId
 * Returns the existing chain if found, otherwise creates a new one
 */
export async function findOrCreateChain(
  blockchainId: string,
  chainData: Partial<ChainCreateInput>
): Promise<any> {
  try {
    // Try to find existing chain
    const existingChain = await prisma.chain.findUnique({
      where: { blockchainId },
    });

    if (existingChain) {
      logger.info(`Chain found in database: ${existingChain.name} (${blockchainId})`);
      return existingChain;
    }

    // Create new chain if not found
    logger.info(`Chain not found, creating new entry for blockchainId: ${blockchainId}`);
    
    const newChain = await prisma.chain.create({
      data: {
        chainId: chainData.chainId || blockchainId, // Use blockchainId as chainId if not provided
        blockchainId,
        name: chainData.name || `Chain ${blockchainId.slice(0, 8)}...`,
        nativeTokenName: chainData.nativeTokenName || 'AVAX',
        nativeTokenSymbol: chainData.nativeTokenSymbol || 'AVAX',
        nativeTokenDecimals: chainData.nativeTokenDecimals || 18,
        teleporterAddress: chainData.teleporterAddress,
        teleporterRegistryAddress: chainData.teleporterRegistryAddress,
        hasIcmEnabled: chainData.hasIcmEnabled ?? true,
        hasInHouseIcm: chainData.hasInHouseIcm ?? false,
        isActive: chainData.isActive ?? true,
        isTestnet: chainData.isTestnet ?? true,
        explorerUrl: chainData.explorerUrl,
        nativeTokenAddress: chainData.nativeTokenAddress,
        nativeTokenLogoUrl: chainData.nativeTokenLogoUrl,
        logoUrl: chainData.logoUrl,
        websiteUrl: chainData.websiteUrl,
        description: chainData.description,
      },
    });

    logger.info(`✅ New chain created: ${newChain.name} (${newChain.id})`);
    
    // Create RPC entry for the chain if rpcUrl is provided
    if (chainData.rpcUrl) {
      await prisma.chainRpc.create({
        data: {
          chainId: newChain.id,
          rpcUrl: chainData.rpcUrl,
          isActive: true,
          priority: 1,
        },
      });
      logger.info(`✅ RPC endpoint added for chain: ${chainData.rpcUrl}`);
    }

    return newChain;
  } catch (error) {
    logger.error('Error in findOrCreateChain:', error);
    throw error;
  }
}

/**
 * Update chain with teleporter addresses
 */
export async function updateChainTeleporterAddresses(
  blockchainId: string,
  teleporterAddress?: string,
  teleporterRegistryAddress?: string
): Promise<any> {
  try {
    const updatedChain = await prisma.chain.update({
      where: { blockchainId },
      data: {
        teleporterAddress,
        teleporterRegistryAddress,
      },
    });

    logger.info(`✅ Updated chain teleporter addresses for ${blockchainId}`);
    return updatedChain;
  } catch (error) {
    logger.error('Error updating chain teleporter addresses:', error);
    throw error;
  }
}

/**
 * Disconnect Prisma Client
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

export { prisma };

