import { ethers, ContractFactory, BaseContract } from 'ethers';
import { getWallet } from '../../config/wallet';
import { env } from '../../config/env';

/**
 * Base Deployment Service
 * 
 * Provides common functionality for deploying contracts
 */

export interface DeploymentParams {
  rpcUrl: string;
  constructorArgs?: any[];
  gasLimit?: number;
}

export interface DeploymentResult {
  success: boolean;
  contractAddress?: string;
  transactionHash?: string;
  deployerAddress: string;
  chainRpcUrl: string;
  gasUsed?: string;
  error?: string;
  timestamp: string;
}

/**
 * Deploy a contract to a blockchain
 * @param abi - Contract ABI
 * @param bytecode - Contract bytecode
 * @param params - Deployment parameters
 * @returns Deployment result
 */
export async function deployContract(
  abi: any[],
  bytecode: string,
  params: DeploymentParams
): Promise<DeploymentResult> {
  const timestamp = new Date().toISOString();
  
  try {
    // Get wallet for the specified chain
    const wallet = getWallet(params.rpcUrl);
    const deployerAddress = wallet.address;

    console.log(`Deploying contract from address: ${deployerAddress}`);
    console.log(`Chain RPC: ${params.rpcUrl}`);

    // Check wallet balance
    if (!wallet.provider) {
      throw new Error('Provider not found for wallet');
    }
    const balance = await wallet.provider.getBalance(wallet.address);
    console.log(`Deployer balance: ${ethers.formatEther(balance)} native tokens`);

    if (balance === 0n) {
      throw new Error('Insufficient balance for deployment. Please fund the deployer wallet.');
    }

    // Create contract factory
    const factory = new ContractFactory(abi, bytecode, wallet);

    // Deploy contract
    const gasLimit = params.gasLimit || env.DEFAULT_GAS_LIMIT;
    console.log(`Deploying with gas limit: ${gasLimit}`);
    
    let contract: BaseContract & { deploymentTransaction(): any };
    if (params.constructorArgs && params.constructorArgs.length > 0) {
      contract = await factory.deploy(...params.constructorArgs, { gasLimit }) as any;
    } else {
      contract = await factory.deploy({ gasLimit }) as any;
    }

    console.log(`Transaction sent: ${contract.deploymentTransaction()?.hash}`);
    console.log('Waiting for confirmation...');

    // Wait for deployment to complete
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();

    // Get transaction receipt for gas used
    const receipt = await contract.deploymentTransaction()?.wait();
    const gasUsed = receipt?.gasUsed ? receipt.gasUsed.toString() : undefined;

    console.log(`Contract deployed successfully at: ${contractAddress}`);
    console.log(`Gas used: ${gasUsed}`);

    return {
      success: true,
      contractAddress,
      transactionHash: contract.deploymentTransaction()?.hash,
      deployerAddress,
      chainRpcUrl: params.rpcUrl,
      gasUsed,
      timestamp
    };
  } catch (error) {
    console.error('Deployment failed:', error);
    
    const wallet = getWallet(params.rpcUrl);
    
    return {
      success: false,
      deployerAddress: wallet.address,
      chainRpcUrl: params.rpcUrl,
      error: error instanceof Error ? error.message : 'Unknown deployment error',
      timestamp
    };
  }
}

/**
 * Validate deployment parameters
 */
export function validateDeploymentParams(params: DeploymentParams): { valid: boolean; error?: string } {
  if (!params.rpcUrl) {
    return { valid: false, error: 'RPC URL is required' };
  }

  if (!params.rpcUrl.startsWith('http://') && !params.rpcUrl.startsWith('https://')) {
    return { valid: false, error: 'Invalid RPC URL format' };
  }

  if (params.gasLimit && params.gasLimit <= 0) {
    return { valid: false, error: 'Gas limit must be positive' };
  }

  return { valid: true };
}

