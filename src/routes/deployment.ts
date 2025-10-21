import { Router } from 'express';
import {
  deployERC20TokenHomeController,
  deployERC20TokenRemoteController,
  deployTeleporterMessengerController,
  deployTeleporterRegistryController,
  getWalletInfoController,
  getArtifactsController,
  deployUnifiedBridgeController,
} from '../controllers/deployment.controller';

const router = Router();

/**
 * Deployment Routes
 * 
 * All routes for deploying contracts and managing deployments
 */

// Deploy unified cross-chain bridge (complete setup)
router.put('/bridge', deployUnifiedBridgeController);

// Deploy ERC20TokenHome contract
router.put('/erc20-token-home', deployERC20TokenHomeController);

// Deploy ERC20TokenRemote contract
router.put('/erc20-token-remote', deployERC20TokenRemoteController);

// Deploy TeleporterMessenger contract
router.put('/teleporter-messenger', deployTeleporterMessengerController);

// Deploy TeleporterRegistry contract
router.put('/teleporter-registry', deployTeleporterRegistryController);

// Get wallet info
router.get('/wallet-info', getWalletInfoController);

// Get contract artifacts
router.get('/artifacts/:contractName', getArtifactsController);

export default router;

