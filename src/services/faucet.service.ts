import { ethers, Contract, Wallet } from 'ethers';
import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';
import { getWallet } from '../config/wallet';
import logger from '../config/logger';

const prisma = new PrismaClient();

// Standard ERC20 ABI - only the functions we need
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
];

export interface FaucetRequestResult {
  success: boolean;
  txHash?: string;
  message: string;
  rateLimitedUntil?: Date;
  remainingMinutes?: number;
}

export interface BalanceCheckResult {
  hasEnoughBalance: boolean;
  currentBalance: number;
  requiredBalance: number;
  formattedBalance: string;
}

/**
 * Check if a wallet address has requested tokens recently (rate limiting)
 */
export async function checkRateLimit(
  walletAddress: string,
  tokenAddress: string
): Promise<{ canRequest: boolean; lastRequest?: Date; remainingMinutes?: number }> {
  try {
    const rateLimitMinutes = env.FAUCET_RATE_LIMIT_MINUTES;
    const cutoffTime = new Date(Date.now() - rateLimitMinutes * 60 * 1000);

    // Find the most recent request from this wallet for this token
    const lastRequest = await prisma.faucetRequest.findFirst({
      where: {
        walletAddress: walletAddress.toLowerCase(),
        tokenAddress: tokenAddress.toLowerCase(),
        createdAt: {
          gte: cutoffTime,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!lastRequest) {
      return { canRequest: true };
    }

    // Calculate remaining time
    const timeSinceRequest = Date.now() - lastRequest.createdAt.getTime();
    const remainingMs = rateLimitMinutes * 60 * 1000 - timeSinceRequest;
    const remainingMinutes = Math.ceil(remainingMs / 60000);

    return {
      canRequest: false,
      lastRequest: lastRequest.createdAt,
      remainingMinutes,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error checking rate limit', {
      error: errorMessage,
      walletAddress,
      tokenAddress
    });
    throw new Error('Failed to check rate limit');
  }
}

/**
 * Check if the deployer wallet has enough token balance
 */
export async function checkTokenBalance(
  tokenAddress: string,
  rpcUrl: string
): Promise<BalanceCheckResult> {
  try {
    const wallet = getWallet(rpcUrl);
    const tokenContract = new Contract(tokenAddress, ERC20_ABI, wallet);

    // Get token decimals with fallback to 18
    let decimals = 18; // Default to 18 decimals
    try {
      decimals = await tokenContract.decimals();
    } catch (decimalsError) {
      logger.warn('Failed to get token decimals, defaulting to 18', {
        tokenAddress,
        error: decimalsError instanceof Error ? decimalsError.message : 'Unknown error',
      });
    }

    // Get balance
    const balance = await tokenContract.balanceOf(wallet.address);

    // Convert balance to human-readable format
    const balanceFormatted = ethers.formatUnits(balance, decimals);
    const balanceNumber = parseFloat(balanceFormatted);

    const requiredBalance = env.FAUCET_MIN_BALANCE;
    const hasEnoughBalance = balanceNumber >= requiredBalance;

    logger.info('Token balance check', {
      tokenAddress,
      deployerAddress: wallet.address,
      balance: balanceFormatted,
      decimals,
      requiredBalance,
      hasEnoughBalance,
    });

    return {
      hasEnoughBalance,
      currentBalance: balanceNumber,
      requiredBalance,
      formattedBalance: balanceFormatted,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error checking token balance', {
      error: errorMessage,
      tokenAddress,
      rpcUrl
    });
    throw new Error(`Failed to check token balance: ${errorMessage}`);
  }
}

/**
 * Send tokens to a recipient address
 */
export async function sendTokens(
  recipientAddress: string,
  tokenAddress: string,
  rpcUrl: string
): Promise<FaucetRequestResult> {
  try {
    // Validate recipient address
    if (!ethers.isAddress(recipientAddress)) {
      return {
        success: false,
        message: 'Invalid recipient address format',
      };
    }

    // Normalize addresses
    const normalizedRecipient = recipientAddress.toLowerCase();
    const normalizedToken = tokenAddress.toLowerCase();

    // Check rate limit
    const rateLimitCheck = await checkRateLimit(normalizedRecipient, normalizedToken);
    if (!rateLimitCheck.canRequest) {
      return {
        success: false,
        message: `Rate limit exceeded. Please try again in ${rateLimitCheck.remainingMinutes} minutes.`,
        rateLimitedUntil: new Date(Date.now() + (rateLimitCheck.remainingMinutes || 0) * 60000),
        remainingMinutes: rateLimitCheck.remainingMinutes,
      };
    }

    // Check deployer balance
    const balanceCheck = await checkTokenBalance(normalizedToken, rpcUrl);
    if (!balanceCheck.hasEnoughBalance) {
      return {
        success: false,
        message: `Faucet has insufficient balance. Current: ${balanceCheck.formattedBalance}, Required: ${balanceCheck.requiredBalance}`,
      };
    }

    // Get wallet and create contract instance
    const wallet = getWallet(rpcUrl);
    const tokenContract = new Contract(normalizedToken, ERC20_ABI, wallet);

    // Get token decimals with fallback to 18
    let decimals = 18; // Default to 18 decimals
    try {
      decimals = await tokenContract.decimals();
    } catch (decimalsError) {
      logger.warn('Failed to get token decimals, defaulting to 18', {
        tokenAddress: normalizedToken,
        error: decimalsError instanceof Error ? decimalsError.message : 'Unknown error',
      });
    }

    // Get token symbol and name (with fallbacks)
    let symbol = 'UNKNOWN';
    let name = 'Unknown Token';
    try {
      [symbol, name] = await Promise.all([
        tokenContract.symbol(),
        tokenContract.name(),
      ]);
    } catch (metadataError) {
      logger.warn('Failed to get token metadata', {
        tokenAddress: normalizedToken,
        error: metadataError instanceof Error ? metadataError.message : 'Unknown error',
      });
    }

    // Calculate amount with decimals (e.g., 2 tokens)
    const amountToSend = env.FAUCET_AMOUNT;
    const amountWithDecimals = ethers.parseUnits(amountToSend.toString(), decimals);

    logger.info('Sending tokens from faucet', {
      recipient: recipientAddress,
      token: { address: normalizedToken, symbol, name },
      amount: amountToSend,
      amountWithDecimals: amountWithDecimals.toString(),
      decimals,
    });

    // Execute transfer
    const tx = await tokenContract.transfer(recipientAddress, amountWithDecimals);
    logger.info('Transaction submitted', { txHash: tx.hash });

    // Wait for confirmation
    const receipt = await tx.wait();
    logger.info('Transaction confirmed', {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      status: receipt.status,
    });

    // Record the faucet request in database
    await prisma.faucetRequest.create({
      data: {
        walletAddress: normalizedRecipient,
        tokenAddress: normalizedToken,
        amount: amountToSend.toString(),
        txHash: receipt.hash,
      },
    });

    return {
      success: true,
      txHash: receipt.hash,
      message: `Successfully sent ${amountToSend} ${symbol} to ${recipientAddress}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error sending tokens', {
      error: errorMessage,
      recipientAddress,
      tokenAddress
    });

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('insufficient funds')) {
        return {
          success: false,
          message: 'Faucet wallet has insufficient gas for transaction',
        };
      }
      if (error.message.includes('nonce')) {
        return {
          success: false,
          message: 'Transaction nonce error. Please try again.',
        };
      }
    }

    return {
      success: false,
      message: `Failed to send tokens: ${errorMessage}`,
    };
  }
}

/**
 * Get faucet status information
 */
export async function getFaucetStatus(
  tokenAddress: string,
  rpcUrl: string
): Promise<{
  isOperational: boolean;
  balance: BalanceCheckResult;
  tokenInfo?: {
    symbol: string;
    name: string;
    decimals: number;
  };
}> {
  try {
    const wallet = getWallet(rpcUrl);
    const tokenContract = new Contract(tokenAddress, ERC20_ABI, wallet);

    // Get token decimals with fallback to 18
    let decimals = 18; // Default to 18 decimals
    try {
      decimals = await tokenContract.decimals();
    } catch (decimalsError) {
      logger.warn('Failed to get token decimals, defaulting to 18', {
        tokenAddress,
        error: decimalsError instanceof Error ? decimalsError.message : 'Unknown error',
      });
    }

    // Get token metadata with fallbacks
    let symbol = 'UNKNOWN';
    let name = 'Unknown Token';
    try {
      [symbol, name] = await Promise.all([
        tokenContract.symbol(),
        tokenContract.name(),
      ]);
    } catch (metadataError) {
      logger.warn('Failed to get token metadata', {
        tokenAddress,
        error: metadataError instanceof Error ? metadataError.message : 'Unknown error',
      });
    }

    // Get balance
    const balance = await tokenContract.balanceOf(wallet.address);

    const balanceFormatted = ethers.formatUnits(balance, decimals);
    const balanceNumber = parseFloat(balanceFormatted);
    const requiredBalance = env.FAUCET_MIN_BALANCE;

    return {
      isOperational: balanceNumber >= requiredBalance,
      balance: {
        hasEnoughBalance: balanceNumber >= requiredBalance,
        currentBalance: balanceNumber,
        requiredBalance,
        formattedBalance: balanceFormatted,
      },
      tokenInfo: {
        symbol,
        name,
        decimals,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error getting faucet status', {
      error: errorMessage,
      tokenAddress,
      rpcUrl
    });
    throw new Error('Failed to get faucet status');
  }
}
