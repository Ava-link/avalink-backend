import { ethers } from 'ethers';
import { 
  deployTeleporterMessenger, 
  deployTeleporterRegistry,
  deployERC20TokenHome,
  deployERC20TokenRemote,
} from './index';
import { DeploymentResult } from './base.deployment.service';
import { getWallet } from '../../config/wallet';
import erc20TokenRemoteAbi from '../../abi/ERC20TokenRemote.json';
import erc20TokenHomeAbi from '../../abi/ERC20TokenHome.json';
import logger from '../../config/logger';

/**
 * Unified Bridge Deployment Service
 * 
 * Handles the complete deployment flow for cross-chain token bridge:
 * 1. Deploy/Use TeleporterMessenger on home and remote chains
 * 2. Deploy/Use TeleporterRegistry on home and remote chains
 * 3. Deploy ERC20TokenHome on home chain
 * 4. Deploy ERC20TokenRemote on remote chain
 */

export interface TeleporterConfig {
  deploy: boolean;
  contractAddress?: string; // Required if deploy is false
}

export interface HomeChainConfig {
  rpcUrl: string;
  blockchainId: string; // bytes32 blockchain ID
  teleporterMessenger: TeleporterConfig;
  teleporterRegistry: TeleporterConfig;
  teleporterManagerAddress: string;
  tokenAddress: string; // Existing ERC20 token address
  tokenDecimals: number;
  registeredRemoteAddress?: string; // Will be set after remote deployment
  gasLimit?: number;
}

export interface RemoteChainConfig {
  rpcUrl: string;
  blockchainId: string; // bytes32 blockchain ID
  teleporterMessenger: TeleporterConfig;
  teleporterRegistry: TeleporterConfig;
  teleporterManagerAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimals: number;
  initialReserveImbalance: number;
  gasLimit?: number;
}

export interface UnifiedDeploymentParams {
  homeChain: HomeChainConfig;
  remoteChain: RemoteChainConfig;
}

export interface UnifiedDeploymentResult {
  success: boolean;
  error?: string;
  timestamp: string;
  
  // Home Chain Results
  homeChain: {
    rpcUrl: string;
    blockchainId: string;
    teleporterMessenger: {
      deployed: boolean;
      address: string;
      transactionHash?: string;
      gasUsed?: string;
    };
    teleporterRegistry: {
      deployed: boolean;
      address: string;
      transactionHash?: string;
      gasUsed?: string;
    };
    tokenHome: {
      address: string;
      transactionHash: string;
      gasUsed: string;
    };
  };
  
  // Remote Chain Results
  remoteChain: {
    rpcUrl: string;
    blockchainId: string;
    teleporterMessenger: {
      deployed: boolean;
      address: string;
      transactionHash?: string;
      gasUsed?: string;
    };
    teleporterRegistry: {
      deployed: boolean;
      address: string;
      transactionHash?: string;
      gasUsed?: string;
    };
    tokenRemote: {
      address: string;
      transactionHash: string;
      gasUsed: string;
    };
  };
  
  deployerAddress: string;
}

/**
 * Unified Bridge Deployment Service Class
 * Handles complete cross-chain bridge deployment using static methods
 */
