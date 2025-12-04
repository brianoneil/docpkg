import { Command } from 'commander';
import { LockfileManager } from '../../core/lockfile.js';
import { logger } from '../../core/logger.js';
import fs from 'fs-extra';
import path from 'path';

export function verifyCommand() {
  return new Command('verify')
    .description('Verify integrity of installed documentation')
    .action(async () => {
      try {
        const lockfileManager = new LockfileManager();
        await lockfileManager.load();
        const lockfile = lockfileManager.data;
        
        let errorCount = 0;

        logger.info('Verifying installation...');

        for (const [name, entry] of Object.entries(lockfile.sources)) {
            const extractedPath = path.resolve(process.cwd(), entry.extractedPath);
            
            if (!await fs.pathExists(extractedPath)) {
                logger.error(`[${name}] Missing directory: ${extractedPath}`);
                errorCount++;
                continue;
            }
            
            // Basic check: is it empty?
            const files = await fs.readdir(extractedPath);
            if (files.length === 0) {
                logger.warn(`[${name}] Directory is empty: ${extractedPath}`);
                // Not necessarily an error, but suspicious
            }

            // Future: Check integrity hash if we stored it
            // For now, just existence check is passing
            logger.success(`[${name}] Verified (${entry.resolved})`);
        }

        if (errorCount > 0) {
            logger.error(`Verification failed with ${errorCount} errors.`);
            process.exit(1);
        } else {
            logger.success('All packages verified.');
        }

      } catch (error) {
        logger.error(error.message);
        process.exit(1);
      }
    });
}
