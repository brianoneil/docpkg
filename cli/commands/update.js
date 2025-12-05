import { Command } from 'commander';
import { ConfigManager } from '../../core/config.js';
import { Installer } from '../../core/installer.js';
import { Indexer } from '../../core/indexer.js';
import { logger } from '../../core/logger.js';

export function updateCommand() {
  return new Command('update')
    .description('Update documentation sources')
    .argument('[name]', 'Optional: specific source to update')
    .option('--latest', 'Update to latest version (ignore semver)')
    .action(async (name, options) => {
      try {
        const configManager = new ConfigManager();
        await configManager.load();
        const config = configManager.get();
        
        const installer = new Installer(config);
        
        if (name) {
            if (!config.sources[name]) {
                logger.error(`Package '${name}' is not in configuration.`);
                return;
            }
            await logger.task(`Updating ${name}`, async () => {
                await installer.install({ [name]: config.sources[name] });
            });
        } else {
            await logger.task('Updating all packages', async () => {
                await installer.install();
            });
        }

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