export class UnifiedBridgeDeploymentService {
  /**
   * Validate unified deployment parameters
   */
  static validateUnifiedDeploymentParams(params: UnifiedDeploymentParams): { valid: boolean; error?: string } {
    // Validate home chain
    if (!params.homeChain.rpcUrl) {
      return { valid: false, error: 'Home chain RPC URL is required' };
    }
    if (!params.homeChain.blockchainId) {
      return { valid: false, error: 'Home chain blockchain ID is required' };
    }
    if (!params.homeChain.tokenAddress || !ethers.isAddress(params.homeChain.tokenAddress)) {
      return { valid: false, error: 'Valid home chain token address is required' };
    }
    if (!params.homeChain.teleporterManagerAddress || !ethers.isAddress(params.homeChain.teleporterManagerAddress)) {
      return { valid: false, error: 'Valid home chain teleporter manager address is required' };
    }
    
    // Validate home chain teleporter configs
    if (!params.homeChain.teleporterMessenger.deploy && !params.homeChain.teleporterMessenger.contractAddress) {
      return { valid: false, error: 'Home chain: TeleporterMessenger address required when deploy is false' };
    }
    if (params.homeChain.teleporterMessenger.contractAddress && !ethers.isAddress(params.homeChain.teleporterMessenger.contractAddress)) {
      return { valid: false, error: 'Home chain: Invalid TeleporterMessenger address' };
    }
    if (!params.homeChain.teleporterRegistry.deploy && !params.homeChain.teleporterRegistry.contractAddress) {
      return { valid: false, error: 'Home chain: TeleporterRegistry address required when deploy is false' };
    }
    if (params.homeChain.teleporterRegistry.contractAddress && !ethers.isAddress(params.homeChain.teleporterRegistry.contractAddress)) {
      return { valid: false, error: 'Home chain: Invalid TeleporterRegistry address' };
    }

    // Validate remote chain
    if (!params.remoteChain.rpcUrl) {
      return { valid: false, error: 'Remote chain RPC URL is required' };
    }
    if (!params.remoteChain.blockchainId) {
      return { valid: false, error: 'Remote chain blockchain ID is required' };
    }
    if (!params.remoteChain.teleporterManagerAddress || !ethers.isAddress(params.remoteChain.teleporterManagerAddress)) {
      return { valid: false, error: 'Valid remote chain teleporter manager address is required' };
    }
    if (!params.remoteChain.tokenName || !params.remoteChain.tokenSymbol) {
      return { valid: false, error: 'Remote chain token name and symbol are required' };
    }
    
    // Validate remote chain teleporter configs
    if (!params.remoteChain.teleporterMessenger.deploy && !params.remoteChain.teleporterMessenger.contractAddress) {
      return { valid: false, error: 'Remote chain: TeleporterMessenger address required when deploy is false' };
    }
    if (params.remoteChain.teleporterMessenger.contractAddress && !ethers.isAddress(params.remoteChain.teleporterMessenger.contractAddress)) {
      return { valid: false, error: 'Remote chain: Invalid TeleporterMessenger address' };
    }
    if (!params.remoteChain.teleporterRegistry.deploy && !params.remoteChain.teleporterRegistry.contractAddress) {
      return { valid: false, error: 'Remote chain: TeleporterRegistry address required when deploy is false' };
    }
    if (params.remoteChain.teleporterRegistry.contractAddress && !ethers.isAddress(params.remoteChain.teleporterRegistry.contractAddress)) {
      return { valid: false, error: 'Remote chain: Invalid TeleporterRegistry address' };
    }

    return { valid: true };
  }

