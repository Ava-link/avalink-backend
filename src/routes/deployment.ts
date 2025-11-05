import { Router } from 'express';
import {
  deployERC20TokenHomeController,
  deployERC20TokenRemoteController,
  deployTeleporterMessengerController,
  deployTeleporterRegistryController,
  getWalletInfoController,
  getArtifactsController,
  deployUnifiedBridgeController,
  getIcttSetupsController,
  getChainsController,
  getIcttSetupController,
} from '../controllers/deployment.controller';

const router = Router();

/**
 * Deployment Routes
 * 
 * All routes for deploying contracts and managing deployments
 */

// Deploy unified cross-chain bridge (complete setup)
router.put('/bridge', deployUnifiedBridgeController);

// Deploy ERC20TokenHome contract // not using
router.put('/erc20-token-home', deployERC20TokenHomeController);

// Deploy ERC20TokenRemote contract // not using
router.put('/erc20-token-remote', deployERC20TokenRemoteController);

// Deploy TeleporterMessenger contract // not using
router.put('/teleporter-messenger', deployTeleporterMessengerController);

// Deploy TeleporterRegistry contract // not using
router.put('/teleporter-registry', deployTeleporterRegistryController);

// Get wallet info
router.get('/wallet-info', getWalletInfoController);

// Get contract artifacts // not using
router.get('/artifacts/:contractName', getArtifactsController);

// Get all ictt 
router.get("/ictt", getIcttSetupsController);

// Get all chains
router.get("/chains", getChainsController);

// Get ictt setup by home chain id
router.get("/ictt/:homeChainId", getIcttSetupController);

export default router;

