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
import logger, { logFunctionEntry } from '../config/logger';
import { getIcttSetups } from '../services/deployment.prisma.service';


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
  logFunctionEntry('deployERC20TokenHomeController', req.rayId);
  try {
    const { rpcUrl, constructorArgs, gasLimit } = req.body;

    // Validate parameters
    const validation = validateDeploymentParams({ rpcUrl, constructorArgs, gasLimit });
    if (!validation.valid) {
      logger.warn('Validation failed', { rayId: req.rayId, functionName: 'deployERC20TokenHomeController', error: validation.error });
      return res.status(400).json({
        success: false,
        error: validation.error,
        rayId: req.rayId,
      });
    }

    // Deploy contract
    logger.info('Deploying ERC20TokenHome contract', { rayId: req.rayId, functionName: 'deployERC20TokenHomeController' });
    const result = await deployERC20TokenHome({
      rpcUrl,
      constructorArgs,
      gasLimit,
    });

    logger.info('ERC20TokenHome deployment completed', { rayId: req.rayId, functionName: 'deployERC20TokenHomeController', success: result.success });
    return res.status(result.success ? 200 : 500).json({ ...result, rayId: req.rayId });
  } catch (error) {
    logger.error('Error in deployERC20TokenHomeController', { rayId: req.rayId, functionName: 'deployERC20TokenHomeController', error: error instanceof Error ? error.message : 'Unknown error' });
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      rayId: req.rayId,
    });
  }
}

/**
 * Deploy ERC20TokenRemote contract
 * PUT /deploy/erc20-token-remote
 */
export async function deployERC20TokenRemoteController(req: Request, res: Response) {
  logFunctionEntry('deployERC20TokenRemoteController', req.rayId);
  try {
    const { rpcUrl, constructorArgs, gasLimit } = req.body;

    // Validate parameters
    const validation = validateDeploymentParams({ rpcUrl, constructorArgs, gasLimit });
    if (!validation.valid) {
      logger.warn('Validation failed', { rayId: req.rayId, functionName: 'deployERC20TokenRemoteController', error: validation.error });
      return res.status(400).json({
        success: false,
        error: validation.error,
        rayId: req.rayId,
      });
    }

    // Deploy contract
    logger.info('Deploying ERC20TokenRemote contract', { rayId: req.rayId, functionName: 'deployERC20TokenRemoteController' });
    const result = await deployERC20TokenRemote({
      rpcUrl,
      constructorArgs,
      gasLimit,
    });

    logger.info('ERC20TokenRemote deployment completed', { rayId: req.rayId, functionName: 'deployERC20TokenRemoteController', success: result.success });
    return res.status(result.success ? 200 : 500).json({ ...result, rayId: req.rayId });
  } catch (error) {
    logger.error('Error in deployERC20TokenRemoteController', { rayId: req.rayId, functionName: 'deployERC20TokenRemoteController', error: error instanceof Error ? error.message : 'Unknown error' });
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      rayId: req.rayId,
    });
  }
}

/**
 * Deploy TeleporterMessenger contract
 * PUT /deploy/teleporter-messenger
 */
export async function deployTeleporterMessengerController(req: Request, res: Response) {
  logFunctionEntry('deployTeleporterMessengerController', req.rayId);
  try {
    const { rpcUrl, constructorArgs, gasLimit } = req.body;

    // Validate parameters
    const validation = validateDeploymentParams({ rpcUrl, constructorArgs, gasLimit });
    if (!validation.valid) {
      logger.warn('Validation failed', { rayId: req.rayId, functionName: 'deployTeleporterMessengerController', error: validation.error });
      return res.status(400).json({
        success: false,
        error: validation.error,
        rayId: req.rayId,
      });
    }

    // Deploy contract
    logger.info('Deploying TeleporterMessenger contract', { rayId: req.rayId, functionName: 'deployTeleporterMessengerController' });
    const result = await deployTeleporterMessenger({
      rpcUrl,
      constructorArgs,
      gasLimit,
    });

    logger.info('TeleporterMessenger deployment completed', { rayId: req.rayId, functionName: 'deployTeleporterMessengerController', success: result.success });
    return res.status(result.success ? 200 : 500).json({ ...result, rayId: req.rayId });
  } catch (error) {
    logger.error('Error in deployTeleporterMessengerController', { rayId: req.rayId, functionName: 'deployTeleporterMessengerController', error: error instanceof Error ? error.message : 'Unknown error' });
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      rayId: req.rayId,
    });
  }
}

/**
 * Deploy TeleporterRegistry contract
 * PUT /deploy/teleporter-registry
 */