  /**
   * Deploy the complete cross-chain bridge infrastructure
   */
  static async deployUnifiedBridge(
    params: UnifiedDeploymentParams,
    rayId?: string
  ): Promise<UnifiedDeploymentResult> {
  const timestamp = new Date().toISOString(); 
  
  logger.info('\n========================================',);
  logger.info('🚀 UNIFIED BRIDGE DEPLOYMENT STARTED', { rayId, functionName: 'deployUnifiedBridge' });
  logger.info('========================================\n',);
  logger.info(`Home Chain: ${params.homeChain.rpcUrl}`,);
  logger.info(`Remote Chain: ${params.remoteChain.rpcUrl}`,);
  logger.info('',);

  try {
    let deployerAddress = '';

    // ========================================
    // STEP 1: Deploy/Use TeleporterMessenger on HOME CHAIN
    // ========================================
    logger.info('📍 STEP 1/6: Setting up TeleporterMessenger on Home Chain',);
    let homeMessengerAddress: string;
    let homeMessengerResult: DeploymentResult | null = null;
    
    if (params.homeChain.teleporterMessenger.deploy) {
      logger.info('Deploying new TeleporterMessenger on home chain...',);
      homeMessengerResult = await deployTeleporterMessenger({
        rpcUrl: params.homeChain.rpcUrl,
        constructorArgs: [],
        gasLimit: params.homeChain.gasLimit || 8000000,
      });
      
      if (!homeMessengerResult.success || !homeMessengerResult.contractAddress) {
        throw new Error(`Home chain TeleporterMessenger deployment failed: ${homeMessengerResult.error}`);
      }
      
      homeMessengerAddress = homeMessengerResult.contractAddress;
      deployerAddress = homeMessengerResult.deployerAddress;
      logger.info(`✅ Home chain TeleporterMessenger deployed at: ${homeMessengerAddress}`);
    } else {
      homeMessengerAddress = params.homeChain.teleporterMessenger.contractAddress!;
      logger.info(`✅ Using existing TeleporterMessenger at: ${homeMessengerAddress}`);
    }
    logger.info('');

    // ========================================
    // STEP 2: Deploy/Use TeleporterRegistry on HOME CHAIN
    // ========================================
    logger.info('📍 STEP 2/6: Setting up TeleporterRegistry on Home Chain');
    let homeRegistryAddress: string;
    let homeRegistryResult: DeploymentResult | null = null;
    
    if (params.homeChain.teleporterRegistry.deploy) {
      logger.info('Deploying new TeleporterRegistry on home chain...');
      homeRegistryResult = await deployTeleporterRegistry({
        rpcUrl: params.homeChain.rpcUrl,
        constructorArgs: [
          [
            {
              version: 1,
              protocolAddress: homeMessengerAddress,
            },
          ],
        ],
        gasLimit: params.homeChain.gasLimit || 3000000,
      });
      
      if (!homeRegistryResult.success || !homeRegistryResult.contractAddress) {
        throw new Error(`Home chain TeleporterRegistry deployment failed: ${homeRegistryResult.error}`);
      }
      
      homeRegistryAddress = homeRegistryResult.contractAddress;
      deployerAddress = homeRegistryResult.deployerAddress;
      logger.info(`✅ Home chain TeleporterRegistry deployed at: ${homeRegistryAddress}`);
    } else {
      homeRegistryAddress = params.homeChain.teleporterRegistry.contractAddress!;
      logger.info(`✅ Using existing TeleporterRegistry at: ${homeRegistryAddress}`);
    }
    logger.info('');

    // ========================================
    // STEP 3: Deploy/Use TeleporterMessenger on REMOTE CHAIN
    // ========================================
    logger.info('📍 STEP 3/6: Setting up TeleporterMessenger on Remote Chain');
    let remoteMessengerAddress: string;
    let remoteMessengerResult: DeploymentResult | null = null;
    
    if (params.remoteChain.teleporterMessenger.deploy) {
      logger.info('Deploying new TeleporterMessenger on remote chain...');
      remoteMessengerResult = await deployTeleporterMessenger({
        rpcUrl: params.remoteChain.rpcUrl,
        constructorArgs: [],
        gasLimit: params.remoteChain.gasLimit || 8000000,
      });
      
      if (!remoteMessengerResult.success || !remoteMessengerResult.contractAddress) {
        throw new Error(`Remote chain TeleporterMessenger deployment failed: ${remoteMessengerResult.error}`);
      }
      
      remoteMessengerAddress = remoteMessengerResult.contractAddress;
      deployerAddress = remoteMessengerResult.deployerAddress;
      logger.info(`✅ Remote chain TeleporterMessenger deployed at: ${remoteMessengerAddress}`);
    } else {
      remoteMessengerAddress = params.remoteChain.teleporterMessenger.contractAddress!;
      logger.info(`✅ Using existing TeleporterMessenger at: ${remoteMessengerAddress}`);
    }
    logger.info('');

    // ========================================
    // STEP 4: Deploy/Use TeleporterRegistry on REMOTE CHAIN
    // ========================================
    logger.info('📍 STEP 4/6: Setting up TeleporterRegistry on Remote Chain');
    let remoteRegistryAddress: string;
    let remoteRegistryResult: DeploymentResult | null = null;
    
    if (params.remoteChain.teleporterRegistry.deploy) {
      logger.info('Deploying new TeleporterRegistry on remote chain...');
      remoteRegistryResult = await deployTeleporterRegistry({
        rpcUrl: params.remoteChain.rpcUrl,
        constructorArgs: [
          [
            {
              version: 1,
              protocolAddress: remoteMessengerAddress,
            },
          ],
        ],
        gasLimit: params.remoteChain.gasLimit || 3000000,
      });
      
      if (!remoteRegistryResult.success || !remoteRegistryResult.contractAddress) {
        throw new Error(`Remote chain TeleporterRegistry deployment failed: ${remoteRegistryResult.error}`);
      }
      
      remoteRegistryAddress = remoteRegistryResult.contractAddress;
      deployerAddress = remoteRegistryResult.deployerAddress;
      logger.info(`✅ Remote chain TeleporterRegistry deployed at: ${remoteRegistryAddress}`);
    } else {
      remoteRegistryAddress = params.remoteChain.teleporterRegistry.contractAddress!;
      logger.info(`✅ Using existing TeleporterRegistry at: ${remoteRegistryAddress}`);
    }
    logger.info('');

    // ========================================
    // STEP 5: Deploy ERC20TokenHome on HOME CHAIN
    // ========================================
    logger.info('📍 STEP 5/6: Deploying ERC20TokenHome on Home Chain');
    
    // Note: We'll deploy TokenHome first with a placeholder for registeredRemoteAddress
    // In production, you might want to deploy TokenRemote first and then TokenHome,
    // or use zero address initially and update it later
    const temporaryRemoteAddress = params.homeChain.registeredRemoteAddress || ethers.ZeroAddress;
    
    const homeTokenResult = await deployERC20TokenHome({
      rpcUrl: params.homeChain.rpcUrl,
      constructorArgs: [
        homeRegistryAddress,
        params.homeChain.teleporterManagerAddress,
        1, // minTeleporterVersion
        params.homeChain.tokenAddress,
        params.homeChain.tokenDecimals,
      ],
      gasLimit: params.homeChain.gasLimit || 5000000,
    });
    
    if (!homeTokenResult.success || !homeTokenResult.contractAddress) {
      throw new Error(`ERC20TokenHome deployment failed: ${homeTokenResult.error}`);
    }
    
    deployerAddress = homeTokenResult.deployerAddress;
    logger.info(`✅ ERC20TokenHome deployed at: ${homeTokenResult.contractAddress}`);
    logger.info('');

    // ========================================
    // STEP 6: Deploy ERC20TokenRemote on REMOTE CHAIN
    // ========================================
    logger.info('📍 STEP 6/6: Deploying ERC20TokenRemote on Remote Chain');
    
    const remoteTokenResult = await deployERC20TokenRemote({
      rpcUrl: params.remoteChain.rpcUrl,
      constructorArgs: [
        {
          teleporterRegistryAddress: remoteRegistryAddress,
          teleporterManager: params.remoteChain.teleporterManagerAddress,
          minTeleporterVersion: 1,
          tokenHomeBlockchainID: params.homeChain.blockchainId, // Source blockchain ID (home chain)
          tokenHomeAddress: homeTokenResult.contractAddress, // TokenHome address from step 5
          tokenHomeDecimals: params.homeChain.tokenDecimals,
        },
        params.remoteChain.tokenName,
        params.remoteChain.tokenSymbol,
        params.remoteChain.tokenDecimals,
      ],
      gasLimit: params.remoteChain.gasLimit || 5000000,
    });
    
    if (!remoteTokenResult.success || !remoteTokenResult.contractAddress) {
      throw new Error(`ERC20TokenRemote deployment failed: ${remoteTokenResult.error}`);
    }
    
    deployerAddress = remoteTokenResult.deployerAddress;
    logger.info(`✅ ERC20TokenRemote deployed at: ${remoteTokenResult.contractAddress}`);
    logger.info('');
  
    // ========================================
    // STEP 7: initiate a Relayer for the newly created ICM if not already configured.
    // ========================================

    // ========================================
    // STEP 8: Call RegisterWithHome on TokenRemote
    // ========================================
    logger.info('📍 STEP 8/9: Calling RegisterWithHome on TokenRemote');
    const registerWithHomeResult = await UnifiedBridgeDeploymentService.registerTokenRemoteWithHome({
      rpcUrl: params.remoteChain.rpcUrl,
      tokenRemoteAddress: remoteTokenResult.contractAddress,
      feeTokenAddress: params.homeChain.tokenAddress, // Use the same token we're bridging
      feeAmount: "0", // Set fee amount to 0
      gasLimit: params.remoteChain.gasLimit || 500000,
    });
    
    if (!registerWithHomeResult.success) {
      logger.error(`⚠️  Warning: Failed to call RegisterWithHome: ${registerWithHomeResult.error}`);
    } else {
      logger.info(`✅ RegisterWithHome call successful`);
      logger.info(`Transaction hash: ${registerWithHomeResult.transactionHash}`);
    }
    logger.info('');

    // ========================================
    // STEP 9: Add colaterals for the contracts
    // ========================================

    // ========================================
    // DEPLOYMENT COMPLETE
    // ========================================
    // TODO : Replace this logging on console to creating log files for each call with ray-id
    logger.info('========================================');
    logger.info('✅ UNIFIED BRIDGE DEPLOYMENT COMPLETE');
    logger.info('========================================\n');

    logger.info('📋 DEPLOYMENT SUMMARY:');
    logger.info('');
    logger.info('🏠 HOME CHAIN:');
    logger.info(`   RPC: ${params.homeChain.rpcUrl}`);
    logger.info(`   Blockchain ID: ${params.homeChain.blockchainId}`);
    logger.info(`   TeleporterMessenger: ${homeMessengerAddress} (${params.homeChain.teleporterMessenger.deploy ? 'deployed' : 'existing'})`);
    logger.info(`   TeleporterRegistry: ${homeRegistryAddress} (${params.homeChain.teleporterRegistry.deploy ? 'deployed' : 'existing'})`);
    logger.info(`   ERC20TokenHome: ${homeTokenResult.contractAddress} (deployed)`);
    logger.info('');
    logger.info('🌐 REMOTE CHAIN:');
    logger.info(`   RPC: ${params.remoteChain.rpcUrl}`);
    logger.info(`   Blockchain ID: ${params.remoteChain.blockchainId}`);
    logger.info(`   TeleporterMessenger: ${remoteMessengerAddress} (${params.remoteChain.teleporterMessenger.deploy ? 'deployed' : 'existing'})`);
    logger.info(`   TeleporterRegistry: ${remoteRegistryAddress} (${params.remoteChain.teleporterRegistry.deploy ? 'deployed' : 'existing'})`);
    logger.info(`   ERC20TokenRemote: ${remoteTokenResult.contractAddress} (deployed)`);
    logger.info('');
    logger.info(`⚠️  IMPORTANT: If you used a placeholder for registeredRemoteAddress in TokenHome,`);
    logger.info(`   you'll need to register the TokenRemote address (${remoteTokenResult.contractAddress}) in TokenHome.`);
    logger.info('');

    return {
      success: true,
      timestamp,
      homeChain: {
        rpcUrl: params.homeChain.rpcUrl,
        blockchainId: params.homeChain.blockchainId,
        teleporterMessenger: {
          deployed: params.homeChain.teleporterMessenger.deploy,
          address: homeMessengerAddress,
          transactionHash: homeMessengerResult?.transactionHash,
          gasUsed: homeMessengerResult?.gasUsed,
        },
        teleporterRegistry: {
          deployed: params.homeChain.teleporterRegistry.deploy,
          address: homeRegistryAddress,
          transactionHash: homeRegistryResult?.transactionHash,
          gasUsed: homeRegistryResult?.gasUsed,
        },
        tokenHome: {
          address: homeTokenResult.contractAddress,
          transactionHash: homeTokenResult.transactionHash!,
          gasUsed: homeTokenResult.gasUsed!,
        },
      },
      remoteChain: {
        rpcUrl: params.remoteChain.rpcUrl,
        blockchainId: params.remoteChain.blockchainId,
        teleporterMessenger: {
          deployed: params.remoteChain.teleporterMessenger.deploy,
          address: remoteMessengerAddress,
          transactionHash: remoteMessengerResult?.transactionHash,
          gasUsed: remoteMessengerResult?.gasUsed,
        },
        teleporterRegistry: {
          deployed: params.remoteChain.teleporterRegistry.deploy,
          address: remoteRegistryAddress,
          transactionHash: remoteRegistryResult?.transactionHash,
          gasUsed: remoteRegistryResult?.gasUsed,
        },
        tokenRemote: {
          address: remoteTokenResult.contractAddress,
          transactionHash: remoteTokenResult.transactionHash!,
          gasUsed: remoteTokenResult.gasUsed!,
        },
      },
      deployerAddress,
    };
  } catch (error) {
    logger.error('\n❌ UNIFIED BRIDGE DEPLOYMENT FAILED');
    logger.error('Error:', error instanceof Error ? error.message : error);
    logger.info('');
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown deployment error',
      timestamp,
      homeChain: {} as any,
      remoteChain: {} as any,
      deployerAddress: '',
    };
  }
  }

  /**
   * Register ERC20TokenRemote address in the TokenHome contract
   */
  static async registerERC20TokenRemoteInTokenHome(
    params: RegisterRemoteInHomeParams
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      logger.info('Registering TokenRemote in TokenHome...');
      logger.info(`TokenHome Address: ${params.tokenHomeAddress}`);
      logger.info(`TokenRemote Address: ${params.tokenRemoteAddress}`);
      
      const wallet = getWallet(params.rpcUrl);
      const tokenHomeContract = new ethers.Contract(
        params.tokenHomeAddress,
        erc20TokenHomeAbi.abi,
        wallet
      );

      // Call registerWithRemote function on TokenHome
      const tx = await tokenHomeContract.registerWithRemote(
        params.remoteBlockchainId,
        params.tokenRemoteAddress,
        { gasLimit: params.gasLimit || 500000 }
      );

      logger.info(`Transaction sent: ${tx.hash}`);
      logger.info('Waiting for confirmation...');
      
      const receipt = await tx.wait();
      logger.info(`✅ TokenRemote registered in TokenHome. Gas used: ${receipt.gasUsed.toString()}`);

      return {
        success: true,
        transactionHash: tx.hash,
      };
    } catch (error) {
      logger.error('Failed to register TokenRemote in TokenHome:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Call RegisterWithHome function on TokenRemote contract
   * This registers the remote token with the home token and provides fee information
   */
  static async registerTokenRemoteWithHome(
    params: RegisterWithHomeParams
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      logger.info('Calling RegisterWithHome on TokenRemote...');
      logger.info(`TokenRemote Address: ${params.tokenRemoteAddress}`);
      logger.info(`Fee Token Address: ${params.feeTokenAddress}`);
      logger.info(`Fee Amount: ${params.feeAmount}`);
      
      const wallet = getWallet(params.rpcUrl);
      const tokenRemoteContract = new ethers.Contract(
        params.tokenRemoteAddress,
        erc20TokenRemoteAbi.abi,
        wallet
      );

      // Create TeleporterFeeInfo struct
      const feeInfo = {
        feeTokenAddress: params.feeTokenAddress,
        amount: params.feeAmount,
      };

      // Call registerWithHome function on TokenRemote
      const tx = await tokenRemoteContract.registerWithHome(
        feeInfo,
        { gasLimit: params.gasLimit || 500000 }
      );

      logger.info(`Transaction sent: ${tx.hash}`);
      logger.info('Waiting for confirmation...');
      
      const receipt = await tx.wait();
      logger.info(`✅ TokenRemote registered with Home. Gas used: ${receipt.gasUsed.toString()}`);

      return {
        success: true,
        transactionHash: tx.hash,
      };
    } catch (error) {
      logger.error('Failed to call RegisterWithHome:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Register ERC20TokenRemote address in the TokenHome contract
 */
interface RegisterRemoteInHomeParams {
  rpcUrl: string;
  tokenHomeAddress: string;
  tokenRemoteAddress: string;
  remoteBlockchainId: string;
  gasLimit?: number;
}

/**
 * Call RegisterWithHome function on TokenRemote contract
 * This registers the remote token with the home token and provides fee information
 */
interface RegisterWithHomeParams {
  rpcUrl: string;
  tokenRemoteAddress: string;
  feeTokenAddress: string; // The token to use for fees (should be the same as the bridge token)
  feeAmount: string; // Amount of fee tokens (can be "0")
  gasLimit?: number;
}

// Export legacy functions for backward compatibility
export const validateUnifiedDeploymentParams = UnifiedBridgeDeploymentService.validateUnifiedDeploymentParams;
export const deployUnifiedBridge = UnifiedBridgeDeploymentService.deployUnifiedBridge;
export const registerERC20TokenRemoteInTokenHome = UnifiedBridgeDeploymentService.registerERC20TokenRemoteInTokenHome;
export const registerTokenRemoteWithHome = UnifiedBridgeDeploymentService.registerTokenRemoteWithHome;

