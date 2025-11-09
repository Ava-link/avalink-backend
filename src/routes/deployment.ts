import express, { Router } from 'express';
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

const router: express.Router = Router();

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

export default router;

