import { Command } from 'commander';
import { ConfigManager } from '../../core/config.js';
import { Installer } from '../../core/installer.js';
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
            logger.info(`Updating ${name}...`);
            
            // TODO: If --latest, we might need to update the config string itself (e.g. change @1.0.0 to @latest)
            // For now, simple re-install handles resolving to whatever the config says (e.g. ^1.0.0 might pick up newer)
            // or if it's a git branch/tag, it fetches new commit.
            
            await installer.install({ [name]: config.sources[name] });
        } else {
            logger.info('Updating all packages...');
            await installer.install();
        }
        
        logger.success('Update complete.');

      } catch (error) {
        logger.error(error.message);
        process.exit(1);
      }
    });
}
