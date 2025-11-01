import { BaseDeploymentService, DeploymentParams, DeploymentResult } from './base.deployment.service';
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
 * TeleporterMessenger Deployment Service Class
 * Handles deployment of TeleporterMessenger contracts using static methods
 */
export class TeleporterMessengerDeploymentService {
  private static readonly abi: any[] = teleporterMessengerAbi.abi;
  private static readonly bytecode: string = teleporterMessengerAbi.bytecode.object;

  /**
   * Deploy TeleporterMessenger contract
   * @param params - Deployment parameters including constructor args
   * @returns Deployment result with contract address and transaction details
   */
  static async deploy(params: TeleporterMessengerDeploymentParams): Promise<DeploymentResult> {
    console.log('\n=== Deploying TeleporterMessenger Contract ===');
    console.log('RPC URL:', params.rpcUrl);
    console.log('Constructor Args:', params.constructorArgs);
    
    try {
      const result = await BaseDeploymentService.deployContract(
        this.abi,
        this.bytecode,
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
  static getArtifacts() {
    return {
      abi: this.abi,
      bytecode: this.bytecode,
    };
  }
}

// Export legacy function for backward compatibility
export async function deployTeleporterMessenger(
  params: TeleporterMessengerDeploymentParams
): Promise<DeploymentResult> {
  return TeleporterMessengerDeploymentService.deploy(params);
}

// Export legacy function for backward compatibility
export function getTeleporterMessengerArtifacts() {
  return TeleporterMessengerDeploymentService.getArtifacts();
}

