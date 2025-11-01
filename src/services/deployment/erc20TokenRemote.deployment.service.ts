import { BaseDeploymentService, DeploymentParams, DeploymentResult } from './base.deployment.service';
import erc20TokenRemoteAbi from '../../abi/ERC20TokenRemote.json';

/**
 * ERC20TokenRemote Deployment Service
 * 
 * Deploys the ERC20TokenRemote contract to a specified blockchain
 */

export interface ERC20TokenRemoteDeploymentParams extends DeploymentParams {
  // Add any specific constructor arguments for ERC20TokenRemote here
}

/**
 * ERC20TokenRemote Deployment Service Class
 * Handles deployment of ERC20TokenRemote contracts using static methods
 */
export class ERC20TokenRemoteDeploymentService {
  private static readonly abi: any[] = erc20TokenRemoteAbi.abi;
  private static readonly bytecode: string = erc20TokenRemoteAbi.bytecode.object;

  /**
   * Deploy ERC20TokenRemote contract
   * @param params - Deployment parameters including constructor args
   * @returns Deployment result with contract address and transaction details
   */
  static async deploy(params: ERC20TokenRemoteDeploymentParams): Promise<DeploymentResult> {
    console.log('\n=== Deploying ERC20TokenRemote Contract ===');
    console.log('RPC URL:', params.rpcUrl);
    console.log('Constructor Args:', params.constructorArgs);
    
    try {
      const result = await BaseDeploymentService.deployContract(
        this.abi,
        this.bytecode,
        params
      );

      if (result.success) {
        console.log('✓ ERC20TokenRemote deployed successfully');
        console.log('Contract Address:', result.contractAddress);
      } else {
        console.error('✗ ERC20TokenRemote deployment failed:', result.error);
      }

      return result;
    } catch (error) {
      console.error('ERC20TokenRemote deployment error:', error);
      throw error;
    }
  }

  /**
   * Get ERC20TokenRemote ABI and Bytecode
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
export async function deployERC20TokenRemote(
  params: ERC20TokenRemoteDeploymentParams
): Promise<DeploymentResult> {
  return ERC20TokenRemoteDeploymentService.deploy(params);
}

// Export legacy function for backward compatibility
export function getERC20TokenRemoteArtifacts() {
  return ERC20TokenRemoteDeploymentService.getArtifacts();
}

