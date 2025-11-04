import { ethers } from 'ethers';
import logger from './logger';
import { env } from './env'

/**
 * Get numeric EVM chainId from RPC endpoint getChainIdFromRpc
 */
export async function getChainIdFromRpc(rpcUrl: string): Promise<number> {
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const network = await provider.getNetwork();
    return Number(network.chainId); // Return as number, not string
  } catch (error) {
    logger.error(`Failed to get chainId from RPC ${rpcUrl}:`, error);
    throw new Error(`Could not connect to RPC: ${rpcUrl}`);
  }
}


/**
 * Fetch chain metadata from Glacier API
 */
export async function getChainMetadataFromAvaCloud(chainId: number): Promise<{
  name: string;
  logoUrl?: string;
  explorerUrl?: string;
  nativeTokenName?: string;
  nativeTokenSymbol?: string;
  nativeTokenDecimals?: number;
}> {
  try {
    const response = await fetch(
      `https://glacier-api.avax.network/v1/chains/${chainId}`,
      {
        headers: {
          'x-glacier-api-key': process.env.GLACIER_API_KEY || '',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Glacier API returned ${response.status}`);
    }

    const data:any = await response.json();
    
    return {
      name: data.chainName || data.name,
      logoUrl: data.logoUri || data.chainLogoUri,
      explorerUrl: data.explorerUrl || data.blockExplorerUrl,
      nativeTokenName: data.networkToken?.name || data.nativeToken?.name,
      nativeTokenSymbol: data.networkToken?.symbol || data.nativeToken?.symbol,
      nativeTokenDecimals: data.networkToken?.decimals || data.nativeToken?.decimals,
    };
  } catch (error) {
    logger.warn(`Could not fetch chain metadata from Glacier API for chainId ${chainId}:`, error);
    return {
      name: `Chain ${chainId}`,
    };
  }
}
