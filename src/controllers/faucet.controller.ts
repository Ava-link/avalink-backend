import { Request, Response } from 'express';
import { z } from 'zod';
import { sendTokens, getFaucetStatus } from '../services/faucet.service';
import { env } from '../config/env';
import logger from '../config/logger';

/**
 * Request schema for faucet endpoint
 */
const faucetRequestSchema = z.object({
  walletAddress: z
    .string()
    .length(42, 'Wallet address must be 42 characters')
    .startsWith('0x', 'Wallet address must start with 0x')
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address format'),
  tokenAddress: z
    .string()
    .length(42, 'Token address must be 42 characters')
    .startsWith('0x', 'Token address must start with 0x')
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid token address format'),
  rpcUrl: z.string().url('Invalid RPC URL format'),
});

/**
 * POST /faucet
 * Request tokens from the faucet
 */
export async function requestTokensController(req: Request, res: Response): Promise<void> {
  const rayId = req.rayId;

  try {
    // Validate request body
    const validationResult = faucetRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.warn('Invalid faucet request', {
        rayId,
        errors: validationResult.error.issues,
        body: req.body,
      });

      res.status(400).json({
        status: 'error',
        message: 'Invalid request parameters',
        errors: validationResult.error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
        rayId,
      });
      return;
    }

    const { walletAddress, tokenAddress, rpcUrl } = validationResult.data;

    logger.info('Processing faucet request', {
      rayId,
      walletAddress,
      tokenAddress,
      rpcUrl,
    });

    // Send tokens
    const result = await sendTokens(walletAddress, tokenAddress, rpcUrl);

    if (result.success) {
      logger.info('Faucet request successful', {
        rayId,
        walletAddress,
        txHash: result.txHash,
      });

      res.status(200).json({
        status: 'success',
        message: result.message,
        data: {
          txHash: result.txHash,
          recipient: walletAddress,
          amount: env.FAUCET_AMOUNT,
        },
        rayId,
      });
    } else {
      // Handle rate limiting with 429 status
      if (result.rateLimitedUntil) {
        logger.warn('Faucet request rate limited', {
          rayId,
          walletAddress,
          remainingMinutes: result.remainingMinutes,
        });

        res.status(429).json({
          status: 'error',
          message: result.message,
          data: {
            rateLimitedUntil: result.rateLimitedUntil,
            remainingMinutes: result.remainingMinutes,
          },
          rayId,
        });
        return;
      }

      // Other errors (insufficient balance, etc.)
      logger.error('Faucet request failed', {
        rayId,
        walletAddress,
        message: result.message,
      });

      res.status(400).json({
        status: 'error',
        message: result.message,
        rayId,
      });
    }
  } catch (error) {
    logger.error('Faucet controller error', {
      rayId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    res.status(500).json({
      status: 'error',
      message: 'Internal server error while processing faucet request',
      rayId,
    });
  }
}

/**
 * GET /faucet/status?tokenAddress=0x...&rpcUrl=https://...
 * Get faucet operational status for a specific token
 */
export async function getFaucetStatusController(req: Request, res: Response): Promise<void> {
  const rayId = req.rayId;

  try {
    const { tokenAddress, rpcUrl } = req.query;

    // Validate query parameters
    if (!tokenAddress || typeof tokenAddress !== 'string') {
      res.status(400).json({
        status: 'error',
        message: 'Token address is required as query parameter',
        rayId,
      });
      return;
    }

    if (!rpcUrl || typeof rpcUrl !== 'string') {
      res.status(400).json({
        status: 'error',
        message: 'RPC URL is required as query parameter',
        rayId,
      });
      return;
    }

    const status = await getFaucetStatus(tokenAddress, rpcUrl);

    res.status(200).json({
      status: 'success',
      data: {
        isOperational: status.isOperational,
        tokenInfo: status.tokenInfo,
        balance: {
          current: status.balance.formattedBalance,
          required: status.balance.requiredBalance,
          hasEnough: status.balance.hasEnoughBalance,
        },
        config: {
          amountPerRequest: env.FAUCET_AMOUNT,
          rateLimitMinutes: env.FAUCET_RATE_LIMIT_MINUTES,
        },
      },
      rayId,
    });
  } catch (error) {
    logger.error('Error getting faucet status', {
      rayId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      status: 'error',
      message: 'Failed to get faucet status',
      rayId,
    });
  }
}
