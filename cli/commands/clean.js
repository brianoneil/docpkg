import { Command } from 'commander';
import { ConfigManager } from '../../core/config.js';
import { logger } from '../../core/logger.js';
import fs from 'fs-extra';
import path from 'path';

export function cleanCommand() {
  return new Command('clean')
    .description('Remove all installed documentation')
    .option('--cache', 'Also clean global cache')
    .action(async (options) => {
      try {
        const configManager = new ConfigManager();
        await configManager.load();
        const config = configManager.get();

        const installPath = path.resolve(process.cwd(), config.installPath);
        
        if (await fs.pathExists(installPath)) {
            logger.info(`Removing installation directory: ${installPath}`);
            await fs.remove(installPath);
            logger.success('Documentation directory cleaned.');
        } else {
            logger.info('Documentation directory does not exist.');
        }

        if (options.cache) {
            const cachePath = config.cache.path;
            if (await fs.pathExists(cachePath)) {
                logger.info(`Removing global cache: ${cachePath}`);
                await fs.remove(cachePath);
                logger.success('Global cache cleaned.');
            } else {
                logger.info('Cache directory does not exist.');
            }
        }

      } catch (error) {
        logger.error(error.message);
        process.exit(1);
      }
    });
}
