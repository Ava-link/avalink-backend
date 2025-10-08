import { ethers, Wallet, JsonRpcProvider } from 'ethers';
import { env } from './env';

/**
 * Global Wallet Module
 * 
 * This module provides a centralized wallet/signer that can be used
 * for deploying contracts across different chains.
 * 
 * Usage:
 *   import { getWallet } from './config/wallet';
 *   const wallet = getWallet(rpcUrl);
 *   // Use wallet to deploy contracts
 */

/**
 * Create a wallet instance for a specific chain
 * @param rpcUrl - The RPC URL of the blockchain network
 * @returns Wallet instance connected to the provider
 */
export function getWallet(rpcUrl: string): Wallet {
  try {
    // Create provider
    const provider = new JsonRpcProvider(rpcUrl);
    
    // Create wallet from private key
    const wallet = new Wallet(env.DEPLOYER_PRIVATE_KEY, provider);
    
    return wallet;
  } catch (error) {
    console.error('Error creating wallet:', error);
    throw new Error(`Failed to create wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get wallet address
 * @returns The address of the deployer wallet
 */
export function getWalletAddress(): string {
  try {
    const wallet = new Wallet(env.DEPLOYER_PRIVATE_KEY);
    return wallet.address;
  } catch (error) {
    console.error('Error getting wallet address:', error);
    throw new Error('Failed to get wallet address');
  }
}

/**
 * Check wallet balance on a specific chain
 * @param rpcUrl - The RPC URL of the blockchain network
 * @returns Balance in native token (e.g., ETH, AVAX)
 */
export async function getWalletBalance(rpcUrl: string): Promise<string> {
  try {
    const wallet = getWallet(rpcUrl);
    if (!wallet.provider) {
      throw new Error('Provider not found for wallet');
    }
    const balance = await wallet.provider.getBalance(wallet.address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    throw new Error(`Failed to get wallet balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

