import { Request, Response } from 'express';
import { ethers } from 'ethers';
import logger, { logFunctionEntry } from '../config/logger';
import { env } from '../config/env';

// Standard ERC20 ABI - minimal interface for token information
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
];

/**
 * Check if blockchain ID exists on the given network
 * GET /checks/blockChain/:network/:blockChainId
 */
export async function checkBlockChainController(req: Request, res: Response) {
  logFunctionEntry('checkBlockChainController', req.rayId);
  try {
    const { network, blockChainId } = req.params;

    // Validate parameters
    if (!network || !blockChainId) {
      logger.warn('Missing parameters', { 
        rayId: req.rayId, 
        functionName: 'checkBlockChainController', 
        network, 
        blockChainId 
      });
      return res.status(400).json({
        success: false,
        error: 'Both network and blockChainId are required',
        rayId: req.rayId,
      });
    }

    logger.info('Checking blockchain', { 
      rayId: req.rayId, 
      functionName: 'checkBlockChainController', 
      network, 
      blockChainId 
    });

    // Call Glacier API to check if blockchain exists
    const glacierUrl = `https://glacier-api.avax.network/v1/networks/${network}/blockchains/${blockChainId}`;
    
    logger.info('Calling Glacier API', { 
      rayId: req.rayId, 
      functionName: 'checkBlockChainController', 
      url: glacierUrl 
    });

    const response = await fetch(glacierUrl, {
      headers: {
        'x-glacier-api-key': env.AVACLOUD_API_KEY || '',
      },
    });

    if (!response.ok) {
      // Try to get error details from response
      let errorDetails = '';
      try {
        const errorData = await response.json();
        errorDetails = JSON.stringify(errorData);
      } catch (e) {
        errorDetails = await response.text();
      }

      logger.error('Glacier API error', { 
        rayId: req.rayId, 
        functionName: 'checkBlockChainController', 
        status: response.status,
        statusText: response.statusText,
        errorDetails,
        url: glacierUrl
      });

      if (response.status === 404) {
        return res.status(404).json({
          success: false,
          message: `Blockchain ${blockChainId} not found on network ${network}`,
          rayId: req.rayId,
        });
      }
      
      throw new Error(`Glacier API returned ${response.status}: ${response.statusText}. Details: ${errorDetails}`);
    }

    const blockchainData: any = await response.json();
    
    logger.info('Blockchain found', { 
      rayId: req.rayId, 
      functionName: 'checkBlockChainController', 
      network, 
      blockChainId,
      blockchainName: blockchainData.blockchainName 
    });

    return res.status(200).json({
      success: true,
      message: 'Blockchain found',
      data: {
        blockchainId: blockchainData.blockchainId,
        blockchainName: blockchainData.blockchainName,
        network: blockchainData.network,
        chainId: blockchainData.chainId,
        subnetId: blockchainData.subnetId,
        vmId: blockchainData.vmId,
        vmName: blockchainData.vmName,
        explorerUrl: blockchainData.explorerUrl,
        rpcUrl: blockchainData.rpcUrl,
        wsUrl: blockchainData.wsUrl,
        isTestnet: blockchainData.isTestnet,
        chainLogoUri: blockchainData.chainLogoUri,
        // Include native token info if available
        nativeToken: blockchainData.nativeToken ? {
          name: blockchainData.nativeToken.name,
          symbol: blockchainData.nativeToken.symbol,
          decimals: blockchainData.nativeToken.decimals,
        } : undefined,
      },
      rayId: req.rayId,
    });
  } catch (error) {
    logger.error('Error in checkBlockChainController', { 
      rayId: req.rayId, 
      functionName: 'checkBlockChainController', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      rayId: req.rayId,
    });
  }
}

/**
 * Check if token address exists on blockchain and retrieve token information
 * GET /checks/token/:tokenAddress/:blockChainId
 */
