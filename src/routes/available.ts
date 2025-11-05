import { Router } from 'express';
import {
  getIcttSetupsController,
  getChainsController,
  getIcttSetupController,
} from '../controllers/deployment.controller';

const router = Router();

// Get all ictt 
router.get("/ictt", getIcttSetupsController);

// Get all chains
router.get("/chains", getChainsController);

// Get ictt setup by home chain id
router.get("/ictt/:homeChainId", getIcttSetupController);

export default router;

