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
import teleporterMessengerAbi from '../../abi/TeleporterMessenger.json';
import teleporterRegistryAbi from '../../abi/TeleporterRegistry.json';
import logger from '../../config/logger';
import { DeploymentLogger, formatDeploymentInfo, estimateDeploymentGasCost, checkSufficientBalance } from '../../config/utils';
import { findOrCreateChain, updateChainTeleporterAddresses, findOrCreateToken, createIcttSetup, findOrCreateUser } from '../deployment.prisma.service';

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
  const deployLog = new DeploymentLogger(rayId);
  
  deployLog.header('UNIFIED BRIDGE DEPLOYMENT STARTED');
  deployLog.info('Configuration', {
    homeChain: params.homeChain.rpcUrl,
    remoteChain: params.remoteChain.rpcUrl,
  });

  try {
    // Get deployer address early for balance checks
    const homeWallet = getWallet(params.homeChain.rpcUrl);
    const remoteWallet = getWallet(params.remoteChain.rpcUrl);
    let deployerAddress = homeWallet.address;

    // ========================================
    // PRE-FLIGHT: Estimate gas costs and check balances
    // ========================================
    deployLog.header('PRE-FLIGHT GAS ESTIMATION AND BALANCE CHECK');
    
    let totalHomeChainGas = 0n;
    let totalRemoteChainGas = 0n;

    // Estimate gas for HOME CHAIN deployments
    deployLog.section('HOME CHAIN - Gas Estimation');
    
    if (params.homeChain.teleporterMessenger.deploy) {
      deployLog.info('Estimating gas for TeleporterMessenger on Home Chain...');
      const messengerEstimate = await estimateDeploymentGasCost(
        teleporterMessengerAbi.abi,
        teleporterMessengerAbi.bytecode.object,
        [],
        params.homeChain.rpcUrl,
        params.homeChain.gasLimit || 8000000
      );
      deployLog.info('TeleporterMessenger estimate:', {
        gas: messengerEstimate.estimatedGas.toString(),
        cost: messengerEstimate.estimatedCostFormatted + ' native tokens'
      });
      totalHomeChainGas += messengerEstimate.estimatedCost;
    }

    if (params.homeChain.teleporterRegistry.deploy) {
      deployLog.info('Estimating gas for TeleporterRegistry on Home Chain...');
      // We need to get messenger address first for registry estimation
      const messengerAddress = params.homeChain.teleporterMessenger.contractAddress || 
                              ethers.ZeroAddress; // Placeholder for estimation
      const registryEstimate = await estimateDeploymentGasCost(
        teleporterRegistryAbi.abi,
        teleporterRegistryAbi.bytecode.object,
        [[{ version: 1, protocolAddress: messengerAddress }]],
        params.homeChain.rpcUrl,
        params.homeChain.gasLimit || 3000000
      );
      deployLog.info('TeleporterRegistry estimate:', {
        gas: registryEstimate.estimatedGas.toString(),
        cost: registryEstimate.estimatedCostFormatted + ' native tokens'
      });
      totalHomeChainGas += registryEstimate.estimatedCost;
    }

    // Always deploy ERC20TokenHome
    deployLog.info('Estimating gas for ERC20TokenHome on Home Chain...');
    const homeTokenEstimate = await estimateDeploymentGasCost(
      erc20TokenHomeAbi.abi,
      erc20TokenHomeAbi.bytecode.object,
      [
        params.homeChain.teleporterRegistry.contractAddress || ethers.ZeroAddress,
        params.homeChain.teleporterManagerAddress,
        1,
        params.homeChain.tokenAddress,
        params.homeChain.tokenDecimals,
      ],
      params.homeChain.rpcUrl,
      params.homeChain.gasLimit || 5000000
    );
    deployLog.info('ERC20TokenHome estimate:', {
      gas: homeTokenEstimate.estimatedGas.toString(),
      cost: homeTokenEstimate.estimatedCostFormatted + ' native tokens'
    });
    totalHomeChainGas += homeTokenEstimate.estimatedCost;

    // Estimate gas for REMOTE CHAIN deployments
    deployLog.section('REMOTE CHAIN - Gas Estimation');
    
    if (params.remoteChain.teleporterMessenger.deploy) {
      deployLog.info('Estimating gas for TeleporterMessenger on Remote Chain...');
      const messengerEstimate = await estimateDeploymentGasCost(
        teleporterMessengerAbi.abi,
        teleporterMessengerAbi.bytecode.object,
        [],
        params.remoteChain.rpcUrl,
        params.remoteChain.gasLimit || 8000000
      );
      deployLog.info('TeleporterMessenger estimate:', {
        gas: messengerEstimate.estimatedGas.toString(),
        cost: messengerEstimate.estimatedCostFormatted + ' native tokens'
      });
      totalRemoteChainGas += messengerEstimate.estimatedCost;
    }

    if (params.remoteChain.teleporterRegistry.deploy) {
      deployLog.info('Estimating gas for TeleporterRegistry on Remote Chain...');
      const messengerAddress = params.remoteChain.teleporterMessenger.contractAddress || 
                              ethers.ZeroAddress;
      const registryEstimate = await estimateDeploymentGasCost(
        teleporterRegistryAbi.abi,
        teleporterRegistryAbi.bytecode.object,
        [[{ version: 1, protocolAddress: messengerAddress }]],
        params.remoteChain.rpcUrl,
        params.remoteChain.gasLimit || 3000000
      );
      deployLog.info('TeleporterRegistry estimate:', {
        gas: registryEstimate.estimatedGas.toString(),
        cost: registryEstimate.estimatedCostFormatted + ' native tokens'
      });
      totalRemoteChainGas += registryEstimate.estimatedCost;
    }

    // Always deploy ERC20TokenRemote
    deployLog.info('Estimating gas for ERC20TokenRemote on Remote Chain...');
    const remoteTokenEstimate = await estimateDeploymentGasCost(
      erc20TokenRemoteAbi.abi,
      erc20TokenRemoteAbi.bytecode.object,
      [
        {
          teleporterRegistryAddress: params.remoteChain.teleporterRegistry.contractAddress || ethers.ZeroAddress,
          teleporterManager: params.remoteChain.teleporterManagerAddress,
          minTeleporterVersion: 1,
          tokenHomeBlockchainID: params.homeChain.blockchainId,
          tokenHomeAddress: ethers.ZeroAddress, // Placeholder
          tokenHomeDecimals: params.homeChain.tokenDecimals,
        },
        params.remoteChain.tokenName,
        params.remoteChain.tokenSymbol,
        params.remoteChain.tokenDecimals,
      ],
      params.remoteChain.rpcUrl,
      params.remoteChain.gasLimit || 5000000
    );
    deployLog.info('ERC20TokenRemote estimate:', {
      gas: remoteTokenEstimate.estimatedGas.toString(),
      cost: remoteTokenEstimate.estimatedCostFormatted + ' native tokens'
    });
    totalRemoteChainGas += remoteTokenEstimate.estimatedCost;

    // Add gas for registerWithHome call on remote chain (approximately 500k gas)
    const registerWithHomeGas = 500000n;
    const feeData = await remoteWallet.provider!.getFeeData();
    const remoteGasPrice = feeData.gasPrice || ethers.parseUnits('25', 'gwei');
    const registerWithHomeCost = registerWithHomeGas * remoteGasPrice;
    totalRemoteChainGas += registerWithHomeCost;
    deployLog.info('RegisterWithHome call estimate:', {
      gas: registerWithHomeGas.toString(),
      cost: ethers.formatEther(registerWithHomeCost) + ' native tokens'
    });

    // Check balances on both chains
    deployLog.section('BALANCE VERIFICATION');
    
    deployLog.info('Checking Home Chain balance...');
    const homeBalanceCheck = await checkSufficientBalance(
      deployerAddress,
      params.homeChain.rpcUrl,
      totalHomeChainGas
    );
    
    deployLog.info('Home Chain Balance:', {
      currentBalance: homeBalanceCheck.currentBalanceFormatted + ' native tokens',
      requiredAmount: homeBalanceCheck.requiredAmountFormatted + ' native tokens',
      hasSufficientBalance: homeBalanceCheck.hasSufficientBalance,
    });

    if (!homeBalanceCheck.hasSufficientBalance) {
      const errorMessage = `❌ INSUFFICIENT BALANCE ON HOME CHAIN\n\n` +
        `You need to pay for gas fees to deploy the required contracts.\n\n` +
        `Deployer Address: ${deployerAddress}\n` +
        `Current Balance: ${homeBalanceCheck.currentBalanceFormatted} native tokens\n` +
        `Required Amount: ${homeBalanceCheck.requiredAmountFormatted} native tokens (${homeBalanceCheck.nativeTokenDecimals} decimals)\n` +
        `Shortfall: ${homeBalanceCheck.shortfallFormatted} native tokens\n\n` +
        `Please fund the deployer wallet with at least ${homeBalanceCheck.requiredAmountFormatted} native tokens on the Home Chain (RPC: ${params.homeChain.rpcUrl}).`;
      
      throw new Error(errorMessage);
    }

    deployLog.info('Checking Remote Chain balance...');
    const remoteBalanceCheck = await checkSufficientBalance(
      deployerAddress,
      params.remoteChain.rpcUrl,
      totalRemoteChainGas
    );
    
    deployLog.info('Remote Chain Balance:', {
      currentBalance: remoteBalanceCheck.currentBalanceFormatted + ' native tokens',
      requiredAmount: remoteBalanceCheck.requiredAmountFormatted + ' native tokens',
      hasSufficientBalance: remoteBalanceCheck.hasSufficientBalance,
    });

    if (!remoteBalanceCheck.hasSufficientBalance) {
      const errorMessage = `❌ INSUFFICIENT BALANCE ON REMOTE CHAIN\n\n` +
        `You need to pay for gas fees to deploy the required contracts.\n\n` +
        `Deployer Address: ${deployerAddress}\n` +
        `Current Balance: ${remoteBalanceCheck.currentBalanceFormatted} native tokens\n` +
        `Required Amount: ${remoteBalanceCheck.requiredAmountFormatted} native tokens (${remoteBalanceCheck.nativeTokenDecimals} decimals)\n` +
        `Shortfall: ${remoteBalanceCheck.shortfallFormatted} native tokens\n\n` +
        `Please fund the deployer wallet with at least ${remoteBalanceCheck.requiredAmountFormatted} native tokens on the Remote Chain (RPC: ${params.remoteChain.rpcUrl}).`;
      
      throw new Error(errorMessage);
    }

    deployLog.success('✅ BALANCE CHECK PASSED', {
      homeChain: `${homeBalanceCheck.currentBalanceFormatted} native tokens (required: ${homeBalanceCheck.requiredAmountFormatted})`,
      remoteChain: `${remoteBalanceCheck.currentBalanceFormatted} native tokens (required: ${remoteBalanceCheck.requiredAmountFormatted})`,
    });

    // ========================================
    // STEP 0: Ensure chains exist in database
    // ========================================
    deployLog.header('DEPLOYMENT STEPS');
    deployLog.step(0, 9, 'Checking and creating chain entries in database');
    
    // Create or find home chain
    const homeChain = await findOrCreateChain(params.homeChain.blockchainId, {
      blockchainId: params.homeChain.blockchainId,
      chainId: params.homeChain.blockchainId,
      name: `Home Chain ${params.homeChain.blockchainId.slice(0, 10)}...`,
      rpcUrl: params.homeChain.rpcUrl,
      nativeTokenName: 'AVAX',
      nativeTokenSymbol: 'AVAX',
      nativeTokenDecimals: 18,
      teleporterAddress: params.homeChain.teleporterMessenger.deploy 
        ? undefined 
        : params.homeChain.teleporterMessenger.contractAddress,
      teleporterRegistryAddress: params.homeChain.teleporterRegistry.deploy 
        ? undefined 
        : params.homeChain.teleporterRegistry.contractAddress,
      hasIcmEnabled: true,
      hasInHouseIcm: true,
      isActive: true,
      isTestnet: true,
    });

    // Create or find remote chain
    const remoteChain = await findOrCreateChain(params.remoteChain.blockchainId, {
      blockchainId: params.remoteChain.blockchainId,
      chainId: params.remoteChain.blockchainId,
      name: `Remote Chain ${params.remoteChain.blockchainId.slice(0, 10)}...`,
      rpcUrl: params.remoteChain.rpcUrl,
      nativeTokenName: params.remoteChain.tokenName || 'AVAX',
      nativeTokenSymbol: params.remoteChain.tokenSymbol || 'AVAX',
      nativeTokenDecimals: params.remoteChain.tokenDecimals || 18,
      teleporterAddress: params.remoteChain.teleporterMessenger.deploy 
        ? undefined 
        : params.remoteChain.teleporterMessenger.contractAddress,
      teleporterRegistryAddress: params.remoteChain.teleporterRegistry.deploy 
        ? undefined 
        : params.remoteChain.teleporterRegistry.contractAddress,
      hasIcmEnabled: true,
      hasInHouseIcm: true,
      isActive: true,
      isTestnet: true,
    });

    deployLog.success('Chains verified', {
      homeChain: `${homeChain.name} (DB ID: ${homeChain.id})`,
      remoteChain: `${remoteChain.name} (DB ID: ${remoteChain.id})`,
    });

    // ========================================
    // STEP 1: Deploy/Use TeleporterMessenger on HOME CHAIN
    // ========================================
    deployLog.step(1, 9, 'Setting up TeleporterMessenger on Home Chain');
    let homeMessengerAddress: string;
    let homeMessengerResult: DeploymentResult | null = null;
    
    if (params.homeChain.teleporterMessenger.deploy) {
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
      deployLog.success(`TeleporterMessenger deployed: ${homeMessengerAddress}`);
    } else {
      homeMessengerAddress = params.homeChain.teleporterMessenger.contractAddress!;
      deployLog.success(`Using existing TeleporterMessenger: ${homeMessengerAddress}`);
    }

    // ========================================
    // STEP 2: Deploy/Use TeleporterRegistry on HOME CHAIN
    // ========================================
    deployLog.step(2, 9, 'Setting up TeleporterRegistry on Home Chain');
    let homeRegistryAddress: string;
    let homeRegistryResult: DeploymentResult | null = null;
    
    if (params.homeChain.teleporterRegistry.deploy) {
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
      deployLog.success(`TeleporterRegistry deployed: ${homeRegistryAddress}`);
    } else {
      homeRegistryAddress = params.homeChain.teleporterRegistry.contractAddress!;
      deployLog.success(`Using existing TeleporterRegistry: ${homeRegistryAddress}`);
    }

    // ========================================
    // STEP 3: Deploy/Use TeleporterMessenger on REMOTE CHAIN
    // ========================================
    deployLog.step(3, 9, 'Setting up TeleporterMessenger on Remote Chain');
    let remoteMessengerAddress: string;
    let remoteMessengerResult: DeploymentResult | null = null;
    
    if (params.remoteChain.teleporterMessenger.deploy) {
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
      deployLog.success(`TeleporterMessenger deployed: ${remoteMessengerAddress}`);
    } else {
      remoteMessengerAddress = params.remoteChain.teleporterMessenger.contractAddress!;
      deployLog.success(`Using existing TeleporterMessenger: ${remoteMessengerAddress}`);
    }

    // ========================================
    // STEP 4: Deploy/Use TeleporterRegistry on REMOTE CHAIN
    // ========================================
    deployLog.step(4, 9, 'Setting up TeleporterRegistry on Remote Chain');
    let remoteRegistryAddress: string;
    let remoteRegistryResult: DeploymentResult | null = null;
    
    if (params.remoteChain.teleporterRegistry.deploy) {
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
      deployLog.success(`TeleporterRegistry deployed: ${remoteRegistryAddress}`);
    } else {
      remoteRegistryAddress = params.remoteChain.teleporterRegistry.contractAddress!;
      deployLog.success(`Using existing TeleporterRegistry: ${remoteRegistryAddress}`);
    }

    // Update database with deployed teleporter addresses
    if (params.homeChain.teleporterMessenger.deploy || params.homeChain.teleporterRegistry.deploy) {
      await updateChainTeleporterAddresses(
        params.homeChain.blockchainId,
        homeMessengerAddress,
        homeRegistryAddress
      );
    }
    
    if (params.remoteChain.teleporterMessenger.deploy || params.remoteChain.teleporterRegistry.deploy) {
      await updateChainTeleporterAddresses(
        params.remoteChain.blockchainId,
        remoteMessengerAddress,
        remoteRegistryAddress
      );
    }

    // ========================================
    // STEP 5: Deploy ERC20TokenHome on HOME CHAIN
    // ========================================
    deployLog.step(5, 9, 'Deploying ERC20TokenHome on Home Chain');
    
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
    deployLog.success('ERC20TokenHome deployed', formatDeploymentInfo(
      'ERC20TokenHome',
      homeTokenResult.contractAddress,
      homeTokenResult.transactionHash,
      homeTokenResult.gasUsed
    ));

    // ========================================
    // STEP 6: Deploy ERC20TokenRemote on REMOTE CHAIN
    // ========================================
    deployLog.step(6, 9, 'Deploying ERC20TokenRemote on Remote Chain');
    
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
    deployLog.success('ERC20TokenRemote deployed', formatDeploymentInfo(
      'ERC20TokenRemote',
      remoteTokenResult.contractAddress,
      remoteTokenResult.transactionHash,
      remoteTokenResult.gasUsed
    ));
  
    // ========================================
    // STEP 7: initiate a Relayer for the newly created ICM if not already configured.
    // ========================================

    // ========================================
    // STEP 8: Call RegisterWithHome on TokenRemote
    // ========================================
    deployLog.step(8, 9, 'Calling RegisterWithHome on TokenRemote');
    const registerWithHomeResult = await UnifiedBridgeDeploymentService.registerTokenRemoteWithHome({
      rpcUrl: params.remoteChain.rpcUrl,
      tokenRemoteAddress: remoteTokenResult.contractAddress,
      feeTokenAddress: params.homeChain.tokenAddress, // Use the same token we're bridging
      feeAmount: "0", // Set fee amount to 0
      gasLimit: params.remoteChain.gasLimit || 500000,
    });
    
    if (!registerWithHomeResult.success) {
      deployLog.warn(`Failed to call RegisterWithHome: ${registerWithHomeResult.error}`);
    } else {
      deployLog.success('RegisterWithHome call successful', {
        transactionHash: registerWithHomeResult.transactionHash,
      });
    }

    // ========================================
    // STEP 9: Add colaterals for the contracts
    // ========================================

    // ========================================
    // DEPLOYMENT COMPLETE
    // ========================================
    deployLog.summary({
      homeChain: {
        rpc: params.homeChain.rpcUrl,
        blockchainId: params.homeChain.blockchainId,
        teleporterMessenger: `${homeMessengerAddress} (${params.homeChain.teleporterMessenger.deploy ? 'deployed' : 'existing'})`,
        teleporterRegistry: `${homeRegistryAddress} (${params.homeChain.teleporterRegistry.deploy ? 'deployed' : 'existing'})`,
        erc20TokenHome: homeTokenResult.contractAddress,
      },
      remoteChain: {
        rpc: params.remoteChain.rpcUrl,
        blockchainId: params.remoteChain.blockchainId,
        teleporterMessenger: `${remoteMessengerAddress} (${params.remoteChain.teleporterMessenger.deploy ? 'deployed' : 'existing'})`,
        teleporterRegistry: `${remoteRegistryAddress} (${params.remoteChain.teleporterRegistry.deploy ? 'deployed' : 'existing'})`,
        erc20TokenRemote: remoteTokenResult.contractAddress,
      },
      deployerAddress,
    });

    // ========================================
    // STEP 9: Persist ICTT Setup in Database
    // ========================================
    deployLog.step(9, 9, 'Persisting ICTT setup to database');
    try {
      // Fetch token metadata for the HOME chain original token
      const minimalErc20Abi = [
        'function symbol() view returns (string)',
        'function name() view returns (string)'
      ];
      const homeWallet = getWallet(params.homeChain.rpcUrl);
      const homeTokenContract = new ethers.Contract(
        params.homeChain.tokenAddress,
        minimalErc20Abi,
        homeWallet
      );

      let homeTokenSymbol = 'TOKEN';
      let homeTokenName = 'Token';
      try {
        homeTokenSymbol = await homeTokenContract.symbol();
        homeTokenName = await homeTokenContract.name();
      } catch (_) {
        // ignore metadata fetch errors; use defaults
      }

      // Ensure Token records exist
      const homeTokenDb = await findOrCreateToken(homeChain.id, {
        address: params.homeChain.tokenAddress,
        symbol: homeTokenSymbol,
        name: homeTokenName,
        decimals: params.homeChain.tokenDecimals,
        tokenType: 'erc20',
      });

      const remoteTokenDb = await findOrCreateToken(remoteChain.id, {
        address: remoteTokenResult.contractAddress,
        symbol: params.remoteChain.tokenSymbol,
        name: params.remoteChain.tokenName,
        decimals: params.remoteChain.tokenDecimals,
        tokenType: 'erc20',
      });

      // Ensure User exists, to attribute deployment
      let deployedByUserId: string | null = null;
      try {
        if (deployerAddress) {
          const user = await findOrCreateUser(deployerAddress);
          deployedByUserId = user?.id ?? null;
        }
      } catch (_) {
        deployedByUserId = null;
      }

      await createIcttSetup({
        setupName: `${homeTokenDb.symbol}-${remoteTokenDb.symbol} ICTT`,
        tokenHomeAddress: homeTokenResult.contractAddress,
        tokenHomeChainId: homeChain.id,
        tokenHomeTokenId: homeTokenDb.id,
        tokenRemoteAddress: remoteTokenResult.contractAddress,
        tokenRemoteChainId: remoteChain.id,
        tokenRemoteTokenId: remoteTokenDb.id,
        deployedBy: deployedByUserId,
        deploymentConfig: params,
      });

      deployLog.success('ICTT setup persisted to database');
    } catch (persistError) {
      deployLog.error('Failed to persist ICTT setup', persistError);
    }

    deployLog.complete(true);

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
    deployLog.error('Deployment failed', error);
    deployLog.complete(false);
    
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

