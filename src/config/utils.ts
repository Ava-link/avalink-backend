import winston from 'winston';
import path from 'path';
import fs from 'fs';

/**
 * Deployment Logger Utility
 * 
 * Creates structured, readable logs for deployments without cluttering the code
 */

export class DeploymentLogger {
  private logger: winston.Logger;
  private rayId?: string;
  private startTime: number;
  private steps: Array<{ step: string; status: 'pending' | 'success' | 'error'; details?: any }> = [];

  constructor(rayId?: string) {
    this.rayId = rayId;
    this.startTime = Date.now();
    
    // Ensure logs/deployments directory exists
    const deploymentsDir = path.join(process.cwd(), 'logs', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    // Create deployment-specific log file
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const logFileName = `deployment-${timestamp}${rayId ? `-${rayId}` : ''}.log`;
    const logFilePath = path.join(deploymentsDir, logFileName);

    // Custom format for deployment logs
    const deploymentFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf((info) => {
        const { timestamp, level, message, ...meta } = info;
        let log = `${timestamp} [${level.toUpperCase()}]`;
        if (this.rayId) log += ` [${this.rayId}]`;
        log += `: ${message}`;
        if (Object.keys(meta).length > 0) {
          log += `\n${JSON.stringify(meta, null, 2)}`;
        }
        return log;
      })
    );

    this.logger = winston.createLogger({
      transports: [
        new winston.transports.File({
          filename: logFilePath,
          format: deploymentFormat,
        }),
      ],
    });
  }

  header(title: string) {
    const line = '='.repeat(60);
    this.logger.info(line);
    this.logger.info(`🚀 ${title}`);
    this.logger.info(line);
  }

  section(title: string) {
    this.logger.info(`\n${'─'.repeat(60)}`);
    this.logger.info(title);
    this.logger.info('─'.repeat(60));
  }

  step(stepNumber: number, totalSteps: number, description: string) {
    const msg = `📍 STEP ${stepNumber}/${totalSteps}: ${description}`;
    this.logger.info(msg);
    this.steps.push({ step: `${stepNumber}/${totalSteps}: ${description}`, status: 'pending' });
  }

  success(message: string, details?: any) {
    if (this.steps.length > 0) {
      this.steps[this.steps.length - 1].status = 'success';
      if (details) this.steps[this.steps.length - 1].details = details;
    }
    this.logger.info(`✅ ${message}`, details);
  }

  error(message: string, error?: any) {
    if (this.steps.length > 0) {
      this.steps[this.steps.length - 1].status = 'error';
      if (error) this.steps[this.steps.length - 1].details = error;
    }
    this.logger.error(`❌ ${message}`, { error: error instanceof Error ? error.message : error });
  }

  warn(message: string, details?: any) {
    this.logger.warn(`⚠️  ${message}`, details);
  }

  info(message: string, details?: any) {
    this.logger.info(message, details);
  }

  summary(data: any) {
    this.section('📋 DEPLOYMENT SUMMARY');
    this.logger.info(JSON.stringify(data, null, 2));
  }

  complete(success: boolean) {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    const line = '='.repeat(60);
    
    this.logger.info('\n' + line);
    if (success) {
      this.logger.info(`✅ DEPLOYMENT COMPLETE (${duration}s)`);
    } else {
      this.logger.error(`❌ DEPLOYMENT FAILED (${duration}s)`);
    }
    this.logger.info(line);

    // Log step summary
    this.logger.info('\nStep Summary:');
    this.steps.forEach((step, idx) => {
      const icon = step.status === 'success' ? '✅' : step.status === 'error' ? '❌' : '⏳';
      this.logger.info(`  ${icon} ${step.step}`);
    });
  }

  // For backward compatibility with existing logger
  getWinstonLogger() {
    return this.logger;
  }
}

/**
 * Helper to format chain info
 */
export function formatChainInfo(chain: any) {
  return {
    'RPC URL': chain.rpcUrl,
    'Blockchain ID': chain.blockchainId,
    'TeleporterMessenger': chain.teleporterMessenger?.address || 'N/A',
    'TeleporterRegistry': chain.teleporterRegistry?.address || 'N/A',
  };
}

/**
 * Helper to format contract deployment info
 */
export function formatDeploymentInfo(contract: string, address: string, txHash?: string, gasUsed?: string) {
  return {
    Contract: contract,
    Address: address,
    'Transaction Hash': txHash || 'N/A',
    'Gas Used': gasUsed || 'N/A',
  };
}
