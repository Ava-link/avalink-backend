import { ethers } from 'ethers';
import { 
  deployTeleporterMessenger, 
  deployTeleporterRegistry,
  deployERC20TokenHome,
  deployERC20TokenRemote,
} from './index';
import { DeploymentResult } from './base.deployment.service';

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
 * Validate unified deployment parameters
 */
export function validateUnifiedDeploymentParams(params: UnifiedDeploymentParams): { valid: boolean; error?: string } {
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
export async function deployUnifiedBridge(
  params: UnifiedDeploymentParams
): Promise<UnifiedDeploymentResult> {
  const timestamp = new Date().toISOString();
  
  console.log('\n========================================');
  console.log('🚀 UNIFIED BRIDGE DEPLOYMENT STARTED');
  console.log('========================================\n');
  console.log(`Home Chain: ${params.homeChain.rpcUrl}`);
  console.log(`Remote Chain: ${params.remoteChain.rpcUrl}`);
  console.log('');

  try {
    let deployerAddress = '';

    // ========================================
    // STEP 1: Deploy/Use TeleporterMessenger on HOME CHAIN
    // ========================================
    console.log('📍 STEP 1/6: Setting up TeleporterMessenger on Home Chain');
    let homeMessengerAddress: string;
    let homeMessengerResult: DeploymentResult | null = null;
    
    if (params.homeChain.teleporterMessenger.deploy) {
      console.log('Deploying new TeleporterMessenger on home chain...');
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
      console.log(`✅ Home chain TeleporterMessenger deployed at: ${homeMessengerAddress}`);
    } else {
      homeMessengerAddress = params.homeChain.teleporterMessenger.contractAddress!;
      console.log(`✅ Using existing TeleporterMessenger at: ${homeMessengerAddress}`);
    }
    console.log('');

    // ========================================
    // STEP 2: Deploy/Use TeleporterRegistry on HOME CHAIN
    // ========================================
    console.log('📍 STEP 2/6: Setting up TeleporterRegistry on Home Chain');
    let homeRegistryAddress: string;
    let homeRegistryResult: DeploymentResult | null = null;
    
    if (params.homeChain.teleporterRegistry.deploy) {
      console.log('Deploying new TeleporterRegistry on home chain...');
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
      console.log(`✅ Home chain TeleporterRegistry deployed at: ${homeRegistryAddress}`);
    } else {
      homeRegistryAddress = params.homeChain.teleporterRegistry.contractAddress!;
      console.log(`✅ Using existing TeleporterRegistry at: ${homeRegistryAddress}`);
    }
    console.log('');

    // ========================================
    // STEP 3: Deploy/Use TeleporterMessenger on REMOTE CHAIN
    // ========================================
    console.log('📍 STEP 3/6: Setting up TeleporterMessenger on Remote Chain');
    let remoteMessengerAddress: string;
    let remoteMessengerResult: DeploymentResult | null = null;
    
    if (params.remoteChain.teleporterMessenger.deploy) {
      console.log('Deploying new TeleporterMessenger on remote chain...');
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
      console.log(`✅ Remote chain TeleporterMessenger deployed at: ${remoteMessengerAddress}`);
    } else {
      remoteMessengerAddress = params.remoteChain.teleporterMessenger.contractAddress!;
      console.log(`✅ Using existing TeleporterMessenger at: ${remoteMessengerAddress}`);
    }
    console.log('');

    // ========================================
    // STEP 4: Deploy/Use TeleporterRegistry on REMOTE CHAIN
    // ========================================
    console.log('📍 STEP 4/6: Setting up TeleporterRegistry on Remote Chain');
    let remoteRegistryAddress: string;
    let remoteRegistryResult: DeploymentResult | null = null;
    
    if (params.remoteChain.teleporterRegistry.deploy) {
      console.log('Deploying new TeleporterRegistry on remote chain...');
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
      console.log(`✅ Remote chain TeleporterRegistry deployed at: ${remoteRegistryAddress}`);
    } else {
      remoteRegistryAddress = params.remoteChain.teleporterRegistry.contractAddress!;
      console.log(`✅ Using existing TeleporterRegistry at: ${remoteRegistryAddress}`);
    }
    console.log('');

    // ========================================
    // STEP 5: Deploy ERC20TokenHome on HOME CHAIN
    // ========================================
    console.log('📍 STEP 5/6: Deploying ERC20TokenHome on Home Chain');
    
    // Note: We'll deploy TokenHome first with a placeholder for registeredRemoteAddress
    // In production, you might want to deploy TokenRemote first and then TokenHome,
    // or use zero address initially and update it later
    const temporaryRemoteAddress = params.homeChain.registeredRemoteAddress || ethers.ZeroAddress;
    
    const homeTokenResult = await deployERC20TokenHome({
      rpcUrl: params.homeChain.rpcUrl,
      constructorArgs: [
        homeRegistryAddress,
        temporaryRemoteAddress, // Will be updated with actual TokenRemote address
        params.homeChain.tokenAddress,
        params.homeChain.tokenDecimals,
      ],
      gasLimit: params.homeChain.gasLimit || 5000000,
    });
    
    if (!homeTokenResult.success || !homeTokenResult.contractAddress) {
      throw new Error(`ERC20TokenHome deployment failed: ${homeTokenResult.error}`);
    }
    
    deployerAddress = homeTokenResult.deployerAddress;
    console.log(`✅ ERC20TokenHome deployed at: ${homeTokenResult.contractAddress}`);
    console.log('');

    // ========================================
    // STEP 6: Deploy ERC20TokenRemote on REMOTE CHAIN
    // ========================================
    console.log('📍 STEP 6/6: Deploying ERC20TokenRemote on Remote Chain');
    
    const remoteTokenResult = await deployERC20TokenRemote({
      rpcUrl: params.remoteChain.rpcUrl,
      constructorArgs: [
        remoteRegistryAddress,
        params.remoteChain.teleporterManagerAddress,
        params.homeChain.blockchainId, // Source blockchain ID (home chain)
        homeTokenResult.contractAddress, // TokenHome address from step 5
        params.remoteChain.initialReserveImbalance,
        params.remoteChain.tokenDecimals,
        params.remoteChain.tokenName,
        params.remoteChain.tokenSymbol,
      ],
      gasLimit: params.remoteChain.gasLimit || 5000000,
    });
    
    if (!remoteTokenResult.success || !remoteTokenResult.contractAddress) {
      throw new Error(`ERC20TokenRemote deployment failed: ${remoteTokenResult.error}`);
    }
    
    deployerAddress = remoteTokenResult.deployerAddress;
    console.log(`✅ ERC20TokenRemote deployed at: ${remoteTokenResult.contractAddress}`);
    console.log('');
  
    // ========================================
    // STEP 7: initiate a Relayer for the newly created ICM if not already configured.
    // ========================================

    // ========================================
    // STEP 8: Register ERC20TokenRemote in TokenHome
    // ========================================
    // console.log('📍 STEP 7/7: Registering ERC20TokenRemote in TokenHome');
    // const registerRemoteResult = await registerERC20TokenRemoteInTokenHome({
    //   rpcUrl: params.homeChain.rpcUrl,
    //   constructorArgs: [remoteTokenResult.contractAddress],
    // });
    // console.log('');

    // ========================================
    // DEPLOYMENT COMPLETE
    // ========================================
    // TODO : Replace this logging on console to creating log files for each call with ray-id
    console.log('========================================');
    console.log('✅ UNIFIED BRIDGE DEPLOYMENT COMPLETE');
    console.log('========================================\n');

    console.log('📋 DEPLOYMENT SUMMARY:');
    console.log('');
    console.log('🏠 HOME CHAIN:');
    console.log(`   RPC: ${params.homeChain.rpcUrl}`);
    console.log(`   Blockchain ID: ${params.homeChain.blockchainId}`);
    console.log(`   TeleporterMessenger: ${homeMessengerAddress} (${params.homeChain.teleporterMessenger.deploy ? 'deployed' : 'existing'})`);
    console.log(`   TeleporterRegistry: ${homeRegistryAddress} (${params.homeChain.teleporterRegistry.deploy ? 'deployed' : 'existing'})`);
    console.log(`   ERC20TokenHome: ${homeTokenResult.contractAddress} (deployed)`);
    console.log('');
    console.log('🌐 REMOTE CHAIN:');
    console.log(`   RPC: ${params.remoteChain.rpcUrl}`);
    console.log(`   Blockchain ID: ${params.remoteChain.blockchainId}`);
    console.log(`   TeleporterMessenger: ${remoteMessengerAddress} (${params.remoteChain.teleporterMessenger.deploy ? 'deployed' : 'existing'})`);
    console.log(`   TeleporterRegistry: ${remoteRegistryAddress} (${params.remoteChain.teleporterRegistry.deploy ? 'deployed' : 'existing'})`);
    console.log(`   ERC20TokenRemote: ${remoteTokenResult.contractAddress} (deployed)`);
    console.log('');
    console.log(`⚠️  IMPORTANT: If you used a placeholder for registeredRemoteAddress in TokenHome,`);
    console.log(`   you'll need to register the TokenRemote address (${remoteTokenResult.contractAddress}) in TokenHome.`);
    console.log('');

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
    console.error('\n❌ UNIFIED BRIDGE DEPLOYMENT FAILED');
    console.error('Error:', error instanceof Error ? error.message : error);
    console.log('');
    
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

