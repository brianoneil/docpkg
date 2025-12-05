import { Command } from 'commander';
import { ConfigManager } from '../../core/config.js';
import { LockfileManager } from '../../core/lockfile.js';
import { Indexer } from '../../core/indexer.js';
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

        await logger.task(`Removing ${name}`, async () => {
            // 1. Remove from config
            await configManager.removeSource(name);

            // 2. Remove from lockfile
            const lockfileManager = new LockfileManager();
            await lockfileManager.load();
            if (lockfileManager.getEntry(name)) {
                lockfileManager.removeEntry(name);
                await lockfileManager.save();
            }

            // 3. Remove directory
            const installPath = path.resolve(process.cwd(), config.installPath, name);
            if (await fs.pathExists(installPath)) {
                await fs.remove(installPath);
            }
        });

        // Auto-Index
        const indexer = new Indexer(config);
        await logger.task('Updating index', async () => {
            await indexer.generateIndex();
        });

      } catch (error) {
        logger.error(error.message);
        process.exit(1);
      }
    });
}
