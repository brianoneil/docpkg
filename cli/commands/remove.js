import { Command } from 'commander';
import { ConfigManager } from '../../core/config.js';
import { LockfileManager } from '../../core/lockfile.js';
import { logger } from '../../core/logger.js';
import fs from 'fs-extra';
import path from 'path';

export function removeCommand() {
  return new Command('remove')
    .description('Remove a documentation source')
    .argument('<name>', 'Name of source to remove')
    .action(async (name) => {
      try {
        const configManager = new ConfigManager();
        await configManager.load();
        const config = configManager.get();

        if (!config.sources[name]) {
            logger.error(`Package '${name}' is not in configuration.`);
            return;
        }

        // 1. Remove from config
        await configManager.removeSource(name);
        logger.info(`Removed '${name}' from config.`);

        // 2. Remove from lockfile
        const lockfileManager = new LockfileManager();
        await lockfileManager.load();
        if (lockfileManager.getEntry(name)) {
            lockfileManager.removeEntry(name);
            await lockfileManager.save();
            logger.info(`Removed '${name}' from lockfile.`);
        }

        // 3. Remove directory
        const installPath = path.resolve(process.cwd(), config.installPath, name);
        if (await fs.pathExists(installPath)) {
            await fs.remove(installPath);
            logger.success(`Removed documentation directory: ${installPath}`);
        } else {
            logger.warn(`Directory not found: ${installPath}`);
        }

      } catch (error) {
        logger.error(error.message);
        process.exit(1);
      }
    });
}
