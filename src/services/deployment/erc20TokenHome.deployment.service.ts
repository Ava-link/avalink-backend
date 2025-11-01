import { BaseDeploymentService, DeploymentParams, DeploymentResult } from './base.deployment.service';
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
 * ERC20TokenHome Deployment Service Class
 * Handles deployment of ERC20TokenHome contracts using static methods
 */
export class ERC20TokenHomeDeploymentService {
  private static readonly abi: any[] = erc20TokenHomeAbi.abi;
  private static readonly bytecode: string = erc20TokenHomeAbi.bytecode.object;

  /**
   * Deploy ERC20TokenHome contract
   * @param params - Deployment parameters including constructor args
   * @returns Deployment result with contract address and transaction details
   */
  static async deploy(params: ERC20TokenHomeDeploymentParams): Promise<DeploymentResult> {
    console.log('\n=== Deploying ERC20TokenHome Contract ===');
    console.log('RPC URL:', params.rpcUrl);
    console.log('Constructor Args:', params.constructorArgs);
    
    try {
      const result = await BaseDeploymentService.deployContract(
        this.abi,
        this.bytecode,
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
  static getArtifacts() {
    return {
      abi: this.abi,
      bytecode: this.bytecode,
    };
  }
}

// Export legacy function for backward compatibility
export async function deployERC20TokenHome(
  params: ERC20TokenHomeDeploymentParams
): Promise<DeploymentResult> {
  return ERC20TokenHomeDeploymentService.deploy(params);
}

// Export legacy function for backward compatibility
export function getERC20TokenHomeArtifacts() {
  return ERC20TokenHomeDeploymentService.getArtifacts();
}

