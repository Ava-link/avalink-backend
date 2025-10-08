import { deployContract, DeploymentParams, DeploymentResult } from './base.deployment.service';
import erc20TokenHomeAbi from '../../abi/ERC20TokenHome.json';

/**
 * ERC20TokenHome Deployment Service
 * 
 * Deploys the ERC20TokenHome contract to a specified blockchain
 */

export interface ERC20TokenHomeDeploymentParams extends DeploymentParams {
  // Add any specific constructor arguments for ERC20TokenHome here
  // For example: tokenAddress, teleporterRegistryAddress, etc.
}

/**
 * Deploy ERC20TokenHome contract
 * @param params - Deployment parameters including constructor args
 * @returns Deployment result with contract address and transaction details
 */
export async function deployERC20TokenHome(
  params: ERC20TokenHomeDeploymentParams
): Promise<DeploymentResult> {
  console.log('\n=== Deploying ERC20TokenHome Contract ===');
  console.log('RPC URL:', params.rpcUrl);
  console.log('Constructor Args:', params.constructorArgs);
  
  try {
    const result = await deployContract(
      erc20TokenHomeAbi.abi,
      erc20TokenHomeAbi.bytecode.object,
      params
    );

    if (result.success) {
      console.log('✓ ERC20TokenHome deployed successfully');
      console.log('Contract Address:', result.contractAddress);
    } else {
      console.error('✗ ERC20TokenHome deployment failed:', result.error);
    }

    return result;
  } catch (error) {
    console.error('ERC20TokenHome deployment error:', error);
    throw error;
  }
}

/**
 * Get ERC20TokenHome ABI and Bytecode
 * Useful for external integrations
 */
export function getERC20TokenHomeArtifacts() {
  return {
    abi: erc20TokenHomeAbi.abi,
    bytecode: erc20TokenHomeAbi.bytecode.object,
  };
}