export async function deployTeleporterRegistryController(req: Request, res: Response) {
  logFunctionEntry('deployTeleporterRegistryController', req.rayId);
  try {
    const { rpcUrl, constructorArgs, gasLimit } = req.body;

    // Validate parameters
    const validation = validateDeploymentParams({ rpcUrl, constructorArgs, gasLimit });
    if (!validation.valid) {
      logger.warn('Validation failed', { rayId: req.rayId, functionName: 'deployTeleporterRegistryController', error: validation.error });
      return res.status(400).json({
        success: false,
        error: validation.error,
        rayId: req.rayId,
      });
    }

    // Deploy contract
    logger.info('Deploying TeleporterRegistry contract', { rayId: req.rayId, functionName: 'deployTeleporterRegistryController' });
    const result = await deployTeleporterRegistry({
      rpcUrl,
      constructorArgs,
      gasLimit,
    });

    logger.info('TeleporterRegistry deployment completed', { rayId: req.rayId, functionName: 'deployTeleporterRegistryController', success: result.success });
    return res.status(result.success ? 200 : 500).json({ ...result, rayId: req.rayId });
  } catch (error) {
    logger.error('Error in deployTeleporterRegistryController', { rayId: req.rayId, functionName: 'deployTeleporterRegistryController', error: error instanceof Error ? error.message : 'Unknown error' });
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      rayId: req.rayId,
    });
  }
}

/**
 * Get deployer wallet info
 * GET /deploy/wallet-info
 */
export async function getWalletInfoController(req: Request, res: Response) {
  logFunctionEntry('getWalletInfoController', req.rayId);
  try {
    const { rpcUrl } = req.query;

    const address = getWalletAddress();
    
    let balance: string | undefined;
    if (rpcUrl && typeof rpcUrl === 'string') {
      balance = await getWalletBalance(rpcUrl);
    }

    logger.info('Wallet info retrieved', { rayId: req.rayId, functionName: 'getWalletInfoController', address });
    return res.json({
      success: true,
      address,
      balance: balance ? `${balance} native tokens` : 'Provide rpcUrl query param to check balance',
      rayId: req.rayId,
    });
  } catch (error) {
    logger.error('Error in getWalletInfoController', { rayId: req.rayId, functionName: 'getWalletInfoController', error: error instanceof Error ? error.message : 'Unknown error' });
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      rayId: req.rayId,
    });
  }
}

/**
 * Get contract artifacts (ABI and bytecode)
 * GET /deploy/artifacts/:contractName
 */
export async function getArtifactsController(req: Request, res: Response) {
  logFunctionEntry('getArtifactsController', req.rayId);
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
        logger.warn('Contract not found', { rayId: req.rayId, functionName: 'getArtifactsController', contractName });
        return res.status(404).json({
          success: false,
          error: 'Contract not found. Available contracts: erc20-token-home, erc20-token-remote, teleporter-messenger, teleporter-registry',
          rayId: req.rayId,
        });
    }

    logger.info('Artifacts retrieved', { rayId: req.rayId, functionName: 'getArtifactsController', contractName });
    return res.json({
      success: true,
      contractName,
      artifacts,
      rayId: req.rayId,
    });
  } catch (error) {
    logger.error('Error in getArtifactsController', { rayId: req.rayId, functionName: 'getArtifactsController', error: error instanceof Error ? error.message : 'Unknown error' });
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      rayId: req.rayId,
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
  logFunctionEntry('deployUnifiedBridgeController', req.rayId);
  try {
    const params = req.body;

    // Validate parameters
    const validation = validateUnifiedDeploymentParams(params);
    if (!validation.valid) {
      logger.warn('Validation failed', { rayId: req.rayId, functionName: 'deployUnifiedBridgeController', error: validation.error });
      return res.status(400).json({
        success: false,
        error: validation.error,
        rayId: req.rayId,
      });
    }

    // Deploy unified bridge
    logger.info('Deploying unified bridge', { rayId: req.rayId, functionName: 'deployUnifiedBridgeController' });
    const result = await deployUnifiedBridge(params, req.rayId);

    logger.info('Unified bridge deployment completed', { rayId: req.rayId, functionName: 'deployUnifiedBridgeController', success: result.success });
    return res.status(result.success ? 200 : 500).json({ ...result, rayId: req.rayId });
  } catch (error) {
    logger.error('Error in deployUnifiedBridgeController', { rayId: req.rayId, functionName: 'deployUnifiedBridgeController', error: error instanceof Error ? error.message : 'Unknown error' });
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      rayId: req.rayId,
    });
  }
}

export async function getIcttSetupsController(req: Request, res: Response) {
  logFunctionEntry('getIcttSetupsController', req.rayId);
  try {
    const icttSetups = await getIcttSetups();
    return res.json({
      success: true,
      icttSetups,
      rayId: req.rayId,
    });
  }
  catch(error) {
    logger.error("Error in getIcttSetupsController", { rayId: req.rayId, functionName: 'getIcttSetupsController', error: error instanceof Error ? error.message : 'Unknown error' });
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      rayId: req.rayId,
    });
  }
}