export async function checkTokenAddressController(req: Request, res: Response) {
  logFunctionEntry('checkTokenAddressController', req.rayId);
  try {
    const { tokenAddress, blockChainId } = req.params;
    const { rpcUrl } = req.query;

    // Validate parameters
    if (!tokenAddress || !blockChainId) {
      logger.warn('Missing parameters', { 
        rayId: req.rayId, 
        functionName: 'checkTokenAddressController', 
        tokenAddress, 
        blockChainId 
      });
      return res.status(400).json({
        success: false,
        error: 'Both tokenAddress and blockChainId are required',
        rayId: req.rayId,
      });
    }

    if (!rpcUrl || typeof rpcUrl !== 'string') {
      logger.warn('Missing or invalid rpcUrl', { 
        rayId: req.rayId, 
        functionName: 'checkTokenAddressController', 
        tokenAddress, 
        blockChainId 
      });
      return res.status(400).json({
        success: false,
        error: 'rpcUrl query parameter is required',
        rayId: req.rayId,
      });
    }

    // Validate Ethereum address format
    if (!ethers.isAddress(tokenAddress)) {
      logger.warn('Invalid token address format', { 
        rayId: req.rayId, 
        functionName: 'checkTokenAddressController', 
        tokenAddress 
      });
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address format',
        rayId: req.rayId,
      });
    }

    logger.info('Checking token address', { 
      rayId: req.rayId, 
      functionName: 'checkTokenAddressController', 
      tokenAddress, 
      blockChainId,
      rpcUrl 
    });

    // Connect to the blockchain via RPC
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Check if address has code (is a contract)
    const code = await provider.getCode(tokenAddress);
    
    if (code === '0x') {
      logger.info('No contract found at address', { 
        rayId: req.rayId, 
        functionName: 'checkTokenAddressController', 
        tokenAddress, 
        blockChainId 
      });
      return res.status(404).json({
        success: false,
        message: `No contract found at address ${tokenAddress} on blockchain ${blockChainId}`,
        rayId: req.rayId,
      });
    }

    // Try to read token information
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    
    let tokenInfo: any = {
      address: tokenAddress,
      blockChainId,
      isContract: true,
    };

    // Try to get ERC20 token information
    // Each call is wrapped in try-catch to handle non-ERC20 contracts gracefully
    try {
      const [name, symbol, decimals, totalSupply] = await Promise.allSettled([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply(),
      ]);

      if (name.status === 'fulfilled') {
        tokenInfo.name = name.value;
      }
      if (symbol.status === 'fulfilled') {
        tokenInfo.symbol = symbol.value;
      }
      if (decimals.status === 'fulfilled') {
        tokenInfo.decimals = Number(decimals.value);
      }
      if (totalSupply.status === 'fulfilled') {
        tokenInfo.totalSupply = totalSupply.value.toString();
        // Also provide formatted total supply if we have decimals
        if (tokenInfo.decimals !== undefined) {
          tokenInfo.totalSupplyFormatted = ethers.formatUnits(totalSupply.value, tokenInfo.decimals);
        }
      }

      // Check if we got at least some ERC20 info
      const hasERC20Info = tokenInfo.name || tokenInfo.symbol || tokenInfo.decimals !== undefined;
      
      if (hasERC20Info) {
        tokenInfo.isERC20 = true;
        logger.info('Token found and identified as ERC20', { 
          rayId: req.rayId, 
          functionName: 'checkTokenAddressController', 
          tokenAddress, 
          blockChainId,
          symbol: tokenInfo.symbol,
          name: tokenInfo.name 
        });
      } else {
        tokenInfo.isERC20 = false;
        logger.info('Contract found but not ERC20 compliant', { 
          rayId: req.rayId, 
          functionName: 'checkTokenAddressController', 
          tokenAddress, 
          blockChainId 
        });
      }
    } catch (error) {
      // Contract exists but doesn't implement ERC20 interface
      tokenInfo.isERC20 = false;
      logger.info('Contract found but failed to read ERC20 info', { 
        rayId: req.rayId, 
        functionName: 'checkTokenAddressController', 
        tokenAddress, 
        blockChainId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }

    return res.status(200).json({
      success: true,
      message: tokenInfo.isERC20 
        ? 'ERC20 token found' 
        : 'Contract found but not ERC20 compliant',
      data: tokenInfo,
      rayId: req.rayId,
    });
  } catch (error) {
    logger.error('Error in checkTokenAddressController', { 
      rayId: req.rayId, 
      functionName: 'checkTokenAddressController', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      rayId: req.rayId,
    });
  }
}

