import { PrismaClient } from '@prisma/client';
import logger from '../config/logger';
import { getChainMetadataFromAvaCloud, getChainIdFromRpc } from '../config/utils'

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

    logger.info(`Chain not found, creating new entry for blockchainId: ${blockchainId}`);

    // Get numeric EVM chainId from RPC
    let evmChainId: number | undefined;
    if (chainData.rpcUrl) {
      logger.info(`Fetching chainId from RPC: ${chainData.rpcUrl}`);
      evmChainId = await getChainIdFromRpc(chainData.rpcUrl);
      logger.info(`Retrieved EVM chainId: ${evmChainId}`);
    } else if (chainData.chainId) {
      // Only use provided chainId if no RPC is available
      evmChainId = typeof chainData.chainId === 'string' 
        ? parseInt(chainData.chainId) 
        : chainData.chainId;
    }

    // Fetch metadata from AvaCloud if we have chainId
    let metadata: any = {};
    if (evmChainId) {
      logger.info(`Fetching chain metadata from AvaCloud for chainId: ${evmChainId}`);
      metadata = await getChainMetadataFromAvaCloud(evmChainId);
    }
    // Create new chain with fetched metadata as fallback
    const newChain = await prisma.chain.create({
      data: {
        chainId: evmChainId?.toString() || blockchainId.toString(),
        blockchainId,
        name: metadata.name || chainData.name || `Chain ${blockchainId.slice(0, 8)}...`,
        nativeTokenName: metadata.nativeTokenName || chainData.nativeTokenName || '',
        nativeTokenSymbol: metadata.nativeTokenSymbol   || chainData.nativeTokenSymbol || '',
        nativeTokenDecimals: metadata.nativeTokenDecimals || chainData.nativeTokenDecimals || 18,
        teleporterAddress: chainData.teleporterAddress,
        teleporterRegistryAddress: chainData.teleporterRegistryAddress,
        hasIcmEnabled: chainData.hasIcmEnabled ?? true,
        hasInHouseIcm: chainData.hasInHouseIcm ?? false,
        isActive: chainData.isActive ?? true,
        isTestnet: chainData.isTestnet ?? true,
        explorerUrl: metadata.explorerUrl || chainData.explorerUrl,
        nativeTokenAddress: chainData.nativeTokenAddress,
        nativeTokenLogoUrl: chainData.nativeTokenLogoUrl,
        logoUrl: metadata.logoUrl || chainData.logoUrl,
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
      logger.info(`✅ RPC endpoint added for chain: ${chainData.rpcUrl}`) ;
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
 * Find or create a user by wallet address
 */
export async function findOrCreateUser(walletAddress: string): Promise<any> {
  try {
    const existing = await prisma.user.findUnique({ where: { walletAddress } });
    if (existing) {
      return existing;
    }
    const created = await prisma.user.create({
      data: {
        walletAddress,
        isActive: true,
      },
    });
    logger.info(`✅ New user created: ${walletAddress}`);
    return created;
  } catch (error) {
    logger.error('Error in findOrCreateUser:', error);
    throw error;
  }
}

/**
 * Find or create a token by chain and address
 */
export async function findOrCreateToken(
  chainId: string,
  tokenData: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    tokenType?: string;
    logoUrl?: string;
    description?: string;
  }
): Promise<any> {
  try {
    const existing = await prisma.token.findFirst({
      where: { chainId, address: tokenData.address },
    });
    if (existing) {
      return existing;
    }
    const created = await prisma.token.create({
      data: {
        chainId,
        address: tokenData.address,
        symbol: tokenData.symbol,
        name: tokenData.name,
        decimals: tokenData.decimals,
        tokenType: tokenData.tokenType || 'erc20',
        logoUrl: tokenData.logoUrl,
        description: tokenData.description,
        isBridgeable: true,
      },
    });
    logger.info(`✅ New token created: ${created.symbol} on chain ${chainId}`);
    return created;
  } catch (error) {
    logger.error('Error in findOrCreateToken:', error);
    throw error;
  }
}

/**
 * Create an ICTT setup record
 */
export async function createIcttSetup(data: {
  setupName?: string;
  tokenHomeAddress: string;
  tokenHomeChainId: string;
  tokenHomeTokenId: string;
  tokenHomeContractId?: string | null;
  tokenRemoteAddress: string;
  tokenRemoteChainId: string;
  tokenRemoteTokenId: string;
  tokenRemoteContractId?: string | null;
  deployedBy?: string | null;
  deploymentConfig?: any;
}): Promise<any> {
  try {
    const created = await prisma.icttSetup.create({
      data: {
        setupName: data.setupName,
        tokenHomeAddress: data.tokenHomeAddress,
        tokenHomeChainId: data.tokenHomeChainId,
        tokenHomeTokenId: data.tokenHomeTokenId,
        tokenHomeContractId: data.tokenHomeContractId || null,
        tokenRemoteAddress: data.tokenRemoteAddress,
        tokenRemoteChainId: data.tokenRemoteChainId,
        tokenRemoteTokenId: data.tokenRemoteTokenId,
        tokenRemoteContractId: data.tokenRemoteContractId || null,
        deployedBy: data.deployedBy || null,
        deploymentConfig: data.deploymentConfig,
        isActive: true,
        setupStatus: 'active',
      },
    });
    logger.info(`✅ ICTT setup created: ${created.id}`);
    return created;
  } catch (error) {
    logger.error('Error creating ICTT setup:', error);
    throw error;
  }
}

export async function getIcttSetups() {
  try {
    const icttSetups = await prisma.icttSetup.findMany({
      where: { isActive: true },
      select: {
        id: true,
        setupName: true,
        tokenHomeAddress: true,
        tokenRemoteAddress: true,
        tokenHomeChain: {
          select: {
            name: true,
            isTestnet: true,
            logoUrl: true,
            teleporterAddress: true,
            teleporterRegistryAddress: true,
            hasIcmEnabled: true,
            explorerUrl: true,
            nativeTokenName: true,
            nativeTokenSymbol: true,
          },
        },
        tokenRemoteChain: {
          select: {
            name: true,
            isTestnet: true,
            logoUrl: true,
            teleporterAddress: true,
            teleporterRegistryAddress: true,
            hasIcmEnabled: true,
            explorerUrl: true,
            nativeTokenName: true,
            nativeTokenSymbol: true,
          },
        },
      },
    });
    return icttSetups;
  } catch (error) {
    logger.error('Error getting ICTT setups:', error);
    throw error;
  }
}


/*
 * Disconnect Prisma Client
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

export { prisma };

