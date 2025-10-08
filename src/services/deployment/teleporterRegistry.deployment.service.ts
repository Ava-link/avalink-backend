import { deployContract, DeploymentParams, DeploymentResult } from './base.deployment.service';
import teleporterRegistryAbi from '../../abi/TeleporterRegistry.json';

/**
 * TeleporterRegistry Deployment Service
 * 
 * Deploys the TeleporterRegistry contract to a specified blockchain
 */

export interface TeleporterRegistryDeploymentParams extends DeploymentParams {
  // Add any specific constructor arguments for TeleporterRegistry here
}

/**
 * Deploy TeleporterRegistry contract
 * @param params - Deployment parameters including constructor args
 * @returns Deployment result with contract address and transaction details
 */
export async function deployTeleporterRegistry(
  params: TeleporterRegistryDeploymentParams
): Promise<DeploymentResult> {
  console.log('\n=== Deploying TeleporterRegistry Contract ===');
  console.log('RPC URL:', params.rpcUrl);
  console.log('Constructor Args:', params.constructorArgs);
  
  try {
    const result = await deployContract(
      teleporterRegistryAbi.abi,
      teleporterRegistryAbi.bytecode.object,
      params
    );

    if (result.success) {
      console.log('✓ TeleporterRegistry deployed successfully');
      console.log('Contract Address:', result.contractAddress);
    } else {
      console.error('✗ TeleporterRegistry deployment failed:', result.error);
    }

    return result;
  } catch (error) {
    console.error('TeleporterRegistry deployment error:', error);
    throw error;
  }
}

/**
 * Get TeleporterRegistry ABI and Bytecode
 * Useful for external integrations
 */
export function getTeleporterRegistryArtifacts() {
  return {
    abi: teleporterRegistryAbi.abi,
    bytecode: teleporterRegistryAbi.bytecode.object,
  };
}

