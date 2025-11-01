import { BaseDeploymentService, DeploymentParams, DeploymentResult } from './base.deployment.service';
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
 * TeleporterRegistry Deployment Service Class
 * Handles deployment of TeleporterRegistry contracts using static methods
 */
export class TeleporterRegistryDeploymentService {
  private static readonly abi: any[] = teleporterRegistryAbi.abi;
  private static readonly bytecode: string = teleporterRegistryAbi.bytecode.object;

  /**
   * Deploy TeleporterRegistry contract
   * @param params - Deployment parameters including constructor args
   * @returns Deployment result with contract address and transaction details
   */
  static async deploy(params: TeleporterRegistryDeploymentParams): Promise<DeploymentResult> {
    console.log('\n=== Deploying TeleporterRegistry Contract ===');
    console.log('RPC URL:', params.rpcUrl);
    console.log('Constructor Args:', params.constructorArgs);
    
    try {
      const result = await BaseDeploymentService.deployContract(
        this.abi,
        this.bytecode,
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
  static getArtifacts() {
    return {
      abi: this.abi,
      bytecode: this.bytecode,
    };
  }
}

// Export legacy function for backward compatibility
export async function deployTeleporterRegistry(
  params: TeleporterRegistryDeploymentParams
): Promise<DeploymentResult> {
  return TeleporterRegistryDeploymentService.deploy(params);
}

// Export legacy function for backward compatibility
export function getTeleporterRegistryArtifacts() {
  return TeleporterRegistryDeploymentService.getArtifacts();
}

