import winston from 'winston';
import path from 'path';
import fs from 'fs';
import logger from './logger';
import { ethers } from 'ethers';


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


/**
 * Deployment Logger Utility
 * 
 * Creates structured, readable logs for deployments without cluttering the code
 */

export class DeploymentLogger {
  private logger: winston.Logger;
  private rayId?: string;
  private startTime: number;
  private steps: Array<{ step: string; status: 'pending' | 'success' | 'error'; details?: any }> = [];

  constructor(rayId?: string) {
    this.rayId = rayId;
    this.startTime = Date.now();
    
    // Ensure logs/deployments directory exists
    const deploymentsDir = path.join(process.cwd(), 'logs', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    // Create deployment-specific log file
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const logFileName = `deployment-${timestamp}${rayId ? `-${rayId}` : ''}.log`;
    const logFilePath = path.join(deploymentsDir, logFileName);

    // Custom format for deployment logs
    const deploymentFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf((info) => {
        const { timestamp, level, message, ...meta } = info;
        let log = `${timestamp} [${level.toUpperCase()}]`;
        if (this.rayId) log += ` [${this.rayId}]`;
        log += `: ${message}`;
        if (Object.keys(meta).length > 0) {
          log += `\n${JSON.stringify(meta, null, 2)}`;
        }
        return log;
      })
    );

    this.logger = winston.createLogger({
      transports: [
        new winston.transports.File({
          filename: logFilePath,
          format: deploymentFormat,
        }),
      ],
    });
  }

  header(title: string) {
    const line = '='.repeat(60);
    this.logger.info(line);
    this.logger.info(`🚀 ${title}`);
    this.logger.info(line);
  }

  section(title: string) {
    this.logger.info(`\n${'─'.repeat(60)}`);
    this.logger.info(title);
    this.logger.info('─'.repeat(60));
  }

  step(stepNumber: number, totalSteps: number, description: string) {
    const msg = `📍 STEP ${stepNumber}/${totalSteps}: ${description}`;
    this.logger.info(msg);
    this.steps.push({ step: `${stepNumber}/${totalSteps}: ${description}`, status: 'pending' });
  }

  success(message: string, details?: any) {
    if (this.steps.length > 0) {
      this.steps[this.steps.length - 1].status = 'success';
      if (details) this.steps[this.steps.length - 1].details = details;
    }
    this.logger.info(`✅ ${message}`, details);
  }

  error(message: string, error?: any) {
    if (this.steps.length > 0) {
      this.steps[this.steps.length - 1].status = 'error';
      if (error) this.steps[this.steps.length - 1].details = error;
    }
    this.logger.error(`❌ ${message}`, { error: error instanceof Error ? error.message : error });
  }

  warn(message: string, details?: any) {
    this.logger.warn(`⚠️  ${message}`, details);
  }

  info(message: string, details?: any) {
    this.logger.info(message, details);
  }

  summary(data: any) {
    this.section('📋 DEPLOYMENT SUMMARY');
    this.logger.info(JSON.stringify(data, null, 2));
  }

  complete(success: boolean) {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    const line = '='.repeat(60);
    
    this.logger.info('\n' + line);
    if (success) {
      this.logger.info(`✅ DEPLOYMENT COMPLETE (${duration}s)`);
    } else {
      this.logger.error(`❌ DEPLOYMENT FAILED (${duration}s)`);
    }
    this.logger.info(line);

    // Log step summary
    this.logger.info('\nStep Summary:');
    this.steps.forEach((step, idx) => {
      const icon = step.status === 'success' ? '✅' : step.status === 'error' ? '❌' : '⏳';
      this.logger.info(`  ${icon} ${step.step}`);
    });
  }

  // For backward compatibility with existing logger
  getWinstonLogger() {
    return this.logger;
  }
}

/**
 * Helper to format chain info
 */
