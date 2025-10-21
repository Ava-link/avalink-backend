import { Request, Response } from 'express';
import {
  deployERC20TokenHome,
  deployERC20TokenRemote,
  deployTeleporterMessenger,
  deployTeleporterRegistry,
  validateDeploymentParams,
  getERC20TokenHomeArtifacts,
  getERC20TokenRemoteArtifacts,
  getTeleporterMessengerArtifacts,
  getTeleporterRegistryArtifacts,
  deployUnifiedBridge,
  validateUnifiedDeploymentParams,
} from '../services/deployment';
import { getWalletAddress, getWalletBalance } from '../config/wallet';

/**
 * Deployment Controller
 * 
 * Handles all contract deployment requests
 */

/**
 * Deploy ERC20TokenHome contract
 * PUT /deploy/erc20-token-home
 */
export async function deployERC20TokenHomeController(req: Request, res: Response) {
  try {
    const { rpcUrl, constructorArgs, gasLimit } = req.body;

    // Validate parameters
    const validation = validateDeploymentParams({ rpcUrl, constructorArgs, gasLimit });
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    // Deploy contract
    const result = await deployERC20TokenHome({
      rpcUrl,
      constructorArgs,
      gasLimit,
    });

    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('Error in deployERC20TokenHomeController:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Deploy ERC20TokenRemote contract
 * PUT /deploy/erc20-token-remote
 */
export async function deployERC20TokenRemoteController(req: Request, res: Response) {
  try {
    const { rpcUrl, constructorArgs, gasLimit } = req.body;

    // Validate parameters
    const validation = validateDeploymentParams({ rpcUrl, constructorArgs, gasLimit });
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    // Deploy contract
    const result = await deployERC20TokenRemote({
      rpcUrl,
      constructorArgs,
      gasLimit,
    });

    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('Error in deployERC20TokenRemoteController:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Deploy TeleporterMessenger contract
 * PUT /deploy/teleporter-messenger
 */
export async function deployTeleporterMessengerController(req: Request, res: Response) {
  try {
    const { rpcUrl, constructorArgs, gasLimit } = req.body;

    // Validate parameters
    const validation = validateDeploymentParams({ rpcUrl, constructorArgs, gasLimit });
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    // Deploy contract
    const result = await deployTeleporterMessenger({
      rpcUrl,
      constructorArgs,
      gasLimit,
    });

    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('Error in deployTeleporterMessengerController:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Deploy TeleporterRegistry contract
 * PUT /deploy/teleporter-registry
 */
export async function deployTeleporterRegistryController(req: Request, res: Response) {
  try {
    const { rpcUrl, constructorArgs, gasLimit } = req.body;

    // Validate parameters
    const validation = validateDeploymentParams({ rpcUrl, constructorArgs, gasLimit });
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    // Deploy contract
    const result = await deployTeleporterRegistry({
      rpcUrl,
      constructorArgs,
      gasLimit,
    });

    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('Error in deployTeleporterRegistryController:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Get deployer wallet info
 * GET /deploy/wallet-info
 */
export async function getWalletInfoController(req: Request, res: Response) {
  try {
    const { rpcUrl } = req.query;

    const address = getWalletAddress();
    
    let balance: string | undefined;
    if (rpcUrl && typeof rpcUrl === 'string') {
      balance = await getWalletBalance(rpcUrl);
    }

    return res.json({
      success: true,
      address,
      balance: balance ? `${balance} native tokens` : 'Provide rpcUrl query param to check balance',
    });
  } catch (error) {
    console.error('Error in getWalletInfoController:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Get contract artifacts (ABI and bytecode)
 * GET /deploy/artifacts/:contractName
 */
export async function getArtifactsController(req: Request, res: Response) {
  try {
    const { contractName } = req.params;

    let artifacts;
    switch (contractName.toLowerCase()) {
      case 'erc20-token-home':
      case 'erc20tokenhome':
        artifacts = getERC20TokenHomeArtifacts();
        break;
      case 'erc20-token-remote':
      case 'erc20tokenremote':
        artifacts = getERC20TokenRemoteArtifacts();
        break;
      case 'teleporter-messenger':
      case 'teleportermessenger':
        artifacts = getTeleporterMessengerArtifacts();
        break;
      case 'teleporter-registry':
      case 'teleporterregistry':
        artifacts = getTeleporterRegistryArtifacts();
        break;
      default:
        return res.status(404).json({
          success: false,
          error: 'Contract not found. Available contracts: erc20-token-home, erc20-token-remote, teleporter-messenger, teleporter-registry',
        });
    }

    return res.json({
      success: true,
      contractName,
      artifacts,
    });
  } catch (error) {
    console.error('Error in getArtifactsController:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Deploy unified cross-chain bridge
 * PUT /deploy/bridge
 * 
 * Deploys complete cross-chain token bridge infrastructure:
 * - TeleporterMessenger and TeleporterRegistry on both chains (or uses existing)
 * - ERC20TokenHome on home chain
 * - ERC20TokenRemote on remote chain
 */
export async function deployUnifiedBridgeController(req: Request, res: Response) {
  try {
    const params = req.body;

    // Validate parameters
    const validation = validateUnifiedDeploymentParams(params);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    // Deploy unified bridge
    const result = await deployUnifiedBridge(params);

    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('Error in deployUnifiedBridgeController:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

