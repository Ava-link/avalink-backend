import { deployContract, DeploymentParams, DeploymentResult } from './base.deployment.service';
import teleporterMessengerAbi from '../../abi/TeleporterMessenger.json';

/**
 * TeleporterMessenger Deployment Service
 * 
 * Deploys the TeleporterMessenger contract to a specified blockchain
 */

export interface TeleporterMessengerDeploymentParams extends DeploymentParams {
  // Add any specific constructor arguments for TeleporterMessenger here
}

/**
 * Deploy TeleporterMessenger contract
 * @param params - Deployment parameters including constructor args
 * @returns Deployment result with contract address and transaction details
 */
export async function deployTeleporterMessenger(
  params: TeleporterMessengerDeploymentParams
): Promise<DeploymentResult> {
  console.log('\n=== Deploying TeleporterMessenger Contract ===');
  console.log('RPC URL:', params.rpcUrl);
  console.log('Constructor Args:', params.constructorArgs);
  
  try {
    const result = await deployContract(
      teleporterMessengerAbi.abi,
      teleporterMessengerAbi.bytecode.object,
      params
    );

    if (result.success) {
      console.log('✓ TeleporterMessenger deployed successfully');
      console.log('Contract Address:', result.contractAddress);
    } else {
      console.error('✗ TeleporterMessenger deployment failed:', result.error);
    }

    return result;
  } catch (error) {
    console.error('TeleporterMessenger deployment error:', error);
    throw error;
  }
}

/**
 * Get TeleporterMessenger ABI and Bytecode
 * Useful for external integrations
 */
export function getTeleporterMessengerArtifacts() {
  return {
    abi: teleporterMessengerAbi.abi,
    bytecode: teleporterMessengerAbi.bytecode.object,
  };
}

