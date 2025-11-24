import express, { Router } from 'express';
import { checkBlockChainController, checkTokenAddressController } from '../controllers/checks.controller';

const router: express.Router = Router();

// Check if blockChainId is valid on the given network
// GET /checks/blockChain/:network/:blockChainId
router.get("/blockChain/:network/:blockChainId", checkBlockChainController);

// Check if token address is deployed on blockchain
// GET /checks/token/:tokenAddress/:blockChainId?rpcUrl=<rpc_url>
router.get("/token/:tokenAddress/:blockChainId", checkTokenAddressController);

export default router;