export function formatChainInfo(chain: any) {
  return {
    'RPC URL': chain.rpcUrl,
    'Blockchain ID': chain.blockchainId,
    'TeleporterMessenger': chain.teleporterMessenger?.address || 'N/A',
    'TeleporterRegistry': chain.teleporterRegistry?.address || 'N/A',
  };
}

/**
 * Helper to format contract deployment info
 */
export function formatDeploymentInfo(contract: string, address: string, txHash?: string, gasUsed?: string) {
  return {
    Contract: contract,
    Address: address,
    'Transaction Hash': txHash || 'N/A',
    'Gas Used': gasUsed || 'N/A',
  };
}

/**
 * Estimate gas cost for contract deployment
 * @param abi Contract ABI
 * @param bytecode Contract bytecode
 * @param constructorArgs Constructor arguments
 * @param rpcUrl RPC URL for the chain
 * @param gasLimit Optional gas limit (will use this or estimate)
 * @returns Estimated gas cost in native tokens and gas units
 */
export async function estimateDeploymentGasCost(
  abi: any[],
  bytecode: string,
  constructorArgs: any[],
  rpcUrl: string,
  gasLimit?: number
): Promise<{
  estimatedGas: bigint;
  gasPrice: bigint;
  estimatedCost: bigint;
  estimatedCostFormatted: string;
  nativeTokenDecimals: number;
}> {
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Get current gas price
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || ethers.parseUnits('25', 'gwei'); // Fallback to 25 gwei

    // Create temporary wallet for estimation
    const tempWallet = ethers.Wallet.createRandom().connect(provider);
    const factory = new ethers.ContractFactory(abi, bytecode, tempWallet);

    let estimatedGas: bigint;
    
    if (gasLimit) {
      // If gas limit is provided, use it as the estimate
      estimatedGas = BigInt(gasLimit);
    } else {
      // Estimate gas by deploying the contract (simulation)
      try {
        const deploymentTx = await factory.getDeployTransaction(...constructorArgs);
        estimatedGas = await provider.estimateGas(deploymentTx);
        // Add 20% buffer for safety
        estimatedGas = (estimatedGas * 120n) / 100n;
      } catch (error) {
        logger.warn('Could not estimate gas, using default', error);
        // Fallback to a reasonable default based on contract complexity
        estimatedGas = 5000000n; // 5M gas units
      }
    }

    const estimatedCost = estimatedGas * gasPrice;
    const estimatedCostFormatted = ethers.formatEther(estimatedCost);

    return {
      estimatedGas,
      gasPrice,
      estimatedCost,
      estimatedCostFormatted,
      nativeTokenDecimals: 18, // Standard for most EVM chains
    };
  } catch (error) {
    logger.error('Error estimating deployment gas cost:', error);
    throw new Error(`Failed to estimate gas cost: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if wallet has sufficient balance for deployment
 * @param walletAddress Wallet address to check
 * @param rpcUrl RPC URL for the chain
 * @param requiredAmount Required amount in wei (bigint)
 * @returns Balance check result
 */
export async function checkSufficientBalance(
  walletAddress: string,
  rpcUrl: string,
  requiredAmount: bigint
): Promise<{
  hasSufficientBalance: boolean;
  currentBalance: bigint;
  currentBalanceFormatted: string;
  requiredAmount: bigint;
  requiredAmountFormatted: string;
  shortfall: bigint;
  shortfallFormatted: string;
  nativeTokenDecimals: number;
}> {
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const balance = await provider.getBalance(walletAddress);
    
    const hasSufficientBalance = balance >= requiredAmount;
    const shortfall = hasSufficientBalance ? 0n : requiredAmount - balance;

    return {
      hasSufficientBalance,
      currentBalance: balance,
      currentBalanceFormatted: ethers.formatEther(balance),
      requiredAmount,
      requiredAmountFormatted: ethers.formatEther(requiredAmount),
      shortfall,
      shortfallFormatted: ethers.formatEther(shortfall),
      nativeTokenDecimals: 18,
    };
  } catch (error) {
    logger.error('Error checking wallet balance:', error);
    throw new Error(`Failed to check balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
