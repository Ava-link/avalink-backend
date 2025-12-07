import express, { Router } from 'express';
import { requestTokensController, getFaucetStatusController } from '../controllers/faucet.controller';

const router: Router = express.Router();

// Request tokens from faucet
router.post('/', requestTokensController);

// Get faucet status
router.get('/status', getFaucetStatusController);

export default router;